<template>
  <div class="app-container" :class="{ 'dark-theme': isDarkTheme }" :style="appStyle">
    <template v-if="!isAuthPage">
      <Header />
      <MainContainer />
    </template>
    <router-view v-else />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import Header from './components/Header.vue'
import MainContainer from './components/MainContainer.vue'

const route = useRoute()
const fontSize = ref(16)
const currentTheme = ref(localStorage.getItem('appTheme') || 'light')
let themeCheckInterval = null

const isAuthPage = computed(() => {
  return route.path === '/login' || route.path === '/register'
})

const localStorageTheme = computed(() => {
  return localStorage.getItem('appTheme') || 'light'
})

const isDarkTheme = computed(() => {
  if (currentTheme.value === 'auto') {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
  }
  return currentTheme.value === 'dark'
})

const appStyle = computed(() => {
  const savedFontSize = localStorage.getItem('appFontSize')
  const currentFontSize = savedFontSize ? parseInt(savedFontSize) : fontSize.value
  return {
    fontSize: `${currentFontSize}px`
  }
})

const loadSettings = () => {
  const savedFontSize = localStorage.getItem('appFontSize')
  if (savedFontSize) {
    fontSize.value = parseInt(savedFontSize)
  }
}

const setupStorageListener = () => {
  const handleStorageChange = (e) => {
    if (e.key === 'appFontSize') {
      fontSize.value = e.newValue ? parseInt(e.newValue) : 16
    }
    if (e.key === 'appTheme') {
      if (e.newValue !== currentTheme.value) {
        currentTheme.value = e.newValue || 'light'
      }
    }
  }
  
  window.addEventListener('storage', handleStorageChange)
  
  return () => {
    window.removeEventListener('storage', handleStorageChange)
  }
}

const setupThemeListener = () => {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  
  const handleThemeChange = () => {
    currentTheme.value = localStorage.getItem('appTheme') || 'light'
  }
  
  mediaQuery.addEventListener('change', handleThemeChange)
  
  return () => {
    mediaQuery.removeEventListener('change', handleThemeChange)
  }
}

watch(
  isDarkTheme,
  (isDark) => {
    if (isDark) {
      document.body.classList.add('dark-theme')
    } else {
      document.body.classList.remove('dark-theme')
    }
  },
  { immediate: true }
)

watch(fontSize, (newValue) => {
  document.body.style.fontSize = `${newValue}px`
})

onMounted(() => {
  loadSettings()
  currentTheme.value = localStorage.getItem('appTheme') || 'light'
  setupThemeListener()
  setupStorageListener()
  document.body.style.fontSize = `${fontSize.value}px`
  
  themeCheckInterval = setInterval(() => {
    const savedTheme = localStorage.getItem('appTheme') || 'light'
    if (savedTheme !== currentTheme.value) {
      currentTheme.value = savedTheme
    }
  }, 1000)
})

onUnmounted(() => {
  if (themeCheckInterval) {
    clearInterval(themeCheckInterval)
  }
})
</script>

<style>
:root {
  --primary-color: #4f46e5;
  --primary-hover: #4338ca;
  --primary-light: #818cf8;
  --primary-gradient: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  --accent-color: #06b6d4;
  --accent-gradient: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
  --success-color: #10b981;
  --warning-color: #f59e0b;
  --error-color: #ef4444;
  --background-color: #f8fafc;
  --surface-color: #f1f5f9;
  --card-background: #ffffff;
  --card-header-background: #ffffff;
  --text-primary: #1e293b;
  --text-secondary: #475569;
  --text-muted: #94a3b8;
  --border-color: #e2e8f0;
  --border-hover: #cbd5e1;
  --menu-background: #ffffff;
  --menu-item-color: #475569;
  --menu-item-hover: #f1f5f9;
  --menu-item-active: var(--primary-gradient);
  --input-background: #ffffff;
  --input-border: #e2e8f0;
  --input-placeholder: #94a3b8;
  --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.04);
  --shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.06);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.08);
  --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.12);
  --shadow-xl: 0 16px 48px rgba(0, 0, 0, 0.16);
  --transition-fast: all 0.15s ease;
  --transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  --transition-slow: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
  --radius-xl: 24px;
}

.dark-theme {
  --primary-color: #818cf8;
  --primary-hover: #6366f1;
  --primary-light: #a5b4fc;
  --primary-gradient: linear-gradient(135deg, #818cf8 0%, #a78bfa 100%);
  --accent-color: #22d3ee;
  --accent-gradient: linear-gradient(135deg, #22d3ee 0%, #06b6d4 100%);
  --success-color: #34d399;
  --warning-color: #fbbf24;
  --error-color: #f87171;
  --background-color: #0f172a;
  --surface-color: #1e293b;
  --card-background: #1e293b;
  --card-header-background: #1e293b;
  --text-primary: #f1f5f9;
  --text-secondary: #cbd5e1;
  --text-muted: #64748b;
  --border-color: #334155;
  --border-hover: #475569;
  --menu-background: #0f172a;
  --menu-item-color: #cbd5e1;
  --menu-item-hover: #1e293b;
  --menu-item-active: var(--primary-gradient);
  --input-background: #1e293b;
  --input-border: #334155;
  --input-placeholder: #64748b;
  --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.2);
  --shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.25);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.3);
  --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.4);
  --shadow-xl: 0 16px 48px rgba(0, 0, 0, 0.5);
}

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

.dark-theme body {
  background-color: var(--background-color);
  color: var(--text-primary);
}

.dark-theme .app-container {
  background-color: var(--background-color);
}

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
