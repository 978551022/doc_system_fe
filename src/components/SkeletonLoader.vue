<template>
  <div class="skeleton-loader" :class="`skeleton-loader--${variant}`">
    <!-- 卡片骨架屏 -->
    <template v-if="variant === 'card'">
      <div v-for="i in count" :key="i" class="skeleton-card">
        <div class="skeleton-card__avatar"></div>
        <div class="skeleton-card__content">
          <div class="skeleton-card__title"></div>
          <div class="skeleton-card__text"></div>
          <div class="skeleton-card__text skeleton-card__text--short"></div>
        </div>
      </div>
    </template>

    <!-- 列表骨架屏 -->
    <template v-else-if="variant === 'list'">
      <div v-for="i in count" :key="i" class="skeleton-list">
        <div class="skeleton-list__dot"></div>
        <div class="skeleton-list__content">
          <div class="skeleton-list__title"></div>
          <div class="skeleton-list__text"></div>
        </div>
        <div class="skeleton-list__action"></div>
      </div>
    </template>

    <!-- 对话骨架屏 -->
    <template v-else-if="variant === 'chat'">
      <div v-for="i in count" :key="i" class="skeleton-chat">
        <div class="skeleton-chat__avatar"></div>
        <div class="skeleton-chat__content">
          <div class="skeleton-chat__name"></div>
          <div class="skeleton-chat__message">
            <div class="skeleton-chat__line"></div>
            <div class="skeleton-chat__line"></div>
            <div class="skeleton-chat__line skeleton-chat__line--short"></div>
          </div>
        </div>
      </div>
    </template>

    <!-- 文档骨架屏 -->
    <template v-else-if="variant === 'document'">
      <div class="skeleton-document">
        <div class="skeleton-document__header">
          <div class="skeleton-document__icon"></div>
          <div class="skeleton-document__title"></div>
        </div>
        <div class="skeleton-document__body">
          <div v-for="line in 8" :key="line" class="skeleton-document__line" :class="{ 'skeleton-document__line--short': line % 5 === 0 }"></div>
        </div>
      </div>
    </template>

    <!-- 表格骨架屏 -->
    <template v-else-if="variant === 'table'">
      <div class="skeleton-table">
        <div class="skeleton-table__header">
          <div v-for="col in columns" :key="col" class="skeleton-table__th"></div>
        </div>
        <div v-for="row in rows" :key="row" class="skeleton-table__row">
          <div v-for="col in columns" :key="col" class="skeleton-table__td"></div>
        </div>
      </div>
    </template>

    <!-- 默认骨架屏 -->
    <template v-else>
      <div v-for="i in count" :key="i" class="skeleton-default">
        <div class="skeleton-default__bar"></div>
        <div class="skeleton-default__bar"></div>
        <div class="skeleton-default__bar skeleton-default__bar--short"></div>
      </div>
    </template>
  </div>
</template>

<script setup>
defineProps({
  // 骨架屏类型
  variant: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'card', 'list', 'chat', 'document', 'table'].includes(value)
  },
  // 重复次数
  count: {
    type: Number,
    default: 3
  },
  // 表格列数（仅 table 类型）
  columns: {
    type: Number,
    default: 4
  },
  // 表格行数（仅 table 类型）
  rows: {
    type: Number,
    default: 5
  }
})
</script>

<style scoped>
/* ========== 骨架屏基础样式 ========== */
.skeleton-loader {
  --skeleton-base: var(--surface-color);
  --skeleton-highlight: var(--border-color);
}

.skeleton-loader * {
  pointer-events: none;
  user-select: none;
}

/* 骨架闪光动画 */
@keyframes skeleton-shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

.skeleton-bg {
  background: linear-gradient(
    90deg,
    var(--skeleton-base) 25%,
    var(--skeleton-highlight) 50%,
    var(--skeleton-base) 75%
  );
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s ease-in-out infinite;
}

/* ========== 卡片骨架屏 ========== */
.skeleton-card {
  display: flex;
  gap: var(--spacing-4);
  padding: var(--spacing-4);
  background: var(--card-background);
  border-radius: var(--radius-lg);
  margin-bottom: var(--spacing-3);
}

.skeleton-card__avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  flex-shrink: 0;
}

