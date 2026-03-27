<template>
  <main class="app-main">
    <!-- 左侧导航栏 -->
    <Sidebar @new-chat="handleNewChat" />
    
    <!-- 主内容区域 -->
    <div class="app-main__container">
      <!-- 聊天记录区域 -->
      <div class="app-main__content">
        <!-- 直接使用ChatPage组件，而不是通过router-view -->
        <ChatPage 
          ref="chatPageRef" 
          v-if="isChatPage"
        />
        <router-view v-else />
      </div>

      <!-- 底部聊天输入区域 -->
      <div class="app-main__chat-input" v-if="isChatPage">
        <ChatInput
          ref="chatInputRef"
          @send-message="handleSendMessage"
          @upload-file="handleUploadFile"
          @model-change="handleModelChange"
          @new-chat="handleNewChat"
          @load-history="handleLoadHistory"
          @delete-history="handleDeleteHistory"
          @pause-generation="handlePauseGeneration"
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
          :current-model="currentModel"
          :is-generating="isGenerating"
          :conversation-id="conversationId"
          :model-name="chatConfig.modelName"
          :online-search="chatConfig.onlineSearch"
          :deep-reasoning="chatConfig.deepReasoning"
        />
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, computed, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Sidebar from './Sidebar.vue'
import ChatInput from './ChatInput.vue'
import ChatPage from '../views/ChatPage.vue' // 导入ChatPage组件

const route = useRoute()
const router = useRouter()
const chatPageRef = ref(null) // 直接引用ChatPage组件
const chatInputRef = ref(null) // 引用ChatInput组件

// 标志位：用于在路由跳转后创建新会话
let shouldCreateNewSessionAfterRouteChange = false

// 检查当前是否是聊天页面
const isChatPage = computed(() => {
  return route.path === '/chat'
})

// 监听路由变化，如果标志位为true则创建新会话
watch(route, (newRoute) => {
  if (shouldCreateNewSessionAfterRouteChange && newRoute.path === '/chat') {
    shouldCreateNewSessionAfterRouteChange = false
    nextTick(() => {
      if (chatPageRef.value && typeof chatPageRef.value.createNewSession === 'function') {
        console.log('[MainContainer] 路由变化后创建新会话')
        chatPageRef.value.createNewSession()
      }
    })
  }
})

// 当前选中的模型
const currentModel = computed(() => {
  return chatPageRef.value?.selectedModel || 'deepseek'
})

// 用于传递给 ChatInput 的生成状态
// 使用 toValue 确保 ref 的响应性被正确传递
const isGenerating = computed({
  get() {
    const value = chatPageRef.value?.isGenerating
    // 如果是 ref 对象，使用 .value 获取
    if (value && typeof value === 'object' && 'value' in value) {
      return value.value
    }
    return value || false
  },
  set(val) {
    if (chatPageRef.value?.isGenerating) {
      const ref = chatPageRef.value.isGenerating
      if (typeof ref === 'object' && 'value' in ref) {
        ref.value = val
      }
    }
  }
})

// 获取当前会话的 backendConversationId
const conversationId = computed(() => {
  return chatPageRef.value?.currentSession?.backendConversationId || ''
})

const isPaused = computed({
  get() {
    const value = chatPageRef.value?.isPaused
    if (value && typeof value === 'object' && 'value' in value) {
      return value.value
    }
    return value || false
  },
  set(val) {
    if (chatPageRef.value?.isPaused) {
      const ref = chatPageRef.value.isPaused
      if (typeof ref === 'object' && 'value' in ref) {
        ref.value = val
      }
    }
  }
})

// 获取聊天配置（用于语音上传）
const chatConfig = computed(() => {
  if (chatPageRef.value && typeof chatPageRef.value.getChatConfig === 'function') {
    return chatPageRef.value.getChatConfig()
  }
  // 默认配置
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
    modelName: currentModel.value,
    onlineSearch,
    deepReasoning
  }
})

