<template>
  <header class="app-header">
    <div class="app-header__left">
      <!-- 系统标题 -->
      <div class="app-header__title" @click="goToChat">
        <!-- 时尚logo -->
        <div class="app-header__logo">
          <div class="logo-icon">
            <div class="logo-circle"></div>
            <div class="logo-document"></div>
          </div>
        </div>
        <h1>个人文档系统</h1>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// 跳转到聊天界面
const goToChat = () => {
  router.push('/chat')
}
</script>

<style scoped>
.app-header {
  display: flex;
  align-items: center;
  padding: 0 24px;
  height: 60px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
  position: relative;
  z-index: 100;
  border-radius: 0;
  margin: 0;
  width: 100%;
  flex-shrink: 0;
}

/* 深色主题下的顶部导航栏样式 */
.dark-theme .app-header {
  background: var(--background-color);
  border-bottom: 1px solid var(--border-color);
  color: var(--text-primary);
  box-shadow: var(--shadow-sm);
}

/* 深色主题下的标题样式 */
.dark-theme .app-header__title h1 {
  color: var(--text-primary);
}

/* 深色主题下的logo样式 */
.dark-theme .logo-circle {
  background: var(--primary-gradient);
  border-color: var(--border-color);
  box-shadow: var(--shadow-sm);
}

.dark-theme .logo-document {
  background: var(--card-background);
  box-shadow: var(--shadow-sm);
}

.dark-theme .logo-document::before,
.dark-theme .logo-document::after {
  background: var(--primary-color);
}

.app-header:hover {
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
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
  transition: transform 0.3s ease;
}

.app-header__title:hover {
  transform: scale(1.02);
}

.app-header__title h1 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 0.5px;
}

/* Logo 样式 */
.app-header__logo {
  display: flex;
  align-items: center;
}

.logo-icon {
  position: relative;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: logoPulse 2s ease-in-out infinite;
}

@keyframes logoPulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

.logo-circle {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: 2px solid rgba(255, 255, 255, 0.9);
  position: absolute;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.logo-document {
  position: absolute;
  width: 18px;
  height: 22px;
  background: white;
  border-radius: 3px;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transform: rotate(-5deg);
  transition: transform 0.3s ease;
}

.logo-document::before {
  content: '';
  width: 10px;
  height: 3px;
  background: #667eea;
  border-radius: 1.5px;
  margin-bottom: 2px;
  display: block;
}

.logo-document::after {
  content: '';
  width: 10px;
  height: 3px;
  background: #667eea;
  border-radius: 1.5px;
  margin-top: 5px;
  position: absolute;
  display: block;
}

.logo-icon:hover .logo-document {
  transform: rotate(0deg) scale(1.1);
}
</style>
