<template>
  <div class="kg-document-build">
    <!-- 左侧任务列表 -->
    <div class="kg-build-sidebar">
      <div class="kg-build-sidebar__header">
        <h3>构建任务</h3>
        <el-button size="small" type="primary" @click="showBuildDialog">
          <i class="el-icon-plus"></i> 新建
        </el-button>
      </div>

      <!-- 筛选 -->
      <div class="kg-build-sidebar__filter">
        <el-select v-model="taskStatusFilter" @change="handleFilterChange" placeholder="筛选状态" size="small">
          <el-option label="全部" value="" />
          <el-option label="处理中" value="processing" />
          <el-option label="已完成" value="completed" />
          <el-option label="失败" value="failed" />
        </el-select>
      </div>

      <!-- 任务列表 -->
      <div class="kg-build-sidebar__list" v-loading="loading">
        <div
          v-for="task in buildTasks"
          :key="task.id"
          class="kg-build-sidebar__item"
          :class="{
            'kg-build-sidebar__item--active': selectedTask?.id === task.id,
            'kg-build-sidebar__item--processing': task.status === 'processing',
            'kg-build-sidebar__item--completed': task.status === 'completed',
            'kg-build-sidebar__item--failed': task.status === 'failed',
            'kg-build-sidebar__item--pending': task.status === 'pending'
          }"
          @click="selectTask(task)"
        >
          <div class="kg-build-sidebar__item-header">
            <span class="kg-build-sidebar__item-doc-icon">📄</span>
            <span class="kg-build-sidebar__item-title">{{ task.document_name || task.document_id }}</span>
            <el-tag :type="getStatusType(task.status)" size="small">
              {{ getStatusText(task.status) }}
            </el-tag>
          </div>
          <div class="kg-build-sidebar__item-meta">
            <span class="kg-build-sidebar__item-time">{{ formatTimeShort(task.created_at) }}</span>
            <span v-if="task.status === 'processing'" class="kg-build-sidebar__item-progress">
              {{ task.progress || 0 }}%
            </span>
            <span v-else-if="task.status === 'completed'" class="kg-build-sidebar__item-stat">
              📦 {{ task.entity_count || 0 }} · 🔗 {{ task.relation_count || 0 }}
            </span>
          </div>
        </div>

        <!-- 空状态 -->
        <div class="kg-build-sidebar__empty" v-if="buildTasks.length === 0 && !loading">
          <div class="kg-empty-icon">📄</div>
          <p>暂无构建任务</p>
        </div>
      </div>

      <!-- 分页 -->
      <div class="kg-build-sidebar__pagination" v-if="totalPages > 1">
        <el-pagination
          :current-page="currentPage"
          :page-size="pageSize"
          :total="totalTasks"
          layout="prev, pager, next"
          small
          @current-change="handlePageChange"
        />
      </div>
    </div>

    <!-- 右侧任务详情 -->
    <div class="kg-build-detail">
      <!-- 未选择任务 -->
      <div class="kg-build-detail__empty" v-if="!selectedTask">
        <div class="kg-empty-icon">📋</div>
        <h3>选择一个任务查看详情</h3>
        <p>从左侧列表选择一个构建任务</p>
      </div>

      <!-- 任务详情 -->
      <div class="kg-build-detail__content" v-else>
        <!-- 头部 -->
        <div class="kg-build-detail__header">
          <div class="kg-build-detail__title">
            <i class="el-icon-document"></i>
            {{ selectedTask.document_name || selectedTask.document_id }}
          </div>
          <div class="kg-build-detail__actions">
            <el-button size="small" @click="loadBuildTasks">
              <i class="el-icon-refresh"></i> 刷新
            </el-button>
            <el-dropdown trigger="click" @command="handleTaskAction">
              <el-button size="small">
                操作 <i class="el-icon-arrow-down"></i>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="view-result" v-if="selectedTask.status === 'completed'">
                    <i class="el-icon-graph"></i> 查看图谱
                  </el-dropdown-item>
                  <el-dropdown-item command="retry" v-if="selectedTask.status === 'failed'">
                    <i class="el-icon-refresh"></i> 重试
                  </el-dropdown-item>
                  <el-dropdown-item command="delete" divided>
                    <i class="el-icon-delete"></i> 删除
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>

        <!-- 状态标签 -->
        <div class="kg-build-detail__status">
          <el-tag :type="getStatusType(selectedTask.status)" size="large">
            {{ getStatusText(selectedTask.status) }}
          </el-tag>
          <span class="kg-build-detail__id">任务ID: {{ selectedTask.id }}</span>
        </div>

        <!-- 进度条 -->
        <div class="kg-build-detail__progress" v-if="selectedTask.status === 'processing'">
          <el-progress :percentage="selectedTask.progress || 0" :status="selectedTask.progress === 100 ? 'success' : null" />
          <div class="kg-build-detail__step">{{ selectedTask.current_step || '处理中...' }}</div>
        </div>

        <!-- 统计信息 -->
        <div class="kg-build-detail__stats" v-if="selectedTask.status === 'completed'">
          <div class="kg-build-stat-card">
            <span class="kg-build-stat-card__icon">📦</span>
            <div class="kg-build-stat-card__info">
              <span class="kg-build-stat-card__value">{{ selectedTask.entity_count || 0 }}</span>
              <span class="kg-build-stat-card__label">实体</span>
            </div>
          </div>
          <div class="kg-build-stat-card">
            <span class="kg-build-stat-card__icon">🔗</span>
            <div class="kg-build-stat-card__info">
              <span class="kg-build-stat-card__value">{{ selectedTask.relation_count || 0 }}</span>
              <span class="kg-build-stat-card__label">关系</span>
            </div>
          </div>
          <div class="kg-build-stat-card">
            <span class="kg-build-stat-card__icon">📄</span>
            <div class="kg-build-stat-card__info">
              <span class="kg-build-stat-card__value">{{ selectedTask.chunk_count || 0 }}</span>
              <span class="kg-build-stat-card__label">段落</span>
            </div>
          </div>
        </div>

        <!-- 错误信息 -->
        <div class="kg-build-detail__error" v-if="selectedTask.status === 'failed'">
          <div class="kg-build-error-card">
            <i class="el-icon-warning"></i>
            <div class="kg-build-error-card__content">
              <span class="kg-build-error-card__title">构建失败</span>
              <span class="kg-build-error-card__message">{{ selectedTask.error_message || '未知错误' }}</span>
            </div>
          </div>
        </div>

        <!-- 时间信息 -->
        <div class="kg-build-detail__time">
          <div class="kg-build-time-item">
            <span class="kg-build-time-item__label">创建时间:</span>
            <span class="kg-build-time-item__value">{{ formatTime(selectedTask.created_at) }}</span>
          </div>
          <div class="kg-build-time-item" v-if="selectedTask.completed_at">
            <span class="kg-build-time-item__label">完成时间:</span>
            <span class="kg-build-time-item__value">{{ formatTime(selectedTask.completed_at) }}</span>
          </div>
          <div class="kg-build-time-item" v-if="selectedTask.completed_at">
            <span class="kg-build-time-item__label">耗时:</span>
            <span class="kg-build-time-item__value">{{ formatDuration(selectedTask.created_at, selectedTask.completed_at) }}</span>
          </div>
        </div>

        <!-- 任务结果摘要 -->
        <div class="kg-build-detail__result" v-if="selectedTask.result_summary">
          <h4>结果摘要</h4>
          <pre class="kg-build-detail__result-content">{{ JSON.stringify(selectedTask.result_summary, null, 2) }}</pre>
        </div>
      </div>
    </div>

    <!-- 单文档构建对话框 -->
    <el-dialog
      v-model="buildDialogVisible"
      title="单文档构建知识图谱"
      width="700px"
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
            @change="handleDocumentChange"
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

        <el-form-item label="文档内容" prop="document_text">
          <el-input
            v-model="buildForm.document_text"
            type="textarea"
            :rows="8"
            placeholder="请输入或粘贴文档的完整文本内容..."
            show-word-limit
          />
          <div class="kg-form-hint">
            文档内容为必填项。如果选择了已有文档，内容会自动填充。
          </div>
        </el-form-item>

        <el-form-item label="强制重建">
          <el-switch v-model="buildForm.force_rebuild" />
          <span class="kg-form-hint">开启后将重新构建已处理过的文档</span>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="buildDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleStartBuild" :loading="building">
          开始构建
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
      </el-form>

      <template #footer>
        <el-button @click="batchDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleStartBatch" :loading="building">
          开始批量构建
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { ElMessage, ElMessageBox, ElForm } from 'element-plus'
import { useNamespaceStore } from '../../stores/knowledgeGraph/namespaceStore.js'
import {
  buildFromDocument,
  buildFromDocumentAsync,
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

// 选中的任务
const selectedTask = ref(null)

// 可用文档列表
const availableDocuments = ref([])

// 构建表单
const buildForm = ref({
  document_id: '',
  document_text: '',
  force_rebuild: false
})

// 批量构建表单
const batchForm = ref({
  document_ids: [],
  concurrency: 2
})

// 表单验证规则
const buildRules = {
  document_id: [
    { required: true, message: '请选择文档', trigger: 'change' }
  ],
  document_text: [
    { required: true, message: '请输入文档内容', trigger: 'blur' }
  ]
}

const batchRules = {
  document_ids: [
    { required: true, message: '请选择至少一个文档', trigger: 'change' }
  ]
}

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

// 格式化时间（简短版，用于列表）
function formatTimeShort(dateStr) {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now - date

  // 小于1小时
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000)
    return minutes < 1 ? '刚刚' : `${minutes}分钟前`
  }
  // 今天
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }
  // 昨天
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) {
    return '昨天 ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }
  // 更早
  return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
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
  if (!namespaceId) {
    console.log('DocumentBuildPage: 没有选择命名空间')
    return
  }

  loading.value = true
  try {
    const response = await getBuildTaskList(namespaceId, {
      status: taskStatusFilter.value || undefined,
      page: currentPage.value
    })

    if (response.code === 200) {
      const tasks = response.data?.tasks || []
      buildTasks.value = tasks
      totalTasks.value = response.data?.total || 0
      totalPages.value = Math.ceil(totalTasks.value / pageSize.value)

      // 如果之前有选中的任务，更新选中任务的数据
      if (selectedTask.value) {
        const updated = tasks.find(t => t.id === selectedTask.value.id)
        if (updated) {
          selectedTask.value = updated
        }
      } else if (tasks.length > 0 && !selectedTask.value) {
        // 默认选择第一个任务
        selectTask(tasks[0])
      }
    }
  } catch (error) {
    console.error('加载构建任务失败:', error)
    ElMessage.error('加载构建任务失败: ' + (error.message || '未知错误'))
  } finally {
    loading.value = false
  }
}

