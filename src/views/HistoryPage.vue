<template>
  <div class="history-page">
    <el-card class="history-card">
      <template #header>
        <div class="card-header">
          <h2>历史对话</h2>
          <el-button type="danger" size="small" @click="clearHistory">
            <i class="el-icon-delete"></i> 清空历史
          </el-button>
        </div>
      </template>
      
      <div class="history-list" v-if="historyList.length > 0">
        <el-timeline>
          <el-timeline-item 
            v-for="(item, index) in historyList" 
            :key="item.id"
            :timestamp="item.time"
            placement="top"
          >
            <el-card class="history-item" @click="loadHistory(item)">
              <div class="history-item__header">
                <h3 class="history-item__title">{{ item.title }}</h3>
                <el-button
                  type="danger"
                  @click.stop="deleteHistory(item.id)"
                  class="history-item__delete-btn"
                  title="删除"
                  :loading="deleteLoading"
                  :disabled="deleteLoading"
                  size="small"
                  circle
                  plain
                >
                  <template #icon>
                    <el-icon v-if="!deleteLoading"><Delete /></el-icon>
                  </template>
                </el-button>
              </div>
              <p class="history-item__preview">{{ item.preview }}</p>
              <div class="history-item__meta">
                <span class="history-item__message-count">{{ item.messageCount }}条消息</span>
                <span class="history-item__status" :class="item.status === 'active' ? 'active' : ''">
                  {{ item.status === 'active' ? '活跃' : '已结束' }}
                </span>
              </div>
            </el-card>
          </el-timeline-item>
        </el-timeline>
      </div>
      
      <!-- 空状态 -->
      <div class="history-empty" v-else>
        <i class="el-icon-time"></i>
        <p>暂无历史对话记录</p>
        <el-button type="primary" @click="goToChat">
          <i class="el-icon-chat-dot-round"></i> 开始新对话
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete } from '@element-plus/icons-vue'
import userState from '../utils/userStore.js'
import { deleteConversation } from '../api/intelligentSearch.js'

const router = useRouter()

// 删除操作loading状态
const deleteLoading = ref(false)

// 当前用户的 localStorage key（与用户ID绑定）
const getStorageKey = () => {
  const userId = userState.userId || 'guest'
  return `chatHistory_${userId}`
}

// 历史对话列表（来源于 ChatPage 持久化的 chatHistory）
const historyList = ref([])

// 生命周期钩子
onMounted(() => {
  loadHistoryList()
})

// 从本地存储加载真实的历史对话列表
const loadHistoryList = () => {
  const storageKey = getStorageKey()
  const savedHistory = localStorage.getItem(storageKey)
  if (!savedHistory) {
    historyList.value = []
    return
  }

  try {
    const { chatSessions = [], currentSessionId } = JSON.parse(savedHistory)

    historyList.value = chatSessions.map((session) => {
      const messages = session.messages || []
      const firstUserMsg = messages.find(m => m.role === 'user') || messages[0] || null
      const previewContent = firstUserMsg?.content || '暂无消息内容'

      let timeText = ''
      if (session.createdAt) {
        try {
          timeText = new Date(session.createdAt).toLocaleString()
        } catch {
          timeText = session.createdAt
        }
      }

      return {
        id: session.id,
        backendConversationId: session.backendConversationId || null, // 后端会话ID
        title: session.title || (previewContent ? previewContent.slice(0, 20) : '未命名会话'),
        preview: previewContent,
        time: timeText,
        messageCount: messages.length,
        status: session.id === currentSessionId ? 'active' : 'ended'
      }
    })
  } catch (error) {
    console.error('加载历史对话失败:', error)
    historyList.value = []
  }
}

// 加载某个历史对话：通过路由参数把会话 ID 传给 ChatPage
const loadHistory = (item) => {
  if (!item?.id) return
  router.push({
    path: '/chat',
    query: { sessionId: item.id }
  })
}

