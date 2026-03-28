<template>
  <div class="chat-page" ref="chatComponent">
    <!-- 聊天消息列表 -->
    <div class="chat-messages" ref="messagesContainer">
      <!-- 内容包装器 - 控制最大宽度 -->
      <div class="chat-messages-content">
        <!-- 对话消息 -->
        <div
        v-for="message in messages"
        :key="message.id"
        :class="['chat-message', `chat-message--${message.role}`]"
        v-show="message.content || message.reasoningContent || message.role === 'user' || message.isPlaceholder"
      >
        <div class="chat-message__avatar">
          <!-- 用户头像：使用用户最新上传的头像 -->
          <template v-if="message.role === 'user'">
            <el-avatar
              :size="32"
              :src="cachedAvatar"
              class="chat-avatar chat-avatar--user"
            >
              <i v-if="!cachedAvatar" class="el-icon-user"></i>
            </el-avatar>
          </template>
          <!-- 助手头像：类 chatbox 机器人形象 -->
          <template v-else>
            <div class="chat-avatar chat-avatar--assistant">
              <div class="chat-avatar__inner">
                <div class="chat-avatar__robot-face">
                  <div class="chat-avatar__eyes">
                    <span class="chat-avatar__eye"></span>
                    <span class="chat-avatar__eye"></span>
                  </div>
                  <div class="chat-avatar__mouth"></div>
                </div>
              </div>
            </div>
          </template>
        </div>
        <div class="chat-message__content">
          <!-- AI消息：直接显示内容，无气泡 -->
          <template v-if="message.role === 'assistant'">
            <!-- 深度推理过程区域 -->
            <div
              v-if="message.reasoningContent || message.isReasoning"
              class="ai-reasoning-section"
            >
              <div class="ai-reasoning-header" @click="message.reasoningContent && toggleReasoning(message)">
                <i v-if="message.reasoningContent" :class="message.reasoningExpanded ? 'el-icon-arrow-down' : 'el-icon-arrow-right'"></i>
                <span class="reasoning-title">
                  {{ message.reasoningCompleted ? '已思考' : '思考中...' }}{{ message.reasoningDuration ? ` (${message.reasoningDuration})` : '' }}
                </span>
              </div>
              <!-- 推理内容存在时显示内容 -->
              <div v-if="message.reasoningHtml" v-show="message.reasoningExpanded" class="ai-reasoning-content" v-html="message.reasoningHtml">
              </div>
              <!-- 推理内容未返回时显示加载动效 -->
              <div v-else-if="message.isReasoning && !message.reasoningCompleted && !message.isPlaceholder" class="ai-reasoning-loading">
                <div class="ai-loading-dots">
                  <span class="dot"></span>
                  <span class="dot"></span>
                  <span class="dot"></span>
                </div>
              </div>
              <!-- 分隔线 -->
              <div v-if="(message.reasoningHtml && (message.reasoningExpanded || message.reasoningCompleted)) || message.isReasoning" class="ai-divider"></div>
            </div>

            <!-- 占位符：显示处理中状态 -->
            <div v-if="message.isPlaceholder" class="ai-thinking-placeholder">
              <!-- 统一使用脉动圆点动效，不显示文字 -->
              <div class="ai-loading-dots">
                <span class="dot"></span>
                <span class="dot"></span>
                <span class="dot"></span>
              </div>
            </div>

            <!-- 消息内容：支持Markdown实时渲染 -->
            <div
              v-if="!message.isPlaceholder || message.content"
              class="ai-message-content"
              v-html="message.content"
            ></div>
          </template>

          <!-- 用户消息：保持原有气泡样式 -->
          <template v-else>
            <!-- 语音消息：微信风格语音气泡 -->
            <div
              v-if="message.isVoice"
              class="voice-message"
              :class="{ playing: playingVoiceMessageId === message.id, uploading: message.isUploading && !message.uploadId }"
              @click="message.uploadId && playVoiceMessage(message)"
            >
              <div class="voice-message__content">
                <!-- 上传中但没有uploadId时显示加载图标 -->
                <div v-if="message.isUploading && !message.uploadId" class="voice-message__uploading">
                  <i class="el-icon-loading"></i>
                </div>
                <!-- 有uploadId或上传完成时显示录音时长 -->
                <div v-else class="voice-message__duration">
                  {{ formatVoiceDuration(message.voiceDuration) }}
                </div>
              </div>
              <!-- 语音图标 -->
              <svg class="voice-message__icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
              </svg>
              <!-- 播放波形动画 -->
              <div v-if="playingVoiceMessageId === message.id" class="voice-message__wave">
                <span class="voice-message__wave-bar"></span>
                <span class="voice-message__wave-bar"></span>
                <span class="voice-message__wave-bar"></span>
                <span class="voice-message__wave-bar"></span>
                <span class="voice-message__wave-bar"></span>
              </div>
            </div>
            <!-- 普通文字消息 -->
            <div v-else class="chat-message__text">{{ message.content }}</div>
          </template>

          <!-- 消息元信息 -->
          <div class="chat-message__meta">
            <span class="chat-message__time">{{ message.time }}</span>
            <span v-if="message.tokens" class="chat-message__tokens">{{ message.tokens }} tokens</span>
            <div class="chat-message__actions">
              <!-- 复制按钮 -->
              <span
                class="chat-message__action-btn"
                @click="copyMessage(getCopyContent(message))"
                title="复制"
              >
                <svg class="action-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" stroke-width="2"/>
                  <path d="M5 15H4C3.46957 15 2.96086 14.7893 2.58579 14.4142C2.21071 14.0391 2 13.5304 2 13V4C2 3.46957 2.21071 2.96086 2.58579 2.58579C2.96086 2.21071 3.46957 2 4 2H13C13.5304 2 14.0391 2.21071 14.4142 2.58579C14.7893 2.96086 15 3.46957 15 4V5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </span>
              <!-- 重新发送/重新生成按钮 -->
              <span
                class="chat-message__action-btn"
                @click="retryMessage(message)"
                :title="message.role === 'user' ? '重新发送' : '重新生成'"
              >
                <svg class="action-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M23 4V10H17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M20.49 15C19.9828 16.8443 18.9093 18.4813 17.4139 19.6803C15.9184 20.8793 14.0776 21.5799 12.1658 21.6851C10.2539 21.7902 8.36631 21.2953 6.75756 20.2658C5.14882 19.2363 3.8999 17.7251 3.17898 15.9361C2.45806 14.1471 2.29925 12.1697 2.72422 10.2811C3.14919 8.3925 4.13739 6.68428 5.55504 5.39214C6.97269 4.09999 8.75395 3.18537 10.6758 2.76519C12.5976 2.34502 14.6023 2.43956 16.47 3.236L20.49 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </span>
              <!-- 删除按钮 -->
              <span
                class="chat-message__action-btn chat-message__delete-btn"
                @click="deleteMessage(message.id)"
                title="删除"
              >
                <svg class="action-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 6H5H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </span>
              <!-- 播报按钮 (仅AI消息) -->
              <span
                v-if="message.role === 'assistant'"
                class="chat-message__action-btn"
                @click="toggleSpeak(message)"
                :title="speakingMessageId === message.id ? '停止播报' : '播报'"
              >
                <svg v-if="speakingMessageId === message.id" class="action-icon speaking-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="6" y="6" width="12" height="12" rx="1" fill="currentColor"/>
                </svg>
                <svg v-else class="action-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <polygon points="11,5 6,9 6,19 11,23 11,5" fill="currentColor"/>
                  <path d="M12,11L12,17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  <path d="M15,8L15,20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  <path d="M18,12L18,16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </span>
              <!-- 分享按钮 (仅AI消息) -->
              <span
                v-if="message.role === 'assistant'"
                class="chat-message__action-btn"
                @click="shareMessage(message)"
                title="分享"
              >
                <svg class="action-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="18" cy="5" r="3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <circle cx="6" cy="12" r="3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <circle cx="18" cy="19" r="3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M8.59 13.51L15.42 17.49" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M15.41 6.51L8.59 10.49" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </span>
              <!-- 继续生成按钮 (仅在暂停时且是当前生成的AI消息时显示，放在最右侧) -->
              <span
                v-if="message.role === 'assistant' && message.isLastGenerating && isPaused"
                class="chat-message__action-btn continue-generate-btn"
                @click="continueGenerationFromMessage(message)"
                title="继续生成"
              >
                <svg class="action-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <polygon points="5,3 19,12 5,21" fill="currentColor"/>
                </svg>
                继续生成
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 加载状态 -->
      <div v-if="isTyping" class="chat-message chat-message--assistant">
        <div class="chat-message__avatar">
          <div class="chat-avatar chat-avatar--assistant">
            <div class="chat-avatar__inner">
              <div class="chat-avatar__robot-face">
                <div class="chat-avatar__eyes">
                  <span class="chat-avatar__eye"></span>
                  <span class="chat-avatar__eye"></span>
                </div>
                <div class="chat-avatar__mouth"></div>
              </div>
            </div>
          </div>
        </div>
        <div class="chat-message__content">
          <div class="chat-message__typing">
            <el-icon class="is-loading"><Loading /></el-icon>
            <span>正在输入...</span>
          </div>
        </div>
      </div>

      <!-- 录音波形显示区域 - 在消息列表底部，不覆盖消息 -->
      <canvas v-if="isRecording" ref="waveformCanvas" class="voice-waveform-canvas"></canvas>
      <!-- 内容包装器结束 -->
      </div>
    </div>

    <!-- 聊天输入区域收缩/回弹按钮 -->
    <div
      class="chat-input-toggle"
      :class="{ 'chat-input-toggle--collapsed': isInputCollapsed }"
      @click="toggleInputCollapse"
      :title="isInputCollapsed ? '展开输入框' : '收起输入框'"
    >
      <i :class="isInputCollapsed ? 'el-icon-arrow-up' : 'el-icon-arrow-down'"></i>
    </div>

    <!-- 聊天输入区域 -->
    <transition name="slide-input">
      <ChatInput
        v-show="!isInputCollapsed"
        ref="chatInputRef"
        @send-message="sendMessage"
        @upload-file="handleUploadFile"
        @model-change="handleModelChange"
        @new-chat="createNewSession"
        @pause-generation="pauseGeneration"
        @voice-message-ready="handleVoiceMessageReady"
        @voice-chunk="handleVoiceChunk"
        @voice-complete="handleVoiceComplete"
        @voice-upload-complete="handleVoiceUploadComplete"
        @voice-metadata-update="handleVoiceMetadataUpdate"
        @voice-aborted="handleVoiceAborted"
        @recording-state-changed="handleRecordingStateChanged"
        @audio-data-available="handleAudioDataAvailable"
        :current-model="currentModel"
        :is-generating="isGenerating"
        :conversation-id="currentSession?.backendConversationId"
        :model-name="currentModel"
        :online-search="onlineSearch"
        :deep-reasoning="deepReasoning"
      />
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch, reactive } from 'vue'
import { useRoute } from 'vue-router'
import { Loading } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { uploadDocument } from '../api/document.js'
import { intelligentQuery, getAvailableModels, exportConversation } from '../api/intelligentSearch.js'
import userState from '../utils/userStore.js'
import { marked } from 'marked'
import hljs from 'highlight.js'
import 'highlight.js/styles/atom-one-dark.css'
import ChatInput from '../components/ChatInput.vue'

// 配置Markdown渲染
marked.setOptions({
  breaks: true,
  gfm: true
})

// 自定义renderer来处理代码高亮
const renderer = new marked.Renderer()

// 语言显示名称映射
const langDisplayNames = {
  'javascript': 'JavaScript',
  'typescript': 'TypeScript',
  'python': 'Python',
  'java': 'Java',
  'cpp': 'C++',
  'c': 'C',
  'csharp': 'C#',
  'go': 'Go',
  'rust': 'Rust',
  'ruby': 'Ruby',
  'php': 'PHP',
  'swift': 'Swift',
  'kotlin': 'Kotlin',
  'scala': 'Scala',
  'r': 'R',
  'sql': 'SQL',
  'bash': 'Bash',
  'shell': 'Shell',
  'json': 'JSON',
  'yaml': 'YAML',
  'xml': 'XML',
  'html': 'HTML',
  'css': 'CSS',
  'scss': 'SCSS',
  'markdown': 'Markdown',
  'plaintext': 'Text',
  'text': 'Text'
}

// marked.js v17+ 使用 token 对象作为参数
renderer.code = function(token) {
  // token 结构: { type: 'code', lang: string, text: string }
  const codeText = token.text || ''
  const language = token.lang || ''

  // 获取有效语言
  const validLang = language && hljs.getLanguage(language) ? language : 'plaintext'

  // 获取语言显示名称
  const displayName = langDisplayNames[validLang.toLowerCase()] || validLang

  // 生成唯一ID用于复制功能
  const codeId = 'code-' + Math.random().toString(36).substr(2, 9)
  // 转义代码内容以便在data属性中存储
  const escapedCode = codeText.replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  // 复制按钮SVG图标
  const copyIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
    <path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>`

  // 如果代码为空，返回空的代码块
  if (!codeText) {
    return `<div class="code-block-wrapper">
      <div class="code-block-header">
        <span class="code-block-lang">${displayName}</span>
        <button class="code-block-copy-btn" data-code="" onclick="copyCodeBlock(this, '${codeId}')">
          ${copyIcon} 复制
        </button>
      </div>
      <pre><code class="hljs language-${validLang}"></code></pre>
    </div>`
  }

  const highlighted = hljs.highlight(codeText, { language: validLang }).value

  // 返回带有顶部栏和复制按钮的代码块
  return `<div class="code-block-wrapper">
    <div class="code-block-header">
      <span class="code-block-lang">${displayName}</span>
      <button class="code-block-copy-btn" data-code="${escapedCode}" onclick="copyCodeBlock(this, '${codeId}')">
        ${copyIcon} 复制
      </button>
    </div>
    <pre><code class="hljs language-${validLang}" id="${codeId}">${highlighted}</code></pre>
  </div>`
}

// 全局复制函数 - 挂载到window对象
window.copyCodeBlock = function(button, codeId) {
  const code = button.getAttribute('data-code')
  if (!code) return

  // 解码HTML实体
  const decodedCode = code.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")

  // 使用Clipboard API复制
  navigator.clipboard.writeText(decodedCode).then(() => {
    // 复制成功，更改按钮文本
    const originalContent = button.innerHTML
    button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
    </svg> 已复制`
    button.classList.add('copied')

    // 2秒后恢复原状
    setTimeout(() => {
      button.innerHTML = originalContent
      button.classList.remove('copied')
    }, 2000)
  }).catch(err => {
    console.error('复制失败:', err)
  })
}

// 设置自定义renderer
marked.setOptions({
  renderer: renderer
})

// 路由对象，用于接收 HistoryPage 传入的会话 ID
const route = useRoute()

// 缓存头像URL，避免频繁重新请求
const cachedAvatar = ref(userState.avatar || '')

// 监听头像变化，只有真正变化时才更新
watch(
  () => userState.avatar,
  (newAvatar) => {
    if (newAvatar !== cachedAvatar.value) {
      cachedAvatar.value = newAvatar
    }
  }
)

