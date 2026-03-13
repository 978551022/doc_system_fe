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
        v-show="message.content || message.reasoningContent || message.role === 'user'"
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
              <div v-if="message.reasoningHtml" v-show="message.reasoningExpanded" class="ai-reasoning-content" v-html="message.reasoningHtml">
              </div>
              <!-- 分隔线 -->
              <div v-if="(message.reasoningHtml && (message.reasoningExpanded || message.reasoningCompleted)) || message.isReasoning" class="ai-divider"></div>
            </div>

            <!-- 消息内容：支持Markdown实时渲染 -->
            <div
              class="ai-message-content"
              v-html="message.content"
            ></div>
          </template>

          <!-- 用户消息：保持原有气泡样式 -->
          <template v-else>
            <div class="chat-message__text">{{ message.content }}</div>
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
      <!-- 内容包装器结束 -->
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch, reactive } from 'vue'
import { useRoute } from 'vue-router'
import { Loading } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { uploadDocument, waitForDocumentProcessing } from '../api/document.js'
import { intelligentQuery, getAvailableModels, exportConversation } from '../api/intelligentSearch.js'
import userState from '../utils/userStore.js'
import { marked } from 'marked'
import hljs from 'highlight.js'
import 'highlight.js/styles/atom-one-dark.css'

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
const currentGeneratingMessage = ref(null)  // 当前正在生成的消息对象

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

// 从消息继续生成（点击消息操作栏的继续生成按钮）
const continueGenerationFromMessage = async (message) => {
  if (!currentSession.value.backendConversationId) {
    ElMessage.warning('会话未保存，无法继续生成')
    return
  }

  // 获取当前AI消息的纯文本内容用于续写
  // 优先使用 rawContent，如果没有则从 HTML 中提取
  let currentContent = ''

  if (message.rawContent) {
    // 使用原始内容，保留完整内容用于续写（包括推理标签，让后端处理）
    currentContent = message.rawContent

    // 清理元数据（但保留推理标签）
    currentContent = currentContent.replace(/^content=''?\s*$/gm, '')
    currentContent = currentContent.replace(/^usage_metadata=\{[^}]*\}\s*/g, '')
    currentContent = currentContent.replace(/^additional_kwargs=\{.*?\}\s*$/gm, '')
    currentContent = currentContent.replace(/^response_metadata=\{.*?\}\s*$/gm, '')
    currentContent = currentContent.replace(/^id='run-[^']*'\s*$/gm, '')
    currentContent = currentContent.replace(/^name='[^']*'\s*$/gm, '')
    currentContent = currentContent.trim()
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

  // 发送续写请求，使用完整的 rawContent（后端会处理推理标签）
  await doContinueGeneration(currentContent, message)
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

    let rawContent = continueFromContent

    await intelligentQuery(
      {
        query: lastUserQuery.value,
        conversation_id: sessionRef.backendConversationId,
        mode: 'general',
        model_name: selectedModel.value,
        stream: true,
        continue_from_content: continueFromContent,
        signal: currentAbortController.value?.signal || null
      },
      // onChunk
      (chunkContent) => {
        if (chunkContent) {
          rawContent += chunkContent

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

          // 等待文档处理完成（静默处理，不显示单独提示）
          try {
            const processedDoc = await waitForDocumentProcessing(docId, 30000, 1000)
            successCount++
          } catch (waitError) {
            console.error('等待文档处理超时:', waitError)
            // 即使超时也算上传成功，只是处理可能未完成
            successCount++
          }
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

    // 将新上传的文档ID存储到当前会话中，供后续查询使用
    if (uploadedDocIds.length > 0) {
      const sessionRef = currentSession.value
      if (!sessionRef.documentIds) {
        sessionRef.documentIds = []
      }
      sessionRef.documentIds.push(...uploadedDocIds)
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

    // 获取当前会话存储的文档ID（用于后续查询复用）
    const sessionDocIds = sessionRef.documentIds || []
    
    // 判断是使用文档查询还是普通AI对话
    // 条件：1. 本次上传了新文档 2. 会话中有存储的文档ID
    const hasDocuments = uploadedDocIds.length > 0 || sessionDocIds.length > 0
    const effectiveDocIds = uploadedDocIds.length > 0 ? uploadedDocIds : sessionDocIds
    
    if (hasDocuments && content.trim()) {
      // ========== 文档查询模式 ==========

      // 使用reactive创建助手消息对象
      const assistantMessage = reactive({
        id: Date.now() + 1,
        role: 'assistant',
        content: '',
        time: new Date().toLocaleTimeString()
      })

      // 立即添加到消息列表
      sessionRef.messages.push(assistantMessage)

      // 使用最新上传的文档ID，或者会话中存储的最后一个文档ID
      const docId = effectiveDocIds[effectiveDocIds.length - 1]
      const query = content.trim()

      // 调用流式查询API，传递联网搜索参数
      await queryDocumentStream(docId, query, (extractedText) => {
        // 当收到第一个chunk时，隐藏加载状态
        if (isTyping.value) {
          isTyping.value = false
        }

        // 直接追加提取好的文本
        if (extractedText && extractedText.trim()) {
          assistantMessage.content += extractedText
          scrollToBottom(false)
        }
      }, onlineSearch)

    } else if (uploadedDocIds.length > 0 && !content.trim()) {
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

      // 确定查询模式
      let queryMode = 'general'
      if (hasDocuments && effectiveDocIds && effectiveDocIds.length > 0) {
        queryMode = 'document'
      }

      // 调用后端智能查询API
      const result = await intelligentQuery(
        {
          query: content.trim(),
          mode: queryMode,
          document_id: queryMode === 'document' ? effectiveDocIds[effectiveDocIds.length - 1] : null,
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
      // 重置状态但不显示错误
      isTyping.value = false
      isGenerating.value = false
      isPaused.value = true
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
      message.reasoningRawContent = cleanContent.substring(reasoningStart + reasoningStartTag.length)
      cleanContent = cleanContent.substring(0, reasoningStart)
    }
  } else if (cleanContent.includes(reasoningStartTag) || cleanContent.includes(answerStartTag)) {
    // deepReasoning 为 false，但内容中包含推理标签
    // 移除推理标签，将推理内容合并到主内容中
    // 注意：如果消息已有推理属性（来自之前的续传），则保留它们不覆盖

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
  localStorage.setItem(storageKey, JSON.stringify({
    chatSessions: chatSessions.value,
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

defineExpose({
  sendMessage,
  handleUploadFile,
  setSelectedModel,
  createNewSession,
  switchSession,
  deleteSession,
  chatSessions,
  currentSessionId,
  selectedModel,
  isGenerating,  // 直接暴露 ref 对象
  isPaused,      // 直接暴露 ref 对象
  handlePauseGeneration,
  continueGenerationFromMessage
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
}

/* 内容包装器 - 控制最大宽度并居中 */
.chat-messages-content {
  max-width: 900px;
  margin: 0 auto;
  padding: 24px 20px;
  padding-bottom: 40px;
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
  min-width: 100px;
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
  font-size: 14px;
  background-color: var(--card-background);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  transition: var(--transition);
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

/* 继续生成按钮样式（在消息操作栏中） - 增加左边距与其他按钮分开 */
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
  margin-left: 12px; /* 与左侧按钮保持更大距离 */
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
</style>
