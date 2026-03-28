<template>
  <div class="kg-visualization" :class="{ 'kg-visualization--fullscreen': isFullscreen }">
    <!-- 工具栏 -->
    <div class="kg-vis-toolbar" :class="{ 'kg-vis-toolbar--fullscreen': isFullscreen }">
      <div class="kg-vis-toolbar__left">
        <el-input
          v-model="searchQuery"
          placeholder="搜索实体名称..."
          prefix-icon="el-icon-search"
          clearable
          @keyup.enter="handleSearch"
          @clear="handleClearSearch"
          class="kg-vis-search"
        />
        <el-button @click="handleSearch" type="primary" :loading="searching">搜索</el-button>
        <el-button @click="handleFocusSelected" :disabled="!hasSelected">
          <i class="el-icon-aim"></i> 聚焦
        </el-button>
        <el-button @click="handleRefresh">
          <i class="el-icon-refresh"></i> 刷新
        </el-button>
      </div>

      <div class="kg-vis-toolbar__center">
        <span class="kg-vis-title" v-if="namespaceStore.currentNamespace">
          {{ namespaceStore.currentNamespace.name }}
        </span>
      </div>

      <div class="kg-vis-toolbar__right">
        <el-select v-model="layoutType" @change="handleLayoutChange" class="kg-vis-layout-select">
          <el-option label="力导向" value="force" />
          <el-option label="环形" value="circular" />
          <el-option label="层次" value="dagre" />
        </el-select>

        <el-button @click="handleExportImage">
          <i class="el-icon-download"></i> 导出
        </el-button>
        <el-button @click="handleFullscreen">
          <i :class="isFullscreen ? 'el-icon-close' : 'el-icon-rank'"></i>
          {{ isFullscreen ? '退出' : '全屏' }}
        </el-button>
      </div>
    </div>

    <!-- 全屏模式下的操作提示 -->
    <div v-if="isFullscreen" class="kg-vis-fullscreen-hint">
      <span>滚轮缩放 | 拖拽画布移动 | 单击节点查看详情 | 双击节点展开邻域</span>
      <el-button size="small" text @click="handleFullscreen">
        <i class="el-icon-close"></i>
      </el-button>
    </div>

    <!-- 图谱画布 -->
    <div class="kg-vis-canvas-container" :class="{ 'kg-vis-canvas-container--fullscreen': isFullscreen }">
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

        <!-- 图例 -->
        <div class="kg-vis-legend" v-if="!isEmpty && !isFullscreen">
          <div class="kg-vis-legend__title">图例</div>
          <div class="kg-vis-legend__items">
            <div
              v-for="(config, type) in entityTypeLegend"
              :key="type"
              class="kg-vis-legend-item"
            >
              <span
                class="kg-vis-legend-color"
                :style="{ background: config.color }"
              ></span>
              <span class="kg-vis-legend-text">{{ type }}</span>
              <span class="kg-vis-legend-count">({{ config.count }})</span>
            </div>
          </div>
        </div>

        <!-- 缩放控制 -->
        <div class="kg-vis-zoom" v-if="!isFullscreen">
          <el-button-group>
            <el-button size="small" @click="handleZoomIn" title="放大">
              <i class="el-icon-zoom-in"></i>
            </el-button>
            <el-button size="small" @click="handleZoomReset" title="重置">
              <i class="el-icon-full-screen"></i>
            </el-button>
            <el-button size="small" @click="handleZoomOut" title="缩小">
              <i class="el-icon-zoom-out"></i>
            </el-button>
          </el-button-group>
        </div>

        <!-- 全屏模式下的控制面板 -->
        <div v-if="isFullscreen" class="kg-vis-fullscreen-controls">
          <el-button-group>
            <el-button size="small" @click="handleZoomIn" circle>
              <i class="el-icon-plus"></i>
            </el-button>
            <el-button size="small" @click="handleZoomReset" circle>
              <i class="el-icon-refresh-right"></i>
            </el-button>
            <el-button size="small" @click="handleZoomOut" circle>
              <i class="el-icon-minus"></i>
            </el-button>
          </el-button-group>
        </div>
      </div>
    </div>

    <!-- 选中节点详情弹窗 -->
    <el-dialog
      v-model="detailVisible"
      title="节点详情"
      width="400px"
      :close-on-click-modal="true"
      class="kg-vis-detail-dialog"
    >
      <div v-if="selectedNode" class="kg-vis-detail-content">
        <div class="kg-vis-detail-header-inline">
          <div class="kg-vis-detail-icon" :style="{ background: getEntityTypeColor(selectedNode.type) }">
            {{ getEntityTypeIcon(selectedNode.type) }}
          </div>
          <div class="kg-vis-detail-title">
            <h3>{{ selectedNode.label || selectedNode.id }}</h3>
            <el-tag size="small" :color="getEntityTypeColor(selectedNode.type)">
              {{ selectedNode.type }}
            </el-tag>
          </div>
        </div>

        <el-divider />

        <div class="kg-vis-detail-section" v-if="selectedNode.attributes && Object.keys(selectedNode.attributes).length > 0">
          <h4>属性</h4>
          <div class="kg-vis-detail-attrs">
            <div
              v-for="(value, key) in selectedNode.attributes"
              :key="key"
              class="kg-vis-detail-attr-item"
            >
              <span class="kg-vis-detail-attr-key">{{ key }}:</span>
              <span class="kg-vis-detail-attr-value">{{ value }}</span>
            </div>
          </div>
        </div>

        <div class="kg-vis-detail-section">
          <h4>连接统计</h4>
          <div class="kg-vis-detail-stats">
            <span>关联关系: {{ getNodeRelationCount(selectedNode.id) }}</span>
          </div>
        </div>
      </div>

      <template #footer>
        <el-button @click="closeDetail">关闭</el-button>
        <el-button type="primary" @click="handleExpandNode">
          <i class="el-icon-plus"></i> 展开邻域
        </el-button>
      </template>
    </el-dialog>
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
let graphInstance = null
const searchQuery = ref('')
const layoutType = ref('force')
const loading = ref(false)
const searching = ref(false)
const isFullscreen = ref(false)
const detailVisible = ref(false)

