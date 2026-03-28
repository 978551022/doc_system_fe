/**
 * 工作流验证工具
 */

import { NodeType } from './nodeTypes.js'
import { CollaborationMode } from './collaborationModes.js'

// 验证错误级别
export const ValidationErrorLevel = {
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
}

// 验证结果
export class ValidationResult {
  constructor() {
    this.errors = []
    this.warnings = []
    this.infos = []
  }

  addError(message, nodeId = null) {
    this.errors.push({ message, nodeId, level: ValidationErrorLevel.ERROR })
  }

  addWarning(message, nodeId = null) {
    this.warnings.push({ message, nodeId, level: ValidationErrorLevel.WARNING })
  }

  addInfo(message, nodeId = null) {
    this.infos.push({ message, nodeId, level: ValidationErrorLevel.INFO })
  }

  get allMessages() {
    return [...this.errors, ...this.warnings, ...this.infos]
  }

  get hasErrors() {
    return this.errors.length > 0
  }

  get hasWarnings() {
    return this.warnings.length > 0
  }

  get isValid() {
    return !this.hasErrors
  }

  get summary() {
    return {
      errors: this.errors.length,
      warnings: this.warnings.length,
      infos: this.infos.length,
      isValid: this.isValid
    }
  }
}

/**
 * 验证工作流结构
 */
export function validateWorkflowStructure(nodes, edges) {
  const result = new ValidationResult()

  // 1. 检查是否有开始节点
  const startNodes = nodes.filter(n => n.type === NodeType.START)
  if (startNodes.length === 0) {
    result.addError('工作流必须有一个开始节点')
  } else if (startNodes.length > 1) {
    result.addWarning('工作流有多个开始节点，只会使用第一个')
  }

  // 2. 检查是否有结束节点
  const endNodes = nodes.filter(n => n.type === NodeType.END)
  if (endNodes.length === 0) {
    result.addError('工作流必须至少有一个结束节点')
  }

  // 3. 检查孤立节点（没有连接的节点）
  const connectedNodeIds = new Set()
  edges.forEach(edge => {
    connectedNodeIds.add(edge.source)
    connectedNodeIds.add(edge.target)
  })

  nodes.forEach(node => {
    if (!connectedNodeIds.has(node.id) && nodes.length > 1) {
      result.addWarning(`节点 "${node.data?.label || node.id}" 没有连接到其他节点`, node.id)
    }
  })

  // 4. 检查自连接
  edges.forEach(edge => {
    if (edge.source === edge.target) {
      result.addError(`节点不允许自连接`, edge.source)
    }
  })

  // 5. 检查重复连接
  const connectionKeySet = new Set()
  edges.forEach(edge => {
    const key = `${edge.source}-${edge.target}`
    if (connectionKeySet.has(key)) {
      result.addWarning(`存在重复的连接: ${edge.source} → ${edge.target}`, edge.source)
    }
    connectionKeySet.add(key)
  })

  return result
}

/**
 * 验证节点配置
 */
export function validateNodeConfig(node) {
  const result = new ValidationResult()

  if (!node.data) {
    result.addError('节点缺少配置数据', node.id)
    return result
  }

  switch (node.type) {
    case NodeType.AGENT:
      if (!node.data.agentType) {
        result.addError('Agent节点必须指定Agent类型', node.id)
      }
      if (!node.data.config?.model) {
        result.addWarning('建议为Agent节点配置模型', node.id)
      }
      break

    case NodeType.CONDITION:
      if (!node.data.config?.conditions || node.data.config.conditions.length === 0) {
        result.addError('条件节点必须配置分支条件', node.id)
      }
      break

    case NodeType.LOOP:
      if (!node.data.config?.exitCondition) {
        result.addWarning('循环节点建议配置退出条件', node.id)
      }
      if (node.data.config?.maxIterations && node.data.config.maxIterations > 100) {
        result.addWarning('循环次数过多可能导致长时间执行', node.id)
      }
      break
  }

  return result
}

/**
 * 验证工作流逻辑（检测循环依赖等）
 */