.skeleton-card__content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.skeleton-card__title {
  height: 16px;
  width: 60%;
  border-radius: var(--radius-sm);
}

.skeleton-card__text {
  height: 12px;
  width: 100%;
  border-radius: var(--radius-sm);
}

.skeleton-card__text--short {
  width: 40%;
}

.skeleton-card__avatar,
.skeleton-card__title,
.skeleton-card__text {
  @extend .skeleton-bg;
}

/* ========== 列表骨架屏 ========== */
.skeleton-list {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-3) 0;
  border-bottom: 1px solid var(--border-color);
}

.skeleton-list__dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  flex-shrink: 0;
}

.skeleton-list__content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.skeleton-list__title {
  height: 14px;
  width: 50%;
  border-radius: var(--radius-sm);
}

.skeleton-list__text {
  height: 12px;
  width: 70%;
  border-radius: var(--radius-sm);
}

.skeleton-list__action {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
  flex-shrink: 0;
}

.skeleton-list__dot,
.skeleton-list__title,
.skeleton-list__text,
.skeleton-list__action {
  @extend .skeleton-bg;
}

/* ========== 对话骨架屏 ========== */
.skeleton-chat {
  display: flex;
  gap: var(--spacing-3);
  padding: var(--spacing-4);
  margin-bottom: var(--spacing-2);
}

.skeleton-chat__avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  flex-shrink: 0;
}

.skeleton-chat__content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.skeleton-chat__name {
  height: 12px;
  width: 80px;
  border-radius: var(--radius-sm);
}

.skeleton-chat__message {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
  padding: var(--spacing-3);
  background: var(--surface-color);
  border-radius: var(--radius-md);
  max-width: 80%;
}

.skeleton-chat__line {
  height: 12px;
  border-radius: var(--radius-sm);
}

.skeleton-chat__line--short {
  width: 60%;
}

.skeleton-chat__avatar,
.skeleton-chat__name,
.skeleton-chat__line {
  @extend .skeleton-bg;
}

/* ========== 文档骨架屏 ========== */
.skeleton-document {
  background: var(--card-background);
  border-radius: var(--radius-lg);
  padding: var(--spacing-6);
}

.skeleton-document__header {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  margin-bottom: var(--spacing-6);
}

.skeleton-document__icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
}

.skeleton-document__title {
  flex: 1;
  height: 20px;
  border-radius: var(--radius-sm);
}

.skeleton-document__body {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.skeleton-document__line {
  height: 14px;
  border-radius: var(--radius-sm);
}

.skeleton-document__line--short {
  width: 70%;
}

.skeleton-document__icon,
.skeleton-document__title,
.skeleton-document__line {
  @extend .skeleton-bg;
}

/* ========== 表格骨架屏 ========== */
.skeleton-table {
  background: var(--card-background);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.skeleton-table__header {
  display: flex;
  padding: var(--spacing-3) var(--spacing-4);
  border-bottom: 1px solid var(--border-color);
  gap: var(--spacing-3);
}

.skeleton-table__th {
  flex: 1;
  height: 16px;
  border-radius: var(--radius-sm);
}

.skeleton-table__row {
  display: flex;
  padding: var(--spacing-4);
  border-bottom: 1px solid var(--border-color);
  gap: var(--spacing-3);
}

.skeleton-table__row:last-child {
  border-bottom: none;
}

.skeleton-table__td {
  flex: 1;
  height: 14px;
  border-radius: var(--radius-sm);
}

.skeleton-table__th,
.skeleton-table__td {
  @extend .skeleton-bg;
}

/* ========== 默认骨架屏 ========== */
.skeleton-default {
  padding: var(--spacing-4);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.skeleton-default__bar {
  height: 16px;
  border-radius: var(--radius-sm);
}

.skeleton-default__bar--short {
  width: 60%;
}

.skeleton-default__bar {
  @extend .skeleton-bg;
}

/* ========== 脉冲动画变体 ========== */
.skeleton-loader--pulse .skeleton-card,
.skeleton-loader--pulse .skeleton-list,
.skeleton-loader--pulse .skeleton-chat {
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}

@keyframes skeleton-pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* ========== 深色模式适配 ========== */
.dark-theme {
  --skeleton-base: var(--color-gray-800);
  --skeleton-highlight: var(--color-gray-700);
}
</style>