// 聊天会话列表
const chatSessions = ref([
  {
    id: 'session-1',
    title: '新对话',
    messages: [],
    conversationHistory: [],
    createdAt: new Date().toISOString(),
    documentIds: [] // 存储当前会话关联的文档ID，供后续查询复用
  }
])

// 当前选中的会话
const currentSessionId = ref('session-1')

// 获取当前会话
const currentSession = computed(() => {
  return chatSessions.value.find(session => session.id === currentSessionId.value) || chatSessions.value[0]
})

// 对话消息（从当前会话获取）
const messages = computed(() => currentSession.value.messages)

// 对话上下文（从当前会话获取）
const conversationHistory = computed(() => currentSession.value.conversationHistory)

// 加载状态
const isTyping = ref(false)

// 消息容器引用
const messagesContainer = ref(null)

// 组件引用
const chatComponent = ref(null)

// 模型配置 - 通过后端获取，前端只保留显示名称
const modelConfig = ref({
  glm: { name: "GLM-4.5-Flash" },
  deepseek: { name: "DeepSeek" },
  qwen2: { name: "通义千问Plus" },
  qwen3: { name: "通义千问3" },
  doubao: { name: "豆包" },
  llama3: { name: "Llama 3" }
})

// 模型列表，用于UI显示
const models = ref([
  { id: 'glm', name: 'GLM-4.5-Flash', icon: 'el-icon-chat-dot-round' },
  { id: 'deepseek', name: 'DeepSeek', icon: 'el-icon-chat-dot-round' },
  { id: 'qwen2', name: '通义千问Plus', icon: 'el-icon-chat-dot-round' },
  { id: 'qwen3', name: '通义千问3', icon: 'el-icon-chat-dot-round' },
  { id: 'doubao', name: '豆包', icon: 'el-icon-chat-dot-round' },
  { id: 'llama3', name: 'Llama 3', icon: 'el-icon-chat-dot-round' }
])

// 当前选中的模型
const selectedModel = ref('glm')

// 控制是否可以发送新消息的状态
const isSending = ref(false)

// 暂停/继续生成相关状态
const isGenerating = ref(false)  // 是否正在生成
const isPaused = ref(false)      // 是否已暂停
const currentAbortController = ref(null)  // 用于中断请求
const lastUserQuery = ref('')    // 最后的用户问题（用于继续生成）
const lastOnlineSearch = ref(false)  // 最后的联网搜索状态（用于继续生成）
const lastDeepReasoning = ref(false)  // 最后的深度推理状态（用于继续生成）
const currentGeneratingMessage = ref(null)  // 当前正在生成的消息对象

// 语音播报相关状态
const speakingMessageId = ref(null)  // 当前正在播报的消息ID
const speechUtterance = ref(null)    // 当前语音合成实例

// 录音波形相关状态
const isRecording = ref(false)       // 是否正在录音
const waveformCanvas = ref(null)     // 波形canvas引用
let waveformAnimationId = null       // 波形动画ID
let waveformData = null              // 波形数据

// ChatInput组件引用
const chatInputRef = ref(null)

// 当前选择的模型和相关配置
const currentModel = ref(localStorage.getItem('selectedModel') || 'deepseek-chat')
const onlineSearch = ref(localStorage.getItem('onlineSearch') === 'true')
const deepReasoning = ref(localStorage.getItem('deepReasoning') === 'true')

// 输入框收缩状态
const isInputCollapsed = ref(false)

// 切换输入框收缩状态
const toggleInputCollapse = () => {
  isInputCollapsed.value = !isInputCollapsed.value
  // 收缩后滚动到底部
  if (!isInputCollapsed.value) {
    nextTick(() => {
      scrollToBottom()
    })
  }
}

// 用户语音消息播放状态
const playingVoiceMessageId = ref(null)  // 当前正在播放的用户语音消息ID
let voiceAudio = null                    // Audio对象
let voiceAnimationId = null              // 语音播放动画ID

// 暂停生成 - 使用AbortController真正断开SSE连接
const handlePauseGeneration = () => {
  isPaused.value = true

  // 中断当前的请求
  if (currentAbortController.value) {
    currentAbortController.value.abort()
    currentAbortController.value = null
  }

  // 保持当前生成消息的标记为 true，以便显示"继续生成"按钮
  if (currentGeneratingMessage.value) {
    currentGeneratingMessage.value.isLastGenerating = true
  }

  isGenerating.value = false
}

// 处理模型变化
const handleModelChange = (modelId) => {
  currentModel.value = modelId
  localStorage.setItem('selectedModel', modelId)
}

// 从消息继续生成（点击消息操作栏的继续生成按钮）
const continueGenerationFromMessage = async (message) => {
  if (!currentSession.value.backendConversationId) {
    ElMessage.warning('会话未保存，无法继续生成')
    return
  }

  // 获取当前AI消息的纯文本内容用于续写
  let currentContent = ''

  if (message.rawContent) {
    // 使用原始内容
    currentContent = message.rawContent

    // 清理元数据
    currentContent = currentContent.replace(/^content=''?\s*$/gm, '')
    currentContent = currentContent.replace(/^usage_metadata=\{[^}]*\}\s*/g, '')
    currentContent = currentContent.replace(/^additional_kwargs=\{.*?\}\s*$/gm, '')
    currentContent = currentContent.replace(/^response_metadata=\{.*?\}\s*$/gm, '')
    currentContent = currentContent.replace(/^id='run-[^']*'\s*$/gm, '')
    currentContent = currentContent.replace(/^name='[^']*'\s*$/gm, '')

    // 保存清理后的原始内容，以便移除推理标签后为空时使用
    const cleanedContent = currentContent

    // 重要：移除推理标签！续传时后端不需要推理标签
    // 推理标签只在初始请求时使用，续传时只发送已生成的答案内容
    const reasoningStartTag = '<推理过程>'
    const reasoningEndTag = '</推理过程>'
    const answerStartTag = '<最终答案>'
    const answerEndTag = '</最终答案>'

    // 如果包含推理标签，只保留最终答案部分（不含标签）
    if (currentContent.includes(answerStartTag)) {
      const answerStart = currentContent.indexOf(answerStartTag)
      const answerEnd = currentContent.indexOf(answerEndTag)
      if (answerEnd !== -1) {
        // 完整的最终答案标签
        currentContent = currentContent.substring(answerStart + answerStartTag.length, answerEnd)
      } else if (answerStart !== -1) {
        // 只有开始标签，答案还没完成，提取从开始标签后的内容
        currentContent = currentContent.substring(answerStart + answerStartTag.length)
      }
    } else if (currentContent.includes(reasoningStartTag)) {
      // 只有推理标签，没有最终答案标签
      const reasoningEnd = currentContent.indexOf(reasoningEndTag)
      if (reasoningEnd !== -1) {
        // 推理已完成，取推理之后的内容
        currentContent = currentContent.substring(reasoningEnd + reasoningEndTag.length)
      }
      // 注意：如果推理还在进行中，直接使用原始内容续传
    }

    currentContent = currentContent.trim()

    // 如果清理后内容为空，使用清理后的原始内容进行续传
    if (!currentContent) {
      currentContent = cleanedContent.trim()
    }
  } else {
    // 没有 rawContent，从 HTML 中提取纯文本
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = message.content || ''
    currentContent = tempDiv.textContent || tempDiv.innerText || ''
  }

  if (!currentContent) {
    ElMessage.warning('没有可继续的内容')
    return
  }

  // 检查是否是语音生成（通过消息对象中的标记判断）
  if (message.isVoiceGeneration || message.voiceUploadId) {
    // 语音消息续传
    await continueVoiceGeneration(message)
  } else {
    // 文字消息续传
    await doContinueGeneration(currentContent, message)
  }
}

// 执行续写请求
const doContinueGeneration = async (continueFromContent, targetMessage) => {
  if (!lastUserQuery.value) {
    ElMessage.warning('无法继续生成，请先发送一条消息')
    return
  }

  try {
    isGenerating.value = true
    isPaused.value = false
    isTyping.value = false

    // 创建新的AbortController
    currentAbortController.value = new AbortController()

    // 使用目标消息继续生成
    const assistantMessage = targetMessage
    assistantMessage.isComplete = false
    assistantMessage.isLastGenerating = true
    currentGeneratingMessage.value = assistantMessage

    const sessionRef = currentSession.value

    const reasoningStartTime = Date.now()

    // 检测原内容是否包含推理标签
    const reasoningStartTag = '<推理过程>'
    const reasoningEndTag = '</推理过程>'
    const hasReasoningInOriginal = continueFromContent.includes(reasoningStartTag)

    // 如果原消息有推理内容，保存它以便后续恢复
    const savedReasoningContent = assistantMessage.reasoningContent || ''
    const savedReasoningHtml = assistantMessage.reasoningHtml || ''
    const savedReasoningRawContent = assistantMessage.reasoningRawContent || ''
    const savedReasoningCompleted = assistantMessage.reasoningCompleted
    const savedReasoningDuration = assistantMessage.reasoningDuration

    // 续传逻辑：后端收到 continue_from_content 后应该只返回新内容（增量）
    // 我们需要将新内容追加到已生成内容后面
    let rawContent = continueFromContent

    // 用于检测后端返回模式（只在第一个chunk时判断一次）
    let detectedBackendMode = null  // 'incremental' 或 'full'

    await intelligentQuery(
      {
        query: lastUserQuery.value,
        conversation_id: sessionRef.backendConversationId,
        mode: 'general',
        model_name: selectedModel.value,
        stream: true,
        online_search: lastOnlineSearch.value,
        deep_reasoning: lastDeepReasoning.value,
        continue_from_content: continueFromContent,
        signal: currentAbortController.value?.signal || null
      },
      // onChunk
      (chunkContent) => {
        if (chunkContent) {
          // 首次检测后端返回模式
          if (detectedBackendMode === null) {
            // 如果chunk内容完全包含continue_from_content作为前缀，且chunk明显更长
            // 则说明后端返回的是完整内容
            if (chunkContent.length > continueFromContent.length * 1.5 &&
                chunkContent.startsWith(continueFromContent)) {
              detectedBackendMode = 'full'
            } else {
              // 否则认为是增量模式
              detectedBackendMode = 'incremental'
            }
          }

          if (detectedBackendMode === 'full') {
            // 完整内容模式：提取增量部分
            if (chunkContent.length > continueFromContent.length &&
                chunkContent.startsWith(continueFromContent)) {
              const incrementalContent = chunkContent.substring(continueFromContent.length)
              if (incrementalContent) {
                rawContent += incrementalContent
              }
            }
          } else {
            // 增量模式：直接追加
            rawContent += chunkContent
          }

          // 检查当前内容状态
          const isInReasoning = rawContent.includes(reasoningStartTag) &&
                                !rawContent.includes(reasoningEndTag)
          const hasCompleteReasoning = rawContent.includes(reasoningStartTag) &&
                                       rawContent.includes(reasoningEndTag)

          // 根据当前内容状态决定解析方式
          if (hasCompleteReasoning || isInReasoning) {
            // 有推理内容，使用深度推理模式解析
            parseContentAndReasoning(assistantMessage, rawContent, reasoningStartTime, true)
          } else {
            // 没有推理标签了，说明在输出答案部分
            parseContentAndReasoning(assistantMessage, rawContent, null, false)

            // 如果原消息有推理内容，确保它被保留
            if (hasReasoningInOriginal && savedReasoningContent) {
              assistantMessage.reasoningContent = savedReasoningContent
              assistantMessage.reasoningHtml = savedReasoningHtml
              assistantMessage.reasoningRawContent = savedReasoningRawContent
              assistantMessage.reasoningCompleted = savedReasoningCompleted
              assistantMessage.reasoningDuration = savedReasoningDuration
            }
          }
          scrollToBottom(false)
        }
      },
      // onMetadata
      (metadata) => {
        if (metadata.conversation_id) {
          sessionRef.backendConversationId = metadata.conversation_id
        }
      },
      // onError
      (error) => {
        console.error('[续写生成] 错误:', error)
        ElMessage.error(`续写生成失败: ${error}`)
        assistantMessage.isLastGenerating = false
        currentGeneratingMessage.value = null
      },
      // onComplete
      () => {
        // 确保 rawContent 被保存
        assistantMessage.rawContent = rawContent

        // 如果原消息有推理内容，确保它被保留（最终确认）
        if (hasReasoningInOriginal && savedReasoningContent) {
          assistantMessage.reasoningContent = savedReasoningContent
          assistantMessage.reasoningHtml = savedReasoningHtml
          assistantMessage.reasoningRawContent = savedReasoningRawContent
          assistantMessage.reasoningCompleted = savedReasoningCompleted
          assistantMessage.reasoningDuration = savedReasoningDuration
        }

        assistantMessage.isComplete = true
        assistantMessage.isLastGenerating = false
        currentGeneratingMessage.value = null
        isGenerating.value = false
        isPaused.value = false
        // 完成后重新解析markdown
        parseMarkdown(assistantMessage)
      }
    )

  } catch (error) {
    // 如果是用户主动中止的请求（如暂停生成），静默处理
    if (error.name === 'AbortError') {
      console.warn('[续写生成] 用户中止:', error.message)
      // 保存当前rawContent以便续传
      if (targetMessage && rawContent) {
        targetMessage.rawContent = rawContent
      }
      // 恢复原消息的推理内容（如果有）
      if (targetMessage && savedReasoningContent) {
        targetMessage.reasoningContent = savedReasoningContent
        targetMessage.reasoningHtml = savedReasoningHtml
        targetMessage.reasoningRawContent = savedReasoningRawContent
        targetMessage.reasoningCompleted = savedReasoningCompleted
        targetMessage.reasoningDuration = savedReasoningDuration
      }
      // 保持 isLastGenerating 为 true 以显示继续生成按钮
      isPaused.value = true
      if (targetMessage) {
        targetMessage.isLastGenerating = true
      }
      isGenerating.value = false
      currentGeneratingMessage.value = null
      return
    }

    console.error('[续写生成] 失败:', error)
    ElMessage.error(`续写生成失败: ${error.message || error}`)
    // 非中止错误才清除标记
    if (targetMessage) {
      targetMessage.isLastGenerating = false
    }
    isGenerating.value = false
    isPaused.value = false
    currentGeneratingMessage.value = null
  }
}

// 分享消息（导出会话为可分享链接）
const shareMessage = async (message) => {
  if (!currentSession.value.backendConversationId) {
    ElMessage.warning('会话未保存，无法分享')
    return
  }

  try {
    ElMessage.info('正在生成分享链接...')

    const result = await exportConversation(
      currentSession.value.backendConversationId,
      { format: 'txt', include_metadata: true, include_references: false }
    )

    if (result && result.download_url) {
      // 复制分享链接到剪贴板
      navigator.clipboard.writeText(result.download_url).then(() => {
        ElMessage.success({
          message: '分享链接已复制到剪贴板！',
          duration: 3000
        })
      }).catch(() => {
        // 如果复制失败，显示链接让用户手动复制
        ElMessage({
          message: `分享链接: ${result.download_url}`,
          duration: 5000,
          type: 'info'
        })
      })
    } else {
      ElMessage.error('生成分享链接失败')
    }
  } catch (error) {
    console.error('[分享消息] 失败:', error)
    ElMessage.error(`分享失败: ${error.message || error}`)
  }
}

