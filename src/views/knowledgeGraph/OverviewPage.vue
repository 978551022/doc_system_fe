<template>
  <div class="kg-overview">
    <!-- 统计卡片行 -->
    <div class="kg-overview__cards">
      <div class="kg-stat-card">
        <div class="kg-stat-card__icon" style="background: rgba(59, 130, 246, 0.1)">
          <i class="el-icon-data-analysis" style="color: #3B82F6"></i>
        </div>
        <div class="kg-stat-card__content">
          <div class="kg-stat-card__label">实体总数</div>
          <div class="kg-stat-card__value">{{ stats.entity_count || 0 }}</div>
          <div class="kg-stat-card__trend" v-if="stats.entity_count">
            <i class="el-icon-top"></i> 较上月增长
          </div>
        </div>
      </div>

      <div class="kg-stat-card">
        <div class="kg-stat-card__icon" style="background: rgba(16, 185, 129, 0.1)">
          <i class="el-icon-connection" style="color: #10B981"></i>
        </div>
        <div class="kg-stat-card__content">
          <div class="kg-stat-card__label">关系总数</div>
          <div class="kg-stat-card__value">{{ stats.relation_count || 0 }}</div>
          <div class="kg-stat-card__trend" v-if="stats.relation_count">
            <i class="el-icon-top"></i> 较上月增长
          </div>
        </div>
      </div>

      <div class="kg-stat-card">
        <div class="kg-stat-card__icon" style="background: rgba(245, 158, 11, 0.1)">
          <i class="el-icon-folder-opened" style="color: #F59E0B"></i>
        </div>
        <div class="kg-stat-card__content">
          <div class="kg-stat-card__label">文档数量</div>
          <div class="kg-stat-card__value">{{ stats.document_count || 0 }}</div>
          <div class="kg-stat-card__trend" v-if="stats.document_count">
            <i class="el-icon-top"></i> 较上月增长
          </div>
        </div>
      </div>

      <div class="kg-stat-card">
        <div class="kg-stat-card__icon" style="background: rgba(139, 92, 246, 0.1)">
          <i class="el-icon-copy-document" style="color: #8B5CF6"></i>
        </div>
        <div class="kg-stat-card__content">
          <div class="kg-stat-card__label">别名数量</div>
          <div class="kg-stat-card__value">{{ stats.alias_count || 0 }}</div>
          <div class="kg-stat-card__trend" v-if="stats.alias_count">
            <i class="el-icon-top"></i> 较上月增长
          </div>
        </div>
      </div>
    </div>

    <!-- 图表行 -->
    <div class="kg-overview__charts">
      <!-- 图谱增长趋势 -->
      <div class="kg-chart-card">
        <div class="kg-chart-card__header">
          <h3 class="kg-chart-card__title">图谱增长趋势 (近30天)</h3>
          <el-button size="small" text @click="refreshTrendData">
            <i class="el-icon-refresh"></i>
          </el-button>
        </div>
        <div class="kg-chart-card__body">
          <div ref="trendChartRef" class="kg-chart"></div>
        </div>
      </div>
    </div>

    <!-- 分布图行 -->
    <div class="kg-overview__distributions">
      <!-- 实体类型分布 -->
      <div class="kg-chart-card kg-chart-card--half">
        <div class="kg-chart-card__header">
          <h3 class="kg-chart-card__title">实体类型分布</h3>
        </div>
        <div class="kg-chart-card__body">
          <div ref="entityTypeChartRef" class="kg-chart kg-chart--donut"></div>
          <div class="kg-chart-legend" v-if="entityTypeDistribution.length > 0">
            <div
              v-for="item in entityTypeDistribution"
              :key="item.name"
              class="kg-chart-legend__item"
            >
              <span class="kg-chart-legend__color" :style="{ background: item.color }"></span>
              <span class="kg-chart-legend__name">{{ item.name }}</span>
              <span class="kg-chart-legend__value">{{ item.percent }}%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 关系类型分布 -->
      <div class="kg-chart-card kg-chart-card--half">
        <div class="kg-chart-card__header">
          <h3 class="kg-chart-card__title">关系类型分布</h3>
        </div>
        <div class="kg-chart-card__body">
          <div ref="relationTypeChartRef" class="kg-chart kg-chart--bar"></div>
        </div>
      </div>
    </div>

    <!-- 最近活动 -->
    <div class="kg-chart-card">
      <div class="kg-chart-card__header">
        <h3 class="kg-chart-card__title">最近活动</h3>
        <el-button size="small" text @click="refreshActivities">
          <i class="el-icon-refresh"></i>
        </el-button>
      </div>
      <div class="kg-chart-card__body">
        <div class="kg-activity-list" v-if="activities.length > 0">
          <div v-for="activity in activities" :key="activity.id" class="kg-activity-item">
            <div class="kg-activity-item__icon" :class="`kg-activity-item__icon--${activity.type}`">
              <i :class="getActivityIcon(activity.type)"></i>
            </div>
            <div class="kg-activity-item__content">
              <div class="kg-activity-item__text">{{ activity.description }}</div>
              <div class="kg-activity-item__time">{{ formatTime(activity.created_at) }}</div>
            </div>
          </div>
        </div>
        <div class="kg-empty-state" v-else>
          <p>暂无活动记录</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useNamespaceStore } from '../../stores/knowledgeGraph/namespaceStore.js'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'

