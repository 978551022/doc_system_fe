<template>
  <div class="kg-document-build">
    <!-- 操作栏 -->
    <div class="kg-build-actions">
      <el-button type="primary" @click="showBuildDialog">
        <i class="el-icon-plus"></i> 单文档构建
      </el-button>
      <el-button @click="showBatchDialog">
        <i class="el-icon-document"></i> 批量构建
      </el-button>
      <el-button @click="loadBuildTasks">
        <i class="el-icon-refresh"></i> 刷新
      </el-button>
      <div class="kg-build-actions__right">
        <el-select v-model="taskStatusFilter" @change="loadBuildTasks" placeholder="任务状态" style="width: 120px">
          <el-option label="全部" value="" />
          <el-option label="处理中" value="processing" />
          <el-option label="已完成" value="completed" />
          <el-option label="失败" value="failed" />
        </el-select>
      </div>
    </div>

    <!-- 构建任务列表 -->
    <div class="kg-build-list" v-loading="loading">
      <!-- 任务卡片 -->
      <div class="kg-build-cards" v-if="buildTasks.length > 0">
        <div
          v-for="task in buildTasks"
          :key="task.task_id"
          class="kg-build-card"
          :class="`kg-build-card--${task.status}`"
        >
          <div class="kg-build-card__header">
            <div class="kg-build-card__title">
              <i class="el-icon-document" />
              <span>{{ task.document_name || task.document_id }}</span>
            </div>
            <div class="kg-build-card__status">
              <el-tag :type="getStatusType(task.status)" size="small">
                {{ getStatusText(task.status) }}
              </el-tag>
            </div>
          </div>

          <div class="kg-build-card__body">
            <!-- 进度条 -->
            <div class="kg-build-progress" v-if="task.status === 'processing'">
              <el-progress :percentage="task.progress || 0" :status="task.progress === 100 ? 'success' : null" />
              <div class="kg-build-progress__text">{{ task.current_step || '处理中...' }}</div>
            </div>

            <!-- 统计信息 -->
            <div class="kg-build-stats" v-if="task.status === 'completed'">
              <div class="kg-build-stat">
                <span class="kg-build-stat__icon">📦</span>
                <span class="kg-build-stat__label">实体</span>
                <span class="kg-build-stat__value">{{ task.entity_count || 0 }}</span>
              </div>
              <div class="kg-build-stat">
                <span class="kg-build-stat__icon">🔗</span>
                <span class="kg-build-stat__label">关系</span>
                <span class="kg-build-stat__value">{{ task.relation_count || 0 }}</span>
              </div>
              <div class="kg-build-stat">
                <span class="kg-build-stat__icon">📄</span>
                <span class="kg-build-stat__label">段落</span>
                <span class="kg-build-stat__value">{{ task.chunk_count || 0 }}</span>
              </div>
            </div>

            <!-- 错误信息 -->
            <div class="kg-build-error" v-if="task.status === 'failed'">
              <i class="el-icon-warning"></i>
              <span>{{ task.error_message || '构建失败' }}</span>
            </div>

            <!-- 时间信息 -->
            <div class="kg-build-meta">
              <span><i class="el-icon-time"></i> {{ formatTime(task.created_at) }}</span>
              <span v-if="task.completed_at">
                <i class="el-icon-finished"></i> 耗时 {{ formatDuration(task.created_at, task.completed_at) }}
              </span>
            </div>
          </div>

          <div class="kg-build-card__footer">
            <el-button size="small" text @click="handleViewDetails(task)">
              <i class="el-icon-view"></i> 查看详情
            </el-button>
            <el-button
              size="small"
              text
              type="primary"
              v-if="task.status === 'completed'"
              @click="handleViewResult(task)"
            >
              <i class="el-icon-graph"></i> 查看图谱
            </el-button>
            <el-button
              size="small"
              text
              type="danger"
              v-if="task.status === 'failed'"
              @click="handleRetry(task)"
            >
              <i class="el-icon-refresh"></i> 重试
            </el-button>
            <el-button
              size="small"
              text
              type="danger"
              @click="handleDeleteTask(task)"
            >
              <i class="el-icon-delete"></i> 删除
            </el-button>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div class="kg-empty-state" v-else>
        <div class="kg-empty-icon">📄</div>
        <h3>暂无构建任务</h3>
        <p>还没有文档构建任务，可以从文档中提取知识图谱</p>
        <el-button type="primary" @click="showBuildDialog">
          <i class="el-icon-plus"></i> 开始构建
        </el-button>
      </div>
    </div>

    <!-- 分页 -->
    <div class="kg-build-pagination" v-if="totalPages > 1">
      <el-pagination
        :current-page="currentPage"
        :page-size="pageSize"
        :total="totalTasks"
        layout="total, prev, pager, next"
        @current-change="handlePageChange"
      />
    </div>

    <!-- 单文档构建对话框 -->
    <el-dialog
      v-model="buildDialogVisible"
      title="单文档构建知识图谱"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form :model="buildForm" label-width="120px" :rules="buildRules" ref="buildFormRef">
        <el-form-item label="选择文档" prop="document_id">
          <el-select
            v-model="buildForm.document_id"
            placeholder="请选择要构建的文档"
            filterable
            style="width: 100%"
            :loading="loadingDocuments"
          >
            <el-option
              v-for="doc in availableDocuments"
              :key="doc.id"
              :label="doc.title || doc.name"
              :value="doc.id"
            >
              <div style="display: flex; justify-content: space-between; align-items: center; width: 100%">
                <span>{{ doc.title || doc.name }}</span>
                <el-tag size="small" type="info">{{ doc.file_type || doc.type }}</el-tag>
              </div>
            </el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="异步处理">
          <el-switch v-model="buildForm.async" />
          <span class="kg-form-hint">开启后将在后台处理，适合大文档</span>
        </el-form-item>

        <el-form-item label="提取选项">
          <el-checkbox-group v-model="buildForm.extract_options">
            <el-checkbox label="entities">提取实体</el-checkbox>
            <el-checkbox label="relations">提取关系</el-checkbox>
            <el-checkbox label="aliases">提取别名</el-checkbox>
            <el-checkbox label="attributes">提取属性</el-checkbox>
          </el-checkbox-group>
        </el-form-item>

        <el-form-item label="实体类型" v-if="buildForm.extract_options.includes('entities')">
          <el-select v-model="buildForm.entity_types" multiple placeholder="选择要提取的实体类型" style="width: 100%">
            <el-option label="人物" value="人物" />
            <el-option label="组织" value="组织" />
            <el-option label="地点" value="地点" />
            <el-option label="概念" value="概念" />
            <el-option label="事件" value="事件" />
            <el-option label="技术" value="技术" />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="buildDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleStartBuild" :loading="building">
          {{ buildForm.async ? '开始构建' : '立即构建' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 批量构建对话框 -->
    <el-dialog
      v-model="batchDialogVisible"
      title="批量构建知识图谱"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form :model="batchForm" label-width="120px" :rules="batchRules" ref="batchFormRef">
        <el-form-item label="选择文档" prop="document_ids">
          <el-select
            v-model="batchForm.document_ids"
            placeholder="请选择要构建的文档（可多选）"
            multiple
            filterable
            style="width: 100%"
            :loading="loadingDocuments"
          >
            <el-option
              v-for="doc in availableDocuments"
              :key="doc.id"
              :label="doc.title || doc.name"
              :value="doc.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="并发数">
          <el-slider v-model="batchForm.concurrency" :min="1" :max="5" :marks="{ 1: '1', 3: '3', 5: '5' }" />
          <span class="kg-form-hint">同时处理的文档数量</span>
        </el-form-item>

        <el-form-item label="提取选项">
          <el-checkbox-group v-model="batchForm.extract_options">
            <el-checkbox label="entities">提取实体</el-checkbox>
            <el-checkbox label="relations">提取关系</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="batchDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleStartBatch" :loading="building">
          开始批量构建
        </el-button>
      </template>
    </el-dialog>

    <!-- 任务详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="构建任务详情"
      width="700px"
    >
      <div class="kg-task-detail" v-if="currentTask">
        <div class="kg-task-detail__header">
          <div class="kg-task-detail__title">
            <i class="el-icon-document"></i>
            {{ currentTask.document_name || currentTask.document_id }}
          </div>
          <el-tag :type="getStatusType(currentTask.status)">
            {{ getStatusText(currentTask.status) }}
          </el-tag>
        </div>

        <el-divider />

        <div class="kg-task-detail__section">
          <div class="kg-task-detail__label">任务信息</div>
          <div class="kg-task-detail__info">
            <div class="kg-task-info-row">
              <span class="kg-task-info__key">任务ID:</span>
              <span class="kg-task-info__value">{{ currentTask.task_id }}</span>
            </div>
            <div class="kg-task-info-row">
              <span class="kg-task-info__key">创建时间:</span>
              <span class="kg-task-info__value">{{ formatTime(currentTask.created_at) }}</span>
            </div>
            <div class="kg-task-info-row" v-if="currentTask.completed_at">
              <span class="kg-task-info__key">完成时间:</span>
              <span class="kg-task-info__value">{{ formatTime(currentTask.completed_at) }}</span>
            </div>
            <div class="kg-task-info-row" v-if="currentTask.completed_at">
              <span class="kg-task-info__key">耗时:</span>
              <span class="kg-task-info__value">{{ formatDuration(currentTask.created_at, currentTask.completed_at) }}</span>
            </div>
          </div>
        </div>

        <div class="kg-task-detail__section" v-if="currentTask.status === 'completed'">
          <div class="kg-task-detail__label">提取结果</div>
          <div class="kg-task-result">
            <div class="kg-task-result-item">
              <span class="kg-task-result-item__icon">📦</span>
              <span class="kg-task-result-item__label">实体数量:</span>
              <span class="kg-task-result-item__value">{{ currentTask.entity_count }}</span>
            </div>
            <div class="kg-task-result-item">
              <span class="kg-task-result-item__icon">🔗</span>
              <span class="kg-task-result-item__label">关系数量:</span>
              <span class="kg-task-result-item__value">{{ currentTask.relation_count }}</span>
            </div>
            <div class="kg-task-result-item">
              <span class="kg-task-result-item__icon">📄</span>
              <span class="kg-task-result-item__label">文档块数量:</span>
              <span class="kg-task-result-item__value">{{ currentTask.chunk_count }}</span>
            </div>
          </div>
        </div>

        <div class="kg-task-detail__section" v-if="currentTask.status === 'failed'">
          <div class="kg-task-detail__label">错误信息</div>
          <div class="kg-task-error-detail">
            <pre>{{ currentTask.error_message || '未知错误' }}</pre>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox, ElForm } from 'element-plus'
import { useNamespaceStore } from '../../stores/knowledgeGraph/namespaceStore.js'
import {
  buildFromDocument,
  buildFromDocumentAsync,
  buildFromDocumentsBatch,
  getBuildTaskStatus,
  getBuildTaskList
} from '../../api/knowledgeGraph.js'

const namespaceStore = useNamespaceStore()

// UI状态
const loading = ref(false)
const loadingDocuments = ref(false)
const building = ref(false)
const buildDialogVisible = ref(false)
const batchDialogVisible = ref(false)
const detailDialogVisible = ref(false)
const buildFormRef = ref(null)
const batchFormRef = ref(null)

// 筛选
const taskStatusFilter = ref('')

// 构建任务列表
const buildTasks = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const totalTasks = ref(0)
const totalPages = ref(0)

// 可用文档列表
const availableDocuments = ref([])

// 构建表单
const buildForm = ref({
  document_id: '',
  async: true,
  extract_options: ['entities', 'relations'],
  entity_types: ['人物', '组织', '地点', '概念']
})

// 批量构建表单
const batchForm = ref({
  document_ids: [],
  concurrency: 2,
  extract_options: ['entities', 'relations']
})

// 表单验证规则
const buildRules = {
  document_id: [
    { required: true, message: '请选择文档', trigger: 'change' }
  ]
}

const batchRules = {
  document_ids: [
    { required: true, message: '请选择至少一个文档', trigger: 'change' }
  ]
}

// 当前任务
const currentTask = ref(null)

// 轮询定时器
let pollingTimer = null

// 获取状态类型
function getStatusType(status) {
  const types = {
    'pending': 'info',
    'processing': 'warning',
    'completed': 'success',
    'failed': 'danger'
  }
  return types[status] || 'info'
}

// 获取状态文本
function getStatusText(status) {
  const texts = {
    'pending': '等待中',
    'processing': '处理中',
    'completed': '已完成',
    'failed': '失败'
  }
  return texts[status] || status
}

// 格式化时间
function formatTime(dateStr) {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN')
}

// 格式化持续时间
function formatDuration(startStr, endStr) {
  if (!startStr || !endStr) return '-'
  const start = new Date(startStr)
  const end = new Date(endStr)
  const diff = Math.floor((end - start) / 1000)

  if (diff < 60) return `${diff}秒`
  if (diff < 3600) return `${Math.floor(diff / 60)}分${diff % 60}秒`
  return `${Math.floor(diff / 3600)}时${Math.floor((diff % 3600) / 60)}分`
}

// 加载构建任务列表
async function loadBuildTasks() {
  const namespaceId = namespaceStore.currentNamespaceId
  if (!namespaceId) return

  loading.value = true
  try {
    const response = await getBuildTaskList(namespaceId, {
      status: taskStatusFilter.value || undefined,
      page: currentPage.value
    })

    if (response.code === 200) {
      buildTasks.value = response.data?.tasks || []
      totalTasks.value = response.data?.total || 0
      totalPages.value = Math.ceil(totalTasks.value / pageSize.value)
    }
  } catch (error) {
    console.error('加载构建任务失败:', error)
    ElMessage.error('加载构建任务失败')
  } finally {
    loading.value = false
  }
}

// 加载可用文档列表
async function loadAvailableDocuments() {
  loadingDocuments.value = true
  try {
    // 从文档服务获取文档列表
    // 这里使用 mock 数据，实际应该调用文档API
    availableDocuments.value = [
      { id: 'doc1', title: '人工智能技术白皮书', file_type: 'pdf' },
      { id: 'doc2', title: '机器学习入门教程', file_type: 'docx' },
      { id: 'doc3', title: '深度学习框架指南', file_type: 'pdf' },
      { id: 'doc4', title: '自然语言处理综述', file_type: 'pdf' },
      { id: 'doc5', title: '计算机视觉基础', file_type: 'pptx' }
    ]
  } catch (error) {
    console.error('加载文档列表失败:', error)
  } finally {
    loadingDocuments.value = false
  }
}

// 显示构建对话框
async function showBuildDialog() {
  await loadAvailableDocuments()
  buildForm.value = {
    document_id: '',
    async: true,
    extract_options: ['entities', 'relations'],
    entity_types: ['人物', '组织', '地点', '概念']
  }
  buildDialogVisible.value = true
}

// 显示批量构建对话框
async function showBatchDialog() {
  await loadAvailableDocuments()
  batchForm.value = {
    document_ids: [],
    concurrency: 2,
    extract_options: ['entities', 'relations']
  }
  batchDialogVisible.value = true
}

// 开始构建
async function handleStartBuild() {
  try {
    await buildFormRef.value.validate()
    building.value = true

    const namespaceId = namespaceStore.currentNamespaceId
    const data = {
      namespace_id: namespaceId,
      document_id: buildForm.value.document_id,
      extract_options: buildForm.value.extract_options,
      entity_types: buildForm.value.extract_options.includes('entities') ? buildForm.value.entity_types : []
    }

    if (buildForm.value.async) {
      // 异步构建
      const response = await buildFromDocumentAsync(data)
      if (response.code === 200) {
        ElMessage.success('构建任务已创建，正在后台处理')
        buildDialogVisible.value = false
        await loadBuildTasks()
        startPolling()
      }
    } else {
      // 同步构建
      ElMessage.info('正在构建，请稍候...')
      const response = await buildFromDocument(data)
      if (response.code === 200) {
        ElMessage.success(`构建完成！提取了 ${response.data?.entity_count || 0} 个实体，${response.data?.relation_count || 0} 个关系`)
        buildDialogVisible.value = false
        await loadBuildTasks()
      }
    }
  } catch (error) {
    if (error !== false) {
      console.error('启动构建失败:', error)
      ElMessage.error('启动构建失败')
    }
  } finally {
    building.value = false
  }
}

// 开始批量构建
async function handleStartBatch() {
  try {
    await batchFormRef.value.validate()
    building.value = true

    const namespaceId = namespaceStore.currentNamespaceId
    const data = {
      namespace_id: namespaceId,
      document_ids: batchForm.value.document_ids,
      concurrency: batchForm.value.concurrency,
      extract_options: batchForm.value.extract_options
    }

    const response = await buildFromDocumentsBatch(data)
    if (response.code === 200) {
      ElMessage.success(`已创建 ${batchForm.value.document_ids.length} 个构建任务`)
      batchDialogVisible.value = false
      await loadBuildTasks()
      startPolling()
    }
  } catch (error) {
    if (error !== false) {
      console.error('启动批量构建失败:', error)
      ElMessage.error('启动批量构建失败')
    }
  } finally {
    building.value = false
  }
}

// 查看详情
function handleViewDetails(task) {
  currentTask.value = task
  detailDialogVisible.value = true
}

// 查看图谱结果
function handleViewResult(task) {
  // 跳转到可视化页面
  window.location.href = `/knowledge-graph/visualization?task_id=${task.task_id}`
}

// 重试任务
async function handleRetry(task) {
  try {
    await ElMessageBox.confirm('确定要重新构建这个文档吗？', '确认重试', {
      type: 'warning'
    })

    const namespaceId = namespaceStore.currentNamespaceId
    const response = await buildFromDocumentAsync({
      namespace_id: namespaceId,
      document_id: task.document_id
    })

    if (response.code === 200) {
      ElMessage.success('已重新创建构建任务')
      await loadBuildTasks()
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('重试构建失败:', error)
      ElMessage.error('重试失败')
    }
  }
}

// 删除任务
async function handleDeleteTask(task) {
  try {
    await ElMessageBox.confirm('确定要删除这个任务记录吗？', '确认删除', {
      type: 'warning'
    })

    buildTasks.value = buildTasks.value.filter(t => t.task_id !== task.task_id)
    ElMessage.success('已删除任务记录')
  } catch (error) {
    // 用户取消
  }
}

// 分页变化
async function handlePageChange(page) {
  currentPage.value = page
  await loadBuildTasks()
}

// 开始轮询处理中的任务
function startPolling() {
  if (pollingTimer) return

  pollingTimer = setInterval(async () => {
    const hasProcessing = buildTasks.value.some(t => t.status === 'processing' || t.status === 'pending')
    if (hasProcessing) {
      await loadBuildTasks()
    } else {
      stopPolling()
    }
  }, 3000)
}

// 停止轮询
function stopPolling() {
  if (pollingTimer) {
    clearInterval(pollingTimer)
    pollingTimer = null
  }
}

// 初始化
onMounted(async () => {
  await loadBuildTasks()
  // 检查是否有处理中的任务，如果有则开始轮询
  const hasProcessing = buildTasks.value.some(t => t.status === 'processing' || t.status === 'pending')
  if (hasProcessing) {
    startPolling()
  }
})

onUnmounted(() => {
  stopPolling()
})
</script>

<style scoped>
.kg-document-build {
  padding: 24px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* 操作栏 */
.kg-build-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.kg-build-actions__right {
  margin-left: auto;
}

/* 构建列表 */
.kg-build-list {
  flex: 1;
  overflow-y: auto;
}

.kg-build-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 16px;
}

.kg-build-card {
  background: var(--card-background);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  overflow: hidden;
  transition: var(--transition);
}

.kg-build-card:hover {
  box-shadow: var(--shadow-md);
}

.kg-build-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--surface-color);
  border-bottom: 1px solid var(--border-color);
}

