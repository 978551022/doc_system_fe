<template>
  <aside class="app-sidebar">
    <!-- 侧边栏标题 -->
    <div class="app-sidebar__header">
      <div class="app-sidebar__title">
        <i class="el-icon-folder-opened"></i>
        <el-button 
          type="primary" 
          @click="handleNewChat"
          class="new-chat-btn"
          size="small"
        >
          <i class="el-icon-circle-plus"></i>
          开启新对话
        </el-button>
      </div>
      <el-button 
        type="text" 
        @click="toggleCollapse"
        class="app-sidebar__collapse-btn"
        title="折叠/展开"
      >
        <i :class="isCollapsed ? 'el-icon-s-unfold' : 'el-icon-s-fold'"></i>
      </el-button>
    </div>
    
    <!-- 导航菜单 -->
    <el-menu
      :default-active="activeMenu"
      class="app-sidebar__menu"
      router
      :unique-opened="true"
      :collapse="isCollapsed"
      :collapse-transition="true"
    >
      <!-- 智能对话（默认页面） -->
      <el-menu-item index="/chat">
        <i class="el-icon-chat-dot-round"></i>
        <template #title>
          <span>智能对话</span>
        </template>
      </el-menu-item>
      
      <!-- 文档列表 -->
      <el-menu-item index="/documents">
        <i class="el-icon-document-copy"></i>
        <template #title>
          <span>文档列表</span>
        </template>
      </el-menu-item>
      
      <!-- API接口测试 -->
      <el-menu-item index="/api-test">
        <i class="el-icon-s-cooperation"></i>
        <template #title>
          <span>API接口测试</span>
        </template>
      </el-menu-item>
      
      <!-- 历史对话 -->
      <el-menu-item index="/history">
        <i class="el-icon-time"></i>
        <template #title>
          <span>历史对话</span>
        </template>
      </el-menu-item>
      
      <!-- 设置 -->
      <el-menu-item index="/settings">
        <i class="el-icon-setting"></i>
        <template #title>
          <span>设置</span>
        </template>
      </el-menu-item>
      
      <!-- 帮助 -->
      <el-menu-item index="/help">
        <i class="el-icon-question"></i>
        <template #title>
          <span>帮助</span>
        </template>
      </el-menu-item>
      
      <!-- 关于 -->
      <el-menu-item index="/about">
        <i class="el-icon-info"></i>
        <template #title>
          <span>关于</span>
        </template>
      </el-menu-item>
    </el-menu>
    
    <!-- 侧边栏底部 -->
    <el-dropdown @command="handleUserCommand" trigger="click" class="app-sidebar__footer">
      <div class="user-dropdown-trigger" role="button">
        <el-avatar :size="40" :src="userState.avatar" class="sidebar-user-avatar">
          <i v-if="!userState.avatar" class="el-icon-user-solid"></i>
        </el-avatar>
        <div class="app-sidebar__user-info" v-if="!isCollapsed">
          <div class="app-sidebar__username">{{ userState.username }}</div>
          <div class="app-sidebar__user-role">{{ userState.email }}</div>
        </div>
        <i v-if="!isCollapsed" class="el-icon-arrow-down user-dropdown-arrow"></i>
      </div>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item command="profile">
            <i class="el-icon-user"></i>
            个人中心
          </el-dropdown-item>
          <el-dropdown-item command="settings">
            <i class="el-icon-setting"></i>
            系统设置
          </el-dropdown-item>
          <el-dropdown-item command="contact">
            <i class="el-icon-phone"></i>
            联系我们
          </el-dropdown-item>
          <el-dropdown-item command="logout" divided>
            <i class="el-icon-switch-button"></i>
            退出登录
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </aside>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import userState from '../utils/userStore.js'

// 定义事件
const emit = defineEmits(['new-chat'])

// 跳转到个人中心
const goToProfile = () => {
  router.push('/settings')
}

// 处理用户下拉菜单命令
const handleUserCommand = (command) => {
  switch (command) {
    case 'profile':
      goToProfile()
      break
    case 'settings':
      router.push('/settings')
      break
    case 'contact':
      // 联系我们功能，这里可以添加具体实现
      console.log('联系我们')
      break
    case 'logout':
      // 退出登录功能，这里可以添加具体实现
      console.log('退出登录')
      break
    default:
      break
  }
}

const route = useRoute()
const router = useRouter()

// 折叠状态
const isCollapsed = ref(false)

// 切换折叠
const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
}

// 激活菜单
const activeMenu = computed(() => {
  return route.path
})

// 处理新建对话
const handleNewChat = () => {
  // 发送事件给父组件，由父组件调用ChatPage的createNewSession方法
  emit('new-chat')
}
</script>

