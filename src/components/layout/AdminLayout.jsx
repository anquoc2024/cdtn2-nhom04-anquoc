import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate, Link } from 'react-router-dom'
import { CalendarDays, CalendarPlus, Scissors, Palette, CalendarX2, Users, BarChart3, Store, LogOut, Menu, X, ExternalLink } from 'lucide-react'
import Logo from './Logo'
import { useAuth } from '../../context/AuthContext'
import { adminService } from '../../services/adminService'

const ITEMS = [
  { to: '/admin/lich-hen', label: 'Lịch hẹn', icon: CalendarDays, badge: 'pending' },
  { to: '/admin/tao-lich', label: 'Tạo lịch cho khách', icon: CalendarPlus },
  { to: '/admin/dich-vu', label: 'Dịch vụ & giá', icon: Scissors },
  { to: '/admin/mau-nail', label: 'Mẫu nail', icon: Palette },
  { to: '/admin/chan-lich', label: 'Chặn ngày, giờ', icon: CalendarX2 },
  { to: '/admin/nguoi-dung', label: 'Người dùng', icon: Users },
  { to: '/admin/thong-ke', label: 'Thống kê', icon: BarChart3 },
  { to: '/admin/cua-hang', label: 'Cửa hàng', icon: Store },
]

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const [pending, setPending] = useState(0)
  const [open, setOpen] = useState(false)
  const loc = useLocation()
  const nav = useNavigate()

  useEffect(() => {
    setOpen(false)
    adminService.getBookingSummary().then((r) => setPending(r.data?.pending ?? 0))   // FR23: số lịch chờ xác nhận
  }, [loc.pathname])

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="px-5 pb-6 pt-5"><Logo to="/admin/lich-hen" name="Quản trị" light /></div>
      <nav className="flex-1 space-y-1 px-3" aria-label="Quản trị">
        {ITEMS.map(({ to, label, icon: Icon, badge }) => (
          <NavLink key={to} to={to}
            className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${isActive ? 'bg-white/10 font-semibold text-white' : 'text-cream/70 hover:bg-white/5 hover:text-white'}`}>
            <Icon className="h-[18px] w-[18px]" />
            <span className="flex-1">{label}</span>
            {badge === 'pending' && pending > 0 && <span className="rounded-full bg-rose-400 px-2 py-0.5 text-[11px] font-bold text-plum">{pending}</span>}
          </NavLink>
        ))}
      </nav>
      <div className="space-y-1 border-t border-white/10 p-3 text-sm">
        <Link to="/" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-cream/70 hover:bg-white/5 hover:text-white"><ExternalLink className="h-4 w-4" />Xem website</Link>
        <button onClick={async () => { await logout(); nav('/') }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-cream/70 hover:bg-white/5 hover:text-white">
          <LogOut className="h-4 w-4" />Đăng xuất
        </button>
        <p className="truncate px-3 pt-2 text-xs text-cream/40">{user?.fullName} · {user?.email}</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-cream lg:pl-64">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 bg-plum lg:block">{sidebar}</aside>
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-cream/90 px-4 backdrop-blur lg:hidden">
        <Logo to="/admin/lich-hen" name="Quản trị" />
        <button className="btn-ghost rounded-full p-2" onClick={() => setOpen(true)} aria-label="Mở menu"><Menu className="h-6 w-6" /></button>
      </header>
      {open && (
        <div className="fixed inset-0 z-50 bg-plum/40 lg:hidden" onClick={() => setOpen(false)}>
          <aside className="h-full w-72 bg-plum" onClick={(e) => e.stopPropagation()}>
            <button className="absolute left-60 top-4 rounded-full p-2 text-cream" onClick={() => setOpen(false)} aria-label="Đóng menu"><X className="h-5 w-5" /></button>
            {sidebar}
          </aside>
        </div>
      )}
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8"><Outlet /></main>
    </div>
  )
}
