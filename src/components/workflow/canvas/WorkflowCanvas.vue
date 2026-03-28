<template>
  <div class="workflow-canvas" @drop="onDrop" @dragover="onDragOver">
    <VueFlow
      v-model:nodes="nodes"
      v-model:edges="edges"
      :node-types="nodeTypes"
      :default-viewport="{ zoom: 1, x: 0, y: 0 }"
      :min-zoom="0.2"
      :max-zoom="2"
      :fit-view-on-init="false"
      @node-click="onNodeClick"
      @edge-click="onEdgeClick"
      @connect="onConnect"
      @nodes-change="onNodesChange"
      @edges-change="onEdgesChange"
      @delete="onDelete"
    >
      <!-- 背景 -->
      <Background
        :pattern="showGrid ? 'dots' : 'solid'"
        :gap="showGrid ? 20 : 1"
        :color="showGrid ? 'var(--border-color)' : 'transparent'"
      />

      <!-- 控制组件 -->
      <Controls />

      <!-- 小地图 -->
      <MiniMap v-if="showMinimap" />
    </VueFlow>

    <!-- 空状态提示 -->
    <div v-if="nodes.length === 0" class="workflow-canvas__empty">
      <div class="workflow-canvas__empty-icon">📊</div>
      <h3 class="workflow-canvas__empty-title">开始创建工作流</h3>
      <p class="workflow-canvas__empty-desc">
        从左侧节点库拖拽节点到画布，或从模板创建
      </p>
      <el-button type="primary" @click="$emit('load-template')">
        <i class="el-icon-document-copy"></i> 从模板创建
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { VueFlow, useVueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { MiniMap } from '@vue-flow/minimap'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/controls/dist/style.css'
import '@vue-flow/minimap/dist/style.css'

import StartNode from '../nodes/StartNode.vue'
import EndNode from '../nodes/EndNode.vue'
import AgentNode from '../nodes/AgentNode.vue'
import ConditionNode from '../nodes/ConditionNode.vue'
import LoopNode from '../nodes/LoopNode.vue'

import workflowStore from '../../../stores/workflowStore.js'

const props = defineProps({
  showGrid: {
    type: Boolean,
    default: true
  },
  showMinimap: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['node-selected', 'edge-selected', 'selection-cleared', 'load-template'])

// 节点类型映射
const nodeTypes = {
  start: StartNode,
  end: EndNode,
  agent: AgentNode,
  condition: ConditionNode,
  loop: LoopNode
}

// 节点和边
const nodes = computed({
  get: () => workflowStore.currentWorkflow?.nodes || [],
  set: (value) => {
    if (workflowStore.currentWorkflow) {
      workflowStore.updateWorkflow({ nodes: value })
    }
  }
})

const edges = computed({
  get: () => workflowStore.currentWorkflow?.edges || [],
  set: (value) => {
    if (workflowStore.currentWorkflow) {
      workflowStore.updateWorkflow({ edges: value })
    }
  }
})

// 节点点击
function onNodeClick(event) {
  workflowStore.selectNode(event.node.id, event.multiSelectionActive)
  emit('node-selected', event.node)
}

// 边点击
function onEdgeClick(event) {
  workflowStore.selectEdge(event.edge.id, event.multiSelectionActive)
  emit('edge-selected', event.edge)
}

// 连接节点
function onConnect(connection) {
  workflowStore.addEdge(connection)
}

// 节点变化
function onNodesChange(changes) {
  // 处理节点位置变化等
  changes.forEach(change => {
    if (change.type === 'position' && change.position) {
      workflowStore.updateNode(change.id, {
        position: change.position
      })
    }
  })
}

// 边变化
function onEdgesChange(changes) {
  // 处理边的变化
}

// 删除
function onDelete() {
  workflowStore.deleteSelected()
}

// 拖放处理
function onDragOver(event) {
  event.preventDefault()
  event.dataTransfer.dropEffect = 'copy'
}

function onDrop(event) {
  const nodeData = event.dataTransfer.getData('application/vueflow')
  if (!nodeData) return

  const parsedData = JSON.parse(nodeData)
  const position = {
    x: event.offsetX - 120,
    y: event.offsetY - 40
  }

  workflowStore.addNode({
    type: parsedData.type,
    position,
    data: parsedData.data
  })
}

// 清除选择
function clearSelection() {
  workflowStore.clearSelection()
  emit('selection-cleared')
}

// 暴露方法给父组件
defineExpose({
  clearSelection,
  fitView: () => {
    // TODO: 实现适应视图
  }
})
</script>

<style scoped>
.workflow-canvas {
  position: relative;
  width: 100%;
  height: 100%;
  background: var(--background-color);
}

.workflow-canvas :deep(.vue-flow) {
  background: transparent;
}

.workflow-canvas :deep(.vue-flow__node.selected) {
  box-shadow: 0 0 0 2px var(--primary-color);
}

.workflow-canvas :deep(.vue-flow__edge-path) {
  stroke: var(--text-muted);
  stroke-width: 2;
}

.workflow-canvas :deep(.vue-flow__edge.selected .vue-flow__edge-path) {
  stroke: var(--primary-color);
  stroke-width: 3;
}

.workflow-canvas :deep(.vue-flow__edge-path:hover) {
  stroke: var(--primary-color);
}

.workflow-canvas :deep(.vue-flow__controls) {
  bottom: 20px;
  left: 20px;
}

.workflow-canvas :deep(.vue-flow__controls-button) {
  background: var(--card-background);
  border-color: var(--border-color);
  color: var(--text-primary);
}

.workflow-canvas :deep(.vue-flow__controls-button:hover) {
  background: var(--surface-color);
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.workflow-canvas :deep(.vue-flow__minimap) {
  background: var(--card-background);
  border-color: var(--border-color);
}

.workflow-canvas :deep(.vue-flow__minimap-mask) {
  fill: var(--primary-color);
  fill-opacity: 0.1;
}

.workflow-canvas :deep(.vue-flow__minimap-node) {
  fill: var(--primary-color);
}

.workflow-canvas__empty {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  padding: 40px;
}

.workflow-canvas__empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.workflow-canvas__empty-title {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.workflow-canvas__empty-desc {
  margin: 0 0 24px 0;
  font-size: 14px;
  color: var(--text-muted);
}

/* 深色主题适配 */
.dark-theme .workflow-canvas {
  background: var(--background-color);
}

.dark-theme .workflow-canvas :deep(.vue-flow__edge-path) {
  stroke: var(--text-muted);
}

.dark-theme .workflow-canvas :deep(.vue-flow__controls-button) {
  background: var(--card-background);
  border-color: var(--border-color);
  color: var(--text-primary);
}

.dark-theme .workflow-canvas :deep(.vue-flow__minimap) {
  background: var(--card-background);
  border-color: var(--border-color);
}
</style>
