import { bookingRepo } from '../repositories/bookingRepo'
import { catalogRepo } from '../repositories/catalogRepo'
import { userRepo } from '../repositories/userRepo'
import { attempt, unwrap, AppError, toCode } from './errors'
import { camel } from './mapper'
import { check, isBlank, isDuration, isPhone, isPrice } from '../lib/validators'
import { addDays, todayVN } from '../lib/format'

const PAGE = 20
const dayStart = (ymd) => `${ymd}T00:00:00+07:00`

function serviceRow(d) {
  const fields = check([
    ['name', !isBlank(d.name) && d.name.trim().length <= 150, 'Nhập tên dịch vụ (tối đa 150 ký tự)'],
    ['categoryId', !!d.categoryId, 'Chọn danh mục'],
    ['durationMinutes', isDuration(d.durationMinutes), 'Thời lượng 15–240 phút, bội số 15'],
    ['price', isPrice(d.price), 'Giá > 0, bội số 1.000đ'],
  ])
  if (Object.keys(fields).length) throw new AppError('VALIDATION_ERROR', fields)
  return {
    name: d.name.trim(), category_id: Number(d.categoryId), description: d.description?.trim() || null,
    duration_minutes: Number(d.durationMinutes), price: Number(d.price), image_url: d.imageUrl || null,
    is_active: d.isActive ?? true,
  }
}

/** Xóa; nếu bị khóa ngoại chặn (đã có lịch hẹn) thì ẩn – BR10 */
async function deleteOrHide(del, hide) {
  const res = await del()
  if (!res.error) return { deleted: true }
  if (toCode(res.error) !== 'IN_USE') throw res.error
  unwrap(await hide())
  return { deleted: false, hidden: true }
}

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

  // ---------------------------------------------------------- dịch vụ (FR10, FR11)
  getAllServices: () => attempt(async () => camel(unwrap(await catalogRepo.services({ all: true })))),
  getServiceCategories: () => attempt(async () => camel(unwrap(await catalogRepo.serviceCategories(true)))),
  createService: (d) => attempt(async () => camel(unwrap(await catalogRepo.insertService(serviceRow(d))))),
  updateService: (id, d) =>
    attempt(async () => {
      const row = serviceRow(d)
      delete row.price                                   // giá đổi qua updatePrice để ghi lịch sử
      return camel(unwrap(await catalogRepo.updateService(id, row)))
    }),
  setServiceActive: (id, isActive) => attempt(async () => camel(unwrap(await catalogRepo.updateService(id, { is_active: isActive })))),
  deleteService: (id) =>
    attempt(() => deleteOrHide(() => catalogRepo.deleteService(id), () => catalogRepo.updateService(id, { is_active: false }))),
  updatePrice: (id, oldPrice, newPrice) =>
    attempt(async () => {
      if (!isPrice(newPrice)) throw new AppError('INVALID_PRICE', { price: 'Giá > 0, bội số 1.000đ' })
      const s = camel(unwrap(await catalogRepo.updateService(id, { price: Number(newPrice) })))
      return { serviceId: id, oldPrice, newPrice: s.price, changedAt: s.updatedAt }
    }),
  getPriceHistory: (id) => attempt(async () => camel(unwrap(await catalogRepo.priceHistory(id)))),
  saveServiceCategory: ({ id, name, sortOrder = 0, isActive = true }) =>
    attempt(async () => {
      if (isBlank(name)) throw new AppError('VALIDATION_ERROR', { name: 'Nhập tên danh mục' })
      const row = { name: name.trim(), sort_order: Number(sortOrder) || 0, is_active: isActive }
      return camel(unwrap(await (id ? catalogRepo.updateServiceCategory(id, row) : catalogRepo.insertServiceCategory(row))))
    }),
  deleteServiceCategory: (id) =>
    attempt(() => deleteOrHide(() => catalogRepo.deleteServiceCategory(id), () => catalogRepo.updateServiceCategory(id, { is_active: false }))),

}