export function validateWorkflowLogic(nodes, edges) {
  const result = new ValidationResult()

  // 构建邻接表
  const adj = {}
  nodes.forEach(n => {
    adj[n.id] = []
  })
  edges.forEach(e => {
    if (adj[e.source]) {
      adj[e.source].push(e.target)
    }
  })

  // 检测循环（排除Loop节点的预期循环）
  const visited = new Set()
  const recursionStack = new Set()

  function dfs(nodeId, path = []) {
    visited.add(nodeId)
    recursionStack.add(nodeId)

    const neighbors = adj[nodeId] || []
    for (const neighbor of neighbors) {
      if (recursionStack.has(neighbor)) {
        // 检测到循环
        const loopNode = nodes.find(n => n.id === neighbor)
        if (loopNode?.type !== NodeType.LOOP) {
          result.addError(`检测到循环依赖: ${path.join(' → ')} → ${neighbor}`, neighbor)
        }
      } else if (!visited.has(neighbor)) {
        dfs(neighbor, [...path, nodeId])
      }
    }

    recursionStack.delete(nodeId)
  }

  // 从开始节点开始检测
  const startNodes = nodes.filter(n => n.type === NodeType.START)
  startNodes.forEach(startNode => {
    dfs(startNode.id)
  })

  return result
}

/**
 * 验证协作模式配置
 */
export function validateCollaborationMode(mode, nodes, edges) {
  const result = new ValidationResult()

  switch (mode) {
    case CollaborationMode.PARALLEL:
      // 检查是否有并行的分支
      const sourceCounts = {}
      edges.forEach(e => {
        sourceCounts[e.source] = (sourceCounts[e.source] || 0) + 1
      })
      const hasParallel = Object.values(sourceCounts).some(count => count > 1)
      if (!hasParallel) {
        result.addWarning('并行模式下没有检测到并行分支')
      }
      break

    case CollaborationMode.HIERARCHICAL:
      // 检查是否配置了管理者和工作者
      const managerNode = nodes.find(n => n.data?.isManager)
      const workerNodes = nodes.filter(n => n.data?.isWorker)
      if (!managerNode) {
        result.addError('层次模式必须配置一个管理者节点')
      }
      if (workerNodes.length === 0) {
        result.addError('层次模式必须配置至少一个工作者节点')
      }
      break

    case CollaborationMode.CONDITIONAL:
      // 检查是否有条件节点
      const conditionNodes = nodes.filter(n => n.type === NodeType.CONDITION)
      if (conditionNodes.length === 0) {
        result.addWarning('条件模式下没有检测到条件节点')
      }
      break

    case CollaborationMode.DEBATE:
      // 检查是否配置了辩手和仲裁者
      const arbiterNode = nodes.find(n => n.data?.isArbiter)
      const debaterNodes = nodes.filter(n => n.data?.isDebater)
      if (!arbiterNode) {
        result.addError('辩论模式必须配置一个仲裁者节点')
      }
      if (debaterNodes.length < 2) {
        result.addError('辩论模式必须配置至少两个辩手节点')
      }
      break
  }

  return result
}

/**
 * 综合验证工作流
 */
export function validateWorkflow(workflow) {
  const result = new ValidationResult()

  if (!workflow) {
    result.addError('工作流数据为空')
    return result
  }

  // 1. 验证基本结构
  if (!workflow.nodes || !Array.isArray(workflow.nodes)) {
    result.addError('工作流缺少nodes数据')
    return result
  }
  if (!workflow.edges || !Array.isArray(workflow.edges)) {
    result.addError('工作流缺少edges数据')
    return result
  }

  // 2. 验证结构
  const structureResult = validateWorkflowStructure(workflow.nodes, workflow.edges)
  result.errors.push(...structureResult.errors)
  result.warnings.push(...structureResult.warnings)

  // 3. 验证每个节点配置
  workflow.nodes.forEach(node => {
    const nodeResult = validateNodeConfig(node)
    result.errors.push(...nodeResult.errors)
    result.warnings.push(...nodeResult.warnings)
  })

  // 4. 验证逻辑
  const logicResult = validateWorkflowLogic(workflow.nodes, workflow.edges)
  result.errors.push(...logicResult.errors)
  result.warnings.push(...logicResult.warnings)

  // 5. 验证协作模式
  if (workflow.collaborationMode) {
    const modeResult = validateCollaborationMode(
      workflow.collaborationMode,
      workflow.nodes,
      workflow.edges
    )
    result.errors.push(...modeResult.errors)
    result.warnings.push(...modeResult.warnings)
  }

  return result
}

/**
 * 检查工作流是否可以执行
 */
export function canExecuteWorkflow(workflow) {
  const result = validateWorkflow(workflow)
  return result.isValid && workflow.nodes.length > 0
}
