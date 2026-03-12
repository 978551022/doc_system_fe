import axios from 'axios'
import { getToken } from '../utils/userStore.js'

const request = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

request.interceptors.request.use(
  config => {
    const token = getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => {
    console.error('请求错误:', error)
    return Promise.reject(error)
  }
)

request.interceptors.response.use(
  response => {
    return response.data
  },
  error => {
    console.error('响应错误:', error)
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user_info')
      localStorage.removeItem('login_state')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export const uploadDocument = async (file) => {
  const formData = new FormData()
  formData.append('file', file)

  try {
    const response = await request.post('/v1/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })

    console.log('uploadDocument 原始响应:', response)
    console.log('响应类型:', typeof response)
    console.log('响应结构:', JSON.stringify(response, null, 2))

    return response
  } catch (error) {
    console.error('uploadDocument 错误:', error)
    if (error.response && error.response.data) {
      console.error('错误响应数据:', error.response.data)
    }
    throw error
  }
}

export const getDocumentSummary = async (docId) => {
  return request.get(`/v1/documents/${docId}/summary`)
}

export const checkDocumentStatus = async (docId) => {
  return request.get(`/v1/documents/${docId}`)
}

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

      if (docInfo.processing_status && docInfo.processing_status !== 0) {
        console.log('文档处理完成:', docInfo)
        return docInfo
      }

      console.log(`文档处理中，${checkInterval / 1000}秒后重试...`)
      await new Promise(resolve => setTimeout(resolve, checkInterval))
    } catch (error) {
      console.error('检查文档状态失败:', error)
      await new Promise(resolve => setTimeout(resolve, checkInterval))
    }
  }

  throw new Error('文档处理超时，请稍后再试')
}

export const queryDocumentStream = async (docId, query, onChunk, onlineSearch = false) => {
  const params = new URLSearchParams({
    query: query,
    online_search: onlineSearch.toString()
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
        'Accept': 'text/event-stream',
        'Authorization': `Bearer ${getToken()}`
      }
    })

    console.log('流式查询响应状态:', response.status, response.statusText)

    if (!response.ok) {
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

      buffer += decoder.decode(value, { stream: true })

      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        const trimmedLine = line.trim()
        if (!trimmedLine) {
          continue
        }

        chunkCount++
        console.log('接收到chunk #' + chunkCount + ':', trimmedLine.substring(0, 100))

        if (trimmedLine.startsWith('data:')) {
          let content = trimmedLine.substring(5).trim()

          if (!content) {
            continue
          }

          if (content === '[DONE]' || content.includes('[DONE]')) {
            console.log('收到结束标记')
            continue
          }

          let extractedText = content
          while (extractedText.startsWith('data:')) {
            extractedText = extractedText.substring(5).trim()
            if (!extractedText) {
              break
            }
          }

          if (extractedText && extractedText.length > 0) {
            console.log('提取的文本:', extractedText)
            textContent += extractedText

            if (onChunk) {
              onChunk(extractedText)
            }
          }
        }
      }
    }

    if (buffer.trim()) {
      console.log('处理剩余buffer:', buffer.trim())
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

export const cancelQueryStream = () => {
  console.log('取消流式查询')
}

export default request
