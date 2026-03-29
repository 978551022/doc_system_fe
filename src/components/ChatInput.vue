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
        <!-- 语音录制按钮 -->
        <VoiceRecorder
          ref="voiceRecorderRef"
          @voice-message-ready="handleVoiceMessageReady"
          @voice-chunk="handleVoiceChunk"
          @voice-complete="handleVoiceComplete"
          @voice-upload-complete="handleVoiceUploadComplete"
          @voice-metadata-update="handleVoiceMetadataUpdate"
          @voice-aborted="handleVoiceAborted"
          @recording-state-changed="handleRecordingStateChanged"
          @audio-data-available="handleAudioDataAvailable"
          @initialize-conversation="handleInitializeConversation"
          @conversation-id-update="handleConversationIdUpdate"
          :conversation-id="props.conversationId"
          :model-name="props.modelName"
          :online-search="props.onlineSearch"
          :deep-reasoning="props.deepReasoning"
          :is-generating="props.isGenerating"
          :abort-signal="voiceAbortSignal"
        />

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
          placeholder="在这里输入你的问题... (Shift+Enter 换行，Enter 发送)"
          @keydown.enter="handleEnterKey"
          resize="vertical"
          class="chat-input__textarea"
        ></el-input>

        <!-- 发送按钮 / 暂停按钮 -->
        <el-button
          v-if="!isGenerating"
          type="primary"
          @click="sendMessage"
          :disabled="!inputMessage.trim() && uploadedFiles.length === 0"
          size="large"
          class="send-btn"
          title="发送"
        >
          <i class="el-icon-s-promotion"></i>
          发送
        </el-button>
        <el-button
          v-else
          type="warning"
          @click="handlePause"
          size="large"
          class="pause-btn"
          title="暂停生成"
        >
          <svg class="pause-icon" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="5" width="4" height="14" rx="1"/>
            <rect x="14" y="5" width="4" height="14" rx="1"/>
          </svg>
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
import { ref, defineEmits, watch, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import VoiceRecorder from './VoiceRecorder.vue'
import { chatConfig, migrateOldConfig, initChatConfig } from '../utils/chatConfig.js'

// 定义事件
const emit = defineEmits(['sendMessage', 'uploadFile', 'modelChange', 'newChat', 'loadHistory', 'deleteHistory', 'pauseGeneration', 'voiceMessageReady', 'voiceChunk', 'voiceComplete', 'voiceUploadComplete', 'recordingStateChanged', 'audioDataAvailable', 'initializeConversation', 'conversationIdUpdate', 'voiceAborted'])

// 接收当前选中的模型作为props
const props = defineProps({
  currentModel: {
    type: String,
    default: 'deepseek'
  },
  // 是否正在生成
  isGenerating: {
    type: Boolean,
    default: false
  },
  // 当前会话ID（用于语音上传）
  conversationId: {
    type: String,
    default: ''
  },
  // 语音配置参数
  modelName: {
    type: String,
    default: 'glm'
  },
  onlineSearch: {
    type: Boolean,
    default: false
  },
  deepReasoning: {
    type: Boolean,
    default: false
  }
})

// 监听props变化，更新本地选中的模型
watch(
  () => props.currentModel,
  (newModel) => {
    selectedModel.value = newModel
  }
)

// 初始化配置（迁移旧数据）
onMounted(() => {
  initChatConfig()
})

// 监听配置变化（来自其他组件的修改）
let unsubscribeConfigChange = null

onMounted(() => {
  unsubscribeConfigChange = chatConfig.onChange((config) => {
    // 同步配置到本地状态
    if (config.onlineSearch !== undefined) {
      isInternetSearchEnabled.value = config.onlineSearch
    }
    if (config.deepReasoning !== undefined) {
      isDeepReasoningEnabled.value = config.deepReasoning
    }
    if (config.selectedModel !== undefined) {
      selectedModel.value = config.selectedModel
    }
  })
})

onUnmounted(() => {
  if (unsubscribeConfigChange) {
    unsubscribeConfigChange()
  }
})

// 输入消息
const inputMessage = ref('')

// 语音录制器引用
const voiceRecorderRef = ref(null)

// 语音上传的 AbortController
const voiceAbortSignal = ref(null)

// 已上传文件列表
const uploadedFiles = ref([])

// 上传状态
const isUploading = ref(false)

// 模型列表 - 支持多种模型
const models = ref([
  { id: 'deepseek', name: 'DeepSeek', icon: 'el-icon-chat-dot-round' },
  { id: 'glm', name: 'GLM-4.5-Flash', icon: 'el-icon-chat-dot-round' },
  { id: 'qwen2', name: 'Qwen2', icon: 'el-icon-chat-dot-round' },
  { id: 'qwen3', name: 'Qwen3', icon: 'el-icon-chat-dot-round' },
  { id: 'doubao', name: 'Doubao', icon: 'el-icon-chat-dot-round' },
  { id: 'llama3', name: 'Llama 3', icon: 'el-icon-chat-dot-round' }
])

// 当前选中的模型（使用统一配置）
const selectedModel = ref(chatConfig.get('selectedModel'))

// 联网搜索开关状态（使用统一配置）
const isInternetSearchEnabled = ref(chatConfig.get('onlineSearch'))

// 深度推理开关状态（使用统一配置）
const isDeepReasoningEnabled = ref(chatConfig.get('deepReasoning'))

// 历史记录弹窗显示状态
const showHistoryDialog = ref(false)

// 聊天历史记录
const chatHistory = ref([])

// 处理模型选择（下拉列表）
const handleModelChange = (modelId) => {
  const modelName = models.value.find(m => m.id === modelId)?.name
  // 使用统一配置管理保存
  chatConfig.set('selectedModel', modelId)
  // 发送模型切换事件给父组件
  emit('modelChange', modelId)
}

// 处理联网搜索开关变化
const handleInternetSearchChange = (value) => {
  chatConfig.set('onlineSearch', value)
}

// 深度推理开关变化
const handleDeepReasoningChange = (value) => {
  chatConfig.set('deepReasoning', value)
}

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

// 处理 Enter 键（Shift+Enter 换行，Enter 发送）
const handleEnterKey = (event) => {
  // 如果按下了 Shift 键，允许默认换行行为
  if (event.shiftKey) {
    return // 不阻止默认行为，允许换行
  }
  // 否则阻止默认换行并发送消息
  event.preventDefault()
  sendMessage()
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

// 暂停生成
const handlePause = () => {
  emit('pauseGeneration')
}

// 处理语音消息就绪
const handleVoiceMessageReady = (data) => {
  // 创建新的 AbortController 用于语音上传中断
  voiceAbortSignal.value = new AbortController()
  emit('voiceMessageReady', data)
}

// 处理语音流式内容
const handleVoiceChunk = (data) => {
  emit('voiceChunk', data)
}

// 处理语音上传完成
const handleVoiceComplete = (data) => {
  emit('voiceComplete', data)
}

// 处理语音元数据更新（如uploadId）
const handleVoiceMetadataUpdate = (data) => {
  emit('voiceMetadataUpdate', data)
}

// 处理语音上传全部完成
const handleVoiceUploadComplete = (data) => {
  // 清除 AbortController
  voiceAbortSignal.value = null
  emit('voiceUploadComplete', data)
}

// 处理录音状态变化
const handleRecordingStateChanged = (isRecording) => {
  emit('recordingStateChanged', isRecording)
}

// 处理音频数据（用于波形显示）
const handleAudioDataAvailable = (audioData) => {
  emit('audioDataAvailable', audioData)
}

// 处理初始化会话请求
const handleInitializeConversation = () => {
  emit('initializeConversation')
}

// 处理会话ID更新（语音上传后后端返回新的会话ID）
const handleConversationIdUpdate = (conversationId) => {
  emit('conversationIdUpdate', conversationId)
}

// 处理语音上传被中止
const handleVoiceAborted = () => {
  emit('voiceAborted')
}

// 中断语音上传
const abortVoiceUpload = () => {
  if (voiceRecorderRef.value && typeof voiceRecorderRef.value.abortUpload === 'function') {
    voiceRecorderRef.value.abortUpload()
  }
  if (voiceAbortSignal.value) {
    voiceAbortSignal.value.abort()
    voiceAbortSignal.value = null
  }
}

// 暴露方法给父组件
defineExpose({
  abortVoiceUpload
})
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

/* ========== 功能图标栏 ========== */
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

/* ========== 输入框包装器 ========== */
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
  min-height: var(--input-min-height);
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

/* ========== 发送按钮 ========== */
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

/* ========== 暂停按钮 ========== */
.pause-btn {
  background: var(--error-color) !important;
  border: none !important;
  border-radius: 50% !important;
  width: var(--button-size-lg) !important;
  height: var(--button-size-lg) !important;
  min-width: var(--button-size-lg) !important;
  padding: 0 !important;
  transition: var(--transition) !important;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
}

.pause-btn:hover {
  background: #dc2626 !important;
  transform: scale(1.05);
  box-shadow: 0 6px 16px rgba(239, 68, 68, 0.5);
}

.pause-btn:active {
  transform: scale(0.95);
}

.pause-icon {
  width: 18px;
  height: 18px;
  fill: white;
}

/* 深色模式下的暂停按钮 */
.dark-theme .pause-btn {
  background: #f87171 !important;
  box-shadow: 0 4px 12px rgba(248, 113, 113, 0.35);
}

.dark-theme .pause-btn:hover {
  background: var(--error-color) !important;
  box-shadow: 0 6px 16px rgba(239, 68, 68, 0.45);
}

.send-btn {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* ========== 上传按钮 ========== */
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

/* ========== 模型选择器 ========== */
.model-selector-wrapper {
  margin-right: 12px;
}

.model-selector {
  width: var(--selector-width-md);
  font-size: 13px;
}

.model-selector :deep(.el-select__wrapper) {
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
  transition: var(--transition);
  background: var(--card-background);
  height: var(--input-height-md);
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

/* ========== 功能开关通用样式（使用 CSS 变量） ========== */
.internet-search-switch,
.deep-reasoning-switch {
  margin-right: 12px;
  background: transparent !important;
  position: relative;
}

/* 开关激活状态下的发光效果 */
.internet-search-switch :deep(.el-switch.is-checked),
.deep-reasoning-switch :deep(.el-switch.is-checked) {
  position: relative;
}

.internet-search-switch :deep(.el-switch.is-checked)::before,
.deep-reasoning-switch :deep(.el-switch.is-checked)::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%);
  border-radius: 50%;
  pointer-events: none;
  animation: switch-pulse 2s ease-in-out infinite;
}

@keyframes switch-pulse {
  0%, 100% {
    opacity: 0.5;
    transform: translate(-50%, -50%) scale(1);
  }
  50% {
    opacity: 0.8;
    transform: translate(-50%, -50%) scale(1.1);
  }
}

/* 开关容器 */
.internet-search-switch :deep(.el-switch),
.deep-reasoning-switch :deep(.el-switch) {
  background: transparent !important;
  position: relative;
  z-index: 1;
}

/* 开关标签文本 */
.internet-search-switch :deep(.el-switch__label),
.deep-reasoning-switch :deep(.el-switch__label) {
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 500;
  transition: var(--transition);
  background: transparent !important;
  position: relative;
  z-index: 1;
}

/* 开关激活时的文字颜色 - 使用 CSS 变量 */
.internet-search-switch :deep(.el-switch__label.is-active),
.deep-reasoning-switch :deep(.el-switch__label.is-active) {
  color: var(--switch-active-text);
  font-weight: 600;
  background: transparent !important;
  text-shadow: 0 0 20px rgba(139, 92, 246, 0.5);
}

/* 开关主体 - 使用 CSS 变量 */
.internet-search-switch :deep(.el-switch__core),
.deep-reasoning-switch :deep(.el-switch__core) {
  width: var(--switch-width);
  height: var(--switch-height);
  border-radius: var(--radius-full);
  background-color: var(--border-color);
  border: 1px solid var(--border-color);
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05);
  transition: var(--transition);
  position: relative;
}

/* 开关滑块 - 使用 CSS 变量 */
.internet-search-switch :deep(.el-switch__core:after),
.deep-reasoning-switch :deep(.el-switch__core:after) {
  width: var(--switch-thumb-size);
  height: var(--switch-thumb-size);
  top: 1px;
  left: 1px;
  border-radius: 50%;
  background-color: var(--card-background);
  border: 1px solid var(--border-color);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: var(--transition);
}

/* 开关选中状态 - 使用 CSS 变量 */
.internet-search-switch :deep(.el-switch.is-checked),
.deep-reasoning-switch :deep(.el-switch.is-checked) {
  background-color: transparent !important;
}

.internet-search-switch :deep(.el-switch.is-checked .el-switch__core),
.deep-reasoning-switch :deep(.el-switch.is-checked .el-switch__core) {
  background: linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%);
  border-color: #7C3AED;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.2), 0 0 15px rgba(139, 92, 246, 0.4);
  animation: switch-on 0.3s ease-out;
}

