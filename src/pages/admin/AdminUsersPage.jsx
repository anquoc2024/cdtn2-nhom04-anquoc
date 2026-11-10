import { useEffect, useState } from 'react'
import { Search, ShieldCheck } from 'lucide-react'
import { adminService } from '../../services/adminService'
import { useAuth } from '../../context/AuthContext'
import { dateText, money, timeText } from '../../lib/format'
import { Alert, Badge, Empty, Field, Input, Modal, PageLoader, PageTitle, Pagination, Select, Spinner, StatusBadge, useToast } from '../../components/ui'

// MH09 – Người dùng (UC09; FR09, BR11, BR14). Quản trị viên không đặt và không xem được mật khẩu người dùng.
export default function AdminUsersPage() {
  const { user: me } = useAuth()
  const toast = useToast()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [state, setState] = useState({ loading: true, data: null, error: null })
  const [edit, setEdit] = useState(null)
  const [history, setHistory] = useState(null)

  const load = () => {
    setState((s) => ({ ...s, loading: true }))
    adminService.getUsers({ q, status, page }).then((r) => setState({ loading: false, data: r.data, error: r.error }))
  }
  useEffect(load, [status, page]) // eslint-disable-line react-hooks/exhaustive-deps

  async function act(fn, ok) {
    const r = await fn()
    if (r.error) return toast(r.error.message, 'error')
    toast(ok); load()
  }
  async function showHistory(u) {
    setHistory({ user: u })
    const r = await adminService.getUserBookings(u.id)
    setHistory({ user: u, items: r.data ?? [] })
  }

  return (
    <>
      <PageTitle eyebrow="Quản trị" title="Người dùng">Tìm khách theo tên, SĐT hoặc email; khóa tài khoản vi phạm; cấp quyền quản trị cho người cùng quản lý tiệm.</PageTitle>
      <form className="card mb-4 flex flex-wrap items-end gap-3 p-4" onSubmit={(e) => { e.preventDefault(); setPage(1); load() }}>
        <Field label="Tìm kiếm" className="min-w-[220px] flex-1"><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Họ tên, SĐT hoặc email…" /></Field>
        <Field label="Trạng thái" className="w-44">
          <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}>
            <option value="">Tất cả</option><option value="active">Đang hoạt động</option><option value="locked">Bị khóa</option><option value="admin">Quản trị viên</option>
          </Select>
        </Field>
        <button className="btn-dark"><Search className="h-4 w-4" />Tìm</button>
      </form>
      <Alert>{state.error?.message}</Alert>
      {state.loading ? <PageLoader /> : !state.data?.items.length ? <Empty title="Không tìm thấy người dùng" /> : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[820px]">
            <thead className="border-b border-line bg-cream/60"><tr>{['Họ tên', 'SĐT', 'Email', 'Ngày đăng ký', 'Vai trò', 'Trạng thái', ''].map((h) => <th key={h} className="table-head">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-line">
              {state.data.items.map((u) => (
                <tr key={u.id}>
                  <td className="table-cell font-medium text-plum">{u.fullName}{u.id === me.id && <span className="ml-1 text-xs text-ink-muted">(bạn)</span>}</td>
                  <td className="table-cell">{u.phone}</td>
                  <td className="table-cell text-ink-soft">{u.email}</td>
                  <td className="table-cell">{dateText(u.createdAt)}</td>
                  <td className="table-cell">{u.role === 'admin' ? <Badge tone="violet"><ShieldCheck className="h-3 w-3" />Quản trị</Badge> : <Badge>Người dùng</Badge>}</td>
                  <td className="table-cell">{u.isLocked ? <Badge tone="red">Bị khóa</Badge> : <Badge tone="green">Hoạt động</Badge>}</td>
                  <td className="table-cell whitespace-nowrap text-right">
                    <button className="btn-ghost btn-sm" onClick={() => showHistory(u)}>Lịch hẹn</button>
                    <button className="btn-ghost btn-sm" onClick={() => setEdit({ id: u.id, fullName: u.fullName, phone: u.phone })}>Sửa</button>
                    {u.id !== me.id && (
                      <>
                        <button className="btn-ghost btn-sm" onClick={() => window.confirm(u.isLocked ? `Mở khóa ${u.fullName}?` : `Khóa ${u.fullName}? Người này sẽ không đăng nhập được; lịch cũ vẫn giữ.`) && act(() => adminService.setLocked(u.id, !u.isLocked), u.isLocked ? 'Đã mở khóa' : 'Đã khóa tài khoản')}>{u.isLocked ? 'Mở khóa' : 'Khóa'}</button>
                        <button className="btn-ghost btn-sm" onClick={() => window.confirm(u.role === 'admin' ? `Thu quyền quản trị của ${u.fullName}?` : `Cấp quyền quản trị cho ${u.fullName}? Người này sẽ có toàn quyền như bạn.`) && act(() => adminService.setAdminRole(u.id, u.role !== 'admin'), 'Đã cập nhật quyền')}>{u.role === 'admin' ? 'Thu quyền' : 'Cấp quyền'}</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {state.data && <Pagination page={page} limit={state.data.limit} total={state.data.total} onPage={setPage} />}
      <EditUser data={edit} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); load(); toast('Đã lưu') }} />
      <Modal open={!!history} onClose={() => setHistory(null)} title={`Lịch hẹn – ${history?.user.fullName ?? ''}`}>
        {!history?.items ? <div className="flex justify-center py-8"><Spinner /></div> : history.items.length === 0 ? <p className="text-sm text-ink-muted">Chưa có lịch hẹn.</p> : (
          <ul className="divide-y divide-line text-sm">{history.items.map((b) => <li key={b.id} className="flex items-center justify-between gap-3 py-2"><span className="font-mono text-xs">{b.code}</span><span>{dateText(b.startAt)} {timeText(b.startAt)}</span><span>{money(b.totalPrice)}</span><StatusBadge status={b.status} /></li>)}</ul>
        )}
      </Modal>
    </>
  )
}

function EditUser({ data, onClose, onSaved }) {
  const [d, setD] = useState(data)
  const [err, setErr] = useState(null)
  useEffect(() => { setD(data); setErr(null) }, [data])
  if (!data || !d) return null
  async function save() {
    const r = await adminService.updateUser(d.id, d)
    if (r.error) return setErr(r.error)
    onSaved()
  }
  return (
    <Modal open onClose={onClose} title="Sửa thông tin người dùng" footer={<><button className="btn-outline" onClick={onClose}>Hủy</button><button className="btn-primary" onClick={save}>Lưu</button></>}>
      <div className="space-y-4">
        {err && !err.fields && <Alert>{err.message}</Alert>}
        <Field label="Họ và tên" error={err?.fields?.fullName}><Input value={d.fullName} onChange={(e) => setD({ ...d, fullName: e.target.value })} /></Field>
        <Field label="Số điện thoại" error={err?.fields?.phone}><Input value={d.phone} onChange={(e) => setD({ ...d, phone: e.target.value })} /></Field>
        <p className="text-xs text-ink-muted">Mật khẩu do người dùng tự quản lý; quản trị viên không xem và không đặt mật khẩu.</p>
      </div>
    </Modal>
  )
}
