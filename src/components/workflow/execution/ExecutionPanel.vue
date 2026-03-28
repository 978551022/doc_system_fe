<template>
  <div class="execution-panel" :class="{ 'execution-panel--collapsed': isCollapsed }">
    <!-- 底部面板收起/展开指示标 -->
    <div
      class="execution-panel__toggle"
      :class="{ 'execution-panel__toggle--collapsed': isCollapsed }"
      @click="toggleCollapse"
      :title="isCollapsed ? '展开执行面板' : '收起执行面板'"
    >
      <div class="execution-panel__toggle-indicator">
        <i :class="isCollapsed ? 'el-icon-arrow-up' : 'el-icon-arrow-down'"></i>
      </div>
    </div>

    <!-- 面板头部 -->
    <div class="execution-panel__header">
      <div class="execution-panel__status">
        <span
          class="execution-panel__status-indicator"
          :class="`execution-panel__status-indicator--${executionStatus}`"
        ></span>
        <span class="execution-panel__status-text">
          {{ statusText }}
        </span>
      </div>

      <div class="execution-panel__info" v-if="execution">
        <span>已用时间: {{ formattedDuration }}</span>
        <span v-if="executionStats">Token: {{ executionStats.usedTokens || 0 }}/{{ executionStats.totalTokens || 5000 }}</span>
      </div>

      <div class="execution-panel__actions">
        <button
          class="execution-panel__action"
          @click="toggleCollapse"
          :title="isExpanded ? '收起' : '展开'"
        >
          <i :class="isExpanded ? 'el-icon-arrow-down' : 'el-icon-arrow-up'"></i>
        </button>
      </div>
    </div>

    <!-- 面板内容 -->
    <transition name="panel-slide">
      <div class="execution-panel__body" v-show="isExpanded">
        <!-- 节点执行流程 -->
        <div class="execution-panel__flow" v-if="workflow">
          <div class="execution-panel__flow-nodes">
            <div
              v-for="node in workflow.nodes"
              :key="node.id"
              class="execution-panel__flow-node"
              :class="`execution-panel__flow-node--${getNodeStatus(node.id)}`"
            >
              <span class="execution-panel__flow-node-icon">{{ getNodeIcon(node.type) }}</span>
              <span class="execution-panel__flow-node-label">{{ node.data?.label || node.id }}</span>
              <span class="execution-panel__flow-node-time">{{ getNodeTime(node.id) }}</span>
            </div>
          </div>
        </div>

        <!-- 实时输出 -->
        <div class="execution-panel__output">
          <div class="execution-panel__output-header">
            <span class="execution-panel__output-title">实时输出</span>
            <button
              class="execution-panel__output-clear"
              @click="clearOutput"
              v-if="streamOutput.length > 0"
            >
              清空
            </button>
          </div>
          <div class="execution-panel__output-content" ref="outputContentRef">
            <div
              v-for="(output, index) in streamOutput"
              :key="index"
              class="execution-panel__output-item"
              :class="`execution-panel__output-item--${output.type}`"
            >
              <span class="execution-panel__output-source" v-if="output.source">
                {{ output.source }}:
              </span>
              <span class="execution-panel__output-text">{{ output.text }}</span>
            </div>
            <div class="execution-panel__output-empty" v-if="streamOutput.length === 0">
              等待执行...
            </div>
          </div>
        </div>

        <!-- 控制按钮 -->
        <div class="execution-panel__controls">
          <el-button
            size="small"
            @click="handlePause"
            :disabled="!canPause"
            v-if="!isPaused"
          >
            <i class="el-icon-video-pause"></i> 暂停
          </el-button>
          <el-button
            size="small"
            type="warning"
            @click="handleResume"
            :disabled="!isPaused"
            v-else
          >
            <i class="el-icon-video-play"></i> 继续
          </el-button>
          <el-button
            size="small"
            type="danger"
            @click="handleCancel"
            :disabled="!canCancel"
          >
            <i class="el-icon-video-stop"></i> 停止
          </el-button>
          <el-button
            size="small"
            @click="showDetails = !showDetails"
          >
            <i class="el-icon-data-analysis"></i> 详情
          </el-button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import workflowStore from '../../../stores/workflowStore.js'

