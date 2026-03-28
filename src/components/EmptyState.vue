<template>
  <div class="empty-state">
    <div class="empty-state__illustration">
      <slot name="illustration">
        <!-- 默认空状态插画 -->
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="60" cy="60" r="50" fill="currentColor" fill-opacity="0.05"/>
          <circle cx="60" cy="60" r="35" fill="currentColor" fill-opacity="0.1"/>
          <circle cx="60" cy="60" r="20" fill="currentColor" fill-opacity="0.15"/>
          <path d="M45 60L55 70L75 50" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" stroke-opacity="0.3"/>
        </svg>
      </slot>
    </div>
    <h3 v-if="title" class="empty-state__title">{{ title }}</h3>
    <p v-if="description" class="empty-state__description">{{ description }}</p>
    <div v-if="$slots.actions" class="empty-state__actions">
      <slot name="actions"></slot>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: ''
  }
})
</script>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-10) var(--spacing-6);
  text-align: center;
  min-height: 300px;
  color: var(--text-muted);
}

.empty-state__illustration {
  width: 120px;
  height: 120px;
  margin-bottom: var(--spacing-6);
  color: var(--text-muted);
  opacity: 0.6;
}

.empty-state__illustration svg {
  width: 100%;
  height: 100%;
}

.empty-state__title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0 0 var(--spacing-2) 0;
}

.empty-state__description {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin: 0 0 var(--spacing-6) 0;
  max-width: 400px;
  line-height: 1.6;
}

.empty-state__actions {
  display: flex;
  gap: var(--spacing-3);
  flex-wrap: wrap;
  justify-content: center;
}
</style>
