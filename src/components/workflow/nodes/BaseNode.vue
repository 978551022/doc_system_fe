<template>
  <div
    :class="[
      'workflow-node',
      `workflow-node--${nodeType}`,
      `workflow-node--${status}`,
      {
        'workflow-node--selected': isSelected,
        'workflow-node--executing': isExecuting
      }
    ]"
    :style="nodeStyle"
  >
    <!-- 节点头部 -->
    <div class="workflow-node__header">
      <div class="workflow-node__header-left">
        <span class="workflow-node__icon">{{ nodeIcon }}</span>
        <span class="workflow-node__label">{{ label }}</span>
      </div>
      <div class="workflow-node__header-right" v-if="showActions">
        <button
          class="workflow-node__action"
          @click.stop="$emit('configure')"
          title="配置"
          v-if="!isStartOrEnd"
        >
          ⚙️
        </button>
        <button
          class="workflow-node__action"
          @click.stop="$emit('duplicate')"
          title="复制"
        >
          📋
        </button>
        <button
          class="workflow-node__action"
          @click.stop="$emit('delete')"
          title="删除"
        >
          ❌
        </button>
      </div>
    </div>

    <!-- 节点内容 -->
    <div class="workflow-node__content" v-if="hasContent">
      <div class="workflow-node__info" v-if="agentType">
        <span class="workflow-node__info-label">类型:</span>
        <span class="workflow-node__info-value">{{ agentTypeName }}</span>
      </div>
      <div class="workflow-node__info" v-if="modelName">
        <span class="workflow-node__info-label">模型:</span>
        <span class="workflow-node__info-value">{{ modelName }}</span>
      </div>
      <div class="workflow-node__info" v-if="description">
        <span class="workflow-node__info-value workflow-node__description">{{ description }}</span>
      </div>
    </div>

    <!-- 节点状态 -->
    <div class="workflow-node__status" v-if="showStatus && status !== 'idle'">
      <div class="workflow-node__status-indicator" :class="`status-indicator--${status}`"></div>
      <span class="workflow-node__status-text">{{ statusText }}</span>
    </div>

    <!-- 执行进度 -->
    <div class="workflow-node__progress" v-if="showProgress && progress > 0">
      <div class="workflow-node__progress-bar">
        <div class="workflow-node__progress-fill" :style="{ width: progress + '%' }"></div>
      </div>
      <span class="workflow-node__progress-text">{{ progress }}%</span>
    </div>

    <!-- Handle（连接点） -->
    <Handle
      v-if="showSourceHandle"
      type="source"
      :position="Position.Right"
      class="workflow-node__handle workflow-node__handle--source"
    />
    <Handle
      v-if="showTargetHandle"
      type="target"
      :position="Position.Left"
      class="workflow-node__handle workflow-node__handle--target"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Handle, Position } from '@vue-flow/core'
import { NodeType } from '../../../utils/workflow/nodeTypes.js'
import { getAgentConfig } from '../../../utils/workflow/nodeTypes.js'

const props = defineProps({
  id: String,
  type: String,
  data: Object,
  selected: Boolean,
  // 执行状态
  status: {
    type: String,
    default: 'idle' // idle | ready | running | completed | failed | skipped
  },
  progress: {
    type: Number,
    default: 0
  },
  // UI配置
  showActions: {
    type: Boolean,
    default: true
  },
  showStatus: {
    type: Boolean,
    default: false
  },
  showProgress: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['configure', 'duplicate', 'delete'])

// 节点类型
const nodeType = computed(() => {
  return props.type || NodeType.AGENT
})

// 是否是开始或结束节点
const isStartOrEnd = computed(() => {
  return props.type === NodeType.START || props.type === NodeType.END
})

// 节点图标
const nodeIcon = computed(() => {
  if (props.data?.icon) return props.data.icon

  switch (props.type) {
    case NodeType.START:
      return '🟢'
    case NodeType.END:
      return '🔴'
    case NodeType.AGENT:
      return getAgentConfig(props.data?.agentType)?.icon || '🤖'
    case NodeType.CONDITION:
      return '🔀'
    case NodeType.LOOP:
      return '🔄'
    default:
      return '📦'
  }
})

// 节点标签
const label = computed(() => {
  return props.data?.label || '未命名节点'
})

// Agent类型
const agentType = computed(() => {
  return props.data?.agentType
})

// Agent类型名称
const agentTypeName = computed(() => {
  return getAgentConfig(props.data?.agentType)?.name || ''
})

// 模型名称
const modelName = computed(() => {
  return props.data?.config?.model || ''
})

// 描述
const description = computed(() => {
  return props.data?.description || getAgentConfig(props.data?.agentType)?.description || ''
})

// 是否有内容显示
const hasContent = computed(() => {
  return agentType.value || modelName.value || description.value
})

// 是否被选中
const isSelected = computed(() => props.selected)

// 是否正在执行
const isExecuting = computed(() => {
  return props.status === 'running' || props.status === 'thinking'
})

// 状态文本
const statusText = computed(() => {
  const statusMap = {
    idle: '空闲',
    ready: '就绪',
    running: '执行中',
    thinking: '思考中',
    completed: '完成',
    failed: '失败',
    skipped: '跳过'
  }
  return statusMap[props.status] || ''
})

// 节点样式
const nodeStyle = computed(() => {
  let backgroundColor = ''
  let borderColor = ''

  // 根据节点类型设置颜色
  switch (props.type) {
    case NodeType.START:
      backgroundColor = 'var(--node-start-bg, #10b981)'
      break
    case NodeType.END:
      backgroundColor = 'var(--node-end-bg, #ef4444)'
      break
    case NodeType.AGENT:
      const agentConfig = getAgentConfig(props.data?.agentType)
      backgroundColor = agentConfig?.color || 'var(--node-agent-bg, #3b82f6)'
      break
    case NodeType.CONDITION:
      backgroundColor = 'var(--node-condition-bg, #eab308)'
      break
    case NodeType.LOOP:
      backgroundColor = 'var(--node-loop-bg, #d946ef)'
      break
  }

  // 根据状态设置边框
  if (props.status === 'running') {
    borderColor = 'var(--node-running-border, #f59e0b)'
  } else if (props.status === 'completed') {
    borderColor = 'var(--node-completed-border, #10b981)'
  } else if (props.status === 'failed') {
    borderColor = 'var(--node-failed-border, #ef4444)'
  }

  return {
    '--node-bg-color': backgroundColor,
    '--node-border-color': borderColor
  }
})

// 显示源连接点
const showSourceHandle = computed(() => {
  return props.type !== NodeType.END
})

// 显示目标连接点
const showTargetHandle = computed(() => {
  return props.type !== NodeType.START
})
</script>

<style scoped>
.workflow-node {
  --node-width: 240px;
  --node-border-radius: 8px;
  --node-padding: 12px;

  position: relative;
  min-width: var(--node-width);
  border-radius: var(--node-border-radius);
  background: var(--card-background);
  border: 2px solid var(--border-color);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
  overflow: hidden;
}

.workflow-node:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.workflow-node--selected {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.2);
}