// 发送消息方法（用于接收来自ChatInput的消息）
const sendMessage = async (data) => {
  const { content, files, onlineSearch, deepReasoning } = data

  // 保存开关状态，用于断点续传时恢复
  lastOnlineSearch.value = !!onlineSearch
  lastDeepReasoning.value = !!deepReasoning

  // 允许只有文件上传而没有文本内容
  if (!content.trim() && (!files || files.length === 0)) return

  // 如果正在发送消息，则不允许发送新消息
  if (isSending.value) {
    console.warn('正在发送消息，请等待完成后再发送新消息')
    return
  }

  // 设置发送状态为true
  isSending.value = true

  // 处理文件上传并获取文档ID
  let uploadedDocIds = []
  let uploadedFileNames = []

  if (files && files.length > 0) {
    // 显示统一的上传处理提示（合并多个弹窗为一个）
    const uploadingMessage = ElMessage({
      message: `正在处理 ${files.length} 个文件，请稍候...`,
      type: 'info',
      duration: 0,
      showClose: false
    })

    let successCount = 0
    let failCount = 0

    // 上传每个文件到后端
    for (const file of files) {
      try {
        // 调用后端API上传文件
        const response = await uploadDocument(file)

        // 多种可能的响应格式处理
        let docId = null

        if (response) {
          if (response.document && response.document.id) {
            docId = response.document.id
          } else if (response.doc_id) {
            docId = response.doc_id
          } else if (response.data && response.data.doc_id) {
            docId = response.data.doc_id
          } else if (response.data && response.data.document && response.data.document.id) {
            docId = response.data.document.id
          } else if (response.document_id) {
            docId = response.document_id
          } else if (response.id) {
            docId = response.id
          } else if (typeof response === 'string') {
            docId = response
          } else if (Array.isArray(response) && response.length > 0) {
            if (response[0].document && response[0].document.id) {
              docId = response[0].document.id
            } else if (response[0].doc_id) {
              docId = response[0].doc_id
            } else if (response[0].id) {
              docId = response[0].id
            }
          }
        }

        if (docId) {
          uploadedDocIds.push(docId)
          uploadedFileNames.push(file.name)
          successCount++
        } else {
          console.error('无法从响应中提取文档ID，响应内容:', response)
          failCount++
        }
      } catch (error) {
        console.error('上传文件失败:', error)
        failCount++
      }
    }

    // 关闭上传中提示
    uploadingMessage.close()

    // 显示统一的结果提示（只显示一个弹窗）
    if (failCount === 0 && successCount > 0) {
      ElMessage.success(`${successCount} 个文件处理完成，可以开始提问`)
    } else if (successCount > 0 && failCount > 0) {
      ElMessage.warning(`${successCount} 个文件处理成功，${failCount} 个失败`)
    } else if (failCount > 0 && successCount === 0) {
      ElMessage.error(`文件处理失败，请重试`)
    }
  }

  // 如果有文件上传但没有成功的，且没有文本内容，则不继续
  if (uploadedDocIds.length === 0 && !content.trim()) {
    ElMessage.error('请至少上传一个文件或输入查询内容')
    isSending.value = false
    return
  }

  // 创建用户消息（不添加功能标签，只显示原始query内容）
  let messageContent = content.trim()

  // 记录功能开启状态用于后端调用，但不在消息中显示
  if (onlineSearch) {
    // 联网搜索已开启
  }
  if (deepReasoning) {
    // 深度推理已开启
  }

  // 创建用户消息（确保内容去除多余空格）
  const userMessage = {
    id: Date.now(),
    role: 'user',
    content: messageContent.replace(/\s+/g, ' ').trim(), // 将多个连续空格替换为单个空格，并去除首尾空格
    time: new Date().toLocaleTimeString()
  }

  // 添加到当前会话的消息列表
  currentSession.value.messages.push(userMessage)
  scrollToBottom(false, true)  // 发送消息后强制滚动到底部

  const sessionRef = currentSession.value

  try {
    // 显示加载状态
    isTyping.value = true
    isGenerating.value = true
    isPaused.value = false

    // 创建新的AbortController用于中断请求
    currentAbortController.value = new AbortController()

    // 保存用户查询（用于继续生成）
    lastUserQuery.value = messageContent

    if (uploadedDocIds.length > 0 && !content.trim()) {
      // ========== 只有文件上传，没有查询 ==========
      const assistantMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: `文档已上传成功！\n\n您可以直接输入问题，我将基于这些文档为您解答。`,
        time: new Date().toLocaleTimeString()
      }
      sessionRef.messages.push(assistantMessage)

    } else {
      // ========== 使用后端统一智能查询接口 ==========

      // 获取或创建后端会话ID
      if (!sessionRef.backendConversationId) {
        sessionRef.backendConversationId = null
      }

      // 记录推理开始时间
      const reasoningStartTime = Date.now()

      // 使用reactive创建助手消息对象
      const assistantMessage = reactive({
        id: Date.now() + 1,
        role: 'assistant',
        content: '',
        rawContent: '', // 原始内容，用于Markdown解析
        reasoningContent: '',
        reasoningRawContent: '', // 推理过程原始内容
        reasoningExpanded: true, // 默认展开
        reasoningCompleted: false,
        isReasoning: !!deepReasoning, // 是否在推理中
        reasoningStartTime: reasoningStartTime,
        reasoningDuration: null, // 推理耗时
        isComplete: false, // 标记是否渲染完成
        isLastGenerating: true, // 标记为当前正在生成的消息
        tokens: null,
        time: new Date().toLocaleTimeString()
      })

      // 设置当前正在生成的消息
      currentGeneratingMessage.value = assistantMessage

      // 临时存储原始内容用于解析
      let rawContent = ''
      let reasoningBuffer = ''
      let isInReasoning = false
      let firstChunkReceived = false

      // 立即添加到消息列表
      sessionRef.messages.push(assistantMessage)

      // 确定查询模式（仅当次请求上传了新文件时才使用文档模式）
      // - general: 无新文档上传，通用AI对话（包括后续问题）
      // - document: 当次上传了新文档且无联网搜索，专注文档分析
      // - hybrid: 当次上传了新文档且启用联网搜索，结合文档和联网
      const hasNewDocuments = uploadedDocIds.length > 0
      let queryMode = 'general'
      if (hasNewDocuments) {
        queryMode = onlineSearch ? 'hybrid' : 'document'
      }

      // 调用后端智能查询API
      // 仅当次上传了新文件时才传递文档参数
      let docParam = {}
      if (hasNewDocuments && uploadedDocIds.length > 0) {
        if (uploadedDocIds.length === 1 && queryMode === 'document') {
          // 单文档查询使用 document_id
          docParam.document_id = uploadedDocIds[0]
        } else {
          // 多文档或hybrid模式使用 document_ids 数组
          docParam.document_ids = uploadedDocIds
        }
      }

      const result = await intelligentQuery(
        {
          query: content.trim(),
          mode: queryMode,
          ...docParam,
          conversation_id: sessionRef.backendConversationId,
          user_id: userState.userId || null,
          model_name: selectedModel.value,
          stream: true,
          online_search: !!onlineSearch,
          deep_reasoning: !!deepReasoning,
          signal: currentAbortController.value?.signal || null
        },
        // onChunk - 接收内容片段（实现逐字流畅渲染）
        (chunkContent) => {
          if (isTyping.value) {
            isTyping.value = false
          }
          if (chunkContent) {
            // 逐字累加内容
            rawContent += chunkContent
            // 传递推理开始时间，用于计算耗时；传递 deepReasoning 参数以决定是否折叠显示推理内容
            parseContentAndReasoning(assistantMessage, rawContent, deepReasoning ? reasoningStartTime : null, deepReasoning)
            scrollToBottom(false)
          }
        },
        // onMetadata - 接收元数据
        (metadata) => {
          if (metadata.conversation_id) {
            sessionRef.backendConversationId = metadata.conversation_id
          }
          // 提取token使用情况
          if (metadata.usage_metadata) {
            const tokens = metadata.usage_metadata.total_tokens
            if (tokens) {
              assistantMessage.tokens = tokens
            }
          }
        },
        // onError - 接收错误
        (errorMsg) => {
          console.error('[智能查询] 错误:', errorMsg)
          if (errorMsg) {
            assistantMessage.content += `\n\n[错误] ${errorMsg}`
          }
          // 重置生成状态
          isGenerating.value = false
          isPaused.value = false
        },
        // onComplete - 渲染完成
        () => {
          assistantMessage.isComplete = true
          assistantMessage.isLastGenerating = false
          parseMarkdown(assistantMessage)
          // 重置生成状态
          isGenerating.value = false
          isPaused.value = false
          currentGeneratingMessage.value = null
        }
      )

      // 保存会话ID
      if (result && result.conversation_id) {
        sessionRef.backendConversationId = result.conversation_id
      }

      // 添加到本地对话历史
      sessionRef.conversationHistory.push({
        role: 'user',
        content: messageContent
      })
      sessionRef.conversationHistory.push({
        role: 'assistant',
        content: assistantMessage.content
      })
    }

    scrollToBottom()
  } catch (error) {
    // 如果是用户主动中止的请求（如暂停生成），静默处理
    if (error.name === 'AbortError') {
      console.warn('[用户中止] 请求已被用户取消:', error.message)
      // 保存当前已生成的内容到消息对象，以便续传
      if (assistantMessage && rawContent) {
        assistantMessage.rawContent = rawContent
      }
      // 保持消息的 isLastGenerating 状态，以便显示"继续生成"按钮
      if (assistantMessage) {
        assistantMessage.isLastGenerating = true
      }
      // 重置状态但不显示错误
      isTyping.value = false
      isGenerating.value = false
      isPaused.value = true
      currentGeneratingMessage.value = null
      return
    }

    console.error('处理消息失败:', error)

    // 隐藏加载状态
    isTyping.value = false
    // 重置生成状态
    isGenerating.value = false
    isPaused.value = false

    // 错误提示
    let errorMsg = '抱歉，处理请求时出现错误，请稍后重试。'

    if (error.response) {
      if (error.response.status === 401) {
        errorMsg = 'API密钥无效，请检查您的配置。'
      } else if (error.response.status === 404) {
        errorMsg = '请求的资源不存在。'
      } else if (error.response.status === 500) {
        errorMsg = '服务器内部错误，请稍后重试。'
      } else {
        errorMsg = `请求失败，状态码：${error.response.status}`
      }
    } else if (error.request) {
      errorMsg = '无法连接到服务器，请检查网络连接。'
    } else {
      errorMsg = `请求配置错误：${error.message}`
    }

    ElMessage.error(errorMsg)

    // 创建错误消息
    const errorMessage = {
      id: Date.now() + 1,
      role: 'assistant',
      content: errorMsg,
      time: new Date().toLocaleTimeString()
    }

    sessionRef.messages.push(errorMessage)
    scrollToBottom()
  } finally {
    isTyping.value = false
    isSending.value = false
  }
}

// 处理上传文件方法
const handleUploadFile = (file) => {
  ElMessage.success(`文件 ${file.name} 上传成功!`)
}

