<template>
  <div class="search-bar" :class="{ 'search-bar--expanded': isExpanded }">
    <!-- 搜索输入框 -->
    <div class="search-bar__input-wrapper">
      <i class="el-icon-search search-bar__icon"></i>
      <input
        ref="searchInput"
        v-model="searchQuery"
        type="text"
        class="search-bar__input"
        placeholder="搜索对话、文档、知识图谱..."
        @focus="handleFocus"
        @blur="handleBlur"
        @keydown="handleKeydown"
        @input="handleInput"
      />
      <kbd v-if="!searchQuery" class="search-bar__shortcut">⌘K</kbd>
      <button
        v-else
        class="search-bar__clear"
        @click="clearSearch"
        type="button"
      >
        <i class="el-icon-circle-close"></i>
      </button>
    </div>

    <!-- 搜索结果下拉面板 -->
    <transition name="search-dropdown">
      <div v-if="showResults" class="search-bar__dropdown" @click.stop>
        <!-- 搜索分类标签 -->
        <div v-if="!searchQuery" class="search-bar__categories">
          <div class="search-bar__category-title">快速访问</div>
          <div class="search-bar__quick-items">
            <a
              v-for="item in quickItems"
              :key="item.path"
              class="search-bar__quick-item"
              :href="item.path"
              @click="handleQuickItem(item)"
            >
              <span class="quick-item__icon">{{ item.icon }}</span>
              <span class="quick-item__label">{{ item.label }}</span>
              <span class="quick-item__shortcut">{{ item.shortcut }}</span>
            </a>
          </div>
        </div>

        <!-- 搜索结果 -->
        <div v-else class="search-bar__results">
          <!-- 加载状态 -->
          <div v-if="isSearching" class="search-bar__loading">
            <div class="search-bar__spinner"></div>
            <span>搜索中...</span>
          </div>

          <!-- 无结果 -->
          <div v-else-if="results.length === 0" class="search-bar__empty">
            <i class="el-icon-search"></i>
            <span>未找到 "{{ searchQuery }}" 的相关结果</span>
          </div>

          <!-- 结果列表 -->
          <div v-else class="search-bar__result-list">
            <div
              v-for="(group, category) in groupedResults"
              :key="category"
              class="search-bar__result-group"
            >
              <div class="search-bar__result-category">{{ categoryLabels[category] }}</div>
              <a
                v-for="result in group"
                :key="result.id"
                class="search-bar__result-item"
                :class="{ 'search-bar__result-item--selected': selectedIndex === result.index }"
                :href="result.url"
                @click="handleResultClick(result)"
                @mouseenter="selectedIndex = result.index"
              >
                <span class="result-item__icon">{{ result.icon }}</span>
                <div class="result-item__content">
                  <div class="result-item__title" v-html="highlightMatch(result.title)"></div>
                  <div class="result-item__description" v-html="highlightMatch(result.description)"></div>
                </div>
                <span class="result-item__type">{{ result.type }}</span>
              </a>
            </div>
          </div>

          <!-- 搜索提示 -->
          <div class="search-bar__footer">
            <span class="search-bar__hint">
              <kbd>↑↓</kbd> 选择
              <kbd>Enter</kbd> 打开
              <kbd>Esc</kbd> 关闭
            </span>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// 状态
const searchQuery = ref('')
const isExpanded = ref(false)
const showResults = ref(false)
const isSearching = ref(false)
const selectedIndex = ref(-1)
const searchInput = ref(null)

// 搜索结果
const results = ref([])

// 快速访问项
const quickItems = [
  { path: '/chat', label: '智能对话', icon: '💬', shortcut: '⌘1' },
  { path: '/documents', label: '文档列表', icon: '📄', shortcut: '⌘2' },
  { path: '/knowledge-graph', label: '知识图谱', icon: '🕸️', shortcut: '⌘3' },
  { path: '/canvas', label: '画布编排', icon: '🎨', shortcut: '⌘4' },
  { path: '/settings', label: '系统设置', icon: '⚙️', shortcut: '⌘,' },
  { path: '/history', label: '历史记录', icon: '🕐', shortcut: '⌘H' }
]

// 分类标签
const categoryLabels = {
  conversations: '对话记录',
  documents: '文档',
  knowledge: '知识图谱',
  settings: '设置选项'
}

// 分组结果
const groupedResults = computed(() => {
  const groups = {}
  results.value.forEach((result, index) => {
    if (!groups[result.category]) {
      groups[result.category] = []
    }
    groups[result.category].push({ ...result, index })
  })
  return groups
})

// 防抖搜索
let searchDebounce = null

const handleInput = () => {
  clearTimeout(searchDebounce)
  if (!searchQuery.value.trim()) {
    results.value = []
    return
  }

  searchDebounce = setTimeout(() => {
    performSearch()
  }, 300)
}

