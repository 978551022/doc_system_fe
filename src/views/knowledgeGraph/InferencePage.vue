<template>
  <div class="kg-inference">
    <!-- 推理模式选择 -->
    <div class="kg-inference-modes">
      <div
        v-for="mode in inferenceModes"
        :key="mode.key"
        class="kg-inference-mode"
        :class="{ 'kg-inference-mode--active': currentMode === mode.key }"
        @click="switchMode(mode.key)"
      >
        <span class="kg-inference-mode__icon">{{ mode.icon }}</span>
        <span class="kg-inference-mode__label">{{ mode.label }}</span>
      </div>
    </div>

    <!-- 路径查询模式 -->
    <div class="kg-inference-content" v-if="currentMode === 'path'">
      <div class="kg-inference-form">
        <h3>实体间路径查询</h3>
        <p class="kg-inference-desc">查找两个实体之间的关系路径，支持多跳推理</p>

        <el-form :model="pathForm" label-width="100px" @submit.prevent="handlePathQuery">
          <el-form-item label="起始实体">
            <el-select
              v-model="pathForm.sourceId"
              placeholder="选择起始实体"
              filterable
              style="width: 100%"
              :loading="loadingEntities"
            >
              <el-option
                v-for="entity in availableEntities"
                :key="entity.entity_id"
                :label="entity.name"
                :value="entity.entity_id"
              >
                <span style="margin-right: 8px">{{ getEntityTypeIcon(entity.entity_type) }}</span>
                {{ entity.name }}
              </el-option>
            </el-select>
          </el-form-item>

          <el-form-item label="目标实体">
            <el-select
              v-model="pathForm.targetId"
              placeholder="选择目标实体"
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
              </el-option>
            </el-select>
          </el-form-item>

          <el-form-item label="最大跳数">
            <el-slider v-model="pathForm.maxDepth" :min="1" :max="5" :marks="{ 1: '1', 3: '3', 5: '5' }" />
          </el-form-item>

          <el-form-item>
            <el-button type="primary" @click="handlePathQuery" :loading="querying">
              <i class="el-icon-search"></i> 查询路径
            </el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 路径结果 -->
      <div class="kg-inference-result" v-if="pathResults.length > 0">
        <div class="kg-inference-result__header">
          <h4>查询结果 ({{ pathResults.length }} 条路径)</h4>
          <el-button size="small" text @click="pathResults = []">
            <i class="el-icon-close"></i> 清除
          </el-button>
        </div>

        <div class="kg-path-list">
          <div
            v-for="(path, index) in pathResults"
            :key="index"
            class="kg-path-item"
          >
            <div class="kg-path-item__header">
              <span class="kg-path-item__index">路径 {{ index + 1 }}</span>
              <el-tag size="small" type="info">长度: {{ path.length }}</el-tag>
            </div>

            <div class="kg-path-item__body">
              <div class="kg-path-nodes">
                <template v-for="(node, nodeIndex) in path.nodes" :key="nodeIndex">
                  <div class="kg-path-node">
                    <span class="kg-path-node__icon">{{ getEntityTypeIcon(node.type) }}</span>
                    <span class="kg-path-node__name">{{ node.name }}</span>
                  </div>
                  <div class="kg-path-edge" v-if="nodeIndex < path.nodes.length - 1">
                    <span class="kg-path-edge__label">{{ path.edges[nodeIndex]?.type }}</span>
                    <span class="kg-path-edge__arrow">→</span>
                  </div>
                </template>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 邻域分析模式 -->
    <div class="kg-inference-content" v-if="currentMode === 'neighborhood'">
      <div class="kg-inference-form">
        <h3>实体邻域分析</h3>
        <p class="kg-inference-desc">查看实体的邻域关系网络，分析其关联实体</p>

        <el-form :model="neighborhoodForm" label-width="100px">
          <el-form-item label="选择实体">
            <el-select
              v-model="neighborhoodForm.entityId"
              placeholder="选择要分析的实体"
              filterable
              style="width: 100%"
              @change="handleNeighborhoodQuery"
            >
              <el-option
                v-for="entity in availableEntities"
                :key="entity.entity_id"
                :label="entity.name"
                :value="entity.entity_id"
              >
                <span style="margin-right: 8px">{{ getEntityTypeIcon(entity.entity_type) }}</span>
                {{ entity.name }}
              </el-option>
            </el-select>
          </el-form-item>

          <el-form-item label="分析深度">
            <el-radio-group v-model="neighborhoodForm.depth" @change="handleNeighborhoodQuery">
              <el-radio :label="1">1跳 (直接关系)</el-radio>
              <el-radio :label="2">2跳 (间接关系)</el-radio>
              <el-radio :label="3">3跳 (深层关系)</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-form>
      </div>

      <!-- 邻域可视化 -->
      <div class="kg-neighborhood-result" v-if="neighborhoodData.nodes.length > 0">
        <div class="kg-neighborhood-stats">
          <div class="kg-neighborhood-stat">
            <span class="kg-neighborhood-stat__value">{{ neighborhoodData.nodes.length }}</span>
            <span class="kg-neighborhood-stat__label">相关实体</span>
          </div>
          <div class="kg-neighborhood-stat">
            <span class="kg-neighborhood-stat__value">{{ neighborhoodData.edges.length }}</span>
            <span class="kg-neighborhood-stat__label">关系数量</span>
          </div>
        </div>

        <!-- 邻域节点列表 -->
        <div class="kg-neighborhood-nodes">
          <div
            v-for="node in neighborhoodData.nodes"
            :key="node.id"
            class="kg-neighborhood-node"
            :class="{ 'kg-neighborhood-node--center': node.isCenter }"
          >
            <div class="kg-neighborhood-node__icon">{{ getEntityTypeIcon(node.type) }}</div>
            <div class="kg-neighborhood-node__info">
              <div class="kg-neighborhood-node__name">{{ node.name }}</div>
              <div class="kg-neighborhood-node__type">{{ node.type }}</div>
            </div>
            <div class="kg-neighborhood-node__distance" v-if="!node.isCenter">
              {{ node.distance }}跳
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 推理链生成模式 -->
    <div class="kg-inference-content" v-if="currentMode === 'chain'">
      <div class="kg-inference-form">
        <h3>推理链生成</h3>
        <p class="kg-inference-desc">基于知识图谱生成推理链，解释问题的答案</p>

        <el-form :model="chainForm" label-width="100px">
          <el-form-item label="问题">
            <el-input
              v-model="chainForm.question"
              type="textarea"
              :rows="3"
              placeholder="请输入要推理的问题，例如：张三和李四是什么关系？"
            />
          </el-form-item>

          <el-form-item label="推理模式">
            <el-radio-group v-model="chainForm.mode">
              <el-radio label="explain">解释型推理</el-radio>
              <el-radio label="deductive">演绎推理</el-radio>
              <el-radio label="inductive">归纳推理</el-radio>
            </el-radio-group>
          </el-form-item>

          <el-form-item>
            <el-button type="primary" @click="handleChainGeneration" :loading="querying">
              <i class="el-icon-magic-stick"></i> 生成推理链
            </el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 推理链结果 -->
      <div class="kg-chain-result" v-if="chainResult">
        <div class="kg-chain-result__header">
          <h4>推理结果</h4>
        </div>

        <div class="kg-chain-steps">
          <div
            v-for="(step, index) in chainResult.steps"
            :key="index"
            class="kg-chain-step"
          >
            <div class="kg-chain-step__number">{{ index + 1 }}</div>
            <div class="kg-chain-step__content">
              <div class="kg-chain-step__text">{{ step.reasoning }}</div>
              <div class="kg-chain-step__evidence" v-if="step.evidence">
                <i class="el-icon-document"></i> 证据: {{ step.evidence }}
              </div>
            </div>
          </div>
        </div>

        <div class="kg-chain-conclusion">
          <div class="kg-chain-conclusion__label">结论</div>
          <div class="kg-chain-conclusion__text">{{ chainResult.conclusion }}</div>
        </div>
      </div>
    </div>

    <!-- 连通性分析模式 -->
    <div class="kg-inference-content" v-if="currentMode === 'connectivity'">
      <div class="kg-inference-form">
        <h3>连通性分析</h3>
        <p class="kg-inference-desc">检查多个实体之间的连通性和聚类情况</p>

        <el-form :model="connectivityForm" label-width="100px">
          <el-form-item label="选择实体">
            <el-select
              v-model="connectivityForm.entityIds"
              multiple
              placeholder="选择要分析的实体（至少2个）"
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
              </el-option>
            </el-select>
          </el-form-item>

          <el-form-item>
            <el-button type="primary" @click="handleConnectivityCheck" :loading="querying">
              <i class="el-icon-connection"></i> 分析连通性
            </el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 连通性结果 -->
      <div class="kg-connectivity-result" v-if="connectivityResult">
        <div class="kg-connectivity-status" :class="`kg-connectivity-status--${connectivityResult.connected ? 'connected' : 'disconnected'}`">
          <i :class="connectivityResult.connected ? 'el-icon-connection' : 'el-icon-disconnect'" />
          <span>{{ connectivityResult.connected ? '实体之间存在连通路径' : '实体之间不完全连通' }}</span>
        </div>

        <div class="kg-connectivity-clusters" v-if="connectivityResult.clusters">
          <h4>聚类分析</h4>
          <div class="kg-cluster-list">
            <div
              v-for="(cluster, index) in connectivityResult.clusters"
              :key="index"
              class="kg-cluster-item"
            >
              <div class="kg-cluster-item__header">
                <span class="kg-cluster-item__name">聚类 {{ index + 1 }}</span>
                <el-tag size="small">{{ cluster.entities.length }} 个实体</el-tag>
              </div>
              <div class="kg-cluster-item__entities">
                <el-tag
                  v-for="entity in cluster.entities"
                  :key="entity"
                  size="small"
                  style="margin: 2px"
                >
                  {{ getEntityNameById(entity) }}
                </el-tag>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 统计面板 -->
    <div class="kg-inference-stats">
      <div class="kg-inference-stat">
        <span class="kg-inference-stat__icon">🔍</span>
        <div class="kg-inference-stat__info">
          <span class="kg-inference-stat__value">{{ queryCount }}</span>
          <span class="kg-inference-stat__label">查询次数</span>
        </div>
      </div>
      <div class="kg-inference-stat">
        <span class="kg-inference-stat__icon">⏱️</span>
        <div class="kg-inference-stat__info">
          <span class="kg-inference-stat__value">{{ avgTime }}ms</span>
          <span class="kg-inference-stat__label">平均耗时</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useNamespaceStore } from '../../stores/knowledgeGraph/namespaceStore.js'
