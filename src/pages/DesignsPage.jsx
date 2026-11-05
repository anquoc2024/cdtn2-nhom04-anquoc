import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Clock3, Sparkles } from 'lucide-react'
import { catalogService } from '../services/catalogService'
import { money, minutes } from '../lib/format'
import { PageTitle, PageLoader, Alert, Empty, Modal, Pagination, Spinner } from '../components/ui'

// MH03 – Thư viện mẫu nail (UC04, FR04): lọc theo danh mục, 8 mẫu mỗi trang, xem chi tiết
export default function DesignsPage() {
  const [params, setParams] = useSearchParams()
  const [cats, setCats] = useState([])
  const cat = params.get('loai') ? Number(params.get('loai')) : null
  const page = Number(params.get('trang') ?? 1)
  const openId = params.get('mau') ? Number(params.get('mau')) : null
  const [state, setState] = useState({ loading: true, data: null, error: null })
  const [detail, setDetail] = useState(null)

  useEffect(() => { catalogService.getDesignCategories().then((r) => setCats(r.data ?? [])) }, [])
  useEffect(() => {
    setState((s) => ({ ...s, loading: true }))
    catalogService.getDesigns(cat, page).then((r) => setState({ loading: false, data: r.data, error: r.error }))
  }, [cat, page])
  useEffect(() => {
    setDetail(null)
    if (openId) catalogService.getDesign(openId).then((r) => setDetail(r.data ?? { error: r.error }))
  }, [openId])

  const setParam = (k, v) => {
    const p = new URLSearchParams(params)
    if (v) p.set(k, v); else p.delete(k)
    if (k === 'loai') p.delete('trang')
    setParams(p)
  }

  return (
    <div className="container-page py-12">
      <PageTitle eyebrow="Thư viện" title="Mẫu nail">Chọn mẫu bạn thích để đặt lịch – các dịch vụ cần làm sẽ được chọn sẵn. Giá là giá tham khảo, thợ sẽ báo lại nếu bạn muốn chỉnh mẫu.</PageTitle>
      <div className="mb-8 flex flex-wrap gap-2">
        <button className={`chip ${!cat ? 'chip-on' : ''}`} onClick={() => setParam('loai', null)}>Tất cả</button>
        {cats.map((c) => <button key={c.id} className={`chip ${cat === c.id ? 'chip-on' : ''}`} onClick={() => setParam('loai', c.id)}>{c.name}</button>)}
      </div>
      <Alert>{state.error?.message}</Alert>
      {state.loading ? <PageLoader /> : !state.data?.items.length ? <Empty icon={Sparkles} title="Chưa có mẫu trong mục này" /> : (
        <>
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
            {state.data.items.map((d) => (
              <button key={d.id} className="group text-left" onClick={() => setParam('mau', d.id)}>
                <div className="aspect-[4/3] overflow-hidden rounded-2xl border border-line bg-white shadow-card">
                  <img src={d.imageUrl} alt={d.name} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                </div>
                <p className="mt-3 text-xs uppercase tracking-wider text-ink-muted">{d.designCategories?.name}</p>
                <p className="font-medium text-plum">{d.name}</p>
                {d.referencePrice != null && <p className="text-sm text-rose-600">từ {money(d.referencePrice)}</p>}
              </button>
            ))}
          </div>
          <Pagination page={page} limit={state.data.limit} total={state.data.total} onPage={(p) => setParam('trang', p)} />
        </>
      )}

      <Modal open={!!openId} onClose={() => setParam('mau', null)} title={detail?.name ?? 'Chi tiết mẫu'} wide
        footer={detail && !detail.error && (
          <Link to={`/dat-lich?mau=${detail.id}`} className="btn-primary">Đặt lịch với mẫu này</Link>
        )}>
        {!detail ? <div className="flex justify-center py-10"><Spinner /></div> : detail.error ? <Alert>{detail.error.message}</Alert> : (
          <div className="grid gap-6 md:grid-cols-[1.2fr_1fr]">
            <img src={detail.imageUrl} alt={detail.name} className="w-full rounded-2xl border border-line" />
            <div>
              <p className="eyebrow">{detail.designCategories?.name}</p>
              <p className="mt-3 text-ink-soft">{detail.description}</p>
              {detail.referencePrice != null && <p className="mt-4 font-display text-2xl text-rose-600">từ {money(detail.referencePrice)}</p>}
              <p className="mt-6 text-sm font-semibold text-plum">Dịch vụ đi kèm</p>
              <ul className="mt-2 space-y-2">
                {detail.services.map((s) => (
                  <li key={s.id} className="flex items-center justify-between rounded-xl bg-cream px-3 py-2 text-sm">
                    <span>{s.name}<span className="ml-2 inline-flex items-center gap-1 text-xs text-ink-muted"><Clock3 className="h-3 w-3" />{minutes(s.durationMinutes)}</span></span>
                    <span className="font-semibold">{money(s.price)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
