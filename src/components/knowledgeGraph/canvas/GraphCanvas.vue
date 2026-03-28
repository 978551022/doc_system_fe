<template>
  <div class="kg-canvas-container">
    <!-- 工具栏 -->
    <div class="kg-canvas-toolbar">
      <div class="kg-canvas-toolbar__left">
        <el-button-group>
          <el-tooltip content="放大" placement="bottom">
            <el-button size="small" @click="handleZoomIn">
              <i class="el-icon-zoom-in"></i>
            </el-button>
          </el-tooltip>
          <el-tooltip content="缩小" placement="bottom">
            <el-button size="small" @click="handleZoomOut">
              <i class="el-icon-zoom-out"></i>
            </el-button>
          </el-tooltip>
          <el-tooltip content="适应屏幕" placement="bottom">
            <el-button size="small" @click="handleFitView">
              <i class="el-icon-full-screen"></i>
            </el-button>
          </el-tooltip>
        </el-button-group>

        <el-divider direction="vertical" />

        <el-select
          v-model="currentLayout"
          size="small"
          style="width: 100px"
          @change="handleLayoutChange"
        >
          <el-option label="力导向" value="force" />
          <el-option label="环形" value="circular" />
          <el-option label="辐射" value="radial" />
          <el-option label="层次" value="dagre" />
        </el-select>
      </div>

      <div class="kg-canvas-toolbar__center">
        <span v-if="currentNamespace" class="kg-canvas-title">
          {{ currentNamespace.name }}
        </span>
        <span v-else class="kg-canvas-title">请选择知识图谱</span>
      </div>

      <div class="kg-canvas-toolbar__right">
        <el-tooltip content="小地图" placement="bottom">
          <el-button
            size="small"
            :type="showMinimap ? 'primary' : ''"
            @click="toggleMinimap"
          >
            <i class="el-icon-map-location"></i>
          </el-button>
        </el-tooltip>
        <el-tooltip content="网格" placement="bottom">
          <el-button
            size="small"
            :type="showGrid ? 'primary' : ''"
            @click="toggleGrid"
          >
            <i class="el-icon-grid"></i>
          </el-button>
        </el-tooltip>
        <el-tooltip content="导出图片" placement="bottom">
          <el-button size="small" @click="handleExportImage">
            <i class="el-icon-download"></i>
          </el-button>
        </el-tooltip>
        <el-tooltip content="全屏" placement="bottom">
          <el-button size="small" @click="handleFullscreen">
            <i class="el-icon-rank"></i>
          </el-button>
        </el-tooltip>
      </div>
    </div>

    <!-- 画布容器 -->
    <div class="kg-canvas-wrapper">
      <div
        ref="canvasRef"
        class="kg-canvas"
        :class="{ 'kg-canvas--fullscreen': isFullscreen }"
      >
        <!-- G6 渲染容器 -->
        <div ref="graphRef" class="kg-canvas__graph"></div>

        <!-- 空状态 -->
        <div v-if="isGraphEmpty && !loading" class="kg-canvas__empty">
          <div class="kg-canvas__empty-icon">📊</div>
          <h3 class="kg-canvas__empty-title">暂无图谱数据</h3>
          <p class="kg-canvas__empty-desc">
            {{ currentNamespace ? '该图谱还没有数据' : '请从左侧选择一个知识图谱' }}
          </p>
          <el-button v-if="currentNamespace" type="primary" @click="$emit('load-data')">
            <i class="el-icon-refresh"></i> 加载数据
          </el-button>
        </div>

        <!-- 加载状态 -->
        <div v-if="loading" class="kg-canvas__loading">
          <el-icon class="is-loading" :size="32">
            <Loading />
          </el-icon>
          <p>加载中...</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { Loading } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { Graph } from '@antv/g6'
import { knowledgeGraphStore } from '../../../stores/knowledgeGraphStore.js'
import { getG6Theme } from '../../../utils/knowledgeGraph/graphConstants.js'

const props = defineProps({
  namespaceId: {
    type: Number,
    default: null
  }
})

const emit = defineEmits(['node-click', 'edge-click', 'canvas-click'])

// DOM引用
const canvasRef = ref(null)
const graphRef = ref(null)

// 状态
const graph = ref(null)
const isFullscreen = ref(false)
const showMinimap = ref(true)
const showGrid = ref(true)

// 从store获取状态
const currentNamespace = computed(() => knowledgeGraphStore.currentNamespace)
const graphNodes = computed(() => knowledgeGraphStore.graphNodes)
const graphEdges = computed(() => knowledgeGraphStore.graphEdges)
const loading = computed(() => knowledgeGraphStore.loading)
const isGraphEmpty = computed(() => knowledgeGraphStore.isGraphEmpty)
const currentLayout = computed({
  get: () => knowledgeGraphStore.currentLayout,
  set: (val) => knowledgeGraphStore.setLayout(val)
})