const namespaceStore = useNamespaceStore()

// 图表引用
const trendChartRef = ref(null)
const entityTypeChartRef = ref(null)
const relationTypeChartRef = ref(null)

// 图表实例
let trendChart = null
let entityTypeChart = null
let relationTypeChart = null

// 数据
const stats = ref({})
const trendData = ref([])
const entityTypeDistribution = ref([])
const relationTypeDistribution = ref([])
const activities = ref([])

// 实体类型颜色映射
const entityTypeColors = {
  '人物': '#3B82F6',
  '组织': '#10B981',
  '地点': '#F59E0B',
  '概念': '#8B5CF6',
  '事件': '#EF4444',
  '文档': '#6B7280',
  '技术': '#06B6D4'
}

// 关系类型颜色
const relationTypeColors = {
  '是': '#94A3B8',
  '属于': '#64748B',
  '位于': '#F59E0B',
  '相关': '#3B82F6',
  '工作于': '#10B981'
}

// 获取活动图标
function getActivityIcon(type) {
  const icons = {
    'entity_create': 'el-icon-circle-plus',
    'entity_update': 'el-icon-edit',
    'entity_delete': 'el-icon-delete',
    'relation_create': 'el-icon-connection',
    'document_build': 'el-icon-document',
    'namespace_create': 'el-icon-folder-opened'
  }
  return icons[type] || 'el-icon-info'
}

// 格式化时间
function formatTime(timestamp) {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  const now = new Date()
  const diff = Math.floor((now - date) / 1000 / 60)

  if (diff < 1) return '刚刚'
  if (diff < 60) return `${diff}分钟前`
  if (diff < 1440) return `${Math.floor(diff / 60)}小时前`
  if (diff < 43200) return `${Math.floor(diff / 1440)}天前`
  return date.toLocaleDateString()
}

// 初始化趋势图
function initTrendChart() {
  if (!trendChartRef.value) return

  trendChart = echarts.init(trendChartRef.value)

  const dates = trendData.value.map(d => d.date)
  const entities = trendData.value.map(d => d.entity_count)
  const relations = trendData.value.map(d => d.relation_count)

  const option = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'var(--card-background)',
      borderColor: 'var(--border-color)',
      textStyle: { color: 'var(--text-primary)' }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: dates,
      axisLine: { lineStyle: { color: 'var(--border-color)' } },
      axisLabel: { color: 'var(--text-secondary)' }
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: 'var(--border-color)' } },
      axisLabel: { color: 'var(--text-secondary)' },
      splitLine: { lineStyle: { color: 'var(--border-color)', type: 'dashed' } }
    },
    series: [
      {
        name: '实体',
        type: 'line',
        smooth: true,
        data: entities,
        itemStyle: { color: '#3B82F6' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(59, 130, 246, 0.3)' },
            { offset: 1, color: 'rgba(59, 130, 246, 0.05)' }
          ])
        }
      },
      {
        name: '关系',
        type: 'line',
        smooth: true,
        data: relations,
        itemStyle: { color: '#10B981' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(16, 185, 129, 0.3)' },
            { offset: 1, color: 'rgba(16, 185, 129, 0.05)' }
          ])
        }
      }
    ],
    legend: {
      data: ['实体', '关系'],
      textStyle: { color: 'var(--text-secondary)' }
    }
  }

  trendChart.setOption(option)
}

