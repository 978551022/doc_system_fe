import request from './document.js'

const KG_BASE_URL = '/v1/kg'

// ==================== 1. 命名空间管理 ====================

/**
 * 1.1 创建命名空间
 * POST /api/v1/kg/graph/namespace/create
 */
export const createNamespace = async (data) => {
  return request.post(`${KG_BASE_URL}/graph/namespace/create`, data)
}

/**
 * 1.2 获取命名空间列表
 * GET /api/v1/kg/graph/namespace/list
 */
export const getNamespaceList = async () => {
  return request.get(`${KG_BASE_URL}/graph/namespace/list`)
}

/**
 * 1.3 获取命名空间详情
 * GET /api/v1/kg/graph/namespace/{namespace_id}
 */
export const getNamespaceDetail = async (namespaceId) => {
  return request.get(`${KG_BASE_URL}/graph/namespace/${namespaceId}`)
}

/**
 * 1.4 更新命名空间
 * PUT /api/v1/kg/graph/namespace/{namespace_id}
 */
export const updateNamespace = async (namespaceId, data) => {
  return request.put(`${KG_BASE_URL}/graph/namespace/${namespaceId}`, data)
}

/**
 * 1.5 删除命名空间
 * DELETE /api/v1/kg/graph/namespace/{namespace_id}
 */
export const deleteNamespace = async (namespaceId) => {
  return request.delete(`${KG_BASE_URL}/graph/namespace/${namespaceId}`)
}

/**
 * 1.6 获取命名空间统计
 * GET /api/v1/kg/graph/namespace/{namespace_id}/stats
 */
export const getNamespaceStats = async (namespaceId) => {
  return request.get(`${KG_BASE_URL}/graph/namespace/${namespaceId}/stats`)
}

// ==================== 2. 实体管理 ====================

/**
 * 2.1 创建实体
 * POST /api/v1/kg/entities/
 */
export const createEntity = async (data) => {
  return request.post(`${KG_BASE_URL}/entities/`, data)
}

/**
 * 2.2 获取实体详情
 * GET /api/v1/kg/entities/{namespace_id}/{entity_id}
 */
export const getEntityDetail = async (namespaceId, entityId) => {
  return request.get(`${KG_BASE_URL}/entities/${namespaceId}/${entityId}`)
}

/**
 * 2.3 获取实体列表
 * GET /api/v1/kg/entities/{namespace_id}?entity_type=person&page=1&size=100
 */
export const getEntityList = async (namespaceId, params = {}) => {
  const { page = 1, size = 100, entity_type } = params
  return request.get(`${KG_BASE_URL}/entities/${namespaceId}`, {
    params: { page, size, entity_type }
  })
}

/**
 * 2.4 搜索实体
 * POST /api/v1/kg/entities/search
 */
export const searchEntities = async (data) => {
  return request.post(`${KG_BASE_URL}/entities/search`, data)
}

/**
 * 2.5 更新实体
 * PUT /api/v1/kg/entities/{namespace_id}/{entity_id}
 */
export const updateEntity = async (namespaceId, entityId, data) => {
  return request.put(`${KG_BASE_URL}/entities/${namespaceId}/${entityId}`, data)
}

/**
 * 2.6 删除实体
 * DELETE /api/v1/kg/entities/{namespace_id}/{entity_id}
 */
export const deleteEntity = async (namespaceId, entityId) => {
  return request.delete(`${KG_BASE_URL}/entities/${namespaceId}/${entityId}`)
}

/**
 * 2.7 获取实体的关系
 * GET /api/v1/kg/entities/{namespace_id}/{entity_id}/relations
 */
export const getEntityRelations = async (namespaceId, entityId) => {
  return request.get(`${KG_BASE_URL}/entities/${namespaceId}/${entityId}/relations`)
}

/**
 * 2.8 获取实体的来源文档
 * GET /api/v1/kg/entities/{namespace_id}/{entity_id}/documents
 */
