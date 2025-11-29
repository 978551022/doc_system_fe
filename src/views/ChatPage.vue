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
          <i :class="message.role === 'user' ? 'el-icon-user' : 'el-icon-chat-dot-round'">
          </i>
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
          <i class="el-icon-chat-dot-round"></i>
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
import { Loading } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

// 聊天会话列表
const chatSessions = ref([
  {
    id: 'session-1',
    title: '新对话',
    messages: [],
    conversationHistory: [],
    createdAt: new Date().toISOString()
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
    api_key: "sk-f37bb7bb404c42cc967dcbe1f84af90a" // 用户提供的DeepSeek API密钥
  },
  // GLM模型配置
  glm: {
    name: "GLM-4.5-Flash",
    type: "glm",
    model: "GLM-4.5-Flash",
    base_url: "https://open.bigmodel.cn/api/coding/paas/v4",
    api_key: "eb870e0270e3449896a11231fbcadc4e.nAX0cJvBZiLy274g" // 用户提供的GLM API密钥
  },
  // Qwen模型配置
  qwen: {
    name: "Qwen 2",
    type: "qwen",
    model: "qwen-plus",
    base_url: "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
    api_key: "sk-2d97c4a4a3a04eaf81a296b67632166a" // 用户提供的Qwen API密钥
  }
})

// 模型列表，用于UI显示
const models = ref([
  { id: 'deepseek', name: 'DeepSeek', icon: 'el-icon-chat-dot-round' },
  { id: 'glm', name: 'GLM-4.5-Flash', icon: 'el-icon-chat-dot-round' },
  { id: 'qwen', name: 'Qwen 2', icon: 'el-icon-chat-dot-round' }
])

// 当前选中的模型
const selectedModel = ref('deepseek') // 默认使用DeepSeek模型，不再使用Qwen 2

// 控制是否可以发送新消息的状态
const isSending = ref(false)

