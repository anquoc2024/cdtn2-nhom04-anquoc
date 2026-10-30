// Kiểm tra dữ liệu ở lớp Service (VALIDATION_ERROR) – khớp ràng buộc CSDL
export const isPhone = (v) => /^0\d{9}$/.test(String(v ?? '').trim())
export const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v ?? '').trim())
export const isPassword = (v) => String(v ?? '').length >= 8
export const isPrice = (v) => Number.isInteger(Number(v)) && Number(v) > 0 && Number(v) % 1000 === 0
export const isDuration = (v) => Number.isInteger(Number(v)) && Number(v) >= 15 && Number(v) <= 240 && Number(v) % 15 === 0
export const isBlank = (v) => String(v ?? '').trim().length === 0

/** Trả về { field: 'thông báo' } cho các trường sai; rỗng nếu hợp lệ */
export function check(rules) {
  const fields = {}
  for (const [field, ok, message] of rules) if (!ok) fields[field] = message
  return fields
}