// 执行搜索
const performSearch = async () => {
  if (!searchQuery.value.trim()) return

  isSearching.value = true

  // 模拟搜索延迟
  await new Promise(resolve => setTimeout(resolve, 200))

  const query = searchQuery.value.toLowerCase()
  const searchResults = []

  // 搜索对话历史
  const conversations = JSON.parse(localStorage.getItem('chatHistory') || '{}')
  if (conversations.chatSessions) {
    conversations.chatSessions.forEach(session => {
      if (session.title?.toLowerCase().includes(query)) {
        searchResults.push({
          id: `conv-${session.id}`,
          title: session.title,
          description: `对话于 ${new Date(session.createdAt).toLocaleDateString()}`,
          icon: '💬',
          category: 'conversations',
          type: '对话',
          url: `/chat?session=${session.id}`
        })
      }
    })
  }

  // 搜索文档
  const documents = JSON.parse(localStorage.getItem('documents') || '[]')
  documents.forEach(doc => {
    if (doc.name?.toLowerCase().includes(query) || doc.content?.toLowerCase().includes(query)) {
      searchResults.push({
        id: `doc-${doc.id}`,
        title: doc.name,
        description: doc.content?.substring(0, 100) || '无描述',
        icon: '📄',
        category: 'documents',
        type: '文档',
        url: `/documents/${doc.id}`
      })
    }
  })

  // 搜索知识图谱实体
  const entities = JSON.parse(localStorage.getItem('kgEntities') || '[]')
  entities.forEach(entity => {
    if (entity.name?.toLowerCase().includes(query) || entity.type?.toLowerCase().includes(query)) {
      searchResults.push({
        id: `entity-${entity.id}`,
        title: entity.name,
        description: entity.type || '实体',
        icon: '🔷',
        category: 'knowledge',
        type: '实体',
        url: `/knowledge-graph/entities/${entity.id}`
      })
    }
  })

  // 添加设置选项
  const settingsOptions = [
    { key: 'theme', title: '主题设置', icon: '🎨', url: '/settings#theme' },
    { key: 'profile', title: '个人资料', icon: '👤', url: '/settings#profile' },
    { key: 'notifications', title: '通知设置', icon: '🔔', url: '/settings#notifications' }
  ]
  settingsOptions.forEach(option => {
    if (option.title.toLowerCase().includes(query)) {
      searchResults.push({
        id: `setting-${option.key}`,
        title: option.title,
        description: '设置选项',
        icon: option.icon,
        category: 'settings',
        type: '设置',
        url: option.url
      })
    }
  })

  // 限制结果数量
  results.value = searchResults.slice(0, 10)
  selectedIndex.value = -1
  isSearching.value = false
}

// 高亮匹配
const highlightMatch = (text) => {
  if (!searchQuery.value || !text) return text
  const regex = new RegExp(`(${searchQuery.value})`, 'gi')
  return text.replace(regex, '<mark>$1</mark>')
}

// 处理焦点
const handleFocus = () => {
  isExpanded.value = true
  showResults.value = true
}

// 处理失焦
const handleBlur = () => {
  // 延迟关闭，允许点击结果
  setTimeout(() => {
    showResults.value = false
    if (!searchQuery.value) {
      isExpanded.value = false
    }
  }, 200)
}

// 处理键盘
const handleKeydown = (e) => {
  const flatResults = results.value
  const maxIndex = flatResults.length - 1

  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault()
      selectedIndex.value = selectedIndex.value < maxIndex ? selectedIndex.value + 1 : 0
      break
    case 'ArrowUp':
      e.preventDefault()
      selectedIndex.value = selectedIndex.value > 0 ? selectedIndex.value - 1 : maxIndex
      break
    case 'Enter':
      e.preventDefault()
      if (selectedIndex.value >= 0 && flatResults[selectedIndex.value]) {
        handleResultClick(flatResults[selectedIndex.value])
      }
      break
    case 'Escape':
      showResults.value = false
      if (!searchQuery.value) {
        isExpanded.value = false
      }
      break
  }
}

// 清除搜索
const clearSearch = () => {
  searchQuery.value = ''
  results.value = []
  searchInput.value?.focus()
}

// 处理结果点击
const handleResultClick = (result) => {
  showResults.value = false
  router.push(result.url)
}

// 处理快速项点击
const handleQuickItem = (item) => {
  showResults.value = false
  router.push(item.path)
}

// 全局快捷键
const handleGlobalKeydown = (e) => {
  // Cmd/Ctrl + K 打开搜索
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault()
    isExpanded.value = true
    showResults.value = true
    nextTick(() => {
      searchInput.value?.focus()
    })
  }
  // Escape 关闭
  if (e.key === 'Escape' && showResults.value) {
    showResults.value = false
    if (!searchQuery.value) {
      isExpanded.value = false
    }
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleGlobalKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeydown)
  clearTimeout(searchDebounce)
})
</script>