<style scoped>
.app-sidebar {
  width: 220px;
  background-color: var(--menu-background);
  border-right: 1px solid var(--border-color);
  height: 100%;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  transition: var(--transition);
  flex-shrink: 0;
}

.app-sidebar:deep(.el-menu--collapse) {
  width: 64px;
}

.app-sidebar__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color);
  background-color: var(--menu-background);
}

.app-sidebar__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--primary-color);
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  flex: 1;
  justify-content: center;
}

/* 新建对话按钮样式 */
.new-chat-btn {
  background: var(--primary-gradient);
  border: none;
  border-radius: var(--radius-md);
  padding: 10px 20px;
  font-size: 13px;
  font-weight: 600;
  color: white !important;
  box-shadow: var(--shadow-sm);
  transition: var(--transition);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  letter-spacing: 0.02em;
  width: 100%;
  justify-content: center;
  max-width: 180px;
}

/* 隐藏标题图标 */
.app-sidebar__title i {
  display: none;
}

.new-chat-btn:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
  opacity: 0.95;
}

.new-chat-btn:active {
  transform: translateY(0);
}

.new-chat-btn i {
  font-size: 14px;
  color: white;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.app-sidebar__collapse-btn {
  font-size: 16px;
  color: var(--text-muted);
  padding: 4px;
}

.app-sidebar__collapse-btn:hover {
  color: var(--primary-color);
}

.app-sidebar__menu {
  border-right: none;
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.app-sidebar:deep(.el-menu-item) {
  height: 44px;
  line-height: 44px;
  font-size: 13px;
  color: var(--menu-item-color);
  margin: 2px 8px;
  border-radius: var(--radius-sm);
  transition: var(--transition);
}

.app-sidebar:deep(.el-menu-item:hover) {
  background-color: var(--menu-item-hover) !important;
  color: var(--primary-color) !important;
}

.app-sidebar:deep(.el-menu-item.is-active) {
  background: var(--menu-item-active) !important;
  color: white !important;
  box-shadow: var(--shadow-sm);
}

.app-sidebar:deep(.el-menu-item i) {
  font-size: 16px;
  margin-right: 10px;
}

.app-sidebar:deep(.el-menu--collapse .el-menu-item i) {
  margin-right: 0;
}

.app-sidebar__footer {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-top: 1px solid var(--border-color);
  gap: 10px;
  transition: var(--transition);
  background-color: var(--menu-background);
}

.user-dropdown-trigger {
  display: flex;
  align-items: center;
  cursor: pointer;
  width: 100%;
  gap: 10px;
  padding: 6px;
  border-radius: var(--radius-sm);
  transition: var(--transition);
}

.user-dropdown-trigger:hover {
  background-color: var(--menu-item-hover);
}

.user-dropdown-arrow {
  font-size: 11px;
  color: var(--text-muted);
  margin-left: auto;
  transition: var(--transition);
}

.user-dropdown-trigger:hover .user-dropdown-arrow {
  color: var(--primary-color);
}

/* 侧边栏用户头像 */
.sidebar-user-avatar {
  background: var(--primary-gradient);
  color: white;
  border: 2px solid var(--border-color);
  transition: var(--transition);
  flex-shrink: 0;
}

.user-dropdown-trigger:hover .sidebar-user-avatar {
  transform: scale(1.05);
  border-color: var(--primary-color);
}

.app-sidebar__user-info {
  flex: 1;
  min-width: 0;
}

.app-sidebar__username {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.app-sidebar__user-role {
  font-size: 11px;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 下拉菜单样式 */
.app-sidebar__footer :deep(.el-dropdown-menu) {
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--border-color);
  padding: 6px 0;
  background: var(--card-background);
}

.app-sidebar__footer :deep(.el-dropdown-item) {
  padding: 10px 16px;
  font-size: 13px;
  transition: var(--transition);
  display: flex;
  align-items: center;
  gap: 10px;
  border-radius: var(--radius-sm);
  margin: 2px 6px;
  color: var(--text-primary);
  font-weight: 500;
}

.app-sidebar__footer :deep(.el-dropdown-item:hover) {
  background: var(--primary-gradient);
  color: white;
}

.app-sidebar__footer :deep(.el-dropdown-item i) {
  font-size: 15px;
  width: 18px;
  text-align: center;
}

/* 深色主题下的下拉菜单样式 */
.dark-theme .app-sidebar__footer :deep(.el-dropdown-menu) {
  background: var(--card-background);
  border-color: var(--border-color);
}

.dark-theme .app-sidebar__footer :deep(.el-dropdown-item) {
  color: var(--text-primary);
}

.dark-theme .app-sidebar__footer :deep(.el-dropdown-item:hover) {
  background: var(--primary-gradient);
  color: white;
}
</style>
