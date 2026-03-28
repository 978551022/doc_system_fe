<template>
  <div class="node-config">
    <div class="node-config__header">
      <h3 class="node-config__title">节点配置</h3>
      <button class="node-config__close" @click="$emit('close')">
        <i class="el-icon-close"></i>
      </button>
    </div>

    <div class="node-config__body">
      <!-- 基础配置 -->
      <div class="node-config__section">
        <h4 class="node-config__section-title">基础信息</h4>

        <div class="node-config__field">
          <label class="node-config__label">显示名称</label>
          <el-input v-model="localData.label" placeholder="请输入节点名称" size="small" />
        </div>

        <div class="node-config__field" v-if="nodeDescription">
          <span class="node-config__description">{{ nodeDescription }}</span>
        </div>
      </div>

      <!-- Agent配置 -->
      <template v-if="node.type === 'agent'">
        <div class="node-config__section">
          <h4 class="node-config__section-title">Agent配置</h4>

          <div class="node-config__field">
            <label class="node-config__label">Agent类型</label>
            <el-select v-model="localData.agentType" size="small" style="width: 100%" :disabled="readonly">
              <el-option
                v-for="agent in agentTypes"
                :key="agent.value"
                :label="agent.name"
                :value="agent.value"
              >
                <span style="margin-right: 8px">{{ agent.icon }}</span>
                {{ agent.name }}
              </el-option>
            </el-select>
          </div>

          <div class="node-config__field">
            <label class="node-config__label">模型</label>
            <el-select v-model="localData.config.model" size="small" style="width: 100%">
              <el-option
                v-for="model in models"
                :key="model.value"
                :label="model.label"
                :value="model.value"
              />
            </el-select>
          </div>

          <div class="node-config__field">
            <label class="node-config__label">系统提示词</label>
            <el-input
              v-model="localData.config.systemPrompt"
              type="textarea"
              :rows="4"
              placeholder="自定义系统提示词..."
              size="small"
            />
          </div>
        </div>

        <div class="node-config__section">
          <h4 class="node-config__section-title">参数设置</h4>

          <div class="node-config__field">
            <label class="node-config__label">
              Temperature
              <span class="node-config__value">{{ localData.config.temperature }}</span>
            </label>
            <el-slider
              v-model="localData.config.temperature"
              :min="0"
              :max="2"
              :step="0.1"
              :show-tooltip="false"
              size="small"
            />
          </div>

          <div class="node-config__field">
            <label class="node-config__label">最大Token数</label>
            <el-input-number
              v-model="localData.config.maxTokens"
              :min="100"
              :max="32000"
              :step="100"
              size="small"
              style="width: 100%"
            />
          </div>
        </div>

        <div class="node-config__section">
          <h4 class="node-config__section-title">工具选择</h4>

          <div class="node-config__tools">
            <el-checkbox
              v-for="tool in availableTools"
              :key="tool.key"
              v-model="localData.config.tools"
              :label="tool.key"
              size="small"
            >
              <div class="node-config__tool-item">
                <span class="node-config__tool-name">{{ tool.name }}</span>
                <span class="node-config__tool-desc">{{ tool.description }}</span>
              </div>
            </el-checkbox>
          </div>
        </div>
      </template>

      <!-- 条件节点配置 -->
      <template v-if="node.type === 'condition'">
        <div class="node-config__section">
          <h4 class="node-config__section-title">条件配置</h4>

          <div class="node-config__field">
            <label class="node-config__label">条件表达式</label>
            <el-input
              v-model="localData.config.condition"
              placeholder="例如: {{input}}.type === 'technical'"
              size="small"
            />
          </div>

          <div class="node-config__field">
            <label class="node-config__label">分支配置</label>
            <div class="node-config__branches">
              <div
                v-for="(branch, index) in localData.config.branches"
                :key="index"
                class="node-config__branch"
              >
                <el-input
                  v-model="branch.condition"
                  placeholder="条件"
                  size="small"
                  style="flex: 1"
                />
                <el-button
                  size="small"
                  type="text"
                  @click="removeBranch(index)"
                  :disabled="localData.config.branches.length <= 1"
                >
                  <i class="el-icon-delete"></i>
                </el-button>
              </div>
              <el-button size="small" type="dashed" @click="addBranch" style="width: 100%">
                <i class="el-icon-plus"></i> 添加分支
              </el-button>
            </div>
          </div>
        </div>
      </template>

      <!-- 循环节点配置 -->
      <template v-if="node.type === 'loop'">
        <div class="node-config__section">
          <h4 class="node-config__section-title">循环配置</h4>

          <div class="node-config__field">
            <label class="node-config__label">退出条件</label>
            <el-input
              v-model="localData.config.exitCondition"
              placeholder="例如: {{result}}.success === true"
              size="small"
            />
          </div>

          <div class="node-config__field">
            <label class="node-config__label">最大循环次数</label>
            <el-input-number
              v-model="localData.config.maxIterations"
              :min="1"
              :max="100"
              size="small"
              style="width: 100%"
            />
          </div>
        </div>
      </template>
    </div>

    <div class="node-config__footer">
      <el-button size="small" @click="$emit('close')">取消</el-button>
      <el-button type="primary" size="small" @click="handleSave">保存</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { getAgentConfig, getAgentTypes, AVAILABLE_MODELS, AVAILABLE_TOOLS } from '../../../utils/workflow/nodeTypes.js'

