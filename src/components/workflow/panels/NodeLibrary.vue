<template>
  <div class="node-library">
    <div class="node-library__search">
      <el-input
        v-model="searchQuery"
        placeholder="搜索节点..."
        size="small"
        clearable
      >
        <template #prefix>
          <i class="el-icon-search"></i>
        </template>
      </el-input>
    </div>

    <div class="node-library__categories">
      <div class="node-library__category" v-for="category in filteredCategories" :key="category.name">
        <div class="node-library__category-header" @click="toggleCategory(category.name)">
          <span class="node-library__category-icon">{{ category.icon }}</span>
          <span class="node-library__category-name">{{ category.name }}</span>
          <i
            :class="[
              'el-icon-arrow-down',
              'node-library__category-arrow',
              { 'node-library__category-arrow--expanded': expandedCategories.has(category.name) }
            ]"
          ></i>
        </div>

        <transition name="accordion">
          <div class="node-library__items" v-show="expandedCategories.has(category.name)">
            <div
              v-for="node in category.nodes"
              :key="node.type"
              class="node-library__item"
              :draggable="true"
              @dragstart="onDragStart($event, node)"
              @dragend="onDragEnd"
            >
              <span class="node-library__item-icon">{{ node.icon }}</span>
              <span class="node-library__item-name">{{ node.name }}</span>
              <span class="node-library__item-description">{{ node.description }}</span>
            </div>
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { NodeType } from '../../../utils/workflow/nodeTypes.js'
import { getAgentTypes } from '../../../utils/workflow/nodeTypes.js'
import { getCollaborationModes } from '../../../utils/workflow/collaborationModes.js'

const emit = defineEmits(['add-node'])

const searchQuery = ref('')
const expandedCategories = ref(new Set(['基础节点', '智能体节点']))

// 节点分类
const categories = ref([
  {
    name: '基础节点',
    icon: '📦',
    nodes: [
      {
        type: NodeType.START,
        name: '开始',
        icon: '🟢',
        description: '工作流开始',
        data: { label: '开始' }
      },
      {
        type: NodeType.END,
        name: '结束',
        icon: '🔴',
        description: '工作流结束',
        data: { label: '结束' }
      }
    ]
  },
  {
    name: '智能体节点',
    icon: '🤖',
    nodes: getAgentTypes().map(agent => ({
      type: NodeType.AGENT,
      name: agent.name,
      icon: agent.icon,
      description: agent.description,
      data: {
        label: agent.name,
        agentType: agent.value,
        config: {
          model: agent.defaultModel,
          tools: agent.defaultTools,
          temperature: 0.7,
          maxTokens: 2000,
          systemPrompt: agent.systemPrompt
        }
      }
    }))
  },
  {
    name: '控制节点',
    icon: '🔀',
    nodes: [
      {
        type: NodeType.CONDITION,
        name: '条件分支',
        icon: '🔀',
        description: '根据条件选择分支',
        data: { label: '条件分支' }
      },
      {
        type: NodeType.LOOP,
        name: '循环',
        icon: '🔄',
        description: '重复执行直到满足条件',
        data: { label: '循环' }
      }
    ]
  }
])

// 过滤后的分类
const filteredCategories = computed(() => {
  if (!searchQuery.value) return categories.value

  const query = searchQuery.value.toLowerCase()
  return categories.value.map(category => ({
    ...category,
    nodes: category.nodes.filter(node =>
      node.name.toLowerCase().includes(query) ||
      node.description.toLowerCase().includes(query)
    )
  })).filter(category => category.nodes.length > 0)
})

// 切换分类展开状态
function toggleCategory(categoryName) {
  if (expandedCategories.value.has(categoryName)) {
    expandedCategories.value.delete(categoryName)
  } else {
    expandedCategories.value.add(categoryName)
  }
}

// 拖拽开始
function onDragStart(event, node) {
  event.dataTransfer.effectAllowed = 'copy'
  event.dataTransfer.setData('application/vueflow', JSON.stringify(node))
  event.target.classList.add('node-library__item--dragging')
}

// 拖拽结束
function onDragEnd(event) {
  event.target.classList.remove('node-library__item--dragging')
}
</script>

<style scoped>
.node-library {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--card-background);
  border-right: 1px solid var(--border-color);
}

.node-library__search {
  padding: 12px;
  border-bottom: 1px solid var(--border-color);
}

.node-library__categories {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.node-library__category {
  margin-bottom: 8px;
}

.node-library__category-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  cursor: pointer;
  user-select: none;
  transition: background 0.2s;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
}

.node-library__category-header:hover {
  background: var(--surface-color);
}

.node-library__category-icon {
  font-size: 16px;
}

.node-library__category-name {
  flex: 1;
}

.node-library__category-arrow {
  transition: transform 0.2s;
  font-size: 12px;
  color: var(--text-muted);
}

.node-library__category-arrow--expanded {
  transform: rotate(180deg);
}

.node-library__items {
  padding: 0 8px;
}

.accordion-enter-active,
.accordion-leave-active {
  transition: all 0.2s ease;
  overflow: hidden;
}

.accordion-enter-from,
.accordion-leave-to {
  max-height: 0;
  opacity: 0;
}

.accordion-enter-to,
.accordion-leave-from {
  max-height: 500px;
  opacity: 1;
}

.node-library__item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  margin: 4px 0;
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  cursor: grab;
  transition: all 0.2s;
  user-select: none;
}

.node-library__item:hover {
  background: var(--menu-item-hover);
  border-color: var(--primary-color);
  transform: translateX(2px);
}

.node-library__item:active {
  cursor: grabbing;
}

.node-library__item--dragging {
  opacity: 0.5;
}

.node-library__item-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.node-library__item-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  flex-shrink: 0;
}

.node-library__item-description {
  font-size: 11px;
  color: var(--text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 深色主题适配 */
.dark-theme .node-library {
  background: var(--card-background);
  border-right-color: var(--border-color);
}

.dark-theme .node-library__category-header {
  color: var(--text-primary);
}

.dark-theme .node-library__category-header:hover {
  background: var(--surface-color);
}

.dark-theme .node-library__item {
  background: var(--surface-color);
  border-color: var(--border-color);
}

.dark-theme .node-library__item:hover {
  background: var(--menu-item-hover);
}
</style>
