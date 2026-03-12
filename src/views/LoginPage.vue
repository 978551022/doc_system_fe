<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-header">
        <div class="login-logo">
          <svg width="48" height="48" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="4" y="6" width="24" height="20" rx="3" fill="currentColor" opacity="0.2"/>
            <rect x="7" y="9" width="18" height="14" rx="2" fill="currentColor"/>
            <path d="M10 14h12M10 18h8" stroke="white" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </div>
        <h1 class="login-title">DocHub</h1>
        <p class="login-subtitle">智能文档系统</p>
      </div>

      <div class="login-card">
        <div class="login-tabs">
          <button
            :class="['login-tab', { active: activeTab === 'password' }]"
            @click="activeTab = 'password'"
          >
            <i class="el-icon-lock"></i>
            密码登录
          </button>
          <button
            :class="['login-tab', { active: activeTab === 'sms' }]"
            @click="activeTab = 'sms'"
          >
            <i class="el-icon-message"></i>
            验证码登录
          </button>
        </div>

        <div class="login-form-container">
          <el-form
            v-if="activeTab === 'password'"
            ref="passwordFormRef"
            :model="passwordForm"
            :rules="passwordRules"
            class="login-form"
            @submit.prevent="handlePasswordLogin"
          >
            <el-form-item prop="identifier">
              <el-autocomplete
                v-model="passwordForm.identifier"
                :fetch-suggestions="queryPasswordAccounts"
                placeholder="请输入手机号/邮箱/用户名"
                size="large"
                :trigger-on-focus="true"
                :highlight-first-item="true"
                :debounce="200"
                :popper-class="passwordAutocompleteClass"
                @select="handleSelectPasswordAccount"
                style="width: 100%"
              >
                <template #prefix>
                  <el-icon><User /></el-icon>
                </template>
                <template #default="{ item }">
                  <div class="account-suggestion">
                    <el-icon><User /></el-icon>
                    <span>{{ item.value }}</span>
                  </div>
                </template>
              </el-autocomplete>
            </el-form-item>
            <el-form-item prop="password">
              <el-input
                v-model="passwordForm.password"
                type="password"
                placeholder="请输入密码"
                prefix-icon="el-icon-lock"
                size="large"
                show-password
                @keyup.enter="handlePasswordLogin"
              />
            </el-form-item>
            <el-form-item>
              <el-button
                type="primary"
                :loading="loading"
                class="login-btn"
                @click="handlePasswordLogin"
              >
                登录
              </el-button>
            </el-form-item>
          </el-form>

          <el-form
            v-if="activeTab === 'sms'"
            ref="smsFormRef"
            :model="smsForm"
            :rules="smsRules"
            class="login-form"
            @submit.prevent="handleSmsLogin"
          >
            <el-form-item prop="phone">
              <el-autocomplete
                v-model="smsForm.phone"
                :fetch-suggestions="querySmsAccounts"
                placeholder="请输入手机号"
                size="large"
                :trigger-on-focus="true"
                :highlight-first-item="true"
                :debounce="200"
                :popper-class="smsAutocompleteClass"
                @select="handleSelectSmsAccount"
                style="width: 100%"
              >
                <template #prefix>
                  <el-icon><Iphone /></el-icon>
                </template>
                <template #default="{ item }">
                  <div class="account-suggestion">
                    <el-icon><Iphone /></el-icon>
                    <span>{{ item.value }}</span>
                  </div>
                </template>
              </el-autocomplete>
            </el-form-item>
            <el-form-item prop="code">
              <div class="code-input-wrapper">
                <el-input
                  v-model="smsForm.code"
                  placeholder="请输入验证码"
                  prefix-icon="el-icon-message"
                  size="large"
                  maxlength="6"
                  @keyup.enter="handleSmsLogin"
                />
                <el-button
                  :disabled="countdown > 0"
                  :loading="sendingCode"
                  class="send-code-btn"
                  @click="handleSendCode('login')"
                >
                  {{ countdown > 0 ? `${countdown}s` : '获取验证码' }}
                </el-button>
              </div>
            </el-form-item>
            <el-form-item>
              <el-button
                type="primary"
                :loading="loading"
                class="login-btn"
                @click="handleSmsLogin"
              >
                登录
              </el-button>
            </el-form-item>
          </el-form>
        </div>

        <div class="login-divider">
          <span>其他登录方式</span>
        </div>

        <div class="other-login-methods">
          <el-button
            class="wechat-login-btn"
            @click="handleWechatLogin"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 0 1-.023-.156.49.49 0 0 1 .201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-6.656-6.088V8.89c-.135-.01-.27-.027-.407-.03zm-2.53 3.274c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.969-.982z"/>
            </svg>
            微信登录
          </el-button>
          <el-button
            class="guest-login-btn"
            @click="handleGuestLogin"
          >
            <i class="el-icon-user"></i>
            访客登录
          </el-button>
        </div>

        <div class="login-footer">
          <span>还没有账号？</span>
          <router-link to="/register" class="register-link">立即注册</router-link>
        </div>
      </div>

      <el-dialog
        v-model="wechatDialogVisible"
        title="微信扫码登录"
        width="360px"
        center
        :close-on-click-modal="false"
      >
        <div class="wechat-qrcode-container">
          <div v-if="wechatQrUrl" class="qrcode-wrapper">
            <img :src="wechatQrUrl" alt="微信二维码" class="wechat-qrcode" />
            <p class="qrcode-tip">请使用微信扫描二维码登录</p>
          </div>
          <div v-else class="qrcode-loading">
            <el-icon class="is-loading"><Loading /></el-icon>
            <p>正在获取二维码...</p>
          </div>
        </div>
      </el-dialog>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onUnmounted, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Loading, User, Iphone } from '@element-plus/icons-vue'
