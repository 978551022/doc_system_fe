<template>
  <div class="kg-sidebar">
    <!-- 头部 -->
    <div class="kg-sidebar__header">
      <h3 class="kg-sidebar__title">知识图谱</h3>
      <el-button
        type="primary"
        size="small"
        @click="handleCreateNamespace"
        class="kg-sidebar__create-btn"
      >
        <i class="el-icon-plus"></i>
        新建
      </el-button>
    </div>

    <!-- 命名空间列表 -->
    <div class="kg-sidebar__content">
      <!-- 全部图谱 -->
      <div
        class="kg-sidebar__item kg-sidebar__item--all"
        :class="{ 'kg-sidebar__item--active': !currentNamespace }"
        @click="handleShowAll"
      >
        <div class="kg-sidebar__item-icon">📊</div>
        <div class="kg-sidebar__item-content">
          <div class="kg-sidebar__item-name">全部图谱</div>
          <div class="kg-sidebar__item-desc">查看所有知识图谱</div>
        </div>
      </div>

      <!-- 命名空间分组 -->
      <div class="kg-sidebar__group" v-for="type in namespaceTypes" :key="type.value">
        <div class="kg-sidebar__group-header" @click="toggleGroup(type.value)">
          <span class="kg-sidebar__group-icon">{{ type.icon }}</span>
          <span class="kg-sidebar__group-name">{{ type.label }}</span>
          <i
            :class="[
              'el-icon-arrow-down',
              'kg-sidebar__group-arrow',
              { 'kg-sidebar__group-arrow--expanded': expandedGroups.has(type.value) }
            ]"
          ></i>
        </div>

        <transition name="accordion">
          <div class="kg-sidebar__group-items" v-show="expandedGroups.has(type.value)">
            <div
              v-for="namespace in getNamespacesByType(type.value)"
              :key="namespace.id"
              class="kg-sidebar__item"
              :class="{ 'kg-sidebar__item--active': currentNamespace?.id === namespace.id }"
              @click="handleSelectNamespace(namespace)"
              @contextmenu.prevent="handleContextMenu($event, namespace)"
            >
              <div class="kg-sidebar__item-icon">
                {{ getNamespaceIcon(namespace.type) }}
              </div>
              <div class="kg-sidebar__item-content">
                <div class="kg-sidebar__item-name">{{ namespace.name }}</div>
                <div class="kg-sidebar__item-stats">
                  <span>{{ namespace.entity_count || 0 }} 实体</span>
                  <span>{{ namespace.relation_count || 0 }} 关系</span>
                </div>
              </div>
            </div>

            <!-- 空状态 -->
            <div
              v-if="getNamespacesByType(type.value).length === 0"
              class="kg-sidebar__empty"
            >
              <p>暂无{{ type.label }}</p>
            </div>
          </div>
        </transition>
      </div>
    </div>

    <!-- 创建命名空间对话框 -->
    <el-dialog
      v-model="createDialogVisible"
      title="创建知识图谱"
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

        <el-form-item label="图谱类型" prop="type">
          <el-select v-model="createForm.type" placeholder="请选择类型" style="width: 100%">
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
        <el-button type="primary" @click="handleConfirmCreate" :loading="submitting">
          创建
        </el-button>
      </template>
    </el-dialog>

    <!-- 右键菜单 -->
    <transition name="fade">
      <div
        v-if="contextMenuVisible"
        class="kg-context-menu"
        :style="{ left: contextMenuPosition.x + 'px', top: contextMenuPosition.y + 'px' }"
        @click="hideContextMenu"
      >
        <div class="kg-context-menu__item" @click="handleEditNamespace">
          <i class="el-icon-edit"></i>
          编辑
        </div>
        <div class="kg-context-menu__item" @click="handleDeleteNamespace">
          <i class="el-icon-delete"></i>
          删除
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, ElForm } from 'element-plus'
import { knowledgeGraphStore } from '../../../stores/knowledgeGraphStore.js'
import { NamespaceType, NamespaceTypeLabels } from '../../../utils/knowledgeGraph/graphConstants.js'

const emit = defineEmits(['namespace-select'])

// 命名空间类型配置
const namespaceTypes = [
  { value: NamespaceType.PERSONAL, label: NamespaceTypeLabels[NamespaceType.PERSONAL], icon: '👤' },
  { value: NamespaceType.DOMAIN, label: NamespaceTypeLabels[NamespaceType.DOMAIN], icon: '📚' },
  { value: NamespaceType.PROJECT, label: NamespaceTypeLabels[NamespaceType.PROJECT], icon: '📁' },
  { value: NamespaceType.GENERAL, label: NamespaceTypeLabels[NamespaceType.GENERAL], icon: '🌐' }
]

// UI状态
const expandedGroups = ref(new Set([NamespaceType.PERSONAL]))
const createDialogVisible = ref(false)
const submitting = ref(false)
const createFormRef = ref(null)

// 创建表单
const createForm = ref({
  name: '',
  type: NamespaceType.PERSONAL,
  description: ''
})

// 表单验证规则
const formRules = {
  name: [
    { required: true, message: '请输入图谱名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择图谱类型', trigger: 'change' }
  ]
}

// 右键菜单
const contextMenuVisible = ref(false)
const contextMenuPosition = ref({ x: 0, y: 0 })
const contextMenuNamespace = ref(null)

// 从store获取状态
const namespaces = computed(() => knowledgeGraphStore.namespaces)
const currentNamespace = computed(() => knowledgeGraphStore.currentNamespace)

// 初始化
onMounted(async () => {
  try {
    await knowledgeGraphStore.loadNamespaces()
  } catch (error) {
    ElMessage.error('加载命名空间列表失败')
  }
})

