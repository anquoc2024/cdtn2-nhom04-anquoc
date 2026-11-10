import { useEffect, useState } from 'react'
import { CalendarX2, Trash2 } from 'lucide-react'
import { settingService } from '../../services/settingService'
import { useAuth } from '../../context/AuthContext'
import { dateText, rangeText, todayVN } from '../../lib/format'
import { Alert, Empty, Field, Input, PageLoader, PageTitle, Spinner, StatusBadge, useToast } from '../../components/ui'

// UC17 – Chặn ngày, khoảng ngày hoặc khung giờ không nhận lịch (FR19, BR12)
export default function AdminBlockedPage() {
  const { user } = useAuth()
  const toast = useToast()
  const [items, setItems] = useState(null)
  const [form, setForm] = useState({ startDate: todayVN(), endDate: todayVN(), wholeDay: true, startTime: '13:00', endTime: '17:00', reason: '' })
  const [err, setErr] = useState(null)
  const [busy, setBusy] = useState(false)
  const [affected, setAffected] = useState(null)

  const load = () => settingService.getBlockedSlots().then((r) => setItems(r.data ?? []))
  useEffect(() => { load() }, [])

  async function add(e) {
    e.preventDefault(); setBusy(true); setErr(null)
    const r = await settingService.addBlockedSlot(user.id, form.wholeDay ? { ...form, startTime: '', endTime: '' } : form)
    setBusy(false)
    if (r.error) return setErr(r.error)
    setAffected(r.data.affected); setForm({ ...form, reason: '' }); toast('Đã chặn lịch'); load()
  }
  async function remove(b) {
    if (!window.confirm('Bỏ chặn mục này?')) return
    const r = await settingService.removeBlockedSlot(b.id)
    if (r.error) return toast(r.error.message, 'error')
    toast('Đã bỏ chặn'); load()
  }

  const f = err?.fields ?? {}
  return (
    <>
      <PageTitle eyebrow="Quản trị" title="Chặn ngày, giờ nhận lịch">Dùng khi tiệm nghỉ đột xuất, đi tập huấn… Khách sẽ không thấy các khung giờ bị chặn. Lịch đã đặt không tự hủy – hệ thống liệt kê để bạn liên hệ khách.</PageTitle>
      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <form onSubmit={add} className="card space-y-4 self-start p-6" noValidate>
          <h2 className="text-xl">Thêm mục chặn</h2>
          {err && !err.fields && <Alert>{err.message}</Alert>}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Từ ngày" error={f.startDate}><Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value, endDate: form.endDate < e.target.value ? e.target.value : form.endDate })} /></Field>
            <Field label="Đến ngày" error={f.endDate}><Input type="date" value={form.endDate} min={form.startDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></Field>
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-rose-500" checked={form.wholeDay} onChange={(e) => setForm({ ...form, wholeDay: e.target.checked })} />Chặn cả ngày</label>
          {!form.wholeDay && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Từ giờ"><Input type="time" step={1800} value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} /></Field>
              <Field label="Đến giờ" error={f.endTime}><Input type="time" step={1800} value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} /></Field>
            </div>
          )}
          <Field label="Lý do" required error={f.reason}><Input value={form.reason} error={f.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="VD: Nghỉ lễ, tập huấn" /></Field>
          <button className="btn-primary w-full" disabled={busy}>{busy ? <Spinner className="text-white" /> : 'Chặn lịch'}</button>
        </form>
        <div className="space-y-4">
          {affected?.length > 0 && (
            <Alert tone="warning">
              <p className="font-semibold">Có {affected.length} lịch hẹn trong khoảng vừa chặn – hãy liên hệ khách hoặc hủy lịch:</p>
              <ul className="mt-2 space-y-1">{affected.map((b) => <li key={b.id}>{b.code} · {dateText(b.startAt)} {rangeText(b.startAt, b.endAt)} · {b.customerName} ({b.customerPhone}) <StatusBadge status={b.status} /></li>)}</ul>
            </Alert>
          )}
          {!items ? <PageLoader /> : items.length === 0 ? <Empty icon={CalendarX2} title="Chưa có ngày/giờ bị chặn" /> : (
            <ul className="card divide-y divide-line">
              {items.map((b) => (
                <li key={b.id} className="flex items-center gap-4 px-5 py-4">
                  <div className="flex-1">
                    <p className="font-medium text-plum">{b.startDate === b.endDate ? dateText(b.startDate) : `${dateText(b.startDate)} → ${dateText(b.endDate)}`}</p>
                    <p className="text-sm text-ink-soft">{b.startTime ? `${b.startTime.slice(0, 5)}–${b.endTime.slice(0, 5)}` : 'Cả ngày'} · {b.reason}</p>
                  </div>
                  <button className="btn-ghost text-red-700" onClick={() => remove(b)} aria-label="Bỏ chặn"><Trash2 className="h-4 w-4" /></button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  )
}
