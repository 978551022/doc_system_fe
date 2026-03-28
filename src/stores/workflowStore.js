/**
 * 工作流状态管理
 */

import { ref, reactive, computed, watch } from 'vue'
import { NodeType } from '../utils/workflow/nodeTypes.js'
import { CollaborationMode } from '../utils/workflow/collaborationModes.js'
import { validateWorkflow, canExecuteWorkflow } from '../utils/workflow/workflowValidator.js'
import { getAllTemplates } from '../utils/workflow/workflowTemplates.js'

// 状态管理类
class WorkflowStore {
  constructor() {
    // 工作流数据
    this.workflows = ref(new Map())
    this.currentWorkflowId = ref(null)
    this.unsavedChanges = ref(false)

    // 执行状态
    this.currentExecution = ref(null)
    this.executionHistory = ref([])

    // UI状态
    this.selectedNodeIds = ref([])
    this.selectedEdgeIds = ref([])
    this.nodeLibraryExpanded = ref(true)
    this.executionPanelExpanded = ref(true)
    this.sidePanelVisible = ref(true)

    // 草稿自动保存
    this.draftAutoSave = true
    this.draftAutoSaveInterval = 30000 // 30秒

    // 用户偏好
    this.userPreferences = reactive({
      defaultModel: 'glm-4',
      defaultTimeout: 300000,
      showMinimap: true,
      showGrid: true,
      autoSave: true
    })

    // 初始化
    this.loadFromLocalStorage()
    this.setupAutoSave()
  }

  // ==================== 计算属性 ====================

  get currentWorkflow() {
    if (!this.currentWorkflowId.value) return null
    return this.workflows.value.get(this.currentWorkflowId.value)
  }

  get isValid() {
    if (!this.currentWorkflow) return false
    const result = validateWorkflow(this.currentWorkflow)
    return result.isValid
  }

  get canExecute() {
    if (!this.currentWorkflow) return false
    return canExecuteWorkflow(this.currentWorkflow)
  }

  get isExecuting() {
    return this.currentExecution.value?.status === 'running'
  }

  get isPaused() {
    return this.currentExecution.value?.status === 'paused'
  }

  get executionProgress() {
    if (!this.currentExecution.value) return 0
    const { nodeStates = {} } = this.currentExecution.value
    const totalNodes = Object.keys(nodeStates).length
    if (totalNodes === 0) return 0

    const completedNodes = Object.values(nodeStates).filter(
      s => s.status === 'completed'
    ).length
    return Math.round((completedNodes / totalNodes) * 100)
  }

  // ==================== 工作流操作 ====================

  createWorkflow(data = {}) {
    const workflow = {
      id: `workflow_${Date.now()}`,
      name: data.name || '未命名工作流',
      description: data.description || '',
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      nodes: data.nodes || [],
      edges: data.edges || [],
      collaborationMode: data.collaborationMode || CollaborationMode.SEQUENTIAL,
      globalConfig: data.globalConfig || {
        timeout: 300000,
        retryOnError: true,
        maxRetries: 3,
        saveIntermediate: true
      }
    }

    this.workflows.value.set(workflow.id, workflow)
    this.currentWorkflowId.value = workflow.id
    this.saveToLocalStorage()
    return workflow
  }

  loadWorkflow(workflowId) {
    const workflow = this.workflows.value.get(workflowId)
    if (workflow) {
      this.currentWorkflowId.value = workflowId
      this.selectedNodeIds.value = []
      this.selectedEdgeIds.value = []
      return workflow
    }
    return null
  }

  updateWorkflow(updates) {
    const workflow = this.currentWorkflow
    if (!workflow) return null

    const updated = {
      ...workflow,
      ...updates,
      updatedAt: new Date().toISOString()
    }

    this.workflows.value.set(workflow.id, updated)
    this.unsavedChanges.value = true
    this.saveToLocalStorage()
    return updated
  }

  saveWorkflow() {
    const workflow = this.currentWorkflow
    if (!workflow) return Promise.reject('没有当前工作流')

    // 这里会调用API保存到后端
    // 暂时只保存到localStorage
    this.unsavedChanges.value = false
    this.saveToLocalStorage()
    return Promise.resolve(workflow)
  }

  deleteWorkflow(workflowId) {
    this.workflows.value.delete(workflowId)
    if (this.currentWorkflowId.value === workflowId) {
      this.currentWorkflowId.value = null
    }
    this.saveToLocalStorage()
  }

  // ==================== 节点操作 ====================

