<template>
  <div class="canvas-workflow">
    <!-- 工具栏 -->
    <div class="canvas-workflow__toolbar">
      <div class="canvas-workflow__toolbar-left">
        <el-button type="primary" size="small" @click="handleNewWorkflow">
          <i class="el-icon-plus"></i> 新建
        </el-button>
        <el-button size="small" @click="handleOpenWorkflow" :disabled="!currentWorkflow">
          <i class="el-icon-folder-opened"></i> 打开
        </el-button>
        <el-button size="small" @click="handleSaveWorkflow" :disabled="!hasUnsavedChanges">
          <i class="el-icon-document"></i> 保存
        </el-button>
        <el-button size="small" @click="validateAndSave" :disabled="!canSave">
          <i class="el-icon-check"></i> 验证
        </el-button>
      </div>

      <div class="canvas-workflow__toolbar-center">
        <span class="canvas-workflow__title" v-if="currentWorkflow">
          {{ currentWorkflow.name }}
          <span v-if="hasUnsavedChanges" class="canvas-workflow__unsaved">*</span>
        </span>
        <span class="canvas-workflow__title" v-else>未命名工作流</span>
      </div>

      <div class="canvas-workflow__toolbar-right">
        <el-button
          size="small"
          @click="templateGalleryRef?.open()"
          :disabled="isExecuting"
        >
          <i class="el-icon-document-copy"></i> 模板
        </el-button>
        <el-button
          type="primary"
          size="small"
          @click="handleExecute"
          :disabled="!canExecute || isExecuting"
        >
          <i class="el-icon-video-play"></i> 执行
        </el-button>
        <el-button size="small" @click="toggleNodeLibrary">
          <i :class="nodeLibraryVisible ? 'el-icon-d-arrow-left' : 'el-icon-d-arrow-right'"></i>
        </el-button>
      </div>
    </div>

    <!-- 主内容区 -->
    <div class="canvas-workflow__content">
      <!-- 节点库侧边栏 -->
      <transition name="slide-left">
        <div class="canvas-workflow__sidebar" v-show="nodeLibraryVisible">
          <NodeLibrary />
        </div>
      </transition>

      <!-- 画布区域 -->
      <div class="canvas-workflow__canvas">
        <WorkflowCanvas
          ref="canvasRef"
          :show-grid="showGrid"
          :show-minimap="showMinimap"
          @node-selected="handleNodeSelected"
          @edge-selected="handleEdgeSelected"
          @selection-cleared="handleSelectionCleared"
          @load-template="templateGalleryRef?.open()"
        />
      </div>

      <!-- 节点配置侧边栏 -->
      <transition name="slide-right">
        <div class="canvas-workflow__config" v-show="configPanelVisible">
          <NodeConfig
            v-if="selectedNode"
            :node="selectedNode"
            @close="closeConfigPanel"
            @save="handleNodeConfigSave"
          />
          <div v-else class="canvas-workflow__config-empty">
            <p>选择一个节点以配置</p>
          </div>
        </div>
      </transition>
    </div>

    <!-- 执行面板 -->
    <ExecutionPanel
      ref="executionPanelRef"
      :workflow="currentWorkflow"
      :collapsed="executionPanelCollapsed"
      @toggle-collapse="executionPanelCollapsed = !executionPanelCollapsed"
      @pause="handlePause"
      @resume="handleResume"
      @cancel="handleCancel"
    />

    <!-- 模板画廊 -->
    <TemplateGallery ref="templateGalleryRef" @select="handleSelectTemplate" />

    <!-- 验证结果对话框 -->
    <el-dialog v-model="validationVisible" title="验证结果" width="500px">
      <div class="validation-result">
        <div v-if="validationResult?.isValid" class="validation-result__success">
          <i class="el-icon-success" style="font-size: 32px; color: var(--success-color)"></i>
          <p>工作流验证通过！</p>
        </div>
        <div v-else>
          <div v-if="validationResult?.errors?.length > 0" class="validation-result__errors">
            <h4>错误 ({{ validationResult.errors.length }})</h4>
            <ul>
              <li v-for="(error, index) in validationResult.errors" :key="'error-' + index">
                {{ error.message }}
              </li>
            </ul>
          </div>
          <div v-if="validationResult?.warnings?.length > 0" class="validation-result__warnings">
            <h4>警告 ({{ validationResult.warnings.length }})</h4>
            <ul>
              <li v-for="(warning, index) in validationResult.warnings" :key="'warning-' + index">
                {{ warning.message }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 保存对话框 -->
    <el-dialog v-model="saveDialogVisible" title="保存工作流" width="400px">
      <el-form :model="saveForm" label-width="80px">
        <el-form-item label="名称">
          <el-input v-model="saveForm.name" placeholder="请输入工作流名称" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="saveForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入工作流描述"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="saveDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useVueFlow } from '@vue-flow/core'
import workflowStore from '../stores/workflowStore.js'
import { validateWorkflow } from '../utils/workflow/workflowValidator.js'
import agentApi from '../api/agent.js'

import WorkflowCanvas from '../components/workflow/canvas/WorkflowCanvas.vue'
import NodeLibrary from '../components/workflow/panels/NodeLibrary.vue'
import NodeConfig from '../components/workflow/panels/NodeConfig.vue'
import ExecutionPanel from '../components/workflow/execution/ExecutionPanel.vue'
import TemplateGallery from '../components/workflow/templates/TemplateGallery.vue'

const canvasRef = ref(null)
const executionPanelRef = ref(null)
const templateGalleryRef = ref(null)

// UI状态
const nodeLibraryVisible = ref(true)
const configPanelVisible = ref(false)
const showGrid = ref(true)
const showMinimap = ref(true)

// 执行面板默认收缩
const executionPanelCollapsed = ref(true)

// 当前工作流
const currentWorkflow = computed(() => workflowStore.currentWorkflow)

// 是否有未保存的更改
const hasUnsavedChanges = computed(() => workflowStore.unsavedChanges)

// 是否可以执行
const canExecute = computed(() => workflowStore.canExecute)

// 是否可以保存
const canSave = computed(() => currentWorkflow.value && currentWorkflow.value.nodes.length > 0)

// 是否正在执行
const isExecuting = computed(() => workflowStore.isExecuting)

// 选中的节点
const selectedNode = ref(null)

// 验证相关
const validationVisible = ref(false)
const validationResult = ref(null)

// 保存对话框
const saveDialogVisible = ref(false)
const saveForm = ref({
  name: '',
  description: ''
})

// AbortController用于中断执行
let abortController = null

// 新建工作流
function handleNewWorkflow() {
  if (hasUnsavedChanges.value) {
    ElMessageBox.confirm('当前工作流有未保存的更改，是否保存？', '提示', {
      confirmButtonText: '保存',
      cancelButtonText: '不保存',
      distinguishCancelAndClose: true,
      type: 'warning'
    }).then(() => {
      handleSaveWorkflow().then(() => {
        workflowStore.createWorkflow()
      })
    }).catch((action) => {
      if (action === 'cancel') {
        workflowStore.createWorkflow()
      }
    })
  } else {
    workflowStore.createWorkflow()
  }
}

// 打开工作流
function handleOpenWorkflow() {
  ElMessage.info('工作流列表功能开发中...')
}

// 保存工作流
async function handleSaveWorkflow() {
  if (!currentWorkflow.value) return

  saveForm.value.name = currentWorkflow.value.name
  saveForm.value.description = currentWorkflow.value.description
  saveDialogVisible.value = true
}

// 确认保存
async function confirmSave() {
  try {
    const updated = workflowStore.updateWorkflow({
      name: saveForm.value.name,
      description: saveForm.value.description
    })

    // 调用后端API保存
    await agentApi.createWorkflow(updated)

    workflowStore.unsavedChanges = false
    saveDialogVisible.value = false
    ElMessage.success('工作流保存成功')
  } catch (error) {
    console.error('保存工作流失败:', error)
    ElMessage.error(`保存失败: ${error.message}`)
  }
}

// 验证并保存
function validateAndSave() {
  if (!currentWorkflow.value) {
    ElMessage.warning('请先创建工作流')
    return
  }

  validationResult.value = validateWorkflow(currentWorkflow.value)
  validationVisible.value = true

  if (validationResult.value.isValid) {
    ElMessage.success('工作流验证通过')
  } else {
    ElMessage.warning(`发现 ${validationResult.value.errors.length} 个错误`)
  }
}

// 执行工作流
async function handleExecute() {
  if (!currentWorkflow.value) return

  // 先验证
  const validation = validateWorkflow(currentWorkflow.value)
  if (!validation.isValid) {
    ElMessage.error('工作流验证失败，请先修正错误')
    validationResult.value = validation
    validationVisible.value = true
    return
  }

  // 创建AbortController
  abortController = new AbortController()

  try {
    // 启动执行
    const execution = workflowStore.startExecution({})

    // 调用后端API执行
    await agentApi.executeWorkflow(
      {
        workflow_id: currentWorkflow.value.id,
        input: {}
      },
      // onChunk
      (chunk) => {
        executionPanelRef.value?.addOutput(chunk, 'info')
      },
      // onMetadata
      (metadata) => {
        if (metadata.type === 'task_started') {
          workflowStore.updateNodeState(metadata.data.node_id, {
            status: 'running',
            startedAt: new Date().toISOString()
          })
        } else if (metadata.type === 'task_completed') {
          workflowStore.updateNodeState(metadata.data.node_id, {
            status: 'completed',
            completedAt: new Date().toISOString(),
            output: metadata.data.output
          })
        }
      },
      // onError
      (error) => {
        executionPanelRef.value?.addOutput(error, 'error')
        workflowStore.failExecution(error)
      },
      // onComplete
      () => {
        workflowStore.completeExecution()
        ElMessage.success('工作流执行完成')
      },
      abortController?.signal
    )

    ElMessage.success('工作流执行启动成功')
  } catch (error) {
    if (error.name !== 'AbortError') {
      console.error('执行失败:', error)
      executionPanelRef.value?.addOutput(error.message, 'error')
      workflowStore.failExecution(error.message)
      ElMessage.error(`执行失败: ${error.message}`)
    }
  }
}

// 暂停执行
async function handlePause() {
  try {
    if (workflowStore.currentExecution?.id) {
      await agentApi.pauseExecution(workflowStore.currentExecution.id)
      workflowStore.pauseExecution()
      ElMessage.info('执行已暂停')
    }
  } catch (error) {
    console.error('暂停失败:', error)
    ElMessage.error(`暂停失败: ${error.message}`)
  }
}

// 恢复执行
async function handleResume() {
  try {
    if (workflowStore.currentExecution?.id) {
      await agentApi.resumeExecution(workflowStore.currentExecution.id)
      workflowStore.resumeExecution()
      ElMessage.info('执行已恢复')
    }
  } catch (error) {
    console.error('恢复失败:', error)
    ElMessage.error(`恢复失败: ${error.message}`)
  }
}

// 取消执行
async function handleCancel() {
  try {
    if (abortController) {
      abortController.abort()
    }

    if (workflowStore.currentExecution?.id) {
      await agentApi.cancelExecution(workflowStore.currentExecution.id)
    }

    workflowStore.cancelExecution()
    ElMessage.info('执行已取消')
  } catch (error) {
    console.error('取消失败:', error)
    ElMessage.error(`取消失败: ${error.message}`)
  }
}

// 选择模板
function handleSelectTemplate(templateId) {
  workflowStore.loadTemplate(templateId)
  ElMessage.success('模板加载成功')
}

// 节点选中
function handleNodeSelected(node) {
  selectedNode.value = node
  configPanelVisible.value = true
}

// 边选中
function handleEdgeSelected(edge) {
  configPanelVisible.value = false
}

// 清除选择
function handleSelectionCleared() {
  selectedNode.value = null
  configPanelVisible.value = false
}

// 关闭配置面板
function closeConfigPanel() {
  configPanelVisible.value = false
}

// 保存节点配置
function handleNodeConfigSave(data) {
  workflowStore.updateNode(selectedNode.value.id, { data })
  ElMessage.success('节点配置已保存')
}

// 切换节点库显示
function toggleNodeLibrary() {
  nodeLibraryVisible.value = !nodeLibraryVisible.value
}

// 键盘快捷键
function handleKeyDown(event) {
  // Delete键删除选中元素
  if (event.key === 'Delete' || event.key === 'Backspace') {
    if (event.target.tagName !== 'INPUT' && event.target.tagName !== 'TEXTAREA') {
      workflowStore.deleteSelected()
    }
  }

  // Ctrl+S 保存
  if (event.ctrlKey && event.key === 's') {
    event.preventDefault()
    handleSaveWorkflow()
  }

  // Ctrl+N 新建
  if (event.ctrlKey && event.key === 'n') {
    event.preventDefault()
    handleNewWorkflow()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeyDown)
  // 立即创建默认工作流（如果不存在）
  // 使用 nextTick 确保在 DOM 更新前完成
  if (!workflowStore.currentWorkflow) {
    workflowStore.createWorkflow({
      name: '未命名工作流',
      description: ''
    })
  }
})