// 选择任务
function selectTask(task) {
  selectedTask.value = task
}

// 筛选变化
async function handleFilterChange() {
  currentPage.value = 1
  selectedTask.value = null
  await loadBuildTasks()
}

// 分页变化
async function handlePageChange(page) {
  currentPage.value = page
  await loadBuildTasks()
}

// 加载文档内容
async function loadDocumentContent(documentId) {
  try {
    // TODO: 调用文档API获取内容
    const mockContent = `这是一个模拟的文档内容。
在实际使用中，这里应该从文档服务获取到文档"${documentId}"的完整文本内容。

人工智能（Artificial Intelligence，简称AI）是研究、开发用于模拟、延伸和扩展人的智能的理论、方法、技术及应用系统的一门新的技术科学。`

    buildForm.value.document_text = mockContent
  } catch (error) {
    console.error('加载文档内容失败:', error)
    ElMessage.warning('无法自动加载文档内容，请手动输入')
  }
}

// 文档选择变化
async function handleDocumentChange(documentId) {
  if (documentId) {
    await loadDocumentContent(documentId)
  }
}

// 加载可用文档列表
async function loadAvailableDocuments() {
  loadingDocuments.value = true
  try {
    availableDocuments.value = [
      { id: 'doc1', title: '人工智能技术白皮书', file_type: 'pdf' },
      { id: 'doc2', title: '机器学习入门教程', file_type: 'docx' },
      { id: 'doc3', title: '深度学习框架指南', file_type: 'pdf' },
      { id: 'doc4', title: '自然语言处理综述', file_type: 'pdf' },
      { id: 'doc5', title: '计算机视觉基础', file_type: 'pptx' }
    ]
  } catch (error) {
    console.error('加载文档列表失败:', error)
    ElMessage.error('加载文档列表失败')
  } finally {
    loadingDocuments.value = false
  }
}

