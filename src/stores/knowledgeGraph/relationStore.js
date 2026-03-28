/**
 * 知识图谱关系Store
 * 使用Pinia进行状态管理
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  getRelationDetail,
  getRelationList as getRelationListApi,
  createRelation as createRelationApi,
  updateRelation as updateRelationApi,
  deleteRelation as deleteRelationApi
} from '../../api/knowledgeGraph.js'

export const useRelationStore = defineStore('knowledgeGraph/relation', () => {
  // ==================== 状态 ====================

  const relations = ref([])
  const selectedRelation = ref(null)
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
    relationType: '',
    searchQuery: ''
  })

  // ==================== 计算属性 ====================

  const hasRelations = computed(() => relations.value.length > 0)
  const hasSelectedRelation = computed(() => selectedRelation.value !== null)
  const totalPages = computed(() => Math.ceil(pagination.value.total / pagination.value.size))

  // ==================== Actions ====================

  /**
   * 获取关系列表
   */
  async function getRelationList(namespaceId, params = {}) {
    loading.value = true
    error.value = null
    try {
      const response = await getRelationListApi(namespaceId, {
        page: params.page || pagination.value.page,
        size: params.size || pagination.value.size
      })

      if (response.code === 200) {
        relations.value = response.data?.relations || []
        pagination.value = {
          page: response.data?.page || 1,
          size: response.data?.size || 20,
          total: response.data?.total || 0
        }
      }

      return relations.value
    } catch (err) {
      error.value = err.message
      console.error('获取关系列表失败:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 获取关系详情
   */
  async function getRelationById(namespaceId, relationId) {
    loading.value = true
    error.value = null
    try {
      const response = await getRelationDetail(namespaceId, relationId)
      if (response.code === 200) {
        selectedRelation.value = response.data
      }
      return selectedRelation.value
    } catch (err) {
      error.value = err.message
      console.error('获取关系详情失败:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 创建关系
   */
  async function createRelation(namespaceId, data) {
    loading.value = true
    error.value = null
    try {
      const response = await createRelationApi({
        namespace_id: namespaceId,
        ...data
      })

      if (response.code === 200) {
        // 重新加载列表
        await getRelationList(namespaceId)
      }

      return response.data
    } catch (err) {
      error.value = err.message
      console.error('创建关系失败:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 更新关系
   */
  async function updateRelation(namespaceId, relationId, data) {
    loading.value = true
    error.value = null
    try {
      const response = await updateRelationApi(namespaceId, relationId, data)

      if (response.code === 200) {
        // 更新本地状态
        if (selectedRelation.value?.relation_id === relationId) {
          selectedRelation.value = { ...selectedRelation.value, ...data }
        }

        // 更新列表中的关系
        const index = relations.value.findIndex(r => r.relation_id === relationId)
        if (index !== -1) {
          relations.value[index] = { ...relations.value[index], ...data }
        }
      }

      return response
    } catch (err) {
      error.value = err.message
      console.error('更新关系失败:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 删除关系
   */
  async function deleteRelation(namespaceId, relationId) {
    loading.value = true
    error.value = null
    try {
      const response = await deleteRelationApi(namespaceId, relationId)

      if (response.code === 200) {
        // 从列表中移除
        relations.value = relations.value.filter(r => r.relation_id !== relationId)

        // 如果删除的是选中关系，清空选择
        if (selectedRelation.value?.relation_id === relationId) {
          selectedRelation.value = null
        }
      }

      return response
    } catch (err) {
      error.value = err.message
      console.error('删除关系失败:', err)
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
    selectedRelation.value = null
  }

  // ==================== 导出 ====================

  return {
    // 状态
    relations,
    selectedRelation,
    loading,
    error,
    pagination,
    filters,

    // 计算属性
    hasRelations,
    hasSelectedRelation,
    totalPages,

    // Actions
    getRelationList,
    getRelationById,
    createRelation,
    updateRelation,
    deleteRelation,
    setFilters,
    setPage,
    setSize,
    clearSelection
  }
})