import { passwordLogin, smsLogin, guestLogin, sendVerificationCode, getWechatQrCodeUrl } from '../api/auth.js'
import { login } from '../utils/userStore.js'

const router = useRouter()

const activeTab = ref('password')
const loading = ref(false)
const sendingCode = ref(false)
const wechatDialogVisible = ref(false)
const wechatQrUrl = ref('')
const countdown = ref(0)
let countdownTimer = null

// 深色模式检测
const isDarkMode = ref(false)

// 检测当前是否为深色模式
const checkDarkMode = () => {
  isDarkMode.value = document.body.classList.contains('dark-theme')
}

// 动态popper类名（返回字符串，Element Plus的popper-class需要字符串）
const passwordAutocompleteClass = computed(() => {
  const baseClass = 'login-autocomplete-popper'
  const isDark = document.body.classList.contains('dark-theme')
  return isDark ? `${baseClass} login-autocomplete-dark` : baseClass
})

const smsAutocompleteClass = computed(() => {
  const baseClass = 'login-autocomplete-popper'
  const isDark = document.body.classList.contains('dark-theme')
  return isDark ? `${baseClass} login-autocomplete-dark` : baseClass
})

// 监听body类名变化
const observeDarkMode = () => {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
        checkDarkMode()
        updatePopperTheme()
      }
    })
  })
  observer.observe(document.body, {
    attributes: true,
    attributeFilter: ['class']
  })
  return observer
}

// 更新popper主题样式
const updatePopperTheme = () => {
  const isDark = document.body.classList.contains('dark-theme')
  const poppers = document.querySelectorAll('.login-autocomplete-popper')
  poppers.forEach((popper) => {
    if (isDark) {
      popper.classList.add('login-autocomplete-dark')
    } else {
      popper.classList.remove('login-autocomplete-dark')
    }
  })
}

onMounted(() => {
  checkDarkMode()
  const observer = observeDarkMode()
  onUnmounted(() => {
    observer.disconnect()
  })
})

// 历史账号相关（用于自动完成）
const LOGIN_HISTORY_KEY = 'login_history'
const SMS_LOGIN_HISTORY_KEY = 'sms_login_history'

