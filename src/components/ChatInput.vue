<template>
  <div class="chat-input">
    <div class="chat-input__container">
      <!-- 已上传文件列表 -->
      <div class="chat-input__files" v-if="uploadedFiles.length > 0">
        <el-tag 
          v-for="(file, index) in uploadedFiles" 
          :key="index"
          closable
          @close="removeFile(index)"
          effect="light"
        >
          <i class="el-icon-document"></i>
          {{ file.name }}
        </el-tag>
      </div>

      <!-- 功能图标栏 -->
      <div class="chat-input__tools">
        <!-- 模型选择下拉列表 -->
        <div class="model-selector-wrapper">
          <el-select
            v-model="selectedModel"
            placeholder="选择模型"
            size="large"
            @change="handleModelChange"
            class="model-selector"
          >
            <el-option
              v-for="model in models"
              :key="model.id"
              :label="model.name"
              :value="model.id"
            />
          </el-select>
        </div>
        
        <!-- 联网搜索开关 -->
        <el-switch
          v-model="isInternetSearchEnabled"
          active-text="联网搜索"
          size="large"
          @change="handleInternetSearchChange"
          class="internet-search-switch"
        ></el-switch>

        <!-- 深度推理开关 -->
        <el-switch
          v-model="isDeepReasoningEnabled"
          active-text="深度推理"
          size="large"
          @change="handleDeepReasoningChange"
          class="deep-reasoning-switch"
        ></el-switch>
        
        <!-- 新建对话按钮 -->
        <el-button 
          type="text" 
          size="large"
          title="新建对话"
          @click="handleNewChat"
          class="new-chat-btn"
        >
          <i class="el-icon-plus"></i>
        </el-button>
        
        <!-- 历史记录按钮 -->
        <el-button 
          type="text" 
          size="large"
          title="历史记录"
          @click="handleHistoryClick"
          class="history-btn"
        >
          <i class="el-icon-time"></i>
        </el-button>
      </div>
      
      <!-- 历史记录弹窗 -->
      <el-dialog
        v-model="showHistoryDialog"
        title="聊天历史"
        width="400px"
      >
        <div class="history-dialog">
          <div 
            v-if="chatHistory.length === 0" 
            class="history-empty"
          >
            <i class="el-icon-document-copy"></i>
            <span>暂无聊天历史</span>
          </div>
          <div 
            v-for="(chat, index) in chatHistory" 
            :key="chat.id || index"
            class="history-item"
          >
            <div class="history-item__content">
              <div class="history-item__title">{{ chat.title || '未命名对话' }}</div>
              <div class="history-item__time">{{ chat.time }}</div>
            </div>
            <div class="history-item__actions">
              <el-button 
                type="text" 
                size="small"
                @click="handleLoadHistoryItem(chat)"
                title="加载对话"
              >
                <i class="el-icon-folder-opened"></i>
              </el-button>
              <el-button 
                type="text" 
                size="small"
                @click="deleteChatHistory(chat)"
                title="删除对话"
              >
                <i class="el-icon-delete"></i>
              </el-button>
            </div>
          </div>
        </div>
        <template #footer>
          <div class="dialog-footer">
            <el-button @click="showHistoryDialog = false">关闭</el-button>
          </div>
        </template>
      </el-dialog>

      <div class="chat-input__wrapper">
        <!-- 上传文档按钮 -->
        <el-upload
          ref="uploadRef"
          :action="''"
          :multiple="true"
          :auto-upload="false"
          :on-change="handleFileChange"
          :show-file-list="false"
          :disabled="isUploading"
        >
          <el-button 
            type="text" 
            size="large"
            :disabled="isUploading"
            title="上传文档"
            class="chat-input__upload-btn"
          >
            <i class="el-icon-upload2"></i>
            上传文件
          </el-button>
        </el-upload>

        <!-- 输入框 -->
        <el-input
          v-model="inputMessage"
          type="textarea"
          :rows="3"
          :maxlength="2000"
          placeholder="在这里输入你的问题..."
          @keyup.enter="sendMessage"
          resize="vertical"
          class="chat-input__textarea"
        ></el-input>

        <!-- 发送按钮 -->
        <el-button 
          type="primary" 
          @click="sendMessage" 
          :disabled="!inputMessage.trim() && uploadedFiles.length === 0"
          size="large"
          title="发送"
        >
          <i class="el-icon-s-promotion"></i>
          发送
        </el-button>
      </div>

      <!-- 提示信息 -->
      <div class="chat-input__tip">
        <span>按 Enter 发送消息</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, defineEmits, watch } from 'vue'