// 监听 currentWorkflow 变化，确保工作流存在
watch(() => workflowStore.currentWorkflow, (workflow) => {
  if (!workflow) {
    // 如果工作流不存在，创建一个默认的
    workflowStore.createWorkflow({
      name: '未命名工作流',
      description: ''
    })
  }
}, { immediate: true })

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
})
</script>

<style scoped>
.canvas-workflow {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--background-color);
}

.canvas-workflow__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background: var(--card-background);
  border-bottom: 1px solid var(--border-color);
  gap: 16px;
}

.canvas-workflow__toolbar-left,
.canvas-workflow__toolbar-right {
  display: flex;
  gap: 8px;
}

.canvas-workflow__toolbar-center {
  flex: 1;
  text-align: center;
}

.canvas-workflow__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.canvas-workflow__unsaved {
  color: var(--warning-color);
}

.canvas-workflow__content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.canvas-workflow__sidebar {
  width: 240px;
  flex-shrink: 0;
  border-right: 1px solid var(--border-color);
}

.canvas-workflow__canvas {
  flex: 1;
  position: relative;
}

.canvas-workflow__config {
  width: 280px;
  flex-shrink: 0;
  border-left: 1px solid var(--border-color);
}

.canvas-workflow__config-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-muted);
  font-size: 13px;
}

/* 滑动动画 */
.slide-left-enter-active,
.slide-left-leave-active {
  transition: all 0.3s ease;
}

.slide-left-enter-from,
.slide-left-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}

.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.3s ease;
}

.slide-right-enter-from,
.slide-right-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

/* 验证结果 */
.validation-result {
  padding: 16px 0;
}

.validation-result__success {
  text-align: center;
  color: var(--success-color);
}

.validation-result__errors,
.validation-result__warnings {
  margin-bottom: 16px;
}

.validation-result__errors h4 {
  color: var(--error-color);
  margin-bottom: 8px;
}

.validation-result__warnings h4 {
  color: var(--warning-color);
  margin-bottom: 8px;
}

.validation-result ul {
  margin: 0;
  padding-left: 20px;
}

.validation-result li {
  margin-bottom: 4px;
  font-size: 13px;
  color: var(--text-primary);
}

/* 深色主题适配 */
.dark-theme .canvas-workflow__toolbar {
  background: var(--card-background);
  border-bottom-color: var(--border-color);
}

.dark-theme .canvas-workflow__sidebar,
.dark-theme .canvas-workflow__config {
  border-color: var(--border-color);
}
</style>
