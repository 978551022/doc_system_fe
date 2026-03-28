<template>
  <div class="kg-relations">
    <!-- 筛选栏 -->
    <div class="kg-relations-filter">
      <el-select
        v-model="filters.relationType"
        placeholder="全部类型"
        clearable
        @change="handleFilterChange"
        class="kg-filter-select"
      >
        <el-option label="全部类型" value="" />
        <el-option
          v-for="type in relationTypes"
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
        placeholder="搜索实体名称或关系..."
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
        <el-option label="关系类型" value="relation_type" />
        <el-option label="源实体" value="source_entity" />
      </el-select>

      <el-button type="primary" @click="showCreateDialog">
        <i class="el-icon-plus"></i> 添加关系
      </el-button>
    </div>

    <!-- 关系列表 -->
    <div class="kg-relations-list" v-loading="relationStore.loading">
      <!-- 卡片视图 -->
      <div class="kg-relation-cards" v-if="relationStore.relations.length > 0">
        <div
          v-for="relation in relationStore.relations"
          :key="relation.relation_id"
          class="kg-relation-card"
          @click="handleViewRelation(relation)"
        >
          <div class="kg-relation-card__header">
            <div class="kg-relation-card__type" :style="{ color: getRelationTypeColor(relation.relation_type) }">
              {{ getRelationTypeIcon(relation.relation_type) }}
            </div>
            <el-dropdown trigger="click" @click.stop>
              <el-button size="small" text>
                <i class="el-icon-more"></i>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="handleEditRelation(relation)">
                    <i class="el-icon-edit"></i> 编辑
                  </el-dropdown-item>
                  <el-dropdown-item @click="handleDeleteRelation(relation)">
                    <i class="el-icon-delete"></i> 删除
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
          <div class="kg-relation-card__body">
            <!-- 关系表达式 -->
            <div class="kg-relation-card__expression">
              <div class="kg-relation-node kg-relation-node--source">
                <span class="kg-relation-node__icon">{{ getEntityTypeIcon(getEntityType(relation.source_entity_id)) }}</span>
                <span class="kg-relation-node__name">{{ getEntityName(relation.source_entity_id) }}</span>
              </div>
              <div class="kg-relation-edge">
                <span class="kg-relation-edge__label" :style="{ color: getRelationTypeColor(relation.relation_type) }">
                  {{ getRelationTypeName(relation.relation_type) }}
                </span>
                <span class="kg-relation-edge__arrow">→</span>
              </div>
              <div class="kg-relation-node kg-relation-node--target">
                <span class="kg-relation-node__icon">{{ getEntityTypeIcon(getEntityType(relation.target_entity_id)) }}</span>
                <span class="kg-relation-node__name">{{ getEntityName(relation.target_entity_id) }}</span>
              </div>
            </div>
            <div class="kg-relation-card__type-label">
              <el-tag size="small" :style="{ backgroundColor: getRelationTypeColor(relation.relation_type) + '20', color: getRelationTypeColor(relation.relation_type), border: '1px solid ' + getRelationTypeColor(relation.relation_type) + '40' }">
                {{ getRelationTypeName(relation.relation_type) }}
              </el-tag>
            </div>
            <div class="kg-relation-card__desc" v-if="relation.description">
              {{ relation.description }}
            </div>
            <div class="kg-relation-card__meta">
              <span><i class="el-icon-document"></i> {{ relation.document_count || 0 }} 文档来源</span>
              <span><i class="el-icon-time"></i> {{ formatDate(relation.created_at) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div class="kg-empty-state" v-else>
        <div class="kg-empty-icon">🔗</div>
        <h3>暂无关系数据</h3>
        <p>该知识图谱还没有关系，您可以手动添加或从文档中提取</p>
        <el-button type="primary" @click="showCreateDialog">
          <i class="el-icon-plus"></i> 添加关系
        </el-button>
        <el-button @click="$router.push('/knowledge-graph/document-build')">
          <i class="el-icon-document"></i> 从文档构建
        </el-button>
      </div>
    </div>

    <!-- 分页 -->
    <div class="kg-relations-pagination" v-if="relationStore.totalPages > 1">
      <el-pagination
        :current-page="relationStore.pagination.page"
        :page-size="relationStore.pagination.size"
        :total="relationStore.pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
      />
    </div>

    <!-- 创建/编辑关系对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEditMode ? '编辑关系' : '添加关系'"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form :model="relationForm" label-width="100px" :rules="formRules" ref="relationFormRef">
        <el-form-item label="源实体" prop="source_entity_id">
          <el-select
            v-model="relationForm.source_entity_id"
            placeholder="请选择源实体"
            filterable
            style="width: 100%"
            @change="handleSourceEntityChange"
          >
            <el-option
              v-for="entity in availableEntities"
              :key="entity.entity_id"
              :label="entity.name"
              :value="entity.entity_id"
            >
              <span style="margin-right: 8px">{{ getEntityTypeIcon(entity.entity_type) }}</span>
              {{ entity.name }}
              <el-tag size="small" style="margin-left: 8px">{{ entity.entity_type }}</el-tag>
            </el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="关系类型" prop="relation_type">
          <el-select v-model="relationForm.relation_type" placeholder="请选择关系类型" style="width: 100%">
            <el-option
              v-for="type in relationTypes"
              :key="type.value"
              :label="type.label"
              :value="type.value"
            >
              <span style="margin-right: 8px">{{ type.icon }}</span>
              {{ type.label }}
            </el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="目标实体" prop="target_entity_id">
          <el-select
            v-model="relationForm.target_entity_id"
            placeholder="请选择目标实体"
            filterable
            style="width: 100%"
          >
            <el-option
              v-for="entity in availableEntities"
              :key="entity.entity_id"
              :label="entity.name"
              :value="entity.entity_id"
            >
              <span style="margin-right: 8px">{{ getEntityTypeIcon(entity.entity_type) }}</span>
              {{ entity.name }}
              <el-tag size="small" style="margin-left: 8px">{{ entity.entity_type }}</el-tag>
            </el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="描述">
          <el-input
            v-model="relationForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入关系描述"
          />
        </el-form-item>

        <el-form-item label="属性">
          <div class="kg-attrs-editor">
            <div
              v-for="(attr, index) in relationForm.attributes"
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
        <el-button type="primary" @click="handleSaveRelation" :loading="submitting">
          {{ isEditMode ? '保存' : '创建' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 关系详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="关系详情"
      width="700px"
    >
      <div class="kg-relation-detail" v-if="currentRelation">
        <div class="kg-relation-detail__expression">
          <div class="kg-relation-detail-node">
            <div class="kg-relation-detail-node__icon" :style="{ color: getEntityTypeColor(currentRelation.source_entity_type) }">
              {{ getEntityTypeIcon(currentRelation.source_entity_type) }}
            </div>
            <div class="kg-relation-detail-node__info">
              <div class="kg-relation-detail-node__name">{{ currentRelation.source_entity_name }}</div>
              <el-tag size="small" :color="getEntityTypeColor(currentRelation.source_entity_type)">
                {{ currentRelation.source_entity_type }}
              </el-tag>
            </div>
          </div>

          <div class="kg-relation-detail-edge">
            <div class="kg-relation-detail-edge__label" :style="{ color: getRelationTypeColor(currentRelation.relation_type) }">
              {{ getRelationTypeIcon(currentRelation.relation_type) }}
              {{ currentRelation.relation_type }}
            </div>
            <div class="kg-relation-detail-edge__line"></div>
          </div>

          <div class="kg-relation-detail-node">
            <div class="kg-relation-detail-node__icon" :style="{ color: getEntityTypeColor(currentRelation.target_entity_type) }">
              {{ getEntityTypeIcon(currentRelation.target_entity_type) }}
            </div>
            <div class="kg-relation-detail-node__info">
              <div class="kg-relation-detail-node__name">{{ currentRelation.target_entity_name }}</div>
              <el-tag size="small" :color="getEntityTypeColor(currentRelation.target_entity_type)">
                {{ currentRelation.target_entity_type }}
              </el-tag>
            </div>
          </div>
        </div>

        <el-divider />

        <div class="kg-relation-detail__section" v-if="currentRelation.description">
          <div class="kg-relation-detail__label">描述</div>
          <div class="kg-relation-detail__content">{{ currentRelation.description }}</div>
        </div>

        <div class="kg-relation-detail__section" v-if="currentRelation.attributes">
          <div class="kg-relation-detail__label">属性</div>
          <div class="kg-relation-detail__content">
            <div
              v-for="(value, key) in currentRelation.attributes"
              :key="key"
              class="kg-relation-detail__attr"
            >
              <span class="kg-relation-detail__attr-key">{{ key }}:</span>
              <span class="kg-relation-detail__attr-value">{{ value }}</span>
            </div>
          </div>
        </div>

        <div class="kg-relation-detail__section">
          <div class="kg-relation-detail__label">统计</div>
          <div class="kg-relation-detail__content">
            <span>来源文档: {{ currentRelation.source_documents?.length || 0 }}</span>
            <span style="margin-left: 16px">置信度: {{ currentRelation.confidence || 'N/A' }}</span>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox, ElForm } from 'element-plus'
import { useNamespaceStore } from '../../stores/knowledgeGraph/namespaceStore.js'
import { useRelationStore } from '../../stores/knowledgeGraph/relationStore.js'
import { useEntityStore } from '../../stores/knowledgeGraph/entityStore.js'

const namespaceStore = useNamespaceStore()
const relationStore = useRelationStore()
const entityStore = useEntityStore()

// 关系类型配置
const relationTypes = [
  { value: 'CONTAINS', label: '包含', icon: '📦' },
  { value: 'BELONGS_TO', label: '属于', icon: '🏷️' },
  { value: 'RELATED_TO', label: '关联', icon: '🔗' },
  { value: 'LOCATED_AT', label: '位于', icon: '📍' },
  { value: 'CREATED', label: '创建', icon: '✨' },
  { value: 'OWNS', label: '拥有', icon: '👤' },
  { value: 'DEPENDS_ON', label: '依赖', icon: '🔌' },
  { value: 'SIMILAR_TO', label: '相似', icon: '🔄' },
  { value: 'OPPOSES', label: '对立', icon: '⚔️' },
  { value: 'CAUSES', label: '因果', icon: '➡️' }
]

// 实体类型配置（用于图标）
const entityTypes = [
  { value: 'Person', label: '人物', icon: '👤' },
  { value: 'Organization', label: '组织', icon: '🏢' },
  { value: 'Location', label: '地点', icon: '📍' },
  { value: 'Concept', label: '概念', icon: '💡' },
  { value: 'Event', label: '事件', icon: '📅' },
  { value: 'Document', label: '文档', icon: '📄' },
  { value: 'Technology', label: '技术', icon: '⚙️' },
  { value: 'Product', label: '产品', icon: '📦' }
]

// UI状态
const dialogVisible = ref(false)
const detailDialogVisible = ref(false)
const isEditMode = ref(false)
const submitting = ref(false)
const relationFormRef = ref(null)
const isLoading = ref(false)

// 可用实体列表（用于选择）
const availableEntities = ref([])
// 实体ID到名称的映射
const entityMap = ref(new Map())

// 筛选条件
const filters = ref({
  relationType: '',
  searchQuery: '',
  sortBy: 'created_at'
})

// 关系表单
const relationForm = ref({
  source_entity_id: '',
  relation_type: 'RELATED_TO',
  target_entity_id: '',
  description: '',
  attributes: []
})

// 当前关系
const currentRelation = ref(null)

// 表单验证规则
const formRules = {
  source_entity_id: [
    { required: true, message: '请选择源实体', trigger: 'change' }
  ],
  relation_type: [
    { required: true, message: '请选择关系类型', trigger: 'change' }
  ],
  target_entity_id: [
    { required: true, message: '请选择目标实体', trigger: 'change' }
  ]
}

// 获取关系类型图标
function getRelationTypeIcon(type) {
  const config = relationTypes.find(t => t.value === type)
  return config?.icon || '🔗'
}

// 获取关系类型颜色
function getRelationTypeColor(type) {
  const colors = {
    'CONTAINS': '#3B82F6',
    'BELONGS_TO': '#10B981',
    'RELATED_TO': '#8B5CF6',
    'LOCATED_AT': '#F59E0B',
    'CREATED': '#EC4899',
    'OWNS': '#06B6D4',
    'DEPENDS_ON': '#EF4444',
    'SIMILAR_TO': '#A855F7',
    'OPPOSES': '#F97316',
    'CAUSES': '#14B8A6'
  }
  return colors[type] || '#94A3B8'
}

// 获取关系类型中文名
function getRelationTypeName(type) {
  const config = relationTypes.find(t => t.value === type)
  return config?.label || type
}

// 获取实体类型图标
function getEntityTypeIcon(type) {
  const config = entityTypes.find(t => t.value === type)
  return config?.icon || '📦'
}

// 获取实体类型颜色
function getEntityTypeColor(type) {
  const colors = {
    'Person': '#3B82F6',
    'Organization': '#10B981',
    'Location': '#F59E0B',
    'Concept': '#8B5CF6',
    'Event': '#EF4444',
    'Document': '#6B7280',
    'Technology': '#06B6D4',
    'Product': '#EC4899'
  }
  return colors[type] || '#94A3B8'
}

// 获取实体类型中文名
function getEntityTypeName(type) {
  const config = entityTypes.find(t => t.value === type)
  return config?.label || type
}

// 获取实体名称（支持ID和名称两种格式）
function getEntityName(entity) {
  if (!entity) return '未知'
  if (typeof entity === 'string') {
    // 如果是ID，从映射中查找
    const mappedName = entityMap.value.get(entity)
    if (mappedName) return mappedName
    // 如果映射中没有，可能后端返回的就是名称，直接返回
    return entity
  }
  return entity.name || entity.entity_id || '未知'
}

// 获取实体类型
function getEntityType(entity) {
  if (!entity) return 'Unknown'
  if (typeof entity === 'string') {
    // 如果是ID，从映射中查找
    const entityData = entityMap.value.get(entity + '_type')
    return entityData || 'Unknown'
  }
  return entity.entity_type || entity.type || 'Unknown'
}

// 格式化日期
function formatDate(dateStr) {
  if (!dateStr) return '未知'
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN')
}

// 加载实体映射（用于显示实体名称）
async function loadEntityMap() {
  const namespaceId = namespaceStore.currentNamespaceId
  if (!namespaceId) return

  try {
    await entityStore.getEntityList(namespaceId, { page: 1, size: 1000 })
    const newMap = new Map()
    entityStore.entities.forEach(entity => {
      newMap.set(entity.entity_id, entity.name)
      newMap.set(entity.entity_id + '_type', entity.entity_type)
    })
    entityMap.value = newMap
    console.log('RelationsPage: 实体映射加载完成，共', newMap.size, '条记录')
  } catch (error) {
    console.error('加载实体映射失败:', error)
  }
}

// 加载关系列表
async function loadRelations() {
  const namespaceId = namespaceStore.currentNamespaceId
  if (!namespaceId) {
    console.log('RelationsPage: 没有选择命名空间')
    return
  }

  // 防止重复请求
  if (isLoading.value) {
    console.log('RelationsPage: 正在加载中，跳过')
    return
  }

  isLoading.value = true
  console.log('RelationsPage: 加载关系列表', {
    namespaceId,
    page: relationStore.pagination.page,
    size: relationStore.pagination.size,
    relationType: filters.value.relationType
  })

  try {
    await relationStore.getRelationList(namespaceId, {
      page: relationStore.pagination.page,
      size: relationStore.pagination.size,
      relation_type: filters.value.relationType || undefined
    })
    console.log('RelationsPage: 加载完成，关系数量:', relationStore.relations.length)
  } catch (error) {
    console.error('加载关系列表失败:', error)
    ElMessage.error('加载关系列表失败: ' + (error.message || '未知错误'))
  } finally {
    isLoading.value = false
  }
}

// 加载可用实体列表（用于对话框选择）
async function loadAvailableEntities() {
  const namespaceId = namespaceStore.currentNamespaceId
  if (!namespaceId) return

  try {
    await entityStore.getEntityList(namespaceId, { page: 1, size: 1000 })
    availableEntities.value = entityStore.entities || []
    console.log('RelationsPage: 可用实体加载完成，共', availableEntities.value.length, '个')
  } catch (error) {
    console.error('加载实体列表失败:', error)
    ElMessage.error('加载实体列表失败')
  }
}

// 筛选变化 - 类型筛选
async function handleFilterChange() {
  console.log('RelationsPage: 类型筛选变更', filters.value.relationType)
  relationStore.setPage(1)
  await loadRelations()
}

// 搜索
async function handleSearch() {
  console.log('RelationsPage: 搜索关系', filters.value.searchQuery)
  relationStore.setPage(1)
  await loadRelations()
}

// 排序变化
function handleSortChange() {
  loadRelations()
}

// 分页变化
function handlePageChange(page) {
  relationStore.setPage(page)
  loadRelations()
}

function handleSizeChange(size) {
  relationStore.setSize(size)
  loadRelations()
}

// 显示创建对话框
async function showCreateDialog() {
  isEditMode.value = false
  await loadAvailableEntities()
  relationForm.value = {
    source_entity_id: '',
    relation_type: 'RELATED_TO',
    target_entity_id: '',
    description: '',
    attributes: []
  }
  dialogVisible.value = true
}

// 源实体变化时更新关系类型建议
function handleSourceEntityChange(entityId) {
  const entity = availableEntities.value.find(e => e.entity_id === entityId)
  if (entity) {
    // 根据实体类型建议合适的关系类型
    if (entity.entity_type === 'Organization') {
      relationForm.value.relation_type = 'CONTAINS'
    } else if (entity.entity_type === 'Person') {
      relationForm.value.relation_type = 'RELATED_TO'
    }
  }
}

// 查看关系详情
async function handleViewRelation(relation) {
  const namespaceId = namespaceStore.currentNamespaceId
  if (!namespaceId) return

  try {
    const detail = await relationStore.getRelationById(namespaceId, relation.relation_id)
    // 补充实体名称信息
    if (detail) {
      detail.source_entity_name = entityMap.value.get(detail.source_entity_id) || detail.source_entity_id
      detail.target_entity_name = entityMap.value.get(detail.target_entity_id) || detail.target_entity_id
      detail.source_entity_type = entityMap.value.get(detail.source_entity_id + '_type') || 'Unknown'
      detail.target_entity_type = entityMap.value.get(detail.target_entity_id + '_type') || 'Unknown'
    }
    currentRelation.value = detail
    detailDialogVisible.value = true
  } catch (error) {
    console.error('获取关系详情失败:', error)
    ElMessage.error('获取关系详情失败')
  }
}

// 编辑关系
async function handleEditRelation(relation) {
  isEditMode.value = true
  currentRelation.value = relation
  await loadAvailableEntities()

  relationForm.value = {
    source_entity_id: relation.source_entity_id,
    relation_type: relation.relation_type,
    target_entity_id: relation.target_entity_id,
    description: relation.description || '',
    attributes: Object.entries(relation.attributes || {}).map(([key, value]) => ({ key, value }))
  }

  dialogVisible.value = true
}

// 删除关系
async function handleDeleteRelation(relation) {
  try {
    await ElMessageBox.confirm(
      `确定要删除这个关系吗？`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const namespaceId = namespaceStore.currentNamespaceId
    await relationStore.deleteRelation(namespaceId, relation.relation_id)
    ElMessage.success('删除成功')
    await loadRelations()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除关系失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

// 保存关系
async function handleSaveRelation() {
  try {
    await relationFormRef.value.validate()
    submitting.value = true

    const namespaceId = namespaceStore.currentNamespaceId

    // 检查不能创建自环
    if (relationForm.value.source_entity_id === relationForm.value.target_entity_id) {
      ElMessage.warning('源实体和目标实体不能相同')
      submitting.value = false
      return
    }

    // 准备数据
    const data = {
      source_entity: relationForm.value.source_entity_id,
      relation_type: relationForm.value.relation_type,
      target_entity: relationForm.value.target_entity_id,
      description: relationForm.value.description,
      attributes: {}
    }

    // 转换属性
    relationForm.value.attributes.forEach(attr => {
      if (attr.key && attr.value) {
        data.attributes[attr.key] = attr.value
      }
    })

    if (isEditMode.value) {
      await relationStore.updateRelation(namespaceId, currentRelation.value.relation_id, data)
      ElMessage.success('更新成功')
    } else {
      await relationStore.createRelation(namespaceId, data)
      ElMessage.success('创建成功')
    }

    dialogVisible.value = false
    await loadRelations()
  } catch (error) {
    if (error !== false) {
      console.error('保存关系失败:', error)
      ElMessage.error('保存失败: ' + (error.message || '未知错误'))
    }
  } finally {
    submitting.value = false
  }
}

// 添加属性
function addAttr() {
  relationForm.value.attributes.push({ key: '', value: '' })
}

// 删除属性
function removeAttr(index) {
  relationForm.value.attributes.splice(index, 1)
}

// 监听命名空间变化
watch(() => namespaceStore.currentNamespaceId, (newId, oldId) => {
  if (newId && newId !== oldId) {
    loadEntityMap()
    loadRelations()
  }
})

// 初始化
onMounted(async () => {
  await loadEntityMap()
  await loadRelations()
})
</script>

<style scoped>
.kg-relations {
  padding: 24px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* 筛选栏 */
.kg-relations-filter {
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
  width: 140px;
}

/* 关系列表 */
.kg-relations-list {
  flex: 1;
  overflow-y: auto;
}

.kg-relation-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 16px;
}

.kg-relation-card {
  background: var(--card-background);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition);
  overflow: hidden;
}

.kg-relation-card:hover {
  border-color: var(--primary-color);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.kg-relation-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--surface-color);
}

.kg-relation-card__type {
  font-size: 24px;
}

.kg-relation-card__body {
  padding: 16px;
}

/* 关系表达式 */
.kg-relation-card__expression {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.kg-relation-node {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: var(--surface-color);
  border-radius: var(--radius-sm);
  flex: 1;
}

.kg-relation-node__icon {
  font-size: 18px;
  flex-shrink: 0;
}

.kg-relation-node__name {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.kg-relation-edge {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
}

.kg-relation-edge__label {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 6px;
  background: var(--surface-color);
  border-radius: var(--radius-sm);
}

.kg-relation-edge__arrow {
  font-size: 12px;
  color: var(--text-muted);
}

.kg-relation-card__type-label {
  margin-bottom: 8px;
}

.kg-relation-card__desc {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 12px;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.kg-relation-card__meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: var(--text-muted);
}

.kg-relation-card__meta span {
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
.kg-relations-pagination {
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

/* 关系详情 */
.kg-relation-detail__expression {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 20px;
  background: var(--surface-color);
  border-radius: var(--radius-md);
}

.kg-relation-detail-node {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.kg-relation-detail-node__icon {
  font-size: 36px;
  flex-shrink: 0;
}

.kg-relation-detail-node__info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.kg-relation-detail-node__name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.kg-relation-detail-edge {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.kg-relation-detail-edge__label {
  font-size: 12px;
  font-weight: 600;
  padding: 6px 12px;
  background: var(--card-background);
  border-radius: var(--radius-md);
  white-space: nowrap;
}

.kg-relation-detail-edge__line {
  width: 40px;
  height: 2px;
  background: var(--border-color);
}

.kg-relation-detail__section {
  margin-bottom: 16px;
}

.kg-relation-detail__label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.kg-relation-detail__content {
  font-size: 14px;
  color: var(--text-primary);
  line-height: 1.6;
}

.kg-relation-detail__attr {
  display: flex;
  gap: 8px;
  margin-bottom: 4px;
}

.kg-relation-detail__attr-key {
  color: var(--text-secondary);
  min-width: 100px;
}

/* 深色主题 */
.dark-theme .kg-relation-card,
.dark-theme .kg-empty-state {
  background: var(--card-background);
  border-color: var(--border-color);
}

.dark-theme .kg-relation-detail__expression {
  background: var(--surface-color);
}
</style>
