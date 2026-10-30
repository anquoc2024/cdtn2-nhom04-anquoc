// Đổi tên trường snake_case (CSDL) sang camelCase (giao diện) – API Contract v1.1
const toCamel = (k) => k.replace(/_([a-z])/g, (_, c) => c.toUpperCase())

export function camel(v) {
  if (Array.isArray(v)) return v.map(camel)
  if (v && typeof v === 'object' && !(v instanceof Date)) {
    return Object.fromEntries(Object.entries(v).map(([k, val]) => [toCamel(k), camel(val)]))
  }
  return v
}
