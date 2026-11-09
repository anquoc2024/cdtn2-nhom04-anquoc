import { useEffect, useRef, useState } from 'react'
import { ImageUp, Plus } from 'lucide-react'
import { adminService } from '../../services/adminService'
import { money } from '../../lib/format'
import { Alert, Badge, Field, Input, Modal, PageLoader, PageTitle, Select, Spinner, Textarea, useToast } from '../../components/ui'
import CategoryManager from './CategoryManager'

const EMPTY = { name: '', categoryId: '', imageUrl: '', referencePrice: '', description: '', isActive: true, serviceIds: [] }

// MH08 – Mẫu nail (UC12; FR12, BR10)
export default function AdminDesignsPage() {
  const toast = useToast()
  const [cats, setCats] = useState([])
  const [services, setServices] = useState([])
  const [items, setItems] = useState(null)
  const [error, setError] = useState(null)
  const [cat, setCat] = useState('')
  const [form, setForm] = useState(null)

  const load = () => {
    adminService.getDesignCategories().then((r) => setCats(r.data ?? []))
    adminService.getAllServices().then((r) => setServices((r.data ?? []).filter((s) => s.isActive)))
    adminService.getAllDesigns().then((r) => { setItems(r.data ?? []); setError(r.error) })
  }
  useEffect(load, [])

  async function toggle(d) {
    const r = await adminService.setDesignActive(d.id, !d.isActive)
    if (r.error) return toast(r.error.message, 'error')
    toast(d.isActive ? 'Đã ẩn mẫu' : 'Đã hiện mẫu'); load()
  }
  async function remove(d) {
    if (!window.confirm(`Xóa mẫu “${d.name}”? Nếu mẫu đã được chọn trong lịch hẹn, hệ thống sẽ chỉ ẩn.`)) return
    const r = await adminService.deleteDesign(d.id)
    if (r.error) return toast(r.error.message, 'error')
    toast(r.data.hidden ? 'Mẫu đã có lịch hẹn nên chỉ được ẩn' : 'Đã xóa mẫu'); load()
  }

  if (!items) return <PageLoader />
  const shown = cat ? items.filter((d) => d.categoryId === Number(cat)) : items
  return (
    <>
      <PageTitle eyebrow="Quản trị" title="Mẫu nail" actions={<button className="btn-primary" onClick={() => setForm({ ...EMPTY, categoryId: cats[0]?.id ?? '' })}><Plus className="h-4 w-4" />Thêm mẫu</button>} />
      <Alert>{error?.message}</Alert>
      <CategoryManager label="Danh mục mẫu (danh mục còn mẫu thì không xóa được)" items={cats} onSave={adminService.saveDesignCategory} onDelete={adminService.deleteDesignCategory} onChanged={load} />
      <div className="mb-4 w-56"><Select value={cat} onChange={(e) => setCat(e.target.value)}><option value="">Tất cả danh mục</option>{cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
        {shown.map((d) => (
          <div key={d.id} className={`card overflow-hidden ${d.isActive ? '' : 'opacity-60'}`}>
            <img src={d.imageUrl} alt={d.name} className="aspect-[4/3] w-full object-cover" />
            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium text-plum">{d.name}</p>
                {d.isActive ? <Badge tone="green">Hiện</Badge> : <Badge>Ẩn</Badge>}
              </div>
              <p className="text-xs text-ink-muted">{d.designCategories?.name}{d.referencePrice != null ? ` · từ ${money(d.referencePrice)}` : ''}</p>
              <div className="mt-3 flex flex-wrap gap-1">
                <button className="btn-ghost btn-sm" onClick={() => setForm({ id: d.id, name: d.name, categoryId: d.categoryId, imageUrl: d.imageUrl, referencePrice: d.referencePrice ?? '', description: d.description ?? '', isActive: d.isActive, serviceIds: d.designServices.map((x) => x.serviceId) })}>Sửa</button>
                <button className="btn-ghost btn-sm" onClick={() => toggle(d)}>{d.isActive ? 'Ẩn' : 'Hiện'}</button>
                <button className="btn-ghost btn-sm text-red-700" onClick={() => remove(d)}>Xóa</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <DesignForm form={form} cats={cats} services={services} onClose={() => setForm(null)} onSaved={() => { setForm(null); load(); toast('Đã lưu mẫu') }} />
    </>
  )
}

function DesignForm({ form, cats, services, onClose, onSaved }) {
  const [d, setD] = useState(form)
  const [err, setErr] = useState(null)
  const [busy, setBusy] = useState('')
  const file = useRef(null)
  useEffect(() => { setD(form); setErr(null) }, [form])
  if (!form || !d) return null
  const set = (k) => (e) => setD({ ...d, [k]: e.target.value })
  const toggle = (id) => setD({ ...d, serviceIds: d.serviceIds.includes(id) ? d.serviceIds.filter((x) => x !== id) : [...d.serviceIds, id] })

  async function upload(e) {
    const fl = e.target.files?.[0]
    if (!fl) return
    setBusy('img')
    const r = await adminService.uploadImage(fl)
    setBusy('')
    if (r.error) return setErr(r.error)
    setD((x) => ({ ...x, imageUrl: r.data }))
  }
  async function save() {
    setBusy('save')
    const r = await adminService.saveDesign(d.id, d, d.serviceIds)
    setBusy('')
    if (r.error) return setErr(r.error)
    onSaved()
  }
  const f = err?.fields ?? {}
  return (
    <Modal open onClose={onClose} title={d.id ? 'Sửa mẫu nail' : 'Thêm mẫu nail'} wide
      footer={<><button className="btn-outline" onClick={onClose}>Hủy</button><button className="btn-primary" disabled={!!busy} onClick={save}>{busy === 'save' ? <Spinner className="text-white" /> : 'Lưu'}</button></>}>
      <div className="grid gap-6 md:grid-cols-[240px_1fr]">
        <div>
          <button type="button" onClick={() => file.current?.click()} className={`flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed ${f.imageUrl || f.image ? 'border-red-300' : 'border-line'} bg-cream`}>
            {busy === 'img' ? <Spinner /> : d.imageUrl ? <img src={d.imageUrl} alt="" className="h-full w-full object-cover" /> : <span className="flex flex-col items-center gap-1 text-sm text-ink-muted"><ImageUp className="h-6 w-6" />Tải ảnh lên</span>}
          </button>
          <input ref={file} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={upload} />
          <p className={`mt-2 text-xs ${f.imageUrl || f.image ? 'text-red-600' : 'text-ink-muted'}`}>{f.image ?? f.imageUrl ?? 'JPG, PNG, WebP – tối đa 5 MB'}</p>
        </div>
        <div className="space-y-4">
          {err && !err.fields && <Alert>{err.message}</Alert>}
          <Field label="Tên mẫu" required error={f.name}><Input value={d.name} error={f.name} onChange={set('name')} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Danh mục" required error={f.categoryId}><Select value={d.categoryId} onChange={set('categoryId')}>{cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></Field>
            <Field label="Giá tham khảo (VNĐ)" error={f.referencePrice}><Input type="number" step={1000} min={0} value={d.referencePrice} onChange={set('referencePrice')} /></Field>
          </div>
          <Field label="Mô tả"><Textarea value={d.description} onChange={set('description')} /></Field>
          <div>
            <p className="label">Dịch vụ đi kèm (tự chọn khi khách đặt theo mẫu)</p>
            <div className="flex flex-wrap gap-1.5">
              {services.map((s) => <button type="button" key={s.id} onClick={() => toggle(s.id)} className={`chip text-xs ${d.serviceIds.includes(s.id) ? 'chip-on' : ''}`}>{s.name}</button>)}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}
