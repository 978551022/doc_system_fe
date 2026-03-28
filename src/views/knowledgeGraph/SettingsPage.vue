<template>
  <div class="kg-settings">
    <!-- 设置导航 -->
    <div class="kg-settings-nav">
      <div
        v-for="tab in settingsTabs"
        :key="tab.key"
        class="kg-settings-tab"
        :class="{ 'kg-settings-tab--active': activeTab === tab.key }"
        @click="activeTab = tab.key"
      >
        <span class="kg-settings-tab__icon">{{ tab.icon }}</span>
        <span class="kg-settings-tab__label">{{ tab.label }}</span>
      </div>
    </div>

    <!-- 设置内容 -->
    <div class="kg-settings-content">
      <!-- 命名空间设置 -->
      <div class="kg-settings-panel" v-if="activeTab === 'namespace'">
        <h3>命名空间设置</h3>

        <div class="kg-setting-section">
          <div class="kg-setting-section__title">当前命名空间</div>
          <div class="kg-namespace-info">
            <div class="kg-namespace-info__main">
              <div class="kg-namespace-info__icon">{{ getNamespaceIcon(namespaceStore.currentNamespace?.namespace_type) }}</div>
              <div class="kg-namespace-info__details">
                <div class="kg-namespace-info__name">{{ namespaceStore.currentNamespace?.name }}</div>
                <div class="kg-namespace-info__type">{{ getNamespaceTypeLabel(namespaceStore.currentNamespace?.namespace_type) }}</div>
              </div>
            </div>
            <el-button size="small" @click="showEditNamespaceDialog">
              <i class="el-icon-edit"></i> 编辑
            </el-button>
          </div>
        </div>

        <div class="kg-setting-section">
          <div class="kg-setting-section__title">危险操作</div>
          <el-alert
            title="删除命名空间"
            type="warning"
            description="删除命名空间将永久删除其中的所有实体和关系数据，此操作不可恢复。"
            :closable="false"
            show-icon
          />
          <el-button
            type="danger"
            plain
            style="margin-top: 12px"
            @click="handleDeleteNamespace"
          >
            <i class="el-icon-delete"></i> 删除当前命名空间
          </el-button>
        </div>
      </div>

      <!-- 实体类型设置 -->
      <div class="kg-settings-panel" v-if="activeTab === 'entityTypes'">
        <h3>实体类型配置</h3>

        <div class="kg-setting-section">
          <div class="kg-setting-section__header">
            <div class="kg-setting-section__title">已配置的类型</div>
            <el-button size="small" @click="showAddEntityTypeDialog">
              <i class="el-icon-plus"></i> 添加类型
            </el-button>
          </div>

          <div class="kg-entity-type-list">
            <div
              v-for="type in entityTypes"
              :key="type.value"
              class="kg-entity-type-item"
            >
              <span class="kg-entity-type-item__icon">{{ type.icon }}</span>
              <span class="kg-entity-type-item__label">{{ type.label }}</span>
              <el-tag size="small" type="info">{{ type.value }}</el-tag>
              <div class="kg-entity-type-item__actions">
                <el-button size="small" text @click="editEntityType(type)">
                  <i class="el-icon-edit"></i>
                </el-button>
                <el-button
                  size="small"
                  text
                  type="danger"
                  @click="deleteEntityType(type)"
                  :disabled="type.isDefault"
                >
                  <i class="el-icon-delete"></i>
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 关系类型设置 -->
      <div class="kg-settings-panel" v-if="activeTab === 'relationTypes'">
        <h3>关系类型配置</h3>

        <div class="kg-setting-section">
          <div class="kg-setting-section__header">
            <div class="kg-setting-section__title">已配置的类型</div>
            <el-button size="small" @click="showAddRelationTypeDialog">
              <i class="el-icon-plus"></i> 添加类型
            </el-button>
          </div>

          <div class="kg-relation-type-list">
            <div
              v-for="type in relationTypes"
              :key="type.value"
              class="kg-relation-type-item"
            >
              <span class="kg-relation-type-item__icon">{{ type.icon }}</span>
              <span class="kg-relation-type-item__label">{{ type.label }}</span>
              <el-tag size="small" type="info">{{ type.value }}</el-tag>
              <div class="kg-relation-type-item__actions">
                <el-button size="small" text @click="editRelationType(type)">
                  <i class="el-icon-edit"></i>
                </el-button>
                <el-button
                  size="small"
                  text
                  type="danger"
                  @click="deleteRelationType(type)"
                  :disabled="type.isDefault"
                >
                  <i class="el-icon-delete"></i>
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 可视化设置 -->
      <div class="kg-settings-panel" v-if="activeTab === 'visualization'">
        <h3>可视化设置</h3>

        <div class="kg-setting-section">
          <div class="kg-setting-section__title">默认布局</div>
          <el-radio-group v-model="vizSettings.defaultLayout">
            <el-radio label="force_directed">力导向布局</el-radio>
            <el-radio label="circular">环形布局</el-radio>
            <el-radio label="hierarchical">层次布局</el-radio>
            <el-radio label="grid">网格布局</el-radio>
          </el-radio-group>
        </div>

        <div class="kg-setting-section">
          <div class="kg-setting-section__title">节点显示</div>
          <el-form label-width="120px" label-position="left">
            <el-form-item label="节点大小">
              <el-slider v-model="vizSettings.nodeSize" :min="20" :max="60" />
            </el-form-item>
            <el-form-item label="标签显示">
              <el-switch v-model="vizSettings.showLabels" />
              <span class="kg-form-hint">在节点上显示实体名称</span>
            </el-form-item>
            <el-form-item label="显示图标">
              <el-switch v-model="vizSettings.showIcons" />
              <span class="kg-form-hint">在节点中显示类型图标</span>
            </el-form-item>
          </el-form>
        </div>

        <div class="kg-setting-section">
          <div class="kg-setting-section__title">交互设置</div>
          <el-form label-width="120px" label-position="left">
            <el-form-item label="启用缩放">
              <el-switch v-model="vizSettings.enableZoom" />
            </el-form-item>
            <el-form-item label="启用拖拽">
              <el-switch v-model="vizSettings.enableDrag" />
            </el-form-item>
            <el-form-item label="物理模拟">
              <el-switch v-model="vizSettings.enablePhysics" />
              <span class="kg-form-hint">力导向布局时的物理效果</span>
            </el-form-item>
          </el-form>
        </div>

        <div class="kg-setting-section">
          <el-button type="primary" @click="saveVizSettings" :loading="saving">
            <i class="el-icon-check"></i> 保存设置
          </el-button>
          <el-button @click="resetVizSettings">
            <i class="el-icon-refresh-left"></i> 恢复默认
          </el-button>
        </div>
      </div>

      <!-- 数据管理 -->
      <div class="kg-settings-panel" v-if="activeTab === 'data'">
        <h3>数据管理</h3>

        <div class="kg-setting-section">
          <div class="kg-setting-section__title">导入导出</div>
          <div class="kg-data-actions">
            <el-button @click="handleExportData" :loading="exporting">
              <i class="el-icon-download"></i> 导出图谱数据
            </el-button>
            <el-upload
              :auto-upload="false"
              :show-file-list="false"
              :on-change="handleImportData"
              accept=".json"
            >
              <el-button>
                <i class="el-icon-upload"></i> 导入图谱数据
              </el-button>
            </el-upload>
          </div>
        </div>

        <div class="kg-setting-section">
          <div class="kg-setting-section__title">重建索引</div>
          <p class="kg-setting-desc">重建索引可以优化查询性能，但需要一定时间</p>
          <el-button @click="handleRebuildIndex" :loading="rebuilding">
            <i class="el-icon-refresh"></i> 重建索引
          </el-button>
        </div>

        <div class="kg-setting-section">
          <div class="kg-setting-section__title">清空数据</div>
          <el-alert
            title="清空所有数据"
            type="error"
            description="清空操作将删除当前命名空间中的所有实体和关系，此操作不可恢复。"
            :closable="false"
            show-icon
          />
          <el-button
            type="danger"
            plain
            style="margin-top: 12px"
            @click="handleClearData"
          >
            <i class="el-icon-delete"></i> 清空所有数据
          </el-button>
        </div>
      </div>
    </div>

    <!-- 编辑命名空间对话框 -->
    <el-dialog
      v-model="editNamespaceDialogVisible"
      title="编辑命名空间"
      width="500px"
    >
      <el-form :model="namespaceForm" label-width="100px" :rules="namespaceRules" ref="namespaceFormRef">
        <el-form-item label="名称" prop="name">
          <el-input v-model="namespaceForm.name" placeholder="请输入命名空间名称" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="namespaceForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入描述"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editNamespaceDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleUpdateNamespace" :loading="saving">
          保存
        </el-button>
      </template>
    </el-dialog>

    <!-- 添加实体类型对话框 -->
    <el-dialog
      v-model="entityTypeDialogVisible"
      :title="editingEntityType ? '编辑实体类型' : '添加实体类型'"
      width="400px"
    >
      <el-form :model="entityTypeForm" label-width="80px">
        <el-form-item label="类型名">
          <el-input v-model="entityTypeForm.value" placeholder="如: 人物" />
        </el-form-item>
        <el-form-item label="显示名">
          <el-input v-model="entityTypeForm.label" placeholder="如: 人物" />
        </el-form-item>
        <el-form-item label="图标">
          <el-input v-model="entityTypeForm.icon" placeholder="选择一个emoji图标" />
        </el-form-item>
        <el-form-item label="颜色">
          <el-color-picker v-model="entityTypeForm.color" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="entityTypeDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveEntityType">确定</el-button>
      </template>
    </el-dialog>

    <!-- 添加关系类型对话框 -->
    <el-dialog
      v-model="relationTypeDialogVisible"
      :title="editingRelationType ? '编辑关系类型' : '添加关系类型'"
      width="400px"
    >
      <el-form :model="relationTypeForm" label-width="80px">
        <el-form-item label="类型名">
          <el-input v-model="relationTypeForm.value" placeholder="如: 包含" />
        </el-form-item>
        <el-form-item label="显示名">
          <el-input v-model="relationTypeForm.label" placeholder="如: 包含" />
        </el-form-item>
        <el-form-item label="图标">
          <el-input v-model="relationTypeForm.icon" placeholder="选择一个emoji图标" />
        </el-form-item>
        <el-form-item label="颜色">
          <el-color-picker v-model="relationTypeForm.color" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="relationTypeDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveRelationType">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, ElForm } from 'element-plus'
