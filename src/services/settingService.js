import { settingRepo } from '../repositories/settingRepo'
import { bookingRepo } from '../repositories/bookingRepo'
import { attempt, unwrap, AppError } from './errors'
import { camel } from './mapper'
import { check, isBlank, isPhone } from '../lib/validators'
import { addDays, todayVN, timeText } from '../lib/format'

// FR16, FR19 – UC16, UC17
export const settingService = {
  getSettings: () => attempt(async () => camel(unwrap(await settingRepo.get()))),

  updateSettings: (userId, d) =>
    attempt(async () => {
      const fields = check([
        ['storeName', !isBlank(d.storeName), 'Nhập tên cửa hàng'],
        ['address', !isBlank(d.address), 'Nhập địa chỉ'],
        ['phone', isPhone(d.phone), 'SĐT gồm 10 số, bắt đầu bằng 0'],
        ['closeTime', d.openTime < d.closeTime, 'Giờ đóng cửa phải sau giờ mở cửa'],
        ['capacityPerSlot', Number(d.capacityPerSlot) >= 1 && Number(d.capacityPerSlot) <= 20, 'Số chỗ từ 1 đến 20'],
      ])
      if (Object.keys(fields).length) throw new AppError('VALIDATION_ERROR', fields)
      return camel(unwrap(await settingRepo.update({
        store_name: d.storeName.trim(), address: d.address.trim(), phone: d.phone.trim(),
        open_time: d.openTime, close_time: d.closeTime, capacity_per_slot: Number(d.capacityPerSlot),
        closed_weekdays: d.closedWeekdays ?? [], banner_url: d.bannerUrl || null, intro: d.intro?.trim() || null,
        updated_by: userId,
      })))
    }),

  getBlockedSlots: () => attempt(async () => camel(unwrap(await settingRepo.blocked(todayVN())))),

  /** Thêm mục chặn; trả kèm các lịch đang có trong khoảng chặn để quản trị viên liên hệ khách (BR12) */
  addBlockedSlot: (userId, d) =>
    attempt(async () => {
      const wholeDay = !d.startTime && !d.endTime
      const fields = check([
        ['startDate', !!d.startDate, 'Chọn ngày bắt đầu'],
        ['endDate', !!d.endDate && d.endDate >= d.startDate, 'Ngày kết thúc phải từ ngày bắt đầu trở đi'],
        ['endTime', wholeDay || (d.startTime && d.endTime && d.endTime > d.startTime), 'Giờ kết thúc phải sau giờ bắt đầu'],
        ['reason', !isBlank(d.reason), 'Nhập lý do'],
      ])
      if (Object.keys(fields).length) throw new AppError('VALIDATION_ERROR', fields)
      const saved = camel(unwrap(await settingRepo.addBlocked({
        start_date: d.startDate, end_date: d.endDate, start_time: wholeDay ? null : d.startTime,
        end_time: wholeDay ? null : d.endTime, reason: d.reason.trim(), created_by: userId,
      })))
      const from = `${d.startDate}T${wholeDay ? '00:00' : d.startTime}:00+07:00`
      const to = wholeDay ? `${addDays(d.endDate, 1)}T00:00:00+07:00` : `${d.endDate}T${d.endTime}:00+07:00`
      const affected = camel(unwrap(await bookingRepo.overlapping(from, to)))
        .filter((b) => wholeDay || (timeText(b.startAt) < d.endTime && timeText(b.endAt) > d.startTime))
      return { blocked: saved, affected }
    }),

  removeBlockedSlot: (id) => attempt(async () => unwrap(await settingRepo.removeBlocked(id))),
}