// 实体类型配置
const entityTypeConfig = {
  'Person': { color: '#3B82F6', icon: '👤' },
  'Organization': { color: '#10B981', icon: '🏢' },
  'Location': { color: '#F59E0B', icon: '📍' },
  'Concept': { color: '#8B5CF6', icon: '💡' },
  'Event': { color: '#EF4444', icon: '📅' },
  'Document': { color: '#6B7280', icon: '📄' },
  'Technology': { color: '#06B6D4', icon: '⚙️' },
  'Product': { color: '#EC4899', icon: '📦' }
}

// 中文类型映射
const chineseTypeMap = {
  'Person': '人物',
  'Organization': '组织',
  'Location': '地点',
  'Concept': '概念',
  'Event': '事件',
  'Document': '文档',
  'Technology': '技术',
  'Product': '产品'
}

// 计算属性
const selectedNode = computed(() => visualizationStore.selectedNode)
const hasSelected = computed(() => !!selectedNode.value)
const isEmpty = computed(() => visualizationStore.isGraphEmpty)

// 实体类型图例（动态生成）
const entityTypeLegend = computed(() => {
  const distribution = visualizationStore.entityTypeDistribution
  const legend = {}
  Object.entries(distribution).forEach(([type, count]) => {
    const config = entityTypeConfig[type] || { color: '#94A3B8', icon: '📦' }
    legend[chineseTypeMap[type] || type] = {
      color: config.color,
      count: count
    }
  })
  return legend
})