// 获取历史账号列表（字符串数组）
const getLoginHistoryList = () => {
  try {
    const saved = localStorage.getItem(LOGIN_HISTORY_KEY)
    if (saved) {
      const history = JSON.parse(saved)
      // 提取 identifier 字段，只保留最近5条
      return history.slice(0, 5).map(h => h.identifier)
    }
  } catch (error) {
    console.error('获取登录历史失败:', error)
  }
  return []
}

const getSmsLoginHistoryList = () => {
  try {
    const saved = localStorage.getItem(SMS_LOGIN_HISTORY_KEY)
    if (saved) {
      const history = JSON.parse(saved)
      // 提取 phone 字段
      return history.slice(0, 5).map(h => h.phone)
    }
  } catch (error) {
    console.error('获取验证码登录历史失败:', error)
  }
  return []
}

// 自动完成查询函数（密码登录）
const queryPasswordAccounts = (queryString, callback) => {
  const historyList = getLoginHistoryList()
  // 如果输入为空，显示所有历史记录（最多5条）
  if (!queryString) {
    const results = historyList.map(item => ({ value: item }))
    callback(results)
    return
  }
  // 过滤出以输入内容开头的账号
  const results = historyList
    .filter(item => item.toLowerCase().startsWith(queryString.toLowerCase()))
    .map(item => ({ value: item }))
  callback(results)
}

// 自动完成查询函数（验证码登录）
const querySmsAccounts = (queryString, callback) => {
  const historyList = getSmsLoginHistoryList()
  // 如果输入为空，显示所有历史记录（最多5条）
  if (!queryString) {
    const results = historyList.map(item => ({ value: item }))
    callback(results)
    return
  }
  // 过滤出以输入内容开头的手机号
  const results = historyList
    .filter(item => item.startsWith(queryString))
    .map(item => ({ value: item }))
  callback(results)
}

// 选中历史账号后的处理
const handleSelectPasswordAccount = (item) => {
  // el-autocomplete 会自动填充，这里可以添加其他处理逻辑
}

const handleSelectSmsAccount = (item) => {
  // el-autocomplete 会自动填充，这里可以添加其他处理逻辑
}

// 保存历史账号
const saveLoginHistory = (identifier) => {
  try {
    const saved = localStorage.getItem(LOGIN_HISTORY_KEY)
    let history = saved ? JSON.parse(saved) : []
    // 移除重复项，将新登录的账号放到最前
    history = history.filter(h => h.identifier !== identifier)
    history.unshift({ identifier, lastLogin: new Date().toISOString() })
    // 只保留最近5条
    localStorage.setItem(LOGIN_HISTORY_KEY, JSON.stringify(history.slice(0, 5)))
  } catch (error) {
    console.error('保存登录历史失败:', error)
  }
}

const saveSmsLoginHistory = (phone) => {
  try {
    const saved = localStorage.getItem(SMS_LOGIN_HISTORY_KEY)
    let history = saved ? JSON.parse(saved) : []
    // 移除重复项，将新登录的手机号放到最前
    history = history.filter(h => h.phone !== phone)
    history.unshift({ phone, lastLogin: new Date().toISOString() })
    localStorage.setItem(SMS_LOGIN_HISTORY_KEY, JSON.stringify(history.slice(0, 5)))
  } catch (error) {
    console.error('保存验证码登录历史失败:', error)
  }
}

const passwordFormRef = ref(null)
const smsFormRef = ref(null)

const passwordForm = reactive({
  identifier: '',
  password: ''
})

const smsForm = reactive({
  phone: '',
  code: ''
})

const validatePhone = (rule, value, callback) => {
  if (!value) {
    callback(new Error('请输入手机号'))
  } else if (!/^1[3-9]\d{9}$/.test(value)) {
    callback(new Error('请输入正确的手机号'))
  } else {
    callback()
  }
}