// 删除历史对话（先删除后端数据，再更新本地存储）
const deleteHistory = async (id) => {
  // 找到要删除的会话，获取backendConversationId
  const itemToDelete = historyList.value.find(item => item.id === id)
  if (!itemToDelete) return

  // 如果有后端会话ID，先调用后端API删除
  if (itemToDelete.backendConversationId) {
    try {
      deleteLoading.value = true
      await deleteConversation(itemToDelete.backendConversationId, userState.userId)
      console.log('[历史删除] 后端会话删除成功:', itemToDelete.backendConversationId)
    } catch (error) {
      console.error('[历史删除] 后端会话删除失败:', error)
      ElMessage.error(`删除对话失败: ${error.message || '请稍后重试'}`)
      deleteLoading.value = false
      return // 后端删除失败，不执行后续操作
    } finally {
      deleteLoading.value = false
    }
  } else {
    console.log('[历史删除] 该会话没有后端ID，仅删除本地数据')
  }

  // 后端删除成功后，更新本地列表和存储
  historyList.value = historyList.value.filter(item => item.id !== id)

  const storageKey = getStorageKey()
  const savedHistory = localStorage.getItem(storageKey)
  if (!savedHistory) return

  try {
    const parsed = JSON.parse(savedHistory)
    const chatSessions = (parsed.chatSessions || []).filter(session => session.id !== id)
    let currentSessionId = parsed.currentSessionId

    if (currentSessionId === id) {
      currentSessionId = chatSessions[0]?.id || ''
    }

    localStorage.setItem(storageKey, JSON.stringify({
      ...parsed,
      chatSessions,
      currentSessionId
    }))
    ElMessage.success('删除成功')
  } catch (error) {
    console.error('删除历史对话时更新本地存储失败:', error)
  }
}

// 清空历史（同步清理本地存储）
const clearHistory = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要清空所有历史对话吗？此操作不可恢复。',
      '清空历史',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    // 先调用后端API删除所有有backendConversationId的会话
    const itemsWithBackendId = historyList.value.filter(item => item.backendConversationId)

    if (itemsWithBackendId.length > 0) {
      deleteLoading.value = true
      const deletePromises = itemsWithBackendId.map(item =>
        deleteConversation(item.backendConversationId, userState.userId).catch(error => {
          console.error('[历史清空] 删除后端会话失败:', item.backendConversationId, error)
          return null // 单个失败不影响其他
        })
      )

      await Promise.all(deletePromises)
      console.log('[历史清空] 已删除', deletePromises.length, '个后端会话')
    }

    // 清空本地列表和存储
    historyList.value = []
    const storageKey = getStorageKey()
    const savedHistory = localStorage.getItem(storageKey)
    if (!savedHistory) return

    try {
      const parsed = JSON.parse(savedHistory)
      localStorage.setItem(storageKey, JSON.stringify({
        ...parsed,
        chatSessions: [],
        currentSessionId: ''
      }))
      ElMessage.success('历史对话已清空')
    } catch (error) {
      console.error('清空历史对话时更新本地存储失败:', error)
    }
  } catch (error) {
    // 用户取消操作
    console.log('[历史清空] 用户取消清空操作')
  } finally {
    deleteLoading.value = false
  }
}

// 跳转到聊天页面
const goToChat = () => {
  router.push('/chat')
}
</script>

<style scoped>
.history-page {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--background-color);
  padding: 20px;
}

.history-card {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background-color: var(--card-background);
  border-color: var(--border-color);
}

.history-card :deep(.el-card__header) {
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color);
  background-color: var(--card-header-background);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
}

.history-card :deep(.el-card__body) {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background-color: var(--background-color);
}

.history-list {
  flex: 1;
  overflow-y: auto;
  padding: 0;
}

.history-item {
  cursor: pointer;
  transition: var(--transition);
  margin-bottom: 12px;
  background-color: var(--card-background);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
}

.history-item:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: var(--primary-color);
}

.history-item :deep(.el-card__body) {
  padding: 16px;
}

.history-item__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.history-item__title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}

.history-item__delete-btn {
  flex-shrink: 0;
  opacity: 0.6;
  transition: all 0.2s ease;
}

.history-item__delete-btn:hover {
  opacity: 1;
  transform: scale(1.1);
}

.history-item__preview {
  margin: 8px 0;
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.history-item__meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 8px;
}

.history-item__status.active {
  color: var(--success-color);
}

.history-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: var(--text-muted);
}

.history-empty i {
  font-size: 56px;
  margin-bottom: 16px;
  color: var(--border-color);
}

.history-empty p {
  margin-bottom: 20px;
  font-size: 14px;
}

/* 时间线样式 */
.history-list :deep(.el-timeline-item__timestamp) {
  color: var(--text-muted);
  font-size: 12px;
}

.history-list :deep(.el-timeline-item__node) {
  background-color: var(--primary-color);
}

.history-list :deep(.el-timeline-item__tail) {
  border-left-color: var(--border-color);
}
</style>