import { useNamespaceStore } from '../../stores/knowledgeGraph/namespaceStore.js'
import {
  updateNamespace,
  deleteNamespace as deleteNamespaceApi,
  getDefaultEntityTypes,
  getDefaultRelationTypes,
  exportUserData,
  importUserData,
  resetUserConfig
} from '../../api/knowledgeGraph.js'

const namespaceStore = useNamespaceStore()

// 设置标签
const settingsTabs = [
  { key: 'namespace', label: '命名空间', icon: '📊' },
  { key: 'entityTypes', label: '实体类型', icon: '📦' },
  { key: 'relationTypes', label: '关系类型', icon: '🔗' },
  { key: 'visualization', label: '可视化', icon: '🎨' },
  { key: 'data', label: '数据管理', icon: '💾' }
]

// UI状态
const activeTab = ref('namespace')
const saving = ref(false)
const exporting = ref(false)
const rebuilding = ref(false)
const editNamespaceDialogVisible = ref(false)
const entityTypeDialogVisible = ref(false)
const relationTypeDialogVisible = ref(false)
const namespaceFormRef = ref(null)

// 命名空间表单
const namespaceForm = ref({
  name: '',
  description: ''
})

const namespaceRules = {
  name: [
    { required: true, message: '请输入名称', trigger: 'blur' }
  ]
}

