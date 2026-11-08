import { bookingRepo } from '../repositories/bookingRepo'
import { catalogRepo } from '../repositories/catalogRepo'
import { attempt, unwrap, AppError, toCode } from './errors'
import { camel } from './mapper'
import { check, isBlank, isDuration, isPhone, isPrice } from '../lib/validators'
import { addDays, todayVN } from '../lib/format'

const PAGE = 20
const dayStart = (ymd) => `${ymd}T00:00:00+07:00`

export const adminService = {
  // ---------------------------------------------------------- lịch hẹn (FR13, FR14, FR20, FR22)
  getBookings: ({ date, status, q, page = 1 }) =>
    attempt(async () => {
      const { data, error, count } = await bookingRepo.list({
        from: date ? dayStart(date) : undefined, to: date ? dayStart(addDays(date, 1)) : undefined,
        status: status || undefined, q: q?.trim() || undefined, page, limit: PAGE,
      })
      if (error) throw error
      return { items: camel(data), page, limit: PAGE, total: count ?? 0 }
    }),

  getBookingSummary: () =>
    attempt(async () => {
      const today = todayVN()
      const [all, pending, confirmed, done] = await Promise.all([
        bookingRepo.countByStatus(null, dayStart(today), dayStart(addDays(today, 1))),
        bookingRepo.countByStatus('pending'),
        bookingRepo.countByStatus('confirmed', dayStart(today), dayStart(addDays(today, 1))),
        bookingRepo.countByStatus('completed', dayStart(today), dayStart(addDays(today, 1))),
      ])
      for (const r of [all, pending, confirmed, done]) if (r.error) throw r.error
      return { today: all.count, pending: pending.count, confirmedToday: confirmed.count, completedToday: done.count }
    }),

  getBooking: (id) => attempt(async () => camel(unwrap(await bookingRepo.one(id)))),

  changeStatus: (id, status, reason) =>
    attempt(async () => {
      if (['rejected', 'cancelled'].includes(status) && isBlank(reason)) throw new AppError('REASON_REQUIRED', { reason: 'Nhập lý do' })
      return unwrap(await bookingRepo.changeStatus(id, status, reason?.trim()))
    }),

  getSlotsFor: (date, serviceIds, excludeBookingId) =>
    attempt(async () => unwrap(await bookingRepo.freeSlots(date, serviceIds, excludeBookingId))),

  rescheduleBooking: (id, newStartAt) => attempt(async () => unwrap(await bookingRepo.reschedule(id, newStartAt))),

}
