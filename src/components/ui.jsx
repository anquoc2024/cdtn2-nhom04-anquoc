import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { AlertCircle, CheckCircle2, Loader2, X } from 'lucide-react'
import { STATUS } from '../lib/format'

export function Spinner({ className = '' }) {
  return <Loader2 className={`h-5 w-5 animate-spin text-rose-400 ${className}`} aria-label="Đang tải" />
}

export function PageLoader() {
  return <div className="flex min-h-[40vh] items-center justify-center"><Spinner className="h-7 w-7" /></div>
}

export function Field({ label, error, hint, children, required, className = '' }) {
  return (
    <label className={`block ${className}`}>
      {label && <span className="label">{label}{required && <span className="text-rose-500"> *</span>}</span>}
      {children}
      {error ? <span className="mt-1 block text-xs text-red-600">{error}</span>
        : hint ? <span className="mt-1 block text-xs text-ink-muted">{hint}</span> : null}
    </label>
  )
}

export function Input({ error, className = '', ...props }) {
  return <input className={`input ${error ? 'input-error' : ''} ${className}`} aria-invalid={!!error} {...props} />
}

export function Select({ error, className = '', children, ...props }) {
  return <select className={`input ${error ? 'input-error' : ''} ${className}`} aria-invalid={!!error} {...props}>{children}</select>
}

export function Textarea({ error, className = '', ...props }) {
  return <textarea className={`input min-h-[90px] ${error ? 'input-error' : ''} ${className}`} aria-invalid={!!error} {...props} />
}

export function Alert({ tone = 'error', children, className = '' }) {
  if (!children) return null
  const styles = tone === 'error' ? 'border-red-200 bg-red-50 text-red-800'
    : tone === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
      : 'border-amber-200 bg-amber-50 text-amber-900'
  const Icon = tone === 'success' ? CheckCircle2 : AlertCircle
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`flex gap-2.5 rounded-xl border px-4 py-3 text-sm ${styles} ${className}`}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div>{children}</div>
    </div>
  )
}

const TONES = {
  amber: 'bg-amber-50 text-amber-800 ring-amber-200',
  blue: 'bg-sky-50 text-sky-800 ring-sky-200',
  violet: 'bg-violet-50 text-violet-800 ring-violet-200',
  green: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  gray: 'bg-stone-100 text-stone-600 ring-stone-200',
  red: 'bg-red-50 text-red-700 ring-red-200',
  rose: 'bg-rose-50 text-rose-700 ring-rose-200',
}

export function Badge({ tone = 'gray', children, className = '' }) {
  return <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${TONES[tone]} ${className}`}>{children}</span>
}

export function StatusBadge({ status }) {
  const s = STATUS[status] ?? { label: status, tone: 'gray' }
  return <Badge tone={s.tone}>{s.label}</Badge>
}

export function Empty({ icon: Icon, title, children, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-white/60 px-6 py-14 text-center">
      {Icon && <Icon className="mb-3 h-8 w-8 text-rose-300" />}
      <p className="font-display text-lg text-plum">{title}</p>
      {children && <p className="mt-1 max-w-sm text-sm text-ink-muted">{children}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function Modal({ open, onClose, title, children, footer, wide = false }) {
  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-plum/40 p-0 backdrop-blur-[2px] sm:items-center sm:p-6" onMouseDown={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title}
        className={`max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-lift sm:rounded-3xl ${wide ? 'sm:max-w-3xl' : 'sm:max-w-lg'}`}
        onMouseDown={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-white/95 px-6 py-4 backdrop-blur">
          <h2 className="text-xl">{title}</h2>
          <button type="button" className="btn-ghost -mr-2 rounded-full p-2" onClick={onClose} aria-label="Đóng"><X className="h-5 w-5" /></button>
        </div>
        <div className="px-6 py-5">{children}</div>
        {footer && <div className="sticky bottom-0 flex flex-wrap justify-end gap-2 border-t border-line bg-white px-6 py-4">{footer}</div>}
      </div>
    </div>
  )
}

export function Pagination({ page, limit, total, onPage }) {
  const pages = Math.max(1, Math.ceil(total / limit))
  if (pages <= 1) return null
  return (
    <div className="mt-6 flex items-center justify-between text-sm text-ink-muted">
      <span>Trang {page}/{pages} · {total} mục</span>
      <div className="flex gap-2">
        <button className="btn-outline btn-sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>Trước</button>
        <button className="btn-outline btn-sm" disabled={page >= pages} onClick={() => onPage(page + 1)}>Sau</button>
      </div>
    </div>
  )
}

export function PageTitle({ eyebrow, title, children, actions }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h1 className="text-3xl sm:text-4xl">{title}</h1>
        {children && <p className="mt-2 max-w-2xl text-ink-soft">{children}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

// ---------------------------------------------------------------- thông báo nhanh
const ToastContext = createContext(() => {})

export function ToastProvider({ children }) {
  const [items, setItems] = useState([])
  const push = useCallback((message, tone = 'success') => {
    const id = Math.random()
    setItems((xs) => [...xs, { id, message, tone }])
    setTimeout(() => setItems((xs) => xs.filter((x) => x.id !== id)), 3800)
  }, [])
  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={`pointer-events-auto flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium shadow-lift ${t.tone === 'error' ? 'bg-red-700 text-white' : 'bg-plum text-cream'}`}>
            {t.tone === 'error' ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}{t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
