<template>
  <div class="kg-disambiguation">
    <!-- 操作栏 -->
    <div class="kg-disambiguation-actions">
      <el-button type="primary" @click="showFindDialog">
        <i class="el-icon-search"></i> 查找重复实体
      </el-button>
      <el-button @click="showSuggestDialog">
        <i class="el-icon-magic-stick"></i> 合并建议
      </el-button>
      <el-button @click="loadPendingTasks">
        <i class="el-icon-refresh"></i> 刷新待处理
      </el-button>
      <div class="kg-disambiguation-actions__right">
        <el-button type="warning" plain @click="handleAutoMerge" :loading="autoMerging">
          <i class="el-icon-cpu"></i> 自动合并高置信度
        </el-button>
      </div>
    </div>

    <!-- 待处理任务列表 -->
    <div class="kg-disambiguation-content" v-loading="loading">
      <!-- 任务卡片 -->
      <div class="kg-disambiguation-cards" v-if="pendingTasks.length > 0">
        <div
          v-for="(task, index) in pendingTasks"
          :key="index"
          class="kg-disambiguation-card"
        >
          <div class="kg-disambiguation-card__header">
            <div class="kg-disambiguation-card__title">
              <i class="el-icon-warning-outline" />
              <span>重复实体组 #{{ index + 1 }}</span>
            </div>
            <el-tag type="warning" size="small">
              相似度: {{ (task.similarity * 100).toFixed(1) }}%
            </el-tag>
          </div>

          <div class="kg-disambiguation-card__body">
            <div class="kg-entity-group">
              <div
                v-for="(entity, entityIndex) in task.entities"
                :key="entity.entity_id"
                class="kg-entity-item"
                :class="{ 'kg-entity-item--target': entityIndex === task.suggested_target }"
              >
                <div class="kg-entity-item__header">
                  <el-radio
                    v-model="task.targetEntityId"
                    :label="entity.entity_id"
                    @change="updateTarget(index, entity.entity_id)"
                  >
                    {{ entityIndex === task.suggested_target ? '推荐保留' : '可合并' }}
                  </el-radio>
                </div>

                <div class="kg-entity-item__content">
                  <div class="kg-entity-item__name">{{ entity.name }}</div>
                  <div class="kg-entity-item__meta">
                    <el-tag size="small" :color="getEntityTypeColor(entity.entity_type)">
                      {{ entity.entity_type }}
                    </el-tag>
                    <span v-if="entity.aliases && entity.aliases.length > 0" class="kg-entity-item__aliases">
                      别名: {{ entity.aliases.join(', ') }}
                    </span>
                  </div>
                  <div class="kg-entity-item__desc" v-if="entity.description">
                    {{ entity.description }}
                  </div>
                  <div class="kg-entity-item__stats">
                    <span><i class="el-icon-connection"></i> {{ entity.relation_count || 0 }} 关系</span>
                    <span><i class="el-icon-document"></i> {{ entity.document_count || 0 }} 文档</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 合并策略 -->
            <div class="kg-merge-strategy">
              <div class="kg-merge-strategy__label">合并策略:</div>
              <el-radio-group v-model="task.mergeStrategy" size="small">
                <el-radio label="keep_most_complete">保留最完整</el-radio>
                <el-radio label="keep_all_aliases">保留所有别名</el-radio>
                <el-radio label="keep_latest">保留最新</el-radio>
              </el-radio-group>
            </div>
          </div>

          <div class="kg-disambiguation-card__footer">
            <el-button size="small" text @click="handleSkipTask(index)">
              <i class="el-icon-close"></i> 跳过
            </el-button>
            <el-button
              size="small"
              type="primary"
              @click="handleConfirmMerge(task, index)"
              :loading="task.merging"
            >
              <i class="el-icon-check"></i> 确认合并
            </el-button>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div class="kg-empty-state" v-else>
        <div class="kg-empty-icon">🔄</div>
        <h3>暂无待处理的消歧任务</h3>
        <p>查找重复实体或获取合并建议来开始消歧处理</p>
        <el-button type="primary" @click="showFindDialog">
          <i class="el-icon-search"></i> 查找重复实体
        </el-button>
      </div>
    </div>

    <!-- 统计信息 -->
    <div class="kg-disambiguation-stats">
      <div class="kg-disambiguation-stat">
        <span class="kg-disambiguation-stat__icon">⏳</span>
        <div class="kg-disambiguation-stat__info">
          <span class="kg-disambiguation-stat__value">{{ pendingTasks.length }}</span>
          <span class="kg-disambiguation-stat__label">待处理</span>
        </div>
      </div>
      <div class="kg-disambiguation-stat">
        <span class="kg-disambiguation-stat__icon">✅</span>
        <div class="kg-disambiguation-stat__info">
          <span class="kg-disambiguation-stat__value">{{ mergedCount }}</span>
          <span class="kg-disambiguation-stat__label">已合并</span>
        </div>
      </div>
      <div class="kg-disambiguation-stat">
        <span class="kg-disambiguation-stat__icon">🔍</span>
        <div class="kg-disambiguation-stat__info">
          <span class="kg-disambiguation-stat__value">{{ scannedCount }}</span>
          <span class="kg-disambiguation-stat__label">已扫描</span>
        </div>
      </div>
    </div>

    <!-- 查找重复对话框 -->
    <el-dialog
      v-model="findDialogVisible"
      title="查找重复实体"
      width="500px"
    >
      <el-form :model="findForm" label-width="120px">
        <el-form-item label="相似度阈值">
          <el-slider
            v-model="findForm.similarityThreshold"
            :min="0.5"
            :max="1"
            :step="0.05"
            :marks="{ 0.5: '50%', 0.75: '75%', 1: '100%' }"
            :format-tooltip="(val) => (val * 100).toFixed(0) + '%'"
          />
          <span class="kg-form-hint">阈值越高，匹配越严格</span>
        </el-form-item>

        <el-form-item label="实体类型">
          <el-select v-model="findForm.entityTypes" multiple placeholder="选择要检查的实体类型" style="width: 100%">
            <el-option label="人物" value="人物" />
            <el-option label="组织" value="组织" />
            <el-option label="地点" value="地点" />
            <el-option label="概念" value="概念" />
            <el-option label="技术" value="技术" />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="findDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleFindDuplicates" :loading="searching">
          开始查找
        </el-button>
      </template>
    </el-dialog>

    <!-- 合并建议对话框 -->
    <el-dialog
      v-model="suggestDialogVisible"
      title="获取合并建议"
      width="500px"
    >
      <el-form :model="suggestForm" label-width="120px">
        <el-form-item label="实体名称">
          <el-input
            v-model="suggestForm.entityName"
            placeholder="输入要查找的实体名称"
            clearable
          />
          <span class="kg-form-hint">输入实体名称，系统将查找可能的重复项</span>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="suggestDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleGetSuggestions" :loading="searching">
          获取建议
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useNamespaceStore } from '../../stores/knowledgeGraph/namespaceStore.js'
import {
  findDuplicateEntities,
  suggestMerge,
  mergeEntitiesByDisambiguation,
  getPendingDisambiguationTasks,
  autoMergeEntities
} from '../../api/knowledgeGraph.js'

