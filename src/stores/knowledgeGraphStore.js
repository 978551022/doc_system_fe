/**
 * 知识图谱状态管理
 * 使用 Vue 3 Composition API 风格的状态管理
 */

import { ref, computed, watch } from 'vue'
import {
  getNamespaceList,
  getNamespaceStats,
  getGraphData,
  getSubGraph,
  getNodeNeighborhood,
  getEntityDetail,
  searchEntities,
  getEntityPath,
  createNamespace,
  deleteNamespace as deleteNamespaceApi
} from '../api/knowledgeGraph.js'
import { GraphLayout, GraphViewMode, generateG6Node, generateG6Edge } from '../utils/knowledgeGraph/graphConstants.js'

// ==================== 状态定义 ====================

// 命名空间相关
const namespaces = ref([])
const currentNamespace = ref(null)
const namespaceStats = ref(null)

// 图谱数据
const graphNodes = ref([])
const graphEdges = ref([])
const nodeDegreeMap = ref(new Map())

// 选中的实体
const selectedEntity = ref(null)
const hoveredEntity = ref(null)
const selectedEdge = ref(null)

// UI状态
const loading = ref(false)
const sidebarOpen = ref(true)
const detailPanelOpen = ref(false)
const statsPanelOpen = ref(true)
const pathExplorerOpen = ref(false)
const canvasMode = ref(GraphViewMode.VIEW)
const currentLayout = ref(GraphLayout.FORCE)

// 图谱配置
const graphConfig = ref({
  nodeLabelVisible: true,
  edgeLabelVisible: false,
  showMinimap: true,
  showGrid: true,
  enablePhysics: true
})

// 搜索状态
const searchQuery = ref('')
const searchResults = ref([])

// 路径探索
const pathSourceEntity = ref(null)
const pathTargetEntity = ref(null)
const pathResults = ref([])

// 历史记录
const viewHistory = ref([])
const historyIndex = ref(-1)

// ==================== 计算属性 ====================

// 当前命名空间的ID
const currentNamespaceId = computed(() => currentNamespace.value?.id)

// 图谱是否为空
const isGraphEmpty = computed(() => graphNodes.value.length === 0)

// 选中的节点数量
const selectedNodesCount = computed(() => {
  return graphNodes.value.filter(n => n.selected).length
})

// 图谱统计信息
const graphStats = computed(() => ({
  nodeCount: graphNodes.value.length,
  edgeCount: graphEdges.value.length,
  entityTypeDistribution: getEntityTypeDistribution(),
  relationTypeDistribution: getRelationTypeDistribution()
}))

// ==================== 工具函数 ====================

function getEntityTypeDistribution() {
  const distribution = {}
  graphNodes.value.forEach(node => {
    const type = node.data?.type || 'Unknown'
    distribution[type] = (distribution[type] || 0) + 1
  })
  return distribution
}

function getRelationTypeDistribution() {
  const distribution = {}
  graphEdges.value.forEach(edge => {
    const type = edge.data?.type || 'RELATED_TO'
    distribution[type] = (distribution[type] || 0) + 1
  })
  return distribution
}

function calculateNodeDegrees() {
  const degreeMap = new Map()
  graphNodes.value.forEach(node => {
    degreeMap.set(node.id, 0)
  })
  graphEdges.value.forEach(edge => {
    degreeMap.set(edge.source, (degreeMap.get(edge.source) || 0) + 1)
    degreeMap.set(edge.target, (degreeMap.get(edge.target) || 0) + 1)
  })
  nodeDegreeMap.value = degreeMap
}

// ==================== 命名空间操作 ====================

/**
 * 加载命名空间列表
 */
async function loadNamespaces() {
  loading.value = true
  try {
    const response = await getNamespaceList()
    if (response.code === 200) {
      namespaces.value = response.data || []

      // 如果有当前命名空间，刷新其数据
      if (currentNamespace.value) {
        const updated = namespaces.value.find(n => n.id === currentNamespace.value.id)
        if (updated) {
          currentNamespace.value = updated
        }
      }
    }
  } catch (error) {
    console.error('加载命名空间列表失败:', error)
    throw error
  } finally {
    loading.value = false
  }
}

/**
 * 选择命名空间
 */