.workflow-node--executing {
  animation: node-pulse 1.5s ease-in-out infinite;
}

@keyframes node-pulse {
  0%, 100% {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
  50% {
    box-shadow: 0 0 20px rgba(245, 158, 11, 0.4);
  }
}

.workflow-node__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--node-padding);
  background: var(--node-bg-color, var(--primary-color));
  color: white;
  font-weight: 600;
  font-size: 13px;
}

.workflow-node__header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.workflow-node__icon {
  font-size: 16px;
}

.workflow-node__label {
  font-size: 13px;
}

.workflow-node__header-right {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}

.workflow-node:hover .workflow-node__header-right {
  opacity: 1;
}

.workflow-node__action {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 4px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 12px;
  transition: background 0.2s;
}

.workflow-node__action:hover {
  background: rgba(255, 255, 255, 0.3);
}

.workflow-node__content {
  padding: var(--node-padding);
  font-size: 12px;
  color: var(--text-primary);
}

.workflow-node__info {
  display: flex;
  gap: 4px;
  margin-bottom: 4px;
}

.workflow-node__info-label {
  color: var(--text-muted);
}

.workflow-node__info-value {
  color: var(--text-primary);
}

.workflow-node__description {
  color: var(--text-secondary);
  font-style: italic;
}

.workflow-node__status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px var(--node-padding);
  background: var(--surface-color);
  border-top: 1px solid var(--border-color);
  font-size: 11px;
}

.workflow-node__status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-indicator--ready {
  background: #3b82f6;
}

.status-indicator--running,
.status-indicator--thinking {
  background: #f59e0b;
  animation: blink 1s infinite;
}

.status-indicator--completed {
  background: #10b981;
}

.status-indicator--failed {
  background: #ef4444;
}

.status-indicator--skipped {
  background: #cbd5e1;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.workflow-node__status-text {
  color: var(--text-secondary);
}

.workflow-node__progress {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px var(--node-padding);
  background: var(--surface-color);
  border-top: 1px solid var(--border-color);
  font-size: 11px;
}

.workflow-node__progress-bar {
  flex: 1;
  height: 4px;
  background: var(--border-color);
  border-radius: 2px;
  overflow: hidden;
}

.workflow-node__progress-fill {
  height: 100%;
  background: var(--success-color);
  transition: width 0.3s ease;
}

.workflow-node__progress-text {
  color: var(--text-muted);
  min-width: 35px;
  text-align: right;
}

.workflow-node__handle {
  width: 12px;
  height: 12px;
  background: var(--primary-color);
  border: 2px solid white;
  border-radius: 50%;
  transition: all 0.2s;
}

.workflow-node__handle:hover {
  transform: scale(1.2);
  box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.2);
}

.workflow-node__handle--source {
  right: -6px;
}

.workflow-node__handle--target {
  left: -6px;
}

/* 深色主题适配 */
.dark-theme .workflow-node {
  background: var(--card-background);
  border-color: var(--border-color);
}

.dark-theme .workflow-node__content {
  color: var(--text-primary);
}

.dark-theme .workflow-node__status,
.dark-theme .workflow-node__progress {
  background: var(--surface-color);
}
</style>
