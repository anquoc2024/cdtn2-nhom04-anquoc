import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { authService } from '../services/authService'
import { Alert, Field, Input, PageTitle, Spinner, useToast } from '../components/ui'

// MH12 – Hồ sơ cá nhân (UC19, FR21): sửa họ tên, SĐT; đổi mật khẩu
export default function ProfilePage() {
  const { user, refresh } = useAuth()
  const toast = useToast()
  const [form, setForm] = useState({ fullName: user.fullName, phone: user.phone })
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' })
  const [err, setErr] = useState(null)
  const [pwErr, setPwErr] = useState(null)
  const [busy, setBusy] = useState('')

  async function saveProfile(e) {
    e.preventDefault(); setBusy('p'); setErr(null)
    const r = await authService.updateProfile(user.id, form)
    setBusy('')
    if (r.error) return setErr(r.error)
    await refresh(); toast('Đã lưu thông tin')
  }
  async function savePassword(e) {
    e.preventDefault(); setPwErr(null)
    if (pw.next !== pw.confirm) return setPwErr({ fields: { confirm: 'Mật khẩu nhập lại không khớp' } })
    setBusy('pw')
    const r = await authService.changePassword(user.email, pw)
    setBusy('')
    if (r.error) return setPwErr(r.error)
    setPw({ current: '', next: '', confirm: '' }); toast('Đã đổi mật khẩu')
  }

  return (
    <div className="container-page max-w-3xl py-12">
      <PageTitle eyebrow="Tài khoản" title="Hồ sơ của tôi" />
      <div className="grid gap-6 md:grid-cols-2">
        <form className="card space-y-4 p-6" onSubmit={saveProfile} noValidate>
          <h2 className="text-xl">Thông tin cá nhân</h2>
          {err && !err.fields && <Alert>{err.message}</Alert>}
          <Field label="Họ và tên" error={err?.fields?.fullName}><Input value={form.fullName} error={err?.fields?.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /></Field>
          <Field label="Số điện thoại" error={err?.fields?.phone}><Input value={form.phone} inputMode="numeric" error={err?.fields?.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
          <Field label="Email" hint="Email đăng nhập không đổi được trên website."><Input value={user.email} disabled /></Field>
          <button className="btn-primary" disabled={busy === 'p'}>{busy === 'p' ? <Spinner className="text-white" /> : 'Lưu thay đổi'}</button>
        </form>
        <form className="card space-y-4 p-6" onSubmit={savePassword} noValidate>
          <h2 className="text-xl">Đổi mật khẩu</h2>
          {pwErr && !pwErr.fields && <Alert>{pwErr.message}</Alert>}
          <Field label="Mật khẩu hiện tại" error={pwErr?.fields?.current}><Input type="password" autoComplete="current-password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} /></Field>
          <Field label="Mật khẩu mới" error={pwErr?.fields?.next} hint="Tối thiểu 8 ký tự"><Input type="password" autoComplete="new-password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} /></Field>
          <Field label="Nhập lại mật khẩu mới" error={pwErr?.fields?.confirm}><Input type="password" autoComplete="new-password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} /></Field>
          <button className="btn-dark" disabled={busy === 'pw'}>{busy === 'pw' ? <Spinner className="text-white" /> : 'Đổi mật khẩu'}</button>
        </form>
      </div>
    </div>
  )
}