const props = defineProps({
  workflow: Object,
  collapsed: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['pause', 'resume', 'cancel', 'toggle-collapse'])

const showDetails = ref(false)
const streamOutput = ref([])
const outputContentRef = ref(null)

// 内部展开状态，优先使用 props.collapsed
const internalExpanded = ref(!props.collapsed)

const isExpanded = computed({
  get: () => internalExpanded.value,
  set: (val) => {
    internalExpanded.value = val
  }
})

// 外部控制的收缩状态
const isCollapsed = computed(() => props.collapsed || !isExpanded.value)

// 切换收缩状态
function toggleCollapse() {
  internalExpanded.value = !internalExpanded.value
  emit('toggle-collapse', !internalExpanded.value)
}

// 监听外部 collapsed prop 变化
watch(() => props.collapsed, (newVal) => {
  internalExpanded.value = !newVal
})

// 当前执行
const execution = computed(() => workflowStore.currentExecution)

// 执行状态
const executionStatus = computed(() => execution.value?.status || 'idle')

// 执行统计
const executionStats = computed(() => execution.value?.stats)

// 状态文本
const statusText = computed(() => {
  const statusMap = {
    idle: '就绪',
    pending: '等待中',
    running: '执行中',
    paused: '已暂停',
    completed: '已完成',
    failed: '执行失败',
    cancelled: '已取消'
  }
  return statusMap[executionStatus.value] || '未知状态'
})

// 格式化时长
const formattedDuration = computed(() => {
  if (!execution.value?.startedAt) return '00:00:00'

  const start = new Date(execution.value.startedAt).getTime()
  const end = execution.value.endedAt ? new Date(execution.value.endedAt).getTime() : Date.now()
  const duration = Math.floor((end - start) / 1000)

  const hours = Math.floor(duration / 3600).toString().padStart(2, '0')
  const minutes = Math.floor((duration % 3600) / 60).toString().padStart(2, '0')
  const seconds = (duration % 60).toString().padStart(2, '0')

  return `${hours}:${minutes}:${seconds}`
})

// 能否暂停
const canPause = computed(() => {
  return executionStatus.value === 'running'
})

// 能否取消
const canCancel = computed(() => {
  return ['running', 'paused'].includes(executionStatus.value)
})

// 是否暂停
const isPaused = computed(() => {
  return executionStatus.value === 'paused'
})

// 获取节点状态
function getNodeStatus(nodeId) {
  const nodeState = execution.value?.nodeStates?.[nodeId]
  return nodeState?.status || 'pending'
}

// 获取节点图标
function getNodeIcon(type) {
  const iconMap = {
    start: '🟢',
    end: '🔴',
    agent: '🤖',
    condition: '🔀',
    loop: '🔄'
  }
  return iconMap[type] || '📦'
}

// 获取节点时间
function getNodeTime(nodeId) {
  const nodeState = execution.value?.nodeStates?.[nodeId]
  if (!nodeState?.startedAt) return ''

  const start = new Date(nodeState.startedAt).getTime()
  const end = nodeState.completedAt ? new Date(nodeState.completedAt).getTime() : Date.now()
  const duration = Math.round((end - start) / 1000)

  return `${duration}s`
}

// 清空输出
function clearOutput() {
  streamOutput.value = []
}

// 暂停
function handlePause() {
  emit('pause')
}

// 继续
function handleResume() {
  emit('resume')
}

// 取消
function handleCancel() {
  emit('cancel')
}

// 添加输出
function addOutput(text, type = 'info', source = '') {
  streamOutput.value.push({ text, type, source })
  nextTick(() => {
    if (outputContentRef.value) {
      outputContentRef.value.scrollTop = outputContentRef.value.scrollHeight
    }
  })
}

// 监听执行状态变化
watch(() => execution.value?.status, (newStatus, oldStatus) => {
  if (newStatus && newStatus !== oldStatus) {
    addOutput(`执行状态变更: ${statusText.value}`, 'info')
  }
})

// 监听节点状态变化
watch(() => execution.value?.nodeStates, (nodeStates) => {
  if (nodeStates) {
    Object.entries(nodeStates).forEach(([nodeId, state]) => {
      if (state.status === 'running' && !state.notified) {
        const node = props.workflow?.nodes.find(n => n.id === nodeId)
        addOutput(`开始执行: ${node?.data?.label || nodeId}`, 'info', node?.data?.label)
        state.notified = true
      } else if (state.status === 'completed' && !state.completedNotified) {
        const node = props.workflow?.nodes.find(n => n.id === nodeId)
        addOutput(`完成执行: ${node?.data?.label || nodeId}`, 'success', node?.data?.label)
        state.completedNotified = true
      } else if (state.status === 'failed') {
        const node = props.workflow?.nodes.find(n => n.id === nodeId)
        addOutput(`执行失败: ${node?.data?.label || nodeId} - ${state.error || '未知错误'}`, 'error', node?.data?.label)
      }
    })
  }
}, { deep: true })

// 暴露方法
defineExpose({
  addOutput,
  clearOutput
})
</script>

<style scoped>
.execution-panel {
  background: var(--card-background);
  border-top: 1px solid var(--border-color);
  transition: all 0.3s ease;
  position: relative;
}

/* 底部面板切换按钮 */
.execution-panel__toggle {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  width: 120px;
  height: 28px;
  background: var(--card-background);
  border: 1px solid var(--border-color);
  border-bottom: none;
  border-radius: 12px 12px 0 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 100;
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.08);
}

.execution-panel__toggle::before {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 3px;
  background: var(--primary-color);
  border-radius: 0 0 2px 2px;
  transition: all 0.3s ease;
}

