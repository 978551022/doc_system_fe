<template>
  <div class="register-page">
    <div class="register-container">
      <div class="register-header">
        <div class="register-logo">
          <svg width="48" height="48" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="4" y="6" width="24" height="20" rx="3" fill="currentColor" opacity="0.2"/>
            <rect x="7" y="9" width="18" height="14" rx="2" fill="currentColor"/>
            <path d="M10 14h12M10 18h8" stroke="white" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </div>
        <h1 class="register-title">创建账号</h1>
        <p class="register-subtitle">加入DocHub，开启智能文档之旅</p>
      </div>

      <div class="register-card">
        <div class="register-tabs">
          <button
            :class="['register-tab', { active: activeTab === 'username' }]"
            @click="activeTab = 'username'"
          >
            <i class="el-icon-user"></i>
            用户名注册
          </button>
          <button
            :class="['register-tab', { active: activeTab === 'phone' }]"
            @click="activeTab = 'phone'"
          >
            <i class="el-icon-mobile-phone"></i>
            手机号注册
          </button>
        </div>

        <div class="register-form-container">
          <el-form
            v-if="activeTab === 'username'"
            ref="usernameFormRef"
            :model="usernameForm"
            :rules="usernameRules"
            class="register-form"
            @submit.prevent="handleUsernameRegister"
          >
            <el-form-item prop="username">
              <el-input
                v-model="usernameForm.username"
                placeholder="请输入用户名（3-50字符）"
                prefix-icon="el-icon-user"
                size="large"
              />
            </el-form-item>
            <el-form-item prop="password">
              <el-input
                v-model="usernameForm.password"
                type="password"
                placeholder="请输入密码"
                prefix-icon="el-icon-lock"
                size="large"
                show-password
              />
            </el-form-item>
            <el-form-item prop="confirmPassword">
              <el-input
                v-model="usernameForm.confirmPassword"
                type="password"
                placeholder="请确认密码"
                prefix-icon="el-icon-lock"
                size="large"
                show-password
              />
            </el-form-item>
            <el-form-item prop="email">
              <el-input
                v-model="usernameForm.email"
                placeholder="请输入邮箱（选填）"
                prefix-icon="el-icon-message"
                size="large"
              />
            </el-form-item>
            <el-form-item prop="phone">
              <el-input
                v-model="usernameForm.phone"
                placeholder="请输入手机号（选填）"
                prefix-icon="el-icon-mobile-phone"
                size="large"
              />
            </el-form-item>
            <el-form-item>
              <el-button
                type="primary"
                :loading="loading"
                class="register-btn"
                @click="handleUsernameRegister"
              >
                注册
              </el-button>
            </el-form-item>
          </el-form>

          <el-form
            v-if="activeTab === 'phone'"
            ref="phoneFormRef"
            :model="phoneForm"
            :rules="phoneRules"
            class="register-form"
            @submit.prevent="handlePhoneRegister"
          >
            <el-form-item prop="phone">
              <el-input
                v-model="phoneForm.phone"
                placeholder="请输入手机号"
                prefix-icon="el-icon-mobile-phone"
                size="large"
              />
            </el-form-item>
            <el-form-item prop="code">
              <div class="code-input-wrapper">
                <el-input
                  v-model="phoneForm.code"
                  placeholder="请输入验证码"
                  prefix-icon="el-icon-message"
                  size="large"
                  maxlength="6"
                />
                <el-button
                  :disabled="countdown > 0"
                  :loading="sendingCode"
                  class="send-code-btn"
                  @click="handleSendCode"
                >
                  {{ countdown > 0 ? `${countdown}s` : '获取验证码' }}
                </el-button>
              </div>
            </el-form-item>
            <el-form-item prop="password">
              <el-input
                v-model="phoneForm.password"
                type="password"
                placeholder="请输入密码"
                prefix-icon="el-icon-lock"
                size="large"
                show-password
              />
            </el-form-item>
            <el-form-item prop="confirmPassword">
              <el-input
                v-model="phoneForm.confirmPassword"
                type="password"
                placeholder="请确认密码"
                prefix-icon="el-icon-lock"
                size="large"
                show-password
              />
            </el-form-item>
            <el-form-item prop="username">
              <el-input
                v-model="phoneForm.username"
                placeholder="请输入用户名（选填，不填则自动生成）"
                prefix-icon="el-icon-user"
                size="large"
              />
            </el-form-item>
            <el-form-item>
              <el-button
                type="primary"
                :loading="loading"
                class="register-btn"
                @click="handlePhoneRegister"
              >
                注册
              </el-button>
            </el-form-item>
          </el-form>
        </div>

        <div class="register-footer">
          <span>已有账号？</span>
          <router-link to="/login" class="login-link">立即登录</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { registerWithPassword, registerWithPhone, sendVerificationCode } from '../api/auth.js'