// 初始化图谱
function initGraph() {
  if (!graphRef.value || graphInstance) return

  const isDark = document.body.classList.contains('dark-theme')
  const width = canvasContainer.value?.clientWidth || 800
  const height = canvasContainer.value?.clientHeight || 600

  graphInstance = new Graph({
    container: graphRef.value,
    width,
    height,
    autoFit: 'view',
    padding: 40,
    node: {
      style: {
        fill: isDark ? '#1e293b' : '#ffffff',
        stroke: isDark ? '#475569' : '#e2e8f0',
        lineWidth: 2,
        size: 30
      },
      // 配置标签显示
      label: {
        style: {
          fill: isDark ? '#e2e8f0' : '#1e293b',
          fontSize: 12
        }
      }
    },
    edge: {
      type: 'cubic-horizontal',
      style: {
        stroke: isDark ? '#475569' : '#cbd5e1',
        lineWidth: 2,
        endArrow: true
      }
    },
    layout: {
      type: 'force',
      preventOverlap: true,
      nodeSpacing: 60,
      linkDistance: 150
    },
    behaviors: [
      'drag-canvas',
      'zoom-canvas',
      'drag-element',
      'click-select'
    ]
  })

  bindGraphEvents()
  loadGraphData()
}

// 绑定图谱事件
function bindGraphEvents() {
  if (!graphInstance) return

  // 节点点击 - 单击即可展示详情
  graphInstance.on('node:click', (evt) => {
    const { itemId } = evt
    const nodeData = graphInstance.getNodeData(itemId)
    visualizationStore.selectNode(nodeData)
    detailVisible.value = true
  })

  // 画布点击 - 清除选择
  graphInstance.on('canvas:click', () => {
    visualizationStore.clearSelection()
    detailVisible.value = false
  })

  // 节点双击 - 展开邻域
  graphInstance.on('node:dblclick', async (evt) => {
    const { itemId } = evt
    await expandNeighborhood(itemId)
  })

  // 监听节点悬停
  graphInstance.on('node:mouseenter', (evt) => {
    const { itemId } = evt
    graphInstance.setItemState(itemId, 'hover', true)
  })

  graphInstance.on('node:mouseleave', (evt) => {
    const { itemId } = evt
    graphInstance.setItemState(itemId, 'hover', false)
  })
}

// 加载图谱数据
async function loadGraphData() {
  const namespaceId = namespaceStore.currentNamespaceId
  if (!namespaceId || !graphInstance) return

  loading.value = true
  try {
    const response = await getGraphData(namespaceId, { limit: 200 })
    if (response.code === 200) {
      const { nodes = [], edges = [] } = response.data

      if (nodes.length === 0) {
        visualizationStore.clearGraphData()
        return
      }

      // 转换节点数据，确保标签显示
      const g6Nodes = nodes.map(node => {
        const type = node.type || 'Unknown'
        const config = entityTypeConfig[type] || { color: '#3B82F6' }
        return {
          id: node.id,
          data: {
            label: node.label || node.id,
            type: type,
            attributes: node.attributes || {},
            // 添加label属性用于显示
            name: node.label || node.id
          },
          style: {
            fill: config.color,
            stroke: config.color,
            size: node.properties?.size || 35,
            // 配置 halo 效果
            halo: false
          }
        }
      })

      const g6Edges = edges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        data: {
          label: edge.label || ''
        },
        style: {
          stroke: edge.properties?.color || '#94A3B8',
          lineWidth: edge.properties?.width || 2
        }
      }))

      graphInstance.setData({
        nodes: g6Nodes,
        edges: g6Edges
      })

      await graphInstance.render()
      graphInstance.fitView(20)

      // 更新 store 中的数据
      visualizationStore.loadGraphData(namespaceId, 200)
    }
  } catch (error) {
    console.error('加载图谱数据失败:', error)
    ElMessage.error('加载图谱数据失败: ' + (error.message || '未知错误'))
  } finally {
    loading.value = false
  }
}