async function selectNamespace(namespaceId) {
  loading.value = true
  try {
    // 如果是同一个命名空间，不重新加载
    if (currentNamespace.value?.id === namespaceId) {
      return
    }

    const namespace = namespaces.value.find(n => n.id === namespaceId)
    if (!namespace) {
      throw new Error('命名空间不存在')
    }

    currentNamespace.value = namespace

    // 加载图谱数据
    await loadGraphData(namespaceId)

    // 加载统计数据
    await loadNamespaceStats(namespaceId)
  } catch (error) {
    console.error('选择命名空间失败:', error)
    throw error
  } finally {
    loading.value = false
  }
}

/**
 * 创建新命名空间
 */
async function createNewNamespace(data) {
  try {
    const response = await createNamespace(data)
    if (response.code === 200) {
      await loadNamespaces()
      return response.data
    }
  } catch (error) {
    console.error('创建命名空间失败:', error)
    throw error
  }
}

/**
 * 删除命名空间
 */
async function deleteNamespace(namespaceId) {
  try {
    const response = await deleteNamespaceApi(namespaceId)
    if (response.code === 200) {
      await loadNamespaces()
      if (currentNamespace.value?.id === namespaceId) {
        currentNamespace.value = null
        graphNodes.value = []
        graphEdges.value = []
      }
    }
  } catch (error) {
    console.error('删除命名空间失败:', error)
    throw error
  }
}

/**
 * 加载命名空间统计
 */
async function loadNamespaceStats(namespaceId) {
  try {
    const response = await getNamespaceStats(namespaceId)
    if (response.code === 200) {
      namespaceStats.value = response.data
    }
  } catch (error) {
    console.error('加载统计数据失败:', error)
  }
}

// ==================== 图谱数据操作 ====================

/**
 * 加载图谱数据
 */
async function loadGraphData(namespaceId, page = 1, size = 100) {
  loading.value = true
  try {
    const response = await getGraphData({ namespaceId, page, size })
    if (response.code === 200) {
      const { nodes = [], edges = [] } = response.data

      // 计算节点度数
      const degreeMap = new Map()
      edges.forEach(edge => {
        degreeMap.set(edge.source, (degreeMap.get(edge.source) || 0) + 1)
        degreeMap.set(edge.target, (degreeMap.get(edge.target) || 0) + 1)
      })

      // 转换为G6格式
      graphNodes.value = nodes.map(node =>
        generateG6Node(node, degreeMap.get(node.id) || 0)
      )
      graphEdges.value = edges.map(edge => generateG6Edge(edge))
      nodeDegreeMap.value = degreeMap

      // 保存到历史
      saveToHistory()
    }
  } catch (error) {
    console.error('加载图谱数据失败:', error)
    throw error
  } finally {
    loading.value = false
  }
}

/**
 * 加载子图（指定中心节点）
 */
async function loadSubGraph(centerEntityId, depth = 2) {
  loading.value = true
  try {
    const response = await getSubGraph({
      centerEntityId,
      depth,
      maxNodes: 50
    })
    if (response.code === 200) {
      const { nodes = [], edges = [] } = response.data

      // 合并现有节点和新节点
      const existingNodeIds = new Set(graphNodes.value.map(n => n.id))
      const existingEdgeIds = new Set(graphEdges.value.map(e => e.id))

      const newNodes = nodes
        .filter(n => !existingNodeIds.has(n.id))
        .map(n => generateG6Node(n))

      const newEdges = edges
        .filter(e => !existingEdgeIds.has(e.id))
        .map(e => generateG6Edge(e))

      graphNodes.value = [...graphNodes.value, ...newNodes]
      graphEdges.value = [...graphEdges.value, ...newEdges]

      calculateNodeDegrees()
    }
  } catch (error) {
    console.error('加载子图失败:', error)
    throw error
  } finally {
    loading.value = false
  }
}

/**
 * 展开节点邻域
 */
async function expandNeighborhood(entityId, depth = 1) {
  try {
    const response = await getNodeNeighborhood({ entityId, depth })
    if (response.code === 200) {
      const { nodes = [], edges = [] } = response.data

      // 合并新节点
      const existingNodeIds = new Set(graphNodes.value.map(n => n.id))
      const existingEdgeIds = new Set(graphEdges.value.map(e => e.id))

      const newNodes = nodes
        .filter(n => !existingNodeIds.has(n.id))
        .map(n => generateG6Node(n))

      const newEdges = edges
        .filter(e => !existingEdgeIds.has(e.id))
        .map(e => generateG6Edge(e))

      graphNodes.value = [...graphNodes.value, ...newNodes]
      graphEdges.value = [...graphEdges.value, ...newEdges]

      calculateNodeDegrees()
    }
  } catch (error) {
    console.error('展开邻域失败:', error)
    throw error
  }
}