import { login } from '../utils/userStore.js'

const router = useRouter()

const activeTab = ref('username')
const loading = ref(false)
const sendingCode = ref(false)
const countdown = ref(0)
let countdownTimer = null

const usernameFormRef = ref(null)
const phoneFormRef = ref(null)

const usernameForm = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  email: '',
  phone: ''
})

const phoneForm = reactive({
  phone: '',
  code: '',
  password: '',
  confirmPassword: '',
  username: ''
})

const validateUsername = (rule, value, callback) => {
  if (!value) {
    callback(new Error('请输入用户名'))
  } else if (value.length < 3 || value.length > 50) {
    callback(new Error('用户名长度为3-50个字符'))
  } else {
    callback()
  }
}

const validatePassword = (rule, value, callback) => {
  if (!value) {
    callback(new Error('请输入密码'))
  } else if (value.length < 6) {
    callback(new Error('密码长度不能少于6位'))
  } else {
    callback()
  }
}

const validateConfirmPassword = (formType) => {
  return (rule, value, callback) => {
    const password = formType === 'username' ? usernameForm.password : phoneForm.password
    if (!value) {
      callback(new Error('请确认密码'))
    } else if (value !== password) {
      callback(new Error('两次输入的密码不一致'))
    } else {
      callback()
    }
  }
}

const validateEmail = (rule, value, callback) => {
  if (!value) {
    callback()
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    callback(new Error('请输入正确的邮箱格式'))
  } else {
    callback()
  }
}

const validatePhone = (rule, value, callback) => {
  if (!value) {
    callback()
  } else if (!/^1[3-9]\d{9}$/.test(value)) {
    callback(new Error('请输入正确的手机号'))
  } else {
    callback()
  }
}

const validatePhoneRequired = (rule, value, callback) => {
  if (!value) {
    callback(new Error('请输入手机号'))
  } else if (!/^1[3-9]\d{9}$/.test(value)) {
    callback(new Error('请输入正确的手机号'))
  } else {
    callback()
  }
}

const usernameRules = {
  username: [
    { required: true, validator: validateUsername, trigger: 'blur' }
  ],
  password: [
    { required: true, validator: validatePassword, trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, validator: validateConfirmPassword('username'), trigger: 'blur' }
  ],
  email: [
    { validator: validateEmail, trigger: 'blur' }
  ],
  phone: [
    { validator: validatePhone, trigger: 'blur' }
  ]
}

const phoneRules = {
  phone: [
    { required: true, validator: validatePhoneRequired, trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { len: 6, message: '验证码为6位数字', trigger: 'blur' }
  ],
  password: [
    { required: true, validator: validatePassword, trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, validator: validateConfirmPassword('phone'), trigger: 'blur' }
  ],
  username: [
    { min: 3, max: 50, message: '用户名长度为3-50个字符', trigger: 'blur' }
  ]
}

const handleRegisterSuccess = (response) => {
  if (response.success) {
    const userInfo = {
      userId: response.user_info.user_id,
      username: response.user_info.username,
      email: response.user_info.email || '',
      phone: response.user_info.phone || '',
      avatar: response.user_info.avatar || '',
      isGuest: response.user_info.is_guest || false,
      registerMethod: response.user_info.register_method || '',
      phoneVerified: response.user_info.phone_verified || false,
      emailVerified: response.user_info.email_verified || false,
      createdAt: response.user_info.created_at || ''
    }
    login(response.access_token, userInfo)
    ElMessage.success('注册成功')
    router.push('/chat')
  } else {
    ElMessage.error(response.message || '注册失败')
  }
}

const handleUsernameRegister = async () => {
  if (!usernameFormRef.value) return
  
  await usernameFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        const data = {
          username: usernameForm.username,
          password: usernameForm.password
        }
        if (usernameForm.email) {
          data.email = usernameForm.email
        }
        if (usernameForm.phone) {
          data.phone = usernameForm.phone
        }
        const response = await registerWithPassword(data)
        handleRegisterSuccess(response)
      } catch (error) {
        ElMessage.error(error.response?.data?.detail || '注册失败，请稍后重试')
      } finally {
        loading.value = false
      }
    }
  })
}

