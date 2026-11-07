import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarHeart, CalendarClock, Sparkles } from 'lucide-react'
import { bookingService } from '../services/bookingService'
import { useAuth } from '../context/AuthContext'
import { money, longDateText, rangeText, dateText, timeText, STATUS } from '../lib/format'
import { Alert, Badge, Empty, Field, Modal, PageLoader, PageTitle, Spinner, StatusBadge, Textarea, useToast } from '../components/ui'

const REASONS = ['Bận việc đột xuất', 'Muốn đổi sang ngày khác', 'Không còn nhu cầu']
const canCancel = (b) => ['pending', 'confirmed'].includes(b.status) && new Date(b.startAt).getTime() - Date.now() >= 2 * 3600 * 1000

// MH05 – Lịch hẹn của tôi (UC07, UC08; FR07, FR08, FR23)
export default function MyBookingsPage() {
  const { user } = useAuth()
  const toast = useToast()
  const [tab, setTab] = useState('upcoming')
  const [state, setState] = useState({ loading: true, items: [], error: null })
  const [detail, setDetail] = useState(null)
  const [cancel, setCancel] = useState(null)

  const load = () => {
    setState((s) => ({ ...s, loading: true }))
    bookingService.getMyBookings(user.id, tab).then((r) => setState({ loading: false, items: r.data ?? [], error: r.error }))
  }
  useEffect(load, [tab, user.id]) // eslint-disable-line react-hooks/exhaustive-deps

  async function openDetail(b) {
    setDetail({ loading: true })
    const r = await bookingService.getMyBooking(b.id)
    setDetail(r.data ?? { error: r.error })
    if (b.isUpdated) setState((s) => ({ ...s, items: s.items.map((x) => (x.id === b.id ? { ...x, isUpdated: false } : x)) }))
  }

  return (
    <div className="container-page py-12">
      <PageTitle eyebrow="Tài khoản" title="Lịch hẹn của tôi" actions={<Link to="/dat-lich" className="btn-primary"><CalendarHeart className="h-4 w-4" />Đặt lịch mới</Link>} />
      <div className="mb-6 inline-flex rounded-full border border-line bg-white p-1">
        {[['upcoming', 'Sắp tới'], ['history', 'Lịch sử']].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={`rounded-full px-5 py-2 text-sm ${tab === k ? 'bg-plum font-semibold text-cream' : 'text-ink-soft'}`}>{l}</button>
        ))}
      </div>
      <Alert>{state.error?.message}</Alert>
      {state.loading ? <PageLoader /> : state.items.length === 0 ? (
        <Empty icon={CalendarClock} title={tab === 'upcoming' ? 'Chưa có lịch hẹn sắp tới' : 'Chưa có lịch sử'} action={<Link to="/dat-lich" className="btn-primary">Đặt lịch</Link>}>
          {tab === 'upcoming' ? 'Đặt lịch để giữ chỗ trước khi đến tiệm.' : 'Các lịch đã hoàn thành, đã hủy hoặc bị từ chối sẽ hiện ở đây.'}
        </Empty>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {state.items.map((b) => (
            <article key={b.id} className={`card flex flex-col p-5 ${b.isUpdated ? 'ring-2 ring-rose-300' : ''}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-xs text-ink-muted">{b.code}</p>
                  <p className="mt-1 font-display text-xl capitalize text-plum">{longDateText(b.startAt)}</p>
                  <p className="text-ink-soft">{rangeText(b.startAt, b.endAt)}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <StatusBadge status={b.status} />
                  {b.isUpdated && <Badge tone="rose"><Sparkles className="h-3 w-3" />Mới cập nhật</Badge>}
                </div>
              </div>
              <p className="mt-3 text-sm text-ink-soft">{b.bookingServices.map((s) => s.serviceName).join(', ')}{b.nailDesigns ? ` · Mẫu: ${b.nailDesigns.name}` : ''}</p>
              {b.reason && ['cancelled', 'rejected'].includes(b.status) && <p className="mt-2 rounded-lg bg-cream px-3 py-2 text-sm text-ink-soft">Lý do: {b.reason}</p>}
              <div className="mt-auto flex items-center justify-between pt-4">
                <span className="font-semibold text-plum">{money(b.totalPrice)}</span>
                <div className="flex gap-2">
                  {canCancel(b) && <button className="btn-danger btn-sm" onClick={() => setCancel(b)}>Hủy lịch</button>}
                  <button className="btn-outline btn-sm" onClick={() => openDetail(b)}>Chi tiết</button>
                </div>
              </div>
              {['pending', 'confirmed'].includes(b.status) && !canCancel(b) && <p className="mt-2 text-xs text-ink-muted">Còn dưới 2 giờ nên không hủy online được – vui lòng gọi tiệm.</p>}
            </article>
          ))}
        </div>
      )}

      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.code ?? 'Chi tiết lịch hẹn'}>
        {detail?.loading ? <div className="flex justify-center py-8"><Spinner /></div> : detail?.error ? <Alert>{detail.error.message}</Alert> : detail && (
          <div className="space-y-5 text-sm">
            <div className="flex items-center justify-between"><span className="capitalize text-plum">{longDateText(detail.startAt)} · {rangeText(detail.startAt, detail.endAt)}</span><StatusBadge status={detail.status} /></div>
            <ul className="space-y-1">
              {detail.bookingServices.map((s) => <li key={s.serviceId} className="flex justify-between"><span>{s.serviceName}</span><span>{money(s.price)}</span></li>)}
              <li className="flex justify-between border-t border-line pt-2 font-semibold"><span>Tổng</span><span>{money(detail.totalPrice)}</span></li>
            </ul>
            {detail.note && <p className="rounded-lg bg-cream px-3 py-2">Ghi chú: {detail.note}</p>}
            {detail.bookingReschedules?.length > 0 && (
              <div>
                <p className="font-semibold text-plum">Đã dời lịch</p>
                {detail.bookingReschedules.map((r, i) => <p key={i} className="text-ink-soft">Từ {dateText(r.oldStartAt)} {timeText(r.oldStartAt)} sang {dateText(r.newStartAt)} {timeText(r.newStartAt)}</p>)}
              </div>
            )}
            <div>
              <p className="font-semibold text-plum">Lịch sử trạng thái</p>
              <ol className="mt-2 space-y-2 border-l-2 border-rose-100 pl-4">
                {[...(detail.bookingStatusLogs ?? [])].sort((a, b) => new Date(a.changedAt) - new Date(b.changedAt)).map((l, i) => (
                  <li key={i}><span className="font-medium">{STATUS[l.toStatus]?.label}</span><span className="text-ink-muted"> · {dateText(l.changedAt)} {timeText(l.changedAt)}</span>{l.reason && <span className="block text-ink-soft">{l.reason}</span>}</li>
                ))}
              </ol>
            </div>
          </div>
        )}
      </Modal>

      <CancelDialog booking={cancel} onClose={() => setCancel(null)} onDone={() => { setCancel(null); toast('Đã hủy lịch hẹn'); load() }} />
    </div>
  )
}

function CancelDialog({ booking, onClose, onDone }) {
  const [reason, setReason] = useState(REASONS[0])
  const [other, setOther] = useState('')
  const [err, setErr] = useState(null)
  const [busy, setBusy] = useState(false)
  useEffect(() => { setReason(REASONS[0]); setOther(''); setErr(null) }, [booking])
  async function submit() {
    setBusy(true)
    const r = await bookingService.cancelMyBooking(booking.id, reason === 'other' ? other : reason)
    setBusy(false)
    if (r.error) return setErr(r.error)
    onDone()
  }
  return (
    <Modal open={!!booking} onClose={onClose} title={`Hủy lịch ${booking?.code ?? ''}?`}
      footer={<><button className="btn-outline" onClick={onClose}>Giữ lịch</button><button className="btn-primary bg-red-700 hover:bg-red-800" disabled={busy} onClick={submit}>{busy ? <Spinner className="text-white" /> : 'Xác nhận hủy'}</button></>}>
      <div className="space-y-3 text-sm">
        {err && <Alert>{err.fields?.reason ?? err.message}</Alert>}
        <p className="text-ink-soft">Lý do hủy (tiệm sẽ thấy lý do này):</p>
        {[...REASONS, 'other'].map((r) => (
          <label key={r} className="flex items-center gap-2"><input type="radio" name="reason" checked={reason === r} onChange={() => setReason(r)} className="accent-rose-500" />{r === 'other' ? 'Lý do khác' : r}</label>
        ))}
        {reason === 'other' && <Field><Textarea maxLength={300} value={other} onChange={(e) => setOther(e.target.value)} placeholder="Nhập lý do" /></Field>}
      </div>
    </Modal>
  )
}
