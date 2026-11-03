import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { PageLoader } from '../ui'

export function RequireUser({ children }) {
  const { user, ready } = useAuth()
  const loc = useLocation()
  if (!ready) return <PageLoader />
  if (!user) return <Navigate to={`/dang-nhap?next=${encodeURIComponent(loc.pathname + loc.search)}`} replace />
  return children
}

export function RequireAdmin({ children }) {
  const { user, ready, isAdmin } = useAuth()
  const loc = useLocation()
  if (!ready) return <PageLoader />
  if (!user) return <Navigate to={`/dang-nhap?next=${encodeURIComponent(loc.pathname)}`} replace />
  if (!isAdmin) return <Navigate to="/" replace />           // FR17: người dùng thường không vào được trang quản trị
  return children
}
