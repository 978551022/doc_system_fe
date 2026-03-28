<template>
  <el-config-provider :locale="zhCn" namespace="el">
    <div class="login-page" :class="{ 'dark-theme': isDarkMode }">
      <!-- 左侧展示区 65% -->
      <div class="login-showcase">
        <!-- Three.js 3D 场景容器 -->
        <div ref="threeContainer" class="three-scene"></div>

        <!-- 背景光晕效果 -->
        <div class="bg-gradient">
          <div class="bg-glow bg-glow--1"></div>
          <div class="bg-glow bg-glow--2"></div>
          <div class="bg-glow bg-glow--3"></div>
        </div>

        <!-- 内容层 -->
        <div class="showcase-content">
          <!-- 粒子汇聚 Logo -->
          <div ref="particleLogoContainer" class="particle-logo-container">
            <canvas ref="particleCanvas" class="particle-canvas"></canvas>
          </div>

          <!-- Logo 和标题区 -->
          <div class="brand-section">
            <h1 class="brand-title">DocHub</h1>
            <div class="brand-slogan-wrapper">
              <p class="brand-slogan">
                <span ref="typewriterText"></span>
                <span class="cursor" :class="{ 'cursor-blink': showCursor }">|</span>
              </p>
            </div>
            <p class="brand-subtitle">AI-Powered Document Intelligence</p>
          </div>
        </div>

        <!-- 底部波浪动画 -->
        <div class="wave-container">
          <svg class="wave wave-1" viewBox="0 0 1440 120" preserveAspectRatio="none">
            <path d="M0,60 C240,120 480,0 720,60 C960,120 1200,0 1440,60 L1440,120 L0,120 Z"></path>
          </svg>
          <svg class="wave wave-2" viewBox="0 0 1440 120" preserveAspectRatio="none">
            <path d="M0,40 C240,100 480,0 720,40 C960,80 1200,0 1440,40 L1440,120 L0,120 Z"></path>
          </svg>
          <svg class="wave wave-3" viewBox="0 0 1440 120" preserveAspectRatio="none">
            <path d="M0,80 C240,40 480,120 720,80 C960,40 1200,120 1440,80 L1440,120 L0,120 Z"></path>
          </svg>
        </div>
      </div>

      <!-- 右侧登录区 35% -->
      <div class="login-sidebar">
        <!-- 渐变过渡层 -->
        <div class="sidebar-gradient-overlay"></div>

        <div class="login-sidebar-inner">
          <!-- 登录卡片 -->
          <div class="login-card">
            <!-- 卡片顶部装饰线 -->
            <div class="card-decoration-line"></div>

            <!-- 登录标题 -->
            <div class="login-header">
              <div class="login-icon-wrapper">
                <svg class="login-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="loginIconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style="stop-color:#6366F1" />
                      <stop offset="100%" style="stop-color:#06B6D4" />
                    </linearGradient>
                  </defs>
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="url(#loginIconGradient)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M2 17L12 22L22 17" stroke="url(#loginIconGradient)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M2 12L12 17L22 12" stroke="url(#loginIconGradient)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <h2 class="login-title">欢迎回来</h2>
              <p class="login-subtitle">登录您的 DocHub 账户</p>
            </div>

            <!-- 验证码登录模式 -->
            <transition name="mode-fade" mode="out-in">
              <div v-if="loginMode === 'sms'" key="sms" class="login-mode-container">
                <el-form ref="smsFormRef" :model="smsForm" :rules="smsRules" class="login-form" @submit.prevent="handleSmsLogin">
                  <el-form-item prop="phone">
                    <div class="input-wrapper">
                      <div class="input-icon">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M22 16.92V19.92C22.0011 20.1986 21.9441 20.4742 21.8325 20.7294C21.7209 20.9846 21.5573 21.2137 21.3521 21.4019C21.1468 21.5901 20.9046 21.7336 20.6407 21.8228C20.3769 21.912 20.0974 21.9452 19.82 21.92C16.7428 21.5857 13.787 20.5342 11.19 18.84C8.77382 17.2929 6.72533 15.2444 5.17819 12.8282C3.48002 10.2215 2.42838 7.25316 2.10002 4.16668C2.07523 3.89002 2.10795 3.61123 2.19619 3.34795C2.28443 3.08467 2.42659 2.84284 2.61346 2.63757C2.80032 2.4323 3.02815 2.26815 3.28238 2.15558C3.53661 2.04301 3.81163 1.98472 4.09002 1.98468H7.09002C7.58284 1.97863 8.05813 2.17238 8.41619 2.52676C8.77426 2.88114 8.98884 3.36655 9.02002 3.87868C9.04002 4.16468 9.08002 4.44468 9.14002 4.71868C9.25738 5.26271 9.15656 5.82857 8.85624 6.30128C8.55591 6.774 8.07722 7.11908 7.52002 7.26668L6.44002 7.56668C7.31125 9.68564 8.66619 11.5562 10.4 13.02C11.8659 14.7513 13.7365 16.1042 15.8554 16.9747L16.1554 15.8947C16.303 15.3375 16.6481 14.8588 17.1208 14.5585C17.5935 14.2581 18.1593 14.1573 18.7034 14.2747C18.9774 14.3347 19.2574 14.3747 19.5434 14.3947C20.0555 14.4258 20.5409 14.6404 20.8953 14.9985C21.2497 15.3566 21.4434 15.8318 21.4374 16.3247L22 16.92H22Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                      </div>
                      <el-input
                        v-model="smsForm.phone"
                        placeholder="手机号"
                        size="large"
                        class="custom-input"
                        @keyup.enter="handleSmsLogin"
                      />
                    </div>
                  </el-form-item>

                  <el-form-item prop="code">
                    <div class="input-wrapper code-wrapper">
                      <div class="input-icon">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M22 10.878V13.122C22.0011 13.3129 21.9628 13.5022 21.8872 13.6781C21.8116 13.854 21.7004 14.0129 21.5605 14.1444C21.4207 14.2759 21.2554 14.3773 21.0746 14.4418C20.8938 14.5064 20.7014 14.5326 20.51 14.519H20.5C19.986 14.517 19.491 14.329 19.107 13.99C18.667 13.603 18.247 13.194 17.847 12.763C17.447 12.332 17.067 11.883 16.707 11.416C16.247 10.816 15.827 10.196 15.447 9.55597C15.067 8.91597 14.727 8.25597 14.427 7.57597C14.127 6.89597 13.867 6.20597 13.647 5.50597C13.427 4.80597 13.247 4.09597 13.107 3.37597C13.047 3.07597 13.007 2.77597 12.977 2.47597C12.9468 2.15115 12.9866 1.82309 13.0932 1.51544C13.1999 1.20779 13.3708 0.928394 13.5936 0.697311C13.8164 0.466228 14.0857 0.289359 14.3822 0.180136C14.6787 0.0709125 14.995 -0.0175716 15.317 0.00297286H18.317C18.8098 -0.00308154 19.2862 0.189903 19.6452 0.544386C20.0042 0.898869 20.2187 1.38492 20.247 1.89797C20.267 2.18397 20.297 2.46397 20.337 2.73797C20.447 3.5047 20.6137 4.26291 20.837 5.00597C21.057 5.73797 21.327 6.45597 21.647 7.15797C21.967 7.85997 22.337 8.54597 22.757 9.21597C23.177 9.88597 23.647 10.54 24.167 11.17C24.687 11.8 25.257 12.41 25.877 12.99C26.497 13.57 27.157 14.12 27.857 14.64C28.557 15.16 29.297 15.64 30.077 16.08C30.857 16.52 31.677 16.92 32.537 17.28C33.397 17.64 34.297 17.96 35.237 18.24C36.177 18.52 37.157 18.76 38.167 18.96C39.177 19.16 40.217 19.32 41.287 19.44C42.357 19.56 43.457 19.64 44.577 19.68C45.697 19.72 46.837 19.72 47.997 19.68L22 10.878ZM22 10.878V13.122C22.0011 13.3129 21.9628 13.5022 21.8872 13.6781C21.8116 13.854 21.7004 14.0129 21.5605 14.1444C21.4207 14.2759 21.2554 14.3773 21.0746 14.4418C20.8938 14.5064 20.7014 14.5326 20.51 14.519H20.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                          <path d="M7 8H17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                          <path d="M7 12H13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                      </div>
                      <el-input
                        v-model="smsForm.code"
                        placeholder="验证码"
                        size="large"
                        maxlength="6"
                        class="custom-input code-input"
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
                    <button type="button" :loading="loading" class="login-btn" @click="handleSmsLogin">
                      <span class="btn-text">登录</span>
                      <span class="btn-glow"></span>
                    </button>
                  </el-form-item>
                </el-form>

                <div class="login-mode-switch">
                  还没有账号？<router-link to="/register" class="register-link">立即注册</router-link>
                </div>
              </div>

              <!-- 密码登录模式 -->
              <div v-else key="password" class="login-mode-container">
                <el-form ref="passwordFormRef" :model="passwordForm" :rules="passwordRules" class="login-form" @submit.prevent="handlePasswordLogin">
                  <el-form-item prop="identifier">
                    <div class="input-wrapper">
                      <div class="input-icon">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                          <circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="2"/>
                        </svg>
                      </div>
                      <el-input
                        v-model="passwordForm.identifier"
                        placeholder="手机号 / 邮箱 / 用户名"
                        size="large"
                        class="custom-input"
                        @keyup.enter="handlePasswordLogin"
                      />
                    </div>
                  </el-form-item>

                  <el-form-item prop="password">
                    <div class="input-wrapper">
                      <div class="input-icon">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" stroke-width="2"/>
                          <path d="M7 11V7C7 5.67392 7.52678 4.40215 8.46447 3.46447C9.40215 2.52678 10.6739 2 12 2C13.3261 2 14.5979 2.52678 15.5355 3.46447C16.4732 4.40215 17 5.67392 17 7V11" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                      </div>
                      <el-input
                        v-model="passwordForm.password"
                        type="password"
                        placeholder="密码"
                        size="large"
                        show-password
                        class="custom-input"
                        @keyup.enter="handlePasswordLogin"
                      />
                    </div>
                  </el-form-item>

                  <el-form-item>
                    <button type="button" :loading="loading" class="login-btn" @click="handlePasswordLogin">
                      <span class="btn-text">登录</span>
                      <span class="btn-glow"></span>
                    </button>
                  </el-form-item>
                </el-form>

                <div class="login-mode-switch">
                  还没有账号？<router-link to="/register" class="register-link">立即注册</router-link>
                </div>
              </div>
            </transition>

            <!-- 登录模式切换 -->
            <div class="mode-toggle" @click="toggleLoginMode">
              <span v-if="loginMode === 'sms'">
                使用密码登录 <svg class="toggle-arrow" viewBox="0 0 24 24" fill="none"><path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </span>
              <span v-else>
                使用验证码登录 <svg class="toggle-arrow" viewBox="0 0 24 24" fill="none"><path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </span>
            </div>

            <!-- 分隔线 -->
            <div class="login-divider">
              <span>其他方式</span>
            </div>

            <!-- 其他登录方式 -->
            <div class="other-login-methods">
              <button class="wechat-login-btn" @click="handleWechatLogin">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 0 1-.023-.156.49.49 0 0 1 .201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-6.656-6.088V8.89c-.135-.01-.27-.027-.407-.03zm-2.53 3.274c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.969-.982z"/>
                </svg>
                微信
              </button>
              <button class="guest-login-btn" @click="handleGuestLogin">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15 3H4V21H20V8L15 3Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M14 3V9H20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                访客
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 微信扫码弹窗 -->
      <el-dialog
        v-model="wechatDialogVisible"
        title="微信扫码登录"
        width="360px"
        center
        :close-on-click-modal="false"
        class="wechat-dialog"
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
  </el-config-provider>