// 处理发送消息事件
const handleSendMessage = (data) => {
  try {
    if (chatPageRef.value) {
      // 直接调用ChatPage组件的sendMessage方法
      chatPageRef.value.sendMessage(data)
    } else {
      console.error('chatPageRef.value为空，无法获取ChatPage组件实例')
    }
  } catch (error) {
    console.error('调用sendMessage方法时发生错误:', error)
  }
}

// 处理上传文件事件
const handleUploadFile = (file) => {
  try {
    if (chatPageRef.value && typeof chatPageRef.value.handleUploadFile === 'function') {
      chatPageRef.value.handleUploadFile(file)
    } else {
      console.error('无法获取ChatPage组件实例或handleUploadFile方法')
    }
  } catch (error) {
    console.error('调用handleUploadFile方法时发生错误:', error)
  }
}

// 处理模型切换事件
const handleModelChange = (modelId) => {
  try {
    if (chatPageRef.value && typeof chatPageRef.value.setSelectedModel === 'function') {
      chatPageRef.value.setSelectedModel(modelId)
    } else {
      console.error('无法获取ChatPage组件实例或setSelectedModel方法')
    }
  } catch (error) {
    console.error('调用setSelectedModel方法时发生错误:', error)
  }
}

// 处理新建聊天事件
const handleNewChat = () => {
  console.log('[MainContainer] handleNewChat 被调用, isChatPage:', isChatPage.value, 'chatPageRef.value:', chatPageRef.value, '当前路径:', route.path)
  try {
    if (isChatPage.value) {
      // 如果当前在聊天页面，直接创建新对话
      if (chatPageRef.value && typeof chatPageRef.value.createNewSession === 'function') {
        console.log('[MainContainer] 调用 createNewSession')
        chatPageRef.value.createNewSession()
      } else {
        console.error('无法获取ChatPage组件实例或createNewSession方法')
      }
    } else {
      // 如果当前不在聊天页面，先跳转到聊天页面
      console.log('[MainContainer] 设置标志位并跳转到聊天页面')
      shouldCreateNewSessionAfterRouteChange = true
      router.push('/chat')
    }
  } catch (error) {
    console.error('调用createNewSession方法时发生错误:', error)
  }
}

// 从 ChatInput 或 History 弹窗加载指定会话
const handleLoadHistory = (sessionId) => {
  try {
    const goAndSwitch = () => {
      if (chatPageRef.value && typeof chatPageRef.value.switchSession === 'function') {
        chatPageRef.value.switchSession(sessionId)
      } else {
        console.error('无法获取ChatPage组件实例或switchSession方法')
      }
    }

    if (!isChatPage.value) {
      router.push('/chat')
      nextTick(goAndSwitch)
    } else {
      goAndSwitch()
    }
  } catch (error) {
    console.error('加载历史会话时发生错误:', error)
  }
}

// 从 ChatInput 删除指定会话
const handleDeleteHistory = (sessionId) => {
  try {
    if (chatPageRef.value && typeof chatPageRef.value.deleteSession === 'function') {
      chatPageRef.value.deleteSession(sessionId)
    } else {
      console.error('无法获取ChatPage组件实例或deleteSession方法')
    }
  } catch (error) {
    console.error('删除历史会话时发生错误:', error)
  }
}

// 处理暂停生成事件
const handlePauseGeneration = () => {
  try {
    // 暂停文本消息的生成
    if (chatPageRef.value && typeof chatPageRef.value.handlePauseGeneration === 'function') {
      chatPageRef.value.handlePauseGeneration()
    }
    // 中断语音上传
    if (chatInputRef.value && typeof chatInputRef.value.abortVoiceUpload === 'function') {
      chatInputRef.value.abortVoiceUpload()
    }
  } catch (error) {
    console.error('暂停生成时发生错误:', error)
  }
}

// 处理语音消息就绪事件
const handleVoiceMessageReady = (data) => {
  try {
    if (chatPageRef.value && typeof chatPageRef.value.handleVoiceMessage === 'function') {
      chatPageRef.value.handleVoiceMessage(data)
    }
  } catch (error) {
    console.error('处理语音消息时发生错误:', error)
  }
}

