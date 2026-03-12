import { reactive, watch } from 'vue'
import { getCurrentUser } from '../api/auth.js'

const TOKEN_KEY = 'auth_token'
const USER_INFO_KEY = 'user_info'
const LOGIN_STATE_KEY = 'login_state'

const userState = reactive({
  isLoggedIn: false,
  token: '',
  userId: '',
  username: 'DocHub用户',
  email: 'user@dochub.com',
  phone: '',
  avatar: '',
  isGuest: false,
  registerMethod: '',
  phoneVerified: false,
  emailVerified: false,
  createdAt: ''
})

const initUserState = () => {
  const savedToken = localStorage.getItem(TOKEN_KEY)
  const savedUserInfo = localStorage.getItem(USER_INFO_KEY)
  const savedLoginState = localStorage.getItem(LOGIN_STATE_KEY)

  if (savedLoginState) {
    try {
      const loginState = JSON.parse(savedLoginState)
      userState.isLoggedIn = loginState.isLoggedIn || false
    } catch (error) {
      console.error('加载登录状态失败:', error)
    }
  }

  if (savedToken) {
    userState.token = savedToken
  }

  if (savedUserInfo) {
    try {
      const userInfo = JSON.parse(savedUserInfo)
      if (typeof userInfo.avatar === 'string' && userInfo.avatar.startsWith('blob:')) {
        userInfo.avatar = ''
      }
      Object.assign(userState, userInfo)
    } catch (error) {
      console.error('加载用户信息失败:', error)
    }
  }

  // 如果已登录，从服务器同步用户信息
  if (userState.isLoggedIn && userState.token) {
    syncUserProfileFromServer()
  }
}

const saveUserState = () => {
  localStorage.setItem(USER_INFO_KEY, JSON.stringify({
    userId: userState.userId,
    username: userState.username,
    email: userState.email,
    phone: userState.phone,
    avatar: userState.avatar,
    isGuest: userState.isGuest,
    registerMethod: userState.registerMethod,
    phoneVerified: userState.phoneVerified,
    emailVerified: userState.emailVerified,
    createdAt: userState.createdAt
  }))
}

const saveLoginState = () => {
  localStorage.setItem(LOGIN_STATE_KEY, JSON.stringify({
    isLoggedIn: userState.isLoggedIn
  }))
}

const saveToken = () => {
  if (userState.token) {
    localStorage.setItem(TOKEN_KEY, userState.token)
  } else {
    localStorage.removeItem(TOKEN_KEY)
  }
}

watch(
  () => ({ ...userState }),
  () => {
    saveUserState()
    saveLoginState()
    saveToken()
  },
  { deep: true }
)

export const updateUserAvatar = (avatarUrl) => {
  userState.avatar = avatarUrl
}

export const updateUserInfo = (userInfo) => {
  Object.assign(userState, userInfo)
}

export const getUserInfo = () => {
  return userState
}

export const login = (token, userInfo) => {
  userState.token = token
  userState.isLoggedIn = true
  Object.assign(userState, userInfo)
}

export const logout = () => {
  userState.isLoggedIn = false
  userState.token = ''
  userState.userId = ''
  userState.username = 'DocHub用户'
  userState.email = 'user@dochub.com'
  userState.phone = ''
  userState.avatar = ''
  userState.isGuest = false
  userState.registerMethod = ''
  userState.phoneVerified = false
  userState.emailVerified = false
  userState.createdAt = ''
}

export const getToken = () => {
  return userState.token
}

export const isLoggedIn = () => {
  return userState.isLoggedIn
}

export const isGuestUser = () => {
  return userState.isGuest
}

export const syncUserProfileFromServer = async () => {
  try {
    const response = await getCurrentUser()
    if (response && response.user_id) {
      let avatarUrl = response.avatar || ''

      // 清理无效值
      if (avatarUrl === 'null' || avatarUrl === 'undefined' || avatarUrl === null || avatarUrl === '') {
        avatarUrl = ''
      } else if (avatarUrl) {
        // 如果已经是完整HTTP地址，直接使用
        if (!avatarUrl.startsWith('http://') && !avatarUrl.startsWith('https://')) {
          // 如果已经包含 /api/ 前缀，直接使用；否则添加 /api/v1 前缀
          if (avatarUrl.startsWith('/api/')) {
            avatarUrl = avatarUrl  // 后端已返回完整路径
          } else {
            // 确保路径以 / 开头
            const normalizedPath = avatarUrl.startsWith('/') ? avatarUrl : '/' + avatarUrl
            avatarUrl = '/api/v1' + normalizedPath
          }
        }
      }

      console.log('同步用户头像，后端返回:', response.avatar, '处理后的URL:', avatarUrl)

      const userInfo = {
        userId: response.user_id,
        username: response.username || userState.username,
        email: response.email || '',
        phone: response.phone || '',
        avatar: avatarUrl,
        isGuest: response.is_guest || false,
        registerMethod: response.register_method || '',
        phoneVerified: response.phone_verified || false,
        emailVerified: response.email_verified || false,
        createdAt: response.created_at || ''
      }
      Object.assign(userState, userInfo)
      console.log('从服务器同步用户信息成功:', userInfo)
    }
  } catch (error) {
    console.error('从服务器同步用户信息失败:', error)
  }
}

initUserState()

export default userState
