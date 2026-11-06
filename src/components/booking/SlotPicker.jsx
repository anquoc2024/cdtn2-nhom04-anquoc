import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react'
import { addDays, todayVN, weekdayOf } from '../../lib/format'
import { Spinner, Alert } from '../ui'

const WD = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

/**
 * Chọn ngày (dải 31 ngày) và khung giờ còn chỗ (FR06, UC06).
 * loadSlots(date) phải trả { data: { slots: [{ start, end, startAt, remaining }] } } hoặc { error }.
 */
export default function SlotPicker({ date, onDate, value, onChange, loadSlots, closedWeekdays = [], days = 31, reloadKey }) {
  const [state, setState] = useState({ loading: false, slots: [], error: null })
  const [offset, setOffset] = useState(0)
  const dates = useMemo(() => Array.from({ length: days }, (_, i) => addDays(todayVN(), i)), [days])
  const visible = dates.slice(offset, offset + 7)

  useEffect(() => {
    if (!date) return
    let alive = true
    setState({ loading: true, slots: [], error: null })
    loadSlots(date).then((r) => {
      if (!alive) return
      setState({ loading: false, slots: r.data?.slots ?? [], error: r.error ?? null })
    })
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, reloadKey])

  const groups = [
    ['Buổi sáng', (s) => s.start < '12:00'],
    ['Buổi chiều', (s) => s.start >= '12:00' && s.start < '17:00'],
    ['Buổi tối', (s) => s.start >= '17:00'],
  ]

  return (
    <div>
      <div className="flex items-center gap-2">
        <button type="button" className="btn-outline btn-sm rounded-full p-2" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - 7))} aria-label="Tuần trước"><ChevronLeft className="h-4 w-4" /></button>
        <div className="grid flex-1 grid-cols-7 gap-1.5">
          {visible.map((d) => {
            const closed = closedWeekdays.includes(weekdayOf(d))
            const on = d === date
            return (
              <button key={d} type="button" disabled={closed}
                onClick={() => { onDate(d); onChange(null) }}
                className={`flex flex-col items-center rounded-2xl border px-1 py-2.5 text-center transition
                  ${on ? 'border-plum bg-plum text-cream shadow-card' : 'border-line bg-white hover:border-rose-200'}
                  ${closed ? 'cursor-not-allowed opacity-40 line-through' : ''}`}>
                <span className={`text-[11px] font-medium ${on ? 'text-cream/70' : 'text-ink-muted'}`}>{d === todayVN() ? 'H.nay' : WD[weekdayOf(d)]}</span>
                <span className="font-display text-lg leading-tight">{Number(d.slice(8))}</span>
                <span className={`text-[10px] ${on ? 'text-cream/60' : 'text-ink-muted'}`}>th{Number(d.slice(5, 7))}</span>
              </button>
            )
          })}
        </div>
        <button type="button" className="btn-outline btn-sm rounded-full p-2" disabled={offset + 7 >= dates.length} onClick={() => setOffset(offset + 7)} aria-label="Tuần sau"><ChevronRight className="h-4 w-4" /></button>
      </div>

      <div className="mt-6">
        {!date && <p className="text-sm text-ink-muted">Chọn một ngày để xem giờ còn trống.</p>}
        {state.loading && <div className="flex justify-center py-8"><Spinner /></div>}
        {state.error && <Alert>{state.error.message}</Alert>}
        {date && !state.loading && !state.error && state.slots.length === 0 && (
          <Alert tone="warning">Ngày này không còn khung giờ trống (tiệm nghỉ, đã kín lịch hoặc đã quá giờ). Bạn chọn ngày khác nhé.</Alert>
        )}
        {!state.loading && state.slots.length > 0 && (
          <div className="space-y-5">
            {groups.map(([label, fn]) => {
              const list = state.slots.filter(fn)
              if (!list.length) return null
              return (
                <div key={label}>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-muted">{label}</p>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                    {list.map((s) => {
                      const on = value?.startAt === s.startAt
                      return (
                        <button key={s.start} type="button" onClick={() => onChange(s)}
                          className={`rounded-xl border px-2 py-2.5 text-sm transition ${on ? 'border-rose-500 bg-rose-500 font-semibold text-white shadow-card' : 'border-line bg-white hover:border-rose-300'}`}>
                          <span className="block">{s.start}</span>
                          <span className={`block text-[11px] ${on ? 'text-white/80' : 'text-ink-muted'}`}>{s.remaining <= 1 ? 'còn 1 chỗ' : `đến ${s.end}`}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
            <p className="flex items-center gap-1.5 text-xs text-ink-muted"><Clock className="h-3.5 w-3.5" />Thời lượng được tính theo tổng các dịch vụ, làm tròn lên 30 phút.</p>
          </div>
        )}
      </div>
    </div>
  )
}
