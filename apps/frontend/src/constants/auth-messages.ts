/**
 * Vietnamese error/UI messages for authentication flows.
 * All user-facing strings in login and register pages come from here.
 */

export const AUTH_ERRORS = {
  INVALID_CREDENTIALS: 'Email hoặc mật khẩu không đúng. Vui lòng thử lại.',
  NETWORK_ERROR: 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.',
  TOO_MANY_REQUESTS: 'Bạn đã thử quá nhiều lần. Vui lòng chờ một lúc rồi thử lại.',
  SERVER_ERROR: 'Lỗi máy chủ. Vui lòng thử lại sau.',
  LOGIN_FAILED: 'Đăng nhập thất bại. Vui lòng thử lại.',
  REGISTER_FAILED: 'Đăng ký thất bại. Vui lòng thử lại.',
  EMAIL_TAKEN: 'Email này đã được sử dụng. Vui lòng chọn email khác.',
  PASSWORD_TOO_SHORT: 'Mật khẩu phải có ít nhất 8 ký tự.',
  PASSWORD_TOO_COMMON: 'Mật khẩu quá đơn giản. Vui lòng chọn mật khẩu phức tạp hơn.',
} as const

export const AUTH_UI = {
  LOGIN_BUTTON: 'Đăng nhập',
  LOGIN_LOADING: 'Đang đăng nhập...',
  REGISTER_BUTTON: 'Tạo tài khoản',
  REGISTER_LOADING: 'Đang tạo tài khoản...',
  NO_ACCOUNT: 'Chưa có tài khoản?',
  HAVE_ACCOUNT: 'Đã có tài khoản?',
  REGISTER_LINK: 'Đăng ký',
  LOGIN_LINK: 'Đăng nhập',
  LABEL_FULL_NAME: 'Họ và tên',
  LABEL_EMAIL: 'Email',
  LABEL_PASSWORD: 'Mật khẩu',
} as const

/** Map backend English error message → Vietnamese. */
export function toVietnameseAuthError(msg: string, context: 'login' | 'register' = 'login'): string {
  const m = msg.toLowerCase()
  if (m.includes('no active account') || m.includes('invalid') || m.includes('credentials') || m.includes('401'))
    return AUTH_ERRORS.INVALID_CREDENTIALS
  if (m.includes('network') || m.includes('failed to fetch'))
    return AUTH_ERRORS.NETWORK_ERROR
  if (m.includes('too many') || m.includes('throttle') || m.includes('429'))
    return AUTH_ERRORS.TOO_MANY_REQUESTS
  if (m.includes('already exist') || m.includes('email') && m.includes('exist'))
    return AUTH_ERRORS.EMAIL_TAKEN
  if (m.includes('too short') || m.includes('at least 8'))
    return AUTH_ERRORS.PASSWORD_TOO_SHORT
  if (m.includes('too common') || m.includes('entirely numeric'))
    return AUTH_ERRORS.PASSWORD_TOO_COMMON
  if (!msg || m.includes('500') || m.includes('server'))
    return AUTH_ERRORS.SERVER_ERROR
  return context === 'register' ? AUTH_ERRORS.REGISTER_FAILED : AUTH_ERRORS.LOGIN_FAILED
}
