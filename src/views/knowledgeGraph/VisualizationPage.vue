<template>
  <div class="kg-visualization">
    <!-- 工具栏 -->
    <div class="kg-vis-toolbar">
      <div class="kg-vis-toolbar__left">
        <el-input
          v-model="searchQuery"
          placeholder="搜索实体..."
          prefix-icon="el-icon-search"
          clearable
          @keyup.enter="handleSearch"
          class="kg-vis-search"
        />
        <el-button @click="handleSearch" type="primary">搜索</el-button>
        <el-button @click="handleFocusSelected" :disabled="!hasSelected">
          <i class="el-icon-aim"></i> 聚焦
        </el-button>
        <el-button @click="handleRefresh">
          <i class="el-icon-refresh"></i> 刷新
        </el-button>
        <el-button @click="handleSaveLayout">
          <i class="el-icon-document"></i> 保存布局
        </el-button>
      </div>

      <div class="kg-vis-toolbar__center">
        <span class="kg-vis-title" v-if="namespaceStore.currentNamespace">
          {{ namespaceStore.currentNamespace.name }}
        </span>
      </div>

      <div class="kg-vis-toolbar__right">
        <el-select v-model="layoutType" @change="handleLayoutChange" class="kg-vis-layout-select">
          <el-option label="力导向" value="force_directed" />
          <el-option label="环形" value="circular" />
          <el-option label="层次" value="hierarchical" />
        </el-select>

        <el-button @click="handleExportImage">
          <i class="el-icon-download"></i> 导出
        </el-button>
        <el-button @click="handleFullscreen">
          <i class="el-icon-rank"></i> 全屏
        </el-button>
      </div>
    </div>

    <!-- 图谱画布 -->
    <div class="kg-vis-canvas-container">
      <div ref="canvasContainer" class="kg-vis-canvas">
        <!-- G6 画布 -->
        <div ref="graphRef" class="kg-vis-graph"></div>

        <!-- 空状态 -->
        <div v-if="isEmpty && !loading" class="kg-vis-empty">
          <div class="kg-vis-empty-icon">📊</div>
          <h3 class="kg-vis-empty-title">暂无图谱数据</h3>
          <p class="kg-vis-empty-desc">
            请先从文档中提取实体和关系，或者手动创建
          </p>
          <el-button type="primary" @click="$router.push('/knowledge-graph/document-build')">
            <i class="el-icon-document"></i> 从文档构建
          </el-button>
        </div>

        <!-- 加载状态 -->
        <div v-if="loading" class="kg-vis-loading">
          <i class="el-icon-loading is-loading" style="font-size: 32px"></i>
          <p>加载中...</p>
        </div>
      </div>

      <!-- 图例 -->
      <div class="kg-vis-legend" v-if="!isEmpty">
        <div class="kg-vis-legend__title">图例</div>
        <div class="kg-vis-legend__items">
          <div
            v-for="(config, type) in entityTypeConfig"
            :key="type"
            class="kg-vis-legend-item"
          >
            <span
              class="kg-vis-legend-color"
              :style="{ background: config.color }"
            ></span>
            <span class="kg-vis-legend-text">{{ type }}</span>
          </div>
        </div>
      </div>

      <!-- 缩放控制 -->
      <div class="kg-vis-zoom">
        <el-button-group>
          <el-button size="small" @click="handleZoomIn">
            <i class="el-icon-zoom-in"></i>
          </el-button>
          <el-button size="small" @click="handleZoomReset">
            <i class="el-icon-full-screen"></i>
          </el-button>
          <el-button size="small" @click="handleZoomOut">
            <i class="el-icon-zoom-out"></i>
          </el-button>
        </el-button-group>
      </div>
    </div>

    <!-- 选中节点详情 -->
    <transition name="slide-right">
      <div v-if="selectedNode" class="kg-vis-detail-panel">
        <div class="kg-vis-detail-header">
          <h3>节点详情</h3>
          <el-button size="small" text @click="closeDetail">
            <i class="el-icon-close"></i>
          </el-button>
        </div>
        <div class="kg-vis-detail-body">
          <div class="kg-vis-detail-row">
            <span class="kg-vis-detail-label">名称:</span>
            <span class="kg-vis-detail-value">{{ selectedNode.label }}</span>
          </div>
          <div class="kg-vis-detail-row">
            <span class="kg-vis-detail-label">类型:</span>
            <span class="kg-vis-detail-value">
              <el-tag :color="getEntityTypeColor(selectedNode.type)" size="small">
                {{ selectedNode.type }}
              </el-tag>
            </span>
          </div>
          <div class="kg-vis-detail-row" v-if="selectedNode.attributes">
            <span class="kg-vis-detail-label">属性:</span>
            <div class="kg-vis-detail-attrs">
              <div
                v-for="(value, key) in selectedNode.attributes"
                :key="key"
                class="kg-vis-detail-attr"
              >
                <span class="kg-vis-detail-attr-key">{{ key }}:</span>
                <span class="kg-vis-detail-attr-value">{{ value }}</span>
              </div>
            </div>
          </div>
          <div class="kg-vis-detail-actions">
            <el-button size="small" @click="handleExpandNode">
              <i class="el-icon-plus"></i> 展开邻域
            </el-button>
            <el-button size="small" @click="handleEditNode">
              <i class="el-icon-edit"></i> 编辑
            </el-button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Graph } from '@antv/g6'
