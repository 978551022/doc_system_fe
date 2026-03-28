<template>
  <div class="loading-state">
    <div class="loading-spinner">
      <div class="spinner-ring"></div>
      <div class="spinner-ring"></div>
      <div class="spinner-ring"></div>
    </div>
    <p v-if="text" class="loading-text">{{ text }}</p>
  </div>
</template>

<script setup>
defineProps({
  text: {
    type: String,
    default: ''
  }
})
</script>

<style scoped>
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-10) var(--spacing-6);
  min-height: 200px;
}

.loading-spinner {
  position: relative;
  width: 48px;
  height: 48px;
}

.spinner-ring {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: 3px solid transparent;
  border-radius: 50%;
  animation: spin 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
}

.spinner-ring:nth-child(1) {
  border-top-color: var(--primary-color);
  animation-delay: -0.45s;
}

.spinner-ring:nth-child(2) {
  border-top-color: var(--primary-light);
  animation-delay: -0.3s;
}

.spinner-ring:nth-child(3) {
  border-top-color: var(--accent-color);
  animation-delay: -0.15s;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.loading-text {
  margin-top: var(--spacing-4);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  font-weight: var(--font-weight-medium);
}

/* 小尺寸变体 */
.loading-state--small .loading-spinner {
  width: 32px;
  height: 32px;
}

.loading-state--small .spinner-ring {
  border-width: 2px;
}

/* 大尺寸变体 */
.loading-state--large .loading-spinner {
  width: 64px;
  height: 64px;
}

.loading-state--large .spinner-ring {
  border-width: 4px;
}
</style>
