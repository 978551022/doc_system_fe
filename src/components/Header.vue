<template>
  <header class="app-header">
    <div class="app-header__left">
      <!-- 系统标题 -->
      <div class="app-header__title" @click="goToChat">
        <!-- Logo -->
        <div class="app-header__logo">
          <div class="logo-icon">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" class="logo-svg">
              <!-- 背景圆 -->
              <circle cx="20" cy="20" r="20" fill="url(#logoGradient)" opacity="0.1"/>
              <!-- 外环 -->
              <circle cx="20" cy="20" r="16" stroke="url(#logoGradient)" stroke-width="2" fill="none" opacity="0.3"/>
              <!-- 动态环 -->
              <circle class="logo-ring" cx="20" cy="20" r="16" stroke="url(#logoGradient)" stroke-width="2" fill="none" stroke-dasharray="80" stroke-dashoffset="20" stroke-linecap="round"/>
              <!-- 文档图标 -->
              <rect x="12" y="10" width="16" height="20" rx="2" fill="url(#logoGradient)"/>
              <!-- 文档线条 -->
              <path d="M15 16h10M15 20h7M15 24h5" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
              <!-- 渐变定义 -->
              <defs>
                <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="var(--primary-color)"/>
                  <stop offset="100%" stop-color="var(--accent-color)"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
        <div class="app-header__brand">
          <h1>DocHub</h1>
          <span class="app-header__subtitle">智能文档系统</span>
        </div>
      </div>
    </div>

    <!-- 中间搜索区域 -->
    <div class="app-header__center">
      <SearchBar />
    </div>

    <!-- 右侧用户区域 -->
    <div class="app-header__right">
      <!-- 通知中心 -->
      <NotificationCenter />
      <el-dropdown @command="handleUserCommand" trigger="click">
        <div class="user-avatar-wrapper">
          <el-avatar :size="36" :src="cachedAvatar" class="user-avatar" @error="handleAvatarError">
            <i v-if="!userState.avatar" class="el-icon-user-solid"></i>
            <span v-else>{{ userState.username?.charAt(0)?.toUpperCase() || 'U' }}</span>
          </el-avatar>
          <!-- 在线状态指示点 -->
          <span class="user-status-indicator"></span>
          <div class="user-info">
            <span class="user-name">{{ userState.username }}</span>
            <i class="el-icon-arrow-down"></i>
          </div>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="profile">
              <i class="el-icon-user"></i> 个人中心
            </el-dropdown-item>
            <el-dropdown-item command="settings">
              <i class="el-icon-setting"></i> 系统设置
            </el-dropdown-item>
            <el-dropdown-item divided command="logout">
              <i class="el-icon-switch-button"></i> 退出登录
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </header>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import userState, { logout as logoutUser, getToken } from '../utils/userStore.js'
import { logout as logoutApi } from '../api/auth.js'
import SearchBar from './SearchBar.vue'
import NotificationCenter from './NotificationCenter.vue'

const router = useRouter()

// 缓存头像URL，避免频繁重新请求
const cachedAvatar = ref(userState.avatar || '')

// 监听头像变化，只有真正变化时才更新
watch(
  () => userState.avatar,
  (newAvatar) => {
    if (newAvatar !== cachedAvatar.value) {
      cachedAvatar.value = newAvatar
    }
  }
)

// 头像加载失败处理
const handleAvatarError = (e) => {
  // 返回 false 告诉 el-avatar 使用默认的 slot 内容
  return false
}

const goToChat = () => {
  router.push('/chat')
}

const handleUserCommand = async (command) => {
  switch (command) {
    case 'profile':
    case 'settings':
      router.push('/settings')
      break
    case 'logout':
      // 立即退出，不等待API响应
      const token = getToken()
      logoutUser()
      ElMessage.success('已退出登录')
      router.push('/login')
      // 后台调用登出API（不阻塞）
      if (token) {
        logoutApi(token).catch(error => {
          console.error('登出API调用失败:', error)
        })
      }
      break
  }
}
</script>