// 展开邻域
async function expandNeighborhood(nodeId) {
  const namespaceId = namespaceStore.currentNamespaceId
  if (!namespaceId || !graphInstance) return

  try {
    const response = await getSubGraph(namespaceId, nodeId, { depth: 1, max_nodes: 50 })
    if (response.code === 200) {
      const { nodes = [], edges = [] } = response.data

      const allNodeData = graphInstance.getNodeData()
      const allEdgeData = graphInstance.getEdgeData()
      const existingNodeIds = new Set(allNodeData.map(n => n.id))
      const existingEdgeIds = new Set(allEdgeData.map(e => e.id))

      const newNodes = nodes.filter(n => !existingNodeIds.has(n.id)).map(node => {
        const type = node.type || 'Unknown'
        const config = entityTypeConfig[type] || { color: '#3B82F6' }
        return {
          id: node.id,
          data: {
            label: node.label || node.id,
            type: type,
            attributes: node.attributes || {},
            name: node.label || node.id
          },
          style: {
            fill: config.color,
            stroke: config.color
          }
        }
      })

      const newEdges = edges.filter(e => !existingEdgeIds.has(e.id)).map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        data: {
          label: edge.label || ''
        },
        style: {
          stroke: edge.properties?.color || '#94A3B8',
          lineWidth: edge.properties?.width || 2
        }
      }))

      if (newNodes.length > 0) {
        graphInstance.addData('node', newNodes)
      }
      if (newEdges.length > 0) {
        graphInstance.addData('edge', newEdges)
      }

      ElMessage.success(`已展开 ${newNodes.length} 个新节点`)
    }
  } catch (error) {
    console.error('展开邻域失败:', error)
    ElMessage.error('展开邻域失败')
  }
}

// 搜索实体
async function handleSearch() {
  const query = searchQuery.value.trim()
  if (!query) {
    ElMessage.warning('请输入搜索关键词')
    return
  }

  if (!graphInstance) return

  searching.value = true
  try {
    const allNodes = graphInstance.getNodeData()
    const matchedNodes = allNodes.filter(node => {
      const label = node.data?.label || node.data?.name || node.id || ''
      return label.toLowerCase().includes(query.toLowerCase())
    })

    if (matchedNodes.length === 0) {
      ElMessage.warning('未找到匹配的实体')
      return
    }

    // 高亮匹配的节点
    graphInstance.setItemState(allNodes.map(n => n.id), 'inactive', true)

    matchedNodes.forEach(node => {
      graphInstance.setItemState(node.id, 'inactive', false)
      graphInstance.setItemState(node.id, 'highlight', true)
    })

    // 高亮相关边
    const allEdges = graphInstance.getEdgeData()
    const matchedNodeIds = new Set(matchedNodes.map(n => n.id))
    const relatedEdges = allEdges.filter(edge =>
      matchedNodeIds.has(edge.source) || matchedNodeIds.has(edge.target)
    )

    allEdges.forEach(edge => {
      const isRelated = matchedNodeIds.has(edge.source) || matchedNodeIds.has(edge.target)
      graphInstance.setItemState(edge.id, 'inactive', !isRelated)
    })

    // 聚焦到第一个匹配节点
    if (matchedNodes.length > 0) {
      graphInstance.focusItem(matchedNodes[0].id)
    }

    ElMessage.success(`找到 ${matchedNodes.length} 个匹配实体`)

    // 3秒后恢复高亮状态
    setTimeout(() => {
      allNodes.forEach(node => {
        graphInstance.setItemState(node.id, 'inactive', false)
        graphInstance.setItemState(node.id, 'highlight', false)
      })
      allEdges.forEach(edge => {
        graphInstance.setItemState(edge.id, 'inactive', false)
      })
    }, 3000)
  } catch (error) {
    console.error('搜索失败:', error)
    ElMessage.error('搜索失败')
  } finally {
    searching.value = false
  }
}

// 清除搜索
function handleClearSearch() {
  if (!graphInstance) return

  const allNodes = graphInstance.getNodeData()
  const allEdges = graphInstance.getEdgeData()

  allNodes.forEach(node => {
    graphInstance.setItemState(node.id, 'inactive', false)
    graphInstance.setItemState(node.id, 'highlight', false)
  })

  allEdges.forEach(edge => {
    graphInstance.setItemState(edge.id, 'inactive', false)
  })
}