// 初始化实体类型饼图
function initEntityTypeChart() {
  if (!entityTypeChartRef.value) return

  entityTypeChart = echarts.init(entityTypeChartRef.value)

  const option = {
    tooltip: {
      trigger: 'item',
      backgroundColor: 'var(--card-background)',
      borderColor: 'var(--border-color)',
      textStyle: { color: 'var(--text-primary)' },
      formatter: '{b}: {c} ({d}%)'
    },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['50%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: 'var(--card-background)',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold',
            color: 'var(--text-primary)'
          }
        },
        labelLine: {
          show: false
        },
        data: entityTypeDistribution.value.map(item => ({
          value: item.value,
          name: item.name,
          itemStyle: { color: item.color }
        }))
      }
    ]
  }

  entityTypeChart.setOption(option)
}

// 初始化关系类型条形图
function initRelationTypeChart() {
  if (!relationTypeChartRef.value) return

  relationTypeChart = echarts.init(relationTypeChartRef.value)

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'var(--card-background)',
      borderColor: 'var(--border-color)',
      textStyle: { color: 'var(--text-primary)' }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: 'var(--border-color)' } },
      axisLabel: { color: 'var(--text-secondary)' },
      splitLine: { lineStyle: { color: 'var(--border-color)', type: 'dashed' } }
    },
    yAxis: {
      type: 'category',
      data: relationTypeDistribution.value.map(d => d.name),
      axisLine: { lineStyle: { color: 'var(--border-color)' } },
      axisLabel: { color: 'var(--text-secondary)' }
    },
    series: [
      {
        type: 'bar',
        data: relationTypeDistribution.value.map(d => ({
          value: d.value,
          itemStyle: { color: d.color }
        })),
        barWidth: '60%',
        itemStyle: {
          borderRadius: [0, 4, 4, 0]
        }
      }
    ]
  }

  relationTypeChart.setOption(option)
}

// 加载数据
async function loadData() {
  const namespaceId = namespaceStore.currentNamespaceId
  if (!namespaceId) return

  try {
    // 加载统计数据
    const statsData = await namespaceStore.loadNamespaceStats(namespaceId)
    stats.value = statsData || {}

    // 模拟趋势数据（实际应从API获取）
    trendData.value = generateMockTrendData()

    // 模拟分布数据（实际应从API获取）
    entityTypeDistribution.value = generateMockEntityTypeDistribution()
    relationTypeDistribution.value = generateMockRelationTypeDistribution()

    // 模拟活动数据
    activities.value = generateMockActivities()

    await nextTick()
    initCharts()
  } catch (error) {
    console.error('加载概览数据失败:', error)
  }
}

// 生成模拟趋势数据
function generateMockTrendData() {
  const data = []
  const today = new Date()
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    data.push({
      date: `${date.getMonth() + 1}/${date.getDate()}`,
      entity_count: Math.floor(Math.random() * 50) + 10,
      relation_count: Math.floor(Math.random() * 100) + 20
    })
  }
  return data
}

// 生成模拟实体类型分布
function generateMockEntityTypeDistribution() {
  const types = ['人物', '组织', '地点', '概念', '事件']
  const data = types.map(type => ({
    name: type,
    value: Math.floor(Math.random() * 100) + 10,
    color: entityTypeColors[type] || '#3B82F6'
  }))

  const total = data.reduce((sum, item) => sum + item.value, 0)
  return data.map(item => ({
    ...item,
    percent: Math.round((item.value / total) * 100)
  }))
}

// 生成模拟关系类型分布
function generateMockRelationTypeDistribution() {
  const types = ['是', '属于', '位于', '相关', '工作于']
  return types.map(type => ({
    name: type,
    value: Math.floor(Math.random() * 200) + 20,
    color: relationTypeColors[type] || '#94A3B8'
  })).sort((a, b) => b.value - a.value)
}

// 生成模拟活动数据
function generateMockActivities() {
  const types = ['entity_create', 'relation_create', 'document_build', 'entity_update']
  const descriptions = [
    '添加实体 "张三" (人物)',
    '添加关系 "张三" -> "工作于" -> "ABC公司"',
    '从文档 "简历.pdf" 提取了 12 个实体',
    '更新实体 "ABC公司" 的属性',
    '合并了 3 个重复实体',
    '添加实体 "李四" (人物)',
    '添加关系 "李四" -> "属于" -> "技术部"',
    '从文档 "公司介绍.docx" 提取了 8 个实体'
  ]

  const data = []
  for (let i = 0; i < 8; i++) {
    const now = new Date()
    now.setMinutes(now.getMinutes() - i * 30)
    data.push({
      id: i,
      type: types[Math.floor(Math.random() * types.length)],
      description: descriptions[i % descriptions.length],
      created_at: now.toISOString()
    })
  }
  return data
}