<style scoped>
.search-bar {
  position: relative;
  width: 280px;
  transition: var(--transition);
}

.search-bar--expanded {
  width: 400px;
}

/* ========== 输入框区域 ========== */
.search-bar__input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: var(--spacing-2) var(--spacing-4);
  transition: var(--transition);
}

.search-bar__input-wrapper:hover,
.search-bar__input-wrapper:focus-within {
  background: var(--card-background);
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.search-bar__icon {
  font-size: 16px;
  color: var(--text-muted);
  margin-right: var(--spacing-2);
}

.search-bar__input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  outline: none;
}

.search-bar__input::placeholder {
  color: var(--text-muted);
}

.search-bar__shortcut {
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
  padding: var(--spacing-1) var(--spacing-2);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: var(--text-muted);
  background: var(--background-color);
  border-radius: var(--radius-sm);
}

.search-bar__clear {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  color: var(--text-muted);
  background: transparent;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: var(--transition-fast);
}

.search-bar__clear:hover {
  background: var(--surface-color);
  color: var(--text-primary);
}

/* ========== 下拉面板 ========== */
.search-bar__dropdown {
  position: absolute;
  top: calc(100% + var(--spacing-2));
  left: 0;
  right: 0;
  background: var(--card-background);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  max-height: 400px;
  overflow-y: auto;
  z-index: var(--z-dropdown);
}

/* ========== 快速访问 ========== */
.search-bar__categories {
  padding: var(--spacing-3);
}

.search-bar__category-title {
  padding: var(--spacing-2) var(--spacing-3);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.search-bar__quick-items {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.search-bar__quick-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-3);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  text-decoration: none;
  transition: var(--transition-fast);
}

.search-bar__quick-item:hover {
  background: var(--surface-color);
}

.quick-item__icon {
  font-size: 18px;
}

.quick-item__label {
  flex: 1;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.quick-item__shortcut {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
}

/* ========== 搜索结果 ========== */
.search-bar__results {
  padding: var(--spacing-2);
}

.search-bar__loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-3);
  padding: var(--spacing-6);
  color: var(--text-muted);
}

.search-bar__spinner {
  width: 20px;
  height: 20px;
  border: 2px solid var(--border-color);
  border-top-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.search-bar__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-6);
  color: var(--text-muted);
  text-align: center;
}

.search-bar__empty i {
  font-size: 32px;
  opacity: 0.5;
}

.search-bar__result-group {
  margin-bottom: var(--spacing-2);
}

.search-bar__result-group:last-child {
  margin-bottom: 0;
}

.search-bar__result-category {
  padding: var(--spacing-2) var(--spacing-3);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.search-bar__result-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-3);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  text-decoration: none;
  transition: var(--transition-fast);
}

.search-bar__result-item:hover,
.search-bar__result-item--selected {
  background: var(--surface-color);
}

.result-item__icon {
  font-size: 18px;
  flex-shrink: 0;
}

.result-item__content {
  flex: 1;
  min-width: 0;
}

.result-item__title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.result-item__description {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.result-item__type {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
  background: var(--surface-color);
  padding: var(--spacing-1) var(--spacing-2);
  border-radius: var(--radius-sm);
}

/* 高亮标记 */
:deep(mark) {
  background: var(--color-primary-200);
  color: var(--color-primary-900);
  padding: 0 2px;
  border-radius: 2px;
}

.dark-theme :deep(mark) {
  background: var(--color-primary-900);
  color: var(--color-primary-300);
}

/* ========== 底部提示 ========== */
.search-bar__footer {
  padding: var(--spacing-3);
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: center;
}

.search-bar__hint {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  font-size: var(--font-size-xs);
  color: var(--text-muted);
}

.search-bar__hint kbd {
  display: inline-flex;
  align-items: center;
  padding: 2px 6px;
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  font-family: var(--font-family-mono);
  font-size: 10px;
}

/* ========== 过渡动画 ========== */
.search-dropdown-enter-active,
.search-dropdown-leave-active {
  transition: var(--transition-fast);
}

.search-dropdown-enter-from,
.search-dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* ========== 响应式 ========== */
@media (max-width: 768px) {
  .search-bar {
    width: 200px;
  }

  .search-bar--expanded {
    position: fixed;
    top: var(--spacing-4);
    left: var(--spacing-4);
    right: var(--spacing-4);
    width: auto;
    z-index: var(--z-modal);
  }

  .search-bar__dropdown {
    position: fixed;
    top: auto;
    left: var(--spacing-4);
    right: var(--spacing-4);
    max-height: calc(100vh - 120px);
  }
}
</style>
