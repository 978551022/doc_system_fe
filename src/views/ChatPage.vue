<template>
  <div class="chat-page" ref="chatComponent">
    <!-- 聊天消息列表 -->
    <div class="chat-messages" ref="messagesContainer">
      <!-- 对话消息 -->
      <div 
        v-for="message in messages" 
        :key="message.id" 
        :class="['chat-message', `chat-message--${message.role}`]"
        v-show="message.content || message.role === 'user'"
      >
        <div class="chat-message__avatar">
          <!-- 用户头像：使用用户最新上传的头像 -->
          <template v-if="message.role === 'user'">
            <el-avatar
              :size="32"
              :src="userState.avatar"
              class="chat-avatar chat-avatar--user"
            >
              <i v-if="!userState.avatar" class="el-icon-user"></i>
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
          <div class="chat-message__text">{{ message.content }}</div>
          <div class="chat-message__meta">
            <span class="chat-message__time">{{ message.time }}</span>
            <el-button 
              type="text" 
              size="small"
              @click="copyMessage(message.content)"
              class="chat-message__copy-btn"
              title="复制"
            >
              <i class="el-icon-document-copy"></i>
            </el-button>
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
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch, reactive } from 'vue'
import { useRoute } from 'vue-router'
import { Loading } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { uploadDocument, queryDocumentStream, waitForDocumentProcessing } from '../api/document.js'
import userState from '../utils/userStore.js'

// 路由对象，用于接收 HistoryPage 传入的会话 ID
const route = useRoute()

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

// 模型配置 - 支持多种模型
const modelConfig = ref({
  // DeepSeek模型配置
  deepseek: {
    name: "DeepSeek",
    type: "deepseek",
    model: "deepseek-chat",
    base_url: "https://api.deepseek.com/",
    api_key: "sk-f37bb7bb404c42cc967dcbe1f84af90a"
  },
  // GLM模型配置
  glm: {
    name: "GLM-4.5-Flash",
    type: "glm",
    model: "GLM-4.5-Flash",
    base_url: "https://open.bigmodel.cn/api/coding/paas/v4",
    api_key: "eb870e0270e3449896a11231fbcadc4e.nAX0cJvBZiLy274g"
  },
  // Qwen模型配置
  qwen: {
    name: "Qwen 2",
    type: "qwen",
    model: "qwen-plus",
    base_url: "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
    api_key: "sk-2d97c4a4a3a04eaf81a296b67632166a"
  },
  // Llama 3模型配置
  llama3: {
    name: "Llama 3",
    type: "llama3",
    model: "meta-llama-3-8b-instruct",
    base_url: "https://api.openai.com/v1/",
    api_key: "your-llama3-api-key"
  }
})

// 模型列表，用于UI显示
const models = ref([
  { id: 'deepseek', name: 'DeepSeek', icon: 'el-icon-chat-dot-round' },
  { id: 'glm', name: 'GLM-4.5-Flash', icon: 'el-icon-chat-dot-round' },
  { id: 'qwen', name: 'Qwen 2', icon: 'el-icon-chat-dot-round' },
  { id: 'llama3', name: 'Llama 3', icon: 'el-icon-chat-dot-round' }
])

// 当前选中的模型
const selectedModel = ref('deepseek')

// 控制是否可以发送新消息的状态
const isSending = ref(false)