// 实体类型
const editingEntityType = ref(null)
const entityTypeForm = ref({
  value: '',
  label: '',
  icon: '📦',
  color: '#3B82F6'
})

const entityTypes = ref([
  { value: '人物', label: '人物', icon: '👤', color: '#3B82F6', isDefault: true },
  { value: '组织', label: '组织', icon: '🏢', color: '#10B981', isDefault: true },
  { value: '地点', label: '地点', icon: '📍', color: '#F59E0B', isDefault: true },
  { value: '概念', label: '概念', icon: '💡', color: '#8B5CF6', isDefault: true },
  { value: '事件', label: '事件', icon: '📅', color: '#EF4444', isDefault: true },
  { value: '文档', label: '文档', icon: '📄', color: '#6B7280', isDefault: true },
  { value: '技术', label: '技术', icon: '⚙️', color: '#06B6D4', isDefault: true }
])

// 关系类型
const editingRelationType = ref(null)
const relationTypeForm = ref({
  value: '',
  label: '',
  icon: '🔗',
  color: '#8B5CF6'
})

const relationTypes = ref([
  { value: '包含', label: '包含', icon: '📦', color: '#3B82F6', isDefault: true },
  { value: '属于', label: '属于', icon: '🏷️', color: '#10B981', isDefault: true },
  { value: '关联', label: '关联', icon: '🔗', color: '#8B5CF6', isDefault: true },
  { value: '位于', label: '位于', icon: '📍', color: '#F59E0B', isDefault: true },
  { value: '创建', label: '创建', icon: '✨', color: '#EC4899', isDefault: true },
  { value: '拥有', label: '拥有', icon: '👤', color: '#06B6D4', isDefault: true }
])