</template>

<script setup>
import { ref, reactive, onUnmounted, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'
import zhCn from 'element-plus/es/locale/lang/zh-cn.mjs'
import * as THREE from 'three'
import { passwordLogin, smsLogin, guestLogin, sendVerificationCode, getWechatQrCodeUrl } from '../api/auth.js'
import { login } from '../utils/userStore.js'

const router = useRouter()

// UI状态
const loginMode = ref('sms') // 'sms' | 'password'
const loading = ref(false)
const sendingCode = ref(false)
const wechatDialogVisible = ref(false)
const wechatQrUrl = ref('')
const countdown = ref(0)
const isDarkMode = ref(false)
const showCursor = ref(true)
let countdownTimer = null

// 打字机效果
const typewriterText = ref(null)
const sloganText = '智启未来'
let typewriterIndex = 0

// Three.js 相关
const threeContainer = ref(null)
let scene, camera, renderer, animationId
let particles, particleLines, geometries = []

// 粒子Logo相关
const particleCanvas = ref(null)
const particleLogoContainer = ref(null)
let logoCtx, logoParticles = []
let logoAnimationId = null

// 表单数据
const smsForm = reactive({
  phone: '',
  code: ''
})

const passwordForm = reactive({
  identifier: '',
  password: ''
})

const smsFormRef = ref(null)
const passwordFormRef = ref(null)

// 表单验证
const validatePhone = (rule, value, callback) => {
  if (!value) {
    callback(new Error('请输入手机号'))
  } else if (!/^1[3-9]\d{9}$/.test(value)) {
    callback(new Error('请输入正确的手机号'))
  } else {
    callback()
  }
}

const smsRules = {
  phone: [{ required: true, validator: validatePhone, trigger: 'blur' }],
  code: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { len: 6, message: '验证码为6位数字', trigger: 'blur' }
  ]
}

