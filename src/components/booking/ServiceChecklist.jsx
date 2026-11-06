import { Check } from 'lucide-react'
import { money, minutes } from '../../lib/format'

/** Danh sách dịch vụ theo danh mục, chọn nhiều (FR05: ít nhất 1 dịch vụ) */
export default function ServiceChecklist({ services, selected, onToggle, compact = false }) {
  const groups = services.reduce((acc, s) => {
    const k = s.serviceCategories?.name ?? 'Khác'
    ;(acc[k] ??= []).push(s)
    return acc
  }, {})
  return (
    <div className="space-y-6">
      {Object.entries(groups).map(([cat, list]) => (
        <div key={cat}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-muted">{cat}</p>
          <div className={`grid gap-2 ${compact ? '' : 'sm:grid-cols-2'}`}>
            {list.map((s) => {
              const on = selected.includes(s.id)
              return (
                <button key={s.id} type="button" onClick={() => onToggle(s.id)} aria-pressed={on}
                  className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition ${on ? 'border-rose-400 bg-rose-50/70 ring-1 ring-rose-300' : 'border-line bg-white hover:border-rose-200'}`}>
                  <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${on ? 'border-rose-500 bg-rose-500 text-white' : 'border-line bg-white'}`}>
                    {on && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                  </span>
                  <span className="flex-1">
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="font-medium text-plum">{s.name}</span>
                      <span className="whitespace-nowrap text-sm font-semibold text-rose-600">{money(s.price)}</span>
                    </span>
                    <span className="mt-0.5 block text-xs text-ink-muted">{minutes(s.durationMinutes)}{s.description && !compact ? ` · ${s.description}` : ''}</span>
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
