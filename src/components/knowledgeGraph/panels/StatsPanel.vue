<template>
  <div class="kg-stats-panel">
    <!-- 头部 -->
    <div class="kg-stats-panel__header">
      <h3 class="kg-stats-panel__title">图谱统计</h3>
      <el-button
        type="text"
        size="small"
        @click="$emit('close')"
        class="kg-stats-panel__close"
      >
        <i class="el-icon-close"></i>
      </el-button>
    </div>

    <!-- 内容 -->
    <div class="kg-stats-panel__content">
      <!-- 加载状态 -->
      <div v-if="loading" class="kg-stats-panel__loading">
        <el-icon class="is-loading" :size="24">
          <Loading />
        </el-icon>
        <p>加载中...</p>
      </div>

      <!-- 统计信息 -->
      <div v-else class="kg-stats-panel__body">
        <!-- 基础统计 -->
        <div class="kg-stats-panel__section">
          <h4 class="kg-stats-panel__section-title">基础统计</h4>
          <div class="kg-stats-panel__basic">
            <div class="kg-stats-panel__stat-item">
              <div class="kg-stats-panel__stat-icon" style="background: #5B8FF9">
                <i class="el-icon-user"></i>
              </div>
              <div class="kg-stats-panel__stat-content">
                <div class="kg-stats-panel__stat-value">{{ stats.nodeCount }}</div>
                <div class="kg-stats-panel__stat-label">实体数量</div>
              </div>
            </div>
            <div class="kg-stats-panel__stat-item">
              <div class="kg-stats-panel__stat-icon" style="background: #61DDAA">
                <i class="el-icon-connection"></i>
              </div>
              <div class="kg-stats-panel__stat-content">
                <div class="kg-stats-panel__stat-value">{{ stats.edgeCount }}</div>
                <div class="kg-stats-panel__stat-label">关系数量</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 实体类型分布 -->
        <div v-if="Object.keys(stats.entityTypeDistribution).length > 0" class="kg-stats-panel__section">
          <h4 class="kg-stats-panel__section-title">实体类型分布</h4>
          <div class="kg-stats-panel__distribution">
            <div
              v-for="(count, type) in stats.entityTypeDistribution"
              :key="type"
              class="kg-stats-panel__dist-item"
            >
              <div class="kg-stats-panel__dist-header">
                <span class="kg-stats-panel__dist-label">{{ getEntityTypeLabel(type) }}</span>
                <span class="kg-stats-panel__dist-count">{{ count }}</span>
              </div>
              <div class="kg-stats-panel__dist-bar">
                <div
                  class="kg-stats-panel__dist-fill"
                  :style="{
                    width: getDistributionPercent(count, stats.nodeCount) + '%',
                    background: getEntityTypeColor(type)
                  }"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <!-- 关系类型分布 -->
        <div v-if="Object.keys(stats.relationTypeDistribution).length > 0" class="kg-stats-panel__section">
          <h4 class="kg-stats-panel__section-title">关系类型分布</h4>
          <div class="kg-stats-panel__distribution">
            <div
              v-for="(count, type) in stats.relationTypeDistribution"
              :key="type"
              class="kg-stats-panel__dist-item"
            >
              <div class="kg-stats-panel__dist-header">
                <span class="kg-stats-panel__dist-label">{{ getRelationTypeLabel(type) }}</span>
                <span class="kg-stats-panel__dist-count">{{ count }}</span>
              </div>
              <div class="kg-stats-panel__dist-bar">
                <div
                  class="kg-stats-panel__dist-fill"
                  :style="{
                    width: getDistributionPercent(count, stats.edgeCount) + '%',
                    background: '#999'
                  }"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <!-- 图指标 -->
        <div class="kg-stats-panel__section">
          <h4 class="kg-stats-panel__section-title">图指标</h4>
          <div class="kg-stats-panel__metrics">
            <div class="kg-stats-panel__metric-item">
              <span class="kg-stats-panel__metric-label">图密度</span>
              <span class="kg-stats-panel__metric-value">{{ graphDensity }}</span>
            </div>
            <div class="kg-stats-panel__metric-item">
              <span class="kg-stats-panel__metric-label">平均度数</span>
              <span class="kg-stats-panel__metric-value">{{ averageDegree }}</span>
            </div>
            <div class="kg-stats-panel__metric-item">
              <span class="kg-stats-panel__metric-label">连通性</span>
              <span class="kg-stats-panel__metric-value">{{ connectivity }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Loading } from '@element-plus/icons-vue'