const passwordRules = {
  identifier: [{ required: true, message: '请输入手机号/邮箱/用户名', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ]
}

// 打字机效果
const startTypewriter = () => {
  typewriterIndex = 0
  typewriterText.value.textContent = ''

  const typeNextChar = () => {
    if (typewriterIndex < sloganText.length) {
      typewriterText.value.textContent += sloganText.charAt(typewriterIndex)
      typewriterIndex++
      setTimeout(typeNextChar, 150)
    } else {
      // 打字完成，开始光标闪烁
      setTimeout(() => {
        showCursor.value = true
      }, 500)
    }
  }

  setTimeout(typeNextChar, 500)
}

// 切换登录模式
function toggleLoginMode() {
  loginMode.value = loginMode.value === 'sms' ? 'password' : 'sms'
}

// 登录成功处理
const handleLoginSuccess = (response, loginType = 'sms') => {
  if (response.success) {
    let avatarUrl = response.user_info.avatar
    if (avatarUrl === 'null' || avatarUrl === 'undefined' || avatarUrl === null || avatarUrl === '') {
      avatarUrl = ''
    } else if (avatarUrl) {
      if (!avatarUrl.startsWith('http://') && !avatarUrl.startsWith('https://')) {
        if (avatarUrl.startsWith('/api/')) {
          avatarUrl = avatarUrl
        } else {
          const normalizedPath = avatarUrl.startsWith('/') ? avatarUrl : '/' + avatarUrl
          avatarUrl = '/api/v1' + normalizedPath
        }
      }
    }

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
    ElMessage.success('登录成功')
    router.push('/chat')
  } else {
    ElMessage.error(response.message || '登录失败')
  }
}

// 验证码登录
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

// 密码登录
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

// 发送验证码
const handleSendCode = async (type) => {
  if (!smsForm.phone || !/^1[3-9]\d{9}$/.test(smsForm.phone)) {
    ElMessage.warning('请输入正确的手机号')
    return
  }

  sendingCode.value = true
  try {
    const response = await sendVerificationCode(smsForm.phone, type)
    ElMessage.success('验证码已发送')
    startCountdown()
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

// 微信登录
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

// 访客登录
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

// 检测深色模式
const checkDarkMode = () => {
  isDarkMode.value = document.body.classList.contains('dark-theme') ||
                    localStorage.getItem('appTheme') === 'dark'
}

// ==================== 粒子汇聚Logo ====================
const initParticleLogo = () => {
  if (!particleCanvas.value || !particleLogoContainer.value) return

  const canvas = particleCanvas.value
  const container = particleLogoContainer.value
  logoCtx = canvas.getContext('2d')

  // 设置画布大小
  const dpr = window.devicePixelRatio || 1
  const rect = container.getBoundingClientRect()
  canvas.width = rect.width * dpr
  canvas.height = rect.height * dpr
  canvas.style.width = rect.width + 'px'
  canvas.style.height = rect.height + 'px'
  logoCtx.scale(dpr, dpr)

  // 创建"DocHub"文字粒子
  createTextParticles('DocHub', rect.width, rect.height)

  // 开始动画
  animateLogoParticles()
}

const createTextParticles = (text, width, height) => {
  logoParticles = []

  // 创建临时画布获取文字像素
  const tempCanvas = document.createElement('canvas')
  const tempCtx = tempCanvas.getContext('2d')
  tempCanvas.width = width
  tempCanvas.height = height

  // 绘制文字
  const fontSize = Math.min(width / 6, 48)
  tempCtx.font = `bold ${fontSize}px system-ui, -apple-system, sans-serif`
  tempCtx.fillStyle = '#ffffff'
  tempCtx.textAlign = 'center'
  tempCtx.textBaseline = 'middle'
  tempCtx.fillText(text, width / 2, height / 2)

  // 获取像素数据
  const imageData = tempCtx.getImageData(0, 0, width, height)
  const data = imageData.data

  // 从像素创建粒子
  const step = 4 // 粒子间隔
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const i = (y * width + x) * 4
      if (data[i + 3] > 128) { // 透明度大于128的像素
        // 粒子起始位置（随机分布在画布外）
        const angle = Math.random() * Math.PI * 2
        const distance = Math.max(width, height)

        logoParticles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          targetX: x,
          targetY: y,
          vx: 0,
          vy: 0,
          size: Math.random() * 2 + 1,
          color: `hsl(${Math.random() * 60 + 220}, 80%, 60%)`, // 蓝紫色系
          delay: Math.random() * 1000,
          arrived: false
        })
      }
    }
  }
}

