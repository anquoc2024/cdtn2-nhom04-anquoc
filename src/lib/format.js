export const TZ = 'Asia/Ho_Chi_Minh'

export function money(v) {
  if (v === null || v === undefined || v === '') return '—'
  return new Intl.NumberFormat('vi-VN').format(Number(v)) + 'đ'
}

export function minutes(m) {
  if (!m) return ''
  const h = Math.floor(m / 60)
  const r = m % 60
  return h ? `${h} giờ${r ? ` ${r} phút` : ''}` : `${r} phút`
}

const dateFmt = new Intl.DateTimeFormat('vi-VN', { timeZone: TZ, weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })
const timeFmt = new Intl.DateTimeFormat('vi-VN', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false })
const longFmt = new Intl.DateTimeFormat('vi-VN', { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long' })

export const dateText = (iso) => (iso ? dateFmt.format(new Date(iso)) : '')
export const timeText = (iso) => (iso ? timeFmt.format(new Date(iso)) : '')
export const longDateText = (iso) => (iso ? longFmt.format(new Date(iso)) : '')
export const rangeText = (a, b) => `${timeText(a)}–${timeText(b)}`

/** Ngày hôm nay theo giờ Việt Nam, dạng YYYY-MM-DD */
export function todayVN(offsetDays = 0) {
  const d = new Date(Date.now() + offsetDays * 86400000)
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(d)
}

/** Ghép ngày YYYY-MM-DD và giờ HH:MM (giờ VN) thành ISO có múi giờ +07:00 */
export const toIsoVN = (date, hhmm) => `${date}T${hhmm}:00+07:00`

export function addDays(ymd, n) {
  const [y, m, d] = ymd.split('-').map(Number)
  const t = new Date(Date.UTC(y, m - 1, d + n))
  return t.toISOString().slice(0, 10)
}

export function weekdayOf(ymd) {
  const [y, m, d] = ymd.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay()
}

export const STATUS = {
  pending: { label: 'Chờ xác nhận', tone: 'amber' },
  confirmed: { label: 'Đã xác nhận', tone: 'blue' },
  in_progress: { label: 'Đang thực hiện', tone: 'violet' },
  completed: { label: 'Hoàn thành', tone: 'green' },
  cancelled: { label: 'Đã hủy', tone: 'gray' },
  rejected: { label: 'Từ chối', tone: 'red' },
}