// 发送消息方法（用于接收来自ChatInput的消息）
const sendMessage = async (data) => {
  console.log('ChatPage收到消息:', data)
  const { content, files } = data
  
  // 允许只有文件上传而没有文本内容
  if (!content.trim() && (!files || files.length === 0)) return
  
  // 如果正在发送消息，则不允许发送新消息
  if (isSending.value) {
    console.warn('正在发送消息，请等待完成后再发送新消息')
    return
  }
  
  // 设置发送状态为true
  isSending.value = true
  
  // 处理文件上传
  let uploadedFileNames = []
  if (files && files.length > 0) {
    // 上传每个文件
    for (const file of files) {
      try {
        console.log('上传文件:', file.name)
        // 这里可以添加文件上传逻辑
        // 由于我们只需要文件名，暂时直接使用文件名
        uploadedFileNames.push(file.name)
      } catch (error) {
        console.error('上传文件失败:', error)
        ElMessage.error(`上传文件 ${file.name} 失败: ${error.message}`)
      }
    }
  }
  
  // 处理文件信息，将文件名添加到消息内容中
  let messageContent = content.trim()
  if (uploadedFileNames.length > 0) {
    const fileNames = uploadedFileNames.join(', ')
    messageContent += `\n\n已上传文件: ${fileNames}`
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
  
  // 添加到当前会话的对话历史
  currentSession.value.conversationHistory.push({
    role: 'user',
    content: messageContent
  })
  
  const sessionRef = currentSession.value
  try {
      // 获取当前模型配置
      const config = modelConfig.value[selectedModel.value]
      console.log('当前模型配置:', config)
      
      let requestUrl, requestBody, headers
      
      // 根据模型类型处理不同的API请求
      switch (config.type) {
        case 'deepseek':
          // DeepSeek API配置
          requestUrl = `${config.base_url}v1/chat/completions`
          requestBody = {
            model: config.model,
            messages: sessionRef.conversationHistory,
            temperature: 0.7,
            max_tokens: 2000,
            stream: true // 启用流式输出
          }
          headers = {
            'Authorization': `Bearer ${config.api_key}`,
            'Content-Type': 'application/json'
          }
          break
        case 'glm':
          // GLM API配置
          requestUrl = `${config.base_url}/chat/completions`
          requestBody = {
            model: config.model,
            messages: sessionRef.conversationHistory,
            temperature: 0.7,
            max_tokens: 2000,
            stream: true // 启用流式输出
          }
          headers = {
            'Authorization': `Bearer ${config.api_key}`,
            'Content-Type': 'application/json'
          }
          break
        case 'qwen':
          // Qwen API配置
          requestUrl = config.base_url
          requestBody = {
            model: config.model,
            messages: sessionRef.conversationHistory,
            temperature: 0.7,
            max_tokens: 2000,
            stream: true // 启用流式输出
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
      console.log('请求参数:', requestBody)
      
      // 显示加载状态
      isTyping.value = true
      
      const response = await fetch(requestUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      })
      
      if (!response.ok) {
        throw new Error(`请求失败，状态码：${response.status}`)
      }
      
      // 使用reactive创建助手消息对象，确保所有属性都是响应式的
      const assistantMessage = reactive({
        id: Date.now() + 1,
        role: 'assistant',
        content: '',
        time: new Date().toLocaleTimeString()
      })
      
      // 立即添加到消息列表
      sessionRef.messages.push(assistantMessage)
      
      // 调用streamResponse处理响应，更新消息内容
      await streamResponse(response, assistantMessage, () => {
        // 当收到第一个chunk时，隐藏加载状态
        isTyping.value = false
        scrollToBottom()
      })
    
    sessionRef.conversationHistory.push({
      role: 'assistant',
      content: assistantMessage.content
    })
    
    console.log('对话历史更新:', currentSession.value.conversationHistory)
    scrollToBottom()
  } catch (error) {
    console.error('调用AI模型失败:', error)
    
    // 隐藏加载状态
    isTyping.value = false
    
    // 友好的错误提示
    let errorMsg = '抱歉，暂时无法为您提供服务，请稍后重试。'
    
    if (error.response) {
      // 服务器返回了错误状态码
      if (error.response.status === 401) {
        errorMsg = 'API密钥无效，请检查您的配置。'
      } else if (error.response.status === 403) {
        errorMsg = '您没有权限访问该模型。'
      } else if (error.response.status === 429) {
        errorMsg = '请求过于频繁，请稍后重试。'
      } else if (error.response.status === 500) {
        errorMsg = '服务器内部错误，请稍后重试。'
      } else {
        errorMsg = `请求失败，状态码：${error.response.status}`
      }
    } else if (error.request) {
      // 请求已发送但没有收到响应
      errorMsg = '无法连接到服务器，请检查网络连接。'
    } else {
      // 请求配置出错
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
    // 无论成功或失败，都重置发送状态
    isSending.value = false
  }
}

// 流式处理响应
const streamResponse = async (response, assistantMessage, onFirstChunk) => {
  let receivedChunk = false
  
  // 确保assistantMessage有content属性
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
      
      // 解码并添加到缓冲区
      buffer += decoder.decode(value, { stream: true })
      
      // 处理缓冲区中的完整行
      const lines = buffer.split('\n')
      buffer = lines.pop() || '' // 保留最后一个不完整的行
      
      for (const rawLine of lines) {
          const line = rawLine.trim()
          if (!line) continue
          
          console.log('处理行:', line)
          
          // 检查是否是结束标记
          if (line === 'data: [DONE]' || line === '[DONE]') {
            console.log('收到结束标记')
            continue // 继续处理，不立即返回
          }
          
          let payload = line
          // 提取data:后面的内容
          if (payload.startsWith('data:')) {
            payload = payload.slice(5).trim()
          }
          
          // 跳过空的有效载荷
          if (!payload) continue
          
          try {
            const parsed = JSON.parse(payload)
            
            // 处理不同模型的响应格式
            let delta = ''
            
            // DeepSeek和GLM格式
            if (parsed.choices && parsed.choices[0]) {
              if (parsed.choices[0].delta) {
                delta = parsed.choices[0].delta.content || ''
              } else if (parsed.choices[0].message) {
                delta = parsed.choices[0].message.content || ''
              }
            }
            // Qwen格式
            else if (parsed.content) {
              delta = parsed.content
            }
            // 其他格式
            else {
              delta = JSON.stringify(parsed)
            }
            
            if (delta) {
              console.log('收到内容:', delta)
              
              // 第一次接收到有效内容时调用回调
              if (!receivedChunk && typeof onFirstChunk === 'function') {
                onFirstChunk()
                receivedChunk = true
              }
              
              // 使用Vue的响应式更新机制，确保content变化被检测到
              // 先获取当前content，然后添加delta，最后重新赋值
              const currentContent = assistantMessage.content
              const newContent = currentContent + delta
              assistantMessage.content = newContent
              
              // 立即滚动到底部
              scrollToBottom(false) // 使用非平滑滚动，确保实时更新
            }
          } catch (err) {
            // 如果不是有效的JSON，尝试直接添加到内容中
            console.warn('解析流式片段失败，直接添加到内容:', err.message, payload)
            if (!receivedChunk && typeof onFirstChunk === 'function') {
              onFirstChunk()
              receivedChunk = true
            }
            // 使用Vue的响应式更新机制
            const currentContent = assistantMessage.content
            const newContent = currentContent + payload
            assistantMessage.content = newContent
            scrollToBottom(false)
          }
        }
    }
    
    // 处理剩余的缓冲区内容
    if (buffer.trim()) {
      console.log('处理剩余缓冲区:', buffer)
      try {
        const parsed = JSON.parse(buffer.trim())
        let delta = ''
        
        // 处理不同模型的响应格式
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
          // 使用Vue的响应式更新机制
          const currentContent = assistantMessage.content
          const newContent = currentContent + delta
          assistantMessage.content = newContent
          scrollToBottom()
        }
      } catch (err) {
        console.warn('解析最终缓冲区内容失败，直接添加:', err.message, buffer)
        if (!receivedChunk && typeof onFirstChunk === 'function') {
          onFirstChunk()
          receivedChunk = true
        }
        // 使用Vue的响应式更新机制
        const currentContent = assistantMessage.content
        const newContent = currentContent + buffer
        assistantMessage.content = newContent
        scrollToBottom()
      }
    }
  } catch (streamError) {
    console.error('流式处理过程中发生错误:', streamError)
    // 显示错误信息
    if (!receivedChunk && typeof onFirstChunk === 'function') {
      onFirstChunk()
      receivedChunk = true
    }
    // 使用Vue的响应式更新机制
    const currentContent = assistantMessage.content
    const newContent = currentContent + `\n\n处理流式响应失败: ${streamError.message}`
    assistantMessage.content = newContent
    scrollToBottom()
  } finally {
    // 确保释放reader资源
    if (reader) {
      try {
        reader.releaseLock()
        console.log('释放reader锁')
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
    return data.choices?.[0]?.message?.content ||
           data.content ||
           text
  } catch {
    return text
  }
}

// 处理上传文件方法（用于接收来自ChatInput的文件）
const handleUploadFile = (file) => {
  // 这里可以添加文件上传后的处理逻辑
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

// 滚动到底部（带平滑效果）
const scrollToBottom = (smooth = true) => {
  nextTick(() => {
    const container = messagesContainer.value
    if (container) {
      if (smooth) {
        // 使用平滑滚动
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'smooth'
        })
      } else {
        // 立即滚动到底部
        container.scrollTop = container.scrollHeight
      }
    }
  })
}

// 设置选中的模型
const setSelectedModel = (modelId) => {
  console.log('ChatPage收到模型切换事件:', modelId)
  selectedModel.value = modelId
  // 保留对话历史，不清空
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
    createdAt: new Date().toISOString()
  }
  
  chatSessions.value.unshift(newSession)
  currentSessionId.value = newSessionId
  
  // 保存到本地存储
  saveChatHistory()
  
  return newSessionId
}

