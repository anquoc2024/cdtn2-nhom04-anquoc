import { authRepo } from '../repositories/authRepo'
import { attempt, unwrap, AppError } from './errors'
import { camel } from './mapper'
import { check, isEmail, isPassword, isPhone, isBlank } from '../lib/validators'

// FR01, FR02, FR21 – UC01, UC02, UC19
export const authService = {
  register: ({ fullName, phone, email, password }) =>
    attempt(async () => {
      const fields = check([
        ['fullName', !isBlank(fullName) && fullName.trim().length <= 100, 'Nhập họ tên (tối đa 100 ký tự)'],
        ['phone', isPhone(phone), 'SĐT gồm 10 số, bắt đầu bằng 0'],
        ['email', isEmail(email), 'Email không hợp lệ'],
        ['password', isPassword(password), 'Mật khẩu tối thiểu 8 ký tự'],
      ])
      if (Object.keys(fields).length) throw new AppError('VALIDATION_ERROR', fields)
      const data = unwrap(await authRepo.signUp(email.trim(), password, { full_name: fullName.trim(), phone: phone.trim() }))
      // Supabase trả identities rỗng khi email đã tồn tại
      if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) throw new AppError('EMAIL_OR_PHONE_EXISTS')
      return { needsConfirmation: !data.session }
    }),

  login: ({ email, password }) =>
    attempt(async () => {
      const fields = check([
        ['email', isEmail(email), 'Email không hợp lệ'],
        ['password', !isBlank(password), 'Nhập mật khẩu'],
      ])
      if (Object.keys(fields).length) throw new AppError('VALIDATION_ERROR', fields)
      const { user } = unwrap(await authRepo.signIn(email.trim(), password))
      const profile = camel(unwrap(await authRepo.getProfile(user.id)))
      if (profile.isLocked) {
        await authRepo.signOut()
        throw new AppError('ACCOUNT_LOCKED')                     // BR11
      }
      return { user: profile, redirect: profile.role === 'admin' ? '/admin/lich-hen' : '/' }
    }),

  logout: () => attempt(async () => unwrap(await authRepo.signOut())),

  getCurrentUser: () =>
    attempt(async () => {
      const { session } = unwrap(await authRepo.getSession())
      if (!session) return null
      const profile = camel(unwrap(await authRepo.getProfile(session.user.id)))
      if (profile.isLocked) {
        await authRepo.signOut()
        return null
      }
      return profile
    }),

  updateProfile: (userId, { fullName, phone }) =>
    attempt(async () => {
      const fields = check([
        ['fullName', !isBlank(fullName), 'Nhập họ tên'],
        ['phone', isPhone(phone), 'SĐT gồm 10 số, bắt đầu bằng 0'],
      ])
      if (Object.keys(fields).length) throw new AppError('VALIDATION_ERROR', fields)
      return camel(unwrap(await authRepo.updateProfile(userId, { full_name: fullName.trim(), phone: phone.trim() })))
    }),

  changePassword: (email, { current, next }) =>
    attempt(async () => {
      const fields = check([
        ['current', !isBlank(current), 'Nhập mật khẩu hiện tại'],
        ['next', isPassword(next), 'Mật khẩu mới tối thiểu 8 ký tự'],
      ])
      if (Object.keys(fields).length) throw new AppError('VALIDATION_ERROR', fields)
      const check1 = await authRepo.signIn(email, current)       // xác nhận mật khẩu hiện tại
      if (check1.error) throw new AppError('VALIDATION_ERROR', { current: 'Mật khẩu hiện tại không đúng' })
      unwrap(await authRepo.updatePassword(next))
      return true
    }),

  onAuthChange: (cb) => authRepo.onChange(cb),
}
