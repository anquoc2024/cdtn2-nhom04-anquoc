import { useEffect, useRef, useState } from 'react'
import { ImageUp } from 'lucide-react'
import { settingService } from '../../services/settingService'
import { adminService } from '../../services/adminService'
import { useAuth } from '../../context/AuthContext'
import { Alert, Field, Input, PageLoader, PageTitle, Spinner, Textarea, useToast } from '../../components/ui'

const WD = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

// MH11 – Thông tin và cấu hình cửa hàng (UC16, FR16)
export default function AdminSettingsPage() {
  const { user } = useAuth()
  const toast = useToast()
  const [d, setD] = useState(null)
  const [err, setErr] = useState(null)
  const [busy, setBusy] = useState('')
  const file = useRef(null)

  useEffect(() => {
    settingService.getSettings().then((r) => {
      if (r.error) return setErr(r.error)
      setD({ ...r.data, openTime: r.data.openTime.slice(0, 5), closeTime: r.data.closeTime.slice(0, 5), closedWeekdays: r.data.closedWeekdays ?? [] })
    })
  }, [])

  if (!d) return err ? <Alert>{err.message}</Alert> : <PageLoader />
  const set = (k) => (e) => setD({ ...d, [k]: e.target.value })
  const f = err?.fields ?? {}

  async function save(e) {
    e.preventDefault(); setBusy('save'); setErr(null)
    const r = await settingService.updateSettings(user.id, d)
    setBusy('')
    if (r.error) return setErr(r.error)
    toast('Đã lưu cấu hình cửa hàng')
  }
  async function upload(e) {
    const fl = e.target.files?.[0]
    if (!fl) return
    setBusy('img')
    const r = await adminService.uploadImage(fl)
    setBusy('')
    if (r.error) return setErr(r.error)
    setD((x) => ({ ...x, bannerUrl: r.data }))
  }

  return (
    <>
      <PageTitle eyebrow="Quản trị" title="Thông tin cửa hàng">Giờ mở cửa và số chỗ mới áp dụng cho các lịch đặt sau khi lưu; lịch đã đặt giữ nguyên.</PageTitle>
      <form onSubmit={save} className="grid gap-6 lg:grid-cols-2" noValidate>
        <section className="card space-y-4 p-6">
          <h2 className="text-xl">Thông tin liên hệ</h2>
          {err && !err.fields && <Alert>{err.message}</Alert>}
          <Field label="Tên cửa hàng" required error={f.storeName}><Input value={d.storeName} onChange={set('storeName')} /></Field>
          <Field label="Địa chỉ" required error={f.address}><Input value={d.address} onChange={set('address')} /></Field>
          <Field label="Số điện thoại" required error={f.phone}><Input value={d.phone} onChange={set('phone')} /></Field>
          <Field label="Giới thiệu (hiện ở trang chủ)"><Textarea value={d.intro ?? ''} onChange={set('intro')} /></Field>
          <div>
            <p className="label">Ảnh banner trang chủ</p>
            <button type="button" onClick={() => file.current?.click()} className="flex h-36 w-full items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-line bg-cream">
              {busy === 'img' ? <Spinner /> : d.bannerUrl ? <img src={d.bannerUrl} alt="" className="h-full w-full object-cover" /> : <span className="flex items-center gap-2 text-sm text-ink-muted"><ImageUp className="h-5 w-5" />Tải ảnh (JPG, PNG, WebP ≤ 5 MB)</span>}
            </button>
            <input ref={file} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={upload} />
            {f.image && <p className="mt-1 text-xs text-red-600">{f.image}</p>}
          </div>
        </section>
        <section className="card space-y-4 self-start p-6">
          <h2 className="text-xl">Nhận lịch</h2>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Mở cửa"><Input type="time" step={1800} value={d.openTime} onChange={set('openTime')} /></Field>
            <Field label="Đóng cửa" error={f.closeTime}><Input type="time" step={1800} value={d.closeTime} onChange={set('closeTime')} /></Field>
          </div>
          <Field label="Số khách phục vụ cùng lúc (mỗi khung giờ)" error={f.capacityPerSlot} hint="Từ 1 đến 20 – thường bằng số thợ đang làm"><Input type="number" min={1} max={20} value={d.capacityPerSlot} onChange={set('capacityPerSlot')} /></Field>
          <div>
            <p className="label">Ngày nghỉ trong tuần</p>
            <div className="flex flex-wrap gap-1.5">
              {WD.map((w, i) => {
                const on = d.closedWeekdays.includes(i)
                return <button type="button" key={w} onClick={() => setD({ ...d, closedWeekdays: on ? d.closedWeekdays.filter((x) => x !== i) : [...d.closedWeekdays, i] })} className={`chip ${on ? 'chip-on' : ''}`}>{w}</button>
              })}
            </div>
          </div>
          <p className="text-xs text-ink-muted">Khung giờ cách nhau {d.slotMinutes} phút. Ngày nghỉ đột xuất: dùng mục “Chặn ngày, giờ”.</p>
          <button className="btn-primary w-full" disabled={busy === 'save'}>{busy === 'save' ? <Spinner className="text-white" /> : 'Lưu cấu hình'}</button>
        </section>
      </form>
    </>
  )
}
