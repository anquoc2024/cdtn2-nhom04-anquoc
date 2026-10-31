// Tạo tài khoản mẫu (1 quản trị viên + 1 người dùng) trên Supabase.
// Chạy: npm run seed:users   (đọc biến trong file .env – xem .env.example)
// Dùng khóa service_role: CHỈ chạy trên máy cá nhân, không commit, không đưa lên Vercel.
import { createClient } from '@supabase/supabase-js'

const url = process.env.VITE_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('Thiếu VITE_SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY trong .env')
  process.exit(1)
}
const admin = createClient(url, key, { auth: { persistSession: false } })

async function ensureUser({ email, password, fullName, phone, role }) {
  if (!email || !password) return
  const { data: list } = await admin.auth.admin.listUsers({ perPage: 1000 })
  let user = list?.users.find((u) => u.email === email)
  if (!user) {
    const { data, error } = await admin.auth.admin.createUser({
      email, password, email_confirm: true, user_metadata: { full_name: fullName, phone },
    })
    if (error) throw new Error(`${email}: ${error.message}`)
    user = data.user
    console.log('Đã tạo', email)
  } else console.log('Đã có', email)
  const { error } = await admin.from('profiles').update({ role }).eq('id', user.id)
  if (error) throw new Error(`${email}: ${error.message}`)
}

await ensureUser({ email: process.env.SEED_ADMIN_EMAIL, password: process.env.SEED_ADMIN_PASSWORD, fullName: process.env.SEED_ADMIN_NAME ?? 'Chủ tiệm', phone: process.env.SEED_ADMIN_PHONE ?? '0900000001', role: 'admin' })
await ensureUser({ email: process.env.SEED_USER_EMAIL, password: process.env.SEED_USER_PASSWORD, fullName: process.env.SEED_USER_NAME ?? 'Khách mẫu', phone: process.env.SEED_USER_PHONE ?? '0900000002', role: 'user' })
console.log('Xong.')