const passwordRules = {
  identifier: [
    { required: true, message: '请输入手机号/邮箱/用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ]
}

const smsRules = {
  phone: [
    { required: true, validator: validatePhone, trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { len: 6, message: '验证码为6位数字', trigger: 'blur' }
  ]
}

const handleLoginSuccess = (response, loginType = 'password') => {
  if (response.success) {
    // 保存登录历史
    if (loginType === 'password' && passwordForm.identifier) {
      saveLoginHistory(passwordForm.identifier)
    } else if (loginType === 'sms' && smsForm.phone) {
      saveSmsLoginHistory(smsForm.phone)
    }

    // 调试：查看后端返回的头像信息
    console.log('后端返回的完整用户信息:', response.user_info)
    console.log('后端返回的头像URL:', response.user_info.avatar)

    // 处理头像URL - 后端可能已包含 /api/v1 前缀
    let avatarUrl = response.user_info.avatar

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

    console.log('最终处理后的头像URL:', avatarUrl)

    const userInfo = {
      userId: response.user_info.user_id,
      username: response.user_info.username,
      email: response.user_info.email || '',
      phone: response.user_info.phone || '',
      avatar: avatarUrl || '',
      isGuest: response.user_info.is_guest || false,
      registerMethod: response.user_info.register_method || '',
      phoneVerified: response.user_info.phone_verified || false,
      emailVerified: response.user_info.email_verified || false,
      createdAt: response.user_info.created_at || ''
    }

    login(response.access_token, userInfo)
    console.log('登录成功，最终使用的头像URL:', avatarUrl)
    ElMessage.success('登录成功')
    router.push('/chat')
  } else {
    ElMessage.error(response.message || '登录失败')
  }
}

const handlePasswordLogin = async () => {
  if (!passwordFormRef.value) return

  await passwordFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        const response = await passwordLogin(passwordForm.identifier, passwordForm.password)
        handleLoginSuccess(response, 'password')
      } catch (error) {
        ElMessage.error(error.response?.data?.detail || '登录失败，请检查账号密码')
      } finally {
        loading.value = false
      }
    }
  })
}

const handleSmsLogin = async () => {
  if (!smsFormRef.value) return

  await smsFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        const response = await smsLogin(smsForm.phone, smsForm.code)
        handleLoginSuccess(response, 'sms')
      } catch (error) {
        ElMessage.error(error.response?.data?.detail || '登录失败，请检查验证码')
      } finally {
        loading.value = false
      }
    }
  })
}

const handleSendCode = async (type) => {
  if (!smsForm.phone || !/^1[3-9]\d{9}$/.test(smsForm.phone)) {
    ElMessage.warning('请输入正确的手机号')
    return
  }

  sendingCode.value = true
  try {
    const response = await sendVerificationCode(smsForm.phone, type)
    // 请求成功（HTTP 2xx）就认为验证码已发送
    ElMessage.success('验证码已发送')
    startCountdown()
  } catch (error) {
    // 只在真正的错误情况下显示错误消息
    const errorMsg = error.response?.data?.detail || error.message || '发送验证码失败'
    ElMessage.error(errorMsg)
  } finally {
    sendingCode.value = false
  }
}

const startCountdown = () => {
  countdown.value = 60
  countdownTimer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(countdownTimer)
      countdownTimer = null
    }
  }, 1000)
}

const handleWechatLogin = async () => {
  wechatDialogVisible.value = true
  wechatQrUrl.value = ''
  
  try {
    const redirectUri = encodeURIComponent(window.location.origin + '/wechat-callback')
    const response = await getWechatQrCodeUrl(redirectUri)
    if (response.success) {
      wechatQrUrl.value = response.qr_url
    } else {
      ElMessage.error('获取微信登录二维码失败')
    }
  } catch (error) {
    ElMessage.error('获取微信登录二维码失败')
  }
}

const handleGuestLogin = async () => {
  loading.value = true
  try {
    const response = await guestLogin()
    handleLoginSuccess(response)
  } catch (error) {
    ElMessage.error(error.response?.data?.detail || '访客登录失败')
  } finally {
    loading.value = false
  }
}

onUnmounted(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
  }
})
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--background-color);
  padding: 20px;
}