@keyframes switch-on {
  0% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(139, 92, 246, 0);
  }
  50% {
    transform: scale(1.02);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.2), 0 0 15px rgba(139, 92, 246, 0.4);
  }
}

.internet-search-switch :deep(.el-switch.is-checked .el-switch__core:after),
.deep-reasoning-switch :deep(.el-switch.is-checked .el-switch__core:after) {
  left: calc(100% - var(--switch-thumb-size) - 1px);
  background-color: white;
  border-color: transparent;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

/* 开关 hover 效果 - 使用 CSS 变量 */
.internet-search-switch:hover :deep(.el-switch__core),
.deep-reasoning-switch:hover :deep(.el-switch__core) {
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05), 0 0 0 3px rgba(139, 92, 246, 0.1);
  border-color: rgba(139, 92, 246, 0.3);
}

.internet-search-switch:hover :deep(.el-switch.is-checked .el-switch__core),
.deep-reasoning-switch:hover :deep(.el-switch.is-checked .el-switch__core) {
  background: linear-gradient(135deg, #9771FA 0%, #7B6EF6 100%);
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05), 0 0 0 3px rgba(139, 92, 246, 0.25), 0 0 20px rgba(139, 92, 246, 0.5);
  border-color: #8B5CF6;
}

/* 深色模式下的样式增强 */
.dark-theme .internet-search-switch :deep(.el-switch.is-checked .el-switch__core),
.dark-theme .deep-reasoning-switch :deep(.el-switch.is-checked .el-switch__core) {
  background: linear-gradient(135deg, #A78BFA 0%, #8B5CF6 100%);
  border-color: #9771FA;
  box-shadow: 0 0 0 3px rgba(167, 139, 250, 0.25), 0 0 20px rgba(167, 139, 250, 0.5);
}

.dark-theme .internet-search-switch:hover :deep(.el-switch.is-checked .el-switch__core),
.dark-theme .deep-reasoning-switch:hover :deep(.el-switch.is-checked .el-switch__core) {
  background: linear-gradient(135deg, #B794F6 0%, #9771FA 100%);
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1), 0 0 0 3px rgba(167, 139, 250, 0.3), 0 0 25px rgba(167, 139, 250, 0.6);
  border-color: #A78BFA;
}

.dark-theme .internet-search-switch:hover :deep(.el-switch__core),
.dark-theme .deep-reasoning-switch:hover :deep(.el-switch__core) {
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1), 0 0 0 3px rgba(167, 139, 250, 0.15);
  border-color: rgba(167, 139, 250, 0.4);
}

