/**
 * 知识图谱实体Store
 * 使用Pinia进行状态管理
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  getEntityDetail,
  getEntityList as getEntityListApi,
  searchEntities as searchEntitiesApi,
  createEntity as createEntityApi,
  updateEntity as updateEntityApi,
  deleteEntity as deleteEntityApi,
  getEntityRelations,
  mergeEntities as mergeEntitiesApi
} from '../../api/knowledgeGraph.js'

export const useEntityStore = defineStore('knowledgeGraph/entity', () => {
  // ==================== 状态 ====================

  const entities = ref([])
  const selectedEntity = ref(null)
  const entityRelations = ref([])
  const searchResults = ref([])
  const loading = ref(false)
  const error = ref(null)

  // 分页
  const pagination = ref({
    page: 1,
    size: 20,
    total: 0
  })

  // 筛选条件
  const filters = ref({
    entityType: '',
    searchQuery: ''
  })

  // ==================== 计算属性 ====================

  const hasEntities = computed(() => entities.value.length > 0)
  const hasSelectedEntity = computed(() => selectedEntity.value !== null)
  const totalPages = computed(() => Math.ceil(pagination.value.total / pagination.value.size))

  // ==================== Actions ====================

  /**
   * 获取实体列表
   */
  async function getEntityList(namespaceId, params = {}) {
    loading.value = true
    error.value = null
    try {
      const response = await getEntityListApi(namespaceId, {
        page: params.page || pagination.value.page,
        size: params.size || pagination.value.size,
        entity_type: params.entityType || filters.value.entityType
      })

      if (response.code === 200) {
        entities.value = response.data?.entities || []
        pagination.value = {
          page: response.data?.page || 1,
          size: response.data?.size || 20,
          total: response.data?.total || 0
        }
      }

      return entities.value
    } catch (err) {
      error.value = err.message
      console.error('获取实体列表失败:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 获取实体详情
   */
  async function getEntityById(namespaceId, entityId) {
    loading.value = true
    error.value = null
    try {
      const response = await getEntityDetail(namespaceId, entityId)
      if (response.code === 200) {
        selectedEntity.value = response.data
      }
      return selectedEntity.value
    } catch (err) {
      error.value = err.message
      console.error('获取实体详情失败:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 搜索实体
   */
  async function searchEntities(namespaceId, query, options = {}) {
    loading.value = true
    error.value = null
    try {
      const response = await searchEntitiesApi({
        namespace_id: namespaceId,
        query,
        entity_types: options.entityTypes || [],
        limit: options.limit || 20
      })

      if (response.code === 200) {
        searchResults.value = response.data?.results || []
      }

      return searchResults.value
    } catch (err) {
      error.value = err.message
      console.error('搜索实体失败:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 创建实体
   */
  async function createEntity(namespaceId, data) {
    loading.value = true
    error.value = null
    try {
      const response = await createEntityApi({
        namespace_id: namespaceId,
        ...data
      })

      if (response.code === 200) {
        // 重新加载列表
        await getEntityList(namespaceId)
      }

      return response.data
    } catch (err) {
      error.value = err.message
      console.error('创建实体失败:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 更新实体
   */
  async function updateEntity(namespaceId, entityId, data) {
    loading.value = true
    error.value = null
    try {
      const response = await updateEntityApi(namespaceId, entityId, data)

      if (response.code === 200) {
        // 更新本地状态
        if (selectedEntity.value?.entity_id === entityId) {
          selectedEntity.value = { ...selectedEntity.value, ...data }
        }

        // 更新列表中的实体
        const index = entities.value.findIndex(e => e.entity_id === entityId)
        if (index !== -1) {
          entities.value[index] = { ...entities.value[index], ...data }
        }
      }

      return response
    } catch (err) {
      error.value = err.message
      console.error('更新实体失败:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 删除实体
   */
  async function deleteEntity(namespaceId, entityId) {
    loading.value = true
    error.value = null
    try {
      const response = await deleteEntityApi(namespaceId, entityId)

      if (response.code === 200) {
        // 从列表中移除
        entities.value = entities.value.filter(e => e.entity_id !== entityId)

        // 如果删除的是选中实体，清空选择
        if (selectedEntity.value?.entity_id === entityId) {
          selectedEntity.value = null
        }
      }

      return response
    } catch (err) {
      error.value = err.message
      console.error('删除实体失败:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 获取实体关系
   */
  async function getRelations(namespaceId, entityId) {
    loading.value = true
    error.value = null
    try {
      const response = await getEntityRelations(namespaceId, entityId)
      if (response.code === 200) {
        entityRelations.value = response.data?.relations || []
      }
      return entityRelations.value
    } catch (err) {
      error.value = err.message
      console.error('获取实体关系失败:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 合并实体
   */
  async function mergeEntities(namespaceId, sourceEntityId, targetEntityId) {
    loading.value = true
    error.value = null
    try {
      const response = await mergeEntitiesApi({
        namespace_id: namespaceId,
        source_entity_id: sourceEntityId,
        target_entity_id: targetEntityId
      })

      if (response.code === 200) {
        // 重新加载列表
        await getEntityList(namespaceId)
      }

      return response
    } catch (err) {
      error.value = err.message
      console.error('合并实体失败:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 设置筛选条件
   */
  function setFilters(newFilters) {
    filters.value = { ...filters.value, ...newFilters }
    pagination.value.page = 1
  }

  /**
   * 设置分页
   */
  function setPage(page) {
    pagination.value.page = page
  }

  /**
   * 设置每页数量
   */
  function setSize(size) {
    pagination.value.size = size
    pagination.value.page = 1
  }

  /**
   * 清空选择
   */
  function clearSelection() {
    selectedEntity.value = null
    entityRelations.value = []
  }

  /**
   * 清空搜索结果
   */
  function clearSearchResults() {
    searchResults.value = []
  }

  // ==================== 导出 ====================

  return {
    // 状态
    entities,
    selectedEntity,
    entityRelations,
    searchResults,
    loading,
    error,
    pagination,
    filters,

    // 计算属性
    hasEntities,
    hasSelectedEntity,
    totalPages,

    // Actions
    getEntityList,
    getEntityById,
    searchEntities,
    createEntity,
    updateEntity,
    deleteEntity,
    getRelations,
    mergeEntities,
    setFilters,
    setPage,
    setSize,
    clearSelection,
    clearSearchResults
  }
})