.login-container {
  width: 100%;
  max-width: 420px;
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.login-logo {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 72px;
  height: 72px;
  border-radius: 16px;
  background: var(--primary-gradient);
  color: white;
  margin-bottom: 16px;
  box-shadow: var(--shadow-lg);
}

.login-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 8px 0;
  letter-spacing: -0.02em;
}

.login-subtitle {
  font-size: 14px;
  color: var(--text-muted);
  margin: 0;
}

.login-card {
  background: var(--card-background);
  border-radius: var(--radius-lg);
  padding: 32px;
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--border-color);
}

.login-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  background: var(--surface-color);
  padding: 4px;
  border-radius: var(--radius-md);
}

.login-tab {
  flex: 1;
  padding: 12px 16px;
  border: none;
  background: transparent;
  border-radius: var(--radius-sm);
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  transition: var(--transition);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.login-tab:hover {
  color: var(--primary-color);
}

.login-tab.active {
  background: var(--card-background);
  color: var(--primary-color);
  box-shadow: var(--shadow-sm);
}

.login-form-container {
  min-height: 180px;
}

.login-form {
  width: 100%;
}

.login-form :deep(.el-form-item) {
  margin-bottom: 20px;
}

.login-form :deep(.el-input__wrapper) {
  padding: 4px 12px;
  border-radius: var(--radius-md);
  background: var(--input-background);
  border: 1px solid var(--input-border);
  box-shadow: none;
  transition: var(--transition);
}

.login-form :deep(.el-input__wrapper:hover) {
  border-color: var(--border-hover);
}

.login-form :deep(.el-input__wrapper.is-focus) {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.login-form :deep(.el-input__inner) {
  height: 44px;
  font-size: 14px;
  color: var(--text-primary);
}

.login-form :deep(.el-input__inner::placeholder) {
  color: var(--input-placeholder);
}

.code-input-wrapper {
  display: flex;
  gap: 12px;
}

.code-input-wrapper :deep(.el-input) {
  flex: 1;
}

.send-code-btn {
  flex-shrink: 0;
  height: 52px;
  padding: 0 16px;
  font-size: 13px;
  font-weight: 500;
  border-radius: var(--radius-md);
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  transition: var(--transition);
}

.send-code-btn:hover:not(:disabled) {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.send-code-btn:disabled {
  background: var(--surface-color);
  color: var(--text-muted);
  cursor: not-allowed;
}

.login-btn {
  width: 100%;
  height: 48px;
  font-size: 15px;
  font-weight: 600;
  border-radius: var(--radius-md);
  background: var(--primary-gradient);
  border: none;
  transition: var(--transition);
}

.login-btn:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
  opacity: 0.95;
}

.login-divider {
  display: flex;
  align-items: center;
  margin: 24px 0;
}

.login-divider::before,
.login-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--border-color);
}

.login-divider span {
  padding: 0 16px;
  font-size: 12px;
  color: var(--text-muted);
}

.other-login-methods {
  display: flex;
  gap: 12px;
}

.wechat-login-btn,
.guest-login-btn {
  flex: 1;
  height: 44px;
  font-size: 13px;
  font-weight: 500;
  border-radius: var(--radius-md);
  transition: var(--transition);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.wechat-login-btn {
  background: #07c160;
  border-color: #07c160;
  color: white;
}

.wechat-login-btn:hover {
  background: #06ad56;
  border-color: #06ad56;
}

.guest-login-btn {
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
}

.guest-login-btn:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.login-footer {
  text-align: center;
  margin-top: 24px;
  font-size: 13px;
  color: var(--text-muted);
}

.register-link {
  color: var(--primary-color);
  font-weight: 500;
  text-decoration: none;
  margin-left: 4px;
}

.register-link:hover {
  text-decoration: underline;
}

.wechat-qrcode-container {
  padding: 20px;
  text-align: center;
}

.qrcode-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.wechat-qrcode {
  width: 200px;
  height: 200px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
}

.qrcode-tip {
  margin-top: 16px;
  font-size: 13px;
  color: var(--text-muted);
}

.qrcode-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 40px 0;
}

.qrcode-loading .el-icon {
  font-size: 32px;
  color: var(--primary-color);
}

