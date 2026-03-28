<template>
  <!-- 侧边栏容器 -->
  <div class="sidebar-wrapper" :class="{ 'sidebar-wrapper--hidden': isHidden }">
    <!-- 收缩/展开指示标 -->
    <div class="sidebar-toggle" :class="{ 'sidebar-toggle--collapsed': isHidden }" @click="toggleSidebar" :title="isHidden ? '展开导航栏' : '收起导航栏'">
      <div class="sidebar-toggle__indicator">
        <i :class="isHidden ? 'el-icon-s-unfold' : 'el-icon-d-arrow-left'"></i>
      </div>
    </div>

    <aside class="app-sidebar">
      <!-- 侧边栏标题 -->
      <div class="app-sidebar__header">
        <div class="app-sidebar__title">
          <i class="el-icon-folder-opened"></i>
        </div>
        <el-button
          type="text"
          @click="toggleCollapse"
          class="app-sidebar__collapse-btn"
          title="折叠菜单"
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

        <!-- 画布编排 -->
        <el-menu-item index="/canvas">
          <i class="el-icon-share"></i>
          <template #title>
            <span>画布</span>
          </template>
        </el-menu-item>

        <!-- 知识图谱 -->
        <el-menu-item index="/knowledge-graph">
          <i class="el-icon-connection"></i>
          <template #title>
            <span>知识图谱</span>
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
          <el-avatar :size="40" :src="userState.avatar" class="sidebar-user-avatar" @error="handleAvatarError">
            <i v-if="!userState.avatar" class="el-icon-user-solid"></i>
            <span v-else>{{ userState.username?.charAt(0)?.toUpperCase() || 'U' }}</span>
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
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import userState, { logout as logoutUser, getToken } from '../utils/userStore.js'
import { logout as logoutApi } from '../api/auth.js'

const emit = defineEmits(['new-chat'])

const route = useRoute()
const router = useRouter()

const isCollapsed = ref(false)
const isHidden = ref(false)
const savedCollapsedState = ref(false)
const isFullscreenPage = ref(false) // 标记当前是否在全屏页面

// 从localStorage读取保存的状态
onMounted(() => {
  const savedCollapsed = localStorage.getItem('sidebarCollapsed')
  if (savedCollapsed === 'true') {
    isCollapsed.value = true
    savedCollapsedState.value = true
  }
  // 不再从localStorage读取sidebarHidden，因为它应该由路由状态决定
})

// 监听路由变化，在知识图谱和画布页面自动隐藏侧边栏
watch(() => route.path, (newPath) => {
  const fullscreenPages = ['/knowledge-graph', '/canvas']
  if (fullscreenPages.includes(newPath)) {
    // 进入全屏页面，保存当前状态并隐藏侧边栏
    isFullscreenPage.value = true
    savedCollapsedState.value = isCollapsed.value
    isHidden.value = true
  } else {
    // 离开全屏页面，恢复显示侧边栏
    isFullscreenPage.value = false
    isHidden.value = false
  }
}, { immediate: true })

// 保存状态到localStorage（仅当用户手动操作时）
watch(isCollapsed, (val) => {
  localStorage.setItem('sidebarCollapsed', String(val))
})

// 头像加载失败处理
const handleAvatarError = (e) => {
  return false
}

// 切换侧边栏显示/隐藏
const toggleSidebar = () => {
  isHidden.value = !isHidden.value
}

// 切换菜单折叠
const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
}

const activeMenu = computed(() => {
  return route.path
})

const handleNewChat = () => {
  console.log('[Sidebar] 点击了开启新对话按钮')
  emit('new-chat')
}

const goToProfile = () => {
  router.push('/settings')
}

const handleUserCommand = async (command) => {
  switch (command) {
    case 'profile':
      goToProfile()
      break
    case 'settings':
      router.push('/settings')
      break
    case 'contact':
      // 联系我们
      break
    case 'logout':
      // 立即退出，不等待API响应
      const token = getToken()
      logoutUser()
      ElMessage.success('已退出登录')
      router.push('/login')
      // 后台调用登出API（不阻塞）
      if (token) {
        logoutApi(token).catch(error => {
          console.error('登出API调用失败:', error)
        })
      }
      break
    default:
      break
  }
}
</script>

<style scoped>
/* ========== 侧边栏包装器 ========== */
.sidebar-wrapper {
  position: relative;
  display: flex;
  align-items: stretch;
  transition: var(--transition);
}

.sidebar-wrapper--hidden {
  width: 0;
  overflow: visible;
}

.sidebar-wrapper--hidden .app-sidebar {
  margin-left: -220px;
}

/* ========== 侧边栏主体 ========== */
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