// 解析内容和推理过程，分离显示（流式渲染时调用）
const parseContentAndReasoning = (message, rawContent, reasoningStartTime = null, deepReasoning = false) => {
  // 保存原始内容 - 确保是字符串类型
  const rawContentStr = String(rawContent || '')
  message.rawContent = rawContentStr

  // 过滤掉元数据信息
  let cleanContent = rawContentStr

  // 移除元数据行
  cleanContent = cleanContent.replace(/^content=''?\s*$/gm, '')
  cleanContent = cleanContent.replace(/^content=''?\s*additional_kwargs=\{.*?\}\s*$/gm, '')
  cleanContent = cleanContent.replace(/^additional_kwargs=\{.*?\}\s*$/gm, '')
  cleanContent = cleanContent.replace(/^response_metadata=\{.*?\}\s*$/gm, '')
  cleanContent = cleanContent.replace(/^id='run-[^']*'\s*$/gm, '')
  cleanContent = cleanContent.replace(/^name='[^']*'\s*$/gm, '')
  cleanContent = cleanContent.replace(/^content=''?\s*(additional_kwargs=\{.*?\})?\s*(response_metadata=\{.*?\})?\s*(id='run-[^']*')?\s*$/gm, '')

  // 移除 usage_metadata 并提取token
  const tokenMatch = cleanContent.match(/usage_metadata=\{[^}]*total_tokens\s*[:=]\s*(\d+)[^}]*\}/)
  if (tokenMatch && !message.tokens) {
    message.tokens = parseInt(tokenMatch[1])
  }
  cleanContent = cleanContent.replace(/usage_metadata=\{[^}]*\}\s*/g, '')

  // 清理多余空行
  cleanContent = cleanContent.replace(/\n\s*\n\s*\n/g, '\n\n')

  // 处理深度推理标记
  const reasoningStartTag = '<推理过程>'
  const reasoningEndTag = '</推理过程>'
  const answerStartTag = '<最终答案>'
  const answerEndTag = '</最终答案>'

  let reasoningText = ''
  let wasReasoningCompleted = false


  // 只有当 deepReasoning 为 true 时，才将推理内容分离显示为折叠内容
  if (deepReasoning && cleanContent.includes(reasoningStartTag)) {
    const reasoningStart = cleanContent.indexOf(reasoningStartTag)
    const reasoningEnd = cleanContent.indexOf(reasoningEndTag)

    if (reasoningEnd !== -1) {
      reasoningText = cleanContent.substring(reasoningStart + reasoningStartTag.length, reasoningEnd)
      message.reasoningRawContent = reasoningText
      cleanContent = cleanContent.substring(0, reasoningStart) + cleanContent.substring(reasoningEnd + reasoningEndTag.length)
      message.reasoningCompleted = true
      wasReasoningCompleted = true

      // 计算推理耗时（从请求开始到推理完成）
      if (reasoningStartTime && !message.reasoningDuration) {
        const reasoningEndTime = Date.now()
        const reasoningElapsed = reasoningEndTime - reasoningStartTime
        message.reasoningDuration = `${(reasoningElapsed / 1000).toFixed(1)}秒`
      }
      // 推理完成，停止"思考中"状态
      message.isReasoning = false
    } else {
      // 推理还在进行中，提取推理内容
      const newReasoningContent = cleanContent.substring(reasoningStart + reasoningStartTag.length)
      // 如果已有推理内容，追加新内容（续传场景）
      if (message.reasoningRawContent && newReasoningContent.startsWith(message.reasoningRawContent)) {
        // 新内容包含旧内容，提取增量部分
        message.reasoningRawContent = newReasoningContent
      } else if (message.reasoningRawContent && !newReasoningContent.includes(message.reasoningRawContent)) {
        // 新内容是增量，追加到已有内容
        message.reasoningRawContent += newReasoningContent
      } else {
        // 首次设置或直接替换
        message.reasoningRawContent = newReasoningContent
      }
      cleanContent = cleanContent.substring(0, reasoningStart)
    }
  } else if (cleanContent.includes(reasoningStartTag) || cleanContent.includes(answerStartTag)) {
    // deepReasoning 为 false，但内容中包含推理标签
    // 或者：消息中已有推理内容，但当前内容片段不包含推理标签（需要保留已有推理内容）

    // 检查消息是否已经有推理内容（来自之前的解析）
    const hasExistingReasoning = message.reasoningContent || message.reasoningRawContent
    const shouldPreserveReasoning = hasExistingReasoning && deepReasoning


    if (shouldPreserveReasoning) {
      // 如果已有推理内容且是深度推理模式，只处理当前内容，不覆盖推理部分
      // 处理最终答案标签
      if (cleanContent.includes(answerStartTag)) {
        const answerStart = cleanContent.indexOf(answerStartTag)
        const answerEnd = cleanContent.indexOf(answerEndTag)

        if (answerEnd !== -1) {
          cleanContent = cleanContent.substring(answerStart + answerStartTag.length, answerEnd)
        } else if (answerStart !== -1) {
          cleanContent = cleanContent.substring(answerStart + answerStartTag.length)
        }
      }
      // 不覆盖已有的推理属性
    } else {
      // deepReasoning 为 false，移除推理标签，将推理内容合并到主内容中
      // 先保存现有的推理属性（如果有）
      const existingReasoningContent = message.reasoningContent || ''
      const existingReasoningHtml = message.reasoningHtml || ''
      const existingReasoningRawContent = message.reasoningRawContent || ''
      const existingReasoningCompleted = message.reasoningCompleted
      const existingReasoningDuration = message.reasoningDuration

      if (cleanContent.includes(reasoningStartTag)) {
        const reasoningStart = cleanContent.indexOf(reasoningStartTag)
        const reasoningEnd = cleanContent.indexOf(reasoningEndTag)

        if (reasoningEnd !== -1) {
          // 有完整的推理标签，移除标签但保留内容
          const beforeReasoning = cleanContent.substring(0, reasoningStart)
          const afterReasoning = cleanContent.substring(reasoningEnd + reasoningEndTag.length)
          cleanContent = beforeReasoning + cleanContent.substring(reasoningStart + reasoningStartTag.length, reasoningEnd) + afterReasoning
        } else {
          // 只有开始标签，移除开始标签
          cleanContent = cleanContent.substring(0, reasoningStart) + cleanContent.substring(reasoningStart + reasoningStartTag.length)
        }
      }

      // 处理最终答案标签
      if (cleanContent.includes(answerStartTag)) {
        const answerStart = cleanContent.indexOf(answerStartTag)
        const answerEnd = cleanContent.indexOf(answerEndTag)

        if (answerEnd !== -1) {
          cleanContent = cleanContent.substring(0, answerStart) + cleanContent.substring(answerStart + answerStartTag.length, answerEnd) + cleanContent.substring(answerEnd + answerEndTag.length)
        } else {
          cleanContent = cleanContent.substring(0, answerStart) + cleanContent.substring(answerStart + answerStartTag.length)
        }
      }

      // 如果消息已有推理属性，则恢复它们（不清除）
      if (existingReasoningContent) {
        message.reasoningContent = existingReasoningContent
        message.reasoningHtml = existingReasoningHtml
        message.reasoningRawContent = existingReasoningRawContent
        message.reasoningCompleted = existingReasoningCompleted
        message.reasoningDuration = existingReasoningDuration
      } else {
        // 只有当没有现有推理属性时才清除
        message.reasoningRawContent = ''
        message.reasoningContent = ''
        message.reasoningHtml = ''
        message.reasoningCompleted = false
        message.reasoningDuration = ''
      }
    }
  }

  // 处理最终答案标记（deepReasoning 为 true 时）
  if (deepReasoning && cleanContent.includes(answerStartTag)) {
    const answerStart = cleanContent.indexOf(answerStartTag)
    const answerEnd = cleanContent.indexOf(answerEndTag)

    if (answerEnd !== -1) {
      cleanContent = cleanContent.substring(answerStart + answerStartTag.length, answerEnd)
    } else if (answerStart !== -1) {
      cleanContent = cleanContent.substring(answerStart + answerStartTag.length)
    }
  }

  // 保存推理过程内容并转换为HTML（仅当 deepReasoning 为 true 时）
  const reasoningRawText = deepReasoning ? (reasoningText || message.reasoningRawContent || '') : ''
  message.reasoningContent = reasoningRawText

  // 将推理内容转换为HTML渲染
  if (reasoningRawText) {
    try {
      message.reasoningHtml = marked.parse(reasoningRawText)
    } catch (e) {
      console.error('[推理内容] Markdown解析失败:', e)
      message.reasoningHtml = reasoningRawText
    }
  } else {
    message.reasoningHtml = ''
  }

  // 准备解析的内容
  let contentToParse = cleanContent.trim()

  // 处理不完整代码块
  const codeBlockCount = (contentToParse.match(/```/g) || []).length
  if (codeBlockCount % 2 !== 0) {
    contentToParse += '\n```'
  }

  // 解析Markdown
  try {
    const htmlContent = marked.parse(contentToParse)
    // 直接设置HTML内容
    message.content = htmlContent
  } catch (e) {
    console.error('[流式解析] Markdown解析失败:', e)
    // 解析失败时的备用方案
    message.content = contentToParse
  }
}

// 渲染完成后解析Markdown
const parseMarkdown = (message) => {
  if (message.isComplete && message.rawContent) {
    // 使用与parseContentAndReasoning相同的清理逻辑
    let cleanContent = message.rawContent

    // 移除相同的元数据信息
    cleanContent = cleanContent.replace(/^content=''?\s*$/gm, '')
    cleanContent = cleanContent.replace(/^content=''?\s*additional_kwargs=\{.*?\}\s*$/gm, '')
    cleanContent = cleanContent.replace(/^additional_kwargs=\{.*?\}\s*$/gm, '')
    cleanContent = cleanContent.replace(/^response_metadata=\{.*?\}\s*$/gm, '')
    cleanContent = cleanContent.replace(/^id='run-[^']*'\s*$/gm, '')
    cleanContent = cleanContent.replace(/^name='[^']*'\s*$/gm, '')
    cleanContent = cleanContent.replace(/^content=''?\s*(additional_kwargs=\{.*?\})?\s*(response_metadata=\{.*?\})?\s*(id='run-[^']*')?\s*$/gm, '')
    cleanContent = cleanContent.replace(/usage_metadata=\{[^}]*\}\s*/g, '')

    // 清理多余的空行
    cleanContent = cleanContent.replace(/\n\s*\n\s*\n/g, '\n\n')

    // 分离推理和答案
    const reasoningStartTag = '<推理过程>'
    const reasoningEndTag = '</推理过程>'
    const answerStartTag = '<最终答案>'
    const answerEndTag = '</最终答案>'

    let finalAnswer = cleanContent

    // 移除推理过程
    if (finalAnswer.includes(reasoningStartTag) && finalAnswer.includes(reasoningEndTag)) {
      const reasoningStart = finalAnswer.indexOf(reasoningStartTag)
      const reasoningEnd = finalAnswer.indexOf(reasoningEndTag)
      finalAnswer = finalAnswer.substring(0, reasoningStart) + finalAnswer.substring(reasoningEnd + reasoningEndTag.length)
    } else if (finalAnswer.includes(reasoningStartTag)) {
      // 推理过程未完成，移除开始标记之后的所有内容
      finalAnswer = finalAnswer.substring(0, finalAnswer.indexOf(reasoningStartTag))
    }

    // 处理最终答案标记
    if (finalAnswer.includes(answerStartTag)) {
      const answerStart = finalAnswer.indexOf(answerStartTag)
      const answerEnd = finalAnswer.indexOf(answerEndTag)
      if (answerStart !== -1 && answerEnd !== -1) {
        finalAnswer = finalAnswer.substring(answerStart + answerStartTag.length, answerEnd)
      } else if (answerStart !== -1) {
        finalAnswer = finalAnswer.substring(answerStart + answerStartTag.length)
      }
    }

    // 清理多余空格和空行
    finalAnswer = finalAnswer.trim().replace(/\n\s*\n\s*\n/g, '\n\n')

    // 解析Markdown
    try {
      const htmlResult = marked.parse(finalAnswer)
      message.content = htmlResult
    } catch (e) {
      console.error('Markdown解析失败:', e)
      message.content = finalAnswer
    }
  }
}

// 切换推理过程展开/收起
const toggleReasoning = (message) => {
  message.reasoningExpanded = !message.reasoningExpanded
}

// 获取用于复制的内容（包括推理内容）
const getCopyContent = (message) => {
  let content = message.content || ''
  if (message.reasoningContent) {
    content = `深度推理过程：\n${message.reasoningContent}\n\n最终答案：\n${content}`
  }
  return content
}

// 复制消息
const copyMessage = (content) => {
  navigator.clipboard.writeText(content).then(() => {
    ElMessage.success('复制成功!')
  }).catch(() => {
    ElMessage.error('复制失败!')
  })
}

// 重新发送/重新生成消息
const retryMessage = async (message) => {
  if (isSending.value) {
    ElMessage.warning('正在处理中，请稍候...')
    return
  }

  // 从localStorage读取当前开关状态
  let onlineSearch = false
  let deepReasoning = false
  try {
    const raw = localStorage.getItem('chatConfig')
    if (raw) {
      const parsed = JSON.parse(raw)
      onlineSearch = !!parsed.isInternetSearchEnabled
      deepReasoning = !!parsed.isDeepReasoningEnabled
    }
  } catch (error) {
    console.error('读取配置失败:', error)
  }

  if (message.role === 'user') {
    // 用户消息：重新发送
    let content = message.content.trim()
    sendMessage({ content, files: [], onlineSearch, deepReasoning })
  } else {
    // AI消息：重新生成（找到对应的用户消息）
    const session = currentSession.value
    const index = session.messages.findIndex(m => m.id === message.id)

    if (index > 0) {
      // 找到前一条用户消息
      const userMessage = session.messages[index - 1]
      if (userMessage.role === 'user') {
        // 删除当前AI消息
        session.messages.splice(index, 1)
        // 重新发送用户消息（使用当前开关状态）
        let content = userMessage.content.trim()
        sendMessage({ content, files: [], onlineSearch, deepReasoning })
      }
    }
  }
}

// 删除消息
const deleteMessage = (messageId) => {
  const session = currentSession.value
  const index = session.messages.findIndex(m => m.id === messageId)

  if (index > -1) {
    // 如果删除的是用户消息，同时删除对应的AI回复
    const messageToDelete = session.messages[index]
    if (messageToDelete.role === 'user') {
      // 检查下一条消息是否是AI回复，如果是则一起删除
      if (index + 1 < session.messages.length && session.messages[index + 1].role === 'assistant') {
        session.messages.splice(index, 2)
      } else {
        session.messages.splice(index, 1)
      }
    } else {
      // 删除AI回复
      session.messages.splice(index, 1)
    }
    ElMessage.success('消息已删除')
  }
}

// 从HTML中提取纯文本（用于语音播报）
const extractTextFromHtml = (html) => {
  if (!html) return ''

  // 创建临时DOM元素来解析HTML
  const tempDiv = document.createElement('div')
  tempDiv.innerHTML = html

  // 移除代码块（通常不需要播报代码）
  const codeBlocks = tempDiv.querySelectorAll('pre, code')
  codeBlocks.forEach(block => {
    // 对于代码块，只保留简短说明，不播报具体代码
    block.textContent = '[代码]'
  })

  // 获取纯文本
  let text = tempDiv.textContent || tempDiv.innerText || ''

  // 清理多余的空格和换行
  text = text.replace(/\s+/g, ' ').trim()

  // 移除特殊符号的多余显示（如某些markdown符号）
  text = text.replace(/[#*_`~\[\](){}|\\]/g, '')

  return text
}

// 切换语音播报
const toggleSpeak = (message) => {
  // 如果当前正在播报这条消息，则停止播报
  if (speakingMessageId.value === message.id) {
    stopSpeaking()
    return
  }

  // 如果正在播报其他消息，先停止
  if (speakingMessageId.value) {
    stopSpeaking()
  }

  // 开始播报当前消息
  startSpeaking(message)
}

// 开始语音播报
const startSpeaking = (message) => {
  // 检查浏览器是否支持语音合成
  if (!('speechSynthesis' in window)) {
    ElMessage.error('您的浏览器不支持语音播报功能')
    return
  }

  // 获取最终答案的纯文本内容（不包含推理过程）
  const textToSpeak = extractTextFromHtml(message.content)

  if (!textToSpeak) {
    ElMessage.warning('没有可播报的内容')
    return
  }

  // 停止当前正在进行的播报
  window.speechSynthesis.cancel()

  // 创建新的语音合成实例
  const utterance = new SpeechSynthesisUtterance(textToSpeak)

  // 设置中文语音
  utterance.lang = 'zh-CN'
  utterance.rate = 1.0  // 语速
  utterance.pitch = 1.0 // 音调
  utterance.volume = 1.0 // 音量

  // 尝试获取中文语音
  const voices = window.speechSynthesis.getVoices()
  const chineseVoice = voices.find(voice => voice.lang.startsWith('zh'))
  if (chineseVoice) {
    utterance.voice = chineseVoice
  }

  // 播报开始时
  utterance.onstart = () => {
    speakingMessageId.value = message.id
    speechUtterance.value = utterance
  }

  // 播报结束时
  utterance.onend = () => {
    speakingMessageId.value = null
    speechUtterance.value = null
  }

  // 播报出错时
  utterance.onerror = (event) => {
    console.error('语音播报错误:', event.error)
    speakingMessageId.value = null
    speechUtterance.value = null
    if (event.error !== 'interrupted' && event.error !== 'canceled') {
      ElMessage.error('语音播报出错，请稍后重试')
    }
  }

  // 开始播报
  window.speechSynthesis.speak(utterance)
}

// 停止语音播报
const stopSpeaking = () => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel()
  }
  speakingMessageId.value = null
  speechUtterance.value = null
}

// 语音流式消息相关状态变量
let voiceStreamingMessageId = null // 用于追踪当前正在流式输出的AI消息
let voiceStreamingRawContent = '' // 保存原始内容用于Markdown解析
let voiceReasoningStartTime = null // 推理开始时间
let voiceStreamCompleted = false // 标记流式内容是否已完成
let voiceUploadId = null // 保存语音上传ID用于续传
let voiceOnlineSearch = false // 语音消息的联网搜索配置
let voiceDeepReasoning = false // 语音消息的深度推理配置

// 获取当前聊天配置
const getVoiceChatConfig = () => {
  let onlineSearch = false
  let deepReasoning = false
  try {
    const raw = localStorage.getItem('chatConfig')
    if (raw) {
      const parsed = JSON.parse(raw)
      onlineSearch = !!parsed.isInternetSearchEnabled
      deepReasoning = !!parsed.isDeepReasoningEnabled
    }
  } catch (error) {
    console.error('读取配置失败:', error)
  }
  return { onlineSearch, deepReasoning }
}