const animateLogoParticles = () => {
  if (!logoCtx || !particleCanvas.value) return

  const canvas = particleCanvas.value
  const width = canvas.width / (window.devicePixelRatio || 1)
  const height = canvas.height / (window.devicePixelRatio || 1)

  logoCtx.clearRect(0, 0, width, height)

  let allArrived = true
  const currentTime = Date.now()

  logoParticles.forEach((particle, index) => {
    if (currentTime < particle.delay) {
      allArrived = false
      return
    }

    const dx = particle.targetX - particle.x
    const dy = particle.targetY - particle.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    if (distance > 1) {
      allArrived = false
      // 弹簧物理
      const spring = 0.03
      const friction = 0.9

      particle.vx += dx * spring
      particle.vy += dy * spring
      particle.vx *= friction
      particle.vy *= friction

      particle.x += particle.vx
      particle.y += particle.vy
    } else {
      particle.arrived = true
    }

    // 绘制粒子
    logoCtx.beginPath()
    logoCtx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
    logoCtx.fillStyle = particle.color
    logoCtx.fill()

    // 粒子发光效果
    if (!particle.arrived) {
      logoCtx.beginPath()
      logoCtx.arc(particle.x, particle.y, particle.size * 2, 0, Math.PI * 2)
      logoCtx.fillStyle = particle.color.replace('60%', '40%').replace(')', ', 0.3)')
      logoCtx.fill()
    }
  })

  logoAnimationId = requestAnimationFrame(animateLogoParticles)
}

// ==================== Three.js 场景 ====================
const initThreeScene = () => {
  if (!threeContainer.value) return

  // 场景
  scene = new THREE.Scene()

  // 相机
  camera = new THREE.PerspectiveCamera(
    75,
    threeContainer.value.clientWidth / threeContainer.value.clientHeight,
    0.1,
    1000
  )
  camera.position.z = 50

  // 渲染器
  renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true
  })
  renderer.setSize(threeContainer.value.clientWidth, threeContainer.value.clientHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  threeContainer.value.appendChild(renderer.domElement)

  // 创建粒子系统
  createParticles()

  // 创建几何体
  createGeometries()

  // 鼠标交互
  setupMouseInteraction()

  // 开始动画
  animate()
}

// 创建粒子
const createParticles = () => {
  const particleCount = 150
  const positions = new Float32Array(particleCount * 3)
  const colors = new Float32Array(particleCount * 3)
  const sizes = new Float32Array(particleCount)

  const colorPalette = [
    new THREE.Color('#6366F1'),
    new THREE.Color('#8B5CF6'),
    new THREE.Color('#06B6D4')
  ]

  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 100
    positions[i * 3 + 1] = (Math.random() - 0.5) * 60
    positions[i * 3 + 2] = (Math.random() - 0.5) * 40

    const color = colorPalette[Math.floor(Math.random() * colorPalette.length)]
    colors[i * 3] = color.r
    colors[i * 3 + 1] = color.g
    colors[i * 3 + 2] = color.b

    sizes[i] = Math.random() * 2 + 0.5
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

  const material = new THREE.PointsMaterial({
    size: 1.5,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    sizeAttenuation: true
  })

  particles = new THREE.Points(geometry, material)
  scene.add(particles)

  // 创建连线
  createParticleLines(positions)
}

// 创建粒子连线
const createParticleLines = (positions) => {
  const linePositions = []
  const lineColors = []
  const maxDistance = 15

  for (let i = 0; i < positions.length; i += 3) {
    for (let j = i + 3; j < positions.length; j += 3) {
      const dx = positions[i] - positions[j]
      const dy = positions[i + 1] - positions[j + 1]
      const dz = positions[i + 2] - positions[j + 2]
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz)

      if (distance < maxDistance) {
        linePositions.push(
          positions[i], positions[i + 1], positions[i + 2],
          positions[j], positions[j + 1], positions[j + 2]
        )

        const opacity = 1 - distance / maxDistance
        lineColors.push(0.39, 0.4, 0.95, opacity * 0.3)
      }
    }
  }

  const lineGeometry = new THREE.BufferGeometry()
  lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3))
  lineGeometry.setAttribute('color', new THREE.Float32BufferAttribute(lineColors, 4))

  const lineMaterial = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.3
  })

  particleLines = new THREE.LineSegments(lineGeometry, lineMaterial)
  scene.add(particleLines)
}

