<template>
  <div class="notification-center">
    <!-- 通知铃铛按钮 -->
    <button
      ref="triggerRef"
      class="notification-center__trigger"
      @click="togglePanel"
      :class="{ 'notification-center__trigger--active': isOpen }"
    >
      <i class="el-icon-bell notification-center__icon"></i>
      <span v-if="unreadCount > 0" class="notification-center__badge">
        {{ unreadCount > 99 ? '99+' : unreadCount }}
      </span>
      <span v-if="hasUnread" class="notification-center__pulse"></span>
    </button>

    <!-- 通知面板 -->
    <transition name="notification-panel">
      <div v-if="isOpen" class="notification-center__panel" @click.stop>
        <!-- 面板头部 -->
        <div class="notification-center__header">
          <div class="notification-center__title">
            <h3>通知</h3>
            <span v-if="unreadCount > 0" class="notification-center__unread-count">
              {{ unreadCount }} 条未读
            </span>
          </div>
          <div class="notification-center__actions">
            <button
              class="notification-center__action-btn"
              @click="markAllAsRead"
              title="全部标记为已读"
              :disabled="unreadCount === 0"
            >
              <i class="el-icon-check"></i>
            </button>
            <button
              class="notification-center__action-btn"
              @click="clearAll"
              title="清空通知"
            >
              <i class="el-icon-delete"></i>
            </button>
          </div>
        </div>

        <!-- 通知分类标签 -->
        <div class="notification-center__tabs">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            class="notification-center__tab"
            :class="{ 'notification-center__tab--active': activeTab === tab.key }"
            @click="activeTab = tab.key"
          >
            <span>{{ tab.label }}</span>
            <span v-if="tab.count > 0" class="notification-center__tab-count">{{ tab.count }}</span>
          </button>
        </div>

        <!-- 通知列表 -->
        <div class="notification-center__content">
          <!-- 加载状态 -->
          <div v-if="isLoading" class="notification-center__loading">
            <div class="notification-center__spinner"></div>
            <span>加载中...</span>
          </div>

          <!-- 空状态 -->
          <div v-else-if="filteredNotifications.length === 0" class="notification-center__empty">
            <component :is="EmptyState" title="暂无通知" :description="emptyDescription" />
          </div>

          <!-- 通知列表 -->
          <div v-else class="notification-center__list">
            <div
              v-for="notification in filteredNotifications"
              :key="notification.id"
              class="notification-center__item"
              :class="{
                'notification-center__item--unread': !notification.read,
                'notification-center__item--selected': selectedId === notification.id
              }"
              @click="handleNotificationClick(notification)"
            >
              <div class="notification-center__item-icon">
                <span>{{ notification.icon }}</span>
              </div>
              <div class="notification-center__item-content">
                <div class="notification-center__item-header">
                  <h4 class="notification-center__item-title">{{ notification.title }}</h4>
                  <span class="notification-center__item-time">{{ formatTime(notification.time) }}</span>
                </div>
                <p class="notification-center__item-message">{{ notification.message }}</p>
                <div v-if="notification.actions" class="notification-center__item-actions">
                  <button
                    v-for="action in notification.actions"
                    :key="action.key"
                    class="notification-center__item-action-btn"
                    @click.stop="handleAction(notification, action)"
                  >
                    {{ action.label }}
                  </button>
                </div>
              </div>
              <button
                class="notification-center__item-close"
                @click.stop="removeNotification(notification.id)"
                title="删除"
              >
                <i class="el-icon-close"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- 面板底部 -->
        <div class="notification-center__footer">
          <a href="#" class="notification-center__footer-link" @click="goToSettings">
            通知设置
          </a>
        </div>
      </div>
    </transition>

    <!-- 背景遮罩 -->
    <transition name="notification-backdrop">
      <div
        v-if="isOpen"
        class="notification-center__backdrop"
        @click="closePanel"
      ></div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import EmptyState from './EmptyState.vue'

const router = useRouter()

// 状态
const isOpen = ref(false)
const activeTab = ref('all')
const isLoading = ref(false)
const selectedId = ref(null)