.kg-build-card__title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: var(--text-primary);
}

.kg-build-card__body {
  padding: 16px;
}

/* 进度 */
.kg-build-progress {
  margin-bottom: 12px;
}

.kg-build-progress__text {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 8px;
  text-align: center;
}

/* 统计 */
.kg-build-stats {
  display: flex;
  justify-content: space-around;
  padding: 12px 0;
  margin-bottom: 12px;
  background: var(--surface-color);
  border-radius: var(--radius-sm);
}

.kg-build-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.kg-build-stat__icon {
  font-size: 20px;
}

.kg-build-stat__label {
  font-size: 12px;
  color: var(--text-secondary);
}

.kg-build-stat__value {
  font-size: 18px;
  font-weight: 600;
  color: var(--primary-color);
}

/* 错误 */
.kg-build-error {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: #FEE2E2;
  border-radius: var(--radius-sm);
  color: #DC2626;
  font-size: 13px;
  margin-bottom: 12px;
}

.dark-theme .kg-build-error {
  background: rgba(220, 38, 38, 0.2);
}

/* 元信息 */
.kg-build-meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: var(--text-muted);
}

.kg-build-meta span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.kg-build-card__footer {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid var(--border-color);
  background: var(--surface-color);
}

/* 空状态 */
.kg-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-muted);
  text-align: center;
}