// 处理语音流式内容
const handleVoiceChunk = (data) => {
  try {
    if (chatPageRef.value && typeof chatPageRef.value.handleVoiceChunk === 'function') {
      chatPageRef.value.handleVoiceChunk(data)
    }
  } catch (error) {
    console.error('处理语音流式内容时发生错误:', error)
  }
}

// 处理语音完成
const handleVoiceComplete = (data) => {
  try {
    if (chatPageRef.value && typeof chatPageRef.value.handleVoiceComplete === 'function') {
      chatPageRef.value.handleVoiceComplete(data)
    }
  } catch (error) {
    console.error('处理语音完成时发生错误:', error)
  }
}

// 处理语音元数据更新（如uploadId）
const handleVoiceMetadataUpdate = (data) => {
  try {
    if (chatPageRef.value && typeof chatPageRef.value.handleVoiceMetadataUpdate === 'function') {
      chatPageRef.value.handleVoiceMetadataUpdate(data)
    }
  } catch (error) {
    console.error('处理语音元数据更新时发生错误:', error)
  }
}

// 处理语音上传全部完成
const handleVoiceUploadComplete = (data) => {
  try {
    if (chatPageRef.value && typeof chatPageRef.value.handleVoiceUploadComplete === 'function') {
      chatPageRef.value.handleVoiceUploadComplete(data)
    }
  } catch (error) {
    console.error('处理语音上传完成时发生错误:', error)
  }
}

// 处理录音状态变化事件
const handleRecordingStateChanged = (isRecording) => {
  try {
    if (chatPageRef.value && typeof chatPageRef.value.setRecordingState === 'function') {
      chatPageRef.value.setRecordingState(isRecording)
    }
  } catch (error) {
    console.error('处理录音状态变化时发生错误:', error)
  }
}

// 处理音频数据事件（用于波形显示）
const handleAudioDataAvailable = (audioData) => {
  try {
    if (chatPageRef.value && typeof chatPageRef.value.updateWaveformData === 'function') {
      chatPageRef.value.updateWaveformData(audioData)
    }
  } catch (error) {
    console.error('处理音频数据时发生错误:', error)
  }
}

// 处理初始化会话请求（现在语音上传不需要预先初始化会话）
const handleInitializeConversation = async () => {
  // 语音上传API会自动创建新会话，不需要预先初始化
  console.log('[MainContainer] 语音上传会自动创建会话，无需预先初始化')
}

// 处理会话ID更新（语音上传后后端返回新的会话ID）
const handleConversationIdUpdate = (conversationId) => {
  console.log('[MainContainer] 收到会话ID更新:', conversationId)
  try {
    if (chatPageRef.value && conversationId) {
      // 更新ChatPage中的会话ID
      if (chatPageRef.value.currentSession) {
        chatPageRef.value.currentSession.backendConversationId = conversationId
        console.log('[MainContainer] 会话ID已更新到当前会话')
      }
    }
  } catch (error) {
    console.error('更新会话ID时发生错误:', error)
  }
}

// 处理语音上传被中止
const handleVoiceAborted = () => {
  try {
    if (chatPageRef.value && typeof chatPageRef.value.handleVoiceAborted === 'function') {
      chatPageRef.value.handleVoiceAborted()
    }
  } catch (error) {
    console.error('处理语音中止时发生错误:', error)
  }
}
</script>

<style scoped>
.app-main {
  display: flex;
  flex: 1;
  min-height: calc(100vh - 60px); /* 减去Header高度 */
  background-color: var(--background-color);
  overflow: hidden;
  width: 100%;
  transition: var(--transition);
}

.app-main__container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  height: 100%;
  background-color: var(--background-color);
  border-radius: 0;
  margin: 0;
  box-shadow: none;
  transition: var(--transition);
}

.app-main__content {
  flex: 1;
  overflow-y: auto;
  padding: 0;
  margin: 0;
  background-color: var(--background-color);
  transition: var(--transition);
}

.app-main__chat-input {
  background: transparent;
  border-top: none;
  box-shadow: none;
  padding-top: 0;
  z-index: 10;
  transition: var(--transition);
}
</style>