export const getEntityDocuments = async (namespaceId, entityId) => {
  return request.get(`${KG_BASE_URL}/entities/${namespaceId}/${entityId}/documents`)
}

/**
 * 2.9 合并实体
 * POST /api/v1/kg/entities/merge
 */
export const mergeEntities = async (data) => {
  return request.post(`${KG_BASE_URL}/entities/merge`, data)
}

// ==================== 3. 关系管理 ====================

/**
 * 3.1 创建关系
 * POST /api/v1/kg/relations/
 */
export const createRelation = async (data) => {
  return request.post(`${KG_BASE_URL}/relations/`, data)
}

/**
 * 3.2 获取关系详情
 * GET /api/v1/kg/relations/{namespace_id}/{relation_id}
 */
export const getRelationDetail = async (namespaceId, relationId) => {
  return request.get(`${KG_BASE_URL}/relations/${namespaceId}/${relationId}`)
}

/**
 * 3.3 获取关系列表
 * GET /api/v1/kg/relations/{namespace_id}?entity_id=xxx&page=1&size=100
 */
export const getRelationList = async (namespaceId, params = {}) => {
  const { entity_id, page = 1, size = 100 } = params
  return request.get(`${KG_BASE_URL}/relations/${namespaceId}`, {
    params: { entity_id, page, size }
  })
}

/**
 * 3.4 更新关系
 * PUT /api/v1/kg/relations/{namespace_id}/{relation_id}
 */
export const updateRelation = async (namespaceId, relationId, data) => {
  return request.put(`${KG_BASE_URL}/relations/${namespaceId}/${relationId}`, data)
}

/**
 * 3.5 删除关系
 * DELETE /api/v1/kg/relations/{namespace_id}/{relation_id}
 */
export const deleteRelation = async (namespaceId, relationId) => {
  return request.delete(`${KG_BASE_URL}/relations/${namespaceId}/${relationId}`)
}

/**
 * 3.6 查找路径
 * GET /api/v1/kg/relations/{namespace_id}/path?source_entity=xxx&target_entity=yyy&max_depth=3
 */
export const getEntityPath = async (namespaceId, params = {}) => {
  const { source_entity, target_entity, max_depth = 3 } = params
  return request.get(`${KG_BASE_URL}/relations/${namespaceId}/path`, {
    params: { source_entity, target_entity, max_depth }
  })
}

/**
 * 3.7 节点邻域
 * GET /api/v1/kg/relations/{namespace_id}/{entity_id}/neighborhood?depth=2
 */
export const getNodeNeighborhood = async (namespaceId, entityId, params = {}) => {
  const { depth = 2 } = params
  return request.get(`${KG_BASE_URL}/relations/${namespaceId}/${entityId}/neighborhood`, {
    params: { depth }
  })
}

/**
 * 3.8 批量删除关系
 * DELETE /api/v1/kg/relations/{namespace_id}/batch?entity_id=xxx
 */
export const batchDeleteRelations = async (namespaceId, params = {}) => {
  const { entity_id } = params
  return request.delete(`${KG_BASE_URL}/relations/${namespaceId}/batch`, {
    params: { entity_id }
  })
}

// ==================== 4. 图谱可视化 ====================

/**
 * 4.1 获取全图谱数据
 * GET /api/v1/kg/visualization/graph/{namespace_id}?page=1&size=100
 */
export const getGraphData = async (namespaceId, params = {}) => {
  const { page = 1, size = 100 } = params
  return request.get(`${KG_BASE_URL}/visualization/graph/${namespaceId}`, {
    params: { page, size }
  })
}

/**
 * 4.2 获取子图数据
 * GET /api/v1/kg/visualization/subgraph/{namespace_id}/{center_entity_id}?depth=2
 */
export const getSubGraph = async (namespaceId, centerEntityId, params = {}) => {
  const { depth = 2 } = params
  return request.get(`${KG_BASE_URL}/visualization/subgraph/${namespaceId}/${centerEntityId}`, {
    params: { depth }
  })
}

/**
 * 4.3 获取聚类图数据
 * GET /api/v1/kg/visualization/cluster/{namespace_id}?min_cluster_size=3
 */
