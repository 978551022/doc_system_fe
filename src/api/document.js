import axios from 'axios'

// 创建axios实例
const request = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
request.interceptors.request.use(
  config => {
    // 可以在这里添加token等认证信息
    return config
  },
  error => {
    console.error('请求错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  response => {
    return response.data
  },
  error => {
    console.error('响应错误:', error)
    return Promise.reject(error)
  }
)

/**
 * 上传文档
 * @param {File} file 文件对象
 * @returns {Promise} 返回包含doc_id的响应
 */
export const uploadDocument = async (file) => {
  const formData = new FormData()
  formData.append('file', file)

  try {
    const response = await request.post('/v1/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })

    // 打印详细的响应信息以便调试
    console.log('uploadDocument 原始响应:', response)
    console.log('响应类型:', typeof response)
    console.log('响应结构:', JSON.stringify(response, null, 2))

    // 返回响应数据
    return response
  } catch (error) {
    console.error('uploadDocument 错误:', error)
    // 如果有响应数据，打印出来
    if (error.response && error.response.data) {
      console.error('错误响应数据:', error.response.data)
    }
    throw error
  }
}

/**
 * 获取文档摘要
 * @param {string} docId 文档ID
 * @returns {Promise} 返回文档摘要
 */
export const getDocumentSummary = async (docId) => {
  return request.get(`/v1/documents/${docId}/summary`)
}

/**
 * 检查文档处理状态
 * @param {string} docId 文档ID
 * @returns {Promise} 返回文档信息，包含processing_status
 */
export const checkDocumentStatus = async (docId) => {
  return request.get(`/v1/documents/${docId}`)
}

/**
 * 等待文档处理完成
 * @param {string} docId 文档ID
 * @param {number} maxWaitTime 最大等待时间（毫秒），默认30秒
 * @param {number} checkInterval 检查间隔（毫秒），默认1秒
 * @returns {Promise} 返回处理完成的文档信息
 */
export const waitForDocumentProcessing = async (docId, maxWaitTime = 30000, checkInterval = 1000) => {
  const startTime = Date.now()

  console.log('开始等待文档处理完成:', { docId, maxWaitTime, checkInterval })

  while (Date.now() - startTime < maxWaitTime) {
    try {
      const docInfo = await checkDocumentStatus(docId)
      console.log('文档状态检查:', {
        docId,
        processingStatus: docInfo.processing_status,
        status: docInfo.processing_status === 0 ? '处理中' : '已完成'
      })

      // processing_status: 0 = 处理中, 1 = 已完成, 2 = 失败
      if (docInfo.processing_status && docInfo.processing_status !== 0) {
        console.log('文档处理完成:', docInfo)
        return docInfo
      }

      // 等待一段时间后再检查
      console.log(`文档处理中，${checkInterval / 1000}秒后重试...`)
      await new Promise(resolve => setTimeout(resolve, checkInterval))
    } catch (error) {
      console.error('检查文档状态失败:', error)
      // 继续等待，即使检查失败
      await new Promise(resolve => setTimeout(resolve, checkInterval))
    }
  }

  throw new Error('文档处理超时，请稍后再试')
}

/**
 * 流式查询文档
 * @param {string} docId 文档ID
 * @param {string} query 查询问题
 * @param {Function} onChunk 接收流式数据的回调函数
 * @param {boolean} onlineSearch 是否启用联网搜索
 * @returns {Promise} 返回fetch对象，用于控制流
 */
export const queryDocumentStream = async (docId, query, onChunk, onlineSearch = false) => {
  // 构建URL参数
  const params = new URLSearchParams({
    query: query,
    online_search: onlineSearch.toString()  // 添加联网搜索参数
  })

  const url = `/api/v1/documents/${docId}/query-stream?${params.toString()}`

  console.log('开始流式查询:', {
    url,
    docId,
    query,
    onlineSearch,
    fullUrl: window.location.origin + url
  })

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'text/event-stream'
      }
    })

    console.log('流式查询响应状态:', response.status, response.statusText)

    if (!response.ok) {
      // 尝试读取错误信息
      let errorText = ''
      try {
        errorText = await response.text()
        console.error('错误响应内容:', errorText)
      } catch (e) {
        console.error('无法读取错误响应:', e)
      }
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText || response.statusText}`)
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder('utf-8')
    let buffer = ''
    let chunkCount = 0
    let textContent = ''

    while (true) {
      const { value, done } = await reader.read()

      if (done) {
        console.log('流式查询完成，共接收', chunkCount, '个chunk')
        console.log('最终提取的文本内容:', textContent.substring(0, 200))
        break
      }

      // 解码并添加到缓冲区
      buffer += decoder.decode(value, { stream: true })

      // 处理缓冲区中的完整行
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        const trimmedLine = line.trim()
        if (!trimmedLine) {
          continue
        }

        chunkCount++
        console.log('接收到chunk #' + chunkCount + ':', trimmedLine.substring(0, 100))

        // 解析SSE格式：data: xxx
        if (trimmedLine.startsWith('data:')) {
          // 移除 "data:" 前缀
          let content = trimmedLine.substring(5).trim()

          // 跳过空内容
          if (!content) {
            continue
          }

          // 检查是否是结束标记
          if (content === '[DONE]' || content.includes('[DONE]')) {
            console.log('收到结束标记')
            continue
          }

          // 如果内容还以 "data:" 开头，说明是嵌套格式，继续提取
          // 使用循环移除所有 "data:" 前缀
          let extractedText = content
          while (extractedText.startsWith('data:')) {
            extractedText = extractedText.substring(5).trim()
            if (!extractedText) {
              break
            }
          }

          // 如果提取到有效文本
          if (extractedText && extractedText.length > 0) {
            console.log('提取的文本:', extractedText)
            textContent += extractedText

            // 立即调用回调
            if (onChunk) {
              onChunk(extractedText)
            }
          }
        }
      }
    }

    // 处理剩余的缓冲区内容
    if (buffer.trim()) {
      console.log('处理剩余buffer:', buffer.trim())
      // 同样的处理逻辑
      let trimmedLine = buffer.trim()
      if (trimmedLine.startsWith('data:')) {
        let content = trimmedLine.substring(5).trim()
        if (content && content !== '[DONE]') {
          let extractedText = content
          while (extractedText.startsWith('data:')) {
            extractedText = extractedText.substring(5).trim()
            if (!extractedText) break
          }
          if (extractedText) {
            textContent += extractedText
            if (onChunk) {
              onChunk(extractedText)
            }
          }
        }
      }
    }

    console.log('流式查询处理完成，总文本长度:', textContent.length)
  } catch (error) {
    console.error('流式查询失败:', error)
    console.error('错误详情:', {
      message: error.message,
      stack: error.stack
    })
    throw error
  }
}

/**
 * 取消流式查询（如果需要）
 */
export const cancelQueryStream = () => {
  // 可以在这里实现取消逻辑
  console.log('取消流式查询')
}

export default request
