import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './components/ui'
import SiteLayout from './components/layout/SiteLayout'
import AdminLayout from './components/layout/AdminLayout'
import { RequireAdmin, RequireUser } from './components/layout/Guards'
import HomePage from './pages/HomePage'
import ServicesPage from './pages/ServicesPage'
import DesignsPage from './pages/DesignsPage'
import BookingPage from './pages/BookingPage'
import BookingSuccessPage from './pages/BookingSuccessPage'
import MyBookingsPage from './pages/MyBookingsPage'
import ProfilePage from './pages/ProfilePage'
import { LoginPage, RegisterPage } from './pages/AuthPages'
import NotFoundPage from './pages/NotFoundPage'
import AdminBookingsPage from './pages/admin/AdminBookingsPage'
import AdminCreateBookingPage from './pages/admin/AdminCreateBookingPage'
import AdminServicesPage from './pages/admin/AdminServicesPage'
import AdminDesignsPage from './pages/admin/AdminDesignsPage'
import AdminBlockedPage from './pages/admin/AdminBlockedPage'
import AdminUsersPage from './pages/admin/AdminUsersPage'
import AdminStatsPage from './pages/admin/AdminStatsPage'

// Bản đồ màn hình: MH01 đăng nhập/đăng ký · MH02 dịch vụ · MH03 mẫu nail · MH04 đặt lịch · MH05 lịch hẹn của tôi
// MH06–MH11 quản trị · MH12 hồ sơ cá nhân
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route element={<SiteLayout />}>
              <Route index element={<HomePage />} />
              <Route path="dich-vu" element={<ServicesPage />} />
              <Route path="mau-nail" element={<DesignsPage />} />
              <Route path="dat-lich" element={<BookingPage />} />
              <Route path="dat-lich/thanh-cong" element={<RequireUser><BookingSuccessPage /></RequireUser>} />
              <Route path="lich-hen-cua-toi" element={<RequireUser><MyBookingsPage /></RequireUser>} />
              <Route path="tai-khoan" element={<RequireUser><ProfilePage /></RequireUser>} />
              <Route path="dang-nhap" element={<LoginPage />} />
              <Route path="dang-ky" element={<RegisterPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
            <Route path="admin" element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
              <Route index element={<Navigate to="lich-hen" replace />} />
              <Route path="lich-hen" element={<AdminBookingsPage />} />
              <Route path="tao-lich" element={<AdminCreateBookingPage />} />
              <Route path="dich-vu" element={<AdminServicesPage />} />
              <Route path="mau-nail" element={<AdminDesignsPage />} />
              <Route path="chan-lich" element={<AdminBlockedPage />} />
              <Route path="nguoi-dung" element={<AdminUsersPage />} />
              <Route path="thong-ke" element={<AdminStatsPage />} />
            </Route>
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