// 创建漂浮几何体
const createGeometries = () => {
  // 正二十面体（线框）
  const icosaGeometry = new THREE.IcosahedronGeometry(8, 0)
  const icosaMaterial = new THREE.MeshBasicMaterial({
    color: 0x6366F1,
    wireframe: true,
    transparent: true,
    opacity: 0.3
  })
  const icosahedron = new THREE.Mesh(icosaGeometry, icosaMaterial)
  icosahedron.position.set(-25, 10, -10)
  icosahedron.userData = { rotationSpeed: { x: 0.003, y: 0.005 }, floatSpeed: 0.01, floatOffset: 0 }
  scene.add(icosahedron)
  geometries.push(icosahedron)

  // 环形结
  const torusGeometry = new THREE.TorusKnotGeometry(5, 1.5, 100, 16)
  const torusMaterial = new THREE.MeshBasicMaterial({
    color: 0x8B5CF6,
    wireframe: true,
    transparent: true,
    opacity: 0.25
  })
  const torus = new THREE.Mesh(torusGeometry, torusMaterial)
  torus.position.set(20, -15, -15)
  torus.userData = { rotationSpeed: { x: 0.005, y: 0.002 }, floatSpeed: 0.008, floatOffset: Math.PI }
  scene.add(torus)
  geometries.push(torus)

  // 八面体
  const octaGeometry = new THREE.OctahedronGeometry(6)
  const octaMaterial = new THREE.MeshBasicMaterial({
    color: 0x06B6D4,
    wireframe: true,
    transparent: true,
    opacity: 0.3
  })
  const octahedron = new THREE.Mesh(octaGeometry, octaMaterial)
  octahedron.position.set(0, 20, -20)
  octahedron.userData = { rotationSpeed: { x: 0.004, y: 0.003 }, floatSpeed: 0.012, floatOffset: Math.PI * 0.5 }
  scene.add(octahedron)
  geometries.push(octahedron)

  // 第二个正二十面体
  const icosaGeometry2 = new THREE.IcosahedronGeometry(5, 0)
  const icosaMaterial2 = new THREE.MeshBasicMaterial({
    color: 0x10B981,
    wireframe: true,
    transparent: true,
    opacity: 0.25
  })
  const icosahedron2 = new THREE.Mesh(icosaGeometry2, icosaMaterial2)
  icosahedron2.position.set(-20, -10, -15)
  icosahedron2.userData = { rotationSpeed: { x: 0.002, y: 0.006 }, floatSpeed: 0.009, floatOffset: Math.PI * 1.5 }
  scene.add(icosahedron2)
  geometries.push(icosahedron2)

  // 环形
  const ringGeometry = new THREE.TorusGeometry(10, 0.3, 64, 4)
  const ringMaterial = new THREE.MeshBasicMaterial({
    color: 0xF59E0B,
    transparent: true,
    opacity: 0.2
  })
  const ring = new THREE.Mesh(ringGeometry, ringMaterial)
  ring.position.set(25, 15, -25)
  ring.userData = { rotationSpeed: { x: 0.01, y: 0.005, z: 0.002 }, floatSpeed: 0.006, floatOffset: 0 }
  scene.add(ring)
  geometries.push(ring)
}

// 鼠标交互
const setupMouseInteraction = () => {
  let mouseX = 0
  let mouseY = 0

  const onMouseMove = (event) => {
    mouseX = (event.clientX / window.innerWidth) * 2 - 1
    mouseY = -(event.clientY / window.innerHeight) * 2 + 1

    // 相机轻微移动
    if (camera) {
      camera.position.x += (mouseX * 5 - camera.position.x) * 0.05
      camera.position.y += (mouseY * 5 - camera.position.y) * 0.05
      camera.lookAt(scene.position)
    }
  }

  window.addEventListener('mousemove', onMouseMove)
}

// 动画循环
const animate = () => {
  animationId = requestAnimationFrame(animate)

  const time = Date.now() * 0.001

  // 粒子动画
  if (particles) {
    particles.rotation.y = time * 0.05
    particles.rotation.x = Math.sin(time * 0.2) * 0.1
  }

  if (particleLines) {
    particleLines.rotation.y = time * 0.05
    particleLines.rotation.x = Math.sin(time * 0.2) * 0.1
  }

  // 几何体动画
  geometries.forEach((mesh, index) => {
    mesh.rotation.x += mesh.userData.rotationSpeed.x
    mesh.rotation.y += mesh.userData.rotationSpeed.y
    if (mesh.userData.rotationSpeed.z) {
      mesh.rotation.z += mesh.userData.rotationSpeed.z
    }
    mesh.position.y += Math.sin(time + mesh.userData.floatOffset) * mesh.userData.floatSpeed
  })

  renderer.render(scene, camera)
}

// 窗口大小调整
const handleResize = () => {
  // Three.js
  if (threeContainer.value && camera && renderer) {
    const width = threeContainer.value.clientWidth
    const height = threeContainer.value.clientHeight
    camera.aspect = width / height
    camera.updateProjectionMatrix()
    renderer.setSize(width, height)
  }

  // 粒子Logo
  if (particleCanvas.value && particleLogoContainer.value) {
    const rect = particleLogoContainer.value.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    particleCanvas.value.width = rect.width * dpr
    particleCanvas.value.height = rect.height * dpr
    particleCanvas.value.style.width = rect.width + 'px'
    particleCanvas.value.style.height = rect.height + 'px'
    if (logoCtx) {
      logoCtx.scale(dpr, dpr)
      createTextParticles('DocHub', rect.width, rect.height)
    }
  }
}

// 生命周期
onMounted(() => {
  checkDarkMode()
  startTypewriter()

  // 延迟初始化 Three.js，确保 DOM 已渲染
  setTimeout(() => {
    initThreeScene()
    initParticleLogo()
  }, 100)

  window.addEventListener('resize', handleResize)

  // 监听主题变化
  const observer = new MutationObserver(() => {
    checkDarkMode()
  })
  observer.observe(document.body, {
    attributes: true,
    attributeFilter: ['class']
  })
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)

  if (animationId) {
    cancelAnimationFrame(animationId)
  }

  if (logoAnimationId) {
    cancelAnimationFrame(logoAnimationId)
  }

  if (renderer) {
    renderer.dispose()
  }

  if (countdownTimer) {
    clearInterval(countdownTimer)
  }
})

onUnmounted(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
  }
})
</script>

<style scoped>
/* ==================== 主容器 ==================== */
.login-page {
  min-height: 100vh;
  display: flex;
  width: 100%;
  overflow: hidden;
  background: #0F172A;
}

/* ==================== 左侧展示区 65% ==================== */
.login-showcase {
  position: relative;
  width: 65%;
  height: 100vh;
  overflow: hidden;
  background: linear-gradient(135deg, #0F172A 0%, #1E1B4B 50%, #312E81 100%);
}

/* Three.js 场景容器 */
.three-scene {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

/* 背景光晕 */
.bg-gradient {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  pointer-events: none;
}

.bg-glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.5;
  animation: pulse-glow 8s ease-in-out infinite;
}

.bg-glow--1 {
  width: 400px;
  height: 400px;
  top: -100px;
  left: -100px;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.4) 0%, transparent 70%);
}