// 聚焦选中
function handleFocusSelected() {
  if (selectedNode.value && graphInstance) {
    graphInstance.focusItem(selectedNode.value.id)
    detailVisible.value = true
  }
}

// 刷新
async function handleRefresh() {
  await loadGraphData()
  ElMessage.success('已刷新')
}

// 布局切换 - G6 v5 使用 layout() 方法而不是 updateLayout()
async function handleLayoutChange() {
  if (!graphInstance) return

  const layoutConfigs = {
    force: {
      type: 'force',
      linkDistance: 150,
      preventOverlap: true,
      nodeSpacing: 60
    },
    circular: {
      type: 'circular',
      radius: 200,
      preventOverlap: true
    },
    dagre: {
      type: 'dagre',
      rankdir: 'TB',
      nodesep: 50,
      ranksep: 100
    }
  }

  try {
    // G6 v5 使用 layout() 方法
    await graphInstance.layout(layoutConfigs[layoutType.value])
    visualizationStore.setLayout(layoutType.value)
    ElMessage.success(`已切换到${layoutType.value === 'force' ? '力导向' : layoutType.value === 'circular' ? '环形' : '层次'}布局`)
  } catch (error) {
    console.error('布局切换失败:', error)
    ElMessage.error('布局切换失败')
  }
}