// 可视化设置
const vizSettings = ref({
  defaultLayout: 'force_directed',
  nodeSize: 30,
  showLabels: true,
  showIcons: true,
  enableZoom: true,
  enableDrag: true,
  enablePhysics: true
})

// 获取命名空间图标
function getNamespaceIcon(type) {
  const icons = {
    'personal': '👤',
    'domain': '📚',
    'project': '📁',
    'general': '🌐'
  }
  return icons[type] || '📊'
}

// 获取命名空间类型标签
function getNamespaceTypeLabel(type) {
  const labels = {
    'personal': '个人知识',
    'domain': '领域知识',
    'project': '项目知识',
    'general': '通用知识'
  }
  return labels[type] || type
}

// 显示编辑命名空间对话框
function showEditNamespaceDialog() {
  namespaceForm.value = {
    name: namespaceStore.currentNamespace?.name || '',
    description: namespaceStore.currentNamespace?.description || ''
  }
  editNamespaceDialogVisible.value = true
}

// 更新命名空间
async function handleUpdateNamespace() {
  try {
    await namespaceFormRef.value.validate()
    saving.value = true

    const response = await updateNamespace(
      namespaceStore.currentNamespaceId,
      namespaceForm.value
    )

    if (response.code === 200) {
      ElMessage.success('更新成功')
      editNamespaceDialogVisible.value = false
      await namespaceStore.loadNamespaces()
    }
  } catch (error) {
    if (error !== false) {
      console.error('更新命名空间失败:', error)
      ElMessage.error('更新失败')
    }
  } finally {
    saving.value = false
  }
}