.bg-glow--2 {
  width: 300px;
  height: 300px;
  bottom: 20%;
  right: 10%;
  background: radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, transparent 70%);
  animation-delay: 4s;
}

.bg-glow--3 {
  width: 250px;
  height: 250px;
  top: 40%;
  right: 30%;
  background: radial-gradient(circle, rgba(6, 182, 212, 0.25) 0%, transparent 70%);
  animation-delay: 2s;
}

@keyframes pulse-glow {
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.1); }
}

/* 内容层 */
.showcase-content {
  position: relative;
  z-index: 2;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 60px;
  box-sizing: border-box;
}

/* 粒子Logo容器 */
.particle-logo-container {
  width: 200px;
  height: 60px;
  margin-bottom: 32px;
  animation: fade-in-up 1s ease-out;
}

.particle-canvas {
  width: 100%;
  height: 100%;
}

/* 品牌 Logo 区 */
.brand-section {
  text-align: center;
  animation: fade-in-up 0.8s ease-out 0.5s backwards;
}

.brand-title {
  font-size: 72px;
  font-weight: 800;
  margin: 0 0 16px 0;
  background: linear-gradient(135deg, #E0E7FF 0%, #A5B4FC 50%, #67E8F9 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.02em;
  text-shadow: 0 0 60px rgba(99, 102, 241, 0.5);
}

.brand-slogan-wrapper {
  min-height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
}

.brand-slogan {
  font-size: 32px;
  font-weight: 700;
  color: #E0E7FF;
  margin: 0;
  letter-spacing: 0.5em;
  text-shadow: 0 0 40px rgba(99, 102, 241, 0.6);
  position: relative;
}

.cursor {
  color: #6366F1;
  margin-left: 4px;
}

.cursor-blink {
  animation: blink 1s step-end infinite;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

.brand-subtitle {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
  letter-spacing: 0.3em;
  text-transform: uppercase;
}

/* 底部波浪 */
.wave-container {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 120px;
  z-index: 3;
  overflow: hidden;
}

.wave {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.wave path {
  fill: rgba(255, 255, 255, 0.03);
}

.wave-1 {
  animation: wave-move 8s ease-in-out infinite;
}

.wave-2 {
  animation: wave-move 10s ease-in-out infinite reverse;
  opacity: 0.5;
}

.wave-3 {
  animation: wave-move 12s ease-in-out infinite;
  opacity: 0.3;
}

@keyframes wave-move {
  0%, 100% { transform: translateX(0); }
  50% { transform: translateX(-50px); }
}

/* ==================== 右侧登录区 35% ==================== */
.login-sidebar {
  position: relative;
  width: 35%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 27, 75, 0.9) 100%);
  backdrop-filter: blur(30px);
}

/* 渐变过渡层 */
.sidebar-gradient-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background:
    linear-gradient(90deg, rgba(99, 102, 241, 0.1) 0%, transparent 20%),
    radial-gradient(ellipse at 20% 50%, rgba(139, 92, 246, 0.08) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 80%, rgba(6, 182, 212, 0.06) 0%, transparent 40%);
  pointer-events: none;
}

.login-sidebar-inner {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 400px;
}

.login-card {
  position: relative;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 32px;
  padding: 40px 36px;
  box-shadow:
    0 25px 80px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.05) inset,
    0 -50px 100px rgba(99, 102, 241, 0.1) inset;
  animation: fade-in-scale 0.8s ease-out 1s backwards;
  overflow: hidden;
}

/* 卡片装饰线 */
.card-decoration-line {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 60%;
  height: 2px;
  background: linear-gradient(90deg,
    transparent 0%,
    #6366F1 20%,
    #8B5CF6 50%,
    #06B6D4 80%,
    transparent 100%);
}

/* 登录头部 */
.login-header {
  text-align: center;
  margin-bottom: 36px;
}

.login-icon-wrapper {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border-radius: 20px;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(6, 182, 212, 0.1) 100%);
  border: 1px solid rgba(99, 102, 241, 0.3);
  margin-bottom: 20px;
  box-shadow: 0 8px 32px rgba(99, 102, 241, 0.2);
}

.login-icon {
  width: 32px;
  height: 32px;
}

.login-title {
  font-size: 26px;
  font-weight: 700;
  color: #E0E7FF;
  margin: 0 0 8px 0;
  letter-spacing: -0.01em;
}

.login-subtitle {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
}

/* 表单样式 */
.login-form {
  margin-bottom: 24px;
}

.login-form :deep(.el-form-item) {
  margin-bottom: 20px;
}

/* 自定义输入框 */
.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  transition: all 0.3s ease;
  height: 54px;
}

.input-wrapper:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(99, 102, 241, 0.3);
}

.input-wrapper:focus-within {
  background: rgba(255, 255, 255, 0.06);
  border-color: #6366F1;
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
}

.input-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 100%;
  flex-shrink: 0;
}

.input-icon svg {
  width: 22px;
  height: 22px;
  color: rgba(255, 255, 255, 0.5);
  transition: color 0.3s ease;
}

.input-wrapper:focus-within .input-icon svg {
  color: #6366F1;
}

.custom-input {
  flex: 1;
  height: 100%;
}

.custom-input :deep(.el-input__wrapper) {
  background: transparent;
  border: none;
  box-shadow: none;
  padding: 0;
  height: 100%;
}

.custom-input :deep(.el-input__inner) {
  color: #E0E7FF;
  font-size: 15px;
  background: transparent;
  border: none;
  height: 100%;
  padding: 0;
}

.custom-input :deep(.el-input__inner::placeholder) {
  color: rgba(255, 255, 255, 0.35);
}

.custom-input :deep(.el-input__prefix) {
  display: none;
}

/* 验证码输入框 */
.code-wrapper {
  padding-right: 4px;
}

.code-input {
  flex: 1;
}

.send-code-btn {
  flex-shrink: 0;
  height: 44px;
  padding: 0 18px;
  margin-right: 6px;
  font-size: 13px;
  font-weight: 600;
  border-radius: 12px;
  background: rgba(99, 102, 241, 0.15);
  border: 1px solid rgba(99, 102, 241, 0.3);
  color: #A5B4FC;
  transition: all 0.3s ease;
  cursor: pointer;
}

