<template>
  <div class="app-container" :class="{ 'dark-theme': isDarkTheme }" :style="appStyle">
    <Header />
    <MainContainer />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import Header from './components/Header.vue'
import MainContainer from './components/MainContainer.vue'

// 主题和字体大小设置
const fontSize = ref(16)
// 添加响应式变量存储当前主题
const currentTheme = ref(localStorage.getItem('appTheme') || 'light')
// 声明定时器变量
let themeCheckInterval = null

// 计算localStorage中的主题值，用于监听主题变化
const localStorageTheme = computed(() => {
  return localStorage.getItem('appTheme') || 'light'
})

// 计算是否为深色主题 - 依赖于响应式变量currentTheme
const isDarkTheme = computed(() => {
  if (currentTheme.value === 'auto') {
    // 检测系统主题
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
  }
  return currentTheme.value === 'dark'
})

// 生命周期钩子
onMounted(() => {
  // 加载设置
  loadSettings()
  
  // 初始化currentTheme变量
  currentTheme.value = localStorage.getItem('appTheme') || 'light'
  
  // 设置主题监听器
  setupThemeListener()
  
  // 设置localStorage监听器
  setupStorageListener()
  
  // 初始应用样式
  document.body.style.fontSize = `${fontSize.value}px`
  
  // 添加定时器，定期检查localStorage中的主题变化
  themeCheckInterval = setInterval(() => {
    const savedTheme = localStorage.getItem('appTheme') || 'light'
    if (savedTheme !== currentTheme.value) {
      currentTheme.value = savedTheme
    }
  }, 1000) // 每秒检查一次
})

// 应用样式
const appStyle = computed(() => {
  const savedFontSize = localStorage.getItem('appFontSize')
  const currentFontSize = savedFontSize ? parseInt(savedFontSize) : fontSize.value
  return {
    fontSize: `${currentFontSize}px`
  }
})

// 从localStorage加载设置
const loadSettings = () => {
  const savedFontSize = localStorage.getItem('appFontSize')
  
  if (savedFontSize) {
    fontSize.value = parseInt(savedFontSize)
  }
}

// 监听localStorage变化，实时更新主题和字体大小 - 用于多标签页同步
const setupStorageListener = () => {
  const handleStorageChange = (e) => {
    if (e.key === 'appFontSize') {
      fontSize.value = e.newValue ? parseInt(e.newValue) : 16
    }
    // 当主题变化时，更新currentTheme响应式变量
    if (e.key === 'appTheme') {
      // 只有当newValue与currentTheme.value不同时才更新，避免死循环
      if (e.newValue !== currentTheme.value) {
        currentTheme.value = e.newValue || 'light'
      }
    }
  }
  
  window.addEventListener('storage', handleStorageChange)
  
  // 清理函数
  return () => {
    window.removeEventListener('storage', handleStorageChange)
  }
}

// 监听主题变化，应用到body
watch(
  isDarkTheme,
  (isDark) => {
    // 无论主题如何变化，都重新计算并应用主题
    if (isDark) {
      document.body.classList.add('dark-theme')
    } else {
      document.body.classList.remove('dark-theme')
    }
  },
  { immediate: true }
)

// 监听系统主题变化，确保跟随系统时能正确更新
const setupThemeListener = () => {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  
  const handleThemeChange = (e) => {
    // 当系统主题变化时，不需要更新currentTheme
    // isDarkTheme计算属性会自动重新计算，因为它依赖于window.matchMedia
    // 但我们可以通过更新currentTheme来触发重新计算
    currentTheme.value = localStorage.getItem('appTheme') || 'light'
  }
  
  mediaQuery.addEventListener('change', handleThemeChange)
  
  // 清理函数
  return () => {
    mediaQuery.removeEventListener('change', handleThemeChange)
  }
}

// 监听字体大小变化，应用到body
watch(fontSize, (newValue) => {
  document.body.style.fontSize = `${newValue}px`
})

// 生命周期钩子
onMounted(() => {
  // 加载设置
  loadSettings()
  
  // 初始化currentTheme变量
  currentTheme.value = localStorage.getItem('appTheme') || 'light'
  
  // 设置主题监听器
  setupThemeListener()
  
  // 设置localStorage监听器
  setupStorageListener()
  
  // 初始应用样式
  document.body.style.fontSize = `${fontSize.value}px`
  
  // 添加定时器，定期检查localStorage中的主题变化
  themeCheckInterval = setInterval(() => {
    const savedTheme = localStorage.getItem('appTheme') || 'light'
    if (savedTheme !== currentTheme.value) {
      currentTheme.value = savedTheme
    }
  }, 1000) // 每秒检查一次
})

// 在组件卸载时清除定时器
onUnmounted(() => {
  if (themeCheckInterval) {
    clearInterval(themeCheckInterval)
  }
})
</script>

<style>
/* 全局变量定义 */
:root {
  /* 浅色主题变量 */
  --primary-color: #667eea;
  --primary-hover: #5568d3;
  --primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --background-color: #ffffff;
  --surface-color: #f8f9fa;
  --card-background: #ffffff;
  --card-header-background: #ffffff;
  --text-primary: #333333;
  --text-secondary: #666666;
  --text-muted: #999999;
  --border-color: #e0e0e0;
  --border-hover: #d0d0d0;
  --menu-background: #ffffff;
  --menu-item-color: #495057;
  --menu-item-hover: #f8f9fa;
  --menu-item-active: var(--primary-gradient);
  --input-background: #ffffff;
  --input-border: #e0e0e0;
  --input-placeholder: #999999;
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.15);
  --transition: all 0.3s ease;
}