  addNode(node) {
    const workflow = this.currentWorkflow
    if (!workflow) return

    const newNode = {
      id: node.id || `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: node.type,
      position: node.position || { x: 100, y: 100 },
      data: node.data || {}
    }

    workflow.nodes.push(newNode)
    this.unsavedChanges.value = true
    this.saveToLocalStorage()
    return newNode
  }

  updateNode(nodeId, updates) {
    const workflow = this.currentWorkflow
    if (!workflow) return

    const nodeIndex = workflow.nodes.findIndex(n => n.id === nodeId)
    if (nodeIndex === -1) return

    workflow.nodes[nodeIndex] = {
      ...workflow.nodes[nodeIndex],
      ...updates
    }

    this.unsavedChanges.value = true
    this.saveToLocalStorage()
  }

  deleteNode(nodeId) {
    const workflow = this.currentWorkflow
    if (!workflow) return

    // 删除节点
    workflow.nodes = workflow.nodes.filter(n => n.id !== nodeId)

    // 删除相关连接
    workflow.edges = workflow.edges.filter(
      e => e.source !== nodeId && e.target !== nodeId
    )

    // 取消选中
    this.selectedNodeIds.value = this.selectedNodeIds.value.filter(id => id !== nodeId)

    this.unsavedChanges.value = true
    this.saveToLocalStorage()
  }

  duplicateNode(nodeId) {
    const workflow = this.currentWorkflow
    if (!workflow) return

    const node = workflow.nodes.find(n => n.id === nodeId)
    if (!node) return

    const newNode = {
      ...node,
      id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      position: {
        x: node.position.x + 50,
        y: node.position.y + 50
      }
    }

    workflow.nodes.push(newNode)
    this.unsavedChanges.value = true
    this.saveToLocalStorage()
    return newNode
  }

  // ==================== 连接操作 ====================

  addEdge(edge) {
    const workflow = this.currentWorkflow
    if (!workflow) return

    const newEdge = {
      id: edge.id || `edge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      source: edge.source,
      target: edge.target,
      type: edge.type || 'default',
      animated: false,
      data: edge.data || {}
    }

    // 检查是否已存在
    const exists = workflow.edges.some(
      e => e.source === newEdge.source && e.target === newEdge.target
    )
    if (exists) return null

    workflow.edges.push(newEdge)
    this.unsavedChanges.value = true
    this.saveToLocalStorage()
    return newEdge
  }

  deleteEdge(edgeId) {
    const workflow = this.currentWorkflow
    if (!workflow) return

    workflow.edges = workflow.edges.filter(e => e.id !== edgeId)

    // 取消选中
    this.selectedEdgeIds.value = this.selectedEdgeIds.value.filter(id => id !== edgeId)

    this.unsavedChanges.value = true
    this.saveToLocalStorage()
  }

  // ==================== 选择操作 ====================

  selectNode(nodeId, addToSelection = false) {
    if (addToSelection) {
      if (this.selectedNodeIds.value.includes(nodeId)) {
        this.selectedNodeIds.value = this.selectedNodeIds.value.filter(id => id !== nodeId)
      } else {
        this.selectedNodeIds.value.push(nodeId)
      }
    } else {
      this.selectedNodeIds.value = [nodeId]
    }
    this.selectedEdgeIds.value = []
  }

  selectEdge(edgeId, addToSelection = false) {
    if (addToSelection) {
      if (this.selectedEdgeIds.value.includes(edgeId)) {
        this.selectedEdgeIds.value = this.selectedEdgeIds.value.filter(id => id !== edgeId)
      } else {
        this.selectedEdgeIds.value.push(edgeId)
      }
    } else {
      this.selectedEdgeIds.value = [edgeId]
    }
    this.selectedNodeIds.value = []
  }

  clearSelection() {
    this.selectedNodeIds.value = []
    this.selectedEdgeIds.value = []
  }

  deleteSelected() {
    const workflow = this.currentWorkflow
    if (!workflow) return

    // 删除选中的节点
    this.selectedNodeIds.value.forEach(nodeId => {
      this.deleteNode(nodeId)
    })

    // 删除选中的边
    this.selectedEdgeIds.value.forEach(edgeId => {
      this.deleteEdge(edgeId)
    })

    this.clearSelection()
  }

  // ==================== 执行操作 ====================

  startExecution(input = {}) {
    const workflow = this.currentWorkflow
    if (!workflow) return Promise.reject('没有当前工作流')

    const execution = {
      id: `exec_${Date.now()}`,
      workflowId: workflow.id,
      status: 'running',
      startedAt: new Date().toISOString(),
      endedAt: null,
      duration: 0,
      input,
      output: '',
      nodeStates: {},
      error: null
    }

    // 初始化节点状态
    workflow.nodes.forEach(node => {
      execution.nodeStates[node.id] = {
        status: 'pending',
        startedAt: null,
        completedAt: null,
        output: null,
        error: null
      }
    })

    this.currentExecution.value = execution
    return execution
  }