// 显示构建对话框
async function showBuildDialog() {
  await loadAvailableDocuments()
  buildForm.value = {
    document_id: '',
    document_text: '',
    force_rebuild: false
  }
  buildDialogVisible.value = true
}

// 显示批量构建对话框
async function showBatchDialog() {
  await loadAvailableDocuments()
  batchForm.value = {
    document_ids: [],
    concurrency: 2
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
      document_id: buildForm.value.document_id,
      document_text: buildForm.value.document_text,
      namespace_id: namespaceId,
      force_rebuild: buildForm.value.force_rebuild
    }

    const response = await buildFromDocumentAsync(data)
    if (response.code === 200) {
      ElMessage.success('构建任务已创建，正在后台处理')
      buildDialogVisible.value = false
      await loadBuildTasks()
      startPolling()
    }
  } catch (error) {
    if (error !== false) {
      console.error('启动构建失败:', error)
      ElMessage.error('启动构建失败: ' + (error.message || '未知错误'))
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

    const promises = batchForm.value.document_ids.map(docId => {
      return buildFromDocumentAsync({
        document_id: docId,
        document_text: `批量构建文档 ${docId} 的内容`,
        namespace_id: namespaceId,
        force_rebuild: false
      })
    })

    const results = await Promise.allSettled(promises)
    const successCount = results.filter(r => r.status === 'fulfilled' && r.value.code === 200).length

    ElMessage.success(`已创建 ${successCount}/${batchForm.value.document_ids.length} 个构建任务`)
    batchDialogVisible.value = false
    await loadBuildTasks()
    startPolling()
  } catch (error) {
    if (error !== false) {
      console.error('启动批量构建失败:', error)
      ElMessage.error('启动批量构建失败')
    }
  } finally {
    building.value = false
  }
}