.send-code-btn:hover:not(:disabled) {
  background: rgba(99, 102, 241, 0.25);
  border-color: #6366F1;
  color: #E0E7FF;
  transform: translateY(-1px);
}

.send-code-btn:disabled {
  background: rgba(255, 255, 255, 0.03);
  border-color: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.25);
  cursor: not-allowed;
}

/* 登录按钮 */
.login-btn {
  position: relative;
  width: 100%;
  height: 54px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 16px;
  background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #06B6D4 100%);
  border: none;
  color: white;
  cursor: pointer;
  overflow: hidden;
  transition: all 0.3s ease;
  box-shadow: 0 8px 24px rgba(99, 102, 241, 0.35);
}

.login-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 32px rgba(99, 102, 241, 0.45);
}

.login-btn:active {
  transform: translateY(0);
}

.btn-text {
  position: relative;
  z-index: 1;
}

.btn-glow {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s ease;
}

.login-btn:hover .btn-glow {
  left: 100%;
}

/* 登录模式切换 */
.mode-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px 0;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 16px;
}

.mode-toggle:hover {
  color: #E0E7FF;
}

.toggle-arrow {
  width: 18px;
  height: 18px;
  margin-left: 6px;
  transition: transform 0.3s ease;
}

.mode-toggle:hover .toggle-arrow {
  transform: translateX(4px);
}

/* 模式切换动画 */
.mode-fade-enter-active,
.mode-fade-leave-active {
  transition: all 0.3s ease;
}

.mode-fade-enter-from {
  opacity: 0;
  transform: translateX(-10px);
}

.mode-fade-leave-to {
  opacity: 0;
  transform: translateX(10px);
}

/* 登录/注册切换 */
.login-mode-switch {
  text-align: center;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
  padding-top: 8px;
}

.register-link {
  color: #818CF8;
  text-decoration: none;
  font-weight: 500;
  margin-left: 4px;
  transition: color 0.3s ease;
}

.register-link:hover {
  color: #A5B4FC;
  text-decoration: underline;
}

/* 分隔线 */
.login-divider {
  display: flex;
  align-items: center;
  margin: 24px 0 20px;
}

.login-divider::before,
.login-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
}

.login-divider span {
  padding: 0 16px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.35);
  letter-spacing: 0.05em;
}

/* 其他登录方式 */
.other-login-methods {
  display: flex;
  gap: 12px;
}

.wechat-login-btn,
.guest-login-btn {
  flex: 1;
  height: 48px;
  font-size: 13px;
  font-weight: 500;
  border-radius: 14px;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  border: 1px solid transparent;
}

.wechat-login-btn {
  background: rgba(7, 193, 96, 0.15);
  border-color: rgba(7, 193, 96, 0.3);
  color: #6EE7B7;
}

.wechat-login-btn:hover {
  background: rgba(7, 193, 96, 0.25);
  border-color: #07C160;
  color: #6EE7B7;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(7, 193, 96, 0.2);
}

.wechat-login-btn svg {
  width: 18px;
  height: 18px;
}

.guest-login-btn {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.6);
}

.guest-login-btn:hover {
  background: rgba(99, 102, 241, 0.15);
  border-color: rgba(99, 102, 241, 0.3);
  color: #E0E7FF;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.15);
}

.guest-login-btn svg {
  width: 18px;
  height: 18px;
}

