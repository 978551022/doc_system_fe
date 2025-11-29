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
            :key="index"
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
                @click="loadChatHistory(chat)"
                title="加载对话"
              >
                <i class="el-icon-folder-opened"></i>
              </el-button>
              <el-button 
                type="text" 
                size="small"
                @click="deleteChatHistory(index)"
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
  { id: 'qwen', name: 'Qwen 2', icon: 'el-icon-chat-dot-round' }
])

// 当前选中的模型
const selectedModel = ref('deepseek') // 默认使用DeepSeek模型，不再使用Qwen 2

// 联网搜索开关状态
const isInternetSearchEnabled = ref(false)

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
  ElMessage.info(value ? '已开启联网搜索' : '已关闭联网搜索')
}

// 处理新建对话
const handleNewChat = () => {
  emit('newChat')
  ElMessage.success('已新建对话')
}

// 处理历史记录按钮点击
const handleHistoryClick = () => {
  // 加载聊天历史
  loadChatHistory()
  showHistoryDialog.value = true
}

// 加载聊天历史
const loadChatHistory = () => {
  // 从本地存储加载聊天历史
  const savedHistory = localStorage.getItem('chatHistoryList')
  if (savedHistory) {
    try {
      chatHistory.value = JSON.parse(savedHistory)
    } catch (error) {
      console.error('加载聊天历史失败:', error)
    }
  }
}

// 删除聊天历史
const deleteChatHistory = (index) => {
  chatHistory.value.splice(index, 1)
  // 保存到本地存储
  localStorage.setItem('chatHistoryList', JSON.stringify(chatHistory.value))
  ElMessage.success('已删除聊天记录')
  emit('deleteHistory', index)
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
  
  // 缓存文件到本地，不立即上传
  uploadedFiles.value.push(file.raw)
  ElMessage.success('文件已添加到发送队列!')
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
    files: uploadedFiles.value
  })
  
  // 清空输入
  inputMessage.value = ''
  uploadedFiles.value = []
}
</script>

<style scoped>
.chat-input {
  padding: 20px 0;
  background-color: var(--background-color);
  border-top: 1px solid var(--border-color);
}

.chat-input__container {
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  padding: 0 20px;
}

.chat-input__files {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.chat-input__files :deep(.el-tag) {
  margin-right: 8px;
  margin-bottom: 8px;
  border-radius: 16px;
  background-color: var(--surface-color);
  border: none;
  color: var(--text-primary);
  font-size: 13px;
  padding: 6px 12px;
}

.chat-input__files :deep(.el-tag .el-icon-close) {
  color: var(--text-muted);
  font-size: 12px;
  margin-left: 6px;
}

/* 功能图标栏样式 */
.chat-input__tools {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  padding: 0 4px;
}

.chat-input__tools :deep(.el-button--text) {
  color: var(--text-secondary);
  font-size: 14px;
  padding: 8px 12px;
  border-radius: 16px;
  transition: all 0.3s ease;
  background-color: transparent;
}

.chat-input__tools :deep(.el-button--text:hover) {
  color: var(--primary-color);
  background-color: var(--surface-color);
}

/* 选中按钮样式 */
.chat-input__tools :deep(.el-button--text.is-selected) {
  color: #ffffff;
  background-color: var(--primary-color);
  box-shadow: var(--shadow-sm);
}

.chat-input__tools :deep(.el-button--text.is-selected:hover) {
  color: #ffffff;
  background-color: var(--primary-hover);
  box-shadow: var(--shadow-md);
}

.chat-input__tools :deep(.el-button--text i) {
  margin-right: 6px;
  font-size: 16px;
}

.chat-input__wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
  background-color: var(--card-background);
  border: 1px solid var(--border-color);
  border-radius: 24px;
  padding: 12px;
  transition: all 0.3s ease;
  box-shadow: var(--shadow-sm);
}

.chat-input__wrapper:hover {
  border-color: var(--primary-color);
  box-shadow: var(--shadow-md);
}

.chat-input__textarea {
  flex: 1;
  min-width: 0;
}

.chat-input__textarea :deep(.el-textarea) {
  width: 100%;
}

.chat-input__textarea :deep(.el-textarea__inner) {
  border: none;
  background: transparent;
  min-height: 60px;
  padding: 12px 16px;
  font-size: 15px;
  line-height: 1.6;
  color: var(--text-primary);
  resize: vertical;
  border-radius: 12px;
  box-shadow: none;
  transition: all 0.3s ease;
}

.chat-input__textarea :deep(.el-textarea__inner:focus) {
  box-shadow: none;
  background-color: transparent;
  font-size: 16px;
}

.chat-input__textarea :deep(.el-textarea__inner::placeholder) {
  color: var(--text-muted);
}

/* 按钮样式 */
.chat-input :deep(.el-button--text) {
  color: var(--text-secondary);
  font-size: 14px;
  padding: 8px 12px;
  transition: all 0.3s ease;
  border-radius: 16px;
  background-color: transparent;
}

.chat-input :deep(.el-button--text:hover) {
  color: var(--primary-color);
  background-color: var(--surface-color);
}

.chat-input :deep(.el-button--primary) {
  background-color: var(--primary-color);
  border: none;
  border-radius: 16px;
  padding: 12px 24px;
  transition: all 0.3s ease;
  box-shadow: var(--shadow-sm);
  font-size: 14px;
  font-weight: 500;
  height: auto;
  min-width: 80px;
}