// 处理任务操作
async function handleTaskAction(command) {
  switch (command) {
    case 'view-result':
      window.location.href = `/knowledge-graph/visualization?task_id=${selectedTask.value.id}`
      break
    case 'retry':
      await handleRetry(selectedTask.value)
      break
    case 'delete':
      await handleDeleteTask(selectedTask.value)
      break
  }
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
      document_id: task.document_id,
      document_text: buildForm.value.document_text || `重试构建文档 ${task.document_id}`,
      force_rebuild: true
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

    buildTasks.value = buildTasks.value.filter(t => t.id !== task.id)
    if (selectedTask.value?.id === task.id) {
      selectedTask.value = buildTasks.value[0] || null
    }
    ElMessage.success('已删除任务记录')
  } catch (error) {
    // 用户取消
  }
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

// 监听命名空间变化
watch(() => namespaceStore.currentNamespaceId, (newId, oldId) => {
  if (newId && newId !== oldId) {
    selectedTask.value = null
    loadBuildTasks()
  }
})

// 初始化
onMounted(async () => {
  await loadBuildTasks()
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
  display: flex;
  height: 100%;
  gap: 0;
  overflow: hidden;
}

/* 左侧边栏 */
.kg-build-sidebar {
  width: 340px;
  display: flex;
  flex-direction: column;
  background: var(--card-background);
  border-right: 1px solid var(--border-color);
  flex-shrink: 0;
}

.kg-build-sidebar__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 16px;
  border-bottom: 1px solid var(--border-color);
  background: linear-gradient(180deg, var(--surface-color) 0%, transparent 100%);
}

