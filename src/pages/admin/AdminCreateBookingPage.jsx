import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, UserCheck } from 'lucide-react'
import { adminService } from '../../services/adminService'
import { catalogService } from '../../services/catalogService'
import { money, minutes, todayVN } from '../../lib/format'
import ServiceChecklist from '../../components/booking/ServiceChecklist'
import SlotPicker from '../../components/booking/SlotPicker'
import { Alert, Field, Input, PageLoader, PageTitle, Select, Spinner, Textarea, useToast } from '../../components/ui'

// UC18 – Tạo lịch hẹn cho khách gọi điện / đến trực tiếp (FR20, BR13): trạng thái Đã xác nhận ngay
export default function AdminCreateBookingPage() {
  const toast = useToast()
  const nav = useNavigate()
  const [services, setServices] = useState(null)
  const [designs, setDesigns] = useState([])
  const [settings, setSettings] = useState(null)
  const [phone, setPhone] = useState('')
  const [found, setFound] = useState(undefined)            // undefined: chưa tra; null: không có tài khoản
  const [name, setName] = useState('')
  const [selected, setSelected] = useState([])
  const [designId, setDesignId] = useState('')
  const [date, setDate] = useState(todayVN())
  const [slot, setSlot] = useState(null)
  const [note, setNote] = useState('')
  const [err, setErr] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    catalogService.getServices().then((r) => setServices(r.data ?? []))
    adminService.getAllDesigns().then((r) => setDesigns((r.data ?? []).filter((d) => d.isActive)))
    catalogService.getStoreInfo().then((r) => setSettings(r.data))
  }, [])

  async function lookup() {
    setFound(undefined)
    const r = await adminService.findCustomerByPhone(phone)
    setFound(r.data ?? null)
    if (r.data) setName(r.data.fullName)
  }

  async function pickDesign(id) {
    setDesignId(id)
    if (!id) return
    const r = await catalogService.getDesign(Number(id))
    if (r.data) setSelected((xs) => Array.from(new Set([...xs, ...r.data.services.map((s) => s.id)])))
    setSlot(null)
  }

  async function submit() {
    setBusy(true); setErr(null)
    const r = await adminService.createBookingForCustomer({
      customer: { userId: found?.id ?? null, fullName: name, phone },
      serviceIds: selected, designId: designId ? Number(designId) : null, startAt: slot?.startAt, note,
    })
    setBusy(false)
    if (r.error) { setErr(r.error); if (r.error.code === 'SLOT_FULL') setSlot(null); return }
    toast(`Đã tạo lịch ${r.data.code}`)
    nav(`/admin/lich-hen?ngay=${date}`)
  }

  if (!services) return <PageLoader />
  const chosen = services.filter((s) => selected.includes(s.id))
  const raw = chosen.reduce((a, s) => a + s.durationMinutes, 0)
  const f = err?.fields ?? {}

  return (
    <>
      <PageTitle eyebrow="Quản trị" title="Tạo lịch cho khách">Dùng cho khách gọi điện hoặc đến trực tiếp. Lịch được xác nhận ngay; vẫn kiểm tra giờ mở cửa, số chỗ và ngày bị chặn.</PageTitle>
      {err && !err.fields && <Alert className="mb-5">{err.message}</Alert>}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <section className="card space-y-4 p-6">
            <h2 className="text-xl">1. Khách hàng</h2>
            <div className="flex items-end gap-2">
              <Field label="Số điện thoại" required error={f.phone} className="flex-1"><Input value={phone} inputMode="numeric" error={f.phone} onChange={(e) => { setPhone(e.target.value); setFound(undefined) }} placeholder="09xxxxxxxx" /></Field>
              <button type="button" className="btn-outline mb-0.5" onClick={lookup} disabled={phone.length < 10}><Search className="h-4 w-4" />Tra tài khoản</button>
            </div>
            {found && <Alert tone="success"><span className="flex items-center gap-1.5"><UserCheck className="h-4 w-4" />Khách đã có tài khoản: {found.fullName} ({found.email}). Lịch sẽ hiện trong tài khoản của khách.</span></Alert>}
            {found === null && <p className="text-sm text-ink-muted">Chưa có tài khoản với SĐT này – lịch được lưu theo tên và SĐT.</p>}
            <Field label="Họ và tên khách" required error={f.fullName}><Input value={name} error={f.fullName} onChange={(e) => setName(e.target.value)} /></Field>
          </section>
          <section className="card space-y-4 p-6">
            <h2 className="text-xl">2. Dịch vụ</h2>
            {f.services && <Alert>{f.services}</Alert>}
            <Field label="Mẫu nail (không bắt buộc)">
              <Select value={designId} onChange={(e) => pickDesign(e.target.value)}>
                <option value="">Không chọn mẫu</option>
                {designs.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </Select>
            </Field>
            <ServiceChecklist services={services} selected={selected} compact onToggle={(id) => { setSelected((xs) => (xs.includes(id) ? xs.filter((x) => x !== id) : [...xs, id])); setSlot(null) }} />
          </section>
          <section className="card p-6">
            <h2 className="mb-4 text-xl">3. Ngày giờ</h2>
            {selected.length === 0 ? <p className="text-sm text-ink-muted">Chọn dịch vụ trước để tính khung giờ còn trống.</p> : (
              <SlotPicker key={selected.join(',')} date={date} onDate={setDate} value={slot} onChange={setSlot} closedWeekdays={settings?.closedWeekdays ?? []}
                loadSlots={(d) => adminService.getSlotsFor(d, selected)} />
            )}
          </section>
        </div>
        <aside className="lg:sticky lg:top-8 lg:self-start">
          <div className="card space-y-4 p-6">
            <h2 className="text-lg">Tóm tắt</h2>
            <ul className="space-y-1 text-sm">{chosen.map((s) => <li key={s.id} className="flex justify-between"><span>{s.name}</span><span>{money(s.price)}</span></li>)}</ul>
            <p className="flex justify-between border-t border-line pt-3 text-sm"><span className="text-ink-muted">Thời lượng</span><span>{raw ? minutes(Math.ceil(raw / 30) * 30) : '—'}</span></p>
            <p className="flex justify-between font-semibold text-plum"><span>Tổng</span><span>{money(chosen.reduce((a, s) => a + s.price, 0))}</span></p>
            {slot && <p className="rounded-xl bg-cream px-3 py-2 text-sm">{date} · {slot.start}–{slot.end}</p>}
            <Field label="Ghi chú"><Textarea value={note} maxLength={500} onChange={(e) => setNote(e.target.value)} placeholder="VD: khách gọi điện, đến trễ 10 phút" /></Field>
            <button className="btn-primary w-full" disabled={busy || !slot} onClick={submit}>{busy ? <Spinner className="text-white" /> : 'Tạo lịch (đã xác nhận)'}</button>
          </div>
        </aside>
      </div>
    </>
  )
}
