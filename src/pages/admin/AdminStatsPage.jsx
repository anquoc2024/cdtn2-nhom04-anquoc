import { useEffect, useState } from 'react'
import { statsService } from '../../services/statsService'
import { STATUS, money, todayVN } from '../../lib/format'
import { Alert, Field, Input, PageLoader, PageTitle } from '../../components/ui'

const BAR = { pending: 'bg-amber-400', confirmed: 'bg-sky-400', in_progress: 'bg-violet-400', completed: 'bg-emerald-500', cancelled: 'bg-stone-300', rejected: 'bg-red-400' }

// MH10 – Thống kê (UC15, FR15)
export default function AdminStatsPage() {
  const today = todayVN()
  const [range, setRange] = useState({ from: `${today.slice(0, 8)}01`, to: today })
  const [state, setState] = useState({ loading: true, data: null, error: null })
  const load = () => statsService.getStats(range.from, range.to).then((r) => setState({ loading: false, data: r.data, error: r.error }))
  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const d = state.data
  const max = Math.max(1, ...(d?.daily ?? []).map((x) => x.count))
  const cancelled = (d?.byStatus?.cancelled ?? 0) + (d?.byStatus?.rejected ?? 0)
  return (
    <>
      <PageTitle eyebrow="Quản trị" title="Thống kê hoạt động" />
      <form className="card mb-6 flex flex-wrap items-end gap-3 p-4" onSubmit={(e) => { e.preventDefault(); setState((s) => ({ ...s, loading: true })); load() }}>
        <Field label="Từ ngày"><Input type="date" value={range.from} onChange={(e) => setRange({ ...range, from: e.target.value })} /></Field>
        <Field label="Đến ngày"><Input type="date" value={range.to} onChange={(e) => setRange({ ...range, to: e.target.value })} /></Field>
        <button className="btn-dark">Xem</button>
      </form>
      <Alert>{state.error?.message}</Alert>
      {state.loading ? <PageLoader /> : d && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[['Tổng lịch hẹn', d.totalBookings], ['Hoàn thành', d.byStatus.completed ?? 0], ['Hủy / từ chối', cancelled], ['Doanh thu (lịch hoàn thành)', money(d.revenue)]].map(([l, v]) => (
              <div key={l} className="card p-5"><p className="text-xs text-ink-muted">{l}</p><p className="mt-1 font-display text-3xl text-plum">{v}</p></div>
            ))}
          </div>
          <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
            <section className="card p-6">
              <h2 className="mb-4 text-lg">Số lịch hẹn theo ngày</h2>
              {d.daily.length === 0 ? <p className="text-sm text-ink-muted">Không có lịch trong khoảng này.</p> : (
                <div className="flex h-48 items-end gap-1">
                  {d.daily.map((x) => (
                    <div key={x.date} className="group flex h-full flex-1 flex-col items-center justify-end" title={`${x.date}: ${x.count} lịch`}>
                      <span className="mb-1 text-[10px] text-ink-muted opacity-0 group-hover:opacity-100">{x.count}</span>
                      <div className="w-full rounded-t-md bg-rose-400" style={{ height: `${(x.count / max) * 85}%` }} />
                      <span className="mt-1 text-[10px] text-ink-muted">{x.date.slice(8)}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>
            <section className="card p-6">
              <h2 className="mb-4 text-lg">Theo trạng thái</h2>
              <ul className="space-y-3 text-sm">
                {Object.entries(STATUS).map(([k, v]) => {
                  const n = d.byStatus[k] ?? 0
                  return (
                    <li key={k}>
                      <div className="mb-1 flex justify-between"><span>{v.label}</span><span className="font-semibold">{n}</span></div>
                      <div className="h-2 rounded-full bg-cream-deep"><div className={`h-2 rounded-full ${BAR[k]}`} style={{ width: `${d.totalBookings ? (n / d.totalBookings) * 100 : 0}%` }} /></div>
                    </li>
                  )
                })}
              </ul>
            </section>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <section className="card p-6">
              <h2 className="mb-3 text-lg">Top 5 dịch vụ (lịch hoàn thành)</h2>
              <table className="w-full text-sm"><tbody className="divide-y divide-line">
                {d.topServices.length === 0 && <tr><td className="py-2 text-ink-muted">Chưa có dữ liệu</td></tr>}
                {d.topServices.map((s, i) => <tr key={s.name}><td className="py-2 text-ink-muted">{i + 1}</td><td className="py-2">{s.name}</td><td className="py-2 text-right">{s.count} lượt</td><td className="py-2 text-right font-semibold">{money(s.revenue)}</td></tr>)}
              </tbody></table>
            </section>
            <section className="card p-6">
              <h2 className="mb-3 text-lg">Top 5 mẫu nail được chọn</h2>
              <table className="w-full text-sm"><tbody className="divide-y divide-line">
                {d.topDesigns.length === 0 && <tr><td className="py-2 text-ink-muted">Chưa có dữ liệu</td></tr>}
                {d.topDesigns.map((s, i) => <tr key={s.name}><td className="py-2 text-ink-muted">{i + 1}</td><td className="py-2">{s.name}</td><td className="py-2 text-right">{s.count} lượt</td></tr>)}
              </tbody></table>
            </section>
          </div>
        </div>
      )}
    </>
  )
}
