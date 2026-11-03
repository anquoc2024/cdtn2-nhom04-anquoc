import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './components/ui'
import SiteLayout from './components/layout/SiteLayout'
import { RequireAdmin, RequireUser } from './components/layout/Guards'
import HomePage from './pages/HomePage'
import NotFoundPage from './pages/NotFoundPage'

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
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
