import { useState } from 'react'
import { Pencil, Plus, Trash2, Check, X } from 'lucide-react'
import { useToast } from '../../components/ui'

/** Danh sách danh mục dạng chip: thêm, đổi tên, xóa (dùng cho danh mục dịch vụ và danh mục mẫu) */
export default function CategoryManager({ items, onSave, onDelete, onChanged, label }) {
  const toast = useToast()
  const [edit, setEdit] = useState(null)        // { id?, name }
  async function save() {
    const r = await onSave(edit)
    if (r.error) return toast(r.error.fields?.name ?? r.error.message, 'error')
    setEdit(null); onChanged(); toast('Đã lưu danh mục')
  }
  async function remove(c) {
    if (!window.confirm(`Xóa danh mục “${c.name}”?`)) return
    const r = await onDelete(c.id)
    if (r.error) return toast(r.error.message, 'error')
    toast(r.data?.hidden ? 'Danh mục đang được dùng nên đã ẩn' : 'Đã xóa danh mục'); onChanged()
  }
  return (
    <div className="card mb-6 p-5">
      <p className="mb-3 text-sm font-semibold text-plum">{label}</p>
      <div className="flex flex-wrap items-center gap-2">
        {items.map((c) => edit?.id === c.id ? (
          <span key={c.id} className="flex items-center gap-1">
            <input autoFocus className="input w-40 py-1.5" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && save()} />
            <button className="btn-ghost p-1.5" onClick={save} aria-label="Lưu"><Check className="h-4 w-4" /></button>
            <button className="btn-ghost p-1.5" onClick={() => setEdit(null)} aria-label="Hủy"><X className="h-4 w-4" /></button>
          </span>
        ) : (
          <span key={c.id} className={`chip gap-1 pr-1.5 ${c.isActive === false ? 'opacity-50' : ''}`}>
            {c.name}
            <button className="rounded-full p-1 hover:bg-rose-50" onClick={() => setEdit({ id: c.id, name: c.name, sortOrder: c.sortOrder, isActive: true })} aria-label={`Sửa ${c.name}`}><Pencil className="h-3 w-3" /></button>
            <button className="rounded-full p-1 hover:bg-red-50" onClick={() => remove(c)} aria-label={`Xóa ${c.name}`}><Trash2 className="h-3 w-3" /></button>
          </span>
        ))}
        {edit && !edit.id ? (
          <span className="flex items-center gap-1">
            <input autoFocus className="input w-40 py-1.5" placeholder="Tên danh mục" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && save()} />
            <button className="btn-ghost p-1.5" onClick={save} aria-label="Lưu"><Check className="h-4 w-4" /></button>
            <button className="btn-ghost p-1.5" onClick={() => setEdit(null)} aria-label="Hủy"><X className="h-4 w-4" /></button>
          </span>
        ) : <button className="chip border-dashed" onClick={() => setEdit({ name: '', sortOrder: items.length + 1 })}><Plus className="mr-1 h-3.5 w-3.5" />Thêm</button>}
      </div>
    </div>
  )
}
