import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { authService } from '../services/authService'
import { useAuth } from '../context/AuthContext'
import { Alert, Field, Input, Spinner } from '../components/ui'

function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="container-page grid min-h-[calc(100vh-4rem)] items-center gap-10 py-12 lg:grid-cols-2">
      <div className="hidden overflow-hidden rounded-[32px] lg:block">
        <img src="/designs/03-ombre-pink.svg" alt="" className="h-[560px] w-full object-cover" />
      </div>
      <div className="mx-auto w-full max-w-md">
        <h1 className="text-4xl">{title}</h1>
        <p className="mt-2 text-ink-soft">{subtitle}</p>
        <div className="mt-8">{children}</div>
        <p className="mt-6 text-sm text-ink-soft">{footer}</p>
      </div>
    </div>
  )
}

// MH01 – Đăng nhập (UC02, FR02, FR17)
export function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [err, setErr] = useState(null)
  const [busy, setBusy] = useState(false)
  const { refresh } = useAuth()
  const nav = useNavigate()
  const [params] = useSearchParams()

  async function submit(e) {
    e.preventDefault()
    setBusy(true); setErr(null)
    const r = await authService.login(form)
    setBusy(false)
    if (r.error) return setErr(r.error)
    await refresh()
    const next = params.get('next')
    nav(r.data.user.role === 'admin' && (!next || next.startsWith('/dat-lich')) ? r.data.redirect : next || r.data.redirect, { replace: true })
  }

  return (
    <AuthShell title="Chào mừng trở lại" subtitle="Đăng nhập để đặt lịch và theo dõi lịch hẹn."
      footer={<>Chưa có tài khoản? <Link className="font-semibold text-rose-600" to={`/dang-ky${params.get('next') ? `?next=${encodeURIComponent(params.get('next'))}` : ''}`}>Đăng ký ngay</Link>. Quên mật khẩu? Gọi tiệm để được hỗ trợ.</>}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        {err && !err.fields && <Alert>{err.message}</Alert>}
        <Field label="Email" error={err?.fields?.email}><Input type="email" autoComplete="email" value={form.email} error={err?.fields?.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
        <Field label="Mật khẩu" error={err?.fields?.password}><Input type="password" autoComplete="current-password" value={form.password} error={err?.fields?.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></Field>
        <button className="btn-primary w-full py-3" disabled={busy}>{busy ? <Spinner className="text-white" /> : 'Đăng nhập'}</button>
      </form>
    </AuthShell>
  )
}

// MH01 – Đăng ký (UC01, FR01)
export function RegisterPage() {
  const [form, setForm] = useState({ fullName: '', phone: '', email: '', password: '', confirm: '' })
  const [err, setErr] = useState(null)
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)
  const { refresh } = useAuth()
  const nav = useNavigate()
  const [params] = useSearchParams()
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  async function submit(e) {
    e.preventDefault()
    if (form.password !== form.confirm) return setErr({ message: 'Mật khẩu nhập lại không khớp.', fields: { confirm: 'Mật khẩu nhập lại không khớp' } })
    setBusy(true); setErr(null)
    const r = await authService.register(form)
    setBusy(false)
    if (r.error) return setErr(r.error)
    if (r.data.needsConfirmation) return setDone(true)
    await refresh()
    nav(params.get('next') || '/', { replace: true })
  }

  if (done) {
    return (
      <AuthShell title="Kiểm tra email" subtitle="Tài khoản đã được tạo." footer={<Link className="font-semibold text-rose-600" to="/dang-nhap">Về trang đăng nhập</Link>}>
        <Alert tone="success">Vui lòng mở thư xác nhận gửi tới {form.email}, sau đó đăng nhập.</Alert>
      </AuthShell>
    )
  }

  const f = err?.fields ?? {}
  return (
    <AuthShell title="Tạo tài khoản" subtitle="Chỉ mất một phút – để giữ chỗ và theo dõi lịch hẹn."
      footer={<>Đã có tài khoản? <Link className="font-semibold text-rose-600" to={`/dang-nhap${params.get('next') ? `?next=${encodeURIComponent(params.get('next'))}` : ''}`}>Đăng nhập</Link></>}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        {err && !err.fields && <Alert>{err.message}</Alert>}
        <Field label="Họ và tên" required error={f.fullName}><Input autoComplete="name" value={form.fullName} error={f.fullName} onChange={set('fullName')} /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Số điện thoại" required error={f.phone}><Input inputMode="numeric" autoComplete="tel" value={form.phone} error={f.phone} onChange={set('phone')} placeholder="09xxxxxxxx" /></Field>
          <Field label="Email" required error={f.email}><Input type="email" autoComplete="email" value={form.email} error={f.email} onChange={set('email')} /></Field>
        </div>
        <Field label="Mật khẩu" required error={f.password} hint="Tối thiểu 8 ký tự"><Input type="password" autoComplete="new-password" value={form.password} error={f.password} onChange={set('password')} /></Field>
        <Field label="Nhập lại mật khẩu" required error={f.confirm}><Input type="password" autoComplete="new-password" value={form.confirm} error={f.confirm} onChange={set('confirm')} /></Field>
        <button className="btn-primary w-full py-3" disabled={busy}>{busy ? <Spinner className="text-white" /> : 'Đăng ký'}</button>
        <p className="text-xs text-ink-muted">Bằng việc đăng ký, bạn đồng ý với quy định đặt lịch của tiệm: hủy trước giờ hẹn ít nhất 2 giờ, tối đa 2 lịch đang chờ.</p>
      </form>
    </AuthShell>
  )
}
