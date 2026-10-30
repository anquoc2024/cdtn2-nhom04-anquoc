import { describe, it, expect } from 'vitest'
import { toCode, fail, AppError, MESSAGES } from './errors'

describe('toCode – chuẩn hóa lỗi', () => {
  it('đọc mã nghiệp vụ do hàm SQL báo', () => {
    expect(toCode({ message: 'SLOT_FULL' })).toBe('SLOT_FULL')
    expect(toCode({ message: 'CANNOT_CANCEL' })).toBe('CANNOT_CANCEL')
  })
  it('đổi lỗi quyền của PostgreSQL thành NOT_ALLOWED', () => {
    expect(toCode({ code: '42501', message: 'permission denied for table bookings' })).toBe('NOT_ALLOWED')
  })
  it('đổi lỗi khóa ngoại thành IN_USE (BR10)', () => {
    expect(toCode({ code: '23503', message: 'violates foreign key constraint' })).toBe('IN_USE')
  })
  it('nhận lỗi đăng nhập sai của Supabase Auth', () => {
    expect(toCode({ message: 'Invalid login credentials' })).toBe('INVALID_CREDENTIALS')
  })
  it('lỗi lạ trả UNKNOWN kèm thông báo tiếng Việt', () => {
    const r = fail({ message: 'boom' })
    expect(r.error.code).toBe('UNKNOWN')
    expect(r.error.message).toBe(MESSAGES.UNKNOWN)
  })
  it('AppError giữ danh sách trường sai', () => {
    const e = new AppError('VALIDATION_ERROR', { phone: 'Sai định dạng' })
    expect(toCode(e)).toBe('VALIDATION_ERROR')
    expect(e.fields.phone).toBe('Sai định dạng')
  })
})