/* 深色主题变量 - 参考DeepSeek界面 */
.dark-theme {
  --primary-color: #818cf8;
  --primary-hover: #6366f1;
  --primary-gradient: linear-gradient(135deg, #818cf8 0%, #a78bfa 100%);
  /* 调整深色背景，不要太黑，参考DeepSeek界面 */
  --background-color: #1a1a1a;
  --surface-color: #1a1a1a;
  --card-background: #242424;
  --card-header-background: #242424;
  /* 更亮的字体颜色，提高可读性 */
  --text-primary: #ffffff;
  --text-secondary: #e0e0e0;
  --text-muted: #b0b0b0;
  --border-color: #3a3a3a;
  --border-hover: #4a4a4a;
  /* 统一菜单背景色，与主背景一致 */
  --menu-background: #1a1a1a;
  --menu-item-color: #e0e0e0;
  --menu-item-hover: #242424;
  --menu-item-active: var(--primary-gradient);
  --input-background: #242424;
  --input-border: #3a3a3a;
  --input-placeholder: #808080;
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.5);
}

/* 全局样式重置 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-size: 16px;
  line-height: 1.6;
  color: var(--text-primary);
  background-color: var(--background-color);
  overflow: hidden;
  transition: var(--transition);
}

#app {
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

.app-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  background-color: var(--background-color);
  transition: var(--transition);
}

/* 深色主题样式 - 使用CSS变量 */
.dark-theme body {
  background-color: var(--background-color);
  color: var(--text-primary);
}

.dark-theme .app-container {
  background-color: var(--background-color);
}

/* 深色主题下的组件样式 - 使用CSS变量 */
.dark-theme .el-card,
.dark-theme .el-card__header {
  background-color: var(--card-background);
  border-color: var(--border-color);
  color: var(--text-primary);
}

.dark-theme .el-menu {
  background-color: var(--menu-background);
  border-color: var(--border-color);
}

.dark-theme .el-menu-item {
  color: var(--menu-item-color);
}

.dark-theme .el-menu-item:hover {
  background-color: var(--menu-item-hover) !important;
}

.dark-theme .el-menu-item.is-active {
  background: var(--menu-item-active) !important;
}

.dark-theme .el-input,
.dark-theme .el-input__inner {
  background-color: var(--input-background);
  border-color: var(--input-border);
  color: var(--text-primary);
}

.dark-theme .el-input__inner::placeholder {
  color: var(--input-placeholder);
}

.dark-theme .el-select {
  background-color: var(--input-background);
  border-color: var(--input-border);
  color: var(--text-primary);
}

.dark-theme .el-select__input {
  color: var(--text-primary);
}

.dark-theme .el-select__popper {
  background-color: var(--card-background);
  border-color: var(--border-color);
}

.dark-theme .el-option {
  color: var(--text-primary);
}

.dark-theme .el-option:hover {
  background-color: var(--menu-item-hover);
}

.dark-theme .el-switch {
  background-color: var(--border-color);
}

.dark-theme .el-switch.is-checked {
  background-color: var(--primary-color);
}

.dark-theme .el-slider__runway {
  background-color: var(--border-color);
}

.dark-theme .el-slider__bar {
  background-color: var(--primary-color);
}

.dark-theme .el-slider__button {
  border-color: var(--primary-color);
  background-color: var(--primary-color);
}

.dark-theme .el-radio__input.is-checked .el-radio__inner {
  border-color: var(--primary-color);
  background-color: var(--primary-color);
}

.dark-theme .el-divider {
  background-color: var(--border-color);
}

.dark-theme .chat-message__text {
  background-color: var(--card-background);
  color: var(--text-primary);
  border-color: var(--border-color);
}

.dark-theme .chat-message--user .chat-message__text {
  background-color: var(--primary-color);
  color: white;
}

.dark-theme .chat-message__typing {
  background-color: var(--card-background);
  color: var(--text-primary);
  border-color: var(--border-color);
}

.dark-theme .settings-section {
  border-color: var(--border-color);
}

.dark-theme .settings-section__title {
  color: var(--text-primary);
  border-color: var(--primary-color);
}

.dark-theme .settings-form__unit {
  color: var(--text-muted);
}

.dark-theme .avatar-preview {
  border-color: var(--border-color);
}

.dark-theme .avatar-preview:hover {
  border-color: var(--primary-color);
}

.dark-theme .notification-empty {
  color: var(--text-muted);
}

.dark-theme .notification-item {
  border-color: var(--border-color);
}

.dark-theme .notification-item:hover {
  background-color: var(--menu-item-hover);
}

.dark-theme .notification-item--unread {
  background-color: #272758;
}

.dark-theme .notification-item__title {
  color: var(--text-primary);
}

.dark-theme .notification-item__message {
  color: var(--text-secondary);
}

.dark-theme .notification-item__time {
  color: var(--text-muted);
}

/* 主题切换过渡效果 */
.app-container,
body,
.el-card,
.el-menu,
.el-input,
.el-select,
.el-switch,
.el-slider,
.chat-message__text,
.settings-section {
  transition: var(--transition);
}
</style>
