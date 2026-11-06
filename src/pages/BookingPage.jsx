import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useOutletContext, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, Clock3, ImagePlus, LogIn, X } from 'lucide-react'
import { catalogService } from '../services/catalogService'
import { bookingService } from '../services/bookingService'
import { useAuth } from '../context/AuthContext'
import { money, minutes, longDateText } from '../lib/format'
import ServiceChecklist from '../components/booking/ServiceChecklist'
import SlotPicker from '../components/booking/SlotPicker'
import { Alert, Modal, PageLoader, Spinner, Textarea, Field } from '../components/ui'

const DRAFT = 'nailcare-booking-draft'
const STEPS = ['Dịch vụ & mẫu', 'Ngày giờ', 'Xác nhận']
const readDraft = () => { try { return JSON.parse(sessionStorage.getItem(DRAFT)) ?? {} } catch { return {} } }

// MH04 – Đặt lịch (UC05, UC06; FR05, FR06, FR18): dịch vụ → mẫu (tùy chọn) → ngày giờ → đăng nhập → xác nhận
export default function BookingPage() {
  const { user } = useAuth()
  const { store } = useOutletContext() ?? {}
  const [params] = useSearchParams()
  const nav = useNavigate()
  const draft = useMemo(readDraft, [])

  const [services, setServices] = useState(null)
  const [selected, setSelected] = useState(draft.serviceIds ?? [])
  const [design, setDesign] = useState(draft.design ?? null)
  const [date, setDate] = useState(draft.date ?? null)
  const [slot, setSlot] = useState(draft.slot ?? null)
  const [note, setNote] = useState(draft.note ?? '')
  const [step, setStep] = useState(Number(params.get('buoc') ?? draft.step ?? 0))
  const [picker, setPicker] = useState(false)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  // tải dịch vụ; áp dụng ?dichvu= và ?mau= khi đến từ trang khác
  useEffect(() => {
    catalogService.getServices().then((r) => setServices(r.data ?? []))
    const sid = Number(params.get('dichvu'))
    if (sid) setSelected((xs) => (xs.includes(sid) ? xs : [...xs, sid]))
    const did = Number(params.get('mau'))
    if (did) chooseDesign(did)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    sessionStorage.setItem(DRAFT, JSON.stringify({ serviceIds: selected, design, date, slot, note, step }))
  }, [selected, design, date, slot, note, step])

  const chosen = (services ?? []).filter((s) => selected.includes(s.id))
  const total = chosen.reduce((a, s) => a + s.price, 0)
  const rawMinutes = chosen.reduce((a, s) => a + s.durationMinutes, 0)
  const slotMinutes = store?.slotMinutes ?? 30
  const duration = Math.ceil(rawMinutes / slotMinutes) * slotMinutes

  async function chooseDesign(id) {
    const r = await catalogService.getDesign(id)
    if (!r.data) return
    setDesign({ id: r.data.id, name: r.data.name, imageUrl: r.data.imageUrl })
    setSelected((xs) => Array.from(new Set([...xs, ...r.data.services.map((s) => s.id)])))   // dịch vụ đi kèm mẫu
    setSlot(null)
    setPicker(false)
  }

  const toggle = (id) => { setSelected((xs) => (xs.includes(id) ? xs.filter((x) => x !== id) : [...xs, id])); setSlot(null) }
  const go = (n) => { setError(null); setStep(n); window.scrollTo({ top: 0, behavior: 'smooth' }) }

  async function submit() {
    setSaving(true); setError(null)
    const r = await bookingService.createBooking({ serviceIds: selected, designId: design?.id, startAt: slot?.startAt, note })
    setSaving(false)
    if (r.error) {
      setError(r.error)
      if (['SLOT_FULL', 'SLOT_BLOCKED', 'OUT_OF_HOURS'].includes(r.error.code)) { setSlot(null); setReloadKey((k) => k + 1); setStep(1) }
      return
    }
    sessionStorage.removeItem(DRAFT)
    nav('/dat-lich/thanh-cong', { state: { booking: r.data, design } })
  }

  if (!services) return <PageLoader />
  const canNext = step === 0 ? selected.length > 0 : step === 1 ? !!slot : true

  return (
    <div className="container-page pb-28 pt-10 lg:pb-10">
      <div className="mb-8">
        <p className="eyebrow">Đặt lịch</p>
        <h1 className="mt-2 text-3xl sm:text-4xl">Giữ chỗ cho bộ móng mới</h1>
        <ol className="mt-6 flex flex-wrap items-center gap-2 text-sm" aria-label="Các bước">
          {STEPS.map((s, i) => (
            <li key={s} className="flex items-center gap-2">
              <button type="button" disabled={i > step} onClick={() => go(i)}
                className={`flex items-center gap-2 rounded-full px-3 py-1.5 ${i === step ? 'bg-plum text-cream' : i < step ? 'bg-rose-50 text-plum' : 'text-ink-muted'}`}>
                <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold ${i === step ? 'bg-cream text-plum' : i < step ? 'bg-rose-500 text-white' : 'border border-line'}`}>
                  {i < step ? <Check className="h-3 w-3" strokeWidth={3} /> : i + 1}
                </span>{s}
              </button>
              {i < STEPS.length - 1 && <span className="h-px w-6 bg-line" />}
            </li>
          ))}
        </ol>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0">
          {error && <Alert className="mb-5">{error.message}</Alert>}

          {step === 0 && (
            <div className="space-y-8">
              <section className="card p-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h2 className="text-xl">Mẫu nail <span className="font-sans text-sm font-normal text-ink-muted">(không bắt buộc)</span></h2>
                  {!design && <button className="btn-outline btn-sm" onClick={() => setPicker(true)}><ImagePlus className="h-4 w-4" />Chọn mẫu</button>}
                </div>
                {design ? (
                  <div className="flex items-center gap-4 rounded-2xl bg-cream p-3">
                    <img src={design.imageUrl} alt="" className="h-16 w-20 rounded-xl object-cover" />
                    <div className="flex-1"><p className="font-medium text-plum">{design.name}</p><p className="text-xs text-ink-muted">Đã chọn sẵn các dịch vụ đi kèm mẫu</p></div>
                    <button className="btn-outline btn-sm" onClick={() => setPicker(true)}>Đổi</button>
                    <button className="btn-ghost rounded-full p-2" onClick={() => setDesign(null)} aria-label="Bỏ mẫu"><X className="h-4 w-4" /></button>
                  </div>
                ) : <p className="text-sm text-ink-muted">Bạn có thể chọn một mẫu trong thư viện để thợ làm theo, hoặc bỏ qua và trao đổi tại tiệm.</p>}
              </section>
              <section className="card p-6">
                <h2 className="mb-5 text-xl">Dịch vụ <span className="font-sans text-sm font-normal text-ink-muted">(chọn ít nhất 1)</span></h2>
                <ServiceChecklist services={services} selected={selected} onToggle={toggle} />
              </section>
            </div>
          )}

          {step === 1 && (
            <section className="card p-6">
              <h2 className="mb-1 text-xl">Chọn ngày và giờ</h2>
              <p className="mb-6 text-sm text-ink-muted">Lịch hẹn kéo dài khoảng {minutes(duration)}. Chỉ hiện các khung giờ tiệm còn chỗ.</p>
              <SlotPicker date={date} onDate={setDate} value={slot} onChange={setSlot} reloadKey={reloadKey}
                closedWeekdays={store?.closedWeekdays ?? []}
                loadSlots={(d) => bookingService.getFreeSlots(d, selected)} />
            </section>
          )}

          {step === 2 && (
            <section className="card space-y-6 p-6">
              <h2 className="text-xl">Kiểm tra và xác nhận</h2>
              <div className="rounded-2xl bg-cream p-5">
                <p className="font-display text-2xl text-plum">{slot && `${slot.start} – ${slot.end}`}</p>
                <p className="capitalize text-ink-soft">{slot && longDateText(slot.startAt)}</p>
              </div>
              <Field label="Ghi chú cho thợ" hint={`${note.length}/500 ký tự`}>
                <Textarea value={note} maxLength={500} onChange={(e) => setNote(e.target.value)} placeholder="Ví dụ: muốn tông hồng pastel, móng ngắn…" />
              </Field>
              {!user ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-5">
                  <p className="font-semibold text-plum">Đăng nhập để giữ chỗ</p>
                  <p className="mt-1 text-sm text-ink-soft">Lựa chọn của bạn được giữ lại. Sau khi đăng nhập bạn quay lại đúng bước này.</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link to={`/dang-nhap?next=${encodeURIComponent('/dat-lich?buoc=2')}`} className="btn-primary"><LogIn className="h-4 w-4" />Đăng nhập</Link>
                    <Link to={`/dang-ky?next=${encodeURIComponent('/dat-lich?buoc=2')}`} className="btn-outline">Tạo tài khoản</Link>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-ink-soft">
                  Đặt cho <b className="text-plum">{user.fullName}</b> · {user.phone}. Lịch ở trạng thái <b>Chờ xác nhận</b> cho đến khi tiệm duyệt; bạn có thể hủy trước giờ hẹn ít nhất 2 giờ.
                </div>
              )}
            </section>
          )}
        </div>

        {/* ---------------- tóm tắt */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card p-6">
            <h2 className="text-lg">Lịch hẹn của bạn</h2>
            {design && <div className="mt-4 flex items-center gap-3"><img src={design.imageUrl} alt="" className="h-10 w-12 rounded-lg object-cover" /><span className="text-sm">{design.name}</span></div>}
            <ul className="mt-4 space-y-2 text-sm">
              {chosen.length === 0 && <li className="text-ink-muted">Chưa chọn dịch vụ</li>}
              {chosen.map((s) => <li key={s.id} className="flex justify-between gap-3"><span>{s.name}</span><span className="whitespace-nowrap">{money(s.price)}</span></li>)}
            </ul>
            {slot && <p className="mt-4 rounded-xl bg-cream px-3 py-2 text-sm"><span className="capitalize">{longDateText(slot.startAt)}</span>, {slot.start}–{slot.end}</p>}
            <div className="mt-4 space-y-1 border-t border-line pt-4 text-sm">
              <p className="flex justify-between text-ink-muted"><span className="flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" />Thời gian</span><span>{rawMinutes ? minutes(duration) : '—'}</span></p>
              <p className="flex justify-between text-base font-semibold text-plum"><span>Tạm tính</span><span className="font-display text-xl text-rose-600">{money(total)}</span></p>
              <p className="text-xs text-ink-muted">Thanh toán tại tiệm.</p>
            </div>
            <div className="mt-6 flex gap-2">
              {step > 0 && <button className="btn-outline" onClick={() => go(step - 1)} aria-label="Quay lại"><ArrowLeft className="h-4 w-4" /></button>}
              {step < 2 && <button className="btn-primary flex-1" disabled={!canNext} onClick={() => go(step + 1)}>Tiếp tục <ArrowRight className="h-4 w-4" /></button>}
              {step === 2 && <button className="btn-primary flex-1" disabled={!user || saving || !slot} onClick={submit}>{saving ? <Spinner className="text-white" /> : 'Xác nhận đặt lịch'}</button>}
            </div>
          </div>
        </aside>
      </div>

      {/* thanh thao tác cố định trên điện thoại */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center gap-3">
          <div className="flex-1 text-sm"><p className="text-ink-muted">{chosen.length} dịch vụ{rawMinutes ? ` · ${minutes(duration)}` : ''}</p><p className="font-display text-lg text-rose-600">{money(total)}</p></div>
          {step > 0 && <button className="btn-outline" onClick={() => go(step - 1)} aria-label="Quay lại"><ArrowLeft className="h-4 w-4" /></button>}
          {step < 2 && <button className="btn-primary" disabled={!canNext} onClick={() => go(step + 1)}>Tiếp tục <ArrowRight className="h-4 w-4" /></button>}
          {step === 2 && <button className="btn-primary" disabled={!user || saving || !slot} onClick={submit}>{saving ? <Spinner className="text-white" /> : 'Xác nhận'}</button>}
        </div>
      </div>

      <DesignPicker open={picker} onClose={() => setPicker(false)} onPick={chooseDesign} />
    </div>
  )
}

function DesignPicker({ open, onClose, onPick }) {
  const [page, setPage] = useState(1)
  const [data, setData] = useState(null)
  useEffect(() => { if (open) catalogService.getDesigns(null, page).then((r) => setData(r.data)) }, [open, page])
  return (
    <Modal open={open} onClose={onClose} title="Chọn mẫu nail" wide>
      {!data ? <div className="flex justify-center py-10"><Spinner /></div> : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {data.items.map((d) => (
              <button key={d.id} className="group text-left" onClick={() => onPick(d.id)}>
                <img src={d.imageUrl} alt={d.name} className="aspect-[4/3] w-full rounded-xl border border-line object-cover transition group-hover:ring-2 group-hover:ring-rose-300" />
                <p className="mt-1.5 text-sm font-medium text-plum">{d.name}</p>
                {d.referencePrice != null && <p className="text-xs text-ink-muted">từ {money(d.referencePrice)}</p>}
              </button>
            ))}
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <button className="btn-outline btn-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Trước</button>
            <button className="btn-outline btn-sm" disabled={page * data.limit >= data.total} onClick={() => setPage(page + 1)}>Sau</button>
          </div>
        </>
      )}
    </Modal>
  )
}