export const getClusterGraph = async (namespaceId, params = {}) => {
  const { min_cluster_size = 3 } = params
  return request.get(`${KG_BASE_URL}/visualization/cluster/${namespaceId}`, {
    params: { min_cluster_size }
  })
}

/**
 * 4.4 获取可视化统计
 * GET /api/v1/kg/visualization/stats/{namespace_id}
 */
export const getVisualizationStats = async (namespaceId) => {
  return request.get(`${KG_BASE_URL}/visualization/stats/${namespaceId}`)
}

/**
 * 4.5 计算布局
 * POST /api/v1/kg/visualization/layout/{namespace_id}?layout_type=force
 */
export const computeLayout = async (namespaceId, params = {}) => {
  const { layout_type = 'force' } = params
  return request.post(`${KG_BASE_URL}/visualization/layout/${namespaceId}`, null, {
    params: { layout_type }
  })
}

/**
 * 4.6 获取实体类型配置
 * GET /api/v1/kg/visualization/entity-types/config
 */
export const getEntityTypeConfig = async () => {
  return request.get(`${KG_BASE_URL}/visualization/entity-types/config`)
}

/**
 * 4.7 获取关系类型配置
 * GET /api/v1/kg/visualization/relation-types/config
 */
export const getRelationTypeConfig = async () => {
  return request.get(`${KG_BASE_URL}/visualization/relation-types/config`)
}

// ==================== 5. 文档图谱构建 ====================

/**
 * 5.1 构建图谱 (同步)
 * POST /api/v1/kg/documents/build
 */
export const buildFromDocument = async (data) => {
  return request.post(`${KG_BASE_URL}/documents/build`, data, {
    timeout: 300000 // 5分钟超时
  })
}

/**
 * 5.2 异步构建
 * POST /api/v1/kg/documents/build/async
 */
export const buildFromDocumentAsync = async (data) => {
  return request.post(`${KG_BASE_URL}/documents/build/async`, data)
}

/**
 * 5.3 批量构建
 * POST /api/v1/kg/documents/build/batch
 */
export const buildFromDocumentsBatch = async (data) => {
  return request.post(`${KG_BASE_URL}/documents/build/batch`, data, {
    timeout: 600000 // 10分钟超时
  })
}

/**
 * 5.4 查询构建任务状态
 * GET /api/v1/kg/documents/build/status/{task_id}
 */
export const getBuildTaskStatus = async (taskId) => {
  return request.get(`${KG_BASE_URL}/documents/build/status/${taskId}`)
}

/**
 * 5.5 删除文档图谱
 * DELETE /api/v1/kg/documents/{namespace_id}/{document_id}
 */
export const deleteDocumentGraph = async (namespaceId, documentId) => {
  return request.delete(`${KG_BASE_URL}/documents/${namespaceId}/${documentId}`)
}

/**
 * 5.6 获取文档实体列表
 * GET /api/v1/kg/documents/{namespace_id}/{document_id}/entities
 */
export const getDocumentEntities = async (namespaceId, documentId) => {
  return request.get(`${KG_BASE_URL}/documents/${namespaceId}/${documentId}/entities`)
}

/**
 * 5.7 获取构建任务列表
 * GET /api/v1/kg/documents/{namespace_id}/tasks?status=completed&page=1
 */
export const getBuildTaskList = async (namespaceId, params = {}) => {
  const { status, page = 1 } = params
  return request.get(`${KG_BASE_URL}/documents/${namespaceId}/tasks`, {
    params: { status, page }
  })
}

/**
 * 5.8 重建命名空间
 * POST /api/v1/kg/documents/rebuild/{namespace_id}
 */
export const rebuildNamespace = async (namespaceId) => {
  return request.post(`${KG_BASE_URL}/documents/rebuild/${namespaceId}`)
}

/**
 * 5.9 获取存储使用情况
 * GET /api/v1/kg/documents/storage/{user_id}
 */
