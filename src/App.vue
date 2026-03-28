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
import './styles/index.css'

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
/* 应用容器样式 - tokens.css 已包含完整的设计令牌系统 */
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
}

/* ========== Element Plus 深色模式覆盖 ========== */
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

.dark-theme .el-textarea__inner {
  background-color: var(--input-background);
  border-color: var(--input-border);
  color: var(--text-primary);
}

.dark-theme .el-select {
  background-color: var(--input-background);
  border-color: var(--input-border);
  color: var(--text-primary);
}

.dark-theme .el-select .el-input__wrapper {
  background-color: var(--input-background);
  box-shadow: 0 0 0 1px var(--input-border) inset;
}

.dark-theme .el-select__input {
  color: var(--text-primary);
}

.dark-theme .el-select__popper,
.dark-theme .el-select-dropdown {
  background-color: var(--card-background);
  border-color: var(--border-color);
}

.dark-theme .el-option {
  color: var(--text-primary);
}

.dark-theme .el-option:hover {
  background-color: var(--menu-item-hover);
}

.dark-theme .el-option.selected {
  color: var(--primary-color);
  background-color: var(--menu-item-active);
}

/* 按钮深色模式修复 */
.dark-theme .el-button {
  color: var(--text-primary);
  border-color: var(--border-color);
  background-color: var(--surface-color);
}

.dark-theme .el-button--default {
  color: var(--text-primary);
  border-color: var(--border-color);
  background-color: var(--surface-color);
}

.dark-theme .el-button--default:hover {
  color: var(--primary-color);
  border-color: var(--primary-color);
  background-color: var(--menu-item-hover);
}

.dark-theme .el-button--primary {
  background-color: var(--primary-color);
  border-color: var(--primary-color);
  color: white;
}

.dark-theme .el-button--text {
  color: var(--text-secondary);
}

.dark-theme .el-button--text:hover {
  color: var(--primary-color);
}

/* 下拉菜单深色模式修复 */
.dark-theme .el-dropdown-menu {
  background-color: var(--card-background);
  border-color: var(--border-color);
}

.dark-theme .el-dropdown-menu__item {
  color: var(--text-primary);
}

.dark-theme .el-dropdown-menu__item:hover {
  background-color: var(--menu-item-hover);
  color: var(--primary-color);
}

/* 标签深色模式修复 */
.dark-theme .el-tag {
  background-color: var(--surface-color);
  border-color: var(--border-color);
  color: var(--text-primary);
}

.dark-theme .el-tag--info {
  background-color: rgba(59, 130, 246, 0.15);
  border-color: rgba(59, 130, 246, 0.3);
  color: #60A5FA;
}

.dark-theme .el-tag--success {
  background-color: rgba(16, 185, 129, 0.15);
  border-color: rgba(16, 185, 129, 0.3);
  color: #34D399;
}

.dark-theme .el-tag--warning {
  background-color: rgba(245, 158, 11, 0.15);
  border-color: rgba(245, 158, 11, 0.3);
  color: #FBBF24;
}

.dark-theme .el-tag--danger {
  background-color: rgba(239, 68, 68, 0.15);
  border-color: rgba(239, 68, 68, 0.3);
  color: #F87171;
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

.dark-theme .el-table {
  background-color: var(--card-background);
  color: var(--text-primary);
}

.dark-theme .el-table th,
.dark-theme .el-table tr {
  background-color: var(--card-background);
  color: var(--text-primary);
}

.dark-theme .el-table td,
.dark-theme .el-table th.is-leaf {
  border-color: var(--border-color);
}

.dark-theme .el-table--enable-row-hover .el-table__body tr:hover > td {
  background-color: var(--surface-color);
}

.dark-theme .el-dialog {
  background-color: var(--card-background);
}

.dark-theme .el-dialog__title {
  color: var(--text-primary);
}

.dark-theme .el-dialog__body {
  color: var(--text-primary);
}

.dark-theme .el-drawer {
  background-color: var(--card-background);
}

.dark-theme .el-drawer__header {
  color: var(--text-primary);
  border-color: var(--border-color);
}

/* 进度条深色模式 */
.dark-theme .el-progress-bar__outer {
  background-color: var(--border-color);
}

.dark-theme .el-progress-bar__inner {
  background-color: var(--primary-color);
}

/* 分页深色模式 */
.dark-theme .el-pagination {
  color: var(--text-primary);
}

.dark-theme .el-pagination button {
  background-color: var(--surface-color);
  color: var(--text-primary);
}

.dark-theme .el-pagination button:hover {
  color: var(--primary-color);
}

.dark-theme .el-pager li {
  background-color: var(--surface-color);
  color: var(--text-primary);
}

.dark-theme .el-pager li:hover {
  color: var(--primary-color);
}

.dark-theme .el-pager li.is-active {
  background-color: var(--primary-color);
  color: white;
}

/* Popconfirm深色模式 */
.dark-theme .el-popconfirm {
  background-color: var(--card-background);
  color: var(--text-primary);
}

.dark-theme .el-popconfirm__main {
  color: var(--text-primary);
}

/* ========== 组件深色模式覆盖 ========== */
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
  background-color: rgba(99, 102, 241, 0.15);
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

/* ========== 过渡效果 ========== */
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
