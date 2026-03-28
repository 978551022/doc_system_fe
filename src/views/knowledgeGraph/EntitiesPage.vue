<template>
  <div class="kg-entities">
    <!-- 筛选栏 -->
    <div class="kg-entities-filter">
      <el-select
        v-model="filters.entityType"
        placeholder="全部类型"
        clearable
        @change="handleFilterChange"
        class="kg-filter-select"
      >
        <el-option label="全部类型" value="" />
        <el-option
          v-for="type in entityTypes"
          :key="type.value"
          :label="type.label"
          :value="type.value"
        >
          <span style="margin-right: 8px">{{ type.icon }}</span>
          {{ type.label }}
        </el-option>
      </el-select>

      <el-input
        v-model="filters.searchQuery"
        placeholder="搜索实体名称..."
        clearable
        @keyup.enter="handleSearch"
        class="kg-filter-search"
      >
        <template #append>
          <el-button @click="handleSearch">
            <i class="el-icon-search"></i>
          </el-button>
        </template>
      </el-input>

      <el-select v-model="filters.sortBy" @change="handleSortChange" class="kg-filter-sort">
        <el-option label="创建时间" value="created_at" />
        <el-option label="名称" value="name" />
        <el-option label="类型" value="type" />
      </el-select>

      <el-button type="primary" @click="showCreateDialog">
        <i class="el-icon-plus"></i> 添加实体
      </el-button>
    </div>

    <!-- 实体列表 -->
    <div class="kg-entities-list" v-loading="entityStore.loading">
      <!-- 卡片视图 -->
      <div class="kg-entity-cards" v-if="entityStore.entities.length > 0">
        <div
          v-for="entity in entityStore.entities"
          :key="entity.entity_id"
          class="kg-entity-card"
          @click="handleViewEntity(entity)"
        >
          <div class="kg-entity-card__header">
            <div class="kg-entity-card__type" :style="{ color: getEntityTypeColor(entity.entity_type) }">
              {{ getEntityTypeIcon(entity.entity_type) }}
            </div>
            <el-dropdown trigger="click" @click.stop>
              <el-button size="small" text>
                <i class="el-icon-more"></i>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="handleEditEntity(entity)">
                    <i class="el-icon-edit"></i> 编辑
                  </el-dropdown-item>
                  <el-dropdown-item @click="handleDeleteEntity(entity)">
                    <i class="el-icon-delete"></i> 删除
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
          <div class="kg-entity-card__body">
            <div class="kg-entity-card__name">{{ entity.name }}</div>
            <div class="kg-entity-card__type-label">
              <el-tag size="small" :color="getEntityTypeColor(entity.entity_type)">
                {{ entity.entity_type }}
              </el-tag>
            </div>
            <div class="kg-entity-card__desc" v-if="entity.description">
              {{ entity.description }}
            </div>
            <div class="kg-entity-card__meta">
              <span><i class="el-icon-connection"></i> {{ entity.relation_count || 0 }} 关系</span>
              <span><i class="el-icon-document"></i> {{ entity.document_count || 0 }} 文档</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div class="kg-empty-state" v-else>
        <div class="kg-empty-icon">📦</div>
        <h3>暂无实体数据</h3>
        <p>该知识图谱还没有实体，您可以手动添加或从文档中提取</p>
        <el-button type="primary" @click="showCreateDialog">
          <i class="el-icon-plus"></i> 添加实体
        </el-button>
        <el-button @click="$router.push('/knowledge-graph/document-build')">
          <i class="el-icon-document"></i> 从文档构建
        </el-button>
      </div>
    </div>

    <!-- 分页 -->
    <div class="kg-entities-pagination" v-if="entityStore.totalPages > 1">
      <el-pagination
        :current-page="entityStore.pagination.page"
        :page-size="entityStore.pagination.size"
        :total="entityStore.pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
      />
    </div>

    <!-- 创建/编辑实体对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEditMode ? '编辑实体' : '添加实体'"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form :model="entityForm" label-width="100px" :rules="formRules" ref="entityFormRef">
        <el-form-item label="实体名称" prop="name">
          <el-input v-model="entityForm.name" placeholder="请输入实体名称" />
        </el-form-item>

        <el-form-item label="实体类型" prop="entity_type">
          <el-select v-model="entityForm.entity_type" placeholder="请选择实体类型" style="width: 100%">
            <el-option
              v-for="type in entityTypes"
              :key="type.value"
              :label="type.label"
              :value="type.value"
            >
              <span style="margin-right: 8px">{{ type.icon }}</span>
              {{ type.label }}
            </el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="别名">
          <el-input v-model="entityForm.aliases" placeholder="多个别名用逗号分隔" />
        </el-form-item>

        <el-form-item label="描述">
          <el-input
            v-model="entityForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入实体描述"
          />
        </el-form-item>

        <el-form-item label="属性">
          <div class="kg-attrs-editor">
            <div
              v-for="(attr, index) in entityForm.attributes"
              :key="index"
              class="kg-attr-row"
            >
              <el-input
                v-model="attr.key"
                placeholder="属性名"
                style="width: 40%"
              />
              <el-input
                v-model="attr.value"
                placeholder="属性值"
                style="width: 40%"
              />
              <el-button
                size="small"
                text
                type="danger"
                @click="removeAttr(index)"
              >
                <i class="el-icon-delete"></i>
              </el-button>
            </div>
            <el-button size="small" text @click="addAttr">
              <i class="el-icon-plus"></i> 添加属性
            </el-button>
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveEntity" :loading="submitting">
          {{ isEditMode ? '保存' : '创建' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 实体详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="实体详情"
      width="700px"
    >
      <div class="kg-entity-detail" v-if="currentEntity">
        <div class="kg-entity-detail__header">
          <div class="kg-entity-detail__icon" :style="{ color: getEntityTypeColor(currentEntity.entity_type) }">
            {{ getEntityTypeIcon(currentEntity.entity_type) }}
          </div>
          <div class="kg-entity-detail__info">
            <div class="kg-entity-detail__name">{{ currentEntity.name }}</div>
            <el-tag :color="getEntityTypeColor(currentEntity.entity_type)" size="small">
              {{ currentEntity.entity_type }}
            </el-tag>
          </div>
        </div>

        <el-divider />

        <div class="kg-entity-detail__section" v-if="currentEntity.description">
          <div class="kg-entity-detail__label">描述</div>
          <div class="kg-entity-detail__content">{{ currentEntity.description }}</div>
        </div>

        <div class="kg-entity-detail__section" v-if="currentEntity.aliases && currentEntity.aliases.length > 0">
          <div class="kg-entity-detail__label">别名</div>
          <div class="kg-entity-detail__content">
            <el-tag
              v-for="(alias, index) in currentEntity.aliases"
              :key="index"
              size="small"
              style="margin-right: 4px"
            >
              {{ alias }}
            </el-tag>
          </div>
        </div>

        <div class="kg-entity-detail__section" v-if="currentEntity.attributes">
          <div class="kg-entity-detail__label">属性</div>
          <div class="kg-entity-detail__content">
            <div
              v-for="(value, key) in currentEntity.attributes"
              :key="key"
              class="kg-entity-detail__attr"
            >
              <span class="kg-entity-detail__attr-key">{{ key }}:</span>
              <span class="kg-entity-detail__attr-value">{{ value }}</span>
            </div>
          </div>
        </div>

        <div class="kg-entity-detail__section">
          <div class="kg-entity-detail__label">统计</div>
          <div class="kg-entity-detail__content">
            <span>关系数: {{ currentEntity.relations?.length || 0 }}</span>
            <span style="margin-left: 16px">来源文档: {{ currentEntity.source_documents?.length || 0 }}</span>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, ElForm } from 'element-plus'
import { useNamespaceStore } from '../../stores/knowledgeGraph/namespaceStore.js'
import { useEntityStore } from '../../stores/knowledgeGraph/entityStore.js'

const namespaceStore = useNamespaceStore()
const entityStore = useEntityStore()

// 实体类型配置
const entityTypes = [
  { value: '人物', label: '人物', icon: '👤' },
  { value: '组织', label: '组织', icon: '🏢' },
  { value: '地点', label: '地点', icon: '📍' },
  { value: '概念', label: '概念', icon: '💡' },
  { value: '事件', label: '事件', icon: '📅' },
  { value: '文档', label: '文档', icon: '📄' },
  { value: '技术', label: '技术', icon: '⚙️' }
]

// UI状态
const dialogVisible = ref(false)
const detailDialogVisible = ref(false)
const isEditMode = ref(false)
const submitting = ref(false)
const entityFormRef = ref(null)

// 筛选条件
const filters = ref({
  entityType: '',
  searchQuery: '',
  sortBy: 'created_at'
})

// 实体表单
const entityForm = ref({
  name: '',
  entity_type: '人物',
  aliases: '',
  description: '',
  attributes: []
})

// 当前实体
const currentEntity = ref(null)

// 表单验证规则
const formRules = {
  name: [
    { required: true, message: '请输入实体名称', trigger: 'blur' }
  ],
  entity_type: [
    { required: true, message: '请选择实体类型', trigger: 'change' }
  ]
}

// 获取实体类型图标
function getEntityTypeIcon(type) {
  const config = entityTypes.find(t => t.value === type)
  return config?.icon || '📦'
}

// 获取实体类型颜色
function getEntityTypeColor(type) {
  const colors = {
    '人物': '#3B82F6',
    '组织': '#10B981',
    '地点': '#F59E0B',
    '概念': '#8B5CF6',
    '事件': '#EF4444',
    '文档': '#6B7280',
    '技术': '#06B6D4'
  }
  return colors[type] || '#94A3B8'
}

// 加载实体列表
async function loadEntities() {
  const namespaceId = namespaceStore.currentNamespaceId
  if (!namespaceId) return

  try {
    await entityStore.getEntityList(namespaceId, {
      page: entityStore.pagination.page,
      size: entityStore.pagination.size,
      entity_type: filters.value.entityType || undefined
    })
  } catch (error) {
    console.error('加载实体列表失败:', error)
    ElMessage.error('加载实体列表失败')
  }
}

// 筛选变化
function handleFilterChange() {
  entityStore.setPage(1)
  loadEntities()
}

// 搜索
function handleSearch() {
  entityStore.setPage(1)
  loadEntities()
}

// 排序变化
function handleSortChange() {
  loadEntities()
}

// 分页变化
function handlePageChange(page) {
  entityStore.setPage(page)
  loadEntities()
}

function handleSizeChange(size) {
  entityStore.setSize(size)
  loadEntities()
}

// 显示创建对话框
function showCreateDialog() {
  isEditMode.value = false
  entityForm.value = {
    name: '',
    entity_type: '人物',
    aliases: '',
    description: '',
    attributes: []
  }
  dialogVisible.value = true
}

// 查看实体详情
async function handleViewEntity(entity) {
  const namespaceId = namespaceStore.currentNamespaceId
  if (!namespaceId) return

  try {
    const detail = await entityStore.getEntityById(namespaceId, entity.entity_id)
    currentEntity.value = detail
    detailDialogVisible.value = true
  } catch (error) {
    console.error('获取实体详情失败:', error)
    ElMessage.error('获取实体详情失败')
  }
}

// 编辑实体
function handleEditEntity(entity) {
  isEditMode.value = true
  currentEntity.value = entity

  entityForm.value = {
    name: entity.name,
    entity_type: entity.entity_type,
    aliases: entity.aliases?.join(', ') || '',
    description: entity.description || '',
    attributes: Object.entries(entity.attributes || {}).map(([key, value]) => ({ key, value }))
  }

  dialogVisible.value = true
}

// 删除实体
async function handleDeleteEntity(entity) {
  try {
    await ElMessageBox.confirm(
      `确定要删除实体"${entity.name}"吗？`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const namespaceId = namespaceStore.currentNamespaceId
    await entityStore.deleteEntity(namespaceId, entity.entity_id)
    ElMessage.success('删除成功')
    await loadEntities()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除实体失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

// 保存实体
async function handleSaveEntity() {
  try {
    await entityFormRef.value.validate()
    submitting.value = true

    const namespaceId = namespaceStore.currentNamespaceId

    // 准备数据
    const data = {
      name: entityForm.value.name,
      entity_type: entityForm.value.entity_type,
      aliases: entityForm.value.aliases.split(',').map(a => a.trim()).filter(a => a),
      description: entityForm.value.description,
      attributes: {}
    }

    // 转换属性
    entityForm.value.attributes.forEach(attr => {
      if (attr.key && attr.value) {
        data.attributes[attr.key] = attr.value
      }
    })

    if (isEditMode.value) {
      await entityStore.updateEntity(namespaceId, currentEntity.value.entity_id, data)
      ElMessage.success('更新成功')
    } else {
      await entityStore.createEntity(namespaceId, data)
      ElMessage.success('创建成功')
    }

    dialogVisible.value = false
    await loadEntities()
  } catch (error) {
    if (error !== false) {
      console.error('保存实体失败:', error)
      ElMessage.error('保存失败')
    }
  } finally {
    submitting.value = false
  }
}

// 添加属性
function addAttr() {
  entityForm.value.attributes.push({ key: '', value: '' })
}

// 删除属性
function removeAttr(index) {
  entityForm.value.attributes.splice(index, 1)
}

// 初始化
onMounted(async () => {
  await loadEntities()
})
</script>

<style scoped>
.kg-entities {
  padding: 24px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* 筛选栏 */
.kg-entities-filter {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.kg-filter-select {
  width: 140px;
}

.kg-filter-search {
  width: 280px;
}

.kg-filter-sort {
  width: 120px;
}

/* 实体列表 */
.kg-entities-list {
  flex: 1;
  overflow-y: auto;
}

.kg-entity-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.kg-entity-card {
  background: var(--card-background);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition);
  overflow: hidden;
}

.kg-entity-card:hover {
  border-color: var(--primary-color);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.kg-entity-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--surface-color);
}

.kg-entity-card__type {
  font-size: 24px;
}

.kg-entity-card__body {
  padding: 16px;
}

.kg-entity-card__name {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.kg-entity-card__type-label {
  margin-bottom: 8px;
}

.kg-entity-card__desc {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 12px;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.kg-entity-card__meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: var(--text-muted);
}

.kg-entity-card__meta span {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 空状态 */
.kg-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-muted);
  text-align: center;
}

.kg-empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.kg-empty-state h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  color: var(--text-secondary);
}

.kg-empty-state p {
  margin: 0 0 24px 0;
}

.kg-empty-state .el-button {
  margin: 0 8px;
}

/* 分页 */
.kg-entities-pagination {
  display: flex;
  justify-content: center;
  padding: 16px 0;
  border-top: 1px solid var(--border-color);
  flex-shrink: 0;
}

/* 属性编辑器 */
.kg-attrs-editor {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.kg-attr-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 实体详情 */
.kg-entity-detail__header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.kg-entity-detail__icon {
  font-size: 48px;
}

.kg-entity-detail__info {
  flex: 1;
}

.kg-entity-detail__name {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.kg-entity-detail__section {
  margin-bottom: 16px;
}

.kg-entity-detail__label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.kg-entity-detail__content {
  font-size: 14px;
  color: var(--text-primary);
  line-height: 1.6;
}

.kg-entity-detail__attr {
  display: flex;
  gap: 8px;
  margin-bottom: 4px;
}

.kg-entity-detail__attr-key {
  color: var(--text-secondary);
  min-width: 100px;
}

/* 深色主题 */
.dark-theme .kg-entity-card,
.dark-theme .kg-empty-state {
  background: var(--card-background);
  border-color: var(--border-color);
}
</style>