.dark-theme .internet-search-switch :deep(.el-switch.is-checked)::before,
.dark-theme .deep-reasoning-switch :deep(.el-switch.is-checked)::before {
  background: radial-gradient(circle, rgba(167, 139, 250, 0.2) 0%, transparent 70%);
}

/* ========== 响应式设计 ========== */
@media (max-width: 768px) {
  .chat-input__container {
    padding: 0 12px;
  }

  .chat-input__wrapper {
    padding: 8px 10px;
  }

  .model-selector {
    width: var(--selector-width-sm);
  }
}
</style>

<!-- 非scoped样式：开关按钮视觉增强 -->
<style>
/* ========== 联网搜索/深度推理开关 - 强视觉反馈 ========== */

/* 激活状态 - 渐变背景 + 发光效果 */
.chat-input .internet-search-switch.el-switch.is-checked .el-switch__core,
.chat-input .deep-reasoning-switch.el-switch.is-checked .el-switch__core {
  background: linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%) !important;
  border: 2px solid #7C3AED !important;
  box-shadow:
    0 0 0 4px rgba(139, 92, 246, 0.2),
    0 0 20px rgba(139, 92, 246, 0.5),
    inset 0 1px 2px rgba(255, 255, 255, 0.2) !important;
  animation: switch-glow 2s ease-in-out infinite !important;
}

