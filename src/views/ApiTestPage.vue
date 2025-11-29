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
        
        <div v-if="isLoading" class="api-loading">
          <el-icon class="is-loading"><Loading /></el-icon>
          <span>正在加载API列表...</span>
        </div>
        <div v-else-if="loadError" class="api-error">
          <el-icon color="#f56c6c"><CircleClose /></el-icon>
          <span>{{ loadError }}</span>
        </div>
        <el-tree
          v-else
          :data="apiTree"
          :props="apiTreeProps"
          :default-expanded-keys="apiTree.map(item => item.id)"
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
import { Loading, CircleClose } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

// API列表数据
const apis = ref([])
const apiTree = ref([])
const selectedApi = ref(null)
const isRequesting = ref(false)
const response = ref(null)
const isLoading = ref(false)
const loadError = ref(null)

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

// 从OpenAPI文档中提取API信息
const extractApisFromOpenAPI = (openapiData, baseUrl) => {
  const apis = []
  const paths = openapiData.paths || {}
  const components = openapiData.components || {}
  const schemas = components.schemas || {}
  const securitySchemes = components.securitySchemes || {}
  
  // 遍历所有路径
  for (const [path, pathItem] of Object.entries(paths)) {
    // 遍历路径下的所有方法
    for (const [method, operation] of Object.entries(pathItem)) {
      if (typeof operation === 'object') {
        // 提取参数信息
        const parameters = []
        if (operation.parameters) {
          for (const param of operation.parameters) {
            parameters.push({
              name: param.name,
              type: param.schema?.type || 'string',
              required: param.required || false,
              description: param.description || '',
              in: param.in || 'query'
            })
          }
        }
        
        // 提取请求体参数
        if (operation.requestBody) {
          const requestBody = operation.requestBody
          const content = requestBody.content || {}
          const jsonContent = content['application/json'] || {}
          const schema = jsonContent.schema || {}
          
          // 解析schema，提取请求体参数
          if (schema.properties) {
            for (const [propName, propSchema] of Object.entries(schema.properties)) {
              parameters.push({
                name: propName,
                type: propSchema.type || 'string',
                required: schema.required?.includes(propName) || false,
                description: propSchema.description || '',
                in: 'body'
              })
            }
          }
        }
        
        // 构建API信息
        const api = {
          id: `${method}-${path}`,
          name: operation.summary || `${method} ${path}`,
          method: method.toUpperCase(),
          path: path,
          description: operation.description || '',
          parameters: parameters,
          baseUrl: baseUrl
        }
        
        apis.push(api)
      }
    }
  }
  
  return apis
}