import { useEntityStore } from '../../stores/knowledgeGraph/entityStore.js'
import {
  getEntityPath,
  getNodeNeighborhood,
  generateReasoningChain,
  suggestConnections
} from '../../api/knowledgeGraph.js'

const namespaceStore = useNamespaceStore()
const entityStore = useEntityStore()

// 推理模式
const inferenceModes = [
  { key: 'path', label: '路径查询', icon: '🔍' },
  { key: 'neighborhood', label: '邻域分析', icon: '🕸️' },
  { key: 'chain', label: '推理链', icon: '🔗' },
  { key: 'connectivity', label: '连通性', icon: '🔌' }
]

// UI状态
const currentMode = ref('path')
const querying = ref(false)
const loadingEntities = ref(false)

// 实体数据
const availableEntities = ref([])

// 路径查询
const pathForm = ref({
  sourceId: '',
  targetId: '',
  maxDepth: 3
})
const pathResults = ref([])

// 邻域分析
const neighborhoodForm = ref({
  entityId: '',
  depth: 1
})
const neighborhoodData = ref({
  nodes: [],
  edges: []
})

// 推理链
const chainForm = ref({
  question: '',
  mode: 'explain'
})
const chainResult = ref(null)

// 连通性分析
const connectivityForm = ref({
  entityIds: []
})
const connectivityResult = ref(null)