// 初始化G6图谱
function initGraph() {
  if (!graphRef.value || graph.value) return

  const isDark = document.body.classList.contains('dark-theme')
  const theme = getG6Theme(isDark)

  const width = canvasRef.value?.clientWidth || 800
  const height = canvasRef.value?.clientHeight || 600

  graph.value = new Graph({
    container: graphRef.value,
    width,
    height,
    fitView: true,
    fitViewPadding: 20,
    modes: {
      default: [
        'drag-canvas',
        'zoom-canvas',
        'drag-node',
        'click-select'
      ]
    },
    layout: {
      type: 'force',
      linkDistance: 150,
      nodeStrength: -5000,
      edgeStrength: 0.1,
      preventNodeOverlap: true,
      nodeSpacing: 50
    },
    defaultNode: {
      type: 'circle',
      size: 30,
      style: {
        fill: theme.node.fill,
        stroke: theme.node.stroke,
        lineWidth: theme.node.lineWidth,
        fillOpacity: theme.node.fillOpacity
      }
    },
    defaultEdge: {
      type: 'quadratic',
      style: {
        stroke: theme.edge.stroke,
        lineWidth: theme.edge.lineWidth,
        strokeOpacity: theme.edge.strokeOpacity,
        endArrow: theme.edge.endArrow
      }
    },
    nodeStateStyles: {
      hover: theme.hover.node,
      selected: theme.selected.node
    },
    edgeStateStyles: {
      hover: theme.hover.edge,
      selected: theme.selected.edge
    },
    defaultNodeLabelCfg: {
      style: {
        fill: theme.text.fill,
        fontSize: theme.text.fontSize
      },
      position: 'bottom'
    },
    defaultEdgeLabelCfg: {
      style: {
        fill: theme.text.fill,
        fontSize: theme.text.fontSize - 1
      },
      refY: 5
    }
  })

  // 绑定事件
  bindGraphEvents()

  // 渲染初始数据
  if (graphNodes.value.length > 0) {
    renderGraph()
  }
}

// 绑定图谱事件
function bindGraphEvents() {
  if (!graph.value) return

  // 节点点击
  graph.value.on('node:click', (evt) => {
    const { item } = evt
    const model = item.getModel()
    emit('node-click', model)
    knowledgeGraphStore.selectEntity(model.id)
  })

  // 边点击
  graph.value.on('edge:click', (evt) => {
    const { item } = evt
    const model = item.getModel()
    emit('edge-click', model)
  })

  // 画布点击
  graph.value.on('canvas:click', () => {
    emit('canvas-click')
    knowledgeGraphStore.clearEntitySelection()
  })

  // 节点双击 - 展开邻域
  graph.value.on('node:dblclick', async (evt) => {
    const { item } = evt
    const model = item.getModel()
    try {
      await knowledgeGraphStore.expandNeighborhood(model.id, 1)
      renderGraph()
    } catch (error) {
      console.error('展开邻域失败:', error)
    }
  })

  // 节点悬停
  graph.value.on('node:mouseenter', (evt) => {
    const { item } = evt
    graph.value.setItemState(item, 'hover', true)
  })

  graph.value.on('node:mouseleave', (evt) => {
    const { item } = evt
    graph.value.setItemState(item, 'hover', false)
  })

  // 边悬停
  graph.value.on('edge:mouseenter', (evt) => {
    const { item } = evt
    graph.value.setItemState(item, 'hover', true)
  })

  graph.value.on('edge:mouseleave', (evt) => {
    const { item } = evt
    graph.value.setItemState(item, 'hover', false)
  })
}

// 渲染图谱数据
function renderGraph() {
  if (!graph.value) return

  const data = {
    nodes: graphNodes.value.map(node => ({
      id: node.id,
      label: node.label,
      data: node.data,
      style: node.style,
      size: node.size,
      type: node.type
    })),
    edges: graphEdges.value.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: edge.label,
      data: edge.data,
      style: edge.style
    }))
  }

  graph.value.data(data)
  graph.value.render()
  graph.value.fitView()
}

// 更新图谱布局
function updateLayout() {
  if (!graph.value) return

  const layoutConfigs = {
    force: {
      type: 'force',
      linkDistance: 150,
      nodeStrength: -5000,
      edgeStrength: 0.1,
      preventNodeOverlap: true,
      nodeSpacing: 50
    },
    circular: {
      type: 'circular',
      radius: 200,
      preventNodeOverlap: true
    },
    radial: {
      type: 'radial',
      unitRadius: 100,
      preventNodeOverlap: true
    },
    dagre: {
      type: 'dagre',
      rankdir: 'TB',
      nodesep: 30,
      ranksep: 50
    }
  }

  graph.value.updateLayout(layoutConfigs[currentLayout.value] || layoutConfigs.force)
}

