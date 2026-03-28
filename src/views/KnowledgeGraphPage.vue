<template>
  <div class="kg-layout">
    <!-- 顶部标题栏 -->
    <div class="kg-layout__header">
      <div class="kg-layout__header-left">
        <h1 class="kg-layout__title">知识图谱</h1>
      </div>
      <div class="kg-layout__header-right">
        <!-- 命名空间选择器 -->
        <el-select
          v-model="selectedNamespaceId"
          placeholder="选择知识图谱"
          @change="handleNamespaceChange"
          class="kg-namespace-selector"
        >
          <el-option
            v-for="ns in namespaceStore.namespaces"
            :key="ns.id"
            :label="ns.name"
            :value="ns.id"
          >
            <span class="namespace-option">
              <span class="namespace-option-icon">{{ getNamespaceIcon(ns.namespace_type) }}</span>
              <span class="namespace-option-name">{{ ns.name }}</span>
              <span class="namespace-option-count">({{ ns.entity_count }})</span>
            </span>
          </el-option>
          <template #footer>
            <el-button
              text
              size="small"
              @click="showCreateNamespaceDialog"
              class="kg-create-namespace-btn"
            >
              <i class="el-icon-plus"></i> 新建知识图谱
            </el-button>
          </template>
        </el-select>
      </div>
    </div>

    <!-- 主体内容 -->
    <div class="kg-layout__body">
      <!-- 侧边栏导航 -->
      <aside class="kg-layout__sidebar" :class="{ 'kg-layout__sidebar--collapsed': sidebarCollapsed }">
        <nav class="kg-nav">
          <router-link
            v-for="item in navItems"
            :key="item.path"
            :to="`/knowledge-graph/${item.path}`"
            class="kg-nav-item"
            :class="{ 'kg-nav-item--active': isActive(item.path) }"
          >
            <span class="kg-nav-icon">{{ item.icon }}</span>
            <span class="kg-nav-text">{{ item.title }}</span>
          </router-link>
        </nav>

        <!-- 侧边栏折叠按钮 -->
        <div class="kg-sidebar-toggle" @click="toggleSidebar">
          <i :class="sidebarCollapsed ? 'el-icon-d-arrow-right' : 'el-icon-d-arrow-left'"></i>
        </div>
      </aside>

      <!-- 内容区 -->
      <main class="kg-layout__content">
        <router-view v-slot="{ Component }">
          <transition name="kg-fade" mode="out-in">
            <component :is="Component" :key="route.path" />
          </transition>
        </router-view>
      </main>
    </div>

    <!-- 创建命名空间对话框 -->
    <el-dialog
      v-model="createDialogVisible"
      title="新建知识图谱"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="createForm" label-width="100px" :rules="formRules" ref="createFormRef">
        <el-form-item label="图谱名称" prop="name">
          <el-input
            v-model="createForm.name"
            placeholder="请输入图谱名称"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="图谱类型" prop="namespace_type">
          <el-select v-model="createForm.namespace_type" placeholder="请选择类型" style="width: 100%">
            <el-option
              v-for="type in namespaceTypes"
              :key="type.value"
              :label="type.label"
              :value="type.value"
            >
              <span style="margin-right: 8px">{{ type.icon }}</span>
              {{ type.label }}
            </el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="描述">
          <el-input
            v-model="createForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入图谱描述（可选）"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleCreateNamespace" :loading="submitting">
          创建
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElForm } from 'element-plus'
import { useNamespaceStore } from '../stores/knowledgeGraph/namespaceStore.js'

const route = useRoute()
const router = useRouter()

const namespaceStore = useNamespaceStore()

// UI状态
const sidebarCollapsed = ref(false)
const createDialogVisible = ref(false)
const submitting = ref(false)
const createFormRef = ref(null)

// 导航项
const navItems = [
  { path: 'overview', title: '概览仪表盘', icon: '📊' },
  { path: 'visualization', title: '图谱可视化', icon: '🕸️' },
  { path: 'entities', title: '实体管理', icon: '📦' },
  { path: 'relations', title: '关系管理', icon: '🔗' },
  { path: 'document-build', title: '文档构建', icon: '📄' },
  { path: 'inference', title: '推理分析', icon: '🧠' },
  { path: 'disambiguation', title: '消歧处理', icon: '🔄' },
  { path: 'settings', title: '设置', icon: '⚙️' }
]

// 命名空间类型
const namespaceTypes = [
  { value: 'personal', label: '个人知识', icon: '👤' },
  { value: 'domain', label: '领域知识', icon: '📚' },
  { value: 'project', label: '项目知识', icon: '📁' },
  { value: 'general', label: '通用知识', icon: '🌐' }
]

// 创建表单
const createForm = ref({
  name: '',
  namespace_type: 'general',
  description: ''
})

