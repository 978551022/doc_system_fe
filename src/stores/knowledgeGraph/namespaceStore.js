/**
 * 知识图谱命名空间Store
 * 使用Pinia进行状态管理
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  getNamespaceList,
  getNamespaceDetail,
  getNamespaceStats,
  createNamespace,
  updateNamespace,
  deleteNamespace as deleteNamespaceApi
} from '../../api/knowledgeGraph.js'

export const useNamespaceStore = defineStore('knowledgeGraph/namespace', () => {
  // ==================== 状态 ====================

  const namespaces = ref([])
  const currentNamespace = ref(null)
  const namespaceStats = ref(null)
  const loading = ref(false)
  const error = ref(null)

  // ==================== 计算属性 ====================

  const currentNamespaceId = computed(() => currentNamespace.value?.id)

  const namespaceOptions = computed(() => {
    return namespaces.value.map(ns => ({
      label: ns.name,
      value: ns.id,
      ...ns
    }))
  })

  const personalNamespaces = computed(() => {
    return namespaces.value.filter(ns => ns.namespace_type === 'personal')
  })

  const domainNamespaces = computed(() => {
    return namespaces.value.filter(ns => ns.namespace_type === 'domain')
  })

  const projectNamespaces = computed(() => {
    return namespaces.value.filter(ns => ns.namespace_type === 'project')
  })

  const generalNamespaces = computed(() => {
    return namespaces.value.filter(ns => ns.namespace_type === 'general')
  })

  // ==================== Actions ====================

  /**
   * 加载命名空间列表
   */
  async function loadNamespaces(userId = null) {
    loading.value = true
    error.value = null
    try {
      const response = await getNamespaceList(userId)
      if (response.code === 200) {
        namespaces.value = response.data?.namespaces || []

        // 如果当前命名空间存在，更新其数据
        if (currentNamespace.value) {
          const updated = namespaces.value.find(n => n.id === currentNamespace.value.id)
          if (updated) {
            currentNamespace.value = updated
          }
        }
      }
      return namespaces.value
    } catch (err) {
      error.value = err.message
      console.error('加载命名空间列表失败:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 获取命名空间详情
   */
  async function getNamespaceById(namespaceId) {
    loading.value = true
    error.value = null
    try {
      const response = await getNamespaceDetail(namespaceId)
      if (response.code === 200) {
        return response.data
      }
    } catch (err) {
      error.value = err.message
      console.error('获取命名空间详情失败:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 选择命名空间
   */
  async function selectNamespace(namespaceId) {
    loading.value = true
    error.value = null
    try {
      // 获取详情
      const response = await getNamespaceDetail(namespaceId)
      if (response.code === 200) {
        currentNamespace.value = response.data

        // 加载统计
        await loadNamespaceStats(namespaceId)
      }

      return currentNamespace.value
    } catch (err) {
      error.value = err.message
      console.error('选择命名空间失败:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 创建命名空间
   */
  async function createNewNamespace(data) {
    loading.value = true
    error.value = null
    try {
      const response = await createNamespace(data)
      if (response.code === 200) {
        await loadNamespaces()
        return response.data
      }
    } catch (err) {
      error.value = err.message
      console.error('创建命名空间失败:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 更新命名空间
   */
  async function updateNamespaceData(namespaceId, data) {
    loading.value = true
    error.value = null
    try {
      const response = await updateNamespace(namespaceId, data)
      if (response.code === 200) {
        // 更新本地状态
        const index = namespaces.value.findIndex(n => n.id === namespaceId)
        if (index !== -1) {
          namespaces.value[index] = { ...namespaces.value[index], ...data }
        }
        if (currentNamespace.value?.id === namespaceId) {
          currentNamespace.value = { ...currentNamespace.value, ...data }
        }
      }
      return response
    } catch (err) {
      error.value = err.message
      console.error('更新命名空间失败:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 删除命名空间
   */
  async function deleteNamespace(namespaceId) {
    loading.value = true
    error.value = null
    try {
      const response = await deleteNamespaceApi(namespaceId)
      if (response.code === 200) {
        // 从列表中移除
        namespaces.value = namespaces.value.filter(n => n.id !== namespaceId)

        // 如果删除的是当前命名空间，清空当前选择
        if (currentNamespace.value?.id === namespaceId) {
          currentNamespace.value = null
          namespaceStats.value = null
        }
      }
      return response
    } catch (err) {
      error.value = err.message
      console.error('删除命名空间失败:', err)
      throw err
    } finally {
      loading.value = false
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
      return namespaceStats.value
    } catch (err) {
      console.error('加载统计数据失败:', err)
      throw err
    }
  }

  /**
   * 清空当前选择
   */
  function clearCurrentNamespace() {
    currentNamespace.value = null
    namespaceStats.value = null
  }

  // ==================== 导出 ====================

  return {
    // 状态
    namespaces,
    currentNamespace,
    namespaceStats,
    loading,
    error,

    // 计算属性
    currentNamespaceId,
    namespaceOptions,
    personalNamespaces,
    domainNamespaces,
    projectNamespaces,
    generalNamespaces,

    // Actions
    loadNamespaces,
    getNamespaceById,
    selectNamespace,
    createNewNamespace,
    updateNamespaceData,
    deleteNamespace,
    loadNamespaceStats,
    clearCurrentNamespace
  }
})
