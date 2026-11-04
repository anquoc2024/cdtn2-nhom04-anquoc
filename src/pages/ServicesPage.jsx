import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Clock3, Plus } from 'lucide-react'
import { catalogService } from '../services/catalogService'
import { money, minutes } from '../lib/format'
import { PageTitle, PageLoader, Alert, Empty } from '../components/ui'

// MH02 – Dịch vụ và bảng giá (UC03, FR03)
export default function ServicesPage() {
  const [cats, setCats] = useState([])
  const [cat, setCat] = useState(null)
  const [state, setState] = useState({ loading: true, items: [], error: null })

  useEffect(() => { catalogService.getServiceCategories().then((r) => setCats(r.data ?? [])) }, [])
  useEffect(() => {
    setState((s) => ({ ...s, loading: true }))
    catalogService.getServices(cat).then((r) => setState({ loading: false, items: r.data ?? [], error: r.error }))
  }, [cat])

  const groups = state.items.reduce((acc, s) => { (acc[s.serviceCategories?.name ?? 'Khác'] ??= []).push(s); return acc }, {})

  return (
    <div className="container-page py-12">
      <PageTitle eyebrow="Bảng giá" title="Dịch vụ tại tiệm">
        Giá đã gồm công và vật liệu cơ bản. Bạn có thể chọn nhiều dịch vụ trong một lần hẹn – thời gian được tính tự động.
      </PageTitle>
      <div className="mb-8 flex flex-wrap gap-2">
        <button className={`chip ${!cat ? 'chip-on' : ''}`} onClick={() => setCat(null)}>Tất cả</button>
        {cats.map((c) => <button key={c.id} className={`chip ${cat === c.id ? 'chip-on' : ''}`} onClick={() => setCat(c.id)}>{c.name}</button>)}
      </div>
      <Alert>{state.error?.message}</Alert>
      {state.loading ? <PageLoader /> : state.items.length === 0 ? <Empty title="Chưa có dịch vụ" /> : (
        <div className="grid gap-8 lg:grid-cols-2">
          {Object.entries(groups).map(([name, list]) => (
            <section key={name} className="card p-6 sm:p-8">
              <h2 className="text-2xl">{name}</h2>
              <ul className="mt-4 divide-y divide-line">
                {list.map((s) => (
                  <li key={s.id} className="flex items-start gap-4 py-4">
                    <div className="flex-1">
                      <div className="flex items-baseline gap-3">
                        <h3 className="font-sans text-base font-semibold text-plum">{s.name}</h3>
                        <span className="flex-1 border-b border-dotted border-line" />
                        <span className="font-display text-lg font-semibold text-rose-600">{money(s.price)}</span>
                      </div>
                      <p className="mt-1 text-sm text-ink-soft">{s.description}</p>
                      <p className="mt-1 flex items-center gap-1 text-xs text-ink-muted"><Clock3 className="h-3.5 w-3.5" />{minutes(s.durationMinutes)}</p>
                    </div>
                    <Link to={`/dat-lich?dichvu=${s.id}`} className="btn-outline btn-sm mt-1 shrink-0" aria-label={`Đặt lịch ${s.name}`}><Plus className="h-3.5 w-3.5" />Đặt</Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