// 表单验证规则
const formRules = {
  name: [
    { required: true, message: '请输入图谱名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  namespace_type: [
    { required: true, message: '请选择图谱类型', trigger: 'change' }
  ]
}

// 当前选中的命名空间ID
const selectedNamespaceId = computed({
  get: () => namespaceStore.currentNamespaceId,
  set: (val) => {
    if (val) {
      namespaceStore.selectNamespace(val)
    }
  }
})

// 判断是否激活
function isActive(path) {
  return route.path.endsWith(path)
}

// 切换侧边栏
function toggleSidebar() {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

// 获取命名空间图标
function getNamespaceIcon(type) {
  const config = namespaceTypes.find(t => t.value === type)
  return config?.icon || '📊'
}

// 命名空间切换
async function handleNamespaceChange(namespaceId) {
  if (namespaceId) {
    try {
      await namespaceStore.selectNamespace(namespaceId)
      ElMessage.success('已切换知识图谱')
    } catch (error) {
      ElMessage.error('切换失败')
    }
  }
}

// 显示创建对话框
function showCreateNamespaceDialog() {
  createForm.value = {
    name: '',
    namespace_type: 'general',
    description: ''
  }
  createDialogVisible.value = true
}

// 创建命名空间
async function handleCreateNamespace() {
  try {
    await createFormRef.value.validate()
    submitting.value = true

    await namespaceStore.createNewNamespace({
      name: createForm.value.name,
      namespace_type: createForm.value.namespace_type,
      description: createForm.value.description
    })

    ElMessage.success('知识图谱创建成功')
    createDialogVisible.value = false
  } catch (error) {
    if (error !== false) {
      ElMessage.error('创建失败: ' + (error.message || '未知错误'))
    }
  } finally {
    submitting.value = false
  }
}

// 初始化
onMounted(async () => {
  try {
    await namespaceStore.loadNamespaces()

    // 如果没有命名空间，提示用户创建
    if (namespaceStore.namespaces.length === 0) {
      ElMessage.info('请先创建一个知识图谱')
    } else if (!namespaceStore.currentNamespaceId) {
      // 自动选择第一个命名空间
      await namespaceStore.selectNamespace(namespaceStore.namespaces[0].id)
    }
  } catch (error) {
    console.error('加载命名空间列表失败:', error)
  }
})
</script>

<style scoped>
/* ========== 知识图谱布局容器 ========== */
.kg-layout {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--background-color);
}

/* ========== 顶部标题栏 ========== */
.kg-layout__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background: var(--card-background);
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
}

.kg-layout__header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.kg-layout__title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: -0.01em;
}

.kg-layout__header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.kg-namespace-selector {
  width: var(--selector-width-lg);
}

.namespace-option {
  display: flex;
  align-items: center;
  gap: 8px;
}

.namespace-option-icon {
  font-size: 16px;
}

.namespace-option-name {
  flex: 1;
}

.namespace-option-count {
  color: var(--text-muted);
  font-size: 12px;
}

.kg-create-namespace-btn {
  width: 100%;
  color: var(--primary-color);
  transition: var(--transition);
}

.kg-create-namespace-btn:hover {
  background: var(--surface-color);
}

/* ========== 主体内容 ========== */
.kg-layout__body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

/* ========== 侧边栏 ========== */
.kg-layout__sidebar {
  width: 200px;
  background: var(--card-background);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  transition: var(--transition);
  position: relative;
}

.kg-layout__sidebar--collapsed {
  width: 64px;
}

.kg-layout__sidebar--collapsed .kg-nav-text {
  display: none;
}

.kg-nav {
  flex: 1;
  padding: 16px 12px;
  overflow-y: auto;
}

.kg-nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  margin-bottom: 4px;
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  text-decoration: none;
  transition: var(--transition);
  position: relative;
}

.kg-nav-item:hover {
  background: var(--menu-item-hover);
  color: var(--text-primary);
}

/* 激活状态：左侧高亮条 + 渐变背景 */
.kg-nav-item--active {
  background: linear-gradient(90deg, rgba(99, 102, 241, 0.12) 0%, transparent 100%);
  color: var(--primary-color);
}

.kg-nav-item--active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 20px;
  background: var(--primary-color);
  border-radius: 0 2px 2px 0;
  box-shadow: 0 0 8px rgba(99, 102, 241, 0.5);
}

.kg-nav-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.kg-nav-text {
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
}

/* ========== 侧边栏折叠按钮 ========== */
.kg-sidebar-toggle {
  position: absolute;
  right: -12px;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 48px;
  background: var(--card-background);
  border: 1px solid var(--border-color);
  border-left: none;
  border-radius: 0 var(--radius-md) var(--radius-md) 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--text-muted);
  transition: var(--transition);
  box-shadow: var(--shadow-sm);
  z-index: 1;
}

.kg-sidebar-toggle::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 2px;
  height: 24px;
  background: var(--primary-color);
  border-radius: 0 2px 2px 0;
  transition: var(--transition);
}

.kg-sidebar-toggle:hover {
  color: var(--primary-color);
  background: var(--surface-color);
  width: 24px;
}

.kg-sidebar-toggle:hover::before {
  height: 32px;
  background: linear-gradient(180deg, var(--primary-color), var(--primary-light));
}

/* ========== 内容区 ========== */
.kg-layout__content {
  flex: 1;
  overflow: hidden;
  position: relative;
}

/* ========== 过渡动画 ========== */
.kg-fade-enter-active,
.kg-fade-leave-active {
  transition: opacity var(--transition-fast), transform var(--transition-fast);
}

.kg-fade-enter-from,
.kg-fade-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

/* ========== 深色模式适配 ========== */
.dark-theme .kg-layout__header,
.dark-theme .kg-layout__sidebar {
  background: var(--card-background);
  border-color: var(--border-color);
}

.dark-theme .kg-nav-item {
  color: var(--text-secondary);
}

.dark-theme .kg-nav-item:hover {
  background: var(--surface-color);
}

.dark-theme .kg-sidebar-toggle {
  background: var(--card-background);
  border-color: var(--border-color);
}
</style>