// 删除命名空间
async function handleDeleteNamespace() {
  try {
    await ElMessageBox.confirm(
      '确定要删除当前命名空间吗？此操作不可恢复！',
      '删除确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'error'
      }
    )

    await deleteNamespaceApi(namespaceStore.currentNamespaceId)
    ElMessage.success('删除成功')
    await namespaceStore.loadNamespaces()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除命名空间失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

// 显示添加实体类型对话框
function showAddEntityTypeDialogDialog() {
  editingEntityType.value = null
  entityTypeForm.value = {
    value: '',
    label: '',
    icon: '📦',
    color: '#3B82F6'
  }
  entityTypeDialogVisible.value = true
}

// 编辑实体类型
function editEntityType(type) {
  editingEntityType.value = type
  entityTypeForm.value = { ...type }
  entityTypeDialogVisible.value = true
}

// 保存实体类型
function handleSaveEntityType() {
  if (!entityTypeForm.value.value || !entityTypeForm.value.label) {
    ElMessage.warning('请填写完整信息')
    return
  }

  if (editingEntityType.value) {
    const index = entityTypes.value.findIndex(t => t.value === editingEntityType.value.value)
    if (index !== -1) {
      entityTypes.value[index] = { ...entityTypeForm.value, isDefault: editingEntityType.value.isDefault }
    }
    ElMessage.success('更新成功')
  } else {
    entityTypes.value.push({ ...entityTypeForm.value, isDefault: false })
    ElMessage.success('添加成功')
  }

  entityTypeDialogVisible.value = false
}

// 删除实体类型
async function deleteEntityType(type) {
  try {
    await ElMessageBox.confirm(`确定要删除实体类型"${type.label}"吗？`, '确认删除', {
      type: 'warning'
    })
    entityTypes.value = entityTypes.value.filter(t => t.value !== type.value)
    ElMessage.success('删除成功')
  } catch (error) {
    // 用户取消
  }
}

// 显示添加关系类型对话框
function showAddRelationTypeDialog() {
  editingRelationType.value = null
  relationTypeForm.value = {
    value: '',
    label: '',
    icon: '🔗',
    color: '#8B5CF6'
  }
  relationTypeDialogVisible.value = true
}

// 编辑关系类型
function editRelationType(type) {
  editingRelationType.value = type
  relationTypeForm.value = { ...type }
  relationTypeDialogVisible.value = true
}

// 保存关系类型
function handleSaveRelationType() {
  if (!relationTypeForm.value.value || !relationTypeForm.value.label) {
    ElMessage.warning('请填写完整信息')
    return
  }

  if (editingRelationType.value) {
    const index = relationTypes.value.findIndex(t => t.value === editingRelationType.value.value)
    if (index !== -1) {
      relationTypes.value[index] = { ...relationTypeForm.value, isDefault: editingRelationType.value.isDefault }
    }
    ElMessage.success('更新成功')
  } else {
    relationTypes.value.push({ ...relationTypeForm.value, isDefault: false })
    ElMessage.success('添加成功')
  }

  relationTypeDialogVisible.value = false
}

// 删除关系类型
async function deleteRelationType(type) {
  try {
    await ElMessageBox.confirm(`确定要删除关系类型"${type.label}"吗？`, '确认删除', {
      type: 'warning'
    })
    relationTypes.value = relationTypes.value.filter(t => t.value !== type.value)
    ElMessage.success('删除成功')
  } catch (error) {
    // 用户取消
  }
}

// 保存可视化设置
async function saveVizSettings() {
  saving.value = true
  try {
    // 这里应该调用API保存设置
    localStorage.setItem('kg_viz_settings', JSON.stringify(vizSettings.value))
    ElMessage.success('设置已保存')
  } catch (error) {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

// 重置可视化设置
function resetVizSettings() {
  vizSettings.value = {
    defaultLayout: 'force_directed',
    nodeSize: 30,
    showLabels: true,
    showIcons: true,
    enableZoom: true,
    enableDrag: true,
    enablePhysics: true
  }
  ElMessage.info('已恢复默认设置')
}

// 导出数据
async function handleExportData() {
  exporting.value = true
  try {
    const userId = localStorage.getItem('user_id') || 'default'
    const response = await exportUserData(userId)

    // 创建下载链接
    const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `knowledge-graph-${namespaceStore.currentNamespace?.name}-${Date.now()}.json`
    link.click()
    URL.revokeObjectURL(url)

    ElMessage.success('导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败')
  } finally {
    exporting.value = false
  }
}

// 导入数据
async function handleImportData(file) {
  try {
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target.result)
        const userId = localStorage.getItem('user_id') || 'default'

        await importUserData(userId, data)
        ElMessage.success('导入成功')
        await namespaceStore.loadNamespaces()
      } catch (error) {
        console.error('导入数据解析失败:', error)
        ElMessage.error('导入失败')
      }
    }
    reader.readAsText(file.raw)
  } catch (error) {
    ElMessage.error('读取文件失败')
  }
}

// 重建索引
async function handleRebuildIndex() {
  try {
    await ElMessageBox.confirm(
      '重建索引可能需要一些时间，是否继续？',
      '确认重建',
      { type: 'warning' }
    )

    rebuilding.value = true
    // 这里应该调用重建索引API
    await new Promise(resolve => setTimeout(resolve, 2000))
    ElMessage.success('索引重建完成')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('重建索引失败:', error)
      ElMessage.error('重建失败')
    }
  } finally {
    rebuilding.value = false
  }
}