// 处理语音消息（后端返回识别结果和AI回复）
const handleVoiceMessage = (data) => {
  const { recognizedText, responseContent, duration, attachmentId, uploadId, isUploading } = data

  // 查找最后一条用户语音消息（用于更新上传中的消息）
  const lastUserMessage = currentSession.value.messages
    .slice()
    .reverse()
    .find(m => m.role === 'user' && m.isVoice && (!m.attachmentId || m.isUploading))

  if (isUploading && !lastUserMessage) {
    // 上传中的新消息，立即显示
    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: '',
      isVoice: true,
      voiceDuration: duration || 0,
      attachmentId: '',
      uploadId: '',
      isUploading: true,
      time: new Date().toLocaleTimeString()
    }
    currentSession.value.messages.push(userMessage)

    // 立即滚动到底部
    scrollToBottom(false, true)

    // 创建AI占位符消息
    createVoiceAssistantPlaceholder()
  } else if (!isUploading && lastUserMessage) {
    // 上传完成，更新已有消息
    lastUserMessage.attachmentId = attachmentId || ''
    lastUserMessage.uploadId = uploadId || ''
    lastUserMessage.isUploading = false

    // 添加AI回复（仅用于非流式响应的兼容）
    if (responseContent && !voiceStreamingMessageId) {
      const { deepReasoning } = getVoiceChatConfig()
      const assistantMessage = reactive({
        id: Date.now() + 1,
        role: 'assistant',
        content: '',
        rawContent: responseContent,
        reasoningContent: '',
        reasoningRawContent: '',
        reasoningExpanded: true,
        reasoningCompleted: false,
        isReasoning: false,
        reasoningDuration: null,
        isComplete: true,
        isLastGenerating: false,
        tokens: null,
        time: new Date().toLocaleTimeString()
      })
      // 解析Markdown
      parseMarkdown(assistantMessage)
      currentSession.value.messages.push(assistantMessage)

      // 滚动到底部
      nextTick(() => scrollToBottom(false, true))
    }
  } else {
    // 正常情况（非即时显示），直接添加新消息
    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: '',
      isVoice: true,
      voiceDuration: duration || 0,
      attachmentId: attachmentId || '',
      uploadId: uploadId || '',
      time: new Date().toLocaleTimeString()
    }
    currentSession.value.messages.push(userMessage)

    // 立即滚动到底部
    scrollToBottom(false, true)

    // 添加AI回复（仅用于非流式响应的兼容）
    if (responseContent && !voiceStreamingMessageId) {
      const { deepReasoning } = getVoiceChatConfig()
      const assistantMessage = reactive({
        id: Date.now() + 1,
        role: 'assistant',
        content: '',
        rawContent: responseContent,
        reasoningContent: '',
        reasoningRawContent: '',
        reasoningExpanded: true,
        reasoningCompleted: false,
        isReasoning: false,
        reasoningDuration: null,
        isComplete: true,
        isLastGenerating: false,
        tokens: null,
        time: new Date().toLocaleTimeString()
      })
      // 解析Markdown
      parseMarkdown(assistantMessage)
      currentSession.value.messages.push(assistantMessage)

      // 滚动到底部
      nextTick(() => scrollToBottom(false, true))
    }
  }
}

// 为语音消息创建AI占位符（确保立即显示加载状态）
const createVoiceAssistantPlaceholder = () => {
  const { deepReasoning } = getVoiceChatConfig()

  // 检查是否已经存在占位符，避免重复创建
  const existingPlaceholder = currentSession.value.messages
    .slice()
    .reverse()
    .find(m => m.role === 'assistant' && m.isPlaceholder)

  if (existingPlaceholder) {
    return existingPlaceholder
  }

  // 重置流式完成标志，准备接收新的语音消息
  voiceStreamCompleted = false

  // 设置生成状态，让用户知道系统正在处理
  isGenerating.value = true
  isTyping.value = false

  // 创建一个临时的AI消息占位符，提升用户体验
  const assistantMessage = reactive({
    id: Date.now() + 1,
    role: 'assistant',
    content: '',
    rawContent: '',
    reasoningContent: '',
    reasoningRawContent: '',
    reasoningExpanded: true,
    reasoningCompleted: false,
    isReasoning: !!deepReasoning,
    reasoningStartTime: deepReasoning ? Date.now() : null,
    reasoningDuration: null,
    isComplete: false,
    isLastGenerating: true,
    tokens: null,
    time: new Date().toLocaleTimeString(),
    isPlaceholder: true // 标记为占位符
  })
  currentSession.value.messages.push(assistantMessage)


  // 滚动到底部
  nextTick(() => scrollToBottom(false, true))

  return assistantMessage
}

// 处理语音流式内容
const handleVoiceChunk = (data) => {
  const { content } = data

  // 获取当前配置
  const { onlineSearch, deepReasoning } = getVoiceChatConfig()

  // 保存配置用于续传
  voiceOnlineSearch = onlineSearch
  voiceDeepReasoning = deepReasoning

  // 设置生成状态和正在输入状态
  // 只有在流式未完成时才设置 isGenerating = true
  if (!voiceStreamCompleted) {
    isGenerating.value = true
  }
  isTyping.value = false // 收到内容后不显示"正在输入"

  // 如果还没有创建AI消息，先检查是否有占位符需要复用
  if (!voiceStreamingMessageId) {
    // 查找之前创建的占位符消息
    const placeholderMessage = currentSession.value.messages
      .slice()
      .reverse()
      .find(m => m.role === 'assistant' && m.isPlaceholder)

    if (placeholderMessage) {
      // 复用占位符消息
      voiceStreamingMessageId = placeholderMessage.id
      // 保持占位符的推理开始时间，如果没有则重新设置
      if (!voiceReasoningStartTime && deepReasoning) {
        voiceReasoningStartTime = Date.now()
        placeholderMessage.reasoningStartTime = voiceReasoningStartTime
      } else {
        voiceReasoningStartTime = placeholderMessage.reasoningStartTime
      }
      voiceStreamingRawContent = '' // 重置原始内容

      // 移除占位符标记
      delete placeholderMessage.isPlaceholder

      // 确保深度推理状态正确
      if (deepReasoning && !placeholderMessage.isReasoning) {
        placeholderMessage.isReasoning = true
      }

      // 设置当前正在生成的消息
      currentGeneratingMessage.value = placeholderMessage

    } else {
      // 记录推理开始时间
      voiceReasoningStartTime = deepReasoning ? Date.now() : null
      voiceStreamingRawContent = '' // 重置原始内容

      const assistantMessage = reactive({
        id: Date.now(),
        role: 'assistant',
        content: '',
        rawContent: '',
        reasoningContent: '',
        reasoningRawContent: '',
        reasoningExpanded: true,
        reasoningCompleted: false,
        isReasoning: !!deepReasoning,
        reasoningStartTime: voiceReasoningStartTime,
        reasoningDuration: null,
        isComplete: false,
        isLastGenerating: true,
        tokens: null,
        time: new Date().toLocaleTimeString()
      })

      currentSession.value.messages.push(assistantMessage)
      voiceStreamingMessageId = assistantMessage.id

      // 设置当前正在生成的消息
      currentGeneratingMessage.value = assistantMessage

    }

    // 滚动到底部
    nextTick(() => scrollToBottom(false, true))
  }

  // 找到当前流式消息并更新内容
  const streamingMessage = currentSession.value.messages.find(m => m.id === voiceStreamingMessageId)
  if (streamingMessage) {
    // 累加原始内容
    voiceStreamingRawContent += content

    // 使用与文字消息相同的解析逻辑
    parseContentAndReasoning(
      streamingMessage,
      voiceStreamingRawContent,
      voiceReasoningStartTime,
      deepReasoning
    )

    // 平滑滚动到底部
    nextTick(() => scrollToBottom(true, false))
  }
}

// 处理语音完成（上传完成，开始接收AI回复）
const handleVoiceComplete = (data) => {
  const { attachmentId, uploadId, duration } = data

  // 更新用户语音消息的attachmentId和uploadId
  // 优先查找正在上传的消息，如果没有则查找最后一条没有attachmentId的语音消息
  let lastUserMessage = currentSession.value.messages
    .slice()
    .reverse()
    .find(m => m.role === 'user' && m.isVoice && m.isUploading)

  if (!lastUserMessage) {
    // 如果没有找到正在上传的消息，查找最后一条没有attachmentId的语音消息
    lastUserMessage = currentSession.value.messages
      .slice()
      .reverse()
      .find(m => m.role === 'user' && m.isVoice && (!m.attachmentId || m.attachmentId === ''))
  }

  if (lastUserMessage) {
    lastUserMessage.attachmentId = attachmentId || ''
    lastUserMessage.uploadId = uploadId || '' // uploadId 用于获取语音数据
    lastUserMessage.voiceDuration = duration || lastUserMessage.voiceDuration
    lastUserMessage.isUploading = false
  } else {
    console.warn('[ChatPage] 未找到需要更新的用户语音消息')
  }

  // 流式内容接收完成，立即释放麦克风按钮锁定
  voiceStreamCompleted = true
  isGenerating.value = false
}

// 处理语音上传全部完成
const handleVoiceUploadComplete = (data) => {
  const { attachmentId, uploadId, duration } = data

  // 找到当前流式消息并完成解析
  const streamingMessage = currentSession.value.messages.find(m => m.id === voiceStreamingMessageId)
  if (streamingMessage) {
    // 如果推理已完成但还没有计算推理时长，现在计算
    if (streamingMessage.reasoningCompleted && !streamingMessage.reasoningDuration && voiceReasoningStartTime) {
      const reasoningEndTime = Date.now()
      const reasoningElapsed = reasoningEndTime - voiceReasoningStartTime
      streamingMessage.reasoningDuration = `${(reasoningElapsed / 1000).toFixed(1)}秒`
    }
    // 标记消息完成
    streamingMessage.isComplete = true
    streamingMessage.isLastGenerating = false
    // 最终解析Markdown
    parseMarkdown(streamingMessage)
  }

  // 清除流式消息ID和状态变量，为下次语音做准备
  voiceStreamingMessageId = null
  voiceStreamingRawContent = ''
  voiceReasoningStartTime = null
  voiceStreamCompleted = false // 重置流式完成标志

  // 结束生成状态
  isGenerating.value = false
  isPaused.value = false
  currentGeneratingMessage.value = null

  // 更新用户语音消息的attachmentId和uploadId（如果还没有更新）
  // 优先查找正在上传的消息，如果没有则查找没有attachmentId的语音消息
  let lastUserMessage = currentSession.value.messages
    .slice()
    .reverse()
    .find(m => m.role === 'user' && m.isVoice && m.isUploading)

  if (!lastUserMessage) {
    lastUserMessage = currentSession.value.messages
      .slice()
      .reverse()
      .find(m => m.role === 'user' && m.isVoice && (!m.attachmentId || m.attachmentId === ''))
  }

  if (lastUserMessage && (!lastUserMessage.attachmentId || lastUserMessage.attachmentId === '')) {
    lastUserMessage.attachmentId = attachmentId || ''
    lastUserMessage.uploadId = uploadId || ''
    lastUserMessage.voiceDuration = duration || lastUserMessage.voiceDuration
    lastUserMessage.isUploading = false
  }
}

// 处理语音元数据更新（如获取到uploadId时立即更新消息）
const handleVoiceMetadataUpdate = (data) => {
  const { uploadId } = data

  // 保存 uploadId 用于续传
  if (uploadId) {
    voiceUploadId = uploadId
  }

  // 查找正在上传的用户语音消息
  const lastUserMessage = currentSession.value.messages
    .slice()
    .reverse()
    .find(m => m.role === 'user' && m.isVoice && m.isUploading && !m.uploadId)

  if (lastUserMessage && uploadId) {
    lastUserMessage.uploadId = uploadId
  }
}

// 格式化语音时长显示
const formatVoiceDuration = (seconds) => {
  if (!seconds || seconds < 0.5) return '1"' // 最小显示1秒
  // 向上取整，确保不显示0秒
  const roundedSeconds = Math.ceil(seconds)
  if (roundedSeconds < 60) return `${roundedSeconds}"`
  const minutes = Math.floor(roundedSeconds / 60)
  const remainingSeconds = roundedSeconds % 60
  return remainingSeconds > 0 ? `${minutes}'${remainingSeconds}"` : `${minutes}'`
}

// 播放用户语音消息
const playVoiceMessage = async (message) => {
  if (playingVoiceMessageId.value === message.id) {
    // 停止播放
    stopVoiceMessage()
    return
  }

  // 停止之前的播放
  stopVoiceMessage()
  playingVoiceMessageId.value = message.id

  // 检查是否有 uploadId（用于获取语音数据）
  if (!message.uploadId) {
    console.error('[语音播放] 语音消息没有 uploadId，无法播放')
    ElMessage.error('语音文件不存在，无法播放')
    playingVoiceMessageId.value = null
    return
  }

  try {
    // 请求语音接口获取音频数据（base64格式），使用 uploadId
    const audioUrl = `/api/v1/docsearch/voice/session/${message.uploadId}`

    const response = await fetch(audioUrl)

    if (!response.ok) {
      throw new Error(`获取音频失败: ${response.status} ${response.statusText}`)
    }

    // 解析JSON响应，后端返回格式: { audio_data: "base64编码的音频数据" }
    const jsonData = await response.json()

    if (!jsonData.audio_data) {
      throw new Error('响应中没有 audio_data 字段')
    }

    // 将base64数据转换为Audio可以播放的格式
    const base64Audio = jsonData.audio_data

    // 检查是否已经有数据前缀（如 data:audio/wav;base64,）
    let audioSrc
    if (base64Audio.startsWith('data:')) {
      audioSrc = base64Audio
    } else {
      // 添加base64前缀，假设是wav格式
      audioSrc = `data:audio/wav;base64,${base64Audio}`
    }

    // 创建Audio对象并播放
    voiceAudio = new Audio(audioSrc)

    // 音频可以播放时开始播放
    voiceAudio.oncanplay = () => {
      voiceAudio.play().catch(err => {
        console.error('[语音播放] 播放失败:', err)
        ElMessage.error('语音播放失败')
        stopVoiceMessage()
      })
    }

    // 音频播放完成时清除播放状态
    voiceAudio.onended = () => {
      stopVoiceMessage()
    }

    // 音频加载失败时清除播放状态
    voiceAudio.onerror = (e) => {
      console.error('[语音播放] 音频加载失败:', e)
      ElMessage.error('语音加载失败')
      stopVoiceMessage()
    }

    // 设置超时作为备用
    const timeout = (message.voiceDuration || 5) * 1000 + 3000
    setTimeout(() => {
      if (playingVoiceMessageId.value === message.id) {
        stopVoiceMessage()
      }
    }, timeout)

  } catch (error) {
    console.error('[语音播放] 获取音频失败:', error)
    console.error('[语音播放] 错误堆栈:', error.stack)
    ElMessage.error(`获取语音文件失败: ${error.message}`)
    playingVoiceMessageId.value = null
  }
}

// 停止语音消息播放
const stopVoiceMessage = () => {
  if (voiceAudio) {
    voiceAudio.pause()
    voiceAudio.currentTime = 0 // 重置播放位置
    voiceAudio = null
  }
  playingVoiceMessageId.value = null
}