// 统计
const queryCount = ref(0)
const queryTimes = ref([])
const avgTime = computed(() => {
  if (queryTimes.value.length === 0) return 0
  return Math.round(queryTimes.value.reduce((a, b) => a + b, 0) / queryTimes.value.length)
})

// 实体类型图标
function getEntityTypeIcon(type) {
  const icons = {
    '人物': '👤',
    '组织': '🏢',
    '地点': '📍',
    '概念': '💡',
    '事件': '📅',
    '文档': '📄',
    '技术': '⚙️'
  }
  return icons[type] || '📦'
}

// 根据ID获取实体名称
function getEntityNameById(id) {
  const entity = availableEntities.value.find(e => e.entity_id === id)
  return entity?.name || id
}

// 切换模式
function switchMode(mode) {
  currentMode.value = mode
}

// 加载实体列表
async function loadEntities() {
  const namespaceId = namespaceStore.currentNamespaceId
  if (!namespaceId) return

  loadingEntities.value = true
  try {
    await entityStore.getEntityList(namespaceId, { page: 1, size: 1000 })
    availableEntities.value = entityStore.entities || []
  } catch (error) {
    console.error('加载实体列表失败:', error)
  } finally {
    loadingEntities.value = false
  }
}

// 路径查询
async function handlePathQuery() {
  if (!pathForm.value.sourceId || !pathForm.value.targetId) {
    ElMessage.warning('请选择起始实体和目标实体')
    return
  }

  if (pathForm.value.sourceId === pathForm.value.targetId) {
    ElMessage.warning('起始实体和目标实体不能相同')
    return
  }

  querying.value = true
  const startTime = Date.now()

  try {
    const namespaceId = namespaceStore.currentNamespaceId
    const response = await getEntityPath(namespaceId, {
      source_entity: pathForm.value.sourceId,
      target_entity: pathForm.value.targetId,
      max_depth: pathForm.value.maxDepth
    })

    if (response.code === 200) {
      const paths = response.data?.paths || []
      if (paths.length === 0) {
        ElMessage.info('未找到相关路径')
      } else {
        pathResults.value = paths
        ElMessage.success(`找到 ${paths.length} 条路径`)
      }
    }

    queryCount.value++
    queryTimes.value.push(Date.now() - startTime)
  } catch (error) {
    console.error('路径查询失败:', error)
    ElMessage.error('查询失败')
  } finally {
    querying.value = false
  }
}

