<template>
  <div class="route-loading">
    <!-- 背景遮罩 -->
    <transition name="route-loading-backdrop">
      <div v-if="show" class="route-loading__backdrop"></div>
    </transition>

    <!-- 加载容器 -->
    <transition name="route-loading-content">
      <div v-if="show" class="route-loading__container">
        <!-- Logo 动画 -->
        <div class="route-loading__logo">
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="32" cy="32" r="32" fill="url(#loadingGradient)" opacity="0.1"/>
            <circle cx="32" cy="32" r="24" stroke="url(#loadingGradient)" stroke-width="2" fill="none" opacity="0.3"/>
            <circle class="route-loading__ring" cx="32" cy="32" r="24" stroke="url(#loadingGradient)" stroke-width="3" fill="none" stroke-dasharray="120" stroke-dashoffset="40" stroke-linecap="round"/>
            <rect x="18" y="20" width="28" height="24" rx="3" fill="url(#loadingGradient)"/>
            <path d="M23 30h18M23 36h12M23 42h8" stroke="white" stroke-width="2" stroke-linecap="round"/>
            <defs>
              <linearGradient id="loadingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="var(--primary-color)"/>
                <stop offset="100%" stop-color="var(--accent-color)"/>
              </linearGradient>
            </defs>
          </svg>
        </div>

        <!-- 加载文本 -->
        <div class="route-loading__text">
          <div class="route-loading__title">{{ title }}</div>
          <div class="route-loading__message">{{ message }}</div>
        </div>

        <!-- 进度条 -->
        <div class="route-loading__progress">
          <div class="route-loading__progress-bar" :style="{ width: progress + '%' }"></div>
        </div>

        <!-- 加载点 -->
        <div class="route-loading__dots">
          <span class="route-loading__dot"></span>
          <span class="route-loading__dot"></span>
          <span class="route-loading__dot"></span>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: '加载中'
  },
  message: {
    type: String,
    default: '请稍候...'
  },
  progress: {
    type: Number,
    default: 0
  }
})

// 内部进度状态（用于自动增长动画）
const internalProgress = ref(0)

let progressInterval = null

watch(() => props.show, (newVal) => {
  if (newVal) {
    internalProgress.value = 0
    // 模拟进度增长
    progressInterval = setInterval(() => {
      if (internalProgress.value < 90) {
        internalProgress.value += Math.random() * 10
      }
    }, 200)
  } else {
    clearInterval(progressInterval)
    internalProgress.value = 100
  }
})
</script>

<style scoped>
.route-loading {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: var(--z-modal);
  pointer-events: none;
}

.route-loading__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(4px);
}

.route-loading__container {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-6);
  padding: var(--spacing-8);
  background: var(--card-background);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-2xl);
  min-width: 320px;
}

/* ========== Logo 动画 ========== */
.route-loading__logo {
  position: relative;
}

.route-loading__ring {
  transform-origin: center;
  animation: route-loading-ring-rotate 2s linear infinite;
}

@keyframes route-loading-ring-rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.route-loading__logo::after {
  content: '';
  position: absolute;
  inset: -8px;
  border-radius: 50%;
  background: radial-gradient(circle, var(--primary-color) 0%, transparent 70%);
  opacity: 0.3;
  animation: route-loading-pulse 2s ease-in-out infinite;
}

@keyframes route-loading-pulse {
  0%, 100% {
    opacity: 0.1;
    transform: scale(1);
  }
  50% {
    opacity: 0.3;
    transform: scale(1.1);
  }
}

/* ========== 加载文本 ========== */
.route-loading__text {
  text-align: center;
}

.route-loading__title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin-bottom: var(--spacing-1);
}

.route-loading__message {
  font-size: var(--font-size-sm);
  color: var(--text-muted);
}

/* ========== 进度条 ========== */
.route-loading__progress {
  width: 100%;
  height: 4px;
  background: var(--surface-color);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.route-loading__progress-bar {
  height: 100%;
  background: var(--primary-gradient);
  border-radius: var(--radius-full);
  transition: width 0.3s ease;
  position: relative;
}

.route-loading__progress-bar::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  animation: route-loading-shimmer 1.5s ease-in-out infinite;
}

@keyframes route-loading-shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

/* ========== 加载点 ========== */
.route-loading__dots {
  display: flex;
  gap: var(--spacing-2);
}

.route-loading__dot {
  width: 8px;
  height: 8px;
  background: var(--primary-color);
  border-radius: 50%;
  animation: route-loading-dot-pulse 1.4s ease-in-out infinite;
}

.route-loading__dot:nth-child(2) {
  animation-delay: 0.2s;
}

.route-loading__dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes route-loading-dot-pulse {
  0%, 80%, 100% {
    transform: scale(0.6);
    opacity: 0.4;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

/* ========== 过渡动画 ========== */
.route-loading-backdrop-enter-active,
.route-loading-backdrop-leave-active {
  transition: opacity var(--transition-fast);
}

.route-loading-backdrop-enter-from,
.route-loading-backdrop-leave-to {
  opacity: 0;
}

.route-loading-content-enter-active,
.route-loading-content-leave-active {
  transition: var(--transition);
}

.route-loading-content-enter-from,
.route-loading-content-leave-to {
  opacity: 0;
  transform: translate(-50%, -45%);
}

/* ========== 深色模式适配 ========== */
.dark-theme .route-loading__backdrop {
  background: rgba(0, 0, 0, 0.5);
}
</style>
