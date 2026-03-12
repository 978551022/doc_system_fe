import request from './document.js'

const AUTH_BASE_URL = '/v1/auth'

export const guestLogin = async () => {
  return request.post(`${AUTH_BASE_URL}/login/guest`)
}

export const passwordLogin = async (identifier, password) => {
  return request.post(`${AUTH_BASE_URL}/login/password`, {
    identifier,
    password
  })
}

export const smsLogin = async (phone, code) => {
  return request.post(`${AUTH_BASE_URL}/login/sms`, {
    phone,
    code
  })
}

export const wechatLogin = async (code) => {
  return request.post(`${AUTH_BASE_URL}/login/wechat`, {
    code
  })
}

export const registerWithPassword = async (data) => {
  return request.post(`${AUTH_BASE_URL}/register/password`, data)
}

export const registerWithPhone = async (data) => {
  return request.post(`${AUTH_BASE_URL}/register/phone`, data)
}

export const sendVerificationCode = async (target, type) => {
  return request.post(`${AUTH_BASE_URL}/verification/send`, {
    target,
    type
  })
}

export const verifyCode = async (target, code, type) => {
  return request.post(`${AUTH_BASE_URL}/verification/verify`, {
    target,
    code,
    type
  })
}

export const requestPasswordReset = async (identifier) => {
  return request.post(`${AUTH_BASE_URL}/password/request-reset`, {
    identifier
  })
}

export const resetPassword = async (identifier, code, newPassword) => {
  return request.post(`${AUTH_BASE_URL}/password/reset`, {
    identifier,
    code,
    new_password: newPassword
  })
}

export const getWechatQrCodeUrl = async (redirectUri) => {
  return request.get(`${AUTH_BASE_URL}/wechat/qrcode-url`, {
    params: { redirect_uri: redirectUri }
  })
}

export const logout = async (token) => {
  return request.post('/v1/logout', { token })
}

export const getCurrentUser = async () => {
  return request.get('/v1/docsearch/user/me')
}

export default {
  guestLogin,
  passwordLogin,
  smsLogin,
  wechatLogin,
  registerWithPassword,
  registerWithPhone,
  sendVerificationCode,
  verifyCode,
  requestPasswordReset,
  resetPassword,
  getWechatQrCodeUrl,
  logout,
  getCurrentUser
}