import { CircleCheck } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

// 定义事件
const emit = defineEmits(['sendMessage', 'uploadFile', 'modelChange', 'newChat', 'loadHistory', 'deleteHistory'])

// 接收当前选中的模型作为props
const props = defineProps({
  currentModel: {
    type: String,
    default: 'deepseek'
  }
})

// 监听props变化，更新本地选中的模型
watch(
  () => props.currentModel,
  (newModel) => {
    selectedModel.value = newModel
  }
)

// 输入消息
const inputMessage = ref('')

// 上传引用
const uploadRef = ref(null)

// 已上传文件列表
const uploadedFiles = ref([])

// 上传状态
const isUploading = ref(false)

// 当前选中的工具
const selectedTool = ref(null)

// 模型列表 - 支持多种模型
const models = ref([
  { id: 'deepseek', name: 'DeepSeek', icon: 'el-icon-chat-dot-round' },
  { id: 'glm', name: 'GLM-4.5-Flash', icon: 'el-icon-chat-dot-round' },
  { id: 'qwen', name: 'Qwen 2', icon: 'el-icon-chat-dot-round' },
  { id: 'llama3', name: 'Llama 3', icon: 'el-icon-chat-dot-round' }
])

// 当前选中的模型
const selectedModel = ref('deepseek') // 默认使用DeepSeek模型，不再使用Qwen 2

// 联网搜索开关状态（从本地配置初始化，跨页面保持）
const loadInternetSearchInitial = () => {
  try {
    const raw = localStorage.getItem('chatConfig')
    if (!raw) return false
    const parsed = JSON.parse(raw)
    return !!parsed.isInternetSearchEnabled
  } catch (error) {
    console.error('加载联网搜索配置失败:', error)
    return false
  }
}

const isInternetSearchEnabled = ref(loadInternetSearchInitial())

// 深度推理开关状态
const loadDeepReasoningInitial = () => {
  try {
    const raw = localStorage.getItem('chatConfig')
    if (!raw) return false
    const parsed = JSON.parse(raw)
    return !!parsed.isDeepReasoningEnabled
  } catch (error) {
    console.error('加载深度推理配置失败:', error)
    return false
  }
}

const isDeepReasoningEnabled = ref(loadDeepReasoningInitial())

// 历史记录弹窗显示状态
const showHistoryDialog = ref(false)

// 聊天历史记录
const chatHistory = ref([])

// 处理模型选择（下拉列表）
const handleModelChange = (modelId) => {
  const modelName = models.value.find(m => m.id === modelId)?.name
  // 发送模型切换事件给父组件
  emit('modelChange', modelId)
}

// 处理联网搜索开关变化
const handleInternetSearchChange = (value) => {
  // 持久化到本地配置，保证切换功能栏后仍然保持当前状态
  try {
    const raw = localStorage.getItem('chatConfig')
    const parsed = raw ? JSON.parse(raw) : {}
    parsed.isInternetSearchEnabled = !!value
    localStorage.setItem('chatConfig', JSON.stringify(parsed))
  } catch (error) {
    console.error('保存联网搜索配置失败:', error)
  }

  ElMessage.info(value ? '已开启联网搜索' : '已关闭联网搜索')
}

// 深度推理开关变化
const handleDeepReasoningChange = (value) => {
  try {
    const raw = localStorage.getItem('chatConfig')
    const parsed = raw ? JSON.parse(raw) : {}
    parsed.isDeepReasoningEnabled = !!value
    localStorage.setItem('chatConfig', JSON.stringify(parsed))
  } catch (error) {
    console.error('保存深度推理配置失败:', error)
  }

  ElMessage.info(value ? '已开启深度推理' : '已关闭深度推理')
}

// 监听深度推理状态变化，保持与 localStorage 同步
watch(
  () => isDeepReasoningEnabled.value,
  (val) => {
    try {
      const raw = localStorage.getItem('chatConfig')
      const parsed = raw ? JSON.parse(raw) : {}
      parsed.isDeepReasoningEnabled = !!val
      localStorage.setItem('chatConfig', JSON.stringify(parsed))
    } catch (error) {
      console.error('同步深度推理配置失败:', error)
    }
  }
)