// 邻域查询
async function handleNeighborhoodQuery() {
  if (!neighborhoodForm.value.entityId) return

  querying.value = true
  const startTime = Date.now()

  try {
    const namespaceId = namespaceStore.currentNamespaceId
    const response = await getNodeNeighborhood(
      namespaceId,
      neighborhoodForm.value.entityId,
      { depth: neighborhoodForm.value.depth }
    )

    if (response.code === 200) {
      const data = response.data || {}
      neighborhoodData.value = {
        nodes: (data.nodes || []).map(node => ({
          ...node,
          isCenter: node.id === neighborhoodForm.value.entityId
        })),
        edges: data.edges || []
      }
      ElMessage.success(`找到 ${neighborhoodData.value.nodes.length} 个相关实体`)
    }

    queryCount.value++
    queryTimes.value.push(Date.now() - startTime)
  } catch (error) {
    console.error('邻域查询失败:', error)
    ElMessage.error('查询失败')
  } finally {
    querying.value = false
  }
}

// 推理链生成
async function handleChainGeneration() {
  if (!chainForm.value.question.trim()) {
    ElMessage.warning('请输入问题')
    return
  }

  querying.value = true
  const startTime = Date.now()

  try {
    const namespaceId = namespaceStore.currentNamespaceId
    const response = await generateReasoningChain(namespaceId, {
      question: chainForm.value.question,
      mode: chainForm.value.mode
    })

    if (response.code === 200) {
      chainResult.value = response.data
      ElMessage.success('推理链生成成功')
    }

    queryCount.value++
    queryTimes.value.push(Date.now() - startTime)
  } catch (error) {
    console.error('推理链生成失败:', error)
    ElMessage.error('生成失败')
  } finally {
    querying.value = false
  }
}

