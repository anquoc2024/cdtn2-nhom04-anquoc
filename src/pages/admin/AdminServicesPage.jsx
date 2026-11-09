import { useEffect, useState } from 'react'
import { History, Plus } from 'lucide-react'
import { adminService } from '../../services/adminService'
import { dateText, money, minutes, timeText } from '../../lib/format'
import { Alert, Badge, Field, Input, Modal, PageLoader, PageTitle, Select, Spinner, Textarea, useToast } from '../../components/ui'
import CategoryManager from './CategoryManager'

const EMPTY = { name: '', categoryId: '', durationMinutes: 30, price: '', description: '', isActive: true }

// MH07 – Dịch vụ và giá (UC10, UC11; FR10, FR11, BR10)
export default function AdminServicesPage() {
  const toast = useToast()
  const [cats, setCats] = useState([])
  const [items, setItems] = useState(null)
  const [error, setError] = useState(null)
  const [form, setForm] = useState(null)            // { id?, ...EMPTY }
  const [price, setPrice] = useState(null)          // dịch vụ đang đổi giá

  const load = () => {
    adminService.getServiceCategories().then((r) => setCats(r.data ?? []))
    adminService.getAllServices().then((r) => { setItems(r.data ?? []); setError(r.error) })
  }
  useEffect(load, [])

  async function toggle(s) {
    const r = await adminService.setServiceActive(s.id, !s.isActive)
    if (r.error) return toast(r.error.message, 'error')
    toast(s.isActive ? 'Đã ẩn dịch vụ' : 'Đã hiện dịch vụ'); load()
  }
  async function remove(s) {
    if (!window.confirm(`Xóa dịch vụ “${s.name}”? Nếu dịch vụ đã có trong lịch hẹn, hệ thống sẽ chỉ ẩn.`)) return
    const r = await adminService.deleteService(s.id)
    if (r.error) return toast(r.error.message, 'error')
    toast(r.data.hidden ? 'Dịch vụ đã có lịch hẹn nên chỉ được ẩn' : 'Đã xóa dịch vụ'); load()
  }

  if (!items) return <PageLoader />
  return (
    <>
      <PageTitle eyebrow="Quản trị" title="Dịch vụ & giá" actions={<button className="btn-primary" onClick={() => setForm({ ...EMPTY, categoryId: cats[0]?.id ?? '' })}><Plus className="h-4 w-4" />Thêm dịch vụ</button>} />
      <Alert>{error?.message}</Alert>
      <CategoryManager label="Danh mục dịch vụ" items={cats} onSave={adminService.saveServiceCategory} onDelete={adminService.deleteServiceCategory} onChanged={load} />
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[720px]">
          <thead className="border-b border-line bg-cream/60"><tr>{['Dịch vụ', 'Danh mục', 'Thời lượng', 'Giá', 'Trạng thái', ''].map((h) => <th key={h} className="table-head">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-line">
            {items.map((s) => (
              <tr key={s.id} className={s.isActive ? '' : 'bg-cream/50 text-ink-muted'}>
                <td className="table-cell"><p className="font-medium text-plum">{s.name}</p><p className="line-clamp-1 text-xs text-ink-muted">{s.description}</p></td>
                <td className="table-cell">{s.serviceCategories?.name}</td>
                <td className="table-cell whitespace-nowrap">{minutes(s.durationMinutes)}</td>
                <td className="table-cell whitespace-nowrap font-semibold">{money(s.price)}</td>
                <td className="table-cell">{s.isActive ? <Badge tone="green">Đang hiện</Badge> : <Badge>Đang ẩn</Badge>}</td>
                <td className="table-cell whitespace-nowrap text-right">
                  <button className="btn-ghost btn-sm" onClick={() => setForm({ id: s.id, name: s.name, categoryId: s.categoryId, durationMinutes: s.durationMinutes, price: s.price, description: s.description ?? '', isActive: s.isActive })}>Sửa</button>
                  <button className="btn-ghost btn-sm" onClick={() => setPrice(s)}>Giá</button>
                  <button className="btn-ghost btn-sm" onClick={() => toggle(s)}>{s.isActive ? 'Ẩn' : 'Hiện'}</button>
                  <button className="btn-ghost btn-sm text-red-700" onClick={() => remove(s)}>Xóa</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ServiceForm form={form} cats={cats} onClose={() => setForm(null)} onSaved={() => { setForm(null); load(); toast('Đã lưu dịch vụ') }} />
      <PriceDialog service={price} onClose={() => setPrice(null)} onSaved={() => { setPrice(null); load(); toast('Đã cập nhật giá') }} />
    </>
  )
}

function ServiceForm({ form, cats, onClose, onSaved }) {
  const [d, setD] = useState(form)
  const [err, setErr] = useState(null)
  const [busy, setBusy] = useState(false)
  useEffect(() => { setD(form); setErr(null) }, [form])
  if (!form || !d) return null
  const set = (k) => (e) => setD({ ...d, [k]: e.target.value })
  async function save() {
    setBusy(true)
    const r = d.id ? await adminService.updateService(d.id, d) : await adminService.createService(d)
    setBusy(false)
    if (r.error) return setErr(r.error)
    onSaved()
  }
  const f = err?.fields ?? {}
  return (
    <Modal open onClose={onClose} title={d.id ? 'Sửa dịch vụ' : 'Thêm dịch vụ'}
      footer={<><button className="btn-outline" onClick={onClose}>Hủy</button><button className="btn-primary" disabled={busy} onClick={save}>{busy ? <Spinner className="text-white" /> : 'Lưu'}</button></>}>
      <div className="space-y-4">
        {err && !err.fields && <Alert>{err.message}</Alert>}
        <Field label="Tên dịch vụ" required error={f.name}><Input value={d.name} error={f.name} onChange={set('name')} /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Danh mục" required error={f.categoryId}><Select value={d.categoryId} onChange={set('categoryId')}>{cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></Field>
          <Field label="Thời lượng (phút)" required error={f.durationMinutes} hint="15–240, bội số 15"><Input type="number" step={15} min={15} max={240} value={d.durationMinutes} error={f.durationMinutes} onChange={set('durationMinutes')} /></Field>
        </div>
        {!d.id && <Field label="Giá (VNĐ)" required error={f.price} hint="Bội số 1.000"><Input type="number" step={1000} min={1000} value={d.price} error={f.price} onChange={set('price')} /></Field>}
        {d.id && <p className="text-xs text-ink-muted">Giá được đổi bằng nút “Giá” để lưu lịch sử giá.</p>}
        <Field label="Mô tả"><Textarea value={d.description} onChange={set('description')} /></Field>
      </div>
    </Modal>
  )
}

function PriceDialog({ service, onClose, onSaved }) {
  const [value, setValue] = useState('')
  const [history, setHistory] = useState(null)
  const [err, setErr] = useState(null)
  useEffect(() => {
    setErr(null); setHistory(null)
    if (service) { setValue(service.price); adminService.getPriceHistory(service.id).then((r) => setHistory(r.data ?? [])) }
  }, [service])
  if (!service) return null
  async function save() {
    const r = await adminService.updatePrice(service.id, service.price, value)
    if (r.error) return setErr(r.error)
    onSaved()
  }
  return (
    <Modal open onClose={onClose} title={`Giá – ${service.name}`}
      footer={<><button className="btn-outline" onClick={onClose}>Đóng</button><button className="btn-primary" onClick={save} disabled={Number(value) === service.price}>Lưu giá mới</button></>}>
      <div className="space-y-5">
        <Field label="Giá mới (VNĐ)" error={err?.fields?.price ?? (err && err.message)} hint={`Giá hiện tại: ${money(service.price)}. Lịch đã đặt giữ giá cũ (BR09).`}>
          <Input type="number" step={1000} value={value} onChange={(e) => setValue(e.target.value)} />
        </Field>
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-plum"><History className="h-4 w-4" />Lịch sử giá</p>
          {!history ? <Spinner /> : history.length === 0 ? <p className="text-sm text-ink-muted">Chưa đổi giá lần nào.</p> : (
            <ul className="divide-y divide-line text-sm">
              {history.map((h) => <li key={h.id} className="flex justify-between py-2"><span>{money(h.oldPrice)} → <b>{money(h.newPrice)}</b></span><span className="text-ink-muted">{dateText(h.changedAt)} {timeText(h.changedAt)} · {h.profiles?.fullName}</span></li>)}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  )
}