@keyframes switch-glow {
  0%, 100% {
    box-shadow:
      0 0 0 4px rgba(139, 92, 246, 0.2),
      0 0 20px rgba(139, 92, 246, 0.5),
      inset 0 1px 2px rgba(255, 255, 255, 0.2);
  }
  50% {
    box-shadow:
      0 0 0 4px rgba(139, 92, 246, 0.3),
      0 0 30px rgba(139, 92, 246, 0.7),
      inset 0 1px 2px rgba(255, 255, 255, 0.3);
  }
}

/* 激活状态 - 滑块变白色 */
.chat-input .internet-search-switch.el-switch.is-checked .el-switch__core:after,
.chat-input .deep-reasoning-switch.el-switch.is-checked .el-switch__core:after {
  background: #ffffff !important;
  border: 2px solid #ffffff !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2) !important;
}

/* 激活状态 - 文字发光 */
.chat-input .internet-search-switch.el-switch.is-checked .el-switch__label.is-active,
.chat-input .deep-reasoning-switch.el-switch.is-checked .el-switch__label.is-active {
  color: #8B5CF6 !important;
  text-shadow: 0 0 10px rgba(139, 92, 246, 0.6) !important;
}

/* 关闭状态 - 灰色边框明显 */
.chat-input .internet-search-switch .el-switch__core,
.chat-input .deep-reasoning-switch .el-switch__core {
  background: #e5e7eb !important;
  border: 2px solid #d1d5db !important;
}