import { knowledgeGraphStore } from '../../../stores/knowledgeGraphStore.js'
import { EntityTypeConfig, RelationTypeLabels, EntityType } from '../../../utils/knowledgeGraph/graphConstants.js'

const emit = defineEmits(['close'])

const loading = ref(false)

// 从store获取统计数据
const stats = computed(() => knowledgeGraphStore.graphStats)

// 计算图指标
const graphDensity = computed(() => {
  const n = stats.value.nodeCount
  const e = stats.value.edgeCount
  if (n <= 1) return '0.00'
  const maxEdges = (n * (n - 1)) / 2
  return (e / maxEdges).toFixed(2)
})

const averageDegree = computed(() => {
  const n = stats.value.nodeCount
  const e = stats.value.edgeCount
  if (n === 0) return '0.00'
  return ((2 * e) / n).toFixed(2)
})

const connectivity = computed(() => {
  const n = stats.value.nodeCount
  if (n === 0) return '无数据'
  if (stats.value.edgeCount >= n - 1) return '连通'
  return '部分连通'
})

// 获取实体类型标签
function getEntityTypeLabel(type) {
  const labels = {
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
  return labels[type] || type
}

// 获取实体类型颜色
function getEntityTypeColor(type) {
  return EntityTypeConfig[type]?.color || '#999'
}

// 获取关系类型标签
function getRelationTypeLabel(type) {
  return RelationTypeLabels[type] || type
}

// 计算分布百分比
function getDistributionPercent(count, total) {
  if (total === 0) return 0
  return Math.round((count / total) * 100)
}
</script>

<style scoped>
.kg-stats-panel {
  width: 280px;
  height: 100%;
  background: var(--card-background);
  border-left: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
}

.kg-stats-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid var(--border-color);
}

.kg-stats-panel__title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.kg-stats-panel__close {
  padding: 4px;
  color: var(--text-muted);
}

.kg-stats-panel__close:hover {
  color: var(--text-primary);
}

.kg-stats-panel__content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.kg-stats-panel__loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-muted);
}

.kg-stats-panel__body {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.kg-stats-panel__section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.kg-stats-panel__section-title {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-color);
}

.kg-stats-panel__basic {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.kg-stats-panel__stat-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--surface-color);
  border-radius: var(--radius-md);
}

.kg-stats-panel__stat-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 18px;
}

.kg-stats-panel__stat-content {
  flex: 1;
}

.kg-stats-panel__stat-value {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
}

.kg-stats-panel__stat-label {
  font-size: 12px;
  color: var(--text-muted);
}

.kg-stats-panel__distribution {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.kg-stats-panel__dist-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.kg-stats-panel__dist-header {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
}

.kg-stats-panel__dist-label {
  color: var(--text-secondary);
}

.kg-stats-panel__dist-count {
  font-weight: 600;
  color: var(--text-primary);
}

.kg-stats-panel__dist-bar {
  height: 6px;
  background: var(--surface-color);
  border-radius: 3px;
  overflow: hidden;
}

.kg-stats-panel__dist-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.kg-stats-panel__metrics {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.kg-stats-panel__metric-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 12px;
  background: var(--surface-color);
  border-radius: var(--radius-sm);
  font-size: 12px;
}

.kg-stats-panel__metric-label {
  color: var(--text-secondary);
}

.kg-stats-panel__metric-value {
  font-weight: 600;
  color: var(--text-primary);
}

.kg-stats-panel__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-muted);
  text-align: center;
}

.kg-stats-panel__empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
  opacity: 0.5;
}

/* 深色主题 */
.dark-theme .kg-stats-panel {
  background: var(--card-background);
  border-left-color: var(--border-color);
}

.dark-theme .kg-stats-panel__stat-item {
  background: var(--surface-color);
}

.dark-theme .kg-stats-panel__metric-item {
  background: var(--surface-color);
}

.dark-theme .kg-stats-panel__dist-bar {
  background: var(--surface-color);
}
</style>
