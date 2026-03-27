/**
 * 语音上传API封装
 * 按照正确的分片上传流程实现
 */
class VoiceUploader {
  constructor(conversationId, options = {}) {
    this.conversationId = conversationId
    this.uploadId = null
    this.API_BASE = '/api/v1/docsearch/voice'
    // 语音配置参数
    this.modelName = options.modelName || 'glm'
    this.onlineSearch = options.onlineSearch || false
    this.deepReasoning = options.deepReasoning || false
    this.temperature = options.temperature || 0.5
    this.maxHistory = options.maxHistory || 6
    // AbortController 用于中断请求
    this.abortController = null
  }

  /**
   * 设置中断控制器
   * @param {AbortController} controller - 中断控制器
   */
  setAbortController(controller) {
    this.abortController = controller
  }

  /**
   * 中断当前上传
   */
  abort() {
    if (this.abortController) {
      this.abortController.abort()
      this.abortController = null
    }
  }

  /**
   * 1. 初始化语音上传会话
   * @param {Blob} audioBlob - 音频数据块
   * @param {Function} onMetadata - 接收元数据（包括attachment_id）的回调函数
   * @returns {Promise<{upload_id: string, conversation_id: string, attachment_id?: string}>}
   */
  async init(audioBlob, onMetadata) {
    const chunkSize = 128 * 1024 // 128KB per chunk
    const totalChunks = Math.max(1, Math.ceil(audioBlob.size / chunkSize))

    const requestBody = {
      conversation_id: this.conversationId,
      total_chunks: totalChunks,
      file_size: audioBlob.size,
      mime_type: audioBlob.type || 'audio/webm'
    }

    const response = await fetch(`${this.API_BASE}/init`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody),
      signal: this.abortController?.signal || null
    })

    if (!response.ok) {
      let errorMsg = '初始化语音上传失败'
      try {
        const error = await response.json()
        errorMsg = error.detail || error.message || errorMsg
        console.error('[语音上传] 初始化失败:', error)
      } catch (e) {
        console.error('[语音上传] 初始化失败，无法解析错误响应:', e)
      }
      throw new Error(errorMsg)
    }

    const data = await response.json()
    this.uploadId = data.upload_id

    // 如果后端在init阶段就返回了attachment_id或upload_id，通过onMetadata回调传递
    if (onMetadata) {
      const metadata = {}
      if (data.attachment_id !== undefined) {
        metadata.attachment_id = data.attachment_id
      }
      if (data.upload_id !== undefined) {
        metadata.upload_id = data.upload_id
      }
      if (Object.keys(metadata).length > 0) {
        onMetadata(metadata)
      }
    }

    return data
  }

  /**
   * 2. 上传音频分片
   * @param {Blob} audioBlob - 完整音频数据
   * @returns {Promise<void>}
   */
  async uploadChunks(audioBlob) {
    const chunkSize = 128 * 1024 // 128KB per chunk
    const totalChunks = Math.ceil(audioBlob.size / chunkSize)

    for (let i = 0; i < totalChunks; i++) {
      // 检查是否已中断
      if (this.abortController?.signal.aborted) {
        throw new DOMException('上传已取消', 'AbortError')
      }

      const start = i * chunkSize
      const end = Math.min(start + chunkSize, audioBlob.size)
      const chunk = audioBlob.slice(start, end)

      const formData = new FormData()
      formData.append('upload_id', this.uploadId)
      formData.append('chunk_data', chunk)
      formData.append('chunk_index', i.toString())

      const response = await fetch(`${this.API_BASE}/chunk`, {
        method: 'POST',
        body: formData,
        signal: this.abortController?.signal || null
      })

      if (!response.ok) {
        console.error(`[语音上传] 分片 ${i} 上传失败，状态:`, response.status)
        throw new Error(`上传分片 ${i} 失败，状态码: ${response.status}`)
      }
    }
  }

  /**
   * 3. 完成上传并获取识别结果（流式响应）
   * @param {Function} onChunk - 接收流式内容的回调函数
   * @param {Function} onMetadata - 接收元数据的回调函数
   * @param {Function} onComplete - 完成回调函数
   * @param {Object} continueOptions - 续传选项
   * @param {string} continueOptions.continueFromContent - 续传的起始内容
   * @returns {Promise<{recognized_text: string, attachment_id: string, response_content: string}>}
   */
  async complete(onChunk, onMetadata, onComplete, continueOptions = {}) {
    const requestBody = {
      upload_id: this.uploadId,
      model_name: this.modelName,
      online_search: this.onlineSearch,
      deep_reasoning: this.deepReasoning,
      temperature: this.temperature,
      max_history: this.maxHistory
    }

    // 如果是续传模式，添加 continue_from_content 参数
    if (continueOptions.continueFromContent !== undefined) {
      requestBody.continue_from_content = continueOptions.continueFromContent
    }

    const response = await fetch(`${this.API_BASE}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody),
      signal: this.abortController?.signal || null
    })

    if (!response.ok) {
      let errorMsg = '完成语音上传失败'
      try {
        const error = await response.json()
        errorMsg = error.detail || error.message || errorMsg
        console.error('[语音上传] 完成失败:', error)
      } catch (e) {
        console.error('[语音上传] 完成失败，无法解析错误响应:', e)
      }
      throw new Error(errorMsg)
    }

    // 检查响应类型，如果不是流式则直接返回JSON
    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      // 非流式响应，直接解析JSON
      const data = await response.json()

      // 如果有完整响应内容，直接通知
      if (data.response_content && onChunk) {
        onChunk(data.response_content)
      }

      // 发送元数据
      if (onMetadata) {
        onMetadata({
          recognized_text: data.recognized_text,
          attachment_id: data.attachment_id
        })
      }

      // 发送完成通知
      if (onComplete) {
        onComplete()
      }

      return {
        recognized_text: data.recognized_text || '',
        attachment_id: data.attachment_id || '',
        response_content: data.response_content || ''
      }
    }

    // 处理SSE流式响应
    const reader = response.body.getReader()
    const decoder = new TextDecoder('utf-8')
    let buffer = ''
    let result = {
      recognized_text: '',
      attachment_id: '',
      response_content: ''
    }
    let hasCalledOnComplete = false // 防止重复调用onComplete

    const processSSEEvent = (jsonData) => {
      try {
        const parsed = JSON.parse(jsonData)

        switch (parsed.type) {
          case 'content':
            // 内容片段
            if (parsed.data !== undefined && onChunk) {
              onChunk(parsed.data)
              result.response_content += parsed.data
            }
            break

          case 'metadata':
            // 元数据（识别文本、附件ID等）
            if (parsed.data) {
              if (parsed.data.recognized_text !== undefined) {
                result.recognized_text = parsed.data.recognized_text
              }
              if (parsed.data.attachment_id !== undefined) {
                result.attachment_id = parsed.data.attachment_id
              }
            }
            if (onMetadata) {
              onMetadata(parsed.data || parsed)
            }
            break

          case 'voice_result':
            // 语音识别结果
            if (parsed.data) {
              if (parsed.data.recognized_text !== undefined) {
                result.recognized_text = parsed.data.recognized_text
              }
              if (parsed.data.attachment_id !== undefined) {
                result.attachment_id = parsed.data.attachment_id
              }
            }
            // 也要通知onMetadata回调，确保前端能获取到attachment_id
            if (onMetadata && parsed.data) {
              onMetadata(parsed.data)
            }
            break

          case 'done':
            // 完成标记
            if (onComplete && !hasCalledOnComplete) {
              hasCalledOnComplete = true
              onComplete()
            }
            break

          default:
            // 兼容没有type字段的情况
            if (parsed.recognized_text !== undefined) {
              result.recognized_text = parsed.recognized_text
            }
            if (parsed.attachment_id !== undefined) {
              result.attachment_id = parsed.attachment_id
            }
            if (parsed.response_content !== undefined && onChunk) {
              onChunk(parsed.response_content)
              result.response_content += parsed.response_content
            }
            // 对于未知类型，如果有attachment_id或recognized_text，也要通知onMetadata
            if (onMetadata && (parsed.attachment_id !== undefined || parsed.recognized_text !== undefined)) {
              onMetadata({
                attachment_id: parsed.attachment_id,
                recognized_text: parsed.recognized_text
              })
            }
            break
        }
      } catch (parseError) {
        console.error('[语音上传] JSON解析失败:', parseError, '原始数据:', jsonData)
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
        // 流结束时调用完成回调（如果还未调用过）
        if (onComplete && !hasCalledOnComplete) {
          hasCalledOnComplete = true
          onComplete()
        }
        break
      }

      buffer += decoder.decode(value, { stream: true })

      // 处理buffer中的所有完整事件
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

    return result
  }

  /**
   * 续传生成（仅用于续传，不需要重新上传音频）
   * @param {string} uploadId - 原始上传ID
   * @param {string} continueFromContent - 已生成的内容
   * @param {Function} onChunk - 接收流式内容的回调函数
   * @param {Function} onMetadata - 接收元数据的回调函数
   * @param {Function} onComplete - 完成回调函数
   * @returns {Promise<{recognized_text: string, attachment_id: string, response_content: string}>}
   */
  async continue(uploadId, continueFromContent, onChunk, onMetadata, onComplete) {
    this.uploadId = uploadId
    return await this.complete(onChunk, onMetadata, onComplete, { continueFromContent })
  }

  /**
   * 完整的上传流程（流式）
   * @param {Blob} audioBlob - 音频数据
   * @param {Function} onChunk - 接收流式内容的回调函数
   * @param {Function} onMetadata - 接收元数据的回调函数
   * @param {Function} onComplete - 完成回调函数
   * @returns {Promise<{recognized_text: string, attachment_id: string}>}
   */
  async upload(audioBlob, onChunk, onMetadata, onComplete) {
    try {
      // init阶段也会返回attachment_id，需要传递onMetadata回调
      await this.init(audioBlob, onMetadata)
      await this.uploadChunks(audioBlob)
      return await this.complete(onChunk, onMetadata, onComplete)
    } catch (error) {
      // 如果是用户主动中止（AbortError），静默处理
      if (error.name === 'AbortError' || error.message?.includes('aborted')) {
        throw error // 重新抛出以便上层处理
      }
      // 其他错误正常抛出
      throw error
    }
  }
}

export const voiceApi = {
  /**
   * 创建一个新的上传器实例
   * @param {string} conversationId - 会话ID
   * @param {Object} options - 配置选项
   * @param {string} options.modelName - 模型名称
   * @param {boolean} options.onlineSearch - 是否联网搜索
   * @param {boolean} options.deepReasoning - 是否深度推理
   * @param {number} options.temperature - 温度参数
   * @param {number} options.maxHistory - 最大历史记录数
   * @returns {VoiceUploader}
   */
  createUploader(conversationId, options = {}) {
    return new VoiceUploader(conversationId, options)
  }
}
