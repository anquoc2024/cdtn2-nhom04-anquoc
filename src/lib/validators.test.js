import { describe, it, expect } from 'vitest'
import { isPhone, isPrice, isDuration, isPassword, isEmail } from './validators'

describe('validators – ràng buộc dữ liệu', () => {
  it('SĐT 10 số bắt đầu bằng 0 (BR.TK.1.2)', () => {
    expect(isPhone('0905123456')).toBe(true)
    expect(isPhone('905123456')).toBe(false)
    expect(isPhone('09051234567')).toBe(false)
    expect(isPhone('09a5123456')).toBe(false)
  })
  it('giá > 0 và là bội số 1.000 – hai biên', () => {
    expect(isPrice(1000)).toBe(true)
    expect(isPrice(0)).toBe(false)
    expect(isPrice(150500)).toBe(false)
  })
  it('thời lượng 15–240 phút, bội số 15 – hai biên', () => {
    expect(isDuration(15)).toBe(true)
    expect(isDuration(240)).toBe(true)
    expect(isDuration(10)).toBe(false)
    expect(isDuration(255)).toBe(false)
    expect(isDuration(50)).toBe(false)
  })
  it('mật khẩu tối thiểu 8 ký tự', () => {
    expect(isPassword('1234567')).toBe(false)
    expect(isPassword('12345678')).toBe(true)
  })
  it('email hợp lệ', () => {
    expect(isEmail('an@gmail.com')).toBe(true)
    expect(isEmail('an@gmail')).toBe(false)
  })
})