// 初始化图表
function initCharts() {
  initTrendChart()
  initEntityTypeChart()
  initRelationTypeChart()
}

// 刷新趋势数据
function refreshTrendData() {
  trendData.value = generateMockTrendData()
  initTrendChart()
  ElMessage.success('数据已刷新')
}

// 刷新活动
function refreshActivities() {
  activities.value = generateMockActivities()
  ElMessage.success('活动已刷新')
}

// 响应式处理
function handleResize() {
  trendChart?.resize()
  entityTypeChart?.resize()
  relationTypeChart?.resize()
}

onMounted(async () => {
  await loadData()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  trendChart?.dispose()
  entityTypeChart?.dispose()
  relationTypeChart?.dispose()
})

</script>

<style scoped>
.kg-overview {
  padding: 24px;
  overflow-y: auto;
  height: 100%;
}

/* 统计卡片 */
.kg-overview__cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

.kg-stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: var(--card-background);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  transition: var(--transition);
}

.kg-stat-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.kg-stat-card__icon {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  font-size: 24px;
}

.kg-stat-card__content {
  flex: 1;
}

.kg-stat-card__label {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.kg-stat-card__value {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1;
  margin-bottom: 4px;
}

.kg-stat-card__trend {
  font-size: 12px;
  color: var(--success-color);
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 图表卡片 */
.kg-overview__charts {
  margin-bottom: 24px;
}

.kg-chart-card {
  background: var(--card-background);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.kg-chart-card--half {
  width: calc(50% - 12px);
}

.kg-overview__distributions {
  display: flex;
  gap: 24px;
  margin-bottom: 24px;
}

.kg-chart-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color);
}

.kg-chart-card__title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}

.kg-chart-card__body {
  padding: 20px;
  position: relative;
}

.kg-chart {
  width: 100%;
  height: 280px;
}

.kg-chart--donut {
  height: 200px;
}

.kg-chart--bar {
  height: 200px;
}

.kg-chart-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  justify-content: center;
  margin-top: 16px;
}

.kg-chart-legend__item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--text-secondary);
}

.kg-chart-legend__color {
  width: 12px;
  height: 12px;
  border-radius: 3px;
}

.kg-chart-legend__value {
  font-weight: 600;
  color: var(--text-primary);
}

/* 活动列表 */
.kg-activity-list {
  max-height: 300px;
  overflow-y: auto;
}

.kg-activity-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid var(--border-color);
}

.kg-activity-item:last-child {
  border-bottom: none;
}

.kg-activity-item__icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--surface-color);
  color: var(--text-secondary);
  flex-shrink: 0;
}

.kg-activity-item__icon--entity_create {
  background: rgba(59, 130, 246, 0.1);
  color: #3B82F6;
}

.kg-activity-item__icon--relation_create {
  background: rgba(16, 185, 129, 0.1);
  color: #10B981;
}

.kg-activity-item__icon--document_build {
  background: rgba(245, 158, 11, 0.1);
  color: #F59E0B;
}

.kg-activity-item__icon--entity_update {
  background: rgba(139, 92, 246, 0.1);
  color: #8B5CF6;
}

.kg-activity-item__content {
  flex: 1;
}

.kg-activity-item__text {
  font-size: 14px;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.kg-activity-item__time {
  font-size: 12px;
  color: var(--text-muted);
}

.kg-empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100px;
  color: var(--text-muted);
  font-size: 14px;
}

/* 响应式 */
@media (max-width: 1200px) {
  .kg-overview__cards {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .kg-overview__cards {
    grid-template-columns: 1fr;
  }

  .kg-overview__distributions {
    flex-direction: column;
  }

  .kg-chart-card--half {
    width: 100%;
  }
}

/* 深色主题 */
.dark-theme .kg-stat-card,
.dark-theme .kg-chart-card {
  background: var(--card-background);
  border-color: var(--border-color);
}
</style>