// 当本地状态变化时，同步到 localStorage（防止其他地方修改覆盖）
watch(
  () => isInternetSearchEnabled.value,
  (val) => {
    try {
      const raw = localStorage.getItem('chatConfig')
      const parsed = raw ? JSON.parse(raw) : {}
      parsed.isInternetSearchEnabled = !!val
      localStorage.setItem('chatConfig', JSON.stringify(parsed))
    } catch (error) {
      console.error('同步联网搜索配置失败:', error)
    }
  }
)

// 处理新建对话
const handleNewChat = () => {
  emit('newChat')
  ElMessage.success('已新建对话')
}

// 处理历史记录按钮点击
const handleHistoryClick = () => {
  // 加载聊天历史
  loadHistoryList()
  showHistoryDialog.value = true
}

// 加载聊天历史（统一使用 ChatPage 持久化的 chatHistory）
const loadHistoryList = () => {
  const savedHistory = localStorage.getItem('chatHistory')
  if (!savedHistory) {
    chatHistory.value = []
    return
  }

  try {
    const { chatSessions = [] } = JSON.parse(savedHistory)
    chatHistory.value = chatSessions.map((session) => {
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
        title: session.title || '未命名会话',
        time: timeText
      }
    })
  } catch (error) {
    console.error('加载聊天历史失败:', error)
    chatHistory.value = []
  }
}

// 点击加载某个历史对话
const handleLoadHistoryItem = (chat) => {
  if (!chat?.id) return
  emit('loadHistory', chat.id)
  showHistoryDialog.value = false
}

// 删除聊天历史（委托给上层 ChatPage 处理真实会话删除）
const deleteChatHistory = (chat) => {
  if (!chat?.id) return
  emit('deleteHistory', chat.id)
  // 同步移除当前弹窗列表中的项
  chatHistory.value = chatHistory.value.filter(item => item.id !== chat.id)
  ElMessage.success('已删除聊天记录')
}

// 处理文件选择（缓存文件，不立即上传）
const handleFileChange = (file, fileList) => {
  // 验证文件类型和大小
  const allowedTypes = ['doc', 'docx', 'pdf', 'txt']
  const fileType = file.name.split('.').pop().toLowerCase()
  const isTypeAllowed = allowedTypes.includes(fileType)
  const isLt500M = file.size / 1024 / 1024 < 500

  if (!isTypeAllowed) {
    ElMessage.error('只允许上传 doc, docx, pdf, txt 类型的文件!')
    return
  }
  if (!isLt500M) {
    ElMessage.error('上传文件大小不能超过 500MB!')
    return
  }
  
  // 缓存文件到本地，不立即上传（不显示提示，避免重复）
  uploadedFiles.value.push(file.raw)
}

// 移除文件
const removeFile = (index) => {
  uploadedFiles.value.splice(index, 1)
}

// 发送消息
const sendMessage = () => {
  // 允许只有文件上传而没有文本内容
  if (!inputMessage.value.trim() && uploadedFiles.value.length === 0) return

  emit('sendMessage', {
    content: inputMessage.value.trim(),
    files: uploadedFiles.value,
    onlineSearch: isInternetSearchEnabled.value,  // 联网搜索参数
    deepReasoning: isDeepReasoningEnabled.value   // 深度推理参数
  })

  // 清空输入
  inputMessage.value = ''
  uploadedFiles.value = []
}
</script>

<style scoped>
.chat-input {
  padding: 16px 0 20px;
  background-color: var(--background-color);
  border-top: 1px solid var(--border-color);
}

.chat-input__container {
  max-width: 900px;
  margin: 0 auto;
  width: 100%;
  padding: 0 20px;
}

.chat-input__files {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}

.chat-input__files :deep(.el-tag) {
  margin-right: 6px;
  margin-bottom: 6px;
  border-radius: var(--radius-md);
  background-color: var(--surface-color);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  font-size: 12px;
  padding: 4px 10px;
}

/* 功能图标栏样式 */
.chat-input__tools {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  padding: 0;
}

.chat-input__tools :deep(.el-button--text) {
  color: var(--text-secondary);
  font-size: 13px;
  padding: 6px 10px;
  border-radius: var(--radius-sm);
  transition: var(--transition);
  background-color: transparent;
}

.chat-input__tools :deep(.el-button--text:hover) {
  color: var(--primary-color);
  background-color: var(--surface-color);
}

.chat-input__wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
  background-color: var(--card-background);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 10px 14px;
  transition: var(--transition);
}