// 设置录音状态
const setRecordingState = (recording) => {
  isRecording.value = recording

  if (recording) {
    // 开始录音时初始化波形显示并滚动到底部
    nextTick(() => {
      initWaveformCanvas()
      scrollToBottom(false, true) // 确保滚动到底部显示波形
    })
  } else {
    // 停止录音时停止波形动画
    if (waveformAnimationId) {
      cancelAnimationFrame(waveformAnimationId)
      waveformAnimationId = null
    }
  }
}

// 初始化会话（用于语音输入前的会话创建）
const initializeConversation = async () => {
  const sessionRef = currentSession.value

  // 如果已有后端会话ID，直接返回
  if (sessionRef.backendConversationId) {
    return sessionRef.backendConversationId
  }

  try {
    // 调用后端API初始化会话（发送一个空消息来获取conversation_id）
    // 使用流式响应以正确获取metadata中的conversation_id
    const result = await intelligentQuery(
      {
        query: '', // 空查询，仅用于初始化会话
        mode: 'general',
        conversation_id: null,
        model_name: selectedModel.value,
        stream: true, // 使用流式响应
        online_search: false,
        deep_reasoning: false
      },
      null, // onChunk - 不需要处理内容数据
      (metadata) => {
        // onMetadata - 接收会话ID
        if (metadata.conversation_id) {
          sessionRef.backendConversationId = metadata.conversation_id
        }
      },
      null, // onError
      null  // onComplete
    )

    // 从结果中获取conversation_id（如果metadata回调没有触发）
    if (result && result.conversation_id) {
      sessionRef.backendConversationId = result.conversation_id
    }

    return sessionRef.backendConversationId
  } catch (error) {
    console.error('[初始化会话] 失败:', error)
    throw error
  }
}

// 更新波形数据
const updateWaveformData = (audioData) => {
  waveformData = audioData
  // 波形会在下一帧通过 drawWaveform 绘制
}

// 初始化波形canvas
const initWaveformCanvas = () => {
  const canvas = waveformCanvas.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  const dpr = window.devicePixelRatio || 1
  // 使用 chat-messages-content 的宽度，而不是父元素的宽度
  const messagesContainer = document.querySelector('.chat-messages-content')
  const containerWidth = messagesContainer ? messagesContainer.offsetWidth : canvas.parentElement.offsetWidth

  canvas.width = containerWidth * dpr
  canvas.height = 100 * dpr
  ctx.scale(dpr, dpr)

  // 开始绘制波形
  drawWaveform(ctx, containerWidth, 100)
}

// 绘制波形 - 更有质感的设计
const drawWaveform = (ctx, width, height) => {
  if (!isRecording.value) return

  waveformAnimationId = requestAnimationFrame(() => drawWaveform(ctx, width, height))

  // 清空画布
  ctx.clearRect(0, 0, width, height)

  if (!waveformData || waveformData.length === 0) return

  // 高级感波形 - 镜像对称设计，更有质感
  const barCount = 80
  const centerX = width / 2
  const maxBarHeight = height * 0.35

  for (let i = 0; i < barCount; i++) {
    const dataIndex = Math.floor(i * waveformData.length / barCount)
    const value = waveformData[dataIndex] / 255

    // 使用非线性变换让小值也有一定高度，更有动感
    const enhancedValue = Math.pow(value, 0.7)
    const barHeight = Math.max(2, enhancedValue * maxBarHeight)

    // 从中心向两侧扩散
    const distanceFromCenter = Math.abs(i - barCount / 2)
    const offset = distanceFromCenter * (width * 0.6 / barCount)

    // 渐变色 - 更有质感的绿色渐变
    const gradient = ctx.createLinearGradient(0, height / 2 - barHeight, 0, height / 2 + barHeight)
    gradient.addColorStop(0, 'rgba(34, 197, 94, 0.1)')   // 顶部淡色
    gradient.addColorStop(0.3, 'rgba(34, 197, 94, 0.6)') // 中上
    gradient.addColorStop(0.5, 'rgba(34, 197, 94, 1)')   // 中心最亮
    gradient.addColorStop(0.7, 'rgba(34, 197, 94, 0.6)') // 中下
    gradient.addColorStop(1, 'rgba(34, 197, 94, 0.1)')   // 底部淡色

    ctx.fillStyle = gradient

    // 绘制圆角柱状 - 垂直居中
    const y = (height - barHeight) / 2
    const barWidth = Math.max(2, (width * 0.6 / barCount) * 0.7)
    const radius = barWidth / 2

    ctx.beginPath()
    ctx.roundRect(centerX - barWidth / 2 + (i < barCount / 2 ? -offset : offset), y, barWidth, barHeight, radius)
    ctx.fill()
  }
}

// 滚动到底部（智能版：如果用户在底部附近则自动滚动，否则不打扰用户）
// @param smooth - 是否平滑滚动
// @param force - 是否强制滚动（忽略用户位置，用于发送消息、重试等操作）
const scrollToBottom = (smooth = true, force = false) => {
  nextTick(() => {
    const container = messagesContainer.value
    if (container) {
      // 强制滚动时直接滚动到底部
      if (force) {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: smooth ? 'smooth' : 'auto'
        })
        return
      }

      // 检测用户当前是否在底部附近（100px以内）
      const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight
      const isUserNearBottom = distanceFromBottom < 100

      // 只有当用户在底部附近时才自动滚动
      // 如果用户向上滚动查看内容，不要强制拉回底部
      if (isUserNearBottom) {
        const targetScrollTop = container.scrollHeight
        container.scrollTop = targetScrollTop
      }
    }
  })
}

// 设置选中的模型
const setSelectedModel = (modelId) => {
  if (modelConfig.value[modelId]) {
    selectedModel.value = modelId
  } else {
    console.warn('未找到模型配置:', modelId)
  }
}

// 创建新会话
const createNewSession = () => {
  const newSessionId = `session-${Date.now()}`
  const newSession = {
    id: newSessionId,
    title: '新对话',
    messages: [],
    conversationHistory: [],
    createdAt: new Date().toISOString(),
    documentIds: [] // 新会话初始化空的文档ID数组
  }

  chatSessions.value.unshift(newSession)
  currentSessionId.value = newSessionId

  // 重置深度推理和联网搜索开关状态为默认关闭
  try {
    localStorage.setItem('chatConfig', JSON.stringify({
      isInternetSearchEnabled: false,
      isDeepReasoningEnabled: false
    }))
  } catch (error) {
    console.error('重置开关状态失败:', error)
  }

  saveChatHistory()

  return newSessionId
}

// 切换会话
const switchSession = (sessionId) => {
  currentSessionId.value = sessionId
  saveChatHistory()
  scrollToBottom(false, true)  // 切换会话时强制滚动到底部
}

// 删除会话
const deleteSession = (sessionId) => {
  const index = chatSessions.value.findIndex(session => session.id === sessionId)
  if (index > -1) {
    chatSessions.value.splice(index, 1)
    
    if (currentSessionId.value === sessionId && chatSessions.value.length > 0) {
      currentSessionId.value = chatSessions.value[0].id
    }
    
    saveChatHistory()
  }
}

// 保存聊天记录到本地存储（与用户ID绑定，实现多账号聊天记录隔离）
const saveChatHistory = () => {
  const userId = userState.userId || 'guest'
  const storageKey = `chatHistory_${userId}`

  // 序列化会话时包含 backendConversationId
  const serializedSessions = chatSessions.value.map(session => ({
    ...session,
    // 确保 backendConversationId 被保存
    backendConversationId: session.backendConversationId || null
  }))

  localStorage.setItem(storageKey, JSON.stringify({
    chatSessions: serializedSessions,
    currentSessionId: currentSessionId.value,
    selectedModel: selectedModel.value
  }))
}

// 从本地存储加载聊天记录（与用户ID绑定）
const loadChatHistory = () => {
  const userId = userState.userId || 'guest'
  const storageKey = `chatHistory_${userId}`
  const savedHistory = localStorage.getItem(storageKey)
  if (savedHistory) {
    try {
      const { chatSessions: savedSessions, currentSessionId: savedSessionId, selectedModel: savedModel } = JSON.parse(savedHistory)
      
      if (savedSessions && savedSessions.length > 0) {
        chatSessions.value = savedSessions
      }
      
      if (savedSessionId) {
        currentSessionId.value = savedSessionId
      }
      
      if (savedModel) {
        selectedModel.value = savedModel
      }
      
      scrollToBottom()
    } catch (error) {
      console.error('加载聊天记录失败:', error)
      initializeDefaultSession()
    }
  } else {
    initializeDefaultSession()
  }
}

// 初始化默认会话
const initializeDefaultSession = () => {
  scrollToBottom()
}

// 监听聊天会话变化，自动保存
watch(
  () => chatSessions.value,
  () => {
    saveChatHistory()
  },
  { deep: true }
)

// 监听当前会话变化，自动保存
watch(
  () => currentSessionId.value,
  () => {
    saveChatHistory()
  }
)

// 监听模型变化，自动保存
watch(
  () => selectedModel.value,
  () => {
    saveChatHistory()
  }
)

// 监听用户ID变化，切换账号时重新加载聊天历史
// 使用 flush: 'post' 确保在响应式更新完成后执行
watch(
  () => [userState.userId, userState.isLoggedIn],
  ([newUserId, isLoggedIn], [oldUserId, wasLoggedIn]) => {
    // 当用户ID或登录状态变化时，重新加载聊天历史
    if (newUserId !== oldUserId || isLoggedIn !== wasLoggedIn) {
      // 先重置为默认会话
      chatSessions.value = [
        {
          id: 'session-1',
          title: '新对话',
          messages: [],
          conversationHistory: [],
          createdAt: new Date().toISOString(),
          documentIds: []
        }
      ]
      currentSessionId.value = 'session-1'

      // 使用 nextTick 确保 DOM 更新后再加载历史
      nextTick(() => {
        loadChatHistory()
      })
    }
  },
  { flush: 'post' }
)

// 生命周期钩子
onMounted(() => {
  // 使用 nextTick 确保 userState 已经从 localStorage 初始化完成
  nextTick(() => {
    loadChatHistory()

    // 如果从 HistoryPage 带有 sessionId 查询参数，则切换到对应会话
    const initialSessionId = Array.isArray(route.query.sessionId)
      ? route.query.sessionId[0]
      : route.query.sessionId
    if (initialSessionId) {
      const target = chatSessions.value.find(session => session.id === initialSessionId)
      if (target) {
        currentSessionId.value = initialSessionId
      }
    }
  })

  // 监听路由参数变化，支持在聊天页内通过修改 query 切换会话
  watch(
    () => route.query.sessionId,
    (newVal) => {
      const sessionId = Array.isArray(newVal) ? newVal?.[0] : newVal
      if (!sessionId) return
      const target = chatSessions.value.find(session => session.id === sessionId)
      if (target && target.id !== currentSessionId.value) {
        currentSessionId.value = target.id
        scrollToBottom()
      }
    }
  )

  window.addEventListener('resize', () => {
    scrollToBottom(false)
  })
})

// 处理语音上传被中止（用户点击暂停）
const handleVoiceAborted = () => {
  // 保存当前生成状态，允许续传
  if (voiceStreamingMessageId) {
    const streamingMessage = currentSession.value.messages.find(m => m.id === voiceStreamingMessageId)
    if (streamingMessage) {
      // 保存已生成的内容到消息对象
      streamingMessage.rawContent = voiceStreamingRawContent
      // 保存语音相关状态到消息对象，用于续传
      streamingMessage.voiceUploadId = voiceUploadId
      streamingMessage.voiceOnlineSearch = voiceOnlineSearch
      streamingMessage.voiceDeepReasoning = voiceDeepReasoning
      streamingMessage.voiceReasoningStartTime = voiceReasoningStartTime
      // 标记为暂停状态，显示继续生成按钮
      streamingMessage.isLastGenerating = true
      streamingMessage.isPaused = true
      streamingMessage.isVoiceGeneration = true  // 标记这是语音生成
    }
  }

  // 重置生成状态但不清除语音相关状态变量（用于续传）
  isGenerating.value = false
  isPaused.value = true
  currentGeneratingMessage.value = null
}

// 处理录音状态变化
const handleRecordingStateChanged = (data) => {
  isRecording.value = data.isRecording
}

// 处理音频数据可用
const handleAudioDataAvailable = (data) => {
  // 处理音频数据
  if (data.audioData) {
    // 可以用于波形显示等
  }
}