export const getDocumentStorage = async (userId) => {
  return request.get(`${KG_BASE_URL}/documents/storage/${userId}`)
}

// ==================== 6. 用户配置 ====================

/**
 * 6.1 获取用户配置
 * GET /api/v1/kg/config/{user_id}
 */
export const getUserConfig = async (userId) => {
  return request.get(`${KG_BASE_URL}/config/${userId}`)
}

/**
 * 6.2 更新用户配置
 * PUT /api/v1/kg/config/{user_id}
 */
export const updateUserConfig = async (userId, data) => {
  return request.put(`${KG_BASE_URL}/config/${userId}`, data)
}

/**
 * 6.3 确保默认命名空间
 * POST /api/v1/kg/config/{user_id}/ensure-namespace
 */
export const ensureDefaultNamespace = async (userId) => {
  return request.post(`${KG_BASE_URL}/config/${userId}/ensure-namespace`)
}

/**
 * 6.4 获取默认实体类型
 * GET /api/v1/kg/config/defaults/entity-types
 */
export const getDefaultEntityTypes = async () => {
  return request.get(`${KG_BASE_URL}/config/defaults/entity-types`)
}

/**
 * 6.5 获取默认关系类型
 * GET /api/v1/kg/config/defaults/relation-types
 */
export const getDefaultRelationTypes = async () => {
  return request.get(`${KG_BASE_URL}/config/defaults/relation-types`)
}

/**
 * 6.6 重置用户配置
 * POST /api/v1/kg/config/reset/{user_id}
 */
export const resetUserConfig = async (userId) => {
  return request.post(`${KG_BASE_URL}/config/reset/${userId}`)
}

/**
 * 6.7 导出用户数据
 * GET /api/v1/kg/config/export/{user_id}
 */
export const exportUserData = async (userId) => {
  return request.get(`${KG_BASE_URL}/config/export/${userId}`, {
    responseType: 'blob'
  })
}

/**
 * 6.8 导入用户数据
 * POST /api/v1/kg/config/import/{user_id}
 */
export const importUserData = async (userId, data) => {
  return request.post(`${KG_BASE_URL}/config/import/${userId}`, data)
}

// ==================== 7. 实体消歧 ====================

/**
 * 7.1 查找重复实体
 * POST /api/v1/kg/disambiguation/find-duplicates
 */
export const findDuplicateEntities = async (data) => {
  return request.post(`${KG_BASE_URL}/disambiguation/find-duplicates`, data)
}

/**
 * 7.2 建议合并
 * POST /api/v1/kg/disambiguation/suggest-merge
 */
export const suggestMerge = async (data) => {
  return request.post(`${KG_BASE_URL}/disambiguation/suggest-merge`, data)
}

/**
 * 7.3 合并实体
 * POST /api/v1/kg/disambiguation/merge
 */
export const mergeEntitiesByDisambiguation = async (data) => {
  return request.post(`${KG_BASE_URL}/disambiguation/merge`, data)
}

/**
 * 7.4 获取合并候选
 * GET /api/v1/kg/disambiguation/{namespace_id}/candidates/{entity_name}
 */
export const getMergeCandidates = async (namespaceId, entityName) => {
  return request.get(`${KG_BASE_URL}/disambiguation/${namespaceId}/candidates/${entityName}`)
}

/**
 * 7.5 获取待处理消歧任务
 * GET /api/v1/kg/disambiguation/{namespace_id}/pending?page=1
 */
export const getPendingDisambiguationTasks = async (namespaceId, params = {}) => {
  const { page = 1 } = params
  return request.get(`${KG_BASE_URL}/disambiguation/${namespaceId}/pending`, {
    params: { page }
  })
}

/**
 * 7.6 自动合并
 * POST /api/v1/kg/disambiguation/{namespace_id}/auto-merge?confidence_threshold=0.9
 */
export const autoMergeEntities = async (namespaceId, params = {}) => {
  const { confidence_threshold = 0.9 } = params
  return request.post(`${KG_BASE_URL}/disambiguation/${namespaceId}/auto-merge`, null, {
    params: { confidence_threshold }
  })
}