/**
 * 清空图谱数据
 */
function clearGraphData() {
  graphNodes.value = []
  graphEdges.value = []
  nodeDegreeMap.value = new Map()
  selectedEntity.value = null
  selectedEdge.value = null
}

// ==================== 实体操作 ====================

/**
 * 选择实体
 */
async function selectEntity(entityId) {
  try {
    const response = await getEntityDetail(entityId)
    if (response.code === 200) {
      selectedEntity.value = response.data
      detailPanelOpen.value = true

      // 高亮选中节点
      graphNodes.value.forEach(node => {
        node.selected = node.id === entityId
      })
    }
  } catch (error) {
    console.error('获取实体详情失败:', error)
    throw error
  }
}

/**
 * 清除实体选择
 */
function clearEntitySelection() {
  selectedEntity.value = null
  detailPanelOpen.value = false
  graphNodes.value.forEach(node => {
    node.selected = false
  })
}

/**
 * 搜索实体
 */
async function searchEntitiesAction(query) {
  if (!query || query.trim().length === 0) {
    searchResults.value = []
    return
  }

  searchQuery.value = query
  try {
    const response = await searchEntities({
      query,
      namespaceId: currentNamespaceId.value
    })
    if (response.code === 200) {
      searchResults.value = response.data?.results || []
    }
  } catch (error) {
    console.error('搜索实体失败:', error)
    searchResults.value = []
  }
}

/**
 * 定位到实体
 */
function locateEntity(entityId) {
  const node = graphNodes.value.find(n => n.id === entityId)
  if (node) {
    selectEntity(entityId)
    return node
  }
  return null
}

// ==================== 路径探索 ====================

/**
 * 查找实体间路径
 */
async function findPath(sourceId, targetId) {
  loading.value = true
  try {
    const response = await getEntityPath({
      sourceId,
      targetId,
      maxDepth: 5
    })
    if (response.code === 200) {
      pathResults.value = response.data?.paths || []
      pathExplorerOpen.value = true
    }
  } catch (error) {
    console.error('查找路径失败:', error)
    pathResults.value = []
  } finally {
    loading.value = false
  }
}

/**
 * 设置路径探索源节点
 */
function setPathSourceEntity(entity) {
  pathSourceEntity.value = entity
  if (pathTargetEntity.value) {
    findPath(entity.id, pathTargetEntity.value.id)
  }
}

/**
 * 设置路径探索目标节点
 */
function setPathTargetEntity(entity) {
  pathTargetEntity.value = entity
  if (pathSourceEntity.value) {
    findPath(pathSourceEntity.value.id, entity.id)
  }
}

/**
 * 清除路径探索
 */
function clearPathExploration() {
  pathSourceEntity.value = null
  pathTargetEntity.value = null
  pathResults.value = []
  pathExplorerOpen.value = false
}

// ==================== UI操作 ====================

/**
 * 切换侧边栏
 */
function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value
}

/**
 * 切换详情面板
 */
function toggleDetailPanel() {
  detailPanelOpen.value = !detailPanelOpen.value
}

/**
 * 关闭详情面板
 */
function closeDetailPanel() {
  detailPanelOpen.value = false
  selectedEntity.value = null
}

/**
 * 切换统计面板
 */
function toggleStatsPanel() {
  statsPanelOpen.value = !statsPanelOpen.value
}

/**
 * 切换路径探索面板
 */
function togglePathExplorer() {
  pathExplorerOpen.value = !pathExplorerOpen.value
}

/**
 * 设置布局类型
 */
function setLayout(layout) {
  currentLayout.value = layout
}

/**
 * 切换画布模式
 */
function setCanvasMode(mode) {
  canvasMode.value = mode
}

/**
 * 更新图谱配置
 */
function updateGraphConfig(config) {
  graphConfig.value = { ...graphConfig.value, ...config }
}