.execution-panel__toggle:hover {
  height: 32px;
  width: 140px;
  box-shadow: 0 -6px 20px rgba(79, 70, 229, 0.2);
}

.execution-panel__toggle:hover::before {
  width: 50px;
  background: linear-gradient(90deg, transparent, var(--primary-color), transparent);
}

.execution-panel__toggle--collapsed {
  border-radius: 12px 12px 0 0;
}

.execution-panel__toggle--collapsed::before {
  top: auto;
  bottom: 0;
  border-radius: 2px 2px 0 0;
}

.execution-panel__toggle-indicator {
  color: var(--text-muted);
  font-size: 14px;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 4px;
}

.execution-panel__toggle:hover .execution-panel__toggle-indicator {
  color: var(--primary-color);
  transform: scale(1.1);
}

.execution-panel__header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color);
}

.execution-panel__status {
  display: flex;
  align-items: center;
  gap: 8px;
}

.execution-panel__status-indicator {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.execution-panel__status-indicator--idle,
.execution-panel__status-indicator--pending {
  background: var(--text-muted);
}

.execution-panel__status-indicator--running {
  background: var(--warning-color);
  animation: pulse 1s infinite;
}

.execution-panel__status-indicator--paused {
  background: var(--primary-color);
}

.execution-panel__status-indicator--completed {
  background: var(--success-color);
}

.execution-panel__status-indicator--failed,
.execution-panel__status-indicator--cancelled {
  background: var(--error-color);
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.execution-panel__status-text {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.execution-panel__info {
  flex: 1;
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: var(--text-secondary);
}

.execution-panel__action {
  background: none;
  border: none;
  font-size: 16px;
  color: var(--text-muted);
  cursor: pointer;
  padding: 4px;
  transition: color 0.2s;
}

.execution-panel__action:hover {
  color: var(--text-primary);
}

.execution-panel__body {
  max-height: 300px;
  overflow: hidden;
}

.execution-panel__flow {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color);
}

.execution-panel__flow-nodes {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 4px 0;
}

.execution-panel__flow-node {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  min-width: 80px;
  transition: all 0.2s;
}

.execution-panel__flow-node--pending {
  opacity: 0.6;
}

.execution-panel__flow-node--running {
  border-color: var(--warning-color);
  background: rgba(245, 158, 11, 0.1);
}

.execution-panel__flow-node--completed {
  border-color: var(--success-color);
  background: rgba(16, 185, 129, 0.1);
}

.execution-panel__flow-node--failed {
  border-color: var(--error-color);
  background: rgba(239, 68, 68, 0.1);
}

.execution-panel__flow-node-icon {
  font-size: 16px;
}

.execution-panel__flow-node-label {
  font-size: 11px;
  font-weight: 500;
  color: var(--text-primary);
  text-align: center;
}

.execution-panel__flow-node-time {
  font-size: 10px;
  color: var(--text-muted);
}

.execution-panel__output {
  display: flex;
  flex-direction: column;
  max-height: 150px;
}

.execution-panel__output-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background: var(--surface-color);
  border-bottom: 1px solid var(--border-color);
}

.execution-panel__output-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
}

.execution-panel__output-clear {
  background: none;
  border: none;
  font-size: 11px;
  color: var(--primary-color);
  cursor: pointer;
  padding: 2px 6px;
}

.execution-panel__output-content {
  flex: 1;
  overflow-y: auto;
  padding: 8px 16px;
  font-size: 12px;
  line-height: 1.6;
}

.execution-panel__output-item {
  margin-bottom: 4px;
  padding: 4px 8px;
  border-radius: 4px;
  background: var(--surface-color);
}

.execution-panel__output-item--info {
  border-left: 2px solid var(--primary-color);
}

.execution-panel__output-item--success {
  border-left: 2px solid var(--success-color);
}

.execution-panel__output-item--error {
  border-left: 2px solid var(--error-color);
}

.execution-panel__output-source {
  font-weight: 600;
  color: var(--primary-color);
}

.execution-panel__output-text {
  color: var(--text-primary);
}

.execution-panel__output-empty {
  color: var(--text-muted);
  text-align: center;
  padding: 20px;
}

.execution-panel__controls {
  display: flex;
  justify-content: center;
  gap: 12px;
  padding: 12px 16px;
  border-top: 1px solid var(--border-color);
}

.panel-slide-enter-active,
.panel-slide-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.panel-slide-enter-from,
.panel-slide-leave-to {
  max-height: 0;
  opacity: 0;
}

.panel-slide-enter-to,
.panel-slide-leave-from {
  max-height: 500px;
  opacity: 1;
}

/* 深色主题适配 */
.dark-theme .execution-panel {
  background: var(--card-background);
  border-top-color: var(--border-color);
}

.dark-theme .execution-panel__toggle {
  background: var(--card-background);
  border-color: var(--border-color);
}

.dark-theme .execution-panel__flow-node {
  background: var(--surface-color);
  border-color: var(--border-color);
}
</style>
