<template>
  <div class="kg-path-explorer">
    <!-- 头部 -->
    <div class="kg-path-explorer__header">
      <h3 class="kg-path-explorer__title">路径探索</h3>
      <el-button
        type="text"
        size="small"
        @click="$emit('close')"
        class="kg-path-explorer__close"
      >
        <i class="el-icon-close"></i>
      </el-button>
    </div>

    <!-- 内容 -->
    <div class="kg-path-explorer__content">
      <!-- 节点选择 -->
      <div class="kg-path-explorer__section">
        <h4 class="kg-path-explorer__section-title">选择节点</h4>
        <div class="kg-path-explorer__selectors">
          <div class="kg-path-explorer__selector">
            <label>起点</label>
            <el-select
              v-model="sourceId"
              placeholder="选择起点"
              size="small"
              filterable
              style="width: 100%"
              @change="handleSourceChange"
            >
              <el-option
                v-for="node in availableNodes"
                :key="node.id"
                :label="node.label"
                :value="node.id"
              >
                <span style="margin-right: 8px">{{ node.data?.icon || '📊' }}</span>
                {{ node.label }}
              </el-option>
            </el-select>
          </div>
          <div class="kg-path-explorer__selector">
            <label>终点</label>
            <el-select
              v-model="targetId"
              placeholder="选择终点"
              size="small"
              filterable
              style="width: 100%"
              @change="handleTargetChange"
            >
              <el-option
                v-for="node in availableNodes"
                :key="node.id"
                :label="node.label"
                :value="node.id"
              >
                <span style="margin-right: 8px">{{ node.data?.icon || '📊' }}</span>
                {{ node.label }}
              </el-option>
            </el-select>
          </div>
        </div>
        <el-button
          type="primary"
          size="small"
          :disabled="!canFindPath"
          :loading="loading"
          @click="handleFindPath"
          style="width: 100%; margin-top: 12px"
        >
          <i class="el-icon-search"></i>
          查找路径
        </el-button>
      </div>

      <!-- 路径结果 -->
      <div v-if="paths.length > 0" class="kg-path-explorer__section">
        <h4 class="kg-path-explorer__section-title">
          找到 {{ paths.length }} 条路径
        </h4>
        <div class="kg-path-explorer__paths">
          <div
            v-for="(path, index) in paths"
            :key="index"
            class="kg-path-explorer__path-item"
            :class="{ 'kg-path-explorer__path-item--active': selectedPathIndex === index }"
            @click="handleSelectPath(index)"
          >
            <div class="kg-path-explorer__path-header">
              <span class="kg-path-explorer__path-index">路径 {{ index + 1 }}</span>
              <el-tag size="small" type="info">长度: {{ path.length }}</el-tag>
            </div>
            <div class="kg-path-explorer__path-nodes">
              <span
                v-for="(nodeId, i) in path.nodes"
                :key="nodeId"
                class="kg-path-explorer__path-node"
              >
                {{ getNodeLabel(nodeId) }}
                <i v-if="i < path.nodes.length - 1" class="el-icon-arrow-right"></i>
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else-if="!loading && searched" class="kg-path-explorer__empty">
        <div class="kg-path-explorer__empty-icon">🔍</div>
        <p>未找到路径</p>
        <p class="kg-path-explorer__empty-desc">请尝试选择其他节点</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { knowledgeGraphStore } from '../../../stores/knowledgeGraphStore.js'

const emit = defineEmits(['close', 'path-select'])

// 状态
const loading = ref(false)
const searched = ref(false)
const sourceId = ref(null)
const targetId = ref(null)
const paths = ref([])
const selectedPathIndex = ref(-1)

// 可用节点
const availableNodes = computed(() => knowledgeGraphStore.graphNodes)

// 是否可以查找路径
const canFindPath = computed(() => {
  return sourceId.value && targetId.value && sourceId.value !== targetId.value
})

// 获取节点标签
function getNodeLabel(nodeId) {
  const node = availableNodes.value.find(n => n.id === nodeId)
  return node?.label || nodeId
}

// 起点变化
function handleSourceChange() {
  if (sourceId.value && targetId.value) {
    searched.value = false
  }
}

// 终点变化
function handleTargetChange() {
  if (sourceId.value && targetId.value) {
    searched.value = false
  }
}

// 查找路径
async function handleFindPath() {
  if (!canFindPath.value) return

  loading.value = true
  searched.value = false

  try {
    await knowledgeGraphStore.findPath(sourceId.value, targetId.value)
    paths.value = knowledgeGraphStore.pathResults
    searched.value = true

    if (paths.value.length === 0) {
      ElMessage.warning('未找到路径')
    } else {
      ElMessage.success(`找到 ${paths.value.length} 条路径`)
    }
  } catch (error) {
    console.error('查找路径失败:', error)
    ElMessage.error('查找路径失败')
  } finally {
    loading.value = false
  }
}

// 选择路径
function handleSelectPath(index) {
  selectedPathIndex.value = index
  emit('path-select', paths.value[index])
}

// 暴露方法
defineExpose({
  setSource: (id) => {
    sourceId.value = id
  },
  setTarget: (id) => {
    targetId.value = id
  },
  clear: () => {
    sourceId.value = null
    targetId.value = null
    paths.value = []
    selectedPathIndex.value = -1
    searched.value = false
  }
})
</script>

<style scoped>
.kg-path-explorer {
  width: 320px;
  height: 100%;
  background: var(--card-background);
  border-left: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
}

.kg-path-explorer__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid var(--border-color);
}

.kg-path-explorer__title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.kg-path-explorer__close {
  padding: 4px;
  color: var(--text-muted);
}

.kg-path-explorer__close:hover {
  color: var(--text-primary);
}

.kg-path-explorer__content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.kg-path-explorer__section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.kg-path-explorer__section-title {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.kg-path-explorer__selectors {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.kg-path-explorer__selector {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.kg-path-explorer__selector label {
  font-size: 12px;
  color: var(--text-muted);
}

.kg-path-explorer__paths {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 400px;
  overflow-y: auto;
}

.kg-path-explorer__path-item {
  padding: 12px;
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: var(--transition);
}

.kg-path-explorer__path-item:hover {
  border-color: var(--primary-color);
}

.kg-path-explorer__path-item--active {
  border-color: var(--primary-color);
  background: rgba(79, 70, 229, 0.05);
}

.kg-path-explorer__path-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.kg-path-explorer__path-index {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.kg-path-explorer__path-nodes {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  font-size: 12px;
}

.kg-path-explorer__path-node {
  color: var(--text-secondary);
}

.kg-path-explorer__path-node i {
  color: var(--text-muted);
  font-size: 10px;
}

.kg-path-explorer__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: var(--text-muted);
  text-align: center;
}

.kg-path-explorer__empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
  opacity: 0.5;
}

.kg-path-explorer__empty-desc {
  font-size: 12px;
  margin-top: 4px;
}

/* 深色主题 */
.dark-theme .kg-path-explorer {
  background: var(--card-background);
  border-left-color: var(--border-color);
}

.dark-theme .kg-path-explorer__path-item {
  background: var(--surface-color);
  border-color: var(--border-color);
}

.dark-theme .kg-path-explorer__path-item--active {
  background: rgba(129, 140, 248, 0.1);
}
</style>
