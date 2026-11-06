import { Link, Navigate, useLocation } from 'react-router-dom'
import { CalendarCheck2 } from 'lucide-react'
import { money, longDateText, rangeText } from '../lib/format'
import { StatusBadge } from '../components/ui'

export default function BookingSuccessPage() {
  const { state } = useLocation()
  const b = state?.booking
  if (!b) return <Navigate to="/lich-hen-cua-toi" replace />
  return (
    <div className="container-page max-w-xl py-16 text-center">
      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-rose-500"><CalendarCheck2 className="h-8 w-8" /></span>
      <h1 className="mt-6 text-4xl">Đã giữ chỗ cho bạn!</h1>
      <p className="mt-3 text-ink-soft">Tiệm sẽ xác nhận lịch sớm. Khi có thay đổi, lịch sẽ có dấu “Mới cập nhật” trong mục Lịch hẹn của tôi.</p>
      <div className="card mt-8 p-6 text-left">
        <div className="flex items-center justify-between">
          <span className="font-mono text-sm text-ink-muted">Mã lịch hẹn</span>
          <StatusBadge status={b.status} />
        </div>
        <p className="mt-1 font-display text-3xl tracking-wide text-plum">{b.code}</p>
        <p className="mt-4 capitalize text-plum">{longDateText(b.startAt)} · {rangeText(b.startAt, b.endAt)}</p>
        {state.design && <p className="mt-1 text-sm text-ink-soft">Mẫu: {state.design.name}</p>}
        <ul className="mt-4 space-y-1 border-t border-line pt-4 text-sm">
          {b.services.map((s) => <li key={s.serviceId} className="flex justify-between"><span>{s.name}</span><span>{money(s.price)}</span></li>)}
          <li className="flex justify-between pt-2 font-semibold text-plum"><span>Tổng tạm tính</span><span>{money(b.totalPrice)}</span></li>
        </ul>
      </div>
      <div className="mt-8 flex justify-center gap-3">
        <Link to="/lich-hen-cua-toi" className="btn-primary">Xem lịch hẹn của tôi</Link>
        <Link to="/" className="btn-outline">Về trang chủ</Link>
      </div>
    </div>
  )
}