.chat-input__wrapper:hover,
.chat-input__wrapper:focus-within {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.chat-input__textarea {
  flex: 1;
  min-width: 0;
}

.chat-input__textarea :deep(.el-textarea__inner) {
  border: none;
  background: transparent;
  min-height: 48px;
  padding: 8px 12px;
  font-size: 14px;
  line-height: 1.5;
  color: var(--text-primary);
  resize: none;
  border-radius: var(--radius-md);
  box-shadow: none;
}

.chat-input__textarea :deep(.el-textarea__inner:focus) {
  box-shadow: none;
}

.chat-input__textarea :deep(.el-textarea__inner::placeholder) {
  color: var(--text-muted);
}

/* 发送按钮 */
.chat-input :deep(.el-button--primary) {
  background: var(--primary-gradient);
  border: none;
  border-radius: var(--radius-md);
  padding: 10px 20px;
  transition: var(--transition);
  font-size: 13px;
  font-weight: 500;
  height: auto;
  min-width: 70px;
}

.chat-input :deep(.el-button--primary:hover) {
  opacity: 0.9;
  transform: translateY(-1px);
}

.chat-input :deep(.el-button--primary:disabled) {
  background: var(--surface-color);
  color: var(--text-muted);
}

/* 上传按钮 */
.chat-input__upload-btn {
  color: var(--text-secondary) !important;
  font-size: 13px !important;
  padding: 6px 12px !important;
  border-radius: var(--radius-sm) !important;
  transition: var(--transition) !important;
  background-color: transparent !important;
}

.chat-input__upload-btn:hover {
  color: var(--primary-color) !important;
  background-color: var(--surface-color) !important;
}

.chat-input__tip {
  text-align: center;
  margin-top: 8px;
  font-size: 11px;
  color: var(--text-muted);
}

/* 模型选择器 */
.model-selector-wrapper {
  margin-right: 12px;
}

.model-selector {
  width: 160px;
  font-size: 13px;
}

.model-selector :deep(.el-select__wrapper) {
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
  transition: var(--transition);
  background: var(--card-background);
  height: 36px;
}

.model-selector :deep(.el-select__wrapper:hover) {
  border-color: var(--primary-color);
}

.model-selector :deep(.el-input__inner) {
  border: none;
  background: transparent;
  font-size: 13px;
  padding: 0 12px;
  font-weight: 500;
  color: var(--text-primary);
}

.model-selector :deep(.el-select-dropdown) {
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-lg);
  background: var(--card-background);
  padding: 4px 0;
}

.model-selector :deep(.el-select-dropdown__item) {
  padding: 10px 14px;
  transition: var(--transition);
  border-radius: var(--radius-sm);
  margin: 2px 6px;
  font-size: 13px;
  color: var(--text-primary);
}

.model-selector :deep(.el-select-dropdown__item:hover),
.model-selector :deep(.el-select-dropdown__item.selected) {
  background: var(--primary-gradient);
  color: white;
}

/* 联网搜索开关 */
.internet-search-switch {
  margin-right: 12px;
  background-color: var(--surface-color);
  border-radius: var(--radius-md);
  padding: 4px 10px;
  display: inline-flex;
  align-items: center;
  font-size: 12px;
}

.internet-search-switch :deep(.el-switch__core) {
  background-color: var(--border-color);
  border-color: var(--border-color);
  transition: var(--transition);
}

.internet-search-switch :deep(.el-switch.is-checked .el-switch__core) {
  background-color: var(--primary-color);
  border-color: var(--primary-color);
}

.internet-search-switch :deep(.el-switch__label) {
  color: var(--text-secondary);
  font-size: 12px;
}

/* 深度推理开关，与联网搜索风格保持一致但使用不同间距，便于区分 */
.deep-reasoning-switch {
  margin-right: 12px;
  background-color: var(--surface-color);
  border-radius: var(--radius-md);
  padding: 4px 10px;
  display: inline-flex;
  align-items: center;
  font-size: 12px;
}

.deep-reasoning-switch :deep(.el-switch__core) {
  background-color: var(--border-color);
  border-color: var(--border-color);
  transition: var(--transition);
}

.deep-reasoning-switch :deep(.el-switch.is-checked .el-switch__core) {
  background-color: var(--primary-color);
  border-color: var(--primary-color);
}

.deep-reasoning-switch :deep(.el-switch__label) {
  color: var(--text-secondary);
  font-size: 12px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .chat-input__container {
    padding: 0 12px;
  }
  
  .chat-input__wrapper {
    padding: 8px 10px;
  }
  
  .model-selector {
    width: 120px;
  }
}
</style>