const namespaceStore = useNamespaceStore()

// UI状态
const loading = ref(false)
const searching = ref(false)
const autoMerging = ref(false)
const findDialogVisible = ref(false)
const suggestDialogVisible = ref(false)

// 待处理任务
const pendingTasks = ref([])

// 统计
const mergedCount = ref(0)
const scannedCount = ref(0)

// 查找表单
const findForm = ref({
  similarityThreshold: 0.8,
  entityTypes: ['人物', '组织']
})

// 建议表单
const suggestForm = ref({
  entityName: ''
})

// 获取实体类型颜色
function getEntityTypeColor(type) {
  const colors = {
    '人物': '#3B82F6',
    '组织': '#10B981',
    '地点': '#F59E0B',
    '概念': '#8B5CF6',
    '事件': '#EF4444',
    '文档': '#6B7280',
    '技术': '#06B6D4'
  }
  return colors[type] || '#94A3B8'
}

// 更新目标实体
function updateTarget(taskIndex, entityId) {
  pendingTasks.value[taskIndex].targetEntityId = entityId
}

// 加载待处理任务
async function loadPendingTasks() {
  const namespaceId = namespaceStore.currentNamespaceId
  if (!namespaceId) return

  loading.value = true
  try {
    const response = await getPendingDisambiguationTasks(namespaceId)

    if (response.code === 200) {
      const tasks = response.data?.tasks || []
      pendingTasks.value = tasks.map(task => ({
        ...task,
        targetEntityId: task.suggested_target || task.entities[0]?.entity_id,
        mergeStrategy: 'keep_most_complete',
        merging: false
      }))
      scannedCount.value = response.data?.scanned_count || 0
    }
  } catch (error) {
    console.error('加载待处理任务失败:', error)
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

// 显示查找对话框
function showFindDialog() {
  findForm.value = {
    similarityThreshold: 0.8,
    entityTypes: ['人物', '组织']
  }
  findDialogVisible.value = true
}

// 显示建议对话框
function showSuggestDialog() {
  suggestForm.value = {
    entityName: ''
  }
  suggestDialogVisible.value = true
}

// 查找重复实体
async function handleFindDuplicates() {
  searching.value = true
  try {
    const namespaceId = namespaceStore.currentNamespaceId
    const response = await findDuplicateEntities({
      namespace_id: namespaceId,
      auto_merge: false,
      confidence_threshold: findForm.value.similarityThreshold
    })

    if (response.code === 200) {
      const groups = response.data?.duplicate_groups || []
      if (groups.length === 0) {
        ElMessage.info('未找到重复实体')
      } else {
        pendingTasks.value = groups.map(group => ({
          entities: group.entities,
          similarity: group.similarity || group.confidence || 0.8,
          suggested_target: group.suggested_target_index || 0,
          targetEntityId: group.entities[group.suggested_target_index || 0]?.entity_id,
          mergeStrategy: 'keep_most_complete',
          merging: false
        }))
        scannedCount.value += response.data?.scanned_count || 0
        ElMessage.success(`找到 ${groups.length} 组重复实体`)
        findDialogVisible.value = false
      }
    }
  } catch (error) {
    console.error('查找重复实体失败:', error)
    ElMessage.error('查找失败')
  } finally {
    searching.value = false
  }
}

// 获取合并建议
async function handleGetSuggestions() {
  if (!suggestForm.value.entityName.trim()) {
    ElMessage.warning('请输入实体名称')
    return
  }

  searching.value = true
  try {
    const namespaceId = namespaceStore.currentNamespaceId
    const response = await suggestMerge({
      namespace_id: namespaceId,
      entity_candidates: [{ entity_id: suggestForm.value.entityName, name: suggestForm.value.entityName }]
    })

    if (response.code === 200) {
      const candidates = response.data?.candidates || []
      if (candidates.length < 2) {
        ElMessage.info('未找到足够的相似实体')
      } else {
        // 将候选实体转换为一组待合并任务
        pendingTasks.value.unshift({
          entities: candidates,
          similarity: response.data?.similarity || 0.8,
          suggested_target: response.data?.suggested_target_index || 0,
          targetEntityId: candidates[response.data?.suggested_target_index || 0]?.entity_id,
          mergeStrategy: 'keep_most_complete',
          merging: false
        })
        ElMessage.success(`找到 ${candidates.length} 个相似实体`)
        suggestDialogVisible.value = false
      }
    }
  } catch (error) {
    console.error('获取合并建议失败:', error)
    ElMessage.error('获取建议失败')
  } finally {
    searching.value = false
  }
}

// 确认合并
async function handleConfirmMerge(task, index) {
  if (!task.targetEntityId) {
    ElMessage.warning('请选择要保留的目标实体')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要将这 ${task.entities.length} 个实体合并为一个吗？`,
      '确认合并',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    task.merging = true

    const namespaceId = namespaceStore.currentNamespaceId
    const sourceEntityIds = task.entities
      .filter(e => e.entity_id !== task.targetEntityId)
      .map(e => e.entity_id)

    const response = await mergeEntitiesByDisambiguation({
      namespace_id: namespaceId,
      source_entity_id: sourceEntityIds[0], // 暂时只支持合并一个源实体
      target_entity_id: task.targetEntityId,
      is_same: true
    })

    if (response.code === 200) {
      ElMessage.success('合并成功')
      // 从列表中移除
      pendingTasks.value.splice(index, 1)
      mergedCount.value++
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('合并失败:', error)
      ElMessage.error('合并失败')
    }
  } finally {
    task.merging = false
  }
}

// 跳过任务
function handleSkipTask(index) {
  pendingTasks.value.splice(index, 1)
  ElMessage.info('已跳过该任务')
}

// 自动合并
async function handleAutoMerge() {
  try {
    await ElMessageBox.confirm(
      '将自动合并高置信度（相似度≥90%）的重复实体，是否继续？',
      '自动合并确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    autoMerging.value = true

    const namespaceId = namespaceStore.currentNamespaceId
    const response = await autoMergeEntities(namespaceId, {
      confidence_threshold: 0.9
    })

    if (response.code === 200) {
      const merged = response.data?.merged_count || 0
      ElMessage.success(`自动合并完成，共合并 ${merged} 组实体`)
      mergedCount.value += merged
      await loadPendingTasks()
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('自动合并失败:', error)
      ElMessage.error('自动合并失败')
    }
  } finally {
    autoMerging.value = false
  }
}

// 初始化
onMounted(async () => {
  await loadPendingTasks()
})
</script>

<style scoped>
.kg-disambiguation {
  padding: 24px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* 操作栏 */
.kg-disambiguation-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.kg-disambiguation-actions__right {
  margin-left: auto;
}

/* 内容区 */
.kg-disambiguation-content {
  flex: 1;
  overflow-y: auto;
  margin-bottom: 20px;
}

.kg-disambiguation-cards {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.kg-disambiguation-card {
  background: var(--card-background);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.kg-disambiguation-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--surface-color);
  border-bottom: 1px solid var(--border-color);
}

.kg-disambiguation-card__title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: var(--text-primary);
}

.kg-disambiguation-card__body {
  padding: 20px;
}

/* 实体组 */
.kg-entity-group {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 20px;
}

.kg-entity-item {
  display: flex;
  gap: 16px;
  padding: 16px;
  background: var(--surface-color);
  border-radius: var(--radius-md);
  border: 2px solid transparent;
  transition: var(--transition);
}

.kg-entity-item--target {
  border-color: var(--primary-color);
  background: var(--primary-color);
}

.kg-entity-item--target .kg-entity-item__name,
.kg-entity-item--target .kg-entity-item__aliases {
  color: white;
}

.dark-theme .kg-entity-item--target {
  background: var(--primary-color);
}

.kg-entity-item__header {
  display: flex;
  align-items: center;
}

.kg-entity-item__content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.kg-entity-item__name {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.kg-entity-item__meta {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.kg-entity-item__aliases {
  font-size: 13px;
  color: var(--text-secondary);
}

.kg-entity-item__desc {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.5;
}

.kg-entity-item__stats {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: var(--text-muted);
}

.kg-entity-item__stats span {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 合并策略 */
.kg-merge-strategy {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--surface-color);
  border-radius: var(--radius-md);
}

.kg-merge-strategy__label {
  font-size: 13px;
  color: var(--text-secondary);
}

/* 卡片底部 */
.kg-disambiguation-card__footer {
  display: flex;
  justify-content: flex-end;
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

/* 统计 */
.kg-disambiguation-stats {
  display: flex;
  gap: 16px;
  padding: 16px;
  background: var(--card-background);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
}

.kg-disambiguation-stat {
  display: flex;
  align-items: center;
  gap: 12px;
}

.kg-disambiguation-stat__icon {
  font-size: 24px;
}

.kg-disambiguation-stat__info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.kg-disambiguation-stat__value {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
}

.kg-disambiguation-stat__label {
  font-size: 12px;
  color: var(--text-secondary);
}

/* 表单提示 */
.kg-form-hint {
  margin-left: 12px;
  font-size: 12px;
  color: var(--text-muted);
}

/* 深色主题 */
.dark-theme .kg-disambiguation-card,
.dark-theme .kg-disambiguation-stats {
  background: var(--card-background);
  border-color: var(--border-color);
}

.dark-theme .kg-disambiguation-card__header,
.dark-theme .kg-disambiguation-card__footer,
.dark-theme .kg-entity-item,
.dark-theme .kg-merge-strategy {
  background: var(--surface-color);
  border-color: var(--border-color);
}
</style>