// 获取指定类型的命名空间
function getNamespacesByType(type) {
  return namespaces.value.filter(ns => ns.type === type)
}

// 获取命名空间图标
function getNamespaceIcon(type) {
  const config = namespaceTypes.find(t => t.value === type)
  return config?.icon || '📊'
}

// 切换分组展开状态
function toggleGroup(type) {
  if (expandedGroups.value.has(type)) {
    expandedGroups.value.delete(type)
  } else {
    expandedGroups.value.add(type)
  }
}

// 显示全部图谱
function handleShowAll() {
  emit('namespace-select', null)
}

// 选择命名空间
async function handleSelectNamespace(namespace) {
  try {
    await knowledgeGraphStore.selectNamespace(namespace.id)
    emit('namespace-select', namespace)
  } catch (error) {
    ElMessage.error('加载图谱数据失败')
  }
}

// 创建命名空间
function handleCreateNamespace() {
  createForm.value = {
    name: '',
    type: NamespaceType.PERSONAL,
    description: ''
  }
  createDialogVisible.value = true
}

// 确认创建
async function handleConfirmCreate() {
  try {
    await createFormRef.value.validate()
    submitting.value = true

    await knowledgeGraphStore.createNewNamespace({
      name: createForm.value.name,
      type: createForm.value.type,
      description: createForm.value.description
    })

    ElMessage.success('图谱创建成功')
    createDialogVisible.value = false
  } catch (error) {
    if (error !== false) { // 表单验证失败时error为false
      ElMessage.error('创建失败: ' + (error.message || '未知错误'))
    }
  } finally {
    submitting.value = false
  }
}

// 右键菜单
function handleContextMenu(event, namespace) {
  contextMenuNamespace.value = namespace
  contextMenuPosition.value = {
    x: event.clientX,
    y: event.clientY
  }
  contextMenuVisible.value = true

  // 点击其他地方关闭菜单
  document.addEventListener('click', hideContextMenu, { once: true })
}

function hideContextMenu() {
  contextMenuVisible.value = false
}

function handleEditNamespace() {
  // TODO: 实现编辑功能
  ElMessage.info('编辑功能开发中...')
}

async function handleDeleteNamespace() {
  try {
    await ElMessageBox.confirm(
      `确定要删除图谱"${contextMenuNamespace.value.name}"吗？此操作不可恢复。`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await knowledgeGraphStore.deleteNamespace(contextMenuNamespace.value.id)
    ElMessage.success('删除成功')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}
</script>

<style scoped>
.kg-sidebar {
  width: 260px;
  height: 100%;
  background: var(--card-background);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
}

.kg-sidebar__header {
  padding: 16px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.kg-sidebar__title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.kg-sidebar__create-btn {
  padding: 6px 12px;
  font-size: 12px;
}

.kg-sidebar__content {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.kg-sidebar__item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  margin: 4px 0;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: var(--transition);
}

.kg-sidebar__item:hover {
  background: var(--surface-color);
}

.kg-sidebar__item--active {
  background: var(--primary-color);
  color: white;
}

.kg-sidebar__item--active .kg-sidebar__item-desc,
.kg-sidebar__item--active .kg-sidebar__item-stats {
  color: rgba(255, 255, 255, 0.8);
}

.kg-sidebar__item--all {
  margin-bottom: 12px;
  border: 1px solid var(--border-color);
}

.kg-sidebar__item-icon {
  font-size: 20px;
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.kg-sidebar__item-content {
  flex: 1;
  min-width: 0;
}

.kg-sidebar__item-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.kg-sidebar__item-desc {
  font-size: 11px;
  color: var(--text-muted);
}

.kg-sidebar__item-stats {
  display: flex;
  gap: 8px;
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 2px;
}

.kg-sidebar__group {
  margin-bottom: 8px;
}

.kg-sidebar__group-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  cursor: pointer;
  user-select: none;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
  border-radius: var(--radius-sm);
  transition: var(--transition);
}

.kg-sidebar__group-header:hover {
  background: var(--surface-color);
}

.kg-sidebar__group-icon {
  font-size: 14px;
}

.kg-sidebar__group-name {
  flex: 1;
}

.kg-sidebar__group-arrow {
  font-size: 12px;
  color: var(--text-muted);
  transition: transform 0.2s;
}

.kg-sidebar__group-arrow--expanded {
  transform: rotate(180deg);
}

.kg-sidebar__group-items {
  padding-left: 8px;
}

.kg-sidebar__empty {
  padding: 16px 12px;
  text-align: center;
  color: var(--text-muted);
  font-size: 12px;
}

.accordion-enter-active,
.accordion-leave-active {
  transition: all 0.2s ease;
  overflow: hidden;
}

.accordion-enter-from,
.accordion-leave-to {
  max-height: 0;
  opacity: 0;
}

.accordion-enter-to,
.accordion-leave-from {
  max-height: 500px;
  opacity: 1;
}

/* 右键菜单 */
.kg-context-menu {
  position: fixed;
  background: var(--card-background);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-lg);
  padding: 4px 0;
  min-width: 120px;
  z-index: 1000;
}

.kg-context-menu__item {
  padding: 8px 16px;
  font-size: 13px;
  color: var(--text-primary);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: var(--transition-fast);
}

.kg-context-menu__item:hover {
  background: var(--surface-color);
}

.kg-context-menu__item i {
  font-size: 14px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 深色主题 */
.dark-theme .kg-sidebar {
  background: var(--card-background);
  border-right-color: var(--border-color);
}

.dark-theme .kg-sidebar__item {
  color: var(--text-primary);
}

.dark-theme .kg-sidebar__item--all {
  border-color: var(--border-color);
}

.dark-theme .kg-context-menu {
  background: var(--card-background);
  border-color: var(--border-color);
}
</style>
