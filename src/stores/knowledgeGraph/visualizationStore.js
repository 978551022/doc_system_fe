/**
 * 知识图谱可视化Store
 * 使用Pinia进行状态管理
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  getGraphData,
  getSubGraph,
  getNodeNeighborhood,
  getEntityPath
} from '../../api/knowledgeGraph.js'

export const useVisualizationStore = defineStore('knowledgeGraph/visualization', () => {
  // ==================== 状态 ====================

  const graphNodes = ref([])
  const graphEdges = ref([])
  const selectedNode = ref(null)
  const selectedEdge = ref(null)
  const hoveredNode = ref(null)
  const loading = ref(false)
  const error = ref(null)

  // 图谱配置
  const config = ref({
    layout: 'force_directed', // force_directed | circular | hierarchical
    nodeLabelVisible: true,
    edgeLabelVisible: false,
    showMinimap: true,
    showGrid: true,
    enablePhysics: true
  })

  // 视图状态
  const viewState = ref({
    zoom: 1,
    center: { x: 0, y: 0 },
    transform: { x: 0, y: 0, k: 1 }
  })

  // 历史记录
  const history = ref([])
  const historyIndex = ref(-1)

  // ==================== 计算属性 ====================

  const isGraphEmpty = computed(() => graphNodes.value.length === 0)
  const nodeCount = computed(() => graphNodes.value.length)
  const edgeCount = computed(() => graphEdges.value.length)

  const entityTypeDistribution = computed(() => {
    const distribution = {}
    graphNodes.value.forEach(node => {
      const type = node.type || 'Unknown'
      distribution[type] = (distribution[type] || 0) + 1
    })
    return distribution
  })

  const relationTypeDistribution = computed(() => {
    const distribution = {}
    graphEdges.value.forEach(edge => {
      const type = edge.label || 'Unknown'
      distribution[type] = (distribution[type] || 0) + 1
    })
    return distribution
  })

  const canUndo = computed(() => historyIndex.value > 0)
  const canRedo = computed(() => historyIndex.value < history.value.length - 1)

  // ==================== Actions ====================

  /**
   * 加载全图谱数据
   */
  async function loadGraphData(namespaceId, limit = 100) {
    loading.value = true
    error.value = null
    try {
      const response = await getGraphData(namespaceId, { limit })
      if (response.code === 200) {
        const { nodes = [], edges = [] } = response.data

        graphNodes.value = nodes.map(node => ({
          id: node.id,
          label: node.label,
          type: node.type,
          attributes: node.attributes || {},
          properties: node.properties || {},
          // G6格式
          style: {
            fill: node.properties?.color || '#3B82F6',
            stroke: node.properties?.color || '#3B82F6',
            lineWidth: 2
          },
          size: node.properties?.size || 30
        }))

        graphEdges.value = edges.map(edge => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          label: edge.label,
          properties: edge.properties || {},
          // G6格式
          style: {
            stroke: edge.properties?.color || '#94A3B8',
            lineWidth: edge.properties?.width || 2,
            lineDash: edge.properties?.dash || []
          }
        }))

        // 保存到历史
        saveToHistory()
      }

      return { nodes: graphNodes.value, edges: graphEdges.value }
    } catch (err) {
      error.value = err.message
      console.error('加载图谱数据失败:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 加载子图（以指定节点为中心）
   */
  async function loadSubGraph(namespaceId, centerEntityId, depth = 2, maxNodes = 50) {
    loading.value = true
    error.value = null
    try {
      const response = await getSubGraph(namespaceId, centerEntityId, { depth, max_nodes: maxNodes })
      if (response.code === 200) {
        const { nodes = [], edges = [] } = response.data

        // 合并新节点
        const existingNodeIds = new Set(graphNodes.value.map(n => n.id))
        const existingEdgeIds = new Set(graphEdges.value.map(e => e.id))

        const newNodes = nodes
          .filter(n => !existingNodeIds.has(n.id))
          .map(n => ({
            id: n.id,
            label: n.label,
            type: n.type,
            attributes: n.attributes || {},
            properties: n.properties || {},
            style: {
              fill: n.properties?.color || '#3B82F6',
              stroke: n.properties?.color || '#3B82F6',
              lineWidth: 2
            },
            size: n.properties?.size || 30
          }))

        const newEdges = edges
          .filter(e => !existingEdgeIds.has(e.id))
          .map(e => ({
            id: e.id,
            source: e.source,
            target: e.target,
            label: e.label,
            properties: e.properties || {},
            style: {
              stroke: e.properties?.color || '#94A3B8',
              lineWidth: e.properties?.width || 2
            }
          }))

        graphNodes.value = [...graphNodes.value, ...newNodes]
        graphEdges.value = [...graphEdges.value, ...newEdges]

        saveToHistory()
      }

      return { nodes: graphNodes.value, edges: graphEdges.value }
    } catch (err) {
      error.value = err.message
      console.error('加载子图失败:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 展开节点邻域
   */
  async function expandNeighborhood(namespaceId, entityId, depth = 1) {
    loading.value = true
    error.value = null
    try {
      const response = await getNodeNeighborhood(namespaceId, entityId, { depth })
      if (response.code === 200) {
        const { nodes = [], edges = [] } = response.data

        // 合并新节点
        const existingNodeIds = new Set(graphNodes.value.map(n => n.id))
        const existingEdgeIds = new Set(graphEdges.value.map(e => e.id))

        const newNodes = nodes
          .filter(n => !existingNodeIds.has(n.id))
          .map(n => ({
            id: n.id,
            label: n.label,
            type: n.type,
            attributes: n.attributes || {},
            properties: n.properties || {},
            style: {
              fill: n.properties?.color || '#3B82F6',
              stroke: n.properties?.color || '#3B82F6',
              lineWidth: 2
            },
            size: n.properties?.size || 30
          }))

        const newEdges = edges
          .filter(e => !existingEdgeIds.has(e.id))
          .map(e => ({
            id: e.id,
            source: e.source,
            target: e.target,
            label: e.label,
            properties: e.properties || {},
            style: {
              stroke: e.properties?.color || '#94A3B8',
              lineWidth: e.properties?.width || 2
            }
          }))

        graphNodes.value = [...graphNodes.value, ...newNodes]
        graphEdges.value = [...graphEdges.value, ...newEdges]
      }

      return { nodes: graphNodes.value, edges: graphEdges.value }
    } catch (err) {
      error.value = err.message
      console.error('展开邻域失败:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 查找实体间路径
   */
  async function findPath(namespaceId, sourceId, targetId, maxDepth = 3) {
    loading.value = true
    error.value = null
    try {
      const response = await getEntityPath(namespaceId, {
        source_id: sourceId,
        target_id: targetId,
        max_depth: maxDepth
      })

      if (response.code === 200) {
        return response.data?.paths || []
      }

      return []
    } catch (err) {
      error.value = err.message
      console.error('查找路径失败:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 选择节点
   */
  function selectNode(node) {
    selectedNode.value = node
    selectedEdge.value = null
  }

  /**
   * 选择边
   */
  function selectEdge(edge) {
    selectedEdge.value = edge
    selectedNode.value = null
  }

  /**
   * 悬停节点
   */
  function hoverNode(node) {
    hoveredNode.value = node
  }

  /**
   * 清空选择
   */
  function clearSelection() {
    selectedNode.value = null
    selectedEdge.value = null
    hoveredNode.value = null
  }

  /**
   * 设置布局
   */
  function setLayout(layoutType) {
    config.value.layout = layoutType
  }

  /**
   * 更新配置
   */
  function updateConfig(newConfig) {
    config.value = { ...config.value, ...newConfig }
  }

  /**
   * 设置视图状态
   */
  function setViewState(state) {
    viewState.value = { ...viewState.value, ...state }
  }

  /**
   * 清空图谱数据
   */
  function clearGraphData() {
    graphNodes.value = []
    graphEdges.value = []
    selectedNode.value = null
    selectedEdge.value = null
    hoveredNode.value = null
    history.value = []
    historyIndex.value = -1
  }

  /**
   * 保存到历史
   */
  function saveToHistory() {
    const state = {
      nodes: JSON.parse(JSON.stringify(graphNodes.value)),
      edges: JSON.parse(JSON.stringify(graphEdges.value))
    }

    // 删除当前位置之后的历史
    history.value = history.value.slice(0, historyIndex.value + 1)
    history.value.push(state)
    historyIndex.value = history.value.length - 1

    // 限制历史记录数量
    if (history.value.length > 50) {
      history.value.shift()
      historyIndex.value--
    }
  }

  /**
   * 撤销
   */
  function undo() {
    if (canUndo.value) {
      historyIndex.value--
      restoreFromHistory()
    }
  }

  /**
   * 重做
   */
  function redo() {
    if (canRedo.value) {
      historyIndex.value++
      restoreFromHistory()
    }
  }

  /**
   * 从历史恢复
   */
  function restoreFromHistory() {
    const state = history.value[historyIndex.value]
    if (state) {
      graphNodes.value = JSON.parse(JSON.stringify(state.nodes))
      graphEdges.value = JSON.parse(JSON.stringify(state.edges))
    }
  }

  /**
   * 清空历史
   */
  function clearHistory() {
    history.value = []
    historyIndex.value = -1
  }

  // ==================== 导出 ====================

  return {
    // 状态
    graphNodes,
    graphEdges,
    selectedNode,
    selectedEdge,
    hoveredNode,
    loading,
    error,
    config,
    viewState,
    history,
    historyIndex,

    // 计算属性
    isGraphEmpty,
    nodeCount,
    edgeCount,
    entityTypeDistribution,
    relationTypeDistribution,
    canUndo,
    canRedo,

    // Actions
    loadGraphData,
    loadSubGraph,
    expandNeighborhood,
    findPath,
    selectNode,
    selectEdge,
    hoverNode,
    clearSelection,
    setLayout,
    updateConfig,
    setViewState,
    clearGraphData,
    saveToHistory,
    undo,
    redo,
    clearHistory
  }
})