// 继续语音生成
const continueVoiceGeneration = async (message) => {
  // 从消息对象中获取保存的语音状态
  const savedUploadId = message.voiceUploadId || voiceUploadId
  const savedOnlineSearch = message.voiceOnlineSearch !== undefined ? message.voiceOnlineSearch : voiceOnlineSearch
  const savedDeepReasoning = message.voiceDeepReasoning !== undefined ? message.voiceDeepReasoning : voiceDeepReasoning
  const savedReasoningStartTime = message.voiceReasoningStartTime || voiceReasoningStartTime || message.reasoningStartTime
  let savedRawContent = message.rawContent || voiceStreamingRawContent

  if (!savedUploadId) {
    ElMessage.warning('无法继续生成，语音上传ID丢失')
    return
  }

  if (!savedRawContent) {
    ElMessage.warning('无法继续生成，没有已生成的内容')
    return
  }

  // 保存原始内容，以便清理后为空时使用
  const originalRawContent = savedRawContent

  // 重要：移除推理标签！续传时后端不需要推理标签
  const reasoningStartTag = '<推理过程>'
  const reasoningEndTag = '</推理过程>'
  const answerStartTag = '<最终答案>'
  const answerEndTag = '</最终答案>'

  // 如果包含推理标签，只保留最终答案部分（不含标签）
  if (savedRawContent.includes(answerStartTag)) {
    const answerStart = savedRawContent.indexOf(answerStartTag)
    const answerEnd = savedRawContent.indexOf(answerEndTag)
    if (answerEnd !== -1) {
      // 完整的最终答案，提取标签之间的内容
      savedRawContent = savedRawContent.substring(answerStart + answerStartTag.length, answerEnd)
    } else if (answerStart !== -1) {
      // 答案还在生成中，提取开始标签之后的内容（可能包含未完成的答案）
      savedRawContent = savedRawContent.substring(answerStart + answerStartTag.length)
    }
  } else if (savedRawContent.includes(reasoningStartTag)) {
    // 只有推理标签，没有最终答案标签
    const reasoningEnd = savedRawContent.indexOf(reasoningEndTag)
    if (reasoningEnd !== -1) {
      // 推理已完成，取推理之后的内容
      savedRawContent = savedRawContent.substring(reasoningEnd + reasoningEndTag.length)
    } else {
      // 推理还在进行中，移除未完成的推理标签和内容
      // 续传时不应该发送推理内容，让后端重新开始推理
      savedRawContent = ''
    }
  }

  savedRawContent = savedRawContent.trim()

  // 如果清理后内容为空，使用原始内容进行续传
  if (!savedRawContent) {
    savedRawContent = originalRawContent.trim()
  }

  if (!savedRawContent) {
    ElMessage.warning('没有可继续的内容')
    return
  }

  try {
    isGenerating.value = true
    isPaused.value = false
    voiceStreamCompleted = false

    // 创建新的AbortController
    currentAbortController.value = new AbortController()

    // 从会话中查找消息对象，确保使用响应式引用
    const assistantMessage = currentSession.value.messages.find(m => m.id === message.id) || message
    assistantMessage.isComplete = false
    assistantMessage.isLastGenerating = true
    assistantMessage.isPaused = false
    currentGeneratingMessage.value = assistantMessage

    let rawContent = savedRawContent

    // 恢复语音状态变量
    voiceUploadId = savedUploadId
    voiceOnlineSearch = savedOnlineSearch
    voiceDeepReasoning = savedDeepReasoning
    voiceStreamingRawContent = rawContent
    voiceStreamingMessageId = assistantMessage.id
    voiceReasoningStartTime = savedReasoningStartTime

    // 用于检测后端返回模式（只在第一个chunk时判断一次）
    let detectedBackendMode = null  // 'incremental' 或 'full'

    // 使用 voice.js API 继续生成
    const { voiceApi } = await import('../api/voice.js')

    // 创建新的上传器（只调用 complete 方法，传入 continue_from_content）
    const uploader = voiceApi.createUploader(currentSession.value.backendConversationId, {
      modelName: selectedModel.value,
      onlineSearch: savedOnlineSearch,
      deepReasoning: savedDeepReasoning,
      temperature: 0.5,
      maxHistory: 6
    })

    // 设置 AbortController
    uploader.setAbortController(currentAbortController.value)

    // 使用 continue 方法进行续传
    await uploader.continue(
      savedUploadId,
      rawContent,  // continueFromContent - 已生成的内容（已清理推理标签）
      // onChunk
      (chunk) => {
        if (chunk) {
          // 首次检测后端返回模式
          if (detectedBackendMode === null) {
            // 如果chunk内容完全包含rawContent作为前缀，且chunk明显更长
            // 则说明后端返回的是完整内容
            if (chunk.length > rawContent.length * 1.5 &&
                chunk.startsWith(rawContent)) {
              detectedBackendMode = 'full'
            } else {
              // 否则认为是增量模式
              detectedBackendMode = 'incremental'
            }
          }

          if (detectedBackendMode === 'full') {
            // 完整内容模式：提取增量部分
            if (chunk.length > rawContent.length &&
                chunk.startsWith(rawContent)) {
              const incrementalContent = chunk.substring(rawContent.length)
              if (incrementalContent) {
                rawContent += incrementalContent
              }
            }
          } else {
            // 增量模式：直接追加
            rawContent += chunk
          }

          voiceStreamingRawContent = rawContent

          // 解析内容
          parseContentAndReasoning(
            assistantMessage,
            rawContent,
            savedReasoningStartTime,
            savedDeepReasoning
          )

          scrollToBottom(false)
        }
      },
      // onMetadata
      (metadata) => {
        if (metadata.conversation_id) {
          currentSession.value.backendConversationId = metadata.conversation_id
        }
        if (metadata.usage_metadata?.total_tokens) {
          assistantMessage.tokens = metadata.usage_metadata.total_tokens
        }
      },
      // onComplete
      () => {
        assistantMessage.isComplete = true
        assistantMessage.isLastGenerating = false
        assistantMessage.isPaused = false
        parseMarkdown(assistantMessage)
        isGenerating.value = false
        isPaused.value = false
        currentGeneratingMessage.value = null

        // 清除语音状态
        voiceStreamingMessageId = null
        voiceStreamingRawContent = ''
        voiceReasoningStartTime = null
        voiceUploadId = null
        voiceStreamCompleted = false
      }
    )

  } catch (error) {
    // 如果是用户主动中止，保存状态以便续传
    if (error.name === 'AbortError') {
      console.warn('[语音续写] 用户中止')
      voiceStreamingRawContent = rawContent
      if (assistantMessage) {
        assistantMessage.rawContent = rawContent
        assistantMessage.isLastGenerating = true
        assistantMessage.isPaused = true
      }
      isPaused.value = true
      isGenerating.value = false
      currentGeneratingMessage.value = null
      return
    }

    console.error('[语音续写] 失败:', error)
    ElMessage.error(`续写生成失败: ${error.message || error}`)
    if (assistantMessage) {
      assistantMessage.isLastGenerating = false
      assistantMessage.isPaused = false
    }
    isGenerating.value = false
    isPaused.value = false
    currentGeneratingMessage.value = null
  }
}

defineExpose({
  sendMessage,
  handleUploadFile,
  setSelectedModel,
  createNewSession,
  switchSession,
  deleteSession,
  chatSessions,
  currentSession,
  currentSessionId,
  selectedModel,
  isGenerating,  // 直接暴露 ref 对象
  isPaused,      // 直接暴露 ref 对象
  handlePauseGeneration,
  continueGenerationFromMessage,
  handleVoiceMessage,
  handleVoiceChunk,
  handleVoiceComplete,
  handleVoiceUploadComplete,
  handleVoiceMetadataUpdate,
  handleVoiceAborted,
  continueVoiceGeneration,
  setRecordingState,
  updateWaveformData,
  initializeConversation,
  // 获取聊天配置
  getChatConfig: () => {
    let onlineSearch = false
    let deepReasoning = false
    try {
      const raw = localStorage.getItem('chatConfig')
      if (raw) {
        const parsed = JSON.parse(raw)
        onlineSearch = !!parsed.isInternetSearchEnabled
        deepReasoning = !!parsed.isDeepReasoningEnabled
      }
    } catch (error) {
      console.error('读取配置失败:', error)
    }
    return {
      modelName: selectedModel.value,
      onlineSearch,
      deepReasoning
    }
  }
})
</script>

<style scoped>
.chat-page {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--background-color);
  padding: 0;
  margin: 0;
  position: relative;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  background: transparent;
  width: 100%;
  scroll-behavior: smooth;
  scrollbar-gutter: stable;
  min-height: 0;
  position: relative;
}

/* 内容包装器 - 控制最大宽度并居中 */
.chat-messages-content {
  max-width: 900px;
  margin: 0 auto;
  padding: 24px 20px;
  padding-bottom: 40px;
  /* 确保录音时波形始终在底部 */
  min-height: calc(100vh - 300px);
  display: flex;
  flex-direction: column;
}

.chat-message {
  display: flex;
  margin-bottom: 24px;
  animation: fadeIn 0.3s ease;
  padding: 0;
  transition: var(--transition);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.chat-message--user {
  justify-content: flex-end;
}

.chat-message--assistant {
  justify-content: flex-start;
}

.chat-message__avatar {
  width: 40px;
  height: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0 12px;
  flex-shrink: 0;
}

.chat-message--user .chat-message__avatar {
  order: 2;
}

.chat-message--assistant .chat-message__avatar {
  order: 1;
}

.chat-avatar {
  width: 40px;
  height: 40px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.25);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.chat-avatar--user {
  background: var(--primary-gradient);
  border: 2px solid rgba(255, 255, 255, 0.7);
}

.chat-avatar--assistant {
  background: var(--accent-gradient);
  padding: 2px;
  position: relative;
}

.chat-avatar__inner {
  width: 100%;
  height: 100%;
  border-radius: inherit;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.35), transparent 60%);
  color: #ffffff;
  font-size: 20px;
}

.chat-avatar--assistant::after {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: inherit;
  border: 1px solid rgba(255, 255, 255, 0.25);
  pointer-events: none;
}

.chat-message:hover .chat-avatar {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.3);
}

/* 机器人面部细节，让头像看起来更像聊天机器人 */
.chat-avatar__robot-face {
  width: 70%;
  height: 70%;
  border-radius: 14px;
  background: rgba(15, 23, 42, 0.75);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 0 2px rgba(148, 163, 184, 0.4);
}

.chat-avatar__eyes {
  display: flex;
  justify-content: space-between;
  width: 65%;
  margin-bottom: 3px;
}

.chat-avatar__eye {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: #38bdf8;
  box-shadow: 0 0 6px rgba(56, 189, 248, 0.9);
}