// 切换会话
const switchSession = (sessionId) => {
  currentSessionId.value = sessionId
  // 保存到本地存储
  saveChatHistory()
  scrollToBottom()
}

// 删除会话
const deleteSession = (sessionId) => {
  const index = chatSessions.value.findIndex(session => session.id === sessionId)
  if (index > -1) {
    chatSessions.value.splice(index, 1)
    
    // 如果删除的是当前会话，切换到第一个会话
    if (currentSessionId.value === sessionId && chatSessions.value.length > 0) {
      currentSessionId.value = chatSessions.value[0].id
    }
    
    // 保存到本地存储
    saveChatHistory()
  }
}

// 保存聊天记录到本地存储
const saveChatHistory = () => {
  localStorage.setItem('chatHistory', JSON.stringify({
    chatSessions: chatSessions.value,
    currentSessionId: currentSessionId.value,
    selectedModel: selectedModel.value
  }))
}

// 从本地存储加载聊天记录
const loadChatHistory = () => {
  const savedHistory = localStorage.getItem('chatHistory')
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
      // 如果加载失败，初始化一个新会话
      initializeDefaultSession()
    }
  } else {
    // 如果没有保存的记录，初始化一个新会话
    initializeDefaultSession()
  }
}

// 初始化默认会话
const initializeDefaultSession = () => {
  // 初始化空会话，不添加欢迎消息
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





// 生命周期钩子
onMounted(() => {
  // 从本地存储加载聊天记录
  loadChatHistory()
  
  // 监听窗口大小变化，确保在窗口调整时消息容器仍然正确显示
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

/* 聊天消息列表 */
.chat-messages {
  flex: 1;
  overflow-y: visible;
  padding: 20px;
  background: transparent;
  border-radius: 0;
  border: none;
  box-shadow: none;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  /* 优化滚动行为 */
  scroll-behavior: smooth;
  /* 防止滚动条闪烁 */
  scrollbar-gutter: stable;
}

/* 聊天消息 */
.chat-message {
  display: flex;
  margin-bottom: 20px;
  animation: fadeIn 0.3s ease;
  padding: 0 10px;
  /* 添加过渡效果使消息出现更自然 */
  transition: all 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
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
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 20px;
  margin: 0 10px;
  flex-shrink: 0;
  box-shadow: var(--shadow-sm);
  background-color: var(--surface-color);
  color: var(--text-secondary);
  transition: var(--transition);
}

.chat-message__avatar:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.chat-message--user .chat-message__avatar {
  background-color: #667eea;
  color: white;
  order: 2;
}

.chat-message--assistant .chat-message__avatar {
  background-color: #4ecdc4;
  color: white;
  order: 1;
}

.chat-message__content {
  max-width: 75%;
  min-width: 120px;
}

.chat-message--user .chat-message__content {
  order: 1;
}

.chat-message--assistant .chat-message__content {
  order: 2;
}

.chat-message__text {
  padding: 14px 20px;
  border-radius: 18px;
  line-height: 1.6;
  word-break: break-word;
  font-size: 15px;
  box-shadow: var(--shadow-sm);
  background-color: var(--card-background);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  transition: var(--transition);
}

.chat-message__text:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.chat-message--user .chat-message__text {
  background-color: var(--primary-color);
  color: white;
  border-bottom-right-radius: 4px;
  border-color: var(--primary-color);
}

.chat-message--assistant .chat-message__text {
  background-color: var(--card-background);
  color: var(--text-primary);
  border-bottom-left-radius: 4px;
  border-color: var(--border-color);
}

.chat-message__meta {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 8px;
  font-size: 12px;
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
  transition: opacity 0.3s ease;
}

.chat-message:hover .chat-message__copy-btn {
  opacity: 1;
}

.chat-message__typing {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 20px;
  background-color: #ffffff;
  border-radius: 18px;
  border-bottom-left-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e0e0e0;
}

/* 滚动条样式 */
.chat-messages::-webkit-scrollbar {
  width: 6px;
}

.chat-messages::-webkit-scrollbar-track {
  background: var(--surface-color);
  border-radius: 3px;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 3px;
}

.chat-messages::-webkit-scrollbar-thumb:hover {
  background: var(--border-hover);
}
</style>