const props = defineProps({
  node: Object,
  readonly: Boolean
})

const emit = defineEmits(['close', 'save'])

// 本地数据副本
const localData = ref({
  label: '',
  agentType: '',
  description: '',
  config: {
    model: 'glm-4',
    tools: [],
    temperature: 0.7,
    maxTokens: 2000,
    systemPrompt: '',
    condition: '',
    branches: [{ condition: '' }],
    exitCondition: '',
    maxIterations: 10
  }
})

// 初始化本地数据
watch(() => props.node, (node) => {
  if (node) {
    localData.value = {
      label: node.data?.label || '',
      agentType: node.data?.agentType || '',
      description: node.data?.description || '',
      config: {
        model: node.data?.config?.model || 'glm-4',
        tools: node.data?.config?.tools || [],
        temperature: node.data?.config?.temperature ?? 0.7,
        maxTokens: node.data?.config?.maxTokens || 2000,
        systemPrompt: node.data?.config?.systemPrompt || '',
        condition: node.data?.config?.condition || '',
        branches: node.data?.config?.branches || [{ condition: '' }],
        exitCondition: node.data?.config?.exitCondition || '',
        maxIterations: node.data?.config?.maxIterations || 10
      }
    }
  }
}, { immediate: true })

// Agent类型列表
const agentTypes = computed(() => getAgentTypes())

// 模型列表
const models = computed(() => AVAILABLE_MODELS)

// 可用工具列表
const availableTools = computed(() => {
  const agentConfig = getAgentConfig(localData.value.agentType)
  const toolKeys = agentConfig?.availableTools || []
  return toolKeys.map(key => ({
    key,
    ...AVAILABLE_TOOLS[key]
  }))
})

// 节点描述
const nodeDescription = computed(() => {
  return getAgentConfig(localData.value.agentType)?.description || ''
})

// 添加分支
function addBranch() {
  localData.value.config.branches.push({ condition: '' })
}

// 删除分支
function removeBranch(index) {
  localData.value.config.branches.splice(index, 1)
}

// 保存配置
function handleSave() {
  emit('save', {
    ...props.node.data,
    ...localData.value
  })
}
</script>

<style scoped>
.node-config {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--card-background);
  border-left: 1px solid var(--border-color);
}

.node-config__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid var(--border-color);
}

.node-config__title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.node-config__close {
  background: none;
  border: none;
  font-size: 18px;
  color: var(--text-muted);
  cursor: pointer;
  padding: 4px;
  transition: color 0.2s;
}

.node-config__close:hover {
  color: var(--text-primary);
}

.node-config__body {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.node-config__section {
  margin-bottom: 24px;
}

.node-config__section:last-child {
  margin-bottom: 0;
}

.node-config__section-title {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.node-config__field {
  margin-bottom: 16px;
}

.node-config__field:last-child {
  margin-bottom: 0;
}

.node-config__label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
}

.node-config__value {
  color: var(--primary-color);
  font-weight: 600;
}

.node-config__description {
  font-size: 12px;
  color: var(--text-muted);
  line-height: 1.5;
}

.node-config__tools {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.node-config__tool-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.node-config__tool-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
}

.node-config__tool-desc {
  font-size: 11px;
  color: var(--text-muted);
}

.node-config__branches {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.node-config__branch {
  display: flex;
  gap: 8px;
}

.node-config__footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px;
  border-top: 1px solid var(--border-color);
}

/* 深色主题适配 */
.dark-theme .node-config {
  background: var(--card-background);
  border-left-color: var(--border-color);
}

.dark-theme .node-config__title,
.dark-theme .node-config__section-title {
  color: var(--text-primary);
}

.dark-theme .node-config__label {
  color: var(--text-secondary);
}
</style>
