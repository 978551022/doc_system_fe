import { getToken } from '../utils/userStore.js'

const INTELLIGENT_SEARCH_BASE_URL = 'v1/docsearch/intelligent-search'

/**
 * 智能搜索API模块
 * 统一处理大模型对话和文档检索
 */

/**
 * 发起智能查询请求
 * @param {Object} params - 查询参数
 * @param {string} params.query - 查询问题
 * @param {string} params.mode - 查询模式: document/general/hybrid
 * @param {string} [params.document_id] - 文档ID（document模式必需）
 * @param {string} [params.conversation_id] - 会话ID（不传则创建新会话）
 * @param {string} [params.user_id] - 用户ID
 * @param {string} [params.model_name] - 大模型名称，默认glm
 * @param {boolean} [params.stream=true] - 是否流式输出
 * @param {boolean} [params.online_search=false] - 是否启用联网搜索
 * @param {boolean} [params.deep_reasoning=false] - 是否启用深度推理
 * @param {Function} onChunk - 接收流式数据的回调函数
 * @param {Function} onMetadata - 接收元数据的回调函数
 * @param {Function} onError - 接收错误的回调函数
 * @returns {Promise<Object>} 返回会话信息
 */
export const intelligentQuery = async ({
  query,
  mode = 'general',
  document_id = null,
  conversation_id = null,
  user_id = null,
  model_name = 'glm',
  stream = true,
  online_search = false,
  deep_reasoning = false
}, onChunk, onMetadata, onError) => {
  const requestBody = {
    query,
    mode,
    model_name,
    stream,
    online_search,
    deep_reasoning
  }

  // 可选参数
  if (document_id) {
    requestBody.document_id = document_id
  }
  if (conversation_id) {
    requestBody.conversation_id = conversation_id
  }
  if (user_id) {
    requestBody.user_id = user_id
  }

  console.log('[智能查询] 发送请求:', requestBody)

  try {
    const token = getToken()
    const response = await fetch(`/api/${INTELLIGENT_SEARCH_BASE_URL}/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`请求失败: ${response.status} - ${errorText}`)
    }

    // 处理SSE流式响应
    const reader = response.body.getReader()
    const decoder = new TextDecoder('utf-8')
    let buffer = ''
    let resultConversationId = conversation_id

    // 解析并处理单个SSE数据事件
    const processSSEEvent = (jsonData) => {
      try {
        const parsed = JSON.parse(jsonData)

        // 处理不同类型的消息
        switch (parsed.type) {
          case 'content':
            // 内容片段 - 后端格式: {"type": "content", "data": "内容"}
            if (parsed.data !== undefined && onChunk) {
              onChunk(parsed.data)
            }
            break

          case 'metadata':
            // 元数据（会话ID、模式、模型等）- 后端格式: {"type": "metadata", "data": {...}}
            if (parsed.data && parsed.data.conversation_id) {
              resultConversationId = parsed.data.conversation_id
            }
            if (onMetadata) {
              onMetadata(parsed.data || parsed)
            }
            break

          case 'error':
            // 错误信息
            const errorMsg = parsed.data?.message || parsed.message || parsed.data
            console.error('[智能查询] 错误:', errorMsg)
            if (onError && errorMsg) {
              onError(errorMsg)
            }
            break

          case 'done':
            // 完成标记
            console.log('[智能查询] 服务器标记完成')
            break

          default:
            // 兼容：如果没有type字段，检查是否有data或content字段
            if (parsed.data !== undefined && onChunk) {
              onChunk(parsed.data)
            } else if (parsed.content !== undefined && onChunk) {
              onChunk(parsed.content)
            }
        }
      } catch (parseError) {
        console.error('[智能查询] JSON解析失败:', parseError, '原始数据:', jsonData)
      }
    }

    while (true) {
      const { value, done } = await reader.read()

      if (done) {
        console.log('[智能查询] 流式响应完成')
        // 处理剩余数据
        if (buffer.trim()) {
          const remainingEvents = buffer.split(/data:\s*/g).filter(s => s.trim())
          for (const event of remainingEvents) {
            if (event !== '[DONE]' && event.trim()) {
              processSSEEvent(event.trim())
            }
          }
        }
        break
      }

      buffer += decoder.decode(value, { stream: true })

      // 处理buffer中的所有完整事件
      // 匹配 data: {...} 格式，即使没有换行符也能正确分割
      let startIndex = 0
      while (true) {
        // 查找下一个 "data:" 的位置
        const dataIndex = buffer.indexOf('data:', startIndex)

        if (dataIndex === -1) {
          // 没有找到更多的 "data:"，检查是否有剩余数据
          if (startIndex < buffer.length) {
            const remaining = buffer.substring(startIndex).trim()
            if (remaining && remaining !== '[DONE]') {
              // 尝试解析剩余数据
              processSSEEvent(remaining)
            }
          }
          // 清空buffer，保留未处理的字符(如果有)
          buffer = ''
          break
        }

        // 找到了 "data:"，提取JSON内容
        // 从 dataIndex + 5 开始（跳过 "data:"），找到下一个 "data:" 或结尾
        const jsonStart = dataIndex + 5
        let jsonEnd = buffer.indexOf('data:', jsonStart)

        if (jsonEnd === -1) {
          // 没有找到下一个 "data:"，可能是数据不完整，等待更多数据
          // 但先尝试解析当前已有的数据
          const partialJson = buffer.substring(jsonStart).trim()
          if (partialJson && partialJson !== '[DONE]') {
            // 尝试解析，如果失败则保留在buffer中
            try {
              JSON.parse(partialJson)
              // JSON有效，处理它
              processSSEEvent(partialJson)
              buffer = ''
              startIndex = 0
            } catch {
              // JSON不完整，保留在buffer中
              break
            }
          } else {
            buffer = ''
            startIndex = 0
          }
          break
        }

        // 提取JSON内容
        let jsonStr = buffer.substring(jsonStart, jsonEnd).trim()

        // 移除可能的前导空格和 "data:" 前缀（如果有）
        while (jsonStr.startsWith('data:')) {
          jsonStr = jsonStr.substring(5).trim()
        }

        // 处理提取的JSON
        if (jsonStr && jsonStr !== '[DONE]') {
          processSSEEvent(jsonStr)
        }

        // 移动到下一个事件
        startIndex = jsonEnd
      }

      // 如果buffer太长，清空它防止内存泄漏
      if (buffer.length > 100000) {
        buffer = ''
      }
    }

    return {
      conversation_id: resultConversationId,
      mode,
      model_name
    }

  } catch (error) {
    console.error('[智能查询] 请求失败:', error)
    throw error
  }
}

/**
 * 获取对话列表
 * @param {string} [userId] - 用户ID（可选）
 */
export const getConversations = async (userId = null) => {
  const token = getToken()
  const params = userId ? `?user_id=${userId}` : ''
  const response = await fetch(`/api/${INTELLIGENT_SEARCH_BASE_URL}/conversations${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  if (!response.ok) {
    throw new Error(`获取对话列表失败: ${response.status}`)
  }
  return await response.json()
}

/**
 * 获取对话详情
 * @param {string} conversationId - 会话ID
 */
export const getConversation = async (conversationId) => {
  const token = getToken()
  const response = await fetch(`/api/${INTELLIGENT_SEARCH_BASE_URL}/conversations/${conversationId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  if (!response.ok) {
    throw new Error(`获取对话详情失败: ${response.status}`)
  }
  return await response.json()
}

/**
 * 获取会话消息列表
 * @param {string} conversationId - 会话ID
 * @param {number} [limit=50] - 返回消息数量限制
 */
export const getConversationMessages = async (conversationId, limit = 50) => {
  const token = getToken()
  const response = await fetch(`/api/${INTELLIGENT_SEARCH_BASE_URL}/conversations/${conversationId}/messages?limit=${limit}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  if (!response.ok) {
    throw new Error(`获取消息列表失败: ${response.status}`)
  }
  return await response.json()
}

/**
 * 删除对话
 * @param {string} conversationId - 会话ID
 * @param {string} [userId] - 用户ID（用于权限检查）
 */
export const deleteConversation = async (conversationId, userId = null) => {
  const token = getToken()
  const params = userId ? `?user_id=${userId}` : ''
  const response = await fetch(`/api/${INTELLIGENT_SEARCH_BASE_URL}/conversations/${conversationId}${params}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  if (!response.ok) {
    throw new Error(`删除对话失败: ${response.status}`)
  }
  return await response.json()
}

/**
 * 切换联网搜索
 * @param {string} conversationId - 会话ID
 * @param {boolean} enabled - 是否启用
 */
export const toggleOnlineSearch = async (conversationId, enabled) => {
  const token = getToken()
  const response = await fetch(`/api/${INTELLIGENT_SEARCH_BASE_URL}/conversations/${conversationId}/online-search?enabled=${enabled}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  if (!response.ok) {
    throw new Error(`切换联网搜索失败: ${response.status}`)
  }
  return await response.json()
}

/**
 * 切换深度推理
 * @param {string} conversationId - 会话ID
 * @param {boolean} enabled - 是否启用
 */
export const toggleDeepReasoning = async (conversationId, enabled) => {
  const token = getToken()
  const response = await fetch(`/api/${INTELLIGENT_SEARCH_BASE_URL}/conversations/${conversationId}/deep-reasoning?enabled=${enabled}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  if (!response.ok) {
    throw new Error(`切换深度推理失败: ${response.status}`)
  }
  return await response.json()
}

/**
 * 获取可用的大模型列表
 */
export const getAvailableModels = async () => {
  const token = getToken()
  const response = await fetch(`/api/${INTELLIGENT_SEARCH_BASE_URL}/models`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  if (!response.ok) {
    throw new Error(`获取模型列表失败: ${response.status}`)
  }
  return await response.json()
}

/**
 * 健康检查
 */
export const healthCheck = async () => {
  const response = await fetch(`/api/${INTELLIGENT_SEARCH_BASE_URL}/health`)
  if (!response.ok) {
    throw new Error(`健康检查失败: ${response.status}`)
  }
  return await response.json()
}

/**
 * 获取会话的活跃文档列表
 * @param {string} conversationId - 会话ID
 */
export const getConversationDocuments = async (conversationId) => {
  const token = getToken()
  const response = await fetch(`/api/${INTELLIGENT_SEARCH_BASE_URL}/conversations/${conversationId}/documents`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  if (!response.ok) {
    throw new Error(`获取文档列表失败: ${response.status}`)
  }
  return await response.json()
}

/**
 * 设置会话的活跃文档列表
 * @param {string} conversationId - 会话ID
 * @param {Array<string>} documentIds - 文档ID列表
 */
export const setConversationDocuments = async (conversationId, documentIds) => {
  const token = getToken()
  const response = await fetch(`/api/${INTELLIGENT_SEARCH_BASE_URL}/conversations/${conversationId}/documents/set`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ document_ids: documentIds })
  })
  if (!response.ok) {
    throw new Error(`设置文档列表失败: ${response.status}`)
  }
  return await response.json()
}

/**
 * 向会话添加文档
 * @param {string} conversationId - 会话ID
 * @param {Array<string>} documentIds - 文档ID列表
 */
export const addConversationDocuments = async (conversationId, documentIds) => {
  const token = getToken()
  const response = await fetch(`/api/${INTELLIGENT_SEARCH_BASE_URL}/conversations/${conversationId}/documents/add`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ document_ids: documentIds })
  })
  if (!response.ok) {
    throw new Error(`添加文档失败: ${response.status}`)
  }
  return await response.json()
}

/**
 * 从会话移除文档
 * @param {string} conversationId - 会话ID
 * @param {Array<string>} documentIds - 文档ID列表
 */
export const removeConversationDocuments = async (conversationId, documentIds) => {
  const token = getToken()
  const response = await fetch(`/api/${INTELLIGENT_SEARCH_BASE_URL}/conversations/${conversationId}/documents/remove`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ document_ids: documentIds })
  })
  if (!response.ok) {
    throw new Error(`移除文档失败: ${response.status}`)
  }
  return await response.json()
}

/**
 * 清空会话的活跃文档
 * @param {string} conversationId - 会话ID
 */
export const clearConversationDocuments = async (conversationId) => {
  const token = getToken()
  const response = await fetch(`/api/${INTELLIGENT_SEARCH_BASE_URL}/conversations/${conversationId}/documents`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  if (!response.ok) {
    throw new Error(`清空文档列表失败: ${response.status}`)
  }
  return await response.json()
}

export default {
  intelligentQuery,
  getConversations,
  getConversation,
  getConversationMessages,
  deleteConversation,
  toggleOnlineSearch,
  toggleDeepReasoning,
  getAvailableModels,
  healthCheck,
  getConversationDocuments,
  setConversationDocuments,
  addConversationDocuments,
  removeConversationDocuments,
  clearConversationDocuments
}