// 分类标签
const tabs = computed(() => [
  { key: 'all', label: '全部', count: notifications.value.length },
  { key: 'unread', label: '未读', count: notifications.value.filter(n => !n.read).length },
  { key: 'system', label: '系统', count: notifications.value.filter(n => n.type === 'system').length },
  { key: 'chat', label: '对话', count: notifications.value.filter(n => n.type === 'chat').length }
])

// 通知数据
const notifications = ref([])

// 示例通知数据
const sampleNotifications = [
  {
    id: '1',
    type: 'system',
    icon: '🔔',
    title: '系统通知',
    message: '系统将在今晚 22:00 进行维护，预计持续 30 分钟',
    time: Date.now() - 1000 * 60 * 5,
    read: false,
    actions: [
      { key: 'details', label: '查看详情' },
      { key: 'dismiss', label: '忽略' }
    ]
  },
  {
    id: '2',
    type: 'chat',
    icon: '💬',
    title: '对话完成',
    message: 'AI 已完成您的对话请求，点击查看结果',
    time: Date.now() - 1000 * 60 * 30,
    read: false,
    url: '/chat'
  },
  {
    id: '3',
    type: 'document',
    icon: '📄',
    title: '文档上传成功',
    message: '《技术文档.pdf》已成功上传并解析',
    time: Date.now() - 1000 * 60 * 60,
    read: true,
    url: '/documents'
  },
  {
    id: '4',
    type: 'knowledge',
    icon: '🕸️',
    title: '知识图谱更新',
    message: '知识图谱已自动更新，新增 15 个实体关系',
    time: Date.now() - 1000 * 60 * 60 * 2,
    read: true,
    url: '/knowledge-graph'
  },
  {
    id: '5',
    type: 'system',
    icon: '⚠️',
    title: '存储空间警告',
    message: '您的存储空间已使用 85%，建议清理不必要的文件',
    time: Date.now() - 1000 * 60 * 60 * 24,
    read: false,
    actions: [
      { key: 'clean', label: '立即清理' },
      { key: 'upgrade', label: '升级容量' }
    ]
  }
]

// 过滤后的通知
const filteredNotifications = computed(() => {
  let filtered = notifications.value

  switch (activeTab.value) {
    case 'unread':
      filtered = filtered.filter(n => !n.read)
      break
    case 'system':
      filtered = filtered.filter(n => n.type === 'system')
      break
    case 'chat':
      filtered = filtered.filter(n => n.type === 'chat' || n.type === 'document' || n.type === 'knowledge')
      break
  }

  return filtered
})

// 未读数量
const unreadCount = computed(() => {
  return notifications.value.filter(n => !n.read).length
})

// 是否有未读
const hasUnread = computed(() => unreadCount.value > 0)

// 空状态描述
const emptyDescription = computed(() => {
  switch (activeTab.value) {
    case 'unread': return '暂无未读通知'
    case 'system': return '暂无系统通知'
    case 'chat': return '暂无对话通知'
    default: return '您还没有任何通知'
  }
})

// 切换面板
const togglePanel = () => {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    document.addEventListener('click', handleClickOutside)
  }
}

// 关闭面板
const closePanel = () => {
  isOpen.value = false
  document.removeEventListener('click', handleClickOutside)
}

// 点击外部关闭
const handleClickOutside = (e) => {
  const center = e.target.closest('.notification-center')
  if (!center) {
    closePanel()
  }
}

// 格式化时间
const formatTime = (timestamp) => {
  const now = Date.now()
  const diff = now - timestamp

  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour

  if (diff < minute) {
    return '刚刚'
  } else if (diff < hour) {
    return `${Math.floor(diff / minute)}分钟前`
  } else if (diff < day) {
    return `${Math.floor(diff / hour)}小时前`
  } else if (diff < day * 7) {
    return `${Math.floor(diff / day)}天前`
  } else {
    return new Date(timestamp).toLocaleDateString()
  }
}

// 处理通知点击
const handleNotificationClick = (notification) => {
  selectedId.value = notification.id

  // 标记为已读
  if (!notification.read) {
    notification.read = true
    saveNotifications()
  }

  // 如果有 URL，跳转
  if (notification.url) {
    router.push(notification.url)
    closePanel()
  }
}