// 从两个后端地址获取API信息
const getApis = async () => {
  isLoading.value = true
  loadError.value = null
  
  try {
    // 后端文档地址
    const docUrls = [
      { url: 'https://127.0.0.1:8002/api/v1/subapi/docs', name: '子API服务' },
      { url: 'https://0.0.0.0:8443/api/v1/docs', name: '主API服务' }
    ]
    
    const allApis = []
    
    // 从两个地址获取API信息
    for (const docUrl of docUrls) {
      try {
        // 获取OpenAPI文档
        const response = await axios.get(docUrl.url, {
          timeout: 10000
        })
        
        // 提取API信息
        const extractedApis = extractApisFromOpenAPI(response.data, docUrl.url)
        
        // 按模块分类API
        const moduleApis = {
          id: docUrl.name,
          name: docUrl.name,
          method: null,
          path: null,
          description: `${docUrl.name} 相关接口`,
          parameters: [],
          children: extractedApis
        }
        
        allApis.push(moduleApis)
      } catch (error) {
        console.error(`获取 ${docUrl.name} API列表失败:`, error)
        loadError.value = `获取 ${docUrl.name} API列表失败: ${error.message}`
      }
    }
    
    // 如果所有请求都失败，使用模拟数据
    if (allApis.length === 0) {
      apis.value = [
        {
          id: '子API服务',
          name: '子API服务',
          method: null,
          path: null,
          description: '子API服务相关接口',
          parameters: [],
          children: [
            {
              id: 'GET-/api/v1/subapi/test',
              name: '测试接口',
              method: 'GET',
              path: '/api/v1/subapi/test',
              description: '子API测试接口',
              parameters: [
                { name: 'param1', type: 'string', required: false, description: '测试参数1' },
                { name: 'param2', type: 'number', required: false, description: '测试参数2' }
              ]
            }
          ]
        },
        {
          id: '主API服务',
          name: '主API服务',
          method: null,
          path: null,
          description: '主API服务相关接口',
          parameters: [],
          children: [
            {
              id: 'GET-/api/v1/documents',
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
              id: 'POST-/api/v1/chat/stream',
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
    } else {
      apis.value = allApis
    }
    buildApiTree()
  } catch (error) {
    console.error('获取API列表失败:', error)
    loadError.value = `获取API列表失败: ${error.message}`
    
    // 使用模拟数据
    apis.value = [
      {
        id: '子API服务',
        name: '子API服务',
        method: null,
        path: null,
        description: '子API服务相关接口',
        parameters: [],
        children: [
          {
            id: 'GET-/api/v1/subapi/test',
            name: '测试接口',
            method: 'GET',
            path: '/api/v1/subapi/test',
            description: '子API测试接口',
            parameters: [
              { name: 'param1', type: 'string', required: false, description: '测试参数1' },
              { name: 'param2', type: 'number', required: false, description: '测试参数2' }
            ]
          }
        ]
      },
      {
        id: '主API服务',
        name: '主API服务',
        method: null,
        path: null,
        description: '主API服务相关接口',
        parameters: [],
        children: [
          {
            id: 'GET-/api/v1/documents',
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
            id: 'POST-/api/v1/chat/stream',
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
  } finally {
    isLoading.value = false
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
/* 科技感主题变量 */
:root {
  --tech-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --tech-gradient-light: linear-gradient(135deg, #818cf8 0%, #a78bfa 100%);
  --tech-bg: #0f172a;
  --tech-card-bg: #1e293b;
  --tech-card-header-bg: #334155;
  --tech-text-primary: #f8fafc;
  --tech-text-secondary: #cbd5e1;
  --tech-text-muted: #94a3b8;
  --tech-border: #334155;
  --tech-border-light: #475569;
  --tech-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  --tech-shadow-hover: 0 12px 48px rgba(0, 0, 0, 0.4);
  --tech-glow: 0 0 20px rgba(102, 126, 234, 0.3);
}

/* 深色主题样式 */
.dark-theme .api-test-page {
  background-color: var(--tech-bg);
  color: var(--tech-text-primary);
}

.dark-theme .page-title {
  color: var(--tech-text-primary);
  background: var(--tech-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.dark-theme .api-test-container {
  gap: 24px;
}

.dark-theme .api-list-card,
.dark-theme .api-detail-card {
  background-color: var(--tech-card-bg);
  border-color: var(--tech-border);
  box-shadow: var(--tech-shadow);
  transition: all 0.3s ease;
}

.dark-theme .api-list-card:hover,
.dark-theme .api-detail-card:hover {
  box-shadow: var(--tech-shadow-hover);
  transform: translateY(-2px);
}

.dark-theme .el-card__header {
  background-color: var(--tech-card-header-bg);
  border-color: var(--tech-border);
}

.dark-theme .card-header span {
  color: var(--tech-text-primary);
  font-weight: 600;
}

.dark-theme .el-button {
  border-radius: 8px;
  transition: all 0.3s ease;
}

.dark-theme .el-button--primary {
  background: var(--tech-gradient);
  border: none;
  box-shadow: var(--tech-glow);
}

.dark-theme .el-button--primary:hover {
  background: var(--tech-gradient-light);
  box-shadow: 0 0 30px rgba(102, 126, 234, 0.5);
  transform: translateY(-1px);
}

.dark-theme .api-tree-node {
  gap: 10px;
  padding: 8px 4px;
  border-radius: 6px;
  transition: all 0.2s ease;
  cursor: pointer;
}

.dark-theme .api-tree-node:hover {
  background-color: rgba(102, 126, 234, 0.1);
  transform: translateX(4px);
}

.dark-theme .api-tree-node__path {
  color: #818cf8;
  font-weight: 500;
}

.dark-theme .api-tree-node__name {
  color: var(--tech-text-muted);
  font-size: 12px;
}

.dark-theme .api-detail__info h3 {
  color: var(--tech-text-primary);
  background: var(--tech-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.dark-theme .api-detail__description {
  color: var(--tech-text-secondary);
}

.dark-theme .api-detail__path {
  color: #818cf8;
}

.dark-theme .api-detail__params h4,
.dark-theme .api-detail__form h4,
.dark-theme .api-detail__response h4 {
  color: var(--tech-text-primary);
  border-bottom-color: var(--tech-border-light);
}

.dark-theme .el-table {
  background-color: transparent;
  color: var(--tech-text-primary);
}

.dark-theme .el-table__header-wrapper th {
  background-color: var(--tech-card-header-bg);
  color: var(--tech-text-primary);
  border-bottom-color: var(--tech-border-light);
}

.dark-theme .el-table__body-wrapper td {
  background-color: transparent;
  color: var(--tech-text-secondary);
  border-bottom-color: var(--tech-border);
}

.dark-theme .el-table__row:hover td {
  background-color: rgba(102, 126, 234, 0.1);
}

.dark-theme .el-input__wrapper {
  background-color: var(--tech-card-bg);
  border-color: var(--tech-border);
  border-radius: 8px;
}

.dark-theme .el-input__inner {
  background-color: transparent;
  color: var(--tech-text-primary);
}

.dark-theme .el-input__inner::placeholder {
  color: var(--tech-text-muted);
}

.dark-theme .el-input__wrapper:hover {
  border-color: #818cf8;
  box-shadow: 0 0 15px rgba(129, 140, 248, 0.3);
}

.dark-theme .api-detail__response-body {
  background-color: var(--tech-card-header-bg);
  color: var(--tech-text-primary);
  border: 1px solid var(--tech-border);
  border-radius: 8px;
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.3);
  font-size: 13px;
  line-height: 1.6;
}

.dark-theme .api-detail-empty {
  color: var(--tech-text-muted);
}

.dark-theme .api-detail-empty i {
  color: var(--tech-text-muted);
}

.dark-theme .api-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 40px 0;
  color: var(--tech-text-secondary);
}

.dark-theme .api-error {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 40px 0;
  color: #f56c6c;
}

.dark-theme .response-time {
  color: var(--tech-text-muted);
}

/* 基础样式 */
.api-test-page {
  width: 100%;
  min-height: 100vh;
  padding: 20px;
  transition: all 0.3s ease;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 24px;
  transition: all 0.3s ease;
}

.api-test-container {
  display: flex;
  gap: 20px;
  height: calc(100vh - 180px);
  transition: all 0.3s ease;
}

.api-list-card {
  width: 350px;
  overflow-y: auto;
  transition: all 0.3s ease;
}

.api-detail-card {
  flex: 1;
  overflow-y: auto;
  transition: all 0.3s ease;
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
  transition: all 0.2s ease;
}

.api-tree-node__path {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  color: #667eea;
  font-size: 13px;
  transition: all 0.3s ease;
}

.api-tree-node__name {
  font-size: 13px;
  color: #909399;
  margin-left: auto;
  transition: all 0.3s ease;
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
  transition: all 0.3s ease;
}

.api-detail__description {
  color: #606266;
  margin-bottom: 12px;
  line-height: 1.5;
  transition: all 0.3s ease;
}

.api-detail__method-path {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
}

.api-detail__path {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 16px;
  color: #667eea;
  font-weight: 500;
  transition: all 0.3s ease;
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
  transition: all 0.3s ease;
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
  transition: all 0.3s ease;
}

.api-detail__response-body {
  background-color: #f5f7fa;
  padding: 16px;
  border-radius: 4px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.5;
  overflow-x: auto;
  white-space: pre-wrap;
  word-wrap: break-word;
  transition: all 0.3s ease;
}

.api-detail-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #909399;
  transition: all 0.3s ease;
}

.api-detail-empty i {
  font-size: 48px;
  margin-bottom: 16px;
  color: #c0c4cc;
  transition: all 0.3s ease;
}

/* 加载和错误状态样式 */
.api-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 40px 0;
  color: #606266;
}

.api-error {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 40px 0;
  color: #f56c6c;
}

/* 滚动条样式 */
.dark-theme ::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.dark-theme ::-webkit-scrollbar-track {
  background: var(--tech-card-header-bg);
  border-radius: 4px;
}

.dark-theme ::-webkit-scrollbar-thumb {
  background: var(--tech-border-light);
  border-radius: 4px;
  transition: all 0.3s ease;
}

.dark-theme ::-webkit-scrollbar-thumb:hover {
  background: #818cf8;
  box-shadow: 0 0 10px rgba(129, 140, 248, 0.5);
}
</style>