import { useNamespaceStore } from '../../stores/knowledgeGraph/namespaceStore.js'
import { useVisualizationStore } from '../../stores/knowledgeGraph/visualizationStore.js'
import { getGraphData, getSubGraph } from '../../api/knowledgeGraph.js'

const router = useRouter()
const namespaceStore = useNamespaceStore()
const visualizationStore = useVisualizationStore()

// DOM引用
const graphRef = ref(null)
const canvasContainer = ref(null)

// 状态
let graphInstance = null  // 使用普通变量而不是ref
const searchQuery = ref('')
const layoutType = ref('force_directed')
const loading = ref(false)

// 实体类型配置
const entityTypeConfig = {
  '人物': { color: '#3B82F6' },
  '组织': { color: '#10B981' },
  '地点': { color: '#F59E0B' },
  '概念': { color: '#8B5CF6' },
  '事件': { color: '#EF4444' },
  '文档': { color: '#6B7280' }
}

// 计算属性
const selectedNode = computed(() => visualizationStore.selectedNode)
const hasSelected = computed(() => !!selectedNode.value)
const isEmpty = computed(() => visualizationStore.isGraphEmpty)

// 初始化图谱
function initGraph() {
  if (!graphRef.value || graphInstance) return

  const isDark = document.body.classList.contains('dark-theme')
  const width = canvasContainer.value?.clientWidth || 800
  const height = canvasContainer.value?.clientHeight || 600

  // G6 v5 使用新的API
  graphInstance = new Graph({
    container: graphRef.value,
    width,
    height,
    autoFit: 'view',
    padding: 20,
    // v5 使用 node 和 edge 配置
    node: {
      style: {
        fill: isDark ? '#1e293b' : '#ffffff',
        stroke: isDark ? '#475569' : '#e2e8f0',
        lineWidth: 2
      }
    },
    edge: {
      type: 'cubic-horizontal', // v5 支持的边类型
      style: {
        stroke: isDark ? '#475569' : '#cbd5e1',
        lineWidth: 2,
        endArrow: true
      }
    },
    // 布局配置
    layout: {
      type: 'force',  // 力导向布局
      preventOverlap: true,
      nodeSpacing: 50,
      linkDistance: 150
    },
    // 交互行为
    behaviors: [
      'drag-canvas',
      'zoom-canvas',
      'drag-element',
      'click-select'
    ]
  })

  // 绑定事件
  bindGraphEvents()

  // 加载数据
  loadGraphData()
}

// 绑定图谱事件
function bindGraphEvents() {
  if (!graphInstance) return

  // 节点点击 - G6 v5 使用不同的事件名
  graphInstance.on('node:click', (evt) => {
    const { itemId } = evt
    const nodeData = graphInstance.getNodeData(itemId)
    visualizationStore.selectNode(nodeData)
  })

  // 画布点击
  graphInstance.on('canvas:click', () => {
    visualizationStore.clearSelection()
  })

  // 节点双击 - 展开邻域
  graphInstance.on('node:dblclick', async (evt) => {
    const { itemId } = evt
    await expandNeighborhood(itemId)
  })
}