/**
 * 7.7 获取消歧统计
 * GET /api/v1/kg/disambiguation/stats/{namespace_id}
 */
export const getDisambiguationStats = async (namespaceId) => {
  return request.get(`${KG_BASE_URL}/disambiguation/stats/${namespaceId}`)
}

// ==================== 8. 知识推理 ====================

/**
 * 8.1 图谱推理
 * POST /api/v1/kg/inference/reason
 */
export const multiHopReasoning = async (data) => {
  return request.post(`${KG_BASE_URL}/inference/reason`, data)
}

/**
 * 8.2 推理链生成
 * POST /api/v1/kg/inference/chain
 */
export const generateReasoningChain = async (data) => {
  return request.post(`${KG_BASE_URL}/inference/chain`, data)
}

/**
 * 8.3 解释关系
 * GET /api/v1/kg/inference/{namespace_id}/explain?source_entity=xxx&target_entity=yyy
 */
export const explainRelation = async (namespaceId, params = {}) => {
  const { source_entity, target_entity } = params
  return request.get(`${KG_BASE_URL}/inference/${namespaceId}/explain`, {
    params: { source_entity, target_entity }
  })
}

/**
 * 8.4 获取邻居
 * GET /api/v1/kg/inference/{namespace_id}/neighbors/{entity_id}?depth=2
 */
export const getEntityNeighbors = async (namespaceId, entityId, params = {}) => {
  const { depth = 2 } = params
  return request.get(`${KG_BASE_URL}/inference/${namespaceId}/neighbors/${entityId}`, {
    params: { depth }
  })
}

/**
 * 8.5 建议连接
 * POST /api/v1/kg/inference/{namespace_id}/connect
 */
export const suggestConnections = async (namespaceId, entityIds) => {
  return request.post(`${KG_BASE_URL}/inference/${namespaceId}/connect`, entityIds)
}

/**
 * 8.6 获取推理统计
 * GET /api/v1/kg/inference/{namespace_id}/stats
 */
export const getInferenceStats = async (namespaceId) => {
  return request.get(`${KG_BASE_URL}/inference/${namespaceId}/stats`)
}

// ==================== 9. 智能搜索集成 ====================

/**
 * 9.1 启用KG增强的查询 (SSE流式)
 */
export const intelligentSearchWithGraph = async (
  params,
  onChunk,
  onMetadata,
  onError,
  onComplete,
  signal = null
) => {
  const { query, mode = 'general', enableKg = true, kgNamespaceId, stream = true } = params

  const url = '/api/v1/docsearch/intelligent-search/query'

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      },
      body: JSON.stringify({
        query,
        mode,
        enable_kg: enableKg,
        kg_namespace_id: kgNamespaceId,
        stream
      }),
      signal
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()

      if (done) {
        if (onComplete) onComplete()
        break
      }

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop()

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6))

            switch (data.type) {
              case 'metadata':
                if (onMetadata) onMetadata(data.data)
                break
              case 'content':
                if (onChunk) onChunk(data.data)
                break
              case 'error':
                if (onError) onError(data.data)
                break
              case 'done':
                if (onComplete) onComplete()
                break
            }
          } catch (e) {
            console.error('Failed to parse SSE data:', e)
          }
        }
      }
    }
  } catch (error) {
    if (error.name !== 'AbortError' && onError) {
      onError(error.message)
    }
    throw error
  }
}

/**
 * 9.2 启用KG增强的语音问答
 */
export const voiceSearchWithGraph = async (params) => {
  const {
    uploadId,
    modelName = 'glm',
    enableKg = true,
    kgNamespaceId,
    onlineSearch = false,
    deepReasoning = false
  } = params

  return request.post('/api/v1/docsearch/voice/complete', {
    upload_id: uploadId,
    model_name: modelName,
    enable_kg: enableKg,
    kg_namespace_id: kgNamespaceId,
    online_search: onlineSearch,
    deep_reasoning: deepReasoning
  })
}