<style scoped>
/* ========== 顶部导航栏主体 ========== */
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--spacing-6);
  height: 60px;
  background: var(--card-background);
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-color);
  transition: var(--transition);
  position: relative;
  z-index: var(--z-sticky);
  width: 100%;
  flex-shrink: 0;
  gap: var(--spacing-6);
}

/* ========== 左侧区域 ========== */
.app-header__left {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.app-header__title {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  cursor: pointer;
  transition: var(--transition);
}

.app-header__title:hover {
  opacity: 0.9;
}

.app-header__title:hover .logo-icon {
  transform: scale(1.05);
}

.app-header__title:hover .logo-ring {
  stroke-dashoffset: 0;
}

.app-header__logo {
  display: flex;
  align-items: center;
}

.logo-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--primary-color);
  transition: var(--transition);
}

.logo-svg {
  width: 40px;
  height: 40px;
}

/* Logo 动态环动画 */
.logo-ring {
  transform-origin: center;
  animation: logo-ring-rotate 10s linear infinite;
}

@keyframes logo-ring-rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Logo 脉冲效果 */
.logo-icon::after {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: radial-gradient(circle, var(--primary-color) 0%, transparent 70%);
  opacity: 0;
  animation: logo-pulse 3s ease-in-out infinite;
}

@keyframes logo-pulse {
  0%, 100% {
    opacity: 0;
    transform: scale(1);
  }
  50% {
    opacity: 0.15;
    transform: scale(1.1);
  }
}

.app-header__brand {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.app-header__title h1 {
  margin: 0;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  letter-spacing: var(--letter-spacing-tight);
  line-height: var(--line-height-tight);
  color: var(--text-primary);
  background: var(--primary-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.app-header__subtitle {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: var(--text-muted);
  letter-spacing: var(--letter-spacing-wide);
  line-height: 1;
}

/* ========== 中间搜索区域 ========== */
.app-header__center {
  flex: 1;
  display: flex;
  justify-content: center;
  max-width: 500px;
}

/* ========== 右侧用户区域 ========== */
.app-header__right {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  flex-shrink: 0;
}

.user-avatar-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: var(--radius-md);
  transition: var(--transition);
  position: relative;
}

.user-avatar-wrapper:hover {
  background-color: var(--menu-item-hover);
}

.user-avatar {
  background: var(--primary-gradient);
  color: white;
  border: 2px solid var(--border-color);
  transition: var(--transition);
  position: relative;
}

.user-avatar:hover {
  transform: scale(1.05);
  border-color: var(--primary-color);
}

/* 在线状态指示点 */
.user-status-indicator {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 10px;
  height: 10px;
  background: var(--success-color);
  border: 2px solid var(--card-background);
  border-radius: 50%;
  pointer-events: none;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 6px;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  transition: var(--transition);
}

.user-info i {
  font-size: 12px;
  color: var(--text-muted);
  transition: var(--transition);
}

/* ========== 下拉菜单样式 ========== */
.app-header__right :deep(.el-dropdown-menu) {
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--border-color);
  padding: 6px 0;
  background: var(--card-background);
}

.app-header__right :deep(.el-dropdown-item) {
  padding: 10px 16px;
  font-size: 13px;
  transition: var(--transition);
  display: flex;
  align-items: center;
  gap: 10px;
  border-radius: var(--radius-sm);
  margin: 2px 6px;
  color: var(--text-primary);
  font-weight: 500;
}

.app-header__right :deep(.el-dropdown-item:hover) {
  background: var(--primary-gradient);
  color: white;
}

.app-header__right :deep(.el-dropdown-item i) {
  font-size: 15px;
  width: 18px;
  text-align: center;
}

/* ========== 深色模式适配 ========== */
.dark-theme .app-header__right :deep(.el-dropdown-menu) {
  background: var(--card-background);
  border-color: var(--border-color);
}

.dark-theme .app-header__right :deep(.el-dropdown-item) {
  color: var(--text-primary);
}

.dark-theme .app-header__right :deep(.el-dropdown-item:hover) {
  background: var(--primary-gradient);
  color: white;
}
</style>
