import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CalendarPlus, Search, Phone, Store } from 'lucide-react'
import { adminService } from '../../services/adminService'
import { STATUS, addDays, dateText, money, rangeText, todayVN, timeText, longDateText } from '../../lib/format'
import { Alert, Badge, Empty, Field, Input, Modal, PageLoader, PageTitle, Pagination, Select, Spinner, StatusBadge, Textarea, useToast } from '../../components/ui'
import SlotPicker from '../../components/booking/SlotPicker'

const NEXT = {
  pending: [['confirmed', 'Xác nhận', 'btn-primary'], ['rejected', 'Từ chối', 'btn-danger'], ['cancelled', 'Hủy', 'btn-outline']],
  confirmed: [['in_progress', 'Bắt đầu làm', 'btn-primary'], ['cancelled', 'Hủy', 'btn-danger']],
  in_progress: [['completed', 'Hoàn thành', 'btn-primary']],
}

// MH06 – Quản lý lịch hẹn (UC13, UC14, UC20; FR13, FR14, FR22, FR23)
export default function AdminBookingsPage() {
  const toast = useToast()
  const [params, setParams] = useSearchParams()
  const date = params.get('ngay') ?? todayVN()
  const status = params.get('trangthai') ?? ''
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [summary, setSummary] = useState(null)
  const [state, setState] = useState({ loading: true, data: null, error: null })
  const [openId, setOpenId] = useState(null)

  const setParam = (k, v) => { const p = new URLSearchParams(params); v ? p.set(k, v) : p.delete(k); setParams(p); setPage(1) }
  const load = () => {
    setState((s) => ({ ...s, loading: true }))
    adminService.getBookings({ date: date === 'all' ? null : date, status, q, page }).then((r) => setState({ loading: false, data: r.data, error: r.error }))
    adminService.getBookingSummary().then((r) => setSummary(r.data))
  }
  useEffect(load, [date, status, page]) // eslint-disable-line react-hooks/exhaustive-deps

  async function quick(b, to) {
    const r = await adminService.changeStatus(b.id, to)
    if (r.error) return toast(r.error.message, 'error')
    toast(`${b.code}: ${STATUS[to].label}`); load()
  }

  return (
    <>
      <PageTitle eyebrow="Quản trị" title="Lịch hẹn" actions={<Link to="/admin/tao-lich" className="btn-primary"><CalendarPlus className="h-4 w-4" />Tạo lịch cho khách</Link>} />
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[['Lịch hôm nay', summary?.today], ['Chờ xác nhận (tất cả)', summary?.pending, 'pending'], ['Đã xác nhận hôm nay', summary?.confirmedToday], ['Hoàn thành hôm nay', summary?.completedToday]].map(([l, v, s]) => (
          <button key={l} onClick={() => { if (!s) return; const p = new URLSearchParams(params); p.set('trangthai', s); p.set('ngay', 'all'); setParams(p); setPage(1) }} className={`card p-4 text-left ${s ? 'hover:ring-2 hover:ring-rose-200' : 'cursor-default'}`}>
            <p className="text-xs text-ink-muted">{l}</p><p className="mt-1 font-display text-3xl text-plum">{v ?? '–'}</p>
          </button>
        ))}
      </div>

      <div className="card mb-4 flex flex-wrap items-end gap-3 p-4">
        <Field label="Ngày" className="w-44">
          <Input type="date" value={date === 'all' ? '' : date} onChange={(e) => setParam('ngay', e.target.value || 'all')} />
        </Field>
        <div className="flex gap-1 pb-0.5">
          <button className="btn-outline btn-sm" onClick={() => setParam('ngay', todayVN())}>Hôm nay</button>
          <button className="btn-outline btn-sm" onClick={() => setParam('ngay', addDays(todayVN(), 1))}>Ngày mai</button>
          <button className="btn-outline btn-sm" onClick={() => setParam('ngay', 'all')}>Mọi ngày</button>
        </div>
        <Field label="Trạng thái" className="w-44">
          <Select value={status} onChange={(e) => setParam('trangthai', e.target.value)}>
            <option value="">Tất cả</option>
            {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </Select>
        </Field>
        <form className="flex flex-1 items-end gap-2" onSubmit={(e) => { e.preventDefault(); setPage(1); load() }}>
          <Field label="Tìm kiếm" className="flex-1"><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Mã lịch, tên khách, SĐT…" /></Field>
          <button className="btn-dark"><Search className="h-4 w-4" />Lọc</button>
        </form>
      </div>

      <Alert>{state.error?.message}</Alert>
      {state.loading ? <PageLoader /> : !state.data?.items.length ? <Empty title="Không có lịch hẹn phù hợp">Thử đổi ngày hoặc trạng thái.</Empty> : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead className="border-b border-line bg-cream/60"><tr>{['Mã', 'Khách hàng', 'Thời gian', 'Dịch vụ', 'Trạng thái', ''].map((h) => <th key={h} className="table-head">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-line">
              {state.data.items.map((b) => (
                <tr key={b.id} className="hover:bg-cream/50">
                  <td className="table-cell whitespace-nowrap font-mono text-xs">{b.code}</td>
                  <td className="table-cell">
                    <p className="font-medium text-plum">{b.customerName}</p>
                    <p className="flex items-center gap-1 text-xs text-ink-muted"><Phone className="h-3 w-3" />{b.customerPhone}{b.source === 'store' && <Badge tone="gray" className="ml-1"><Store className="h-3 w-3" />Tại tiệm</Badge>}</p>
                  </td>
                  <td className="table-cell whitespace-nowrap">{date === 'all' && <span className="block text-xs text-ink-muted">{dateText(b.startAt)}</span>}{rangeText(b.startAt, b.endAt)}</td>
                  <td className="table-cell max-w-[220px] text-ink-soft">{b.bookingServices.map((s) => s.serviceName).join(', ')}</td>
                  <td className="table-cell"><StatusBadge status={b.status} /></td>
                  <td className="table-cell whitespace-nowrap text-right">
                    {b.status === 'pending' && <button className="btn-primary btn-sm mr-1" onClick={() => quick(b, 'confirmed')}>Xác nhận</button>}
                    <button className="btn-outline btn-sm" onClick={() => setOpenId(b.id)}>Chi tiết</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {state.data && <Pagination page={page} limit={state.data.limit} total={state.data.total} onPage={setPage} />}

      <BookingDetail id={openId} onClose={() => setOpenId(null)} onChanged={load} />
    </>
  )
}

function BookingDetail({ id, onClose, onChanged }) {
  const toast = useToast()
  const [b, setB] = useState(null)
  const [action, setAction] = useState(null)       // { to, label } cần lý do
  const [reason, setReason] = useState('')
  const [err, setErr] = useState(null)
  const [busy, setBusy] = useState(false)
  const [resched, setResched] = useState(false)

  const load = () => adminService.getBooking(id).then((r) => setB(r.data ?? { error: r.error }))
  useEffect(() => { setB(null); setAction(null); setErr(null); if (id) load() }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  async function change(to, why) {
    setBusy(true); setErr(null)
    const r = await adminService.changeStatus(b.id, to, why)
    setBusy(false)
    if (r.error) return setErr(r.error)
    toast(`${b.code}: ${STATUS[to].label}`); setAction(null); setReason(''); load(); onChanged()
  }

  return (
    <Modal open={!!id} onClose={onClose} title={b?.code ?? 'Lịch hẹn'} wide
      footer={b && !b.error && !action && (
        <>
          {['pending', 'confirmed'].includes(b.status) && <button className="btn-outline" onClick={() => setResched(true)}>Dời lịch</button>}
          {(NEXT[b.status] ?? []).map(([to, label, cls]) => (
            <button key={to} className={cls} disabled={busy} onClick={() => (['rejected', 'cancelled'].includes(to) ? setAction({ to, label }) : change(to))}>{label}</button>
          ))}
        </>
      )}>
      {!b ? <div className="flex justify-center py-10"><Spinner /></div> : b.error ? <Alert>{b.error.message}</Alert> : (
        <div className="grid gap-6 text-sm md:grid-cols-2">
          <div className="space-y-4">
            <div className="flex items-center justify-between"><StatusBadge status={b.status} />{b.source === 'store' && <Badge>Tiệm tạo</Badge>}</div>
            <div>
              <p className="font-display text-2xl text-plum">{rangeText(b.startAt, b.endAt)}</p>
              <p className="capitalize text-ink-soft">{longDateText(b.startAt)}</p>
            </div>
            <div className="rounded-xl bg-cream p-3">
              <p className="font-semibold text-plum">{b.customerName}</p>
              <a href={`tel:${b.customerPhone}`} className="text-rose-600">{b.customerPhone}</a>
            </div>
            <ul className="space-y-1">
              {b.bookingServices.map((s) => <li key={s.serviceId} className="flex justify-between"><span>{s.serviceName}</span><span>{money(s.price)}</span></li>)}
              <li className="flex justify-between border-t border-line pt-2 font-semibold"><span>Tổng</span><span>{money(b.totalPrice)}</span></li>
            </ul>
            {b.nailDesigns && <div className="flex items-center gap-3"><img src={b.nailDesigns.imageUrl} alt="" className="h-12 w-16 rounded-lg object-cover" /><span>Mẫu: {b.nailDesigns.name}</span></div>}
            {b.note && <p className="rounded-lg bg-cream px-3 py-2">Ghi chú: {b.note}</p>}
            {b.reason && <p className="rounded-lg bg-red-50 px-3 py-2 text-red-800">Lý do: {b.reason}</p>}
          </div>
          <div>
            <p className="font-semibold text-plum">Lịch sử</p>
            <ol className="mt-2 space-y-2 border-l-2 border-rose-100 pl-4">
              {[...b.bookingStatusLogs].sort((x, y) => new Date(x.changedAt) - new Date(y.changedAt)).map((l, i) => (
                <li key={i}><span className="font-medium">{STATUS[l.toStatus]?.label}</span><span className="text-ink-muted"> · {dateText(l.changedAt)} {timeText(l.changedAt)}</span>{l.reason && <span className="block text-ink-soft">{l.reason}</span>}</li>
              ))}
              {b.bookingReschedules.map((r, i) => <li key={`r${i}`} className="text-ink-soft">Dời từ {dateText(r.oldStartAt)} {timeText(r.oldStartAt)} → {dateText(r.newStartAt)} {timeText(r.newStartAt)}</li>)}
            </ol>
            {action && (
              <div className="mt-6 space-y-3 rounded-2xl border border-line p-4">
                <p className="font-semibold text-plum">{action.label} lịch – lý do (khách sẽ thấy)</p>
                {err && <Alert>{err.message}</Alert>}
                <div className="flex flex-wrap gap-1.5">
                  {(action.to === 'cancelled' ? ['Khách không đến', 'Khách gọi hủy', 'Tiệm nghỉ đột xuất'] : ['Hết thợ trong khung giờ này', 'Tiệm nghỉ đột xuất']).map((x) => (
                    <button key={x} className="chip" onClick={() => setReason(x)}>{x}</button>
                  ))}
                </div>
                <Textarea value={reason} maxLength={300} onChange={(e) => setReason(e.target.value)} placeholder="Nhập lý do" />
                <div className="flex justify-end gap-2">
                  <button className="btn-outline btn-sm" onClick={() => setAction(null)}>Thôi</button>
                  <button className="btn-danger btn-sm" disabled={busy} onClick={() => change(action.to, reason)}>{action.label}</button>
                </div>
              </div>
            )}
            {err && !action && <Alert className="mt-4">{err.message}</Alert>}
          </div>
        </div>
      )}
      {b && !b.error && <RescheduleDialog booking={b} open={resched} onClose={() => setResched(false)} onDone={() => { setResched(false); load(); onChanged(); toast('Đã dời lịch') }} />}
    </Modal>
  )
}

function RescheduleDialog({ booking, open, onClose, onDone }) {
  const [date, setDate] = useState(null)
  const [slot, setSlot] = useState(null)
  const [err, setErr] = useState(null)
  const [busy, setBusy] = useState(false)
  async function submit() {
    setBusy(true); setErr(null)
    const r = await adminService.rescheduleBooking(booking.id, slot.startAt)
    setBusy(false)
    if (r.error) return setErr(r.error)
    onDone()
  }
  return (
    <Modal open={open} onClose={onClose} title={`Dời lịch ${booking.code}`} wide
      footer={<><button className="btn-outline" onClick={onClose}>Đóng</button><button className="btn-primary" disabled={!slot || busy} onClick={submit}>Dời sang giờ đã chọn</button></>}>
      <p className="mb-4 text-sm text-ink-soft">Giờ hiện tại: {dateText(booking.startAt)} {rangeText(booking.startAt, booking.endAt)}. Mã lịch, dịch vụ và giá giữ nguyên (BR15).</p>
      {err && <Alert className="mb-4">{err.message}</Alert>}
      <SlotPicker date={date} onDate={setDate} value={slot} onChange={setSlot} loadSlots={(d) => adminService.getSlotsFor(d, null, booking.id)} />
    </Modal>
  )
}