.qrcode-loading p {
  font-size: 14px;
  color: var(--text-muted);
  margin: 0;
}

/* 自动完成建议样式 */
.account-suggestion {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 0;
}

.account-suggestion i {
  color: #818cf8;
  font-size: 14px;
  opacity: 0.7;
}

.account-suggestion span {
  font-size: 14px;
  color: #1e293b;
}

/* 深色模式下的图标和文字颜色 */
.dark-theme .account-suggestion i {
  color: #818cf8;
}

.dark-theme .account-suggestion span {
  color: #f1f5f9;
}
</style>

<!-- 非scoped样式：用于自动完成下拉框 -->
<style>
/* ==================== 浅色模式样式 ==================== */
/* 兼容：同时支持带.el-popper和不带的情况 */
.login-autocomplete-popper.el-popper,
.login-autocomplete-popper {
  background: #ffffff !important;
  border: 1px solid #e2e8f0 !important;
  border-radius: 10px !important;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12) !important;
  padding: 0 !important;
  margin-top: 0 !important;
}

.login-autocomplete-popper.el-popper .el-autocomplete-suggestion,
.login-autocomplete-popper .el-autocomplete-suggestion {
  padding: 0 !important;
  background: #ffffff !important;
}

.login-autocomplete-popper.el-popper .el-autocomplete-suggestion__wrap,
.login-autocomplete-popper .el-autocomplete-suggestion__wrap {
  max-height: 200px;
  background: #ffffff !important;
}

.login-autocomplete-popper.el-popper .el-autocomplete-suggestion__list,
.login-autocomplete-popper .el-autocomplete-suggestion__list {
  padding: 0;
  background: #ffffff !important;
  border-radius: 10px !important;
}

.login-autocomplete-popper.el-popper .el-autocomplete-suggestion__item,
.login-autocomplete-popper .el-autocomplete-suggestion__item {
  padding: 10px 12px !important;
  margin: 0 !important;
  border-radius: 0 !important;
  transition: background-color 0.2s, color 0.2s !important;
  color: #1e293b !important;
  background: #ffffff !important;
  border-bottom: 1px solid #e2e8f0 !important;
}

.login-autocomplete-popper.el-popper .el-autocomplete-suggestion__item:last-child,
.login-autocomplete-popper .el-autocomplete-suggestion__item:last-child {
  border-bottom: none !important;
}

/* 账号建议内容样式 */
.login-autocomplete-popper.el-popper .account-suggestion,
.login-autocomplete-popper .account-suggestion {
  display: flex;
  align-items: center;
  gap: 10px;
}

