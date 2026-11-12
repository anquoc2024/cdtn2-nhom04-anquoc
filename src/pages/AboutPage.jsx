import { useEffect } from 'react'
import { Link, useLocation, useOutletContext } from 'react-router-dom'
import { Clock, MapPin, Phone, ChevronDown, CalendarHeart } from 'lucide-react'

// Trang tĩnh Giới thiệu – Liên hệ – Câu hỏi thường gặp (FR16, phần hiển thị cho khách)
const WEEKDAYS = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7']

const FAQ = [
  ['Tôi có cần tài khoản để đặt lịch không?', 'Bạn xem dịch vụ, mẫu nail và giờ trống mà không cần đăng nhập. Đến bước xác nhận, bạn đăng nhập hoặc tạo tài khoản để tiệm liên hệ được khi cần.'],
  ['Đặt lịch xong là chắc chắn có chỗ chưa?', 'Lịch mới ở trạng thái "Chờ xác nhận". Tiệm xác nhận hoặc từ chối (kèm lý do); bạn theo dõi trong mục Lịch hẹn của tôi.'],
  ['Tôi được đặt trước bao lâu?', 'Sớm nhất 1 giờ trước giờ hẹn và xa nhất 30 ngày. Mỗi tài khoản giữ tối đa 2 lịch đang chờ cùng lúc.'],
  ['Tôi muốn hủy hoặc đổi giờ thì làm sao?', 'Bạn tự hủy được khi lịch còn cách giờ hẹn ít nhất 2 giờ. Muốn đổi giờ, hãy gọi tiệm để được dời lịch, hoặc hủy rồi đặt lại.'],
  ['Giá trên website có thay đổi sau khi tôi đặt không?', 'Không. Giá của từng dịch vụ được giữ nguyên theo thời điểm bạn đặt lịch.'],
  ['Tôi quên mật khẩu?', 'Hãy gọi số điện thoại của tiệm để được hỗ trợ đặt lại mật khẩu.'],
]

export default function AboutPage() {
  const { store } = useOutletContext() ?? {}
  const { hash } = useLocation()
  useEffect(() => {   // cuộn tới #lien-he / #hoi-dap khi đi từ chân trang
    if (hash) setTimeout(() => document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' }), 50)
  }, [hash])
  const hours = store ? `${store.openTime.slice(0, 5)} – ${store.closeTime.slice(0, 5)}` : ''

  return (
    <div className="container-page py-12">
      <p className="eyebrow">Về chúng tôi</p>
      <h1 className="mt-2 text-4xl">{store?.storeName ?? 'Thủy Nail'}</h1>

      <section id="gioi-thieu" className="mt-8 grid gap-8 md:grid-cols-[1.3fr_1fr]">
        <div className="card p-7">
          <h2 className="text-2xl">Giới thiệu</h2>
          <p className="mt-4 whitespace-pre-line leading-relaxed text-ink-soft">
            {store?.intro || 'Tiệm đang cập nhật phần giới thiệu.'}
          </p>
          {store?.bannerUrl && <img src={store.bannerUrl} alt={store.storeName} className="mt-6 aspect-[16/9] w-full rounded-xl object-cover" />}
        </div>

        <div id="lien-he" className="card space-y-4 p-7 text-sm">
          <h2 className="text-2xl">Liên hệ</h2>
          <p className="flex gap-3"><MapPin className="h-5 w-5 shrink-0 text-rose-500" />{store?.address}</p>
          <p className="flex gap-3"><Phone className="h-5 w-5 shrink-0 text-rose-500" /><a className="font-semibold text-plum hover:underline" href={`tel:${store?.phone ?? ''}`}>{store?.phone}</a></p>
          <p className="flex gap-3"><Clock className="h-5 w-5 shrink-0 text-rose-500" />
            <span>Nhận lịch {hours}
              {store?.closedWeekdays?.length > 0 && <><br /><span className="text-ink-muted">Nghỉ: {store.closedWeekdays.map((d) => WEEKDAYS[d]).join(', ')}</span></>}
            </span>
          </p>
          <Link to="/dat-lich" className="btn-primary mt-2 w-full"><CalendarHeart className="h-4 w-4" />Đặt lịch</Link>
        </div>
      </section>

      <section id="hoi-dap" className="mt-12">
        <h2 className="text-2xl">Câu hỏi thường gặp</h2>
        <div className="mt-5 divide-y divide-line rounded-2xl border border-line bg-white">
          {FAQ.map(([q, a]) => (
            <details key={q} className="group px-6 py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-ink">
                {q}<ChevronDown className="h-4 w-4 shrink-0 transition group-open:rotate-180" />
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">{a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  )
}
