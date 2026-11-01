import { bookingRepo } from '../repositories/bookingRepo'
import { attempt, unwrap, AppError } from './errors'
import { camel } from './mapper'
import { isBlank } from '../lib/validators'

const ACTIVE = ['pending', 'confirmed', 'in_progress']

// FR05–FR08, FR18, FR23 – UC05–UC08
export const bookingService = {
  getFreeSlots: (date, serviceIds) =>
    attempt(async () => {
      if (!serviceIds?.length) throw new AppError('VALIDATION_ERROR', { services: 'Chọn ít nhất 1 dịch vụ' })
      return unwrap(await bookingRepo.freeSlots(date, serviceIds))
    }),

  createBooking: ({ serviceIds, designId, startAt, note }) =>
    attempt(async () => {
      const fields = {}
      if (!serviceIds?.length) fields.services = 'Chọn ít nhất 1 dịch vụ'
      if (!startAt) fields.slot = 'Chọn ngày và giờ hẹn'
      if ((note ?? '').length > 500) fields.note = 'Ghi chú tối đa 500 ký tự'
      if (Object.keys(fields).length) throw new AppError('VALIDATION_ERROR', fields)
      return unwrap(await bookingRepo.create({ p_service_ids: serviceIds, p_design_id: designId ?? null, p_start_at: startAt, p_note: note || null }))
    }),

  /** tab = 'upcoming' | 'history'; mỗi lịch có cờ isUpdated (FR23) */
  getMyBookings: (userId, tab = 'upcoming') =>
    attempt(async () => {
      const all = camel(unwrap(await bookingRepo.mine(userId)))
      const now = Date.now()
      const upcoming = (b) => ACTIVE.includes(b.status) && new Date(b.endAt).getTime() > now
      const list = all.filter((b) => (tab === 'upcoming' ? upcoming(b) : !upcoming(b)))
      if (tab === 'upcoming') list.sort((a, b) => new Date(a.startAt) - new Date(b.startAt))
      return list.map((b) => ({ ...b, isUpdated: !b.userSeenAt && (b.status !== 'pending' || b.source === 'store') }))
    }),

  getMyBooking: (id) =>
    attempt(async () => {
      const b = camel(unwrap(await bookingRepo.one(id)))
      if (!b.userSeenAt) await bookingRepo.markSeen(id)
      return b
    }),

  countUpdated: (userId) =>
    attempt(async () => {
      const all = camel(unwrap(await bookingRepo.mine(userId)))
      return all.filter((b) => !b.userSeenAt && (b.status !== 'pending' || b.source === 'store')).length
    }),

  cancelMyBooking: (id, reason) =>
    attempt(async () => {
      if (isBlank(reason)) throw new AppError('REASON_REQUIRED', { reason: 'Vui lòng nhập lý do hủy' })
      return unwrap(await bookingRepo.cancelMine(id, reason.trim()))
    }),
}