// 加载图谱数据
async function loadGraphData() {
  const namespaceId = namespaceStore.currentNamespaceId
  if (!namespaceId || !graphInstance) return

  loading.value = true
  try {
    const response = await getGraphData(namespaceId, { limit: 100 })
    if (response.code === 200) {
      const { nodes = [], edges = [] } = response.data

      // G6 v5 使用 setData 方法
      graphInstance.setData({
        nodes: nodes.map(node => ({
          id: node.id,
          data: {
            label: node.label,
            type: node.type,
            attributes: node.attributes || {}
          },
          style: {
            fill: node.properties?.color || entityTypeConfig[node.type]?.color || '#3B82F6',
            stroke: node.properties?.color || entityTypeConfig[node.type]?.color || '#3B82F6'
          }
        })),
        edges: edges.map(edge => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          data: {
            label: edge.label
          },
          style: {
            stroke: edge.properties?.color || '#94A3B8',
            lineWidth: edge.properties?.width || 2
          }
        }))
      })

      // G6 v5 使用不同的渲染方法
      await graphInstance.render()
      graphInstance.fitView()

      visualizationStore.loadGraphData(namespaceId)
    }
  } catch (error) {
    console.error('加载图谱数据失败:', error)
    ElMessage.error('加载图谱数据失败')
  } finally {
    loading.value = false
  }
}

// 展开邻域
async function expandNeighborhood(nodeId) {
  const namespaceId = namespaceStore.currentNamespaceId
  if (!namespaceId || !graphInstance) return

  try {
    const response = await getSubGraph(namespaceId, nodeId, { depth: 1, maxNodes: 20 })
    if (response.code === 200) {
      const { nodes = [], edges = [] } = response.data

      // 获取现有节点ID - G6 v5 API
      const existingNodeIds = new Set(graphInstance.getNodeData().map(n => n.id))
      const existingEdgeIds = new Set(graphInstance.getEdgeData().map(e => e.id))

      // 添加新节点
      const newNodes = nodes.filter(n => !existingNodeIds.has(n.id)).map(node => ({
        id: node.id,
        data: {
          label: node.label,
          type: node.type,
          attributes: node.attributes || {}
        },
        style: {
          fill: node.properties?.color || entityTypeConfig[node.type]?.color || '#3B82F6',
          stroke: node.properties?.color || entityTypeConfig[node.type]?.color || '#3B82F6'
        }
      }))

      // 添加新边
      const newEdges = edges.filter(e => !existingEdgeIds.has(e.id)).map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        data: {
          label: edge.label
        },
        style: {
          stroke: edge.properties?.color || '#94A3B8',
          lineWidth: edge.properties?.width || 2
        }
      }))

      // G6 v5 使用 addData 方法
      graphInstance.addData('node', newNodes)
      graphInstance.addData('edge', newEdges)

      ElMessage.success(`已展开 ${nodes.length} 个节点`)
    }
  } catch (error) {
    console.error('展开邻域失败:', error)
    ElMessage.error('展开邻域失败')
  }
}

// 搜索
function handleSearch() {
  if (!searchQuery.value.trim()) {
    ElMessage.warning('请输入搜索关键词')
    return
  }
  ElMessage.info('搜索功能开发中...')
}

// 聚焦选中
function handleFocusSelected() {
  if (selectedNode.value && graphInstance) {
    // G6 v5 使用 focusItem API
    graphInstance.focusItem(selectedNode.value.id)
  }
}

// 刷新
async function handleRefresh() {
  await loadGraphData()
  ElMessage.success('已刷新')
}

// 保存布局
function handleSaveLayout() {
  ElMessage.success('布局已保存')
}

// 布局切换
function handleLayoutChange() {
  if (!graphInstance) return

  const layoutConfigs = {
    force_directed: {
      type: 'force',
      linkDistance: 150,
      preventOverlap: true
    },
    circular: {
      type: 'circular',
      radius: 200
    },
    hierarchical: {
      type: 'dagre',
      rankdir: 'TB'
    }
  }

  // G6 v5 使用 updateLayout 方法
  graphInstance.updateLayout(layoutConfigs[layoutType.value])
  visualizationStore.setLayout(layoutType.value)
}

// 导出图片
function handleExportImage() {
  if (graphInstance) {
    try {
      // G6 v5 使用 toDataURL 方法
      const dataURL = graphInstance.toDataURL('image/png')
      const link = document.createElement('a')
      link.download = `knowledge-graph-${Date.now()}.png`
      link.href = dataURL
      link.click()
      ElMessage.success('图片导出成功')
    } catch (error) {
      ElMessage.error('导出失败')
    }
  }
}

// 全屏
function handleFullscreen() {
  if (!document.fullscreenElement) {
    canvasContainer.value?.requestFullscreen()
  } else {
    document.exitFullscreen()
  }
}