.chat-input :deep(.el-button--primary:hover) {
  background-color: var(--primary-hover);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.chat-input :deep(.el-button--primary:disabled) {
  background-color: var(--border-color);
  color: var(--text-muted);
  box-shadow: none;
  transform: none;
}

/* 统一图标大小 */
.chat-input :deep(.el-button i) {
  font-size: 16px;
  margin-right: 6px;
}

/* 上传按钮样式 */
.chat-input__upload-btn :deep(.el-button--text) {
  padding: 8px 16px;
  border-radius: 16px;
  background-color: var(--surface-color);
  color: var(--primary-color);
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: auto;
  height: auto;
  font-size: 14px;
  font-weight: 500;
}

.chat-input__upload-btn :deep(.el-button--text:hover) {
  background-color: var(--primary-color);
  color: white;
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.chat-input__upload-btn :deep(.el-button i) {
  margin-right: 0;
  font-size: 18px;
  font-weight: bold;
}

.chat-input__tip {
  text-align: center;
  margin-top: 12px;
  font-size: 12px;
  color: var(--text-muted);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .chat-input__container {
    padding: 0 16px;
  }
  
  .chat-input__wrapper {
    padding: 8px;
  }
  
  .chat-input :deep(.el-button--primary) {
    width: 40px;
    height: 40px;
  }
}

/* 模型选择器样式 */
.model-selector-wrapper {
  margin-right: 16px;
}

.model-selector {
  width: 200px;
  font-size: 14px;
}

.model-selector :deep(.el-select__wrapper) {
  border-radius: 20px;
  border: 2px solid #e0e0e0;
  transition: all 0.3s ease;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  height: 44px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.model-selector :deep(.el-select__wrapper:hover) {
  border-color: #667eea;
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.3);
  transform: translateY(-2px);
}

.model-selector :deep(.el-select__wrapper.is-focus) {
  border-color: #667eea;
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.3);
}

.model-selector :deep(.el-input__inner) {
  border: none;
  background: transparent;
  font-size: 14px;
  padding: 0 16px;
  font-weight: 500;
  color: #333;
}

.model-selector :deep(.el-input__suffix-inner) {
  padding-right: 12px;
}

.model-selector :deep(.el-select-dropdown) {
  border-radius: 16px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  overflow: hidden;
  backdrop-filter: blur(10px);
  margin-top: 8px;
  padding: 8px 0;
}

.model-selector :deep(.el-select-dropdown__item) {
  padding: 14px 20px;
  transition: all 0.3s ease;
  border-radius: 12px;
  margin: 4px 8px;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.model-selector :deep(.el-select-dropdown__item:hover) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.model-selector :deep(.el-select-dropdown__item.selected) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

/* 模型选项样式 */
.model-option {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.model-option__icon {
  font-size: 20px;
  color: #667eea;
  transition: all 0.3s ease;
}

.model-option__name {
  font-size: 14px;
  font-weight: 500;
  flex: 1;
}

/* 选中模型选项样式 */
.model-selector :deep(.el-select-dropdown__item.selected) .model-option__icon,
.model-selector :deep(.el-select-dropdown__item:hover) .model-option__icon {
  color: white;
  transform: scale(1.1);
}

.model-selector :deep(.el-select-dropdown__item.selected) .model-option__name,
.model-selector :deep(.el-select-dropdown__item:hover) .model-option__name {
  color: white;
}

/* 深色主题下的模型选择器样式 */
.dark-theme .model-selector :deep(.el-select__wrapper) {
  background: linear-gradient(135deg, var(--card-background) 0%, var(--menu-background) 100%);
  border-color: var(--border-color);
  box-shadow: var(--shadow-sm);
}

.dark-theme .model-selector :deep(.el-input__inner) {
  color: var(--text-primary);
}

.dark-theme .model-selector :deep(.el-select-dropdown) {
  background: linear-gradient(135deg, var(--card-background) 0%, var(--menu-background) 100%);
  border-color: var(--border-color);
}

.dark-theme .model-selector :deep(.el-select-dropdown__item) {
  color: var(--text-primary);
}

.dark-theme .model-selector :deep(.el-select-dropdown__item:hover),
.dark-theme .model-selector :deep(.el-select-dropdown__item.selected) {
  background: var(--primary-gradient);
  color: white;
}

.dark-theme .model-option__icon {
  color: var(--primary-color);
}

/* 联网搜索开关样式 */
.internet-search-switch {
  margin-right: 16px;
  background-color: var(--card-background);
  border-radius: 16px;
  padding: 4px 8px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

/* 优化开关核心样式，确保与周围div颜色一致 */
.internet-search-switch :deep(.el-switch__core) {
  background-color: var(--border-color);
  border-color: var(--border-color);
  transition: all 0.3s ease;
}

.internet-search-switch :deep(.el-switch.is-checked .el-switch__core) {
  background-color: var(--primary-color);
  border-color: var(--primary-color);
  transition: all 0.3s ease;
}

.internet-search-switch :deep(.el-switch__label) {
  color: var(--text-secondary);
  transition: all 0.3s ease;
}

.internet-search-switch :deep(.el-switch.is-checked .el-switch__label) {
  color: var(--text-primary);
  transition: all 0.3s ease;
}

/* 深色主题下的联网搜索开关样式 */
.dark-theme .internet-search-switch {
  background-color: var(--card-background);
  border: 1px solid var(--border-color);
}

.dark-theme .internet-search-switch :deep(.el-switch__core) {
  background-color: var(--border-color);
  border-color: var(--border-color);
}

.dark-theme .internet-search-switch :deep(.el-switch.is-checked .el-switch__core) {
  background-color: var(--primary-color);
  border-color: var(--primary-color);
}

.dark-theme .internet-search-switch :deep(.el-switch__label) {
  color: var(--text-secondary);
}

.dark-theme .internet-search-switch :deep(.el-switch.is-checked .el-switch__label) {
  color: var(--text-primary);
}
</style>
