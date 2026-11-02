import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="container-page py-24 text-center">
      <p className="eyebrow">404</p>
      <h1 className="mt-3 text-4xl">Không tìm thấy trang</h1>
      <p className="mt-3 text-ink-soft">Đường dẫn có thể đã thay đổi.</p>
      <Link to="/" className="btn-primary mt-8">Về trang chủ</Link>
    </div>
  )
}