  updateExecutionState(updates) {
    if (!this.currentExecution.value) return

    this.currentExecution.value = {
      ...this.currentExecution.value,
      ...updates
    }
  }

  updateNodeState(nodeId, state) {
    if (!this.currentExecution.value) return

    this.currentExecution.value.nodeStates = {
      ...this.currentExecution.value.nodeStates,
      [nodeId]: {
        ...this.currentExecution.value.nodeStates[nodeId],
        ...state
      }
    }
  }

  pauseExecution() {
    if (this.currentExecution.value) {
      this.currentExecution.value.status = 'paused'
    }
  }

  resumeExecution() {
    if (this.currentExecution.value) {
      this.currentExecution.value.status = 'running'
    }
  }

  cancelExecution() {
    if (this.currentExecution.value) {
      this.currentExecution.value.status = 'cancelled'
      this.currentExecution.value.endedAt = new Date().toISOString()
    }
  }

  completeExecution(output = '') {
    if (this.currentExecution.value) {
      this.currentExecution.value.status = 'completed'
      this.currentExecution.value.endedAt = new Date().toISOString()
      this.currentExecution.value.output = output

      // 添加到历史记录
      this.executionHistory.value.unshift({ ...this.currentExecution.value })
      if (this.executionHistory.value.length > 50) {
        this.executionHistory.value = this.executionHistory.value.slice(0, 50)
      }
    }
  }

  failExecution(error) {
    if (this.currentExecution.value) {
      this.currentExecution.value.status = 'failed'
      this.currentExecution.value.endedAt = new Date().toISOString()
      this.currentExecution.value.error = error
    }
  }

  // ==================== 模板操作 ====================

  loadTemplate(templateId) {
    const templates = getAllTemplates()
    const template = templates.find(t => t.id === templateId)
    if (!template) return null

    // 重新生成节点ID以避免冲突
    const idMap = new Map()
    const nodes = template.nodes.map(node => {
      const newId = `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      idMap.set(node.id, newId)
      return {
        ...node,
        id: newId
      }
    })

    const edges = template.edges.map(edge => ({
      ...edge,
      id: `edge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      source: idMap.get(edge.source) || edge.source,
      target: idMap.get(edge.target) || edge.target
    }))

    return this.createWorkflow({
      name: template.name,
      description: template.description,
      nodes,
      edges,
      collaborationMode: template.collaborationMode
    })
  }

  // ==================== 本地存储 ====================

  saveToLocalStorage() {
    try {
      const data = {
        workflows: Array.from(this.workflows.value.entries()),
        currentWorkflowId: this.currentWorkflowId.value,
        executionHistory: this.executionHistory.value,
        userPreferences: this.userPreferences
      }
      localStorage.setItem('workflowStore', JSON.stringify(data))
    } catch (e) {
      console.error('保存到localStorage失败:', e)
    }
  }

  loadFromLocalStorage() {
    try {
      const data = localStorage.getItem('workflowStore')
      if (data) {
        const parsed = JSON.parse(data)
        this.workflows.value = new Map(parsed.workflows || [])
        this.currentWorkflowId.value = parsed.currentWorkflowId || null
        this.executionHistory.value = parsed.executionHistory || []
        if (parsed.userPreferences) {
          Object.assign(this.userPreferences, parsed.userPreferences)
        }
      }
    } catch (e) {
      console.error('从localStorage加载失败:', e)
    }
  }

  setupAutoSave() {
    // 自动保存当前工作流草稿
    const saveInterval = setInterval(() => {
      if (this.draftAutoSave && this.unsavedChanges.value && this.currentWorkflow) {
        this.saveToLocalStorage()
        console.log('[WorkflowStore] 草稿已自动保存')
      }
    }, this.draftAutoSaveInterval)

    // 清理定时器
    return () => clearInterval(saveInterval)
  }

  // ==================== 工具方法 ====================

  reset() {
    this.currentWorkflowId.value = null
    this.currentExecution.value = null
    this.selectedNodeIds.value = []
    this.selectedEdgeIds.value = []
    this.unsavedChanges.value = false
  }
}

// 创建单例实例
const workflowStore = new WorkflowStore()

// 导出
export default workflowStore
export const useWorkflowStore = () => workflowStore