// 处理操作按钮
const handleAction = (notification, action) => {
  console.log('Action:', action.key, notification)

  // 标记为已读
  if (!notification.read) {
    notification.read = true
    saveNotifications()
  }

  // 处理特定操作
  switch (action.key) {
    case 'details':
      // 显示详情
      break
    case 'dismiss':
      // 忽略，删除通知
      removeNotification(notification.id)
      break
    case 'clean':
      router.push('/documents')
      closePanel()
      break
    case 'upgrade':
      router.push('/settings')
      closePanel()
      break
  }
}

// 删除通知
const removeNotification = (id) => {
  notifications.value = notifications.value.filter(n => n.id !== id)
  saveNotifications()
}

// 全部标记为已读
const markAllAsRead = () => {
  notifications.value.forEach(n => n.read = true)
  saveNotifications()
}

// 清空所有
const clearAll = () => {
  notifications.value = []
  saveNotifications()
}

// 跳转到设置
const goToSettings = (e) => {
  e.preventDefault()
  router.push('/settings#notifications')
  closePanel()
}

// 保存通知到 localStorage
const saveNotifications = () => {
  localStorage.setItem('notifications', JSON.stringify(notifications.value))
}

// 加载通知
const loadNotifications = () => {
  const saved = localStorage.getItem('notifications')
  if (saved) {
    try {
      notifications.value = JSON.parse(saved)
    } catch (e) {
      notifications.value = []
    }
  } else {
    notifications.value = sampleNotifications
    saveNotifications()
  }
}

onMounted(() => {
  loadNotifications()
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.notification-center {
  position: relative;
}

/* ========== 触发按钮 ========== */
.notification-center__trigger {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: transparent;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: var(--transition);
}

.notification-center__trigger:hover {
  background: var(--surface-color);
}

.notification-center__trigger--active {
  background: var(--surface-color);
}

.notification-center__icon {
  font-size: 18px;
  color: var(--text-secondary);
  transition: var(--transition);
}

.notification-center__trigger:hover .notification-center__icon {
  color: var(--primary-color);
}

/* 未读徽章 */
.notification-center__badge {
  position: absolute;
  top: 4px;
  right: 4px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--error-color);
  color: white;
  font-size: 10px;
  font-weight: var(--font-weight-semibold);
  border-radius: var(--radius-full);
  border: 2px solid var(--card-background);
  animation: badge-bounce 0.3s var(--easing-bounce);
}

@keyframes badge-bounce {
  0% { transform: scale(0); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

/* 脉冲动画 */
.notification-center__pulse {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 12px;
  height: 12px;
  background: var(--error-color);
  border-radius: 50%;
  animation: pulse-ring 1.5s ease-out infinite;
}

@keyframes pulse-ring {
  0% {
    transform: scale(1);
    opacity: 0.8;
  }
  100% {
    transform: scale(2.5);
    opacity: 0;
  }
}

/* ========== 通知面板 ========== */
.notification-center__panel {
  position: absolute;
  top: calc(100% + var(--spacing-2));
  right: 0;
  width: 380px;
  max-height: 500px;
  background: var(--card-background);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-2xl);
  display: flex;
  flex-direction: column;
  z-index: var(--z-dropdown);
  overflow: hidden;
}

/* ========== 面板头部 ========== */
.notification-center__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-4);
  border-bottom: 1px solid var(--border-color);
}

.notification-center__title {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.notification-center__title h3 {
  margin: 0;
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.notification-center__unread-count {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
  background: var(--surface-color);
  padding: 2px 8px;
  border-radius: var(--radius-full);
}

.notification-center__actions {
  display: flex;
  gap: var(--spacing-1);
}

.notification-center__action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  cursor: pointer;
  transition: var(--transition-fast);
}

.notification-center__action-btn:hover:not(:disabled) {
  background: var(--surface-color);
  color: var(--primary-color);
}

.notification-center__action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ========== 分类标签 ========== */
.notification-center__tabs {
  display: flex;
  padding: var(--spacing-2) var(--spacing-4);
  gap: var(--spacing-2);
  border-bottom: 1px solid var(--border-color);
  overflow-x: auto;
}

.notification-center__tab {
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
  padding: var(--spacing-1) var(--spacing-3);
  background: transparent;
  border: none;
  border-radius: var(--radius-full);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
  cursor: pointer;
  white-space: nowrap;
  transition: var(--transition-fast);
}

.notification-center__tab:hover {
  background: var(--surface-color);
}

.notification-center__tab--active {
  background: var(--primary-color);
  color: white;
}

.notification-center__tab-count {
  font-size: var(--font-size-xs);
  background: rgba(0, 0, 0, 0.2);
  padding: 1px 6px;
  border-radius: var(--radius-full);
}

.notification-center__tab--active .notification-center__tab-count {
  background: rgba(255, 255, 255, 0.2);
}

/* ========== 内容区域 ========== */
.notification-center__content {
  flex: 1;
  overflow-y: auto;
  min-height: 200px;
}

/* 加载状态 */
.notification-center__loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-3);
  padding: var(--spacing-8);
  color: var(--text-muted);
}

