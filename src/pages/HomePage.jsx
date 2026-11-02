import { useEffect, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { ArrowRight, CalendarCheck2, Clock3, Sparkles, MousePointerClick, BadgeCheck } from 'lucide-react'
import { catalogService } from '../services/catalogService'
import { money, minutes } from '../lib/format'

export default function HomePage() {
  const { store } = useOutletContext() ?? {}
  const [services, setServices] = useState([])
  const [designs, setDesigns] = useState([])

  useEffect(() => {
    catalogService.getServices().then((r) => setServices(r.data ?? []))
    catalogService.getDesigns(null, 1).then((r) => setDesigns(r.data?.items ?? []))
  }, [])

  const hero = store?.bannerUrl
    ? [{ id: 'banner', imageUrl: store.bannerUrl, name: store.storeName }, ...designs.slice(0, 2)]
    : designs.slice(0, 3)
  const featured = services.slice(0, 6)

  return (
    <>
      {/* ------------------------------------------------ hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full bg-rose-100/70 blur-3xl" />
        <div className="container-page relative grid items-center gap-12 py-14 md:grid-cols-[1.05fr_1fr] md:py-24">
          <div>
            <p className="eyebrow">Tiệm nail · Đặt lịch trực tuyến</p>
            <h1 className="mt-4 text-5xl leading-[1.05] sm:text-6xl">
              Đẹp từng<br /><span className="italic text-rose-500">đầu ngón tay</span>
            </h1>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-ink-soft">
              {store?.intro ?? 'Chọn dịch vụ, chọn mẫu bạn thích và giữ chỗ trước – đến tiệm là được làm ngay.'}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/dat-lich" className="btn-primary px-7 py-3 text-base">Đặt lịch ngay <ArrowRight className="h-4 w-4" /></Link>
              <Link to="/mau-nail" className="btn-outline px-7 py-3 text-base">Xem mẫu nail</Link>
            </div>
            <dl className="mt-10 grid max-w-md grid-cols-3 gap-4 border-t border-line pt-6 text-sm">
              <div><dt className="text-ink-muted">Giờ nhận lịch</dt><dd className="mt-1 font-semibold text-plum">{store ? `${store.openTime.slice(0, 5)}–${store.closeTime.slice(0, 5)}` : '—'}</dd></div>
              <div><dt className="text-ink-muted">Đặt trước</dt><dd className="mt-1 font-semibold text-plum">đến 30 ngày</dd></div>
              <div><dt className="text-ink-muted">Hủy miễn phí</dt><dd className="mt-1 font-semibold text-plum">trước 2 giờ</dd></div>
            </dl>
          </div>

          <div className="relative mx-auto h-[380px] w-full max-w-[460px] sm:h-[440px]">
            {hero.map((d, i) => (
              <Link key={d.id} to={d.id === 'banner' ? '/dat-lich' : `/mau-nail?mau=${d.id}`}
                className={`absolute overflow-hidden rounded-[28px] border-4 border-white bg-white shadow-lift transition hover:z-10 hover:scale-[1.02]
                  ${i === 0 ? 'left-0 top-6 h-56 w-56 -rotate-6 sm:h-64 sm:w-64' : ''}
                  ${i === 1 ? 'right-0 top-0 h-48 w-48 rotate-6 sm:h-56 sm:w-56' : ''}
                  ${i === 2 ? 'bottom-0 left-1/2 h-52 w-52 -translate-x-1/3 rotate-2 sm:h-60 sm:w-60' : ''}`}>
                <img src={d.imageUrl} alt={d.name} className="h-full w-full object-cover" />
              </Link>
            ))}
            <div className="absolute -left-2 bottom-10 flex items-center gap-3 rounded-2xl bg-white/95 px-4 py-3 shadow-lift backdrop-blur sm:-left-8">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-50 text-rose-500"><CalendarCheck2 className="h-5 w-5" /></span>
              <span className="text-sm"><span className="block font-semibold text-plum">Giữ chỗ trong 1 phút</span><span className="text-ink-muted">Tiệm xác nhận qua website</span></span>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ dịch vụ */}
      <section className="container-page py-16">
        <div className="mb-8 flex items-end justify-between gap-6">
          <div>
            <p className="eyebrow">Bảng giá</p>
            <h2 className="mt-2 text-3xl sm:text-4xl">Dịch vụ & giá tham khảo</h2>
          </div>
          <Link to="/dich-vu" className="hidden items-center gap-1.5 text-sm font-semibold text-rose-600 hover:text-rose-700 sm:flex">Xem tất cả <ArrowRight className="h-4 w-4" /></Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((s) => (
            <Link key={s.id} to={`/dat-lich?dichvu=${s.id}`} className="card group flex flex-col justify-between p-6 transition hover:-translate-y-0.5 hover:shadow-lift">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-ink-muted">{s.serviceCategories?.name}</p>
                <h3 className="mt-2 text-xl">{s.name}</h3>
                <p className="mt-2 line-clamp-2 text-sm text-ink-soft">{s.description}</p>
              </div>
              <div className="mt-6 flex items-center justify-between border-t border-line pt-4">
                <span className="flex items-center gap-1.5 text-sm text-ink-muted"><Clock3 className="h-4 w-4" />{minutes(s.durationMinutes)}</span>
                <span className="font-display text-xl font-semibold text-rose-600">{money(s.price)}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------ cách đặt lịch */}
      <section className="bg-cream-deep/70 py-16">
        <div className="container-page">
          <p className="eyebrow text-center">Đơn giản</p>
          <h2 className="mt-2 text-center text-3xl sm:text-4xl">Đặt lịch trong ba bước</h2>
          <ol className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              [MousePointerClick, 'Chọn dịch vụ hoặc mẫu', 'Chọn một hay nhiều dịch vụ; mẫu nail có thể chọn thêm hoặc bỏ qua.'],
              [Sparkles, 'Chọn giờ còn trống', 'Website chỉ hiện những khung giờ tiệm còn chỗ, tính theo thời lượng bạn chọn.'],
              [BadgeCheck, 'Xác nhận và chờ tiệm duyệt', 'Đăng nhập để giữ chỗ. Khi tiệm xác nhận, lịch của bạn sẽ có dấu “Mới cập nhật”.'],
            ].map(([Icon, t, d], i) => (
              <li key={t} className="card relative p-7">
                <span className="absolute right-6 top-5 font-display text-5xl text-rose-100">{i + 1}</span>
                <Icon className="h-7 w-7 text-rose-500" />
                <h3 className="mt-4 text-xl">{t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ------------------------------------------------ mẫu nail */}
      <section className="container-page py-16">
        <div className="mb-8 flex items-end justify-between gap-6">
          <div>
            <p className="eyebrow">Cảm hứng</p>
            <h2 className="mt-2 text-3xl sm:text-4xl">Mẫu nail mới tại tiệm</h2>
          </div>
          <Link to="/mau-nail" className="flex items-center gap-1.5 text-sm font-semibold text-rose-600 hover:text-rose-700">Thư viện mẫu <ArrowRight className="h-4 w-4" /></Link>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {designs.slice(0, 8).map((d) => (
            <Link key={d.id} to={`/mau-nail?mau=${d.id}`} className="group">
              <div className="aspect-[4/3] overflow-hidden rounded-2xl border border-line bg-white">
                <img src={d.imageUrl} alt={d.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" />
              </div>
              <p className="mt-2 font-medium text-plum">{d.name}</p>
              {d.referencePrice != null && <p className="text-sm text-ink-muted">từ {money(d.referencePrice)}</p>}
            </Link>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------ kêu gọi */}
      <section className="container-page">
        <div className="relative overflow-hidden rounded-[32px] bg-plum px-8 py-14 text-center sm:px-16">
          <div className="pointer-events-none absolute -left-16 -top-16 h-64 w-64 rounded-full bg-rose-500/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -right-10 h-72 w-72 rounded-full bg-gold-500/20 blur-3xl" />
          <h2 className="relative text-3xl text-cream sm:text-4xl">Sẵn sàng cho bộ móng mới?</h2>
          <p className="relative mx-auto mt-3 max-w-md text-cream/70">Chọn giờ phù hợp, tiệm giữ chỗ cho bạn. Cần đổi giờ? Gọi {store?.phone ?? 'tiệm'} để được hỗ trợ.</p>
          <Link to="/dat-lich" className="btn relative mt-8 bg-cream px-8 py-3 text-base text-plum hover:bg-white">Đặt lịch ngay <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </section>
    </>
  )
}
