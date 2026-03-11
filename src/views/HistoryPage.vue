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
                  type="text" 
                  @click.stop="deleteHistory(item.id)"
                  class="history-item__delete-btn"
                  title="删除"
                >
                  <i class="el-icon-delete"></i>
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
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// 历史对话列表（来源于 ChatPage 持久化的 chatHistory）
const historyList = ref([])

// 生命周期钩子
onMounted(() => {
  loadHistoryList()
})

// 从本地存储加载真实的历史对话列表
const loadHistoryList = () => {
  const savedHistory = localStorage.getItem('chatHistory')
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

// 删除历史对话（同步更新本地存储的 chatHistory）
const deleteHistory = (id) => {
  historyList.value = historyList.value.filter(item => item.id !== id)

  const savedHistory = localStorage.getItem('chatHistory')
  if (!savedHistory) return

  try {
    const parsed = JSON.parse(savedHistory)
    const chatSessions = (parsed.chatSessions || []).filter(session => session.id !== id)
    let currentSessionId = parsed.currentSessionId

    if (currentSessionId === id) {
      currentSessionId = chatSessions[0]?.id || ''
    }

    localStorage.setItem('chatHistory', JSON.stringify({
      ...parsed,
      chatSessions,
      currentSessionId
    }))
  } catch (error) {
    console.error('删除历史对话时更新本地存储失败:', error)
  }
}

// 清空历史（同步清理本地存储）
const clearHistory = () => {
  historyList.value = []
  const savedHistory = localStorage.getItem('chatHistory')
  if (!savedHistory) return

  try {
    const parsed = JSON.parse(savedHistory)
    localStorage.setItem('chatHistory', JSON.stringify({
      ...parsed,
      chatSessions: [],
      currentSessionId: ''
    }))
  } catch (error) {
    console.error('清空历史对话失败:', error)
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
  color: var(--text-muted);
}

.history-item__delete-btn:hover {
  color: var(--error-color);
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