// ==================== 历史记录 ====================

/**
 * 保存当前状态到历史
 */
function saveToHistory() {
  const state = {
    nodes: JSON.parse(JSON.stringify(graphNodes.value)),
    edges: JSON.parse(JSON.stringify(graphEdges.value)),
    namespaceId: currentNamespaceId.value
  }

  // 删除当前位置之后的历史
  viewHistory.value = viewHistory.value.slice(0, historyIndex.value + 1)
  viewHistory.value.push(state)
  historyIndex.value = viewHistory.value.length - 1

  // 限制历史记录数量
  if (viewHistory.value.length > 50) {
    viewHistory.value.shift()
    historyIndex.value--
  }
}

/**
 * 撤销
 */
function undo() {
  if (historyIndex.value > 0) {
    historyIndex.value--
    restoreFromHistory()
  }
}

/**
 * 重做
 */
function redo() {
  if (historyIndex.value < viewHistory.value.length - 1) {
    historyIndex.value++
    restoreFromHistory()
  }
}

/**
 * 从历史恢复
 */
function restoreFromHistory() {
  const state = viewHistory.value[historyIndex.value]
  if (state) {
    graphNodes.value = JSON.parse(JSON.stringify(state.nodes))
    graphEdges.value = JSON.parse(JSON.stringify(state.edges))
    calculateNodeDegrees()
  }
}

/**
 * 清空历史
 */
function clearHistory() {
  viewHistory.value = []
  historyIndex.value = -1
}

// ==================== 持久化 ====================

// 保存当前状态到本地存储
function saveToLocalStorage() {
  try {
    const state = {
      currentNamespaceId: currentNamespaceId.value,
      graphConfig: graphConfig.value,
      currentLayout: currentLayout.value,
      canvasMode: canvasMode.value
    }
    localStorage.setItem('kg_state', JSON.stringify(state))
  } catch (error) {
    console.error('保存状态失败:', error)
  }
}

// 从本地存储加载状态
function loadFromLocalStorage() {
  try {
    const saved = localStorage.getItem('kg_state')
    if (saved) {
      const state = JSON.parse(saved)
      graphConfig.value = state.graphConfig || graphConfig.value
      currentLayout.value = state.currentLayout || GraphLayout.FORCE
      canvasMode.value = state.canvasMode || GraphViewMode.VIEW
    }
  } catch (error) {
    console.error('加载状态失败:', error)
  }
}

// 监听状态变化并自动保存
watch([
  currentNamespace,
  graphConfig,
  currentLayout,
  canvasMode
], () => {
  saveToLocalStorage()
}, { deep: true })

// ==================== 导出 ====================

export const knowledgeGraphStore = {
  // 状态
  namespaces,
  currentNamespace,
  namespaceStats,
  graphNodes,
  graphEdges,
  selectedEntity,
  hoveredEntity,
  selectedEdge,
  loading,
  sidebarOpen,
  detailPanelOpen,
  statsPanelOpen,
  pathExplorerOpen,
  canvasMode,
  currentLayout,
  graphConfig,
  searchQuery,
  searchResults,
  pathSourceEntity,
  pathTargetEntity,
  pathResults,
  viewHistory,
  historyIndex,

  // 计算属性
  currentNamespaceId,
  isGraphEmpty,
  selectedNodesCount,
  graphStats,

  // 命名空间操作
  loadNamespaces,
  selectNamespace,
  createNewNamespace,
  deleteNamespace,
  loadNamespaceStats,

  // 图谱数据操作
  loadGraphData,
  loadSubGraph,
  expandNeighborhood,
  clearGraphData,
  calculateNodeDegrees,

  // 实体操作
  selectEntity,
  clearEntitySelection,
  searchEntitiesAction,
  locateEntity,

  // 路径探索
  findPath,
  setPathSourceEntity,
  setPathTargetEntity,
  clearPathExploration,

  // UI操作
  toggleSidebar,
  toggleDetailPanel,
  closeDetailPanel,
  toggleStatsPanel,
  togglePathExplorer,
  setLayout,
  setCanvasMode,
  updateGraphConfig,

  // 历史记录
  undo,
  redo,
  clearHistory,

  // 持久化
  saveToLocalStorage,
  loadFromLocalStorage
}

// 初始化时加载本地存储状态
loadFromLocalStorage()