.kg-build-sidebar__header h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 8px;
}

.kg-build-sidebar__header h3::before {
  content: '📋';
  font-size: 18px;
}

.kg-build-sidebar__filter {
  padding: 12px 14px;
  border-bottom: 1px solid var(--border-color);
  background: var(--surface-color);
}

.kg-build-sidebar__filter .el-select {
  width: 100%;
}

/* 任务列表 - 带自定义滚动条 */
.kg-build-sidebar__list {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  scroll-behavior: smooth;
}

/* 自定义滚动条样式 */
.kg-build-sidebar__list::-webkit-scrollbar {
  width: 6px;
}

.kg-build-sidebar__list::-webkit-scrollbar-track {
  background: transparent;
}

.kg-build-sidebar__list::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 3px;
  transition: background 0.2s;
}

.kg-build-sidebar__list::-webkit-scrollbar-thumb:hover {
  background: var(--text-muted);
}

/* 任务项卡片 */
.kg-build-sidebar__item {
  position: relative;
  padding: 14px 16px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  margin-bottom: 10px;
  border: 1px solid var(--border-color);
  background: var(--card-background);
  overflow: hidden;
}

.kg-build-sidebar__item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: var(--border-color);
  border-radius: 12px 0 0 12px;
  transition: all 0.25s ease;
}

.kg-build-sidebar__item--processing::before {
  background: linear-gradient(180deg, #F59E0B 0%, #FBBF24 100%);
  animation: pulse-border 2s ease-in-out infinite;
}

.kg-build-sidebar__item--completed::before {
  background: linear-gradient(180deg, #10B981 0%, #34D399 100%);
}

.kg-build-sidebar__item--failed::before {
  background: linear-gradient(180deg, #EF4444 0%, #F87171 100%);
}

.kg-build-sidebar__item--pending::before {
  background: linear-gradient(180deg, #6366F1 0%, #818CF8 100%);
}

@keyframes pulse-border {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.kg-build-sidebar__item:hover {
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border-color: var(--primary-color);
}

.dark-theme .kg-build-sidebar__item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.kg-build-sidebar__item--active {
  background: linear-gradient(135deg, var(--primary-color) 0%, #4F46E5 100%);
  border-color: transparent;
  box-shadow: 0 8px 20px rgba(99, 102, 241, 0.3);
  transform: translateX(4px);
}

.kg-build-sidebar__item--active::before {
  background: rgba(255, 255, 255, 0.3);
}

.kg-build-sidebar__item--active .kg-build-sidebar__item-title,
.kg-build-sidebar__item--active .kg-build-sidebar__item-time,
.kg-build-sidebar__item--active .kg-build-sidebar__item-progress,
.kg-build-sidebar__item--active .kg-build-sidebar__item-doc-icon {
  color: white;
}

.kg-build-sidebar__item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  gap: 8px;
}

.kg-build-sidebar__item-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.4;
}

.kg-build-sidebar__item-doc-icon {
  font-size: 16px;
  opacity: 0.7;
  flex-shrink: 0;
}

.kg-build-sidebar__item-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 11px;
  padding-top: 4px;
  border-top: 1px solid var(--border-color);
  margin-top: 8px;
}

.kg-build-sidebar__item--active .kg-build-sidebar__item-meta {
  border-top-color: rgba(255, 255, 255, 0.2);
}

.kg-build-sidebar__item-time {
  color: var(--text-muted);
  display: flex;
  align-items: center;
  gap: 4px;
}

.kg-build-sidebar__item-time::before {
  content: '🕐';
  font-size: 10px;
  opacity: 0.6;
}

.kg-build-sidebar__item-progress {
  color: #F59E0B;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 4px;
}

.kg-build-sidebar__item--active .kg-build-sidebar__item-progress {
  color: white;
}

.kg-build-sidebar__item-progress::before {
  content: '';
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
  animation: pulse-dot 1.5s ease-in-out infinite;
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(0.8); }
}

.kg-build-sidebar__item-stat {
  color: var(--text-muted);
  font-size: 10px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.kg-build-sidebar__item--active .kg-build-sidebar__item-stat {
  color: rgba(255, 255, 255, 0.8);
}

/* 空状态 */
.kg-build-sidebar__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: var(--text-muted);
  text-align: center;
}

.kg-build-sidebar__empty .kg-empty-icon {
  font-size: 56px;
  margin-bottom: 16px;
  opacity: 0.4;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.kg-build-sidebar__empty p {
  margin: 0;
  font-size: 13px;
  color: var(--text-secondary);
}

.kg-build-sidebar__pagination {
  padding: 12px 14px;
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: center;
  background: var(--surface-color);
}

/* 右侧详情 */
.kg-build-detail {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.kg-build-detail__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-muted);
  text-align: center;
}

.kg-build-detail__empty .kg-empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.kg-build-detail__empty h3 {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: var(--text-secondary);
}

.kg-build-detail__empty p {
  margin: 0;
  font-size: 13px;
}

.kg-build-detail__content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.kg-build-detail__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-color);
}