// 工具栏操作
function handleZoomIn() {
  if (graph.value) {
    const zoom = graph.value.getZoom()
    graph.value.zoomTo(zoom * 1.2)
  }
}

function handleZoomOut() {
  if (graph.value) {
    const zoom = graph.value.getZoom()
    graph.value.zoomTo(zoom / 1.2)
  }
}

function handleFitView() {
  if (graph.value) {
    graph.value.fitView()
  }
}

function handleLayoutChange() {
  nextTick(() => {
    updateLayout()
  })
}

function toggleMinimap() {
  showMinimap.value = !showMinimap.value
  // TODO: 实现小地图显示/隐藏
}

function toggleGrid() {
  showGrid.value = !showGrid.value
  // TODO: 实现网格显示/隐藏
}

function handleExportImage() {
  if (graph.value) {
    try {
      const dataURL = graph.value.toDataURL('image/png')
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

function handleFullscreen() {
  if (!document.fullscreenElement) {
    canvasRef.value?.requestFullscreen()
    isFullscreen.value = true
  } else {
    document.exitFullscreen()
    isFullscreen.value = false
  }
}

// 监听全屏变化
function handleFullscreenChange() {
  isFullscreen.value = !!document.fullscreenElement
}

// 监听窗口大小变化
function handleResize() {
  if (graph.value && canvasRef.value) {
    const width = canvasRef.value.clientWidth
    const height = canvasRef.value.clientHeight
    graph.value.changeSize(width, height)
  }
}

// 监听主题变化
function handleThemeChange() {
  const isDark = document.body.classList.contains('dark-theme')
  const theme = getG6Theme(isDark)

  if (graph.value) {
    graph.value.updateTheme({
      style: {
        fill: theme.node.fill,
        stroke: theme.node.stroke
      }
    })
  }
}

// 监听图谱数据变化
watch([graphNodes, graphEdges], () => {
  if (graphNodes.value.length > 0) {
    renderGraph()
  }
}, { deep: true })

// 监听命名空间变化
watch(() => props.namespaceId, async (newId) => {
  if (newId && graph.value) {
    try {
      await knowledgeGraphStore.loadGraphData(newId)
      renderGraph()
    } catch (error) {
      console.error('加载图谱数据失败:', error)
    }
  }
})

// 生命周期
onMounted(async () => {
  await nextTick()
  initGraph()

  // 监听全屏变化
  document.addEventListener('fullscreenchange', handleFullscreenChange)

  // 监听窗口大小变化
  window.addEventListener('resize', handleResize)

  // 监听主题变化
  const observer = new MutationObserver(handleThemeChange)
  observer.observe(document.body, {
    attributes: true,
    attributeFilter: ['class']
  })

  // 清理
  onUnmounted(() => {
    document.removeEventListener('fullscreenchange', handleFullscreenChange)
    window.removeEventListener('resize', handleResize)
    observer.disconnect()
    if (graph.value) {
      graph.value.destroy()
      graph.value = null
    }
  })
})

onUnmounted(() => {
  if (graph.value) {
    graph.value.destroy()
    graph.value = null
  }
})

// 暴露方法
defineExpose({
  renderGraph,
  updateLayout,
  fitView: () => graph.value?.fitView(),
  getGraph: () => graph.value
})
</script>

<style scoped>
.kg-canvas-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--background-color);
}

.kg-canvas-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background: var(--card-background);
  border-bottom: 1px solid var(--border-color);
  gap: 16px;
}

.kg-canvas-toolbar__left,
.kg-canvas-toolbar__right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.kg-canvas-toolbar__center {
  flex: 1;
  text-align: center;
}

.kg-canvas-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.kg-canvas-wrapper {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.kg-canvas {
  width: 100%;
  height: 100%;
  position: relative;
}

.kg-canvas--fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
}

.kg-canvas__graph {
  width: 100%;
  height: 100%;
  background: var(--background-color);
}

.kg-canvas__empty {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  padding: 40px;
}

.kg-canvas__empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.kg-canvas__empty-title {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.kg-canvas__empty-desc {
  margin: 0 0 24px 0;
  font-size: 14px;
  color: var(--text-muted);
}

.kg-canvas__loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: var(--text-muted);
}

.kg-canvas__loading p {
  margin-top: 12px;
  font-size: 14px;
}

/* 深色主题 */
.dark-theme .kg-canvas-toolbar {
  background: var(--card-background);
  border-bottom-color: var(--border-color);
}

.dark-theme .kg-canvas__graph {
  background: var(--background-color);
}
</style>
