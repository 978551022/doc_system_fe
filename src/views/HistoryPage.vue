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

// 历史对话列表
const historyList = ref([])

// 模拟数据
const mockHistory = [
  {
    id: 1,
    title: '关于文档管理系统的咨询',
    preview: '我想了解一下这个文档管理系统的主要功能...',
    time: '2024-01-15 14:30',
    messageCount: 8,
    status: 'active'
  },
  {
    id: 2,
    title: 'API测试问题',
    preview: '为什么我的API请求总是返回404错误...',
    time: '2024-01-14 10:15',
    messageCount: 5,
    status: 'ended'
  },
  {
    id: 3,
    title: '智能助手功能介绍',
    preview: '能给我介绍一下智能助手的主要功能吗...',
    time: '2024-01-13 16:45',
    messageCount: 12,
    status: 'ended'
  }
]

// 生命周期钩子
onMounted(() => {
  loadHistoryList()
})

// 加载历史对话列表
const loadHistoryList = () => {
  // 模拟从后端获取数据
  historyList.value = mockHistory
}

// 加载历史对话
const loadHistory = (item) => {
  // 跳转到聊天页面并加载历史对话
  router.push('/chat')
  // 这里可以添加加载历史对话的逻辑
  console.log('加载历史对话:', item)
}

// 删除历史对话
const deleteHistory = (id) => {
  historyList.value = historyList.value.filter(item => item.id !== id)
}

// 清空历史
const clearHistory = () => {
  historyList.value = []
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
}

.history-card {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.history-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px 0;
}

.history-item {
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 16px;
}

.history-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.history-item__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.history-item__title {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
  color: #303133;
}

.history-item__delete-btn {
  color: #909399;
}

.history-item__delete-btn:hover {
  color: #f56c6c;
}

.history-item__preview {
  margin: 8px 0;
  font-size: 14px;
  color: #606266;
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
  color: #909399;
  margin-top: 8px;
}

.history-item__status.active {
  color: #67c23a;
}

.history-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: #909399;
}

.history-empty i {
  font-size: 64px;
  margin-bottom: 16px;
  color: #c0c4cc;
}

.history-empty p {
  margin-bottom: 24px;
  font-size: 16px;
}
</style>