const handlePhoneRegister = async () => {
  if (!phoneFormRef.value) return
  
  await phoneFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        const data = {
          phone: phoneForm.phone,
          code: phoneForm.code,
          password: phoneForm.password
        }
        if (phoneForm.username) {
          data.username = phoneForm.username
        }
        const response = await registerWithPhone(data)
        handleRegisterSuccess(response)
      } catch (error) {
        ElMessage.error(error.response?.data?.detail || '注册失败，请稍后重试')
      } finally {
        loading.value = false
      }
    }
  })
}

const handleSendCode = async () => {
  if (!phoneForm.phone || !/^1[3-9]\d{9}$/.test(phoneForm.phone)) {
    ElMessage.warning('请输入正确的手机号')
    return
  }

  sendingCode.value = true
  try {
    const response = await sendVerificationCode(phoneForm.phone, 'register')
    if (response.success) {
      ElMessage.success('验证码已发送')
      startCountdown()
    } else {
      ElMessage.error(response.message || '发送验证码失败')
    }
  } catch (error) {
    ElMessage.error(error.response?.data?.detail || '发送验证码失败')
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

onUnmounted(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
  }
})
</script>

<style scoped>
.register-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--background-color);
  padding: 20px;
}

.register-container {
  width: 100%;
  max-width: 420px;
}

.register-header {
  text-align: center;
  margin-bottom: 32px;
}

.register-logo {
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

.register-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 8px 0;
  letter-spacing: -0.02em;
}

.register-subtitle {
  font-size: 14px;
  color: var(--text-muted);
  margin: 0;
}

.register-card {
  background: var(--card-background);
  border-radius: var(--radius-lg);
  padding: 32px;
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--border-color);
}

.register-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  background: var(--surface-color);
  padding: 4px;
  border-radius: var(--radius-md);
}

.register-tab {
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

.register-tab:hover {
  color: var(--primary-color);
}

.register-tab.active {
  background: var(--card-background);
  color: var(--primary-color);
  box-shadow: var(--shadow-sm);
}

.register-form-container {
  min-height: 320px;
}

.register-form {
  width: 100%;
}

.register-form :deep(.el-form-item) {
  margin-bottom: 18px;
}

.register-form :deep(.el-input__wrapper) {
  padding: 4px 12px;
  border-radius: var(--radius-md);
  background: var(--input-background);
  border: 1px solid var(--input-border);
  box-shadow: none;
  transition: var(--transition);
}

.register-form :deep(.el-input__wrapper:hover) {
  border-color: var(--border-hover);
}

.register-form :deep(.el-input__wrapper.is-focus) {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.register-form :deep(.el-input__inner) {
  height: 44px;
  font-size: 14px;
  color: var(--text-primary);
}

.register-form :deep(.el-input__inner::placeholder) {
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

.register-btn {
  width: 100%;
  height: 48px;
  font-size: 15px;
  font-weight: 600;
  border-radius: var(--radius-md);
  background: var(--primary-gradient);
  border: none;
  transition: var(--transition);
  margin-top: 8px;
}

.register-btn:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
  opacity: 0.95;
}

.register-footer {
  text-align: center;
  margin-top: 24px;
  font-size: 13px;
  color: var(--text-muted);
}

.login-link {
  color: var(--primary-color);
  font-weight: 500;
  text-decoration: none;
  margin-left: 4px;
}

.login-link:hover {
  text-decoration: underline;
}
</style>
