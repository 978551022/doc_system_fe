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
              @send-message="handleSendMessage"
              @upload-file="handleUploadFile"
              @model-change="handleModelChange"
              @new-chat="handleNewChat"
              :current-model="chatPageRef?.value?.selectedModel"
            />
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Sidebar from './Sidebar.vue'
import ChatInput from './ChatInput.vue'
import ChatPage from '../views/ChatPage.vue' // 导入ChatPage组件

const route = useRoute()
const router = useRouter()
const chatPageRef = ref(null) // 直接引用ChatPage组件

// 检查当前是否是聊天页面
const isChatPage = computed(() => {
  return route.path === '/chat'
})

// 处理发送消息事件
const handleSendMessage = (data) => {
  console.log('MainContainer收到发送消息事件:', data)
  
  try {
    if (chatPageRef.value) {
      console.log('chatPageRef.value:', chatPageRef.value)
      console.log('组件是否有sendMessage方法:', typeof chatPageRef.value.sendMessage === 'function')
      
      // 直接调用ChatPage组件的sendMessage方法
      chatPageRef.value.sendMessage(data)
      console.log('成功调用ChatPage的sendMessage方法')
    } else {
      console.error('chatPageRef.value为空，无法获取ChatPage组件实例')
    }
  } catch (error) {
    console.error('调用sendMessage方法时发生错误:', error)
  }
}

// 处理上传文件事件
const handleUploadFile = (file) => {
  console.log('MainContainer收到上传文件事件:', file)
  
  try {
    if (chatPageRef.value && typeof chatPageRef.value.handleUploadFile === 'function') {
      chatPageRef.value.handleUploadFile(file)
      console.log('成功调用ChatPage的handleUploadFile方法')
    } else {
      console.error('无法获取ChatPage组件实例或handleUploadFile方法')
    }
  } catch (error) {
    console.error('调用handleUploadFile方法时发生错误:', error)
  }
}

// 处理模型切换事件
const handleModelChange = (modelId) => {
  console.log('MainContainer收到模型切换事件:', modelId)
  
  try {
    if (chatPageRef.value && typeof chatPageRef.value.setSelectedModel === 'function') {
      chatPageRef.value.setSelectedModel(modelId)
      console.log('成功调用ChatPage的setSelectedModel方法')
    } else {
      console.error('无法获取ChatPage组件实例或setSelectedModel方法')
    }
  } catch (error) {
    console.error('调用setSelectedModel方法时发生错误:', error)
  }
}

// 处理新建聊天事件
const handleNewChat = () => {
  console.log('MainContainer收到新建聊天事件')
  
  try {
    if (isChatPage.value) {
      // 如果当前在聊天页面，直接创建新对话
      if (chatPageRef.value && typeof chatPageRef.value.createNewSession === 'function') {
        chatPageRef.value.createNewSession()
        console.log('成功调用ChatPage的createNewSession方法')
      } else {
        console.error('无法获取ChatPage组件实例或createNewSession方法')
      }
    } else {
      // 如果当前不在聊天页面，先跳转到聊天页面
      router.push('/chat')
      console.log('已跳转到聊天页面')
      // 由于路由跳转是异步的，我们需要等待下一个tick再调用createNewSession
      nextTick(() => {
        if (chatPageRef.value && typeof chatPageRef.value.createNewSession === 'function') {
          chatPageRef.value.createNewSession()
          console.log('成功调用ChatPage的createNewSession方法')
        } else {
          console.error('无法获取ChatPage组件实例或createNewSession方法')
        }
      })
    }
  } catch (error) {
    console.error('调用createNewSession方法时发生错误:', error)
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
