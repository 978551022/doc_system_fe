<template>
  <el-dialog
    v-model="visible"
    title="选择工作流模板"
    width="850px"
    :close-on-click-modal="false"
    class="template-gallery-dialog"
  >
    <div class="template-gallery">
      <!-- 分类筛选 -->
      <div class="template-gallery__categories">
        <el-radio-group v-model="selectedCategory" size="small">
          <el-radio-button label="all">全部</el-radio-button>
          <el-radio-button
            v-for="category in categories"
            :key="category.value"
            :label="category.value"
          >
            {{ category.label }}
          </el-radio-button>
        </el-radio-group>
      </div>

      <!-- 模板列表 -->
      <div class="template-gallery__templates">
        <div
          v-for="template in filteredTemplates"
          :key="template.id"
          class="template-card"
          @click="selectTemplate(template)"
        >
          <div class="template-card__icon">{{ template.icon }}</div>
          <div class="template-card__content">
            <h4 class="template-card__name">{{ template.name }}</h4>
            <p class="template-card__description">{{ template.description }}</p>
            <div class="template-card__tags">
              <el-tag
                v-for="tag in template.tags"
                :key="tag"
                size="small"
                type="info"
              >
                {{ tag }}
              </el-tag>
            </div>
          </div>
          <div class="template-card__mode">
            <el-tag size="small">{{ getModeName(template.collaborationMode) }}</el-tag>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-if="filteredTemplates.length === 0" class="template-gallery__empty">
          <p>没有找到匹配的模板</p>
        </div>
      </div>
    </div>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { getAllTemplates, getTemplateCategories } from '../../../utils/workflow/workflowTemplates.js'
import { getCollaborationModeConfig } from '../../../utils/workflow/collaborationModes.js'

const emit = defineEmits(['select'])

const visible = ref(false)
const selectedCategory = ref('all')

// 所有模板
const templates = ref(getAllTemplates())

// 分类列表
const categories = computed(() => {
  const cats = getTemplateCategories()
  return cats.map(c => ({ value: c, label: c }))
})

// 过滤后的模板
const filteredTemplates = computed(() => {
  if (selectedCategory.value === 'all') {
    return templates.value
  }
  return templates.value.filter(t => t.category === selectedCategory.value)
})

// 获取协作模式名称
function getModeName(mode) {
  const config = getCollaborationModeConfig(mode)
  return config?.name || mode
}

// 打开对话框
function open() {
  visible.value = true
}

// 选择模板
function selectTemplate(template) {
  emit('select', template.id)
  visible.value = false
}

// 暴露方法
defineExpose({
  open
})
</script>

<style scoped>
.template-gallery {
  min-height: 400px;
}

.template-gallery__categories {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-color);
}

.template-gallery__categories :deep(.el-radio-group) {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.template-gallery__templates {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
  max-height: 450px;
  overflow-y: auto;
  padding: 4px;
}

.template-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s;
}

.template-card:hover {
  border-color: var(--primary-color);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.template-card__icon {
  font-size: 28px;
  flex-shrink: 0;
  line-height: 1;
}

.template-card__content {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.template-card__name {
  margin: 0 0 4px 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.template-card__description {
  margin: 0 0 8px 0;
  font-size: 12px;
  color: var(--text-muted);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  word-break: break-word;
}

.template-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.template-card__tags :deep(.el-tag) {
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.template-card__mode {
  flex-shrink: 0;
  align-self: flex-start;
}

.template-gallery__empty {
  grid-column: 1 / -1;
  text-align: center;
  padding: 40px;
  color: var(--text-muted);
}

/* 对话框内容区域样式优化 */
.template-gallery-dialog :deep(.el-dialog__body) {
  padding: 16px 20px;
  max-height: 600px;
  overflow-y: auto;
}

/* 深色主题适配 */
.dark-theme .template-card {
  background: var(--surface-color);
  border-color: var(--border-color);
}

.dark-theme .template-card__name {
  color: var(--text-primary);
}
</style>