.chat-avatar__mouth {
  width: 50%;
  height: 3px;
  border-radius: 999px;
  background: linear-gradient(90deg, #22c55e, #a855f7);
  opacity: 0.85;
}

.chat-message__content {
  max-width: 70%;
  /* 移除 min-width 限制，让宽度自适应内容 */
}

/* 用户消息内容与头像之间的间距优化 */
.chat-message--user .chat-message__avatar {
  margin-left: 8px;
}

/* AI消息内容与头像之间的间距优化 */
.chat-message--assistant .chat-message__avatar {
  margin-right: 8px;
}

.chat-message--assistant .chat-message__content {
  max-width: 85%;
}

.chat-message--user .chat-message__content {
  order: 1;
}

.chat-message--assistant .chat-message__content {
  order: 2;
}

.chat-message__text {
  padding: 12px 16px;
  border-radius: var(--radius-lg);
  line-height: 1.6;
  word-break: break-word;
  overflow-wrap: break-word;
  font-size: 14px;
  background-color: var(--card-background);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  transition: var(--transition);
  display: inline-block;
  max-width: 100%;
  min-width: 0;
}

.chat-message--user .chat-message__text {
  background: var(--primary-gradient);
  color: white;
  border: none;
  border-bottom-right-radius: var(--radius-sm);
}

/* 浅色模式下用户消息背景色优化 - 使用浅色背景 */
:not(.dark-theme) .chat-message--user .chat-message__text {
  background: #f0f4f8;
  color: var(--text-primary);
  border: 1px solid #e2e8f0;
}

/* 深色模式下用户消息背景色优化 - 使用深色背景 */
.dark-theme .chat-message--user .chat-message__text {
  background: #1e293b;
  color: #e2e8f0;
  border: 1px solid #334155;
}

.chat-message--assistant .chat-message__text {
  background-color: var(--card-background);
  color: var(--text-primary);
  border-bottom-left-radius: var(--radius-sm);
}

/* ========== AI消息样式（无气泡，直接显示） ========== */
.ai-message-content {
  color: var(--text-primary);
  font-size: 15px;
  line-height: 1.8;
  letter-spacing: 0.01em;
  word-break: break-word;
  white-space: normal; /* HTML内容正常处理换行 */
}

/* AI消息Markdown样式 - 始终应用 */
.ai-message-content h1,
.ai-message-content h2,
.ai-message-content h3,
.ai-message-content h4,
.ai-message-content h5,
.ai-message-content h6 {
  margin-top: 2em;
  margin-bottom: 1em;
  font-weight: 600;
  line-height: 1.4;
  color: var(--text-primary);
}

.ai-message-content h1:first-child,
.ai-message-content h2:first-child,
.ai-message-content h3:first-child {
  margin-top: 0;
}

.ai-message-content h1 {
  font-size: 1.85em;
  border-bottom: 2px solid var(--border-color);
  padding-bottom: 0.4em;
}
.ai-message-content h2 {
  font-size: 1.55em;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 0.35em;
}
.ai-message-content h3 { font-size: 1.35em; }
.ai-message-content h4 { font-size: 1.2em; }
.ai-message-content h5 { font-size: 1.1em; }
.ai-message-content h6 { font-size: 1em; color: var(--text-muted); }

.ai-message-content p {
  margin: 1.2em 0;
  line-height: 1.9;
}

.ai-message-content ul,
.ai-message-content ol {
  margin: 1.2em 0;
  padding-left: 2em;
  line-height: 1.9;
}

.ai-message-content li {
  margin: 0.5em 0;
}

.ai-message-content ul li {
  list-style-type: disc;
}

.ai-message-content ul li::marker {
  color: var(--primary-color);
}

.ai-message-content ol li {
  list-style-type: decimal;
}

.ai-message-content ol li::marker {
  color: var(--primary-color);
  font-weight: 600;
}

/* 行内代码样式 */
.ai-message-content code {
  background-color: rgba(127, 127, 127, 0.12);
  padding: 0.25em 0.5em;
  border-radius: 5px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 0.9em;
  color: var(--primary-color);
  border: 1px solid rgba(127, 127, 127, 0.2);
}

/* 代码块包装器样式 */
.ai-message-content :deep(.code-block-wrapper) {
  margin: 2em 0;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
}

/* 代码块顶部栏样式 */
.ai-message-content :deep(.code-block-header) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background: linear-gradient(135deg, #2d333b 0%, #242930 100%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  position: relative;
}

/* 浅色模式下代码块样式优化 */
:root .ai-message-content :deep(.code-block-wrapper) {
  border: 1px solid rgba(0, 0, 0, 0.12);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

:root .ai-message-content :deep(.code-block-header) {
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

:root .ai-message-content :deep(.code-block-lang) {
  color: #475569;
}

:root .ai-message-content pre {
  background-color: #f8fafc;
}

:root .ai-message-content pre :deep(code.hljs) {
  color: #334155;
}

.ai-message-content :deep(.code-block-lang) {
  font-size: 12px;
  font-weight: 600;
  color: #7aa2f7;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
}

/* 代码块复制按钮样式 */
.ai-message-content :deep(.code-block-copy-btn) {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  color: #7aa2f7;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
}

:root .ai-message-content :deep(.code-block-copy-btn) {
  border-color: rgba(0, 0, 0, 0.15);
  color: #64748b;
}

.ai-message-content :deep(.code-block-copy-btn:hover) {
  background: rgba(127, 127, 127, 0.1);
  border-color: rgba(255, 255, 255, 0.3);
}

:root .ai-message-content :deep(.code-block-copy-btn:hover) {
  background: rgba(0, 0, 0, 0.06);
  border-color: rgba(0, 0, 0, 0.25);
  color: #334155;
}

.ai-message-content :deep(.code-block-copy-btn svg) {
  width: 14px;
  height: 14px;
}

/* 复制成功状态 */
.ai-message-content :deep(.code-block-copy-btn.copied) {
  color: #22c55e !important;
  border-color: #22c55e !important;
}

:root .ai-message-content :deep(.code-block-copy-btn.copied) {
  color: #16a34a !important;
  border-color: #16a34a !important;
}

/* 代码块容器样式 - 优化外观 */
.ai-message-content pre {
  background-color: #1a1d23;
  padding: 0;
  border-radius: 0;
  overflow-x: auto;
  margin: 0;
  line-height: 1.6;
}

/* 代码块内部的包装器，用于添加顶部栏 */
.ai-message-content pre :deep(code.hljs) {
  background-color: transparent !important;
  padding: 18px 20px;
  font-size: 0.85em;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  display: block;
  color: #abb2bf;
  line-height: 1.6;
}

.dark-theme .ai-message-content pre {
  background-color: #0d1117;
}

.dark-theme .ai-message-content :deep(.code-block-wrapper) {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
  border-color: rgba(255, 255, 255, 0.06);
}

.dark-theme .ai-message-content :deep(.code-block-header) {
  background: linear-gradient(135deg, #1e222a 0%, #16191f 100%);
}

.dark-theme .ai-message-content :deep(.code-block-copy-btn) {
  color: #7aa2f7;
  border-color: rgba(255, 255, 255, 0.2);
}

/* 增强代码高亮颜色效果 - 使用:deep()穿透 */
.ai-message-content pre :deep(.hljs-keyword) {
  color: #c678dd;
  font-weight: 600;
}

.ai-message-content pre :deep(.hljs-string) {
  color: #98c379;
}

.ai-message-content pre :deep(.hljs-number) {
  color: #d19a66;
}

.ai-message-content pre :deep(.hljs-comment) {
  color: #5c6370;
  font-style: italic;
}

.ai-message-content pre :deep(.hljs-function) {
  color: #61afef;
}

.ai-message-content pre :deep(.hljs-title) {
  color: #e5c07b;
}

.ai-message-content pre :deep(.hljs-params) {
  color: #e5c07b;
}

.ai-message-content pre :deep(.hljs-built_in) {
  color: #e6c07b;
}

.ai-message-content pre :deep(.hljs-literal) {
  color: #56b6c2;
}

.ai-message-content pre :deep(.hljs-class) {
  color: #e5c07b;
}

.ai-message-content pre :deep(.hljs-tag) {
  color: #e06c75;
}

.ai-message-content pre :deep(.hljs-name) {
  color: #e06c75;
}

.ai-message-content pre :deep(.hljs-attr) {
  color: #d19a66;
}

.ai-message-content pre :deep(.hljs-variable) {
  color: #e06c75;
}

.ai-message-content pre :deep(.hljs-operator) {
  color: #56b6c2;
}

.ai-message-content pre :deep(.hljs-property) {
  color: #d19a66;
}

.ai-message-content pre :deep(.hljs-selector-tag) {
  color: #e06c75;
}

.ai-message-content pre :deep(.hljs-selector-id) {
  color: #61afef;
}

.ai-message-content pre :deep(.hljs-selector-class) {
  color: #e5c07b;
}

.ai-message-content pre :deep(.hljs-type) {
  color: #e5c07b;
}

.ai-message-content pre :deep(.hljs-symbol) {
  color: #56b6c2;
}

.ai-message-content pre :deep(.hljs-bullet) {
  color: #61afef;
}

.ai-message-content pre :deep(.hljs-link) {
  color: #61afef;
  text-decoration: underline;
}

.ai-message-content pre :deep(.hljs-meta) {
  color: #5c6370;
}

.ai-message-content pre :deep(.hljs-deletion) {
  color: #e06c75;
  background-color: #5c1e1e;
}

.ai-message-content pre :deep(.hljs-addition) {
  color: #98c379;
  background-color: #1e3a1e;
}

/* 其他Markdown元素样式 - 优化间距和视觉效果 */
.ai-message-content blockquote {
  border-left: 4px solid var(--primary-color);
  padding: 1em 1.5em;
  margin: 1.5em 0;
  color: var(--text-secondary);
  font-style: italic;
  background-color: rgba(127, 127, 127, 0.05);
  border-radius: 0 8px 8px 0;
}

.ai-message-content a {
  color: var(--primary-color);
  text-decoration: none;
  border-bottom: 1px solid transparent;
  transition: var(--transition-fast);
}

.ai-message-content a:hover {
  border-bottom-color: var(--primary-color);
}

/* 表格样式优化 */
.ai-message-content table {
  border-collapse: collapse;
  width: 100%;
  margin: 1.8em 0;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.ai-message-content th,
.ai-message-content td {
  border: 1px solid var(--border-color);
  padding: 12px 16px;
  text-align: left;
}

.ai-message-content th {
  background-color: var(--surface-color);
  font-weight: 600;
  color: var(--text-primary);
}

.ai-message-content tr:nth-child(even) {
  background-color: rgba(127, 127, 127, 0.03);
}

.ai-message-content tr:hover {
  background-color: rgba(127, 127, 127, 0.06);
}

.ai-message-content hr {
  border: none;
  border-top: 2px solid var(--border-color);
  margin: 2.5em 0;
  opacity: 0.6;
}

.ai-message-content img {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  margin: 1.2em 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 代码块和段落之间的间距优化 */
.ai-message-content :deep(.code-block-wrapper) + p,
.ai-message-content p + :deep(.code-block-wrapper),
.ai-message-content ul + :deep(.code-block-wrapper),
.ai-message-content ol + :deep(.code-block-wrapper),
.ai-message-content :deep(.code-block-wrapper) + ul,
.ai-message-content :deep(.code-block-wrapper) + ol {
  margin-top: 1.8em;
}

/* 代码块前后不需要额外间距（已在wrapper中定义） */
.ai-message-content pre {
  margin: 0;
}

/* 标题后的段落间距 */
.ai-message-content h1 + p,
.ai-message-content h2 + p,
.ai-message-content h3 + p,
.ai-message-content h4 + p,
.ai-message-content h5 + p,
.ai-message-content h6 + p {
  margin-top: 0.8em;
}

/* ========== AI推理过程样式（无边框，简单分隔） ========== */
.ai-reasoning-section {
  margin-bottom: 16px;
}

/* AI思考占位符样式 */
.ai-thinking-placeholder {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 0;
  color: var(--text-secondary);
  font-size: 14px;
}

/* 推理内容加载区域 */
.ai-reasoning-loading {
  display: flex;
  align-items: center;
  padding: 12px 0;
}

.ai-thinking-placeholder i {
  font-size: 16px;
  animation: rotate 1s linear infinite;
}

/* 高级加载点动效（普通模式） */
.ai-loading-dots {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 0;
}

.ai-loading-dots .dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: var(--primary-color);
  opacity: 0.6;
  animation: dot-pulse 1.4s ease-in-out infinite;
}

.ai-loading-dots .dot:nth-child(1) {
  animation-delay: 0s;
}

.ai-loading-dots .dot:nth-child(2) {
  animation-delay: 0.2s;
}

.ai-loading-dots .dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes dot-pulse {
  0%, 80%, 100% {
    transform: scale(0.6);
    opacity: 0.4;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

/* 深色模式下的加载点 */
.dark-theme .ai-loading-dots .dot {
  background-color: #60a5fa;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.ai-reasoning-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  cursor: pointer;
  user-select: none;
  color: var(--text-secondary);
  transition: var(--transition-fast);
}

.ai-reasoning-header:hover {
  color: var(--text-primary);
}

.ai-reasoning-header i {
  font-size: 14px;
  transition: var(--transition-fast);
}

/* 思考中/已思考标题样式 - 使用系统主题色 */
.reasoning-title {
  font-size: 16px;
  font-weight: 600;
  color: #4f46e5;
}

.dark-theme .reasoning-title {
  color: #60a5fa;
}

.ai-reasoning-content {
  padding: 12px 0;
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.7;
}

/* 推理内容Markdown样式 */
.ai-reasoning-content :deep(p) {
  margin: 0.5em 0;
}

.ai-reasoning-content :deep(ul),
.ai-reasoning-content :deep(ol) {
  margin: 0.5em 0;
  padding-left: 1.5em;
}

.ai-reasoning-content :deep(li) {
  margin: 0.3em 0;
}

.ai-reasoning-content :deep(code) {
  background-color: rgba(127, 127, 127, 0.1);
  padding: 0.2em 0.4em;
  border-radius: 4px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 0.9em;
}

.ai-reasoning-content :deep(pre) {
  margin: 0.5em 0;
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.6;
  background-color: rgba(127, 127, 127, 0.05);
  padding: 10px;
  border-radius: 6px;
}

.ai-divider {
  height: 1px;
  background-color: var(--border-color);
  margin: 12px 0;
}

.chat-message__meta {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 6px;
  font-size: 11px;
  color: var(--text-muted);
}

.chat-message--assistant .chat-message__meta {
  justify-content: flex-start;
}

.chat-message__time {
  font-size: 11px;
}

.chat-message__actions {
  display: flex;
  gap: 4px;
  align-items: center;
  flex: 1;
}

.chat-message__action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  padding: 2px;
  cursor: pointer;
  font-size: 14px;
  color: #64748b;
  opacity: 1;
  transition: var(--transition-fast);
  border-radius: 4px;
  user-select: none;
}

.chat-message__action-btn i {
  font-size: 14px !important;
  line-height: 1;
}

.chat-message__action-btn .action-icon {
  width: 16px;
  height: 16px;
  stroke: currentColor;
  stroke-width: 2;
}

.chat-message__action-btn:hover {
  color: var(--primary-color);
  background-color: var(--surface-color);
}

.chat-message__delete-btn:hover {
  color: var(--error-color);
}

/* 深色模式下的图标样式 */
.dark-theme .chat-message__action-btn {
  color: #94a3b8;
}

.dark-theme .chat-message__action-btn:hover {
  color: #60a5fa;
  background-color: rgba(255, 255, 255, 0.1);
}

.dark-theme .chat-message__delete-btn:hover {
  color: #f87171;
}

.chat-message__typing {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background-color: var(--card-background);
  border-radius: var(--radius-lg);
  border-bottom-left-radius: var(--radius-sm);
  border: 1px solid var(--border-color);
  font-size: 13px;
  color: var(--text-muted);
}

.chat-messages::-webkit-scrollbar {
  width: 6px;
}

.chat-messages::-webkit-scrollbar-track {
  background: transparent;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 3px;
}

.chat-messages::-webkit-scrollbar-thumb:hover {
  background: var(--border-hover);
}

/* Token计数样式 */
.chat-message__tokens {
  font-size: 11px;
  color: var(--text-muted);
  padding: 2px 6px;
  border-radius: 4px;
  background-color: var(--surface-color);
  margin-left: 4px;
}

/* 继续生成按钮样式（在消息操作栏中） - 推到最右边 */
.continue-generate-btn {
  color: #10b981 !important;
  background-color: rgba(16, 185, 129, 0.1);
  padding: 4px 10px !important;
  border-radius: 4px;
  font-size: 12px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-weight: 500;
  transition: var(--transition-fast);
  margin-left: auto !important; /* 推到最右边 */
}

.continue-generate-btn:hover {
  color: #059669 !important;
  background-color: rgba(16, 185, 129, 0.2) !important;
}

.continue-generate-btn .action-icon {
  width: 14px;
  height: 14px;
}

.dark-theme .continue-generate-btn {
  color: #34d399 !important;
  background-color: rgba(52, 211, 153, 0.15);
}

.dark-theme .continue-generate-btn:hover {
  color: #6ee7b7 !important;
  background-color: rgba(52, 211, 153, 0.25) !important;
}

/* 播报按钮样式 */
.chat-message__action-btn:has(.speaking-icon) {
  color: #3b82f6 !important;
  background-color: rgba(59, 130, 246, 0.1);
}

.chat-message__action-btn:has(.speaking-icon):hover {
  background-color: rgba(59, 130, 246, 0.2) !important;
}

.dark-theme .chat-message__action-btn:has(.speaking-icon) {
  color: #60a5fa !important;
  background-color: rgba(96, 165, 250, 0.15);
}

.dark-theme .chat-message__action-btn:has(.speaking-icon):hover {
  background-color: rgba(96, 165, 250, 0.25) !important;
}

/* 播报中动画效果 */
.speaking-icon {
  animation: speaking-pulse 1s ease-in-out infinite;
}

@keyframes speaking-pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(0.85);
    opacity: 0.7;
  }
}

/* ========== 语音消息样式 ========== */
/* 用户语音消息 - 类似微信语音条 */
.voice-message {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 80px;
  max-width: 280px;
  padding: 8px 12px;
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  border-radius: 12px;
  border-bottom-right-radius: 4px;
  color: white;
  font-size: 13px;
  cursor: pointer;
  transition: var(--transition);
  position: relative;
}

.voice-message__content {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}

.voice-message__text {
  font-size: 14px;
  line-height: 1.4;
  word-wrap: break-word;
  word-break: break-all;
}

/* 浅色模式下的语音消息 */
:not(.dark-theme) .voice-message {
  background: #e8f5e9;
  color: #2e7d32;
  border: 1px solid #c8e6c9;
}

/* 深色模式下的语音消息 */
.dark-theme .voice-message {
  background: #1e3a28;
  color: #81c784;
  border: 1px solid #2d4a35;
}

.voice-message:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

:not(.dark-theme) .voice-message:hover {
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.2);
}

.dark-theme .voice-message:hover {
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
}

/* 语音播放动画图标 */
.voice-message__icon {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* 语音播放中动画 */
.voice-message.playing .voice-message__icon {
  animation: voice-playing 0.6s ease-in-out infinite;
}

@keyframes voice-playing {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
}

/* 语音波形动画 */
.voice-message__wave {
  display: flex;
  align-items: center;
  gap: 2px;
  height: 16px;
}

.voice-message__wave-bar {
  width: 3px;
  background: currentColor;
  border-radius: 2px;
  animation: voice-wave 1s ease-in-out infinite;
}

.voice-message__wave-bar:nth-child(1) {
  height: 6px;
  animation-delay: 0s;
}

.voice-message__wave-bar:nth-child(2) {
  height: 10px;
  animation-delay: 0.1s;
}

.voice-message__wave-bar:nth-child(3) {
  height: 14px;
  animation-delay: 0.2s;
}

.voice-message__wave-bar:nth-child(4) {
  height: 10px;
  animation-delay: 0.3s;
}

.voice-message__wave-bar:nth-child(5) {
  height: 6px;
  animation-delay: 0.4s;
}

@keyframes voice-wave {
  0%, 100% {
    transform: scaleY(1);
  }
  50% {
    transform: scaleY(0.5);
  }
}

/* 语音消息未播放时隐藏波形动画 */
.voice-message:not(.playing) .voice-message__wave {
  display: none;
}

/* 语音时长显示 */
.voice-message__duration {
  font-size: 12px;
  margin-left: auto;
  opacity: 0.8;
}

/* 上传中状态 */
.voice-message.uploading {
  cursor: wait;
  opacity: 0.7;
}

.voice-message__uploading {
  font-size: 14px;
  margin-left: auto;
}

/* ========== 录音波形显示区域 ========== */
.voice-waveform-canvas {
  width: 100%;
  height: 100px;
  display: block;
  background: transparent;
  margin-top: auto; /* 自动推到底部 */
  flex-shrink: 0;
}

/* ========== 聊天输入区域收缩/回弹按钮 ========== */
.chat-input-toggle {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 80px;
  height: 24px;
  background: var(--card-background);
  border: 1px solid var(--border-color);
  border-bottom: none;
  border-radius: 12px 12px 0 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 100;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.08);
}

.chat-input-toggle::before {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 30px;
  height: 2px;
  background: var(--primary-color);
  border-radius: 0 0 1px 1px;
  transition: all 0.3s ease;
}

.chat-input-toggle:hover {
  height: 28px;
  width: 100px;
  box-shadow: 0 -4px 12px rgba(79, 70, 229, 0.15);
}

.chat-input-toggle:hover::before {
  width: 40px;
  background: linear-gradient(90deg, transparent, var(--primary-color), transparent);
}

.chat-input-toggle--collapsed {
  bottom: 0;
  border-radius: 12px 12px 0 0;
}

.chat-input-toggle--collapsed::before {
  top: auto;
  bottom: 0;
  border-radius: 1px 1px 0 0;
}

.chat-input-toggle i {
  color: var(--text-muted);
  font-size: 12px;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 2px;
}

.chat-input-toggle:hover i {
  color: var(--primary-color);
  transform: scale(1.1);
}

/* 输入框收缩动画 */
.slide-input-enter-active,
.slide-input-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-input-enter-from,
.slide-input-leave-to {
  opacity: 0;
  transform: translateY(100%);
}
</style>