// 发送消息方法（用于接收来自ChatInput的消息）
const sendMessage = async (data) => {
  console.log('ChatPage收到消息:', data)
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
        console.log('正在上传文件:', file.name)

        // 调用后端API上传文件
        const response = await uploadDocument(file)
        console.log('文件上传响应:', response)

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

        console.log('提取到的文档ID:', docId)

        if (docId) {
          uploadedDocIds.push(docId)
          uploadedFileNames.push(file.name)

          // 等待文档处理完成（静默处理，不显示单独提示）
          console.log('等待文档处理完成...')

          try {
            const processedDoc = await waitForDocumentProcessing(docId, 30000, 1000)
            console.log('文档处理完成:', processedDoc)
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
      console.log('已存储文档ID到会话:', sessionRef.documentIds)
    }
  }

  // 如果有文件上传但没有成功的，且没有文本内容，则不继续
  if (uploadedDocIds.length === 0 && !content.trim()) {
    ElMessage.error('请至少上传一个文件或输入查询内容')
    isSending.value = false
    return
  }

  // 处理文件信息，不显示文件名，只显示query内容
  let messageContent = content.trim()

  // 如果开启了联网搜索，在消息中提示
  if (onlineSearch) {
    messageContent += ' [联网搜索]'
    console.log('联网搜索已开启')
  }

  // 如果开启了深度推理，也在消息中打标
  if (deepReasoning) {
    messageContent += ' [深度推理]'
    console.log('深度推理已开启')
  }

  // 创建用户消息
  const userMessage = {
    id: Date.now(),
    role: 'user',
    content: messageContent,
    time: new Date().toLocaleTimeString()
  }

  // 添加到当前会话的消息列表
  currentSession.value.messages.push(userMessage)
  scrollToBottom()

  const sessionRef = currentSession.value

  try {
    // 显示加载状态
    isTyping.value = true

    // 获取当前会话存储的文档ID（用于后续查询复用）
    const sessionDocIds = sessionRef.documentIds || []
    
    // 判断是使用文档查询还是普通AI对话
    // 条件：1. 本次上传了新文档 2. 会话中有存储的文档ID
    const hasDocuments = uploadedDocIds.length > 0 || sessionDocIds.length > 0
    const effectiveDocIds = uploadedDocIds.length > 0 ? uploadedDocIds : sessionDocIds
    
    if (hasDocuments && content.trim()) {
      // ========== 文档查询模式 ==========
      console.log('使用文档查询模式，文档ID:', effectiveDocIds)

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
        console.log('收到已提取的文本:', extractedText)

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

      console.log('文档查询完成')

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
      // ========== 普通AI对话模式（没有文档） ==========
      console.log('使用普通AI对话模式')

      // 添加到对话历史
      sessionRef.conversationHistory.push({
        role: 'user',
        content: messageContent
      })

      // 获取当前模型配置
      const config = modelConfig.value[selectedModel.value]
      console.log('当前模型配置:', config)

      let requestUrl, requestBody, headers

      // 根据模型类型处理不同的API请求
      switch (config.type) {
        case 'deepseek':
          requestUrl = `${config.base_url}v1/chat/completions`
          requestBody = {
            model: config.model,
            messages: sessionRef.conversationHistory,
            temperature: 0.7,
            max_tokens: 2000,
            stream: true,
            online_search: !!onlineSearch,
            deep_thinking: !!deepReasoning
          }
          headers = {
            'Authorization': `Bearer ${config.api_key}`,
            'Content-Type': 'application/json'
          }
          break
        case 'glm':
          requestUrl = `${config.base_url}/chat/completions`
          requestBody = {
            model: config.model,
            messages: sessionRef.conversationHistory,
            temperature: 0.7,
            max_tokens: 2000,
            stream: true,
            online_search: !!onlineSearch,
            deep_thinking: !!deepReasoning
          }
          headers = {
            'Authorization': `Bearer ${config.api_key}`,
            'Content-Type': 'application/json'
          }
          break
        case 'qwen':
          requestUrl = config.base_url
          requestBody = {
            model: config.model,
            messages: sessionRef.conversationHistory,
            temperature: 0.7,
            max_tokens: 2000,
            stream: true,
            online_search: !!onlineSearch,
            deep_thinking: !!deepReasoning
          }
          headers = {
            'Authorization': `Bearer ${config.api_key}`,
            'Content-Type': 'application/json'
          }
          break
        case 'llama3':
          requestUrl = `${config.base_url}chat/completions`
          requestBody = {
            model: config.model,
            messages: sessionRef.conversationHistory,
            temperature: 0.7,
            max_tokens: 2000,
            stream: true,
            online_search: !!onlineSearch,
            deep_thinking: !!deepReasoning
          }
          headers = {
            'Authorization': `Bearer ${config.api_key}`,
            'Content-Type': 'application/json'
          }
          break
        default:
          throw new Error(`不支持的模型类型: ${config.type}`)
      }

      // 发送API请求
      console.log('发送API请求到:', requestUrl)

      const response = await fetch(requestUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        throw new Error(`请求失败，状态码：${response.status}`)
      }

      // 使用reactive创建助手消息对象
      const assistantMessage = reactive({
        id: Date.now() + 1,
        role: 'assistant',
        content: '',
        time: new Date().toLocaleTimeString()
      })

      // 立即添加到消息列表
      sessionRef.messages.push(assistantMessage)

      // 调用streamResponse处理响应
      await streamResponse(response, assistantMessage, () => {
        isTyping.value = false
        scrollToBottom()
      })

      // 添加到对话历史
      sessionRef.conversationHistory.push({
        role: 'assistant',
        content: assistantMessage.content
      })
    }

    scrollToBottom()
  } catch (error) {
    console.error('处理消息失败:', error)

    // 隐藏加载状态
    isTyping.value = false

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

// 流式处理响应
const streamResponse = async (response, assistantMessage, onFirstChunk) => {
  let receivedChunk = false
  
  if (!assistantMessage.content) {
    assistantMessage.content = ''
  }
  
  // 处理非流式响应
  if (!response.body || !response.body.getReader) {
    try {
      const text = await response.text()
      assistantMessage.content = parseResponseText(text)
      if (typeof onFirstChunk === 'function') {
        onFirstChunk()
        receivedChunk = true
      }
      scrollToBottom()
    } catch (error) {
      console.error('处理非流式响应失败:', error)
      assistantMessage.content = `处理响应失败: ${error.message}`
      if (typeof onFirstChunk === 'function') {
        onFirstChunk()
        receivedChunk = true
      }
      scrollToBottom()
    }
    return receivedChunk
  }
  
  // 处理流式响应
  const reader = response.body.getReader()
  const decoder = new TextDecoder('utf-8')
  let buffer = ''
  
  try {
    while (true) {
      const { value, done } = await reader.read()
      if (done) {
        console.log('流式响应结束')
        break
      }
      
      buffer += decoder.decode(value, { stream: true })
      
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''
      
      for (const rawLine of lines) {
        const line = rawLine.trim()
        if (!line) continue
        
        if (line === 'data: [DONE]' || line === '[DONE]') {
          console.log('收到结束标记')
          continue
        }
        
        let payload = line
        if (payload.startsWith('data:')) {
          payload = payload.slice(5).trim()
        }
        
        if (!payload) continue
        
        try {
          const parsed = JSON.parse(payload)
          let delta = ''
          
          if (parsed.choices && parsed.choices[0]) {
            if (parsed.choices[0].delta) {
              delta = parsed.choices[0].delta.content || ''
            } else if (parsed.choices[0].message) {
              delta = parsed.choices[0].message.content || ''
            }
          } else if (parsed.content) {
            delta = parsed.content
          } else {
            delta = JSON.stringify(parsed)
          }
          
          if (delta) {
            if (!receivedChunk && typeof onFirstChunk === 'function') {
              onFirstChunk()
              receivedChunk = true
            }
            
            assistantMessage.content += delta
            scrollToBottom(false)
          }
        } catch (err) {
          console.warn('解析流式片段失败:', err.message, payload)
          if (!receivedChunk && typeof onFirstChunk === 'function') {
            onFirstChunk()
            receivedChunk = true
          }
          assistantMessage.content += payload
          scrollToBottom(false)
        }
      }
    }
    
    if (buffer.trim()) {
      try {
        const parsed = JSON.parse(buffer.trim())
        let delta = ''
        
        if (parsed.choices && parsed.choices[0]) {
          if (parsed.choices[0].delta) {
            delta = parsed.choices[0].delta.content || ''
          } else if (parsed.choices[0].message) {
            delta = parsed.choices[0].message.content || ''
          }
        } else if (parsed.content) {
          delta = parsed.content
        } else {
          delta = JSON.stringify(parsed)
        }
        
        if (delta) {
          if (!receivedChunk && typeof onFirstChunk === 'function') {
            onFirstChunk()
            receivedChunk = true
          }
          assistantMessage.content += delta
          scrollToBottom()
        }
      } catch (err) {
        console.warn('解析最终缓冲区内容失败:', err.message, buffer)
        if (!receivedChunk && typeof onFirstChunk === 'function') {
          onFirstChunk()
          receivedChunk = true
        }
        assistantMessage.content += buffer
        scrollToBottom()
      }
    }
  } catch (streamError) {
    console.error('流式处理过程中发生错误:', streamError)
    if (!receivedChunk && typeof onFirstChunk === 'function') {
      onFirstChunk()
      receivedChunk = true
    }
    assistantMessage.content += `\n\n处理流式响应失败: ${streamError.message}`
    scrollToBottom()
  } finally {
    if (reader) {
      try {
        reader.releaseLock()
      } catch (e) {
        console.warn('释放reader锁时出错:', e)
      }
    }
  }
  
  return receivedChunk
}

const parseResponseText = (text) => {
  try {
    const data = JSON.parse(text)
    return data.choices?.[0]?.message?.content || data.content || text
  } catch {
    return text
  }
}

// 处理上传文件方法
const handleUploadFile = (file) => {
  console.log('文件上传成功:', file)
  ElMessage.success(`文件 ${file.name} 上传成功!`)
}

// 复制消息
const copyMessage = (content) => {
  navigator.clipboard.writeText(content).then(() => {
    ElMessage.success('复制成功!')
  }).catch(() => {
    ElMessage.error('复制失败!')
  })
}

// 滚动到底部
const scrollToBottom = (smooth = true) => {
  nextTick(() => {
    const container = messagesContainer.value
    if (container) {
      const targetScrollTop = container.scrollHeight

      if (smooth) {
        container.scrollTo({
          top: targetScrollTop,
          behavior: 'smooth'
        })
      } else {
        container.scrollTop = targetScrollTop
      }
    }
  })
}

// 设置选中的模型
const setSelectedModel = (modelId) => {
  console.log('ChatPage收到模型切换事件:', modelId)
  selectedModel.value = modelId
  ElMessage.success(`已切换到模型：${modelConfig.value[modelId].name}`)
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
  
  saveChatHistory()
  
  return newSessionId
}

// 切换会话
const switchSession = (sessionId) => {
  currentSessionId.value = sessionId
  saveChatHistory()
  scrollToBottom()
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
  selectedModel
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
  padding: 24px 20px;
  padding-bottom: 40px;
  background: transparent;
  max-width: 900px;
  margin: 0 auto;
  width: 100%;
  scroll-behavior: smooth;
  scrollbar-gutter: stable;
  min-height: 0;
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

.chat-message--assistant .chat-message__text {
  background-color: var(--card-background);
  color: var(--text-primary);
  border-bottom-left-radius: var(--radius-sm);
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

.chat-message__copy-btn {
  opacity: 0;
  transition: var(--transition-fast);
}

.chat-message:hover .chat-message__copy-btn {
  opacity: 1;
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
</style>
