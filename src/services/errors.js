// Chuẩn hóa lỗi: mọi hàm service trả { data } hoặc { error: { code, message, fields } } (API Contract v1.1, mục II)
export const MESSAGES = {
  VALIDATION_ERROR: 'Thông tin chưa hợp lệ, vui lòng kiểm tra lại.',
  NOT_AUTHENTICATED: 'Vui lòng đăng nhập để tiếp tục.',
  NOT_ALLOWED: 'Bạn không có quyền thực hiện thao tác này.',
  NOT_FOUND: 'Không tìm thấy dữ liệu.',
  INVALID_CREDENTIALS: 'Email hoặc mật khẩu không đúng.',
  EMAIL_OR_PHONE_EXISTS: 'Email hoặc số điện thoại đã được đăng ký.',
  ACCOUNT_LOCKED: 'Tài khoản đã bị khóa. Vui lòng liên hệ cửa hàng.',
  SLOT_FULL: 'Khung giờ này vừa hết chỗ, vui lòng chọn giờ khác.',
  SLOT_BLOCKED: 'Cửa hàng không nhận lịch vào ngày/giờ này.',
  OUT_OF_HOURS: 'Giờ hẹn nằm ngoài giờ nhận lịch (đặt trước ít nhất 1 giờ, tối đa 30 ngày).',
  BOOKING_LIMIT: 'Bạn đã có 2 lịch hẹn đang chờ. Hoàn thành hoặc hủy bớt rồi đặt tiếp nhé.',
  CANNOT_CANCEL: 'Lịch này không thể hủy (chỉ hủy được trước giờ hẹn ít nhất 2 giờ).',
  INVALID_TRANSITION: 'Không thể chuyển sang trạng thái này.',
  REASON_REQUIRED: 'Vui lòng nhập lý do.',
  LAST_ADMIN: 'Không thể thu quyền hoặc khóa tài khoản này (phải còn ít nhất một quản trị viên, và không tự đổi quyền của mình).',
  IN_USE: 'Mục này đã được dùng trong lịch hẹn nên chỉ có thể ẩn.',
  INVALID_PRICE: 'Giá phải lớn hơn 0 và là bội số của 1.000đ.',
  INVALID_RANGE: 'Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.',
  EMAIL_NOT_CONFIRMED: 'Email chưa được xác nhận. Vui lòng mở thư xác nhận rồi đăng nhập lại.',
  NETWORK: 'Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.',
  UNKNOWN: 'Đã có lỗi xảy ra, vui lòng thử lại.',
}

export class AppError extends Error {
  constructor(code, fields = undefined) {
    super(MESSAGES[code] ?? MESSAGES.UNKNOWN)
    this.code = MESSAGES[code] ? code : 'UNKNOWN'
    this.fields = fields
  }
}

/** Đổi lỗi của Supabase/PostgREST/Auth thành mã nghiệp vụ */
export function toCode(err) {
  if (!err) return 'UNKNOWN'
  if (err instanceof AppError) return err.code
  const msg = String(err.message ?? '')
  const first = msg.split(/[\s:]/)[0]
  if (MESSAGES[first]) return first
  if (err.code === '42501' || /permission denied|row-level security/i.test(msg)) return 'NOT_ALLOWED'
  if (err.code === '23503') return 'IN_USE'
  if (err.code === '23505') return 'EMAIL_OR_PHONE_EXISTS'
  if (err.code === '23514' || err.code === '22P02') return 'VALIDATION_ERROR'
  if (err.code === 'PGRST116') return 'NOT_FOUND'
  if (/invalid login credentials/i.test(msg)) return 'INVALID_CREDENTIALS'
  if (/email not confirmed/i.test(msg)) return 'EMAIL_NOT_CONFIRMED'
  if (/already registered|already been registered|database error saving new user/i.test(msg)) return 'EMAIL_OR_PHONE_EXISTS'
  if (/failed to fetch|network/i.test(msg)) return 'NETWORK'
  return 'UNKNOWN'
}

export function fail(errOrCode, fields) {
  const code = typeof errOrCode === 'string' ? errOrCode : toCode(errOrCode)
  if (code === 'UNKNOWN' && errOrCode && typeof errOrCode !== 'string') console.error(errOrCode)
  return { error: { code, message: MESSAGES[code], fields } }
}

/** Bọc một thao tác: lỗi ném ra hoặc { error } của supabase đều thành { error } */
export async function attempt(fn) {
  try {
    const data = await fn()
    return { data }
  } catch (e) {
    return fail(e, e?.fields)
  }
}

/** Ném lỗi khi kết quả supabase có error; trả data khi thành công */
export function unwrap({ data, error }) {
  if (error) throw error
  return data
}