/* 微信弹窗 */
:deep(.wechat-dialog) {
  background: rgba(30, 41, 59, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

:deep(.wechat-dialog .el-dialog__header) {
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

:deep(.wechat-dialog .el-dialog__title) {
  color: #E0E7FF;
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
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  background: white;
}

.qrcode-tip {
  margin-top: 16px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
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
  color: #6366F1;
}

.qrcode-loading p {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
}

/* 动画 */
@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(40px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fade-in-scale {
  from {
    opacity: 0;
    transform: scale(0.92);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* ==================== 浅色模式适配 ==================== */
.login-page:not(.dark-theme) {
  background: linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 50%, #DBEAFE 100%);
}

.login-page:not(.dark-theme) .login-showcase {
  background: linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 50%, #DBEAFE 100%);
}

.login-page:not(.dark-theme) .bg-glow--1 {
  background: radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%);
}

.login-page:not(.dark-theme) .bg-glow--2 {
  background: radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%);
}

.login-page:not(.dark-theme) .bg-glow--3 {
  background: radial-gradient(circle, rgba(6, 182, 212, 0.08) 0%, transparent 70%);
}

.login-page:not(.dark-theme) .wave path {
  fill: rgba(99, 102, 241, 0.06);
}

.login-page:not(.dark-theme) .brand-title {
  background: linear-gradient(135deg, #1E293B 0%, #4F46E5 50%, #0891B2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: none;
}

.login-page:not(.dark-theme) .brand-slogan {
  color: #1E293B;
  text-shadow: none;
}

.login-page:not(.dark-theme) .cursor {
  color: #6366F1;
}

.login-page:not(.dark-theme) .brand-subtitle {
  color: rgba(0, 0, 0, 0.5);
}

.login-page:not(.dark-theme) .login-sidebar {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(248, 250, 252, 0.9) 100%);
}

.login-page:not(.dark-theme) .sidebar-gradient-overlay {
  background:
    linear-gradient(90deg, rgba(99, 102, 241, 0.05) 0%, transparent 20%),
    radial-gradient(ellipse at 20% 50%, rgba(139, 92, 246, 0.03) 0%, transparent 50%);
}

.login-page:not(.dark-theme) .login-card {
  background: rgba(255, 255, 255, 0.9);
  border-color: rgba(0, 0, 0, 0.08);
  box-shadow:
    0 25px 80px rgba(0, 0, 0, 0.1),
    0 0 0 1px rgba(0, 0, 0, 0.03) inset,
    0 -50px 100px rgba(99, 102, 241, 0.05) inset;
}

.login-page:not(.dark-theme) .login-icon-wrapper {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(6, 182, 212, 0.05) 100%);
  border-color: rgba(99, 102, 241, 0.2);
  box-shadow: 0 8px 32px rgba(99, 102, 241, 0.1);
}

.login-page:not(.dark-theme) .login-title {
  color: #1E293B;
}

.login-page:not(.dark-theme) .login-subtitle {
  color: rgba(0, 0, 0, 0.5);
}

.login-page:not(.dark-theme) .input-wrapper {
  background: rgba(255, 255, 255, 0.8);
  border-color: rgba(0, 0, 0, 0.1);
}

.login-page:not(.dark-theme) .input-wrapper:hover {
  background: rgba(255, 255, 255, 0.95);
  border-color: #6366F1;
}

.login-page:not(.dark-theme) .input-wrapper:focus-within {
  background: #FFFFFF;
  border-color: #6366F1;
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
}

.login-page:not(.dark-theme) .input-icon svg {
  color: rgba(0, 0, 0, 0.4);
}

.login-page:not(.dark-theme) .input-wrapper:focus-within .input-icon svg {
  color: #6366F1;
}

.login-page:not(.dark-theme) .custom-input :deep(.el-input__inner) {
  color: #1E293B;
}

.login-page:not(.dark-theme) .custom-input :deep(.el-input__inner::placeholder) {
  color: rgba(0, 0, 0, 0.35);
}

.login-page:not(.dark-theme) .send-code-btn {
  background: rgba(99, 102, 241, 0.08);
  border-color: rgba(99, 102, 241, 0.2);
  color: #6366F1;
}

.login-page:not(.dark-theme) .send-code-btn:hover:not(:disabled) {
  background: #6366F1;
  border-color: #6366F1;
  color: white;
}

.login-page:not(.dark-theme) .send-code-btn:disabled {
  background: rgba(0, 0, 0, 0.03);
  border-color: rgba(0, 0, 0, 0.08);
  color: rgba(0, 0, 0, 0.3);
}

.login-page:not(.dark-theme) .mode-toggle {
  color: rgba(0, 0, 0, 0.5);
}

.login-page:not(.dark-theme) .mode-toggle:hover {
  color: #1E293B;
}

.login-page:not(.dark-theme) .login-mode-switch {
  color: rgba(0, 0, 0, 0.5);
}

.login-page:not(.dark-theme) .login-divider::before,
.login-page:not(.dark-theme) .login-divider::after {
  background: linear-gradient(90deg, transparent, rgba(0, 0, 0, 0.08), transparent);
}

.login-page:not(.dark-theme) .login-divider span {
  color: rgba(0, 0, 0, 0.35);
}

.login-page:not(.dark-theme) .guest-login-btn {
  background: rgba(255, 255, 255, 0.8);
  border-color: rgba(0, 0, 0, 0.1);
  color: rgba(0, 0, 0, 0.6);
}

.login-page:not(.dark-theme) .guest-login-btn:hover {
  background: #6366F1;
  border-color: #6366F1;
  color: white;
}

.login-page:not(.dark-theme) .wechat-login-btn {
  background: rgba(7, 193, 96, 0.08);
  border-color: rgba(7, 193, 96, 0.2);
  color: #059669;
}

.login-page:not(.dark-theme) .wechat-login-btn:hover {
  background: #07C160;
  border-color: #07C160;
  color: white;
}

.login-page:not(.dark-theme) .register-link {
  color: #6366F1;
}

.login-page:not(.dark-theme) .register-link:hover {
  color: #4F46E5;
}

/* ==================== 响应式设计 ==================== */
@media (max-width: 1200px) {
  .login-showcase {
    width: 60%;
  }
  .login-sidebar {
    width: 40%;
  }
}

@media (max-width: 1024px) {
  .login-page {
    flex-direction: column;
  }

  .login-showcase {
    width: 100%;
    height: 50vh;
  }

  .login-sidebar {
    width: 100%;
    height: 50vh;
  }

  .showcase-content {
    padding: 40px 30px;
  }

  .brand-title {
    font-size: 48px;
  }

  .brand-slogan {
    font-size: 24px;
  }

  .particle-logo-container {
    width: 160px;
    height: 48px;
  }

  .login-card {
    padding: 32px 28px;
  }
}

@media (max-width: 768px) {
  .showcase-content {
    padding: 30px 20px;
  }

  .brand-title {
    font-size: 36px;
  }

  .brand-slogan {
    font-size: 20px;
  }

  .brand-subtitle {
    font-size: 12px;
  }

  .particle-logo-container {
    display: none;
  }

  .login-sidebar {
    padding: 24px 20px;
  }

  .login-card {
    padding: 28px 24px;
  }

  .login-icon-wrapper {
    width: 56px;
    height: 56px;
  }

  .login-title {
    font-size: 22px;
  }

  .other-login-methods {
    flex-direction: column;
  }

  .three-scene {
    opacity: 0.5;
  }

  .wave-container {
    height: 80px;
  }
}

@media (max-width: 480px) {
  .login-showcase {
    display: none;
  }

  .login-sidebar {
    width: 100%;
    height: 100vh;
    background: var(--background-color, #0F172A);
  }

  .login-card {
    background: var(--card-background, rgba(255, 255, 255, 0.03));
    border-color: var(--border-color, rgba(255, 255, 255, 0.08));
  }
}
</style>

<!-- 非scoped样式：Element Plus 覆盖 -->
<style>
/* 覆盖 Element Plus CSS 变量 */
body.dark-theme {
  --el-bg-color: #1e293b;
  --el-bg-color-overlay: #1e293b;
  --el-fill-color-blank: #1e293b;
  --el-fill-color-light: #2d3748;
  --el-fill-color-lighter: #334155;
  --el-text-color-primary: #f1f5f9;
  --el-text-color-regular: #f1f5f9;
  --el-border-color: #334155;
  --el-border-color-light: #334155;
}
</style>