// 连通性检查
async function handleConnectivityCheck() {
  if (connectivityForm.value.entityIds.length < 2) {
    ElMessage.warning('请至少选择2个实体')
    return
  }

  querying.value = true
  const startTime = Date.now()

  try {
    const namespaceId = namespaceStore.currentNamespaceId
    const response = await suggestConnections(namespaceId, connectivityForm.value.entityIds)

    if (response.code === 200) {
      // 根据后端返回的建议连接构建结果
      const suggestions = response.data?.suggestions || []
      connectivityResult.value = {
        connected: suggestions.length > 0,
        suggestions: suggestions
      }
      ElMessage.success('分析完成')
    }

    queryCount.value++
    queryTimes.value.push(Date.now() - startTime)
  } catch (error) {
    console.error('连通性检查失败:', error)
    ElMessage.error('检查失败')
  } finally {
    querying.value = false
  }
}

// 初始化
onMounted(async () => {
  await loadEntities()
})
</script>

<style scoped>
.kg-inference {
  padding: 24px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* 推理模式选择 */
.kg-inference-modes {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.kg-inference-mode {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: var(--card-background);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition);
}

.kg-inference-mode:hover {
  border-color: var(--primary-color);
  background: var(--surface-color);
}

.kg-inference-mode--active {
  background: var(--primary-color);
  border-color: var(--primary-color);
  color: white;
}

.kg-inference-mode__icon {
  font-size: 20px;
}

.kg-inference-mode__label {
  font-weight: 500;
}

/* 推理内容区 */
.kg-inference-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow-y: auto;
}

.kg-inference-form {
  background: var(--card-background);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 20px;
}

.kg-inference-form h3 {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: var(--text-primary);
}

.kg-inference-desc {
  margin: 0 0 20px 0;
  font-size: 13px;
  color: var(--text-secondary);
}

/* 推理结果 */
.kg-inference-result {
  background: var(--card-background);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 20px;
}

.kg-inference-result__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.kg-inference-result__header h4 {
  margin: 0;
  font-size: 14px;
  color: var(--text-primary);
}

/* 路径结果 */
.kg-path-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.kg-path-item {
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.kg-path-item__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background: var(--surface-color);
  border-bottom: 1px solid var(--border-color);
}

.kg-path-item__index {
  font-weight: 600;
  color: var(--text-primary);
}

.kg-path-item__body {
  padding: 16px;
}