.chat-input .dark-theme .internet-search-switch .el-switch__core,
.chat-input .dark-theme .deep-reasoning-switch .el-switch__core {
  background: #374151 !important;
  border: 2px solid #4b5563 !important;
}

/* 深色模式 - 激活状态 */
.chat-input .dark-theme .internet-search-switch.el-switch.is-checked .el-switch__core,
.chat-input .dark-theme .deep-reasoning-switch.el-switch.is-checked .el-switch__core {
  background: linear-gradient(135deg, #A78BFA 0%, #8B5CF6 100%) !important;
  border: 2px solid #9771FA !important;
  box-shadow:
    0 0 0 4px rgba(167, 139, 250, 0.25),
    0 0 25px rgba(167, 139, 250, 0.6),
    inset 0 1px 2px rgba(255, 255, 255, 0.15) !important;
}

@keyframes switch-glow-dark {
  0%, 100% {
    box-shadow:
      0 0 0 4px rgba(167, 139, 250, 0.25),
      0 0 25px rgba(167, 139, 250, 0.6),
      inset 0 1px 2px rgba(255, 255, 255, 0.15);
  }
  50% {
    box-shadow:
      0 0 0 4px rgba(167, 139, 250, 0.35),
      0 0 35px rgba(167, 139, 250, 0.8),
      inset 0 1px 2px rgba(255, 255, 255, 0.25);
  }
}

.chat-input .dark-theme .internet-search-switch.el-switch.is-checked .el-switch__core,
.chat-input .dark-theme .deep-reasoning-switch.el-switch.is-checked .el-switch__core {
  animation: switch-glow-dark 2s ease-in-out infinite !important;
}

/* Hover 效果增强 */
.chat-input .internet-search-switch:hover .el-switch__core,
.chat-input .deep-reasoning-switch:hover .el-switch__core {
  border-color: #8B5CF6 !important;
}

.chat-input .internet-search-switch:hover.el-switch.is-checked .el-switch__core,
.chat-input .deep-reasoning-switch:hover.el-switch.is-checked .el-switch__core {
  background: linear-gradient(135deg, #9771FA 0%, #7B6EF6 100%) !important;
  box-shadow:
    0 0 0 4px rgba(139, 92, 246, 0.3),
    0 0 25px rgba(139, 92, 246, 0.6),
    inset 0 1px 2px rgba(255, 255, 255, 0.25) !important;
}

.chat-input .dark-theme .internet-search-switch:hover.el-switch.is-checked .el-switch__core,
.chat-input .dark-theme .deep-reasoning-switch:hover.el-switch.is-checked .el-switch__core {
  background: linear-gradient(135deg, #B794F6 0%, #9771FA 100%) !important;
  box-shadow:
    0 0 0 4px rgba(167, 139, 250, 0.35),
    0 0 30px rgba(167, 139, 250, 0.7),
    inset 0 1px 2px rgba(255, 255, 255, 0.2) !important;
}
</style>
