<template>
  <div class="voice-recorder">
    <!-- 麦克风按钮 -->
    <el-button
      :class="['voice-record-btn', { 'recording': isRecording }]"
      :disabled="!isRecording && (isGenerating || isUploading)"
      @click="toggleRecording"
      :title="isRecording ? '停止录音' : (isGenerating || isUploading ? 'AI正在回复中，请稍候...' : '语音输入')"
      type="text"
      size="large"
    >
      <!-- 录音中状态 -->
      <svg v-if="isRecording" class="mic-icon recording-icon" viewBox="0 0 24 24" fill="currentColor">
        <rect x="6" y="10" width="4" height="8" rx="1"/>
        <rect x="14" y="10" width="4" height="8" rx="1"/>
        <path d="M12 2C10.34 2 9 3.34 9 5v6c0 1.66 1.34 3 3 3s3-1.34 3-3V5c0-1.66-1.34-3-3-3z" opacity="0.3"/>
        <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" opacity="0.3"/>
      </svg>
      <!-- 默认状态（包括上传中、AI回复中都显示麦克风图标） -->
      <svg v-else class="mic-icon" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
        <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
      </svg>
    </el-button>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { voiceApi } from '../api/voice.js'

// 定义事件
const emit = defineEmits(['voiceMessageReady', 'recordingStateChanged', 'audioDataAvailable', 'initializeConversation', 'recordingDurationChanged', 'voiceChunk', 'voiceComplete', 'voiceUploadComplete', 'conversationIdUpdate', 'voiceMetadataUpdate', 'voiceAborted'])

// 定义props
const props = defineProps({
  conversationId: {
    type: String,
    default: ''
  },
  // 语音相关配置参数
  modelName: {
    type: String,
    default: 'glm'
  },
  onlineSearch: {
    type: Boolean,
    default: false
  },
  deepReasoning: {
    type: Boolean,
    default: false
  },
  temperature: {
    type: Number,
    default: 0.5
  },
  maxHistory: {
    type: Number,
    default: 6
  },
  // AI是否正在生成回复（用于禁用录音）
  isGenerating: {
    type: Boolean,
    default: false
  },
  // AbortController 的 signal（用于中断上传）
  abortSignal: {
    type: Object,
    default: null
  }
})

// 状态
const isRecording = ref(false)
const isUploading = ref(false)

// 当前上传器实例（用于中断）
let currentUploader = null

// 录音相关
let mediaRecorder = null
let audioChunks = []
let stream = null
let audioContext = null
let analyser = null
let dataArray = null
let recordingStartTime = null
const MAX_RECORDING_DURATION = 60 * 1000 // 60秒
let recordingTimer = null

// 切换录音状态
const toggleRecording = async () => {
  if (isRecording.value) {
    stopRecording()
  } else {
    await startRecording()
  }
}

// 开始录音
const startRecording = async () => {
  // 注意：不再需要预先创建会话
  // 语音上传API会在init步骤中自动创建新会话（conversation_id传null即可）

  try {
    // 请求麦克风权限
    stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        sampleRate: 16000,
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    })

    // 初始化音频上下文用于获取音频数据
    audioContext = new (window.AudioContext || window.webkitAudioContext)()
    analyser = audioContext.createAnalyser()
    const source = audioContext.createMediaStreamSource(stream)
    source.connect(analyser)
    analyser.fftSize = 256
    const bufferLength = analyser.frequencyBinCount
    dataArray = new Uint8Array(bufferLength)

    // 创建MediaRecorder
    const mimeType = getSupportedMimeType()
    mediaRecorder = new MediaRecorder(stream, { mimeType })
    audioChunks = []

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data)
      }
    }

    mediaRecorder.onstop = handleRecordingStop

    // 开始录音
    mediaRecorder.start(100) // 每100ms产生一个数据块
    isRecording.value = true
    recordingStartTime = Date.now()

    // 发送录音状态变化事件
    emit('recordingStateChanged', true)

    // 启动音频数据发送（用于波形显示）
    startAudioDataCapture()

    // 设置60秒自动停止
    recordingTimer = setTimeout(() => {
      if (isRecording.value) {
        ElMessage.warning('已达到最大录音时长60秒')
        stopRecording()
      }
    }, MAX_RECORDING_DURATION)

  } catch (error) {
    console.error('[录音] 启动失败:', error)
    if (error.name === 'NotAllowedError') {
      ElMessage.error('请允许麦克风访问权限以使用语音输入')
    } else if (error.name === 'NotFoundError') {
      ElMessage.error('未检测到麦克风设备')
    } else {
      ElMessage.error('录音启动失败，请重试')
    }
    cleanup()
  }
}

// 停止录音
const stopRecording = () => {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop()
  }
  // 清除定时器
  if (recordingTimer) {
    clearTimeout(recordingTimer)
    recordingTimer = null
  }
  // 发送录音状态变化事件
  emit('recordingStateChanged', false)
}

