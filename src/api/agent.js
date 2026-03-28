/**
 * 多智能体工作流API
 */

import { getToken } from '../utils/userStore.js'

const AGENT_BASE_URL = '/api/v1/agent'

// ==================== 工作流管理 ====================

/**
 * 创建工作流
 * POST /agent/workflows
 */
export const createWorkflow = async (workflowData) => {
  const token = getToken()
  const response = await fetch(`${AGENT_BASE_URL}/workflows`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(workflowData)
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: '创建工作流失败' }))
    throw new Error(error.detail || `创建工作流失败: ${response.status}`)
  }
  return await response.json()
}

/**
 * 获取工作流列表
 * GET /agent/workflows?limit=20&offset=0
 */
export const getWorkflows = async (params = {}) => {
  const token = getToken()
  const queryParams = new URLSearchParams(params).toString()
  const response = await fetch(`${AGENT_BASE_URL}/workflows?${queryParams}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  if (!response.ok) {
    throw new Error(`获取工作流列表失败: ${response.status}`)
  }
  return await response.json()
}

/**
 * 获取工作流详情
 * GET /agent/workflows/{workflow_id}
 */
export const getWorkflow = async (workflowId) => {
  const token = getToken()
  const response = await fetch(`${AGENT_BASE_URL}/workflows/${workflowId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  if (!response.ok) {
    throw new Error(`获取工作流详情失败: ${response.status}`)
  }
  return await response.json()
}

/**
 * 更新工作流
 * PUT /agent/workflows/{workflow_id}
 */
export const updateWorkflow = async (workflowId, workflowData) => {
  const token = getToken()
  const response = await fetch(`${AGENT_BASE_URL}/workflows/${workflowId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(workflowData)
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: '更新工作流失败' }))
    throw new Error(error.detail || `更新工作流失败: ${response.status}`)
  }
  return await response.json()
}

/**
 * 删除工作流
 * DELETE /agent/workflows/{workflow_id}
 */
export const deleteWorkflow = async (workflowId) => {
  const token = getToken()
  const response = await fetch(`${AGENT_BASE_URL}/workflows/${workflowId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  if (!response.ok) {
    throw new Error(`删除工作流失败: ${response.status}`)
  }
  return await response.json()
}

/**
 * 验证工作流配置
 * POST /agent/workflows/validate
 */
export const validateWorkflowAPI = async (workflowData) => {
  const token = getToken()
  const response = await fetch(`${AGENT_BASE_URL}/workflows/validate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(workflowData)
  })
  if (!response.ok) {
    throw new Error(`验证工作流失败: ${response.status}`)
  }
  return await response.json()
}

// ==================== 执行控制 ====================

/**
 * 启动执行（SSE流式）
 * POST /agent/executions
 */
export const executeWorkflow = async ({
  workflow_id,
  input = {},
  execution_name = null
}, onChunk, onMetadata, onError, onComplete, signal = null) => {
  const token = getToken()
  const requestBody = { workflow_id, input }
  if (execution_name) requestBody.execution_name = execution_name

  const response = await fetch(`${AGENT_BASE_URL}/executions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(requestBody),
    signal
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`启动执行失败: ${response.status} - ${errorText}`)
  }

  // 处理SSE流式响应
  const reader = response.body.getReader()
  const decoder = new TextDecoder('utf-8')
  let buffer = ''
  let hasCalledOnComplete = false

  const processSSEEvent = (jsonData) => {
    try {
      const parsed = JSON.parse(jsonData)

      switch (parsed.type) {
        case 'task_started':
          if (onMetadata) onMetadata({ type: 'task_started', data: parsed.data })
          break

        case 'agent_thinking':
          if (onMetadata) onMetadata({ type: 'agent_thinking', data: parsed.data })
          break

        case 'stream_chunk':
          if (onChunk && parsed.data !== undefined) {
            onChunk(parsed.data)
          }
          break

        case 'task_completed':
          if (onMetadata) onMetadata({ type: 'task_completed', data: parsed.data })
          break

        case 'execution_done':
          if (onComplete && !hasCalledOnComplete) {
            hasCalledOnComplete = true
            onComplete()
          }
          break

        case 'error':
          const errorMsg = parsed.data?.message || parsed.message || parsed.data
          if (onError) onError(errorMsg)
          break

        default:
          if (parsed.data !== undefined && onChunk) {
            onChunk(parsed.data)
          }
      }
    } catch (parseError) {
      console.error('[Agent] JSON解析失败:', parseError, '原始数据:', jsonData)
    }
  }

  while (true) {
    const { value, done } = await reader.read()

    if (done) {
      // 处理剩余数据
      if (buffer.trim()) {
        const remainingEvents = buffer.split(/data:\s*/g).filter(s => s.trim())
        for (const event of remainingEvents) {
          if (event !== '[DONE]' && event.trim()) {
            processSSEEvent(event.trim())
          }
        }
      }
      if (onComplete && !hasCalledOnComplete) {
        hasCalledOnComplete = true
        onComplete()
      }
      break
    }

    buffer += decoder.decode(value, { stream: true })

    // 处理buffer中的完整事件
    let startIndex = 0
    while (true) {
      const dataIndex = buffer.indexOf('data:', startIndex)

      if (dataIndex === -1) {
        if (startIndex < buffer.length) {
          const remaining = buffer.substring(startIndex).trim()
          if (remaining && remaining !== '[DONE]') {
            processSSEEvent(remaining)
          }
        }
        buffer = ''
        break
      }

      const jsonStart = dataIndex + 5
      let jsonEnd = buffer.indexOf('data:', jsonStart)

      if (jsonEnd === -1) {
        const partialJson = buffer.substring(jsonStart).trim()
        if (partialJson && partialJson !== '[DONE]') {
          try {
            JSON.parse(partialJson)
            processSSEEvent(partialJson)
            buffer = ''
            startIndex = 0
          } catch {
            break
          }
        } else {
          buffer = ''
          startIndex = 0
        }
        break
      }

      let jsonStr = buffer.substring(jsonStart, jsonEnd).trim()

      while (jsonStr.startsWith('data:')) {
        jsonStr = jsonStr.substring(5).trim()
      }

      if (jsonStr && jsonStr !== '[DONE]') {
        processSSEEvent(jsonStr)
      }

      startIndex = jsonEnd
    }

    if (buffer.length > 100000) {
      buffer = ''
    }
  }

  return { success: true }
}

/**
 * 获取执行状态
 * GET /agent/executions/{execution_id}
 */
export const getExecution = async (executionId) => {
  const token = getToken()
  const response = await fetch(`${AGENT_BASE_URL}/executions/${executionId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  if (!response.ok) {
    throw new Error(`获取执行状态失败: ${response.status}`)
  }
  return await response.json()
}

/**
 * 暂停执行
 * POST /agent/executions/{execution_id}/pause
 */
export const pauseExecution = async (executionId) => {
  const token = getToken()
  const response = await fetch(`${AGENT_BASE_URL}/executions/${executionId}/pause`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  if (!response.ok) {
    throw new Error(`暂停执行失败: ${response.status}`)
  }
  return await response.json()
}

/**
 * 恢复执行
 * POST /agent/executions/{execution_id}/resume
 */
export const resumeExecution = async (executionId) => {
  const token = getToken()
  const response = await fetch(`${AGENT_BASE_URL}/executions/${executionId}/resume`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  if (!response.ok) {
    throw new Error(`恢复执行失败: ${response.status}`)
  }
  return await response.json()
}

/**
 * 取消执行
 * POST /agent/executions/{execution_id}/cancel
 */
export const cancelExecution = async (executionId) => {
  const token = getToken()
  const response = await fetch(`${AGENT_BASE_URL}/executions/${executionId}/cancel`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  if (!response.ok) {
    throw new Error(`取消执行失败: ${response.status}`)
  }
  return await response.json()
}

/**
 * 获取用户执行历史
 * GET /agent/executions/user/{user_id}?limit=20&offset=0
 */
export const getUserExecutions = async (userId, params = {}) => {
  const token = getToken()
  const queryParams = new URLSearchParams(params).toString()
  const response = await fetch(`${AGENT_BASE_URL}/executions/user/${userId}?${queryParams}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  if (!response.ok) {
    throw new Error(`获取执行历史失败: ${response.status}`)
  }
  return await response.json()
}

// ==================== Agent管理 ====================

/**
 * 列出Agent类型
 * GET /agent/agents/types
 */
export const getAgentTypes = async () => {
  const token = getToken()
  const response = await fetch(`${AGENT_BASE_URL}/agents/types`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  if (!response.ok) {
    throw new Error(`获取Agent类型失败: ${response.status}`)
  }
  return await response.json()
}

/**
 * 创建自定义Agent
 * POST /agent/agents/custom
 */
export const createCustomAgent = async (agentData) => {
  const token = getToken()
  const response = await fetch(`${AGENT_BASE_URL}/agents/custom`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(agentData)
  })
  if (!response.ok) {
    throw new Error(`创建自定义Agent失败: ${response.status}`)
  }
  return await response.json()
}

// ==================== 模型管理 ====================

/**
 * 列出可用模型
 * GET /agent/models
 */
export const getAgentModels = async () => {
  const token = getToken()
  const response = await fetch(`${AGENT_BASE_URL}/models`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  if (!response.ok) {
    throw new Error(`获取模型列表失败: ${response.status}`)
  }
  return await response.json()
}

// ==================== 系统监控 ====================

/**
 * 健康检查
 * GET /agent/system/health
 */
export const healthCheck = async () => {
  const response = await fetch(`${AGENT_BASE_URL}/system/health`)
  if (!response.ok) {
    throw new Error(`健康检查失败: ${response.status}`)
  }
  return await response.json()
}

/**
 * 系统统计
 * GET /agent/system/stats
 */
export const getSystemStats = async () => {
  const token = getToken()
  const response = await fetch(`${AGENT_BASE_URL}/system/stats`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  if (!response.ok) {
    throw new Error(`获取系统统计失败: ${response.status}`)
  }
  return await response.json()
}

/**
 * 用户统计
 * GET /agent/system/user/{user_id}/stats
 */
export const getUserStats = async (userId) => {
  const token = getToken()
  const response = await fetch(`${AGENT_BASE_URL}/system/user/${userId}/stats`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  if (!response.ok) {
    throw new Error(`获取用户统计失败: ${response.status}`)
  }
  return await response.json()
}

export default {
  // 工作流管理
  createWorkflow,
  getWorkflows,
  getWorkflow,
  updateWorkflow,
  deleteWorkflow,
  validateWorkflow: validateWorkflowAPI,
  // 执行控制
  executeWorkflow,
  getExecution,
  pauseExecution,
  resumeExecution,
  cancelExecution,
  getUserExecutions,
  // Agent管理
  getAgentTypes,
  createCustomAgent,
  // 模型管理
  getAgentModels,
  // 系统监控
  healthCheck,
  getSystemStats,
  getUserStats
}
