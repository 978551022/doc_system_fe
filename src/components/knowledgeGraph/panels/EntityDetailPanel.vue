<template>
  <div class="kg-entity-panel">
    <!-- 头部 -->
    <div class="kg-entity-panel__header">
      <div class="kg-entity-panel__title">
        <span class="kg-entity-panel__icon">{{ entityIcon }}</span>
        <span class="kg-entity-panel__name">实体详情</span>
      </div>
      <el-button
        type="text"
        size="small"
        @click="$emit('close')"
        class="kg-entity-panel__close"
      >
        <i class="el-icon-close"></i>
      </el-button>
    </div>

    <!-- 内容 -->
    <div class="kg-entity-panel__content">
      <!-- 加载状态 -->
      <div v-if="loading" class="kg-entity-panel__loading">
        <el-icon class="is-loading" :size="24">
          <Loading />
        </el-icon>
        <p>加载中...</p>
      </div>

      <!-- 实体信息 -->
      <div v-else-if="entity" class="kg-entity-panel__body">
        <!-- 基本信息 -->
        <div class="kg-entity-panel__section">
          <h4 class="kg-entity-panel__section-title">基本信息</h4>
          <div class="kg-entity-panel__info">
            <div class="kg-entity-panel__info-row">
              <span class="kg-entity-panel__info-label">名称</span>
              <span class="kg-entity-panel__info-value">{{ entity.name || entity.label }}</span>
            </div>
            <div class="kg-entity-panel__info-row">
              <span class="kg-entity-panel__info-label">类型</span>
              <el-tag :color="entityTypeColor" size="small">
                {{ entityTypeName }}
              </el-tag>
            </div>
            <div v-if="entity.aliases && entity.aliases.length > 0" class="kg-entity-panel__info-row">
              <span class="kg-entity-panel__info-label">别名</span>
              <span class="kg-entity-panel__info-value">{{ entity.aliases.join('、') }}</span>
            </div>
            <div v-if="entity.description" class="kg-entity-panel__info-row">
              <span class="kg-entity-panel__info-label">描述</span>
              <span class="kg-entity-panel__info-value">{{ entity.description }}</span>
            </div>
          </div>
        </div>

        <!-- 属性 -->
        <div v-if="entity.attributes && Object.keys(entity.attributes).length > 0" class="kg-entity-panel__section">
          <h4 class="kg-entity-panel__section-title">属性</h4>
          <div class="kg-entity-panel__attrs">
            <div
              v-for="(value, key) in entity.attributes"
              :key="key"
              class="kg-entity-panel__attr-item"
            >
              <span class="kg-entity-panel__attr-key">{{ key }}</span>
              <span class="kg-entity-panel__attr-value">{{ value }}</span>
            </div>
          </div>
        </div>

        <!-- 关系 -->
        <div v-if="entity.relations && entity.relations.length > 0" class="kg-entity-panel__section">
          <h4 class="kg-entity-panel__section-title">
            关系 ({{ entity.relations.length }})
          </h4>
          <div class="kg-entity-panel__relations">
            <div
              v-for="relation in entity.relations"
              :key="relation.id"
              class="kg-entity-panel__relation-item"
              @click="handleRelationClick(relation)"
            >
              <span class="kg-entity-panel__relation-label">{{ relationLabel(relation.type) }}</span>
              <i class="el-icon-arrow-right"></i>
              <span class="kg-entity-panel__relation-target">{{ relation.target_name }}</span>
            </div>
          </div>
        </div>

        <!-- 来源文档 -->
        <div v-if="entity.source_documents && entity.source_documents.length > 0" class="kg-entity-panel__section">
          <h4 class="kg-entity-panel__section-title">
            来源文档 ({{ entity.source_documents.length }})
          </h4>
          <div class="kg-entity-panel__docs">
            <el-tag
              v-for="doc in entity.source_documents"
              :key="doc"
              size="small"
              type="info"
              class="kg-entity-panel__doc-tag"
            >
              {{ doc }}
            </el-tag>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="kg-entity-panel__actions">
          <el-button
            type="primary"
            size="small"
            @click="handleHighlight"
          >
            <i class="el-icon-view"></i>
            在图谱中高亮
          </el-button>
          <el-button
            size="small"
            @click="handleExpand"
          >
            <i class="el-icon-plus"></i>
            展开邻域
          </el-button>
          <el-button
            size="small"
            @click="handlePath"
          >
            <i class="el-icon-connection"></i>
            路径探索
          </el-button>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="kg-entity-panel__empty">
        <div class="kg-entity-panel__empty-icon">📊</div>
        <p>选择一个实体查看详情</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Loading } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { knowledgeGraphStore } from '../../../stores/knowledgeGraphStore.js'
