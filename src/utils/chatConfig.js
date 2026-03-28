/**
 * 聊天配置管理工具
 * 统一管理 ChatPage 和 ChatInput 的配置状态
 * 解决配置分散、不同步的问题
 */

const CHAT_CONFIG_KEY = 'chatConfig'

// 旧版 localStorage keys（用于迁移）
const OLD_KEYS = {
  SELECTED_MODEL: 'selectedModel',
  ONLINE_SEARCH: 'onlineSearch',
  DEEP_REASONING: 'deepReasoning'
}

/**
 * 聊天配置管理对象
 */
export const chatConfig = {
  // 默认配置
  defaults: {
    selectedModel: 'deepseek-chat',
    onlineSearch: false,
    deepReasoning: false
  },

  /**
   * 获取完整配置
   * @returns {Object} 配置对象
   */
  getAll() {
    try {
      const raw = localStorage.getItem(CHAT_CONFIG_KEY)
      if (!raw) return { ...this.defaults }
      const parsed = JSON.parse(raw)
      return { ...this.defaults, ...parsed }
    } catch (error) {
      console.error('[chatConfig] 读取配置失败:', error)
      return { ...this.defaults }
    }
  },

  /**
   * 获取单个配置项
   * @param {string} key 配置键名
   * @returns {*} 配置值
   */
  get(key) {
    const config = this.getAll()
    return config[key] !== undefined ? config[key] : this.defaults[key]
  },

  /**
   * 设置单个配置项
   * @param {string} key 配置键名
   * @param {*} value 配置值
   */
  set(key, value) {
    const config = this.getAll()
    config[key] = value
    this.save(config)
  },

  /**
   * 设置多个配置项
   * @param {Object} updates 配置更新对象
   */
  setMultiple(updates) {
    const config = { ...this.getAll(), ...updates }
    this.save(config)
  },

  /**
   * 保存配置到 localStorage
   * @param {Object} config 配置对象
   */
  save(config) {
    try {
      localStorage.setItem(CHAT_CONFIG_KEY, JSON.stringify(config))
      // 触发自定义事件，通知其他组件
      window.dispatchEvent(new CustomEvent('chatConfigChanged', { detail: config }))
    } catch (error) {
      console.error('[chatConfig] 保存配置失败:', error)
    }
  },

  /**
   * 监听配置变化
   * @param {Function} callback 配置变化回调函数
   * @returns {Function} 取消监听函数
   */
  onChange(callback) {
    const handler = (e) => callback(e.detail)
    window.addEventListener('chatConfigChanged', handler)
    return () => window.removeEventListener('chatConfigChanged', handler)
  },

  /**
   * 重置配置为默认值
   */
  reset() {
    this.save({ ...this.defaults })
  }
}

/**
 * 迁移旧版配置数据
 * 从旧的独立 keys 迁移到统一的 chatConfig
 * @returns {boolean} 是否进行了迁移
 */
export function migrateOldConfig() {
  const oldValues = {}
  let hasOldData = false

  // 读取旧配置
  Object.entries(OLD_KEYS).forEach(([key, storageKey]) => {
    const value = localStorage.getItem(storageKey)
    if (value !== null) {
      hasOldData = true
      if (key === 'SELECTED_MODEL') {
        oldValues.selectedModel = value
      } else {
        // onlineSearch 和 deepReasoning 是布尔字符串
        oldValues[key.toLowerCase()] = value === 'true'
      }
      // 删除旧配置
      localStorage.removeItem(storageKey)
    }
  })

  // 如果有旧数据，合并到新配置
  if (hasOldData) {
    const currentConfig = chatConfig.getAll()
    chatConfig.save({ ...currentConfig, ...oldValues })
    console.log('[chatConfig] 已迁移旧配置:', oldValues)
    return true
  }

  return false
}

/**
 * 初始化配置
 * 确保配置存在并迁移旧数据
 */
export function initChatConfig() {
  migrateOldConfig()
  const config = chatConfig.getAll()
  console.log('[chatConfig] 配置已初始化:', config)
  return config
}

export default chatConfig