.kg-build-detail__title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.kg-build-detail__actions {
  display: flex;
  gap: 8px;
}

.kg-build-detail__status {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.kg-build-detail__id {
  font-size: 13px;
  color: var(--text-muted);
}

.kg-build-detail__progress {
  margin-bottom: 24px;
  padding: 16px;
  background: var(--surface-color);
  border-radius: var(--radius-md);
}

.kg-build-detail__step {
  margin-top: 12px;
  font-size: 13px;
  color: var(--text-secondary);
  text-align: center;
}

.kg-build-detail__stats {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
}

.kg-build-stat-card {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: var(--surface-color);
  border-radius: var(--radius-md);
}

.kg-build-stat-card__icon {
  font-size: 28px;
}

.kg-build-stat-card__info {
  display: flex;
  flex-direction: column;
}

.kg-build-stat-card__value {
  font-size: 24px;
  font-weight: 600;
  color: var(--primary-color);
  line-height: 1;
}

.kg-build-stat-card__label {
  font-size: 12px;
  color: var(--text-muted);
}

.kg-build-detail__error {
  margin-bottom: 24px;
}

.kg-build-error-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #FEE2E2;
  border-radius: var(--radius-md);
  color: #DC2626;
}

.dark-theme .kg-build-error-card {
  background: rgba(220, 38, 38, 0.2);
}

.kg-build-error-card__content {
  display: flex;
  flex-direction: column;
}

.kg-build-error-card__title {
  font-weight: 600;
  margin-bottom: 4px;
}

.kg-build-error-card__message {
  font-size: 13px;
  opacity: 0.9;
}

.kg-build-detail__time {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  background: var(--surface-color);
  border-radius: var(--radius-md);
  margin-bottom: 24px;
}

.kg-build-time-item {
  display: flex;
  font-size: 13px;
}

.kg-build-time-item__label {
  min-width: 80px;
  color: var(--text-secondary);
}

.kg-build-time-item__value {
  color: var(--text-primary);
}

.kg-build-detail__result {
  margin-bottom: 24px;
}

.kg-build-detail__result h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
}

.kg-build-detail__result-content {
  margin: 0;
  padding: 16px;
  background: var(--surface-color);
  border-radius: var(--radius-md);
  font-size: 12px;
  color: var(--text-primary);
  white-space: pre-wrap;
  word-break: break-all;
  overflow-x: auto;
}

/* 表单提示 */
.kg-form-hint {
  margin-left: 12px;
  font-size: 12px;
  color: var(--text-muted);
}

/* 深色主题 */
.dark-theme .kg-build-sidebar {
  background: var(--card-background);
  border-color: var(--border-color);
}

.dark-theme .kg-build-stat-card,
.dark-theme .kg-build-detail__step,
.dark-theme .kg-build-detail__time,
.dark-theme .kg-build-detail__result-content {
  background: var(--surface-color);
}
</style>