.notification-center__spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--border-color);
  border-top-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 空状态 */
.notification-center__empty {
  padding: var(--spacing-6);
}

/* 通知列表 */
.notification-center__list {
  padding: var(--spacing-2);
}

.notification-center__item {
  display: flex;
  gap: var(--spacing-3);
  padding: var(--spacing-3);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition-fast);
  position: relative;
}

.notification-center__item:hover {
  background: var(--surface-color);
}

.notification-center__item--unread {
  background: rgba(99, 102, 241, 0.05);
}

.notification-center__item--unread::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 24px;
  background: var(--primary-color);
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
}

.notification-center__item-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  background: var(--surface-color);
  border-radius: var(--radius-md);
  flex-shrink: 0;
}

.notification-center__item-content {
  flex: 1;
  min-width: 0;
}

.notification-center__item-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--spacing-2);
  margin-bottom: var(--spacing-1);
}

.notification-center__item-title {
  margin: 0;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.notification-center__item-time {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
  white-space: nowrap;
}

.notification-center__item-message {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  line-height: var(--line-height-snug);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.notification-center__item-actions {
  display: flex;
  gap: var(--spacing-2);
  margin-top: var(--spacing-2);
}

.notification-center__item-action-btn {
  padding: var(--spacing-1) var(--spacing-2);
  font-size: var(--font-size-xs);
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  cursor: pointer;
  transition: var(--transition-fast);
}

.notification-center__item-action-btn:hover {
  background: var(--primary-color);
  border-color: var(--primary-color);
  color: white;
}

.notification-center__item-close {
  position: absolute;
  top: var(--spacing-2);
  right: var(--spacing-2);
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  cursor: pointer;
  opacity: 0;
  transition: var(--transition-fast);
}

.notification-center__item:hover .notification-center__item-close {
  opacity: 1;
}

.notification-center__item-close:hover {
  background: var(--surface-color);
  color: var(--error-color);
}

/* ========== 面板底部 ========== */
.notification-center__footer {
  padding: var(--spacing-3) var(--spacing-4);
  border-top: 1px solid var(--border-color);
  text-align: center;
}

.notification-center__footer-link {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  text-decoration: none;
  transition: var(--transition-fast);
}

.notification-center__footer-link:hover {
  color: var(--primary-color);
}

/* ========== 背景遮罩 ========== */
.notification-center__backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: calc(var(--z-dropdown) - 1);
}

/* ========== 过渡动画 ========== */
.notification-panel-enter-active,
.notification-panel-leave-active {
  transition: var(--transition-fast);
}

.notification-panel-enter-from,
.notification-panel-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.95);
}

.notification-backdrop-enter-active,
.notification-backdrop-leave-active {
  transition: var(--transition-fast);
}

.notification-backdrop-enter-from,
.notification-backdrop-leave-to {
  opacity: 0;
}

/* ========== 响应式 ========== */
@media (max-width: 640px) {
  .notification-center__panel {
    position: fixed;
    top: auto;
    bottom: 0;
    right: 0;
    left: 0;
    width: 100%;
    max-height: 70vh;
    border-radius: var(--radius-lg) var(--radius-lg) 0 0;
    z-index: var(--z-modal);
  }

  .notification-center__backdrop {
    z-index: calc(var(--z-modal) - 1);
  }
}
</style>