import { EntityType, EntityTypeConfig, RelationTypeLabels } from '../../../utils/knowledgeGraph/graphConstants.js'

const props = defineProps({
  entityId: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['close', 'highlight', 'expand', 'explore-path'])

const loading = ref(false)
const entity = computed(() => knowledgeGraphStore.selectedEntity)

// 实体类型配置
const entityConfig = computed(() => {
  if (!entity.value) return null
  return EntityTypeConfig[entity.value.type] || EntityTypeConfig[EntityType.CONCEPT]
})

const entityIcon = computed(() => entityConfig.value?.icon || '📊')
const entityTypeColor = computed(() => entityConfig.value?.color || '#999')
const entityTypeName = computed(() => {
  if (!entity.value) return ''
  const typeMap = {
    [EntityType.PERSON]: '人物',
    [EntityType.ORGANIZATION]: '组织',
    [EntityType.LOCATION]: '地点',
    [EntityType.TIME]: '时间',
    [EntityType.PRODUCT]: '产品',
    [EntityType.CONCEPT]: '概念',
    [EntityType.EVENT]: '事件',
    [EntityType.DOCUMENT]: '文档',
    [EntityType.TECHNOLOGY]: '技术',
    [EntityType.NUMBER]: '数字'
  }
  return typeMap[entity.value.type] || entity.value.type
})

// 获取关系标签
function relationLabel(type) {
  return RelationTypeLabels[type] || type
}

// 点击关系
function handleRelationClick(relation) {
  knowledgeGraphStore.selectEntity(relation.target)
}

// 高亮节点
function handleHighlight() {
  emit('highlight', entity.value.id)
  ElMessage.success('已高亮显示相关节点')
}

// 展开邻域
async function handleExpand() {
  try {
    await knowledgeGraphStore.expandNeighborhood(entity.value.id, 1)
    emit('expand', entity.value.id)
    ElMessage.success('已展开邻域')
  } catch (error) {
    ElMessage.error('展开失败')
  }
}

// 路径探索
function handlePath() {
  knowledgeGraphStore.setPathSourceEntity(entity.value)
  emit('explore-path', entity.value)
}
</script>

<style scoped>
.kg-entity-panel {
  width: 300px;
  height: 100%;
  background: var(--card-background);
  border-left: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
}

.kg-entity-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid var(--border-color);
}

.kg-entity-panel__title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.kg-entity-panel__icon {
  font-size: 18px;
}

.kg-entity-panel__close {
  padding: 4px;
  color: var(--text-muted);
}

.kg-entity-panel__close:hover {
  color: var(--text-primary);
}

.kg-entity-panel__content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.kg-entity-panel__loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-muted);
}

.kg-entity-panel__body {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.kg-entity-panel__section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.kg-entity-panel__section-title {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-color);
}

.kg-entity-panel__info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.kg-entity-panel__info-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.kg-entity-panel__info-label {
  font-size: 12px;
  color: var(--text-muted);
  min-width: 50px;
  flex-shrink: 0;
}

.kg-entity-panel__info-value {
  font-size: 13px;
  color: var(--text-primary);
  word-break: break-word;
}

.kg-entity-panel__attrs {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.kg-entity-panel__attr-item {
  display: flex;
  justify-content: space-between;
  padding: 6px 8px;
  background: var(--surface-color);
  border-radius: var(--radius-sm);
  font-size: 12px;
}

.kg-entity-panel__attr-key {
  color: var(--text-muted);
}

.kg-entity-panel__attr-value {
  color: var(--text-primary);
  font-weight: 500;
}

.kg-entity-panel__relations {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.kg-entity-panel__relation-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: var(--surface-color);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: var(--transition);
  font-size: 12px;
}

.kg-entity-panel__relation-item:hover {
  background: var(--primary-color);
  color: white;
}

.kg-entity-panel__relation-label {
  color: var(--primary-color);
  font-weight: 500;
}

.kg-entity-panel__relation-item:hover .kg-entity-panel__relation-label {
  color: white;
}

.kg-entity-panel__docs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.kg-entity-panel__doc-tag {
  cursor: pointer;
}

.kg-entity-panel__actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid var(--border-color);
}

.kg-entity-panel__actions .el-button {
  width: 100%;
}

.kg-entity-panel__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-muted);
  text-align: center;
}

.kg-entity-panel__empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
  opacity: 0.5;
}

/* 深色主题 */
.dark-theme .kg-entity-panel {
  background: var(--card-background);
  border-left-color: var(--border-color);
}

.dark-theme .kg-entity-panel__relation-item {
  background: var(--surface-color);
}

.dark-theme .kg-entity-panel__attr-item {
  background: var(--surface-color);
}
</style>