.login-autocomplete-popper.el-popper .account-suggestion i,
.login-autocomplete-popper .account-suggestion i {
  color: var(--primary-color, #4f46e5);
  font-size: 14px;
  opacity: 0.7;
}

.login-autocomplete-popper.el-popper .account-suggestion span,
.login-autocomplete-popper .account-suggestion span {
  font-size: 14px;
  color: #1e293b !important;
}

/* 浅色模式悬停 - 使用系统主题色 */
.login-autocomplete-popper.el-popper .el-autocomplete-suggestion__item:hover,
.login-autocomplete-popper.el-popper .el-autocomplete-suggestion__item.highlighted,
.login-autocomplete-popper .el-autocomplete-suggestion__item:hover,
.login-autocomplete-popper .el-autocomplete-suggestion__item.highlighted {
  background: var(--primary-color, #4f46e5) !important;
  color: #ffffff !important;
}

.login-autocomplete-popper.el-popper .el-autocomplete-suggestion__item:hover .account-suggestion span,
.login-autocomplete-popper.el-popper .el-autocomplete-suggestion__item.highlighted .account-suggestion span,
.login-autocomplete-popper .el-autocomplete-suggestion__item:hover .account-suggestion span,
.login-autocomplete-popper .el-autocomplete-suggestion__item.highlighted .account-suggestion span {
  color: #ffffff !important;
}

.login-autocomplete-popper.el-popper .el-autocomplete-suggestion__item:hover .account-suggestion i,
.login-autocomplete-popper.el-popper .el-autocomplete-suggestion__item.highlighted .account-suggestion i,
.login-autocomplete-popper .el-autocomplete-suggestion__item:hover .account-suggestion i,
.login-autocomplete-popper .el-autocomplete-suggestion__item.highlighted .account-suggestion i {
  color: #ffffff !important;
  opacity: 1;
}

/* ==================== 深色模式样式 ==================== */
/* 深色模式类直接作用于popper元素本身 */
/* 增加CSS优先级，确保深色模式样式正确应用 */

.login-autocomplete-popper.login-autocomplete-dark.el-popper,
.login-autocomplete-popper.login-autocomplete-dark {
  background: #1e293b !important;
  border-color: #334155 !important;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4) !important;
}

.login-autocomplete-popper.login-autocomplete-dark.el-popper .el-autocomplete-suggestion,
.login-autocomplete-popper.login-autocomplete-dark .el-autocomplete-suggestion,
.login-autocomplete-dark .el-autocomplete-suggestion {
  background: #1e293b !important;
}

.login-autocomplete-popper.login-autocomplete-dark.el-popper .el-autocomplete-suggestion__wrap,
.login-autocomplete-popper.login-autocomplete-dark .el-autocomplete-suggestion__wrap,
.login-autocomplete-dark .el-autocomplete-suggestion__wrap {
  background: #1e293b !important;
}

.login-autocomplete-popper.login-autocomplete-dark.el-popper .el-autocomplete-suggestion__list,
.login-autocomplete-popper.login-autocomplete-dark .el-autocomplete-suggestion__list,
.login-autocomplete-dark .el-autocomplete-suggestion__list {
  background: #1e293b !important;
}

/* 深色模式 - 选项样式（默认状态）- 高优先级 */
.login-autocomplete-popper.login-autocomplete-dark.el-popper .el-autocomplete-suggestion__item,
.login-autocomplete-popper.login-autocomplete-dark .el-autocomplete-suggestion__item,
.login-autocomplete-dark .el-autocomplete-suggestion__item {
  background: #2d3b4e !important;
  color: #f1f5f9 !important;
  border-bottom-color: #334155 !important;
}

/* 账号建议容器和子元素 */
.login-autocomplete-popper.login-autocomplete-dark.el-popper .el-autocomplete-suggestion__item .account-suggestion,
.login-autocomplete-popper.login-autocomplete-dark .el-autocomplete-suggestion__item .account-suggestion,
.login-autocomplete-dark .el-autocomplete-suggestion__item .account-suggestion {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #f1f5f9 !important;
}

/* 图标样式 */
.login-autocomplete-popper.login-autocomplete-dark.el-popper .el-autocomplete-suggestion__item .account-suggestion i,
.login-autocomplete-popper.login-autocomplete-dark .el-autocomplete-suggestion__item .account-suggestion i,
.login-autocomplete-dark .el-autocomplete-suggestion__item .account-suggestion i {
  color: #818cf8 !important;
  font-size: 14px;
  opacity: 0.8;
}

/* 文字样式 */
.login-autocomplete-popper.login-autocomplete-dark.el-popper .el-autocomplete-suggestion__item .account-suggestion span,
.login-autocomplete-popper.login-autocomplete-dark .el-autocomplete-suggestion__item .account-suggestion span,
.login-autocomplete-dark .el-autocomplete-suggestion__item .account-suggestion span {
  font-size: 14px;
  color: #f1f5f9 !important;
}

/* 深色模式 - 悬停/选中状态 - 略微高亮，不使用主题色 */
.login-autocomplete-popper.login-autocomplete-dark.el-popper .el-autocomplete-suggestion__item:hover,
.login-autocomplete-popper.login-autocomplete-dark.el-popper .el-autocomplete-suggestion__item.highlighted,
.login-autocomplete-popper.login-autocomplete-dark .el-autocomplete-suggestion__item:hover,
.login-autocomplete-popper.login-autocomplete-dark .el-autocomplete-suggestion__item.highlighted,
.login-autocomplete-dark .el-autocomplete-suggestion__item:hover,
.login-autocomplete-dark .el-autocomplete-suggestion__item.highlighted {
  background: #3b4d63 !important;
  color: #ffffff !important;
}

.login-autocomplete-popper.login-autocomplete-dark.el-popper .el-autocomplete-suggestion__item:hover .account-suggestion i,
.login-autocomplete-popper.login-autocomplete-dark.el-popper .el-autocomplete-suggestion__item.highlighted .account-suggestion i,
.login-autocomplete-popper.login-autocomplete-dark .el-autocomplete-suggestion__item:hover .account-suggestion i,
.login-autocomplete-popper.login-autocomplete-dark .el-autocomplete-suggestion__item.highlighted .account-suggestion i,
.login-autocomplete-dark .el-autocomplete-suggestion__item:hover .account-suggestion i,
.login-autocomplete-dark .el-autocomplete-suggestion__item.highlighted .account-suggestion i {
  color: #818cf8 !important;
  opacity: 1;
}

.login-autocomplete-popper.login-autocomplete-dark.el-popper .el-autocomplete-suggestion__item:hover .account-suggestion span,
.login-autocomplete-popper.login-autocomplete-dark.el-popper .el-autocomplete-suggestion__item.highlighted .account-suggestion span,
.login-autocomplete-popper.login-autocomplete-dark .el-autocomplete-suggestion__item:hover .account-suggestion span,
.login-autocomplete-popper.login-autocomplete-dark .el-autocomplete-suggestion__item.highlighted .account-suggestion span,
.login-autocomplete-dark .el-autocomplete-suggestion__item:hover .account-suggestion span,
.login-autocomplete-dark .el-autocomplete-suggestion__item.highlighted .account-suggestion span {
  color: #ffffff !important;
}

/* ==================== 下拉框宽度控制 ==================== */
/* 限制下拉框最大宽度，使其适中而不与输入框同宽 */
.login-autocomplete-popper.el-popper,
.login-autocomplete-popper {
  max-width: 320px !important;
  min-width: 200px !important;
}

/* ==================== 滚动条样式 ==================== */
.login-autocomplete-popper.el-popper .el-autocomplete-suggestion__wrap::-webkit-scrollbar,
.login-autocomplete-popper .el-autocomplete-suggestion__wrap::-webkit-scrollbar {
  width: 6px;
}

.login-autocomplete-popper.el-popper .el-autocomplete-suggestion__wrap::-webkit-scrollbar-track,
.login-autocomplete-popper .el-autocomplete-suggestion__wrap::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

.login-autocomplete-popper.el-popper .el-autocomplete-suggestion__wrap::-webkit-scrollbar-thumb,
.login-autocomplete-popper .el-autocomplete-suggestion__wrap::-webkit-scrollbar-thumb {
  background: #e2e8f0;
  border-radius: 3px;
}

.login-autocomplete-popper.el-popper .el-autocomplete-suggestion__wrap::-webkit-scrollbar-thumb:hover,
.login-autocomplete-popper .el-autocomplete-suggestion__wrap::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* 深色模式滚动条 */
.login-autocomplete-popper.login-autocomplete-dark .el-autocomplete-suggestion__wrap::-webkit-scrollbar-track,
.login-autocomplete-dark .el-autocomplete-suggestion__wrap::-webkit-scrollbar-track {
  background: #1e293b !important;
}

.login-autocomplete-popper.login-autocomplete-dark .el-autocomplete-suggestion__wrap::-webkit-scrollbar-thumb,
.login-autocomplete-dark .el-autocomplete-suggestion__wrap::-webkit-scrollbar-thumb {
  background: #334155 !important;
}

.login-autocomplete-popper.login-autocomplete-dark .el-autocomplete-suggestion__wrap::-webkit-scrollbar-thumb:hover,
.login-autocomplete-dark .el-autocomplete-suggestion__wrap::-webkit-scrollbar-thumb:hover {
  background: #64748b !important;
}
</style>
