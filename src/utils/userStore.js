import { reactive, watch } from 'vue'

// 全局用户状态管理
const userState = reactive({
  username: 'DocHub用户',
  email: 'user@dochub.com',
  phone: '',
  avatar: '' // 用户头像URL
})

// 初始化：从localStorage加载用户信息
const initUserState = () => {
  const savedUserInfo = localStorage.getItem('userInfo')
  if (savedUserInfo) {
    try {
      const userInfo = JSON.parse(savedUserInfo)
      // 修正历史数据：如果之前错误地保存了临时 blob URL，则清空头像字段，避免显示为损坏图片
      if (typeof userInfo.avatar === 'string' && userInfo.avatar.startsWith('blob:')) {
        userInfo.avatar = ''
      }
      Object.assign(userState, userInfo)
    } catch (error) {
      console.error('加载用户信息失败:', error)
    }
  }
}

// 保存用户信息到localStorage
const saveUserState = () => {
  localStorage.setItem('userInfo', JSON.stringify(userState))
}

// 监听用户状态变化，自动保存
watch(
  () => ({ ...userState }),
  () => {
    saveUserState()
  },
  { deep: true }
)

// 更新用户头像
export const updateUserAvatar = (avatarUrl) => {
  userState.avatar = avatarUrl
}

// 更新用户信息
export const updateUserInfo = (userInfo) => {
  Object.assign(userState, userInfo)
}

// 获取用户信息
export const getUserInfo = () => {
  return userState
}

// 初始化用户状态
initUserState()

// 从后端同步当前登录用户资料（包括头像），覆盖本地默认值/旧值
const syncUserProfileFromServer = async () => {
  try {
    const resp = await fetch('/api/v1/docsearch/user/me', {
      method: 'GET',
      credentials: 'include'
    })
    if (!resp.ok) {
      console.error('获取用户资料失败，状态码:', resp.status)
      return
    }
    const data = await resp.json()
    const mapped = {
      username: data.username || userState.username,
      email: data.email ?? userState.email,
      phone: data.phone ?? userState.phone,
      avatar: typeof data.avatar === 'string' && data.avatar.startsWith('blob:')
        ? ''
        : (data.avatar ?? userState.avatar)
    }
    Object.assign(userState, mapped)
  } catch (e) {
    console.error('从服务端同步用户资料失败:', e)
  }
}

syncUserProfileFromServer()

export default userState