/* ========== 收缩/展开指示标（优化为圆形悬浮按钮） ========== */
.sidebar-toggle {
  position: fixed;
  left: 220px;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 80px;
  background: var(--card-background);
  border: 1px solid var(--border-color);
  border-left: none;
  border-radius: 0 var(--radius-lg) var(--radius-lg) 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: var(--transition);
  z-index: 100;
  box-shadow: var(--shadow-sm);
}

.sidebar-toggle::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 36px;
  background: var(--primary-color);
  border-radius: 0 2px 2px 0;
  transition: var(--transition);
}

.sidebar-toggle:hover {
  width: 24px;
  box-shadow: var(--shadow-md), 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.sidebar-toggle:hover::before {
  height: 44px;
  background: linear-gradient(180deg, var(--primary-color), var(--primary-light));
}

.sidebar-toggle--collapsed {
  left: 0;
  border-radius: var(--radius-lg) 0 0 var(--radius-lg);
  background: var(--card-background);
}

.sidebar-toggle--collapsed::before {
  right: 0;
  left: auto;
  border-radius: 2px 0 0 2px;
}

.sidebar-toggle--collapsed:hover {
  width: 24px;
  left: 0;
}

.sidebar-toggle__indicator {
  color: var(--text-muted);
  font-size: 14px;
  transition: var(--transition);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: transparent;
}

.sidebar-toggle:hover .sidebar-toggle__indicator {
  color: var(--primary-color);
  background: rgba(99, 102, 241, 0.1);
}

.sidebar-toggle--collapsed .sidebar-toggle__indicator {
  transform: rotate(180deg);
}

/* ========== 侧边栏头部 ========== */
.app-sidebar__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color);
  background-color: var(--menu-background);
}

.app-sidebar__title {
  font-size: 13px;
  font-weight: 600;
  color: var(--primary-color);
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  flex: 1;
  justify-content: center;
}

/* 隐藏标题图标 */
.app-sidebar__title i {
  display: none;
}

/* ========== 新建对话按钮（添加脉冲动画） ========== */
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
  position: relative;
  overflow: hidden;
}

/* 光泽扫过效果 */
.new-chat-btn::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 50%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.6s ease;
}

.new-chat-btn:hover::after {
  left: 100%;
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

/* 折叠按钮 */
.app-sidebar__collapse-btn {
  font-size: 16px;
  color: var(--text-muted);
  padding: 4px;
  transition: var(--transition);
}

.app-sidebar__collapse-btn:hover {
  color: var(--primary-color);
}

/* ========== 导航菜单 ========== */
.app-sidebar__menu {
  border-right: none;
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

/* 菜单项基础样式 */
.app-sidebar:deep(.el-menu-item) {
  height: 48px;
  line-height: 48px;
  font-size: 13px;
  color: var(--menu-item-color);
  margin: 2px 12px;
  border-radius: var(--radius-md);
  transition: var(--transition);
  position: relative;
}

/* 菜单项悬浮状态 */
.app-sidebar:deep(.el-menu-item:hover) {
  background-color: var(--menu-item-hover) !important;
  color: var(--primary-color) !important;
}

/* 菜单项激活状态（优化：渐变 + 左侧高亮条） */
.app-sidebar:deep(.el-menu-item.is-active) {
  background: linear-gradient(90deg, rgba(99, 102, 241, 0.15) 0%, transparent 100%) !important;
  color: var(--primary-color) !important;
}

.app-sidebar:deep(.el-menu-item.is-active::before) {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 24px;
  background: var(--primary-color);
  border-radius: 0 2px 2px 0;
  box-shadow: 0 0 8px var(--primary-color);
}

.app-sidebar:deep(.el-menu-item i) {
  font-size: 18px;
  margin-right: 10px;
  transition: var(--transition);
}

.app-sidebar:deep(.el-menu-item.is-active i) {
  color: var(--primary-color);
  filter: drop-shadow(0 0 4px rgba(99, 102, 241, 0.5));
}

.app-sidebar:deep(.el-menu--collapse .el-menu-item i) {
  margin-right: 0;
}

/* ========== 侧边栏底部用户区域 ========== */
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
  padding: 8px;
  border-radius: var(--radius-md);
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

/* 用户头像（添加在线状态点） */
.sidebar-user-avatar {
  background: var(--primary-gradient);
  color: white;
  border: 2px solid var(--border-color);
  transition: var(--transition);
  flex-shrink: 0;
  position: relative;
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

/* ========== 下拉菜单样式 ========== */
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

/* ========== 深色模式适配 ========== */
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

.dark-theme .sidebar-toggle {
  background: var(--card-background);
  border-color: var(--border-color);
}

.dark-theme .sidebar-toggle:hover {
  background: var(--surface-color);
}

.dark-theme .sidebar-toggle--collapsed {
  background: var(--card-background);
}
</style>