// 导出图片
function handleExportImage() {
  if (graphInstance) {
    try {
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
  isFullscreen.value = !isFullscreen.value
  if (isFullscreen.value) {
    if (canvasContainer.value) {
      canvasContainer.value.requestFullscreen().catch(err => {
        console.log('全屏失败，使用容器全屏模式:', err)
      })
    }
  } else {
    if (document.fullscreenElement) {
      document.exitFullscreen()
    }
  }

  // 延迟调整画布大小
  nextTick(() => {
    setTimeout(() => {
      handleResize()
    }, 100)
  })
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
    graphInstance.fitView(20)
  }
}

// 关闭详情
function closeDetail() {
  detailVisible.value = false
  visualizationStore.clearSelection()
}

// 展开节点
async function handleExpandNode() {
  if (selectedNode.value) {
    await expandNeighborhood(selectedNode.value.id)
    closeDetail()
  }
}

// 获取实体类型颜色
function getEntityTypeColor(type) {
  const config = entityTypeConfig[type] || { color: '#94A3B8' }
  return config.color
}

// 获取实体类型图标
function getEntityTypeIcon(type) {
  const config = entityTypeConfig[type] || { icon: '📦' }
  return config.icon
}

// 获取节点关系数量
function getNodeRelationCount(nodeId) {
  if (!graphInstance) return 0
  const edges = graphInstance.getEdgeData()
  return edges.filter(e => e.source === nodeId || e.target === nodeId).length
}

// 窗口大小变化 - 确保全屏时canvas充满整个屏幕
function handleResize() {
  if (graphInstance && canvasContainer.value) {
    // 全屏模式下使用 window 尺寸，否则使用容器尺寸
    const width = isFullscreen.value ? window.innerWidth : canvasContainer.value.clientWidth
    const height = isFullscreen.value ? window.innerHeight : canvasContainer.value.clientHeight
    graphInstance.changeSize(width, height)
    // 重新渲染以确保正确显示
    setTimeout(() => {
      graphInstance.fitView(20)
    }, 50)
  }
}

// 监听命名空间变化
watch(() => namespaceStore.currentNamespaceId, (newId, oldId) => {
  if (newId && newId !== oldId && graphInstance) {
    visualizationStore.clearSelection()
    detailVisible.value = false
    loadGraphData()
  }
})

// 监听全屏变化
watch(isFullscreen, () => {
  nextTick(() => {
    handleResize()
  })
})

// 监听详情弹窗关闭
watch(detailVisible, (val) => {
  if (!val) {
    visualizationStore.clearSelection()
  }
})

// 生命周期
onMounted(async () => {
  await nextTick()
  initGraph()
  window.addEventListener('resize', handleResize)

  // 监听全屏变化事件
  document.addEventListener('fullscreenchange', () => {
    isFullscreen.value = !!document.fullscreenElement
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  document.removeEventListener('fullscreenchange', () => {})
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
  position: relative;
}

.kg-visualization--fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  background: var(--background-color);
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
  z-index: 100;
}

.kg-vis-toolbar--fullscreen {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
}

.dark-theme .kg-vis-toolbar--fullscreen {
  background: rgba(15, 23, 42, 0.95);
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
  width: 220px;
}

.kg-vis-layout-select {
  width: 100px;
}

/* 全屏提示 */
.kg-vis-fullscreen-hint {
  position: absolute;
  top: 60px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 999;
  pointer-events: auto;
}

/* 画布 */
.kg-vis-canvas-container {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.kg-vis-canvas-container--fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9998;
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

/* 确保全屏时canvas容器下的图表元素充满整个屏幕 */
.kg-visualization--fullscreen .kg-vis-canvas {
  width: 100vw;
  height: 100vh;
}

.kg-visualization--fullscreen .kg-vis-graph {
  width: 100vw !important;
  height: 100vh !important;
}

/* 覆盖G6生成的canvas样式 */
.kg-visualization--fullscreen :deep(canvas) {
  width: 100% !important;
  height: 100% !important;
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
  z-index: 10;
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
  z-index: 50;
  max-height: 300px;
  overflow-y: auto;
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
  flex-shrink: 0;
}

.kg-vis-legend-count {
  color: var(--text-muted);
  font-size: 11px;
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
  z-index: 50;
}

/* 全屏控制面板 */
.kg-vis-fullscreen-controls {
  position: absolute;
  bottom: 24px;
  right: 24px;
  z-index: 1000;
  background: rgba(255, 255, 255, 0.9);
  padding: 8px;
  border-radius: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.dark-theme .kg-vis-fullscreen-controls {
  background: rgba(30, 41, 59, 0.9);
}

/* 详情弹窗样式 */
.kg-vis-detail-dialog :deep(.el-dialog__body) {
  padding: 16px 20px;
  max-height: 60vh;
  overflow-y: auto;
}

.kg-vis-detail-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.kg-vis-detail-header-inline {
  display: flex;
  align-items: center;
  gap: 16px;
}

.kg-vis-detail-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  flex-shrink: 0;
}

.kg-vis-detail-title h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  color: var(--text-primary);
}

.kg-vis-detail-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.kg-vis-detail-section h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
}

.kg-vis-detail-attrs {
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: var(--surface-color);
  padding: 12px;
  border-radius: var(--radius-sm);
}

.kg-vis-detail-attr-item {
  display: flex;
  gap: 8px;
  font-size: 13px;
}

.kg-vis-detail-attr-key {
  color: var(--text-secondary);
  min-width: 80px;
  flex-shrink: 0;
}

.kg-vis-detail-attr-value {
  color: var(--text-primary);
  word-break: break-all;
}

.kg-vis-detail-stats {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: var(--text-secondary);
}

/* 深色主题 */
.dark-theme .kg-vis-toolbar,
.dark-theme .kg-vis-legend,
.dark-theme .kg-vis-zoom {
  background: var(--card-background);
  border-color: var(--border-color);
}

/* G6 节点标签样式增强 */
:deep(.g6-node-label) {
  font-size: 12px !important;
  font-weight: 500 !important;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  pointer-events: none;
}

:deep(.g6-node-highlight) {
  filter: drop-shadow(0 0 8px rgba(59, 130, 246, 0.6));
}

:deep(.g6-node-inactive) {
  opacity: 0.3;
}

:deep(.g6-edge-inactive) {
  opacity: 0.2;
}
</style>