.kg-path-nodes {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.kg-path-node {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: var(--surface-color);
  border-radius: var(--radius-sm);
}

.kg-path-node__icon {
  font-size: 18px;
}

.kg-path-node__name {
  font-size: 13px;
  color: var(--text-primary);
}

.kg-path-edge {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.kg-path-edge__label {
  font-size: 11px;
  color: var(--primary-color);
  background: var(--card-background);
  padding: 2px 6px;
  border-radius: var(--radius-sm);
}

.kg-path-edge__arrow {
  font-size: 12px;
  color: var(--text-muted);
}

/* 邻域结果 */
.kg-neighborhood-result {
  background: var(--card-background);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 20px;
}

.kg-neighborhood-stats {
  display: flex;
  gap: 24px;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--border-color);
}

.kg-neighborhood-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.kg-neighborhood-stat__value {
  font-size: 24px;
  font-weight: 600;
  color: var(--primary-color);
}

.kg-neighborhood-stat__label {
  font-size: 12px;
  color: var(--text-secondary);
}

.kg-neighborhood-nodes {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.kg-neighborhood-node {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--surface-color);
  border-radius: var(--radius-md);
  border: 2px solid transparent;
  transition: var(--transition);
}

.kg-neighborhood-node--center {
  border-color: var(--primary-color);
  background: var(--primary-color);
  color: white;
}

.kg-neighborhood-node:hover {
  border-color: var(--primary-color);
}

.kg-neighborhood-node__icon {
  font-size: 28px;
}

.kg-neighborhood-node__info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.kg-neighborhood-node__name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.kg-neighborhood-node--center .kg-neighborhood-node__name {
  color: white;
}

.kg-neighborhood-node__type {
  font-size: 11px;
  color: var(--text-secondary);
}

.kg-neighborhood-node--center .kg-neighborhood-node__type {
  color: rgba(255, 255, 255, 0.8);
}

.kg-neighborhood-node__distance {
  font-size: 11px;
  color: var(--primary-color);
  background: var(--card-background);
  padding: 2px 6px;
  border-radius: var(--radius-sm);
}

/* 推理链结果 */
.kg-chain-result {
  background: var(--card-background);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 20px;
}

.kg-chain-result__header h4 {
  margin: 0 0 16px 0;
  font-size: 14px;
  color: var(--text-primary);
}

.kg-chain-steps {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 20px;
}

.kg-chain-step {
  display: flex;
  gap: 12px;
}

.kg-chain-step__number {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--primary-color);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 13px;
  flex-shrink: 0;
}

.kg-chain-step__content {
  flex: 1;
  padding: 12px;
  background: var(--surface-color);
  border-radius: var(--radius-md);
}

.kg-chain-step__text {
  font-size: 14px;
  color: var(--text-primary);
  line-height: 1.6;
}

.kg-chain-step__evidence {
  margin-top: 8px;
  font-size: 12px;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 4px;
}

.kg-chain-conclusion {
  padding: 16px;
  background: var(--primary-color);
  color: white;
  border-radius: var(--radius-md);
}

.kg-chain-conclusion__label {
  font-size: 12px;
  opacity: 0.8;
  margin-bottom: 8px;
}

.kg-chain-conclusion__text {
  font-size: 15px;
  line-height: 1.6;
}

/* 连通性结果 */
.kg-connectivity-result {
  background: var(--card-background);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 20px;
}

.kg-connectivity-status {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-radius: var(--radius-md);
  margin-bottom: 20px;
  font-size: 15px;
}

.kg-connectivity-status--connected {
  background: #D1FAE5;
  color: #065F46;
}

.kg-connectivity-status--disconnected {
  background: #FEE2E2;
  color: #991B1B;
}

.dark-theme .kg-connectivity-status--connected {
  background: rgba(6, 95, 70, 0.3);
}

.dark-theme .kg-connectivity-status--disconnected {
  background: rgba(153, 27, 27, 0.3);
}

.kg-connectivity-clusters h4 {
  margin: 0 0 16px 0;
  font-size: 14px;
  color: var(--text-primary);
}

.kg-cluster-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.kg-cluster-item {
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.kg-cluster-item__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background: var(--surface-color);
}

.kg-cluster-item__name {
  font-weight: 500;
  color: var(--text-primary);
}

.kg-cluster-item__entities {
  padding: 12px 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

/* 统计面板 */
.kg-inference-stats {
  display: flex;
  gap: 16px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid var(--border-color);
}

.kg-inference-stat {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--card-background);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
}

.kg-inference-stat__icon {
  font-size: 24px;
}

.kg-inference-stat__info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.kg-inference-stat__value {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.kg-inference-stat__label {
  font-size: 12px;
  color: var(--text-secondary);
}

/* 深色主题 */
.dark-theme .kg-inference-mode,
.dark-theme .kg-inference-form,
.dark-theme .kg-inference-result,
.dark-theme .kg-neighborhood-result,
.dark-theme .kg-chain-result,
.dark-theme .kg-connectivity-result,
.dark-theme .kg-inference-stat {
  background: var(--card-background);
  border-color: var(--border-color);
}

.dark-theme .kg-inference-mode:hover,
.dark-theme .kg-neighborhood-node:hover {
  background: var(--surface-color);
}
</style>