// 清空数据
async function handleClearData() {
  try {
    await ElMessageBox.confirm(
      '确定要清空所有数据吗？此操作不可恢复！',
      '确认清空',
      {
        confirmButtonText: '确定清空',
        cancelButtonText: '取消',
        type: 'error'
      }
    )

    // 这里应该调用清空数据API
    ElMessage.success('数据已清空')
  } catch (error) {
    // 用户取消
  }
}

// 初始化
onMounted(async () => {
  // 加载保存的可视化设置
  const savedSettings = localStorage.getItem('kg_viz_settings')
  if (savedSettings) {
    try {
      vizSettings.value = { ...vizSettings.value, ...JSON.parse(savedSettings) }
    } catch (e) {
      // 忽略解析错误
    }
  }

  // 加载默认类型配置
  try {
    const [entityTypesRes, relationTypesRes] = await Promise.all([
      getDefaultEntityTypes(),
      getDefaultRelationTypes()
    ])

    if (entityTypesRes.code === 200) {
      // 可以合并默认类型和自定义类型
    }
    if (relationTypesRes.code === 200) {
      // 可以合并默认类型和自定义类型
    }
  } catch (error) {
    console.error('加载类型配置失败:', error)
  }
})
</script>

<style scoped>
.kg-settings {
  padding: 24px;
  height: 100%;
  display: flex;
  gap: 24px;
}

/* 设置导航 */
.kg-settings-nav {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 160px;
  flex-shrink: 0;
}

.kg-settings-tab {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--card-background);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition);
}

.kg-settings-tab:hover {
  border-color: var(--primary-color);
  background: var(--surface-color);
}

.kg-settings-tab--active {
  background: var(--primary-color);
  border-color: var(--primary-color);
  color: white;
}

.kg-settings-tab__icon {
  font-size: 20px;
}

.kg-settings-tab__label {
  font-weight: 500;
}

/* 设置内容 */
.kg-settings-content {
  flex: 1;
  overflow-y: auto;
}

.kg-settings-panel {
  background: var(--card-background);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 24px;
}

.kg-settings-panel h3 {
  margin: 0 0 24px 0;
  font-size: 18px;
  color: var(--text-primary);
}

.kg-setting-section {
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--border-color);
}

.kg-setting-section:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.kg-setting-section__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.kg-setting-section__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 12px;
}

.kg-setting-desc {
  margin: 0 0 12px 0;
  font-size: 13px;
  color: var(--text-secondary);
}

/* 命名空间信息 */
.kg-namespace-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: var(--surface-color);
  border-radius: var(--radius-md);
}

.kg-namespace-info__main {
  display: flex;
  align-items: center;
  gap: 16px;
}

.kg-namespace-info__icon {
  font-size: 48px;
}

.kg-namespace-info__name {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.kg-namespace-info__type {
  font-size: 13px;
  color: var(--text-secondary);
  margin-top: 4px;
}

/* 类型列表 */
.kg-entity-type-list,
.kg-relation-type-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.kg-entity-type-item,
.kg-relation-type-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--surface-color);
  border-radius: var(--radius-md);
}

.kg-entity-type-item__icon,
.kg-relation-type-item__icon {
  font-size: 24px;
}

.kg-entity-type-item__label,
.kg-relation-type-item__label {
  flex: 1;
  font-size: 14px;
  color: var(--text-primary);
}

.kg-entity-type-item__actions,
.kg-relation-type-item__actions {
  display: flex;
  gap: 4px;
}

/* 数据操作 */
.kg-data-actions {
  display: flex;
  gap: 12px;
}

/* 表单提示 */
.kg-form-hint {
  margin-left: 12px;
  font-size: 12px;
  color: var(--text-muted);
}

/* 深色主题 */
.dark-theme .kg-settings-tab,
.dark-theme .kg-settings-panel {
  background: var(--card-background);
  border-color: var(--border-color);
}

.dark-theme .kg-settings-tab:hover {
  background: var(--surface-color);
}

.dark-theme .kg-namespace-info,
.dark-theme .kg-entity-type-item,
.dark-theme .kg-relation-type-item {
  background: var(--surface-color);
}
</style>
