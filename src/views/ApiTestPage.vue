<template>
  <div class="api-test-page">
    <h2 class="page-title">API接口测试</h2>
    
    <div class="api-test-container">
      <!-- API列表 -->
      <el-card class="api-list-card">
        <template #header>
          <div class="card-header">
            <span>API列表</span>
            <el-button type="primary" size="small" @click="refreshApis">
              <i class="el-icon-refresh"></i> 刷新
            </el-button>
          </div>
        </template>
        
        <el-tree
          :data="apiTree"
          :props="apiTreeProps"
          :default-expanded-keys="['1']"
          @node-click="handleApiClick"
        >
          <template #default="{ node, data }">
            <div class="api-tree-node" v-if="data.method">
              <el-tag :type="getMethodType(data.method)">{{ data.method }}</el-tag>
              <span class="api-tree-node__path">{{ data.path }}</span>
              <span class="api-tree-node__name">{{ data.name }}</span>
            </div>
          </template>
        </el-tree>
      </el-card>
      
      <!-- API详情和测试 -->
      <el-card class="api-detail-card" v-if="selectedApi">
        <template #header>
          <div class="card-header">
            <span>API详情</span>
          </div>
        </template>
        
        <div class="api-detail">
          <!-- API基本信息 -->
          <div class="api-detail__info">
            <h3>{{ selectedApi.name }}</h3>
            <p class="api-detail__description">{{ selectedApi.description }}</p>
            <div class="api-detail__method-path">
              <el-tag :type="getMethodType(selectedApi.method)">{{ selectedApi.method }}</el-tag>
              <span class="api-detail__path">{{ selectedApi.path }}</span>
            </div>
          </div>
          
          <!-- 请求参数 -->
          <div class="api-detail__params" v-if="selectedApi.parameters && selectedApi.parameters.length > 0">
            <h4>请求参数</h4>
            <el-table :data="selectedApi.parameters" style="width: 100%">
              <el-table-column prop="name" label="参数名" width="150"></el-table-column>
              <el-table-column prop="type" label="类型" width="100"></el-table-column>
              <el-table-column prop="required" label="必填" width="80">
                <template #default="scope">
                  <el-tag :type="scope.row.required ? 'danger' : 'success'">
                    {{ scope.row.required ? '是' : '否' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="description" label="说明"></el-table-column>
            </el-table>
          </div>
          
          <!-- 请求表单 -->
          <div class="api-detail__form">
            <h4>请求参数表单</h4>
            <el-form :model="requestParams" label-width="120px">
              <el-form-item 
                v-for="param in selectedApi.parameters" 
                :key="param.name"
                :label="param.name"
                :required="param.required"
              >
                <el-input 
                  v-model="requestParams[param.name]" 
                  placeholder="请输入{{ param.name }}"
                ></el-input>
              </el-form-item>
            </el-form>
          </div>
          
          <!-- 操作按钮 -->
          <div class="api-detail__actions">
            <el-button type="primary" @click="sendRequest" :loading="isRequesting">
              发送请求
            </el-button>
            <el-button @click="resetRequest">
              重置
            </el-button>
          </div>
          
          <!-- 响应结果 -->
          <div class="api-detail__response" v-if="response">
            <h4>响应结果</h4>
            <div class="api-detail__response-header">
              <div class="response-status">
                <el-tag :type="response.status >= 200 && response.status < 300 ? 'success' : 'danger'">
                  {{ response.status }}
                </el-tag>
                <span class="response-time">{{ response.time }}ms</span>
              </div>
              <el-button type="text" @click="copyResponse">
                <i class="el-icon-document-copy"></i> 复制
              </el-button>
            </div>
            <pre class="api-detail__response-body">{{ formatResponse(response.data) }}</pre>
          </div>
        </div>
      </el-card>
      
      <!-- 未选择API提示 -->
      <el-card class="api-detail-card" v-else>
        <div class="api-detail-empty">
          <i class="el-icon-info"></i>
          <p>请从左侧选择一个API进行测试</p>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import axios from 'axios'

// API列表数据
const apis = ref([])
const apiTree = ref([])
const selectedApi = ref(null)
const isRequesting = ref(false)
const response = ref(null)

// 请求参数
const requestParams = reactive({})

// API树配置
const apiTreeProps = {
  children: 'children',
  label: 'name'
}

// 生命周期钩子
onMounted(() => {
  getApis()
})

// 获取API列表
const getApis = async () => {
  try {
    const response = await axios.get('/api/v1/docs')
    apis.value = response.data
    buildApiTree()
  } catch (error) {
    console.error('获取API列表失败:', error)
    // 使用模拟数据
    apis.value = [
      {
        id: 1,
        name: '文档管理',
        method: null,
        path: null,
        description: '文档管理相关接口',
        parameters: [],
        children: [
          {
            id: 2,
            name: '获取文档列表',
            method: 'GET',
            path: '/api/v1/documents',
            description: '获取所有文档列表',
            parameters: [
              { name: 'page', type: 'number', required: false, description: '页码' },
              { name: 'pageSize', type: 'number', required: false, description: '每页数量' }
            ]
          },
          {
            id: 3,
            name: '上传文档',
            method: 'POST',
            path: '/api/v1/documents/upload',
            description: '上传文档',
            parameters: [
              { name: 'file', type: 'file', required: true, description: '文档文件' }
            ]
          },
          {
            id: 4,
            name: '删除文档',
            method: 'DELETE',
            path: '/api/v1/documents/{id}',
            description: '删除指定文档',
            parameters: [
              { name: 'id', type: 'number', required: true, description: '文档ID' }
            ]
          }
        ]
      },
      {
        id: 5,
        name: '对话管理',
        method: null,
        path: null,
        description: '对话管理相关接口',
        parameters: [],
        children: [
          {
            id: 6,
            name: '发送消息',
            method: 'POST',
            path: '/api/v1/chat/stream',
            description: '发送消息并获取流式响应',
            parameters: [
              { name: 'message', type: 'string', required: true, description: '消息内容' }
            ]
          }
        ]
      }
    ]
    buildApiTree()
  }
}

// 构建API树
const buildApiTree = () => {
  apiTree.value = apis.value
}

// 刷新API列表
const refreshApis = () => {
  getApis()
}

// 处理API点击
const handleApiClick = (data) => {
  if (data.method) {
    selectedApi.value = data
    resetRequest()
  }
}

// 获取请求方法类型
const getMethodType = (method) => {
  const methodMap = {
    'GET': 'success',
    'POST': 'primary',
    'PUT': 'warning',
    'DELETE': 'danger'
  }
  return methodMap[method] || 'info'
}

// 发送请求
const sendRequest = async () => {
  if (!selectedApi.value) return
  
  isRequesting.value = true
  response.value = null
  
  const startTime = Date.now()
  
  try {
    const url = selectedApi.value.path
    const method = selectedApi.value.method
    
    // 构建请求配置
    const config = {
      url,
      method,
      params: method === 'GET' ? requestParams : {},
      data: method !== 'GET' ? requestParams : {},
      timeout: 10000
    }
    
    const res = await axios(config)
    const endTime = Date.now()
    
    response.value = {
      status: res.status,
      time: endTime - startTime,
      data: res.data
    }
  } catch (error) {
    const endTime = Date.now()
    
    response.value = {
      status: error.response ? error.response.status : 500,
      time: endTime - startTime,
      data: error.response ? error.response.data : { error: error.message }
    }
  } finally {
    isRequesting.value = false
  }
}

// 重置请求
const resetRequest = () => {
  response.value = null
  // 清空请求参数
  Object.keys(requestParams).forEach(key => {
    delete requestParams[key]
  })
}

// 格式化响应数据
const formatResponse = (data) => {
  return JSON.stringify(data, null, 2)
}

// 复制响应结果
const copyResponse = () => {
  if (!response.value) return
  
  const text = formatResponse(response.value.data)
  navigator.clipboard.writeText(text).then(() => {
    ElMessage.success('复制成功!')
  }).catch(() => {
    ElMessage.error('复制失败!')
  })
}
</script>

<style scoped>
.api-test-page {
  width: 100%;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 20px;
  color: #303133;
}

.api-test-container {
  display: flex;
  gap: 20px;
  height: calc(100vh - 180px);
}

.api-list-card {
  width: 300px;
  overflow-y: auto;
}

.api-detail-card {
  flex: 1;
  overflow-y: auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.api-tree-node {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
}

.api-tree-node__path {
  font-family: monospace;
  color: #667eea;
  font-size: 13px;
}

.api-tree-node__name {
  font-size: 13px;
  color: #909399;
  margin-left: auto;
}

.api-detail {
  padding: 10px 0;
}

.api-detail__info {
  margin-bottom: 20px;
}

.api-detail__info h3 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #303133;
}

.api-detail__description {
  color: #606266;
  margin-bottom: 12px;
  line-height: 1.5;
}

.api-detail__method-path {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
}

.api-detail__path {
  font-family: monospace;
  font-size: 16px;
  color: #667eea;
  font-weight: 500;
}

.api-detail__params {
  margin-bottom: 20px;
}

.api-detail__params h4,
.api-detail__form h4,
.api-detail__response h4 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #303133;
  padding-bottom: 8px;
  border-bottom: 1px solid #ebeef5;
}

.api-detail__form {
  margin-bottom: 20px;
}

.api-detail__actions {
  margin-bottom: 20px;
}

.api-detail__response {
  margin-top: 20px;
}

.api-detail__response-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.response-status {
  display: flex;
  align-items: center;
  gap: 10px;
}

.response-time {
  color: #909399;
  font-size: 14px;
}

.api-detail__response-body {
  background-color: #f5f7fa;
  padding: 16px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 14px;
  line-height: 1.5;
  overflow-x: auto;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.api-detail-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #909399;
}

.api-detail-empty i {
  font-size: 48px;
  margin-bottom: 16px;
  color: #c0c4cc;
}
</style>
