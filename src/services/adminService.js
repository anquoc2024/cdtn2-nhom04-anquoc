import { bookingRepo } from '../repositories/bookingRepo'
import { catalogRepo } from '../repositories/catalogRepo'
import { userRepo } from '../repositories/userRepo'
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

  createBookingForCustomer: ({ customer, serviceIds, designId, startAt, note }) =>
    attempt(async () => {
      const fields = check([
        ['fullName', customer.userId || !isBlank(customer.fullName), 'Nhập họ tên khách'],
        ['phone', customer.userId || isPhone(customer.phone), 'SĐT gồm 10 số, bắt đầu bằng 0'],
        ['services', serviceIds?.length > 0, 'Chọn ít nhất 1 dịch vụ'],
        ['slot', !!startAt, 'Chọn ngày giờ'],
      ])
      if (Object.keys(fields).length) throw new AppError('VALIDATION_ERROR', fields)
      return unwrap(await bookingRepo.adminCreate({
        p_user_id: customer.userId ?? null, p_customer_name: customer.fullName?.trim() || null,
        p_customer_phone: customer.phone?.trim() || null, p_service_ids: serviceIds,
        p_design_id: designId ?? null, p_start_at: startAt, p_note: note || null,
      }))
    }),

  getSlotsFor: (date, serviceIds, excludeBookingId) =>
    attempt(async () => unwrap(await bookingRepo.freeSlots(date, serviceIds, excludeBookingId))),

  rescheduleBooking: (id, newStartAt) => attempt(async () => unwrap(await bookingRepo.reschedule(id, newStartAt))),

  findCustomerByPhone: (phone) => attempt(async () => camel(unwrap(await userRepo.findByPhone(phone.trim())))),

}