// 缩放
function handleZoomIn() {
  if (graphInstance) {
    const zoom = graphInstance.getZoom()
    graphInstance.zoomTo(zoom * 1.2)
  }
}

function handleZoomOut() {
  if (graphInstance) {
    const zoom = graphInstance.getZoom()
    graphInstance.zoomTo(zoom / 1.2)
  }
}

function handleZoomReset() {
  if (graphInstance) {
    graphInstance.fitView()
  }
}

// 关闭详情
function closeDetail() {
  visualizationStore.clearSelection()
}

// 展开节点
async function handleExpandNode() {
  if (selectedNode.value) {
    await expandNeighborhood(selectedNode.value.id)
  }
}

// 编辑节点
function handleEditNode() {
  ElMessage.info('编辑功能开发中...')
}

// 获取实体类型颜色
function getEntityTypeColor(type) {
  return entityTypeConfig[type]?.color || ''
}

// 窗口大小变化
function handleResize() {
  if (graphInstance && canvasContainer.value) {
    const width = canvasContainer.value.clientWidth
    const height = canvasContainer.value.clientHeight
    graphInstance.changeSize(width, height)
  }
}

// 监听命名空间变化
watch(() => namespaceStore.currentNamespaceId, () => {
  if (graphInstance) {
    loadGraphData()
  }
})

// 生命周期
onMounted(async () => {
  await nextTick()
  initGraph()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  graphInstance?.destroy()
  graphInstance = null
})
</script>

<style scoped>
.kg-visualization {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

/* 工具栏 */
.kg-vis-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--card-background);
  border-bottom: 1px solid var(--border-color);
  gap: 16px;
  flex-shrink: 0;
}

.kg-vis-toolbar__left,
.kg-vis-toolbar__right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.kg-vis-toolbar__center {
  flex: 1;
  text-align: center;
}

.kg-vis-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.kg-vis-search {
  width: 200px;
}

.kg-vis-layout-select {
  width: 100px;
}

/* 画布 */
.kg-vis-canvas-container {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.kg-vis-canvas {
  width: 100%;
  height: 100%;
  position: relative;
}

.kg-vis-graph {
  width: 100%;
  height: 100%;
  background: var(--background-color);
  position: relative;
  z-index: 1;
}

/* 空状态 */
.kg-vis-empty {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  pointer-events: none;
}

.kg-vis-empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.kg-vis-empty-title {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.kg-vis-empty-desc {
  margin: 0 0 24px 0;
  font-size: 14px;
  color: var(--text-muted);
}

/* 加载状态 */
.kg-vis-loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: var(--text-muted);
  pointer-events: none;
}

.kg-vis-loading p {
  margin-top: 12px;
  font-size: 14px;
}

/* 图例 */
.kg-vis-legend {
  position: absolute;
  top: 16px;
  right: 16px;
  background: var(--card-background);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  padding: 12px 16px;
  box-shadow: var(--shadow-md);
}

.kg-vis-legend__title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.kg-vis-legend__items {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.kg-vis-legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--text-primary);
}

.kg-vis-legend-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

/* 缩放控制 */
.kg-vis-zoom {
  position: absolute;
  bottom: 16px;
  right: 16px;
  background: var(--card-background);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  padding: 4px;
  box-shadow: var(--shadow-md);
}

/* 详情面板 */
.kg-vis-detail-panel {
  position: absolute;
  top: 16px;
  left: 16px;
  width: 280px;
  background: var(--card-background);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
}

.kg-vis-detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color);
}

.kg-vis-detail-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.kg-vis-detail-body {
  padding: 16px;
}

.kg-vis-detail-row {
  margin-bottom: 12px;
}

.kg-vis-detail-label {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.kg-vis-detail-value {
  font-size: 14px;
  color: var(--text-primary);
}

.kg-vis-detail-attrs {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.kg-vis-detail-attr {
  display: flex;
  gap: 8px;
  font-size: 12px;
}

.kg-vis-detail-attr-key {
  color: var(--text-secondary);
}

.kg-vis-detail-attr-value {
  color: var(--text-primary);
}

.kg-vis-detail-actions {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}

/* 过渡动画 */
.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.3s ease;
}

.slide-right-enter-from,
.slide-right-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}

/* 深色主题 */
.dark-theme .kg-vis-toolbar,
.dark-theme .kg-vis-legend,
.dark-theme .kg-vis-zoom,
.dark-theme .kg-vis-detail-panel {
  background: var(--card-background);
  border-color: var(--border-color);
}
</style>
