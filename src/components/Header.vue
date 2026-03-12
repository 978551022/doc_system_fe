<template>
  <header class="app-header">
    <div class="app-header__left">
      <!-- 系统标题 -->
      <div class="app-header__title" @click="goToChat">
        <!-- 简约Logo -->
        <div class="app-header__logo">
          <div class="logo-icon">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="4" y="6" width="24" height="20" rx="3" fill="currentColor" opacity="0.2"/>
              <rect x="7" y="9" width="18" height="14" rx="2" fill="currentColor"/>
              <path d="M10 14h12M10 18h8" stroke="white" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </div>
        </div>
        <div class="app-header__brand">
          <h1>DocHub</h1>
          <span class="app-header__subtitle">智能文档系统</span>
        </div>
      </div>
    </div>
    
    <!-- 右侧用户区域 -->
    <div class="app-header__right">
      <el-dropdown @command="handleUserCommand" trigger="click">
        <div class="user-avatar-wrapper">
          <el-avatar :size="36" :src="userState.avatar" class="user-avatar" @error="handleAvatarError">
            <i v-if="!userState.avatar" class="el-icon-user-solid"></i>
            <span v-else>{{ userState.username?.charAt(0)?.toUpperCase() || 'U' }}</span>
          </el-avatar>
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
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import userState, { logout as logoutUser, getToken } from '../utils/userStore.js'
import { logout as logoutApi } from '../api/auth.js'

const router = useRouter()

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
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  height: 56px;
  background: var(--card-background);
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-color);
  transition: var(--transition);
  position: relative;
  z-index: 100;
  width: 100%;
  flex-shrink: 0;
}

/* 深色主题下的顶部导航栏样式 */
.dark-theme .app-header {
  background: var(--card-background);
  border-bottom-color: var(--border-color);
}

.app-header__left {
  display: flex;
  align-items: center;
}

.app-header__title {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: var(--transition);
}

.app-header__title:hover {
  opacity: 0.85;
}

.app-header__logo {
  display: flex;
  align-items: center;
}

.logo-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--primary-color);
  transition: var(--transition);
}

.logo-icon svg {
  width: 32px;
  height: 32px;
}

.app-header__brand {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.app-header__title h1 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.2;
  color: var(--text-primary);
}

.app-header__subtitle {
  font-size: 11px;
  font-weight: 500;
  color: var(--text-muted);
  letter-spacing: 0.02em;
  line-height: 1;
}

/* 右侧用户区域 */
.app-header__right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-avatar-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: var(--radius-md);
  transition: var(--transition-fast);
}

.user-avatar-wrapper:hover {
  background-color: var(--surface-color);
}

.user-avatar {
  background: var(--primary-gradient);
  color: white;
  border: 2px solid var(--border-color);
  transition: var(--transition);
}

.user-avatar:hover {
  transform: scale(1.05);
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
</style>
