import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { CalendarHeart, LogOut, Menu, Phone, MapPin, Clock, User, X, LayoutDashboard } from 'lucide-react'
import Logo from './Logo'
import { useAuth } from '../../context/AuthContext'
import { catalogService } from '../../services/catalogService'
import { bookingService } from '../../services/bookingService'

const WEEKDAYS = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7']

export default function SiteLayout() {
  const { user, isAdmin, logout } = useAuth()
  const [store, setStore] = useState(null)
  const [open, setOpen] = useState(false)
  const [updated, setUpdated] = useState(0)
  const loc = useLocation()
  const nav = useNavigate()

  useEffect(() => { catalogService.getStoreInfo().then((r) => setStore(r.data)) }, [])
  useEffect(() => { setOpen(false); window.scrollTo(0, 0) }, [loc.pathname])
  useEffect(() => {
    if (!user || isAdmin) return setUpdated(0)
    bookingService.countUpdated(user.id).then((r) => setUpdated(r.data ?? 0))   // FR23
  }, [user, isAdmin, loc.pathname])

  const links = [
    { to: '/dich-vu', label: 'Dịch vụ & bảng giá' },
    { to: '/mau-nail', label: 'Mẫu nail' },
    { to: '/gioi-thieu', label: 'Giới thiệu' },
    ...(user && !isAdmin ? [{ to: '/lich-hen-cua-toi', label: 'Lịch hẹn của tôi', badge: updated }] : []),
  ]
  const navCls = ({ isActive }) => `relative rounded-full px-3.5 py-2 text-sm transition ${isActive ? 'bg-rose-50 font-semibold text-plum' : 'text-ink-soft hover:text-plum'}`

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-line/70 bg-cream/90 backdrop-blur">
        <div className="container-page flex h-16 items-center justify-between gap-4">
          <Logo name={store?.storeName ?? 'Thủy Nail'} />
          <nav className="hidden items-center gap-1 md:flex" aria-label="Điều hướng chính">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} className={navCls}>
                {l.label}
                {l.badge > 0 && <span className="ml-1.5 rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white">{l.badge}</span>}
              </NavLink>
            ))}
          </nav>
          <div className="hidden items-center gap-2 md:flex">
            {isAdmin && <Link to="/admin/lich-hen" className="btn-ghost"><LayoutDashboard className="h-4 w-4" />Quản trị</Link>}
            {user ? (
              <>
                <Link to="/tai-khoan" className="btn-ghost"><User className="h-4 w-4" />{user.fullName.split(' ').slice(-1)[0]}</Link>
                <button className="btn-ghost" onClick={async () => { await logout(); nav('/') }} aria-label="Đăng xuất"><LogOut className="h-4 w-4" /></button>
              </>
            ) : <Link to="/dang-nhap" className="btn-ghost">Đăng nhập</Link>}
            {!isAdmin && <Link to="/dat-lich" className="btn-primary"><CalendarHeart className="h-4 w-4" />Đặt lịch</Link>}
          </div>
          <button className="btn-ghost rounded-full p-2 md:hidden" onClick={() => setOpen(!open)} aria-label="Mở menu" aria-expanded={open}>
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
        {open && (
          <div className="border-t border-line bg-cream md:hidden">
            <div className="container-page flex flex-col gap-1 py-4">
              {links.map((l) => <NavLink key={l.to} to={l.to} className={navCls}>{l.label}{l.badge > 0 && ` (${l.badge})`}</NavLink>)}
              {isAdmin && <NavLink to="/admin/lich-hen" className={navCls}>Trang quản trị</NavLink>}
              {user ? (
                <>
                  <NavLink to="/tai-khoan" className={navCls}>Tài khoản</NavLink>
                  <button className="rounded-full px-3.5 py-2 text-left text-sm text-ink-soft" onClick={async () => { await logout(); nav('/') }}>Đăng xuất</button>
                </>
              ) : <NavLink to="/dang-nhap" className={navCls}>Đăng nhập / Đăng ký</NavLink>}
              {!isAdmin && <Link to="/dat-lich" className="btn-primary mt-2">Đặt lịch</Link>}
            </div>
          </div>
        )}
      </header>

      <main className="flex-1"><Outlet context={{ store }} /></main>

      <footer className="mt-20 bg-plum text-cream/80">
        <div className="container-page grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Logo name={store?.storeName ?? 'Thủy Nail'} light />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-cream/70">{store?.intro}</p>
          </div>
          <div className="space-y-3 text-sm">
            <p className="font-display text-lg text-cream">Ghé tiệm</p>
            <p className="flex gap-2"><MapPin className="h-4 w-4 shrink-0 text-gold-300" />{store?.address}</p>
            <p className="flex gap-2"><Phone className="h-4 w-4 shrink-0 text-gold-300" /><a href={`tel:${store?.phone ?? ''}`} className="hover:text-cream">{store?.phone}</a></p>
          </div>
          <div className="space-y-3 text-sm">
            <p className="font-display text-lg text-cream">Giờ nhận lịch</p>
            <p className="flex gap-2"><Clock className="h-4 w-4 shrink-0 text-gold-300" />{store ? `${store.openTime.slice(0, 5)} – ${store.closeTime.slice(0, 5)}` : ''}</p>
            {store?.closedWeekdays?.length > 0 && <p className="text-cream/60">Nghỉ: {store.closedWeekdays.map((d) => WEEKDAYS[d]).join(', ')}</p>}
            <p className="text-cream/60">Quên mật khẩu? Gọi tiệm để được hỗ trợ.</p>
            <p className="flex gap-3 pt-1"><Link to="/gioi-thieu#lien-he" className="hover:text-cream">Liên hệ</Link><Link to="/gioi-thieu#hoi-dap" className="hover:text-cream">Câu hỏi thường gặp</Link></p>
          </div>
        </div>
        <div className="border-t border-white/10 py-5 text-center text-xs text-cream/50">© {new Date().getFullYear()} {store?.storeName ?? 'Thủy Nail'} · NailCare</div>
      </footer>
    </div>
  )
}