// 录音停止处理
const handleRecordingStop = async () => {
  isRecording.value = false

  // 计算录音时长（秒）
  const recordingDuration = recordingStartTime ? Math.round((Date.now() - recordingStartTime) / 1000) : 0

  // 立即发送临时消息，即刻显示用户语音消息
  emit('voiceMessageReady', {
    recognizedText: '',
    responseContent: '',
    attachmentId: '',
    duration: recordingDuration,
    isUploading: true // 标记正在上传
  })

  // 创建音频Blob
  const mimeType = getSupportedMimeType()
  let audioBlob = new Blob(audioChunks, { type: mimeType })

  // 转换为WAV格式（如果浏览器不支持直接录制WAV）
  if (!mimeType.includes('wav')) {
    try {
      audioBlob = await convertToWav(audioBlob)
    } catch (error) {
      console.error('[录音] WAV转换失败:', error)
    }
  }

  // 清理资源
  cleanup()

  // 开始上传，传递录音时长
  await uploadAudio(audioBlob, recordingDuration)
}

// 获取支持的音频格式
const getSupportedMimeType = () => {
  const types = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/ogg',
    'audio/mp4',
    'audio/wav'
  ]
  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type
    }
  }
  return ''
}

// 转换为WAV格式
const convertToWav = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = async () => {
      try {
        const arrayBuffer = reader.result
        const audioContext = new (window.AudioContext || window.webkitAudioContext)()
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

        // 创建WAV文件头
        const wavBuffer = audioBufferToWav(audioBuffer)
        resolve(new Blob([wavBuffer], { type: 'audio/wav' }))
      } catch (error) {
        reject(error)
      }
    }
    reader.onerror = reject
    reader.readAsArrayBuffer(blob)
  })
}

// AudioBuffer转WAV
const audioBufferToWav = (buffer) => {
  const numChannels = buffer.numberOfChannels
  const sampleRate = buffer.sampleRate
  const format = 1 // PCM
  const bitDepth = 16

  const bytesPerSample = bitDepth / 8
  const blockAlign = numChannels * bytesPerSample

  const data = []
  for (let i = 0; i < buffer.numberOfChannels; i++) {
    data.push(buffer.getChannelData(i))
  }

  const length = data[0].length * numChannels * bytesPerSample
  const buffer2 = new ArrayBuffer(44 + length)
  const view = new DataView(buffer2)

  // RIFF标识
  writeString(view, 0, 'RIFF')
  view.setUint32(4, 36 + length, true)
  writeString(view, 8, 'WAVE')
  writeString(view, 12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, format, true)
  view.setUint16(22, numChannels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * blockAlign, true)
  view.setUint16(32, blockAlign, true)
  view.setUint16(34, bitDepth, true)
  writeString(view, 36, 'data')
  view.setUint32(40, length, true)

  // 写入音频数据
  const channels = []
  for (let i = 0; i < numChannels; i++) {
    channels.push(data[i])
  }

  let offset = 44
  for (let i = 0; i < data[0].length; i++) {
    for (let channel = 0; channel < numChannels; channel++) {
      const sample = Math.max(-1, Math.min(1, channels[channel][i]))
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true)
      offset += 2
    }
  }

  return buffer2
}

const writeString = (view, offset, string) => {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i))
  }
}

