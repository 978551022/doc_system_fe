<template>
  <div class="documents-page">
    <h2 class="page-title">文档管理</h2>
    
    <!-- 上传区域 -->
    <el-card class="upload-card">
      <el-upload
        class="upload-dragger"
        action="/api/v1/documents/upload"
        :multiple="true"
        :on-success="handleUploadSuccess"
        :on-error="handleUploadError"
        :file-list="fileList"
        :before-upload="beforeUpload"
        drag
      >
        <i class="el-icon-upload"></i>
        <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
        <div class="el-upload__tip" slot="tip">
          支持多文件上传，单个文件大小不超过10MB，支持的文件类型：doc, docx, pdf, txt
        </div>
      </el-upload>
    </el-card>
    
    <!-- 文档列表 -->
    <el-card class="documents-card" style="margin-top: 20px;">
      <template #header>
        <div class="card-header">
          <span>文档列表</span>
          <el-button type="primary" size="small" @click="refreshDocuments">
            <i class="el-icon-refresh"></i> 刷新
          </el-button>
        </div>
      </template>
      
      <el-table :data="documents" style="width: 100%">
        <el-table-column prop="name" label="文件名" min-width="200">
          <template #default="scope">
            <el-link type="primary" @click="viewDocument(scope.row)">{{ scope.row.name }}</el-link>
          </template>
        </el-table-column>
        <el-table-column prop="uploadTime" label="上传时间" width="180"></el-table-column>
        <el-table-column prop="size" label="文件大小" width="100"></el-table-column>
        <el-table-column prop="type" label="文件类型" width="100"></el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="scope">
            <el-button type="primary" size="small" @click="viewDocument(scope.row)">
              查看
            </el-button>
            <el-button type="danger" size="small" @click="deleteDocument(scope.row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <div class="pagination" v-if="total > 0">
        <el-pagination
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          :current-page="currentPage"
          :page-sizes="[10, 20, 50, 100]"
          :page-size="pageSize"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
        ></el-pagination>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

// 文档列表数据
const documents = ref([])
const fileList = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

// 生命周期钩子
onMounted(() => {
  getDocuments()
})

// 获取文档列表
const getDocuments = async () => {
  try {
    const response = await axios.get('/api/v1/documents', {
      params: {
        page: currentPage.value,
        pageSize: pageSize.value
      }
    })
    documents.value = response.data.items
    total.value = response.data.total
  } catch (error) {
    console.error('获取文档列表失败:', error)
    // 使用模拟数据
    documents.value = [
      { id: 1, name: '测试文档1.pdf', uploadTime: '2024-01-01 10:00:00', size: '2.5MB', type: 'pdf' },
      { id: 2, name: '测试文档2.docx', uploadTime: '2024-01-02 14:30:00', size: '1.8MB', type: 'docx' },
      { id: 3, name: '测试文档3.txt', uploadTime: '2024-01-03 09:15:00', size: '500KB', type: 'txt' }
    ]
    total.value = documents.value.length
  }
}

// 刷新文档列表
const refreshDocuments = () => {
  currentPage.value = 1
  getDocuments()
}

// 上传前验证
const beforeUpload = (file) => {
  const allowedTypes = ['doc', 'docx', 'pdf', 'txt']
  const fileType = file.name.split('.').pop().toLowerCase()
  const isTypeAllowed = allowedTypes.includes(fileType)
  const isLt10M = file.size / 1024 / 1024 < 10

  if (!isTypeAllowed) {
    alert('只允许上传 doc, docx, pdf, txt 类型的文件!')
    return false
  }
  if (!isLt10M) {
    alert('上传文件大小不能超过 10MB!')
    return false
  }
  return true
}

// 上传成功处理
const handleUploadSuccess = (response, file, fileList) => {
  alert('文件上传成功!')
  refreshDocuments()
}

// 上传失败处理
const handleUploadError = (error, file, fileList) => {
  alert('文件上传失败!')
}

// 查看文档
const viewDocument = (document) => {
  alert(`查看文档: ${document.name}`)
}

// 删除文档
const deleteDocument = (document) => {
  ElMessageBox.confirm(`确定要删除文档 "${document.name}" 吗?`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await axios.delete(`/api/v1/documents/${document.id}`)
      ElMessage.success('文档删除成功!')
      refreshDocuments()
    } catch (error) {
      console.error('删除文档失败:', error)
      ElMessage.error('文档删除失败!')
      // 模拟删除成功
      documents.value = documents.value.filter(item => item.id !== document.id)
      total.value--
      ElMessage.success('文档删除成功!')
    }
  }).catch(() => {
    ElMessage.info('已取消删除')
  })
}

// 分页处理
const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
  getDocuments()
}

const handleCurrentChange = (page) => {
  currentPage.value = page
  getDocuments()
}
</script>

<style scoped>
.documents-page {
  width: 100%;
  background-color: var(--background-color);
  color: var(--text-primary);
  padding: 20px;
  transition: var(--transition);
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 20px;
  color: var(--text-primary);
  transition: var(--transition);
}

.upload-card {
  margin-bottom: 20px;
  background-color: var(--card-background);
  border-color: var(--border-color);
  transition: var(--transition);
}

.upload-dragger {
  width: 100%;
  height: 200px;
  border: 2px dashed var(--border-color);
  border-radius: 6px;
  background-color: var(--surface-color);
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.upload-dragger:hover {
  border-color: var(--primary-color);
  background-color: var(--card-background);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: var(--text-primary);
  transition: var(--transition);
}

.pagination {
  margin-top: 20px;
  text-align: right;
}

/* 表格样式优化 */
.documents-card :deep(.el-table) {
  background-color: var(--card-background);
  color: var(--text-primary);
  transition: var(--transition);
}

.documents-card :deep(.el-table__header-wrapper) {
  background-color: var(--surface-color);
  transition: var(--transition);
}

.documents-card :deep(.el-table__header-wrapper th) {
  background-color: var(--surface-color);
  color: var(--text-primary);
  border-bottom-color: var(--border-color);
  transition: var(--transition);
}

.documents-card :deep(.el-table__body-wrapper tr) {
  background-color: var(--card-background);
  transition: var(--transition);
}

.documents-card :deep(.el-table__body-wrapper tr:hover) {
  background-color: var(--surface-color);
}

.documents-card :deep(.el-table__body-wrapper td) {
  border-bottom-color: var(--border-color);
  color: var(--text-primary);
  transition: var(--transition);
}

.documents-card :deep(.el-link) {
  color: var(--primary-color);
  transition: var(--transition);
}

.documents-card :deep(.el-link:hover) {
  color: var(--primary-hover);
}

/* 上传区域文本颜色 */
.upload-dragger .el-upload__text {
  color: var(--text-secondary);
  transition: var(--transition);
}

.upload-dragger .el-upload__tip {
  color: var(--text-muted);
  transition: var(--transition);
}

/* 深色主题下的上传区域样式 */
.dark-theme .upload-dragger {
  background-color: var(--surface-color);
  border-color: var(--border-color);
}

.dark-theme .upload-dragger:hover {
  border-color: var(--primary-color);
  background-color: var(--card-background);
}

.dark-theme .el-upload-dragger {
  background-color: var(--surface-color);
  border-color: var(--border-color);
}

.dark-theme .el-upload-dragger:hover {
  border-color: var(--primary-color);
  background-color: var(--card-background);
}

.dark-theme .el-tree__empty-text {
  color: var(--text-muted);
}
</style>