.kg-empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.kg-empty-state h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  color: var(--text-secondary);
}

.kg-empty-state p {
  margin: 0 0 24px 0;
}

/* 分页 */
.kg-build-pagination {
  display: flex;
  justify-content: center;
  padding: 16px 0;
  border-top: 1px solid var(--border-color);
  flex-shrink: 0;
}

/* 表单提示 */
.kg-form-hint {
  margin-left: 12px;
  font-size: 12px;
  color: var(--text-muted);
}

/* 任务详情 */
.kg-task-detail__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.kg-task-detail__title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.kg-task-detail__section {
  margin-bottom: 20px;
}

.kg-task-detail__label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 12px;
}

.kg-task-detail__info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.kg-task-info-row {
  display: flex;
  gap: 8px;
}

.kg-task-info__key {
  min-width: 80px;
  color: var(--text-secondary);
  font-size: 14px;
}

.kg-task-info__value {
  color: var(--text-primary);
  font-size: 14px;
}

.kg-task-result {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.kg-task-result-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px;
  background: var(--surface-color);
  border-radius: var(--radius-md);
}

.kg-task-result-item__icon {
  font-size: 32px;
}

.kg-task-result-item__label {
  font-size: 12px;
  color: var(--text-secondary);
}

.kg-task-result-item__value {
  font-size: 24px;
  font-weight: 600;
  color: var(--primary-color);
}

.kg-task-error-detail {
  padding: 12px;
  background: #FEE2E2;
  border-radius: var(--radius-sm);
}

.dark-theme .kg-task-error-detail {
  background: rgba(220, 38, 38, 0.2);
}

.kg-task-error-detail pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
  font-size: 12px;
  color: #DC2626;
}

/* 深色主题 */
.dark-theme .kg-build-card {
  background: var(--card-background);
  border-color: var(--border-color);
}

.dark-theme .kg-build-card__header,
.dark-theme .kg-build-card__footer {
  background: var(--surface-color);
  border-color: var(--border-color);
}

.dark-theme .kg-task-result-item {
  background: var(--surface-color);
}
</style>
