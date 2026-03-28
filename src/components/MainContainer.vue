<template>
  <main class="app-main" :class="{ 'app-main--fullscreen': isFullscreenPage }">
    <!-- 左侧导航栏 -->
    <Sidebar @new-chat="handleNewChat" />

    <!-- 主内容区域 -->
    <div class="app-main__container" :class="{ 'app-main__container--fullscreen': isFullscreenPage }">
      <!-- 路由视图 - 统一使用 router-view -->
      <router-view v-slot="{ Component }">
        <component :is="Component" :key="route.path" />
      </router-view>
    </div>
  </main>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Sidebar from './Sidebar.vue'

const route = useRoute()
const router = useRouter()

// 检查当前是否是全屏页面（知识图谱、画布）
const isFullscreenPage = computed(() => {
  return route.path === '/knowledge-graph' || route.path === '/canvas'
})

// 处理新建聊天事件
function handleNewChat() {
  console.log('[MainContainer] handleNewChat 被调用, 当前路径:', route.path)
  if (route.path !== '/chat') {
    router.push('/chat')
  } else {
    // 如果已经在聊天页面，触发刷新
    window.location.reload()
  }
}
</script>

<style scoped>
.app-main {
  display: flex;
  flex: 1;
  min-height: calc(100vh - 60px);
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
  position: relative;
}

/* 全屏模式样式 - 用于知识图谱、画布等页面 */
.app-main--fullscreen {
  position: relative;
}

.app-main__container--fullscreen {
  height: 100%;
}
</style>