// 上传音频（流式响应）
const uploadAudio = async (audioBlob, duration = 0) => {
  // 注意：conversationId 可以为空，后端会自动创建新会话
  const conversationId = props.conversationId || null

  try {
    isUploading.value = true

    // 使用新的VoiceUploader类进行上传（流式响应），传递配置参数
    const uploader = voiceApi.createUploader(conversationId, {
      modelName: props.modelName,
      onlineSearch: props.onlineSearch,
      deepReasoning: props.deepReasoning,
      temperature: props.temperature,
      maxHistory: props.maxHistory
    })

    // 保存当前上传器实例，用于中断
    currentUploader = uploader

    // 如果父组件传入了 abortSignal，设置到上传器
    if (props.abortSignal) {
      uploader.setAbortController(props.abortSignal)
    }

    // 用于存储识别结果和附件ID
    let recognizedText = ''
    let attachmentId = ''
    let uploadId = '' // upload_id 用于获取语音数据
    let hasReceivedChunk = false // 标记是否收到过流式内容

    // 流式上传并处理响应
    const result = await uploader.upload(
      audioBlob,
      // onChunk - 流式内容回调
      (chunk) => {
        hasReceivedChunk = true
        emit('voiceChunk', { content: chunk })
      },
      // onMetadata - 元数据回调
      (metadata) => {
        // 获取 upload_id（用于获取语音数据）
        if (metadata.upload_id !== undefined) {
          uploadId = metadata.upload_id
          // 立即通知父组件更新 uploadId，使语音消息可播放
          emit('voiceMetadataUpdate', { uploadId })
        } else if (metadata.data && metadata.data.upload_id !== undefined) {
          uploadId = metadata.data.upload_id
          // 立即通知父组件更新 uploadId
          emit('voiceMetadataUpdate', { uploadId })
        }

        // 获取 attachment_id
        if (metadata.attachment_id !== undefined) {
          attachmentId = metadata.attachment_id
        } else if (metadata.data && metadata.data.attachment_id !== undefined) {
          attachmentId = metadata.data.attachment_id
        }

        if (metadata.recognized_text !== undefined) {
          recognizedText = metadata.recognized_text
        }
        // 如果后端返回了新的conversation_id，通知父组件更新
        if (metadata.conversation_id) {
          emit('conversationIdUpdate', metadata.conversation_id)
        }
      },
      // onComplete - 完成回调
      () => {
        emit('voiceComplete', {
          recognizedText: recognizedText,
          attachmentId: attachmentId,
          uploadId: uploadId,
          duration: duration
        })
      }
    )

    // 兼容非流式响应（如果后端返回完整结果）
    if (result.recognized_text && !recognizedText) {
      recognizedText = result.recognized_text
    }
    if (result.upload_id && !uploadId) {
      uploadId = result.upload_id
    }
    if (result.attachment_id && !attachmentId) {
      attachmentId = result.attachment_id
    }

    // 如果没有收到流式内容但有完整响应，发送完整内容
    if (!hasReceivedChunk && result.response_content) {
      emit('voiceChunk', { content: result.response_content })
    }

    // 发送全部完成事件
    emit('voiceUploadComplete', {
      recognizedText: recognizedText,
      attachmentId: attachmentId,
      uploadId: uploadId,
      duration: duration
    })

  } catch (error) {
    // 如果是用户主动中止（AbortError），静默处理，不显示错误提示
    if (error.name === 'AbortError' || error.message?.includes('aborted')) {
      console.warn('[语音上传] 用户中止上传')
      // 发送中止事件，通知父组件更新状态
      emit('voiceAborted')
    } else {
      console.error('[语音上传] 失败:', error)
      ElMessage.error(`语音识别失败: ${error.message || '请稍后重试'}`)
    }
  } finally {
    isUploading.value = false
    currentUploader = null // 清除上传器引用
  }
}

// 发送音频数据用于波形显示
const startAudioDataCapture = () => {
  const captureData = () => {
    if (!isRecording.value || !analyser || !dataArray) return

    // 获取音频频谱数据
    analyser.getByteFrequencyData(dataArray)

    // 将音频数据发送给父组件用于波形显示
    emit('audioDataAvailable', Array.from(dataArray))

    // 使用 requestAnimationFrame 持续发送数据
    requestAnimationFrame(captureData)
  }

  captureData()
}

// 清理资源
const cleanup = () => {
  if (recordingTimer) {
    clearTimeout(recordingTimer)
    recordingTimer = null
  }

  if (stream) {
    stream.getTracks().forEach(track => track.stop())
    stream = null
  }

  if (audioContext && audioContext.state !== 'closed') {
    audioContext.close()
    audioContext = null
  }

  mediaRecorder = null
  audioChunks = []
  dataArray = null
  analyser = null
}

onMounted(() => {
  // 预加载语音
  if ('speechSynthesis' in window) {
    window.speechSynthesis.getVoices()
  }
})

onUnmounted(() => {
  cleanup()
})

// 暴露方法给父组件
defineExpose({
  abortUpload: () => {
    if (currentUploader) {
      currentUploader.abort()
      currentUploader = null
    }
  }
})
</script>

<style scoped>
.voice-recorder {
  display: flex;
  align-items: center;
  margin-right: -8px;
}

/* 麦克风按钮 */
.voice-record-btn {
  color: var(--text-secondary) !important;
  font-size: 13px !important;
  padding: 6px 12px !important;
  border-radius: var(--radius-sm) !important;
  transition: var(--transition) !important;
  background-color: transparent !important;
  position: relative;
}

.voice-record-btn:hover {
  color: var(--primary-color) !important;
  background-color: var(--surface-color) !important;
}

.voice-record-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 麦克风图标 */
.mic-icon {
  width: 20px;
  height: 20px;
  fill: currentColor;
}

/* 录音中状态 - 浅绿色脉冲效果 */
.voice-record-btn.recording {
  color: #22c55e !important;
  background-color: rgba(34, 197, 94, 0.1) !important;
  animation: recording-pulse-green 1.5s ease-in-out infinite;
}

.voice-record-btn.recording:hover {
  background-color: rgba(34, 197, 94, 0.2) !important;
}

.recording-icon {
  animation: recording-icon-pulse 0.8s ease-in-out infinite;
}

/* 浅绿色脉冲动画 */
@keyframes recording-pulse-green {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4);
  }
  50% {
    box-shadow: 0 0 0 10px rgba(34, 197, 94, 0);
  }
}

/* 图标内部脉冲 */
@keyframes recording-icon-pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(0.9);
    opacity: 0.8;
  }
}

/* 深色模式适配 */
.dark-theme .voice-record-btn.recording {
  color: #4ade80 !important;
  background-color: rgba(74, 222, 128, 0.15) !important;
}

.dark-theme .voice-record-btn.recording:hover {
  background-color: rgba(74, 222, 128, 0.25) !important;
}
</style>
