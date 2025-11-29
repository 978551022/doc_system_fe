<template>
  <div class="settings-page">
    <el-card class="settings-card">
      <template #header>
        <h2>设置</h2>
      </template>
      
      <!-- 设置内容区域，支持垂直滚动 -->
      <div class="settings-content">
        <!-- 账户设置 -->
        <div class="settings-section">
          <h3 class="settings-section__title">账户设置</h3>
          <el-form :model="userInfo" label-width="120px" class="settings-form">
            <!-- 头像上传 -->
            <el-form-item label="头像">
              <div class="avatar-uploader-wrapper">
                <el-upload
                  class="avatar-uploader"
                  :action="uploadUrl"
                  :show-file-list="false"
                  :on-success="handleAvatarUploadSuccess"
                  :before-upload="beforeAvatarUpload"
                  accept="image/*"
                >
                  <el-avatar :size="100" :src="userInfo.avatar" class="avatar-preview">
                    <i v-if="!userInfo.avatar" class="el-icon-plus avatar-uploader-icon"></i>
                  </el-avatar>
                </el-upload>
                <div class="avatar-tip">支持 JPG、PNG 格式，大小不超过 2MB</div>
              </div>
            </el-form-item>
            
            <el-form-item label="用户名">
              <el-input v-model="userInfo.username"></el-input>
            </el-form-item>
            
            <el-form-item label="邮箱">
              <el-input v-model="userInfo.email"></el-input>
            </el-form-item>
            
            <el-form-item label="手机号">
              <el-input v-model="userInfo.phone"></el-input>
            </el-form-item>
            
            <el-form-item label="修改密码">
              <el-button type="primary" @click="showChangePasswordDialog">
                <i class="el-icon-key"></i> 修改密码
              </el-button>
            </el-form-item>
            
            <el-form-item>
              <el-button type="primary" @click="saveUserInfo">
                <i class="el-icon-check"></i> 保存个人资料
              </el-button>
            </el-form-item>
          </el-form>
        </div>
        
        <!-- 通用设置 -->
        <div class="settings-section">
          <h3 class="settings-section__title">通用设置</h3>
          <el-form :model="settings" label-width="120px" class="settings-form">
            <el-form-item label="主题">
              <el-radio-group v-model="settings.theme">
                <el-radio label="light">浅色主题</el-radio>
                <el-radio label="dark">深色主题</el-radio>
                <el-radio label="auto">跟随系统</el-radio>
              </el-radio-group>
            </el-form-item>
            
            <el-form-item label="语言">
              <el-select v-model="settings.language" placeholder="请选择语言">
                <el-option label="中文" value="zh-CN"></el-option>
                <el-option label="English" value="en-US"></el-option>
              </el-select>
            </el-form-item>
            
            <el-form-item label="字体大小">
              <el-slider v-model="settings.fontSize" :min="12" :max="20" :step="1" show-input>
                <template #append>
                  px
                </template>
              </el-slider>
            </el-form-item>
            
            <el-form-item label="自动保存">
              <el-switch v-model="settings.autoSave"></el-switch>
            </el-form-item>
            
            <el-form-item label="保存间隔">
              <el-input-number v-model="settings.saveInterval" :min="1" :max="60" :step="1"></el-input-number>
              <span class="settings-form__unit">分钟</span>
            </el-form-item>
          </el-form>
        </div>
        
        <!-- 会话设置 -->
        <div class="settings-section">
          <h3 class="settings-section__title">会话设置</h3>
          <el-form :model="settings" label-width="120px" class="settings-form">
            <!-- 历史对话设置 -->
            <el-divider>历史对话设置</el-divider>
            
            <el-form-item label="历史对话保存">
              <el-switch v-model="settings.saveHistory"></el-switch>
            </el-form-item>
            
            <el-form-item label="历史对话数量">
              <el-input-number v-model="settings.historyCount" :min="5" :max="50" :step="5"></el-input-number>
              <span class="settings-form__unit">个会话</span>
            </el-form-item>
            
            <el-form-item label="自动清理历史">
              <el-switch v-model="settings.autoCleanHistory"></el-switch>
            </el-form-item>
            
            <el-form-item label="清理间隔">
              <el-select v-model="settings.cleanInterval" placeholder="请选择清理间隔">
                <el-option label="7天" value="7"></el-option>
                <el-option label="30天" value="30"></el-option>
                <el-option label="90天" value="90"></el-option>
                <el-option label="180天" value="180"></el-option>
                <el-option label="365天" value="365"></el-option>
              </el-select>
            </el-form-item>
            
            <el-form-item label="历史对话加密">
              <el-switch v-model="settings.encryptHistory"></el-switch>
            </el-form-item>
            
            <!-- 会话行为设置 -->
            <el-divider>会话行为设置</el-divider>
            
            <el-form-item label="自动创建会话">
              <el-switch v-model="settings.autoCreateSession"></el-switch>
            </el-form-item>
            
            <el-form-item label="会话超时时间">
              <el-input-number v-model="settings.sessionTimeout" :min="5" :max="120" :step="5"></el-input-number>
              <span class="settings-form__unit">分钟</span>
            </el-form-item>
            
            <el-form-item label="默认会话名称">
              <el-select v-model="settings.defaultSessionName" placeholder="请选择默认会话名称">
                <el-option label="新对话" value="new-chat"></el-option>
                <el-option label="未命名会话" value="unnamed"></el-option>
                <el-option label="自动生成" value="auto-generate"></el-option>
              </el-select>
            </el-form-item>
            
            <el-form-item label="会话标签显示">
              <el-switch v-model="settings.showSessionTags"></el-switch>
            </el-form-item>
            
            <!-- 导出导入设置 -->
            <el-divider>导出导入设置</el-divider>
            
            <el-form-item label="导出格式">
              <el-select v-model="settings.exportFormat" placeholder="请选择导出格式" multiple>
                <el-option label="JSON" value="json"></el-option>
                <el-option label="TXT" value="txt"></el-option>
                <el-option label="Markdown" value="md"></el-option>
              </el-select>
            </el-form-item>
            
            <el-form-item label="导出包含时间">
              <el-switch v-model="settings.exportWithTime"></el-switch>
            </el-form-item>
            
            <el-form-item label="导入自动合并">
              <el-switch v-model="settings.importMerge"></el-switch>
            </el-form-item>
          </el-form>
        </div>
        
        <!-- 对话设置 -->
        <div class="settings-section">
          <h3 class="settings-section__title">对话设置</h3>
          <el-form :model="settings" label-width="120px" class="settings-form">
            <!-- 对话相关设置 -->
            <el-form-item label="流式输出">
              <el-switch v-model="settings.streamOutput"></el-switch>
            </el-form-item>
            
            <el-form-item label="打字机效果">
              <el-switch v-model="settings.typewriterEffect" :disabled="!settings.streamOutput"></el-switch>
            </el-form-item>
            
            <el-form-item label="回复速度">
              <el-slider v-model="settings.responseSpeed" :min="1" :max="10" :step="1" show-input>
                <template #prepend>
                  <i class="el-icon-speed"></i>
                </template>
              </el-slider>
            </el-form-item>
            
            <el-form-item label="自动滚动">
              <el-switch v-model="settings.autoScroll"></el-switch>
            </el-form-item>
            
            <el-form-item label="历史记录">
              <el-input-number v-model="settings.historyLimit" :min="10" :max="1000" :step="10"></el-input-number>
              <span class="settings-form__unit">条</span>
            </el-form-item>
            
            <!-- 文档相关设置 -->
            <el-divider>文档设置</el-divider>
            
            <el-form-item label="默认上传路径">
              <el-input v-model="settings.defaultUploadPath" placeholder="请输入默认上传路径"></el-input>
            </el-form-item>
            
            <el-form-item label="文件大小限制">
              <el-input-number v-model="settings.fileSizeLimit" :min="1" :max="100" :step="1"></el-input-number>
              <span class="settings-form__unit">MB</span>
            </el-form-item>
            
            <el-form-item label="支持的文件类型">
              <el-select v-model="settings.supportedFileTypes" multiple placeholder="请选择支持的文件类型">
                <el-option label="doc" value="doc"></el-option>
                <el-option label="docx" value="docx"></el-option>
                <el-option label="pdf" value="pdf"></el-option>
                <el-option label="txt" value="txt"></el-option>
                <el-option label="md" value="md"></el-option>
                <el-option label="ppt" value="ppt"></el-option>
                <el-option label="pptx" value="pptx"></el-option>
              </el-select>
            </el-form-item>
            
            <el-form-item label="自动命名">
              <el-switch v-model="settings.autoRename"></el-switch>
            </el-form-item>
          </el-form>
        </div>
      </div>
      
      <!-- 操作按钮 -->
      <div class="settings-actions">
        <el-button type="primary" @click="saveSettings">
          <i class="el-icon-check"></i> 保存设置
        </el-button>
        <el-button @click="resetSettings">
          <i class="el-icon-refresh"></i> 重置
        </el-button>
        <el-button type="danger" @click="restoreDefaults">
          <i class="el-icon-delete"></i> 恢复默认
        </el-button>
      </div>
      
      <!-- 修改密码对话框 -->
      <el-dialog
        title="修改密码"
        v-model="changePasswordDialogVisible"
        width="400px"
      >
        <el-form :model="passwordForm" :rules="passwordRules" ref="passwordFormRef" label-width="80px">
          <el-form-item label="旧密码" prop="oldPassword">
            <el-input type="password" v-model="passwordForm.oldPassword"></el-input>
          </el-form-item>
          <el-form-item label="新密码" prop="newPassword">
            <el-input type="password" v-model="passwordForm.newPassword"></el-input>
          </el-form-item>
          <el-form-item label="确认密码" prop="confirmPassword">
            <el-input type="password" v-model="passwordForm.confirmPassword"></el-input>
          </el-form-item>
        </el-form>
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="changePasswordDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="changePassword">确定</el-button>
          </span>
        </template>
      </el-dialog>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { ElMessage } from 'element-plus'



// 从localStorage加载初始设置
const loadInitialSettings = () => {
  const savedTheme = localStorage.getItem('appTheme')
  const savedFontSize = localStorage.getItem('appFontSize')
  
  return {
    theme: savedTheme || 'light',
    fontSize: savedFontSize ? parseInt(savedFontSize) : 16
  }
}

// 设置数据
const initialSettings = loadInitialSettings()
const settings = reactive({
  theme: initialSettings.theme,
  language: 'zh-CN',
  fontSize: initialSettings.fontSize,
  autoSave: true,
  saveInterval: 5,
  // 会话设置
  saveHistory: true,
  historyCount: 20,
  autoCleanHistory: false,
  cleanInterval: '30',
  encryptHistory: false,
  autoCreateSession: true,
  sessionTimeout: 30,
  defaultSessionName: 'new-chat',
  showSessionTags: true,
  exportFormat: ['json'],
  exportWithTime: true,
  importMerge: false,
  // 对话设置
  streamOutput: true,
  typewriterEffect: true,
  responseSpeed: 5,
  autoScroll: true,
  historyLimit: 100,
  defaultUploadPath: '/uploads',
  fileSizeLimit: 10,
  supportedFileTypes: ['doc', 'docx', 'pdf', 'txt'],
  autoRename: false
})

// 用户信息
const userInfo = reactive({
  username: 'user',
  email: 'user@example.com',
  phone: '',
  avatar: '' // 添加头像字段
})

// 头像上传URL
const uploadUrl = 'https://localhost:8002/api/v1/user/avatar/upload' // 模拟上传URL

// 处理头像上传成功
const handleAvatarUploadSuccess = (response, file) => {
  // 模拟上传成功，实际应该使用response中的URL
  userInfo.avatar = URL.createObjectURL(file.raw)
  ElMessage.success('头像上传成功!')
}

// 头像上传前验证
const beforeAvatarUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2
  
  if (!isImage) {
    ElMessage.error('只支持图片格式!')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('头像大小不能超过 2MB!')
    return false
  }
  return true
}

// 保存个人资料
const saveUserInfo = () => {
  // 模拟保存个人资料
  console.log('保存个人资料:', userInfo)
  ElMessage.success('个人资料保存成功!')
}

// 修改密码对话框
const changePasswordDialogVisible = ref(false)
const passwordFormRef = ref(null)
const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const passwordRules = {
  oldPassword: [
    { required: true, message: '请输入旧密码', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    { validator: (rule, value, callback) => {
        if (value !== passwordForm.newPassword) {
          callback(new Error('两次输入密码不一致'))
        } else {
          callback()
        }
      }, message: '两次输入密码不一致', trigger: 'blur' }
  ]
}

// 显示修改密码对话框
const showChangePasswordDialog = () => {
  changePasswordDialogVisible.value = true
}

// 修改密码
const changePassword = () => {
  passwordFormRef.value.validate((valid) => {
    if (valid) {
      // 模拟修改密码
      console.log('修改密码:', passwordForm)
      changePasswordDialogVisible.value = false
      // 清空表单
      passwordForm.oldPassword = ''
      passwordForm.newPassword = ''
      passwordForm.confirmPassword = ''
      ElMessage.success('密码修改成功!')
    }
  })
}

// 保存设置
const saveSettings = () => {
  // 保存主题和字体大小到localStorage
  localStorage.setItem('appTheme', settings.theme)
  localStorage.setItem('appFontSize', settings.fontSize.toString())
  
  // 模拟保存其他设置
  console.log('保存设置:', settings)
  
  // 由于添加了localStorage监听器，设置会实时生效，不需要重新加载页面
  ElMessage.success('设置保存成功!')
}

// 重置设置
const resetSettings = () => {
  // 重置为当前保存的设置
  ElMessage.info('设置已重置为当前保存的值')
}

// 恢复默认设置
const restoreDefaults = () => {
  // 恢复默认设置
  Object.assign(settings, {
    theme: 'light',
    language: 'zh-CN',
    fontSize: 16,
    autoSave: true,
    saveInterval: 5,
    // 会话设置默认值
    saveHistory: true,
    historyCount: 20,
    autoCleanHistory: false,
    cleanInterval: '30',
    encryptHistory: false,
    autoCreateSession: true,
    sessionTimeout: 30,
    defaultSessionName: 'new-chat',
    showSessionTags: true,
    exportFormat: ['json'],
    exportWithTime: true,
    importMerge: false,
    // 对话设置默认值
    streamOutput: true,
    typewriterEffect: true,
    responseSpeed: 5,
    autoScroll: true,
    historyLimit: 100,
    defaultUploadPath: '/uploads',
    fileSizeLimit: 10,
    supportedFileTypes: ['doc', 'docx', 'pdf', 'txt'],
    autoRename: false
  })
  
  // 保存默认设置到localStorage
  localStorage.setItem('appTheme', 'light')
  localStorage.setItem('appFontSize', '16')
  
  // 由于添加了localStorage监听器，设置会实时生效，不需要重新加载页面
  ElMessage.success('已恢复默认设置!')
}

// 监听主题和字体大小变化，实时保存到localStorage
watch(
  () => [settings.theme, settings.fontSize],
  ([newTheme, newFontSize]) => {
    localStorage.setItem('appTheme', newTheme)
    localStorage.setItem('appFontSize', newFontSize.toString())
  },
  { deep: true }
)
</script>

<style scoped>
.settings-page {
  width: 100%;
  height: 100%;
  background-color: var(--background-color);
  color: var(--text-primary);
  transition: var(--transition);
}

.settings-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--card-background);
  border-color: var(--border-color);
  color: var(--text-primary);
  transition: var(--transition);
}

.settings-card :deep(.el-card__header) {
  border-bottom: 1px solid var(--border-color);
  padding: 16px 20px;
  background-color: var(--card-header-background);
  transition: var(--transition);
}

.settings-card :deep(.el-card__header) h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
  transition: var(--transition);
}

/* 设置内容区域，支持垂直滚动 */
.settings-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background-color: var(--background-color);
  transition: var(--transition);
}

/* 设置章节样式 */
.settings-section {
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--border-color);
  transition: var(--transition);
}

.settings-section:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

/* 章节标题样式 */
.settings-section__title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 20px;
  padding-bottom: 8px;
  border-bottom: 2px solid var(--primary-color);
  display: inline-block;
  transition: var(--transition);
}

.settings-form {
  max-width: 600px;
}

.settings-form__unit {
  margin-left: 8px;
  color: var(--text-muted);
  transition: var(--transition);
}

.settings-actions {
  display: flex;
  gap: 12px;
  padding: 20px;
  border-top: 1px solid var(--border-color);
  justify-content: flex-end;
  background-color: var(--card-background);
  transition: var(--transition);
}

/* 头像上传样式 */
.avatar-uploader-wrapper {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
}

.avatar-uploader {
  display: flex;
  align-items: center;
}

.avatar-preview {
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px dashed var(--border-color);
}

.avatar-preview:hover {
  border-color: var(--primary-color);
  transform: scale(1.05);
}

.avatar-uploader-icon {
  font-size: 28px;
  color: var(--text-muted);
}

.avatar-tip {
  font-size: 12px;
  color: var(--text-muted);
  margin-left: 12px;
  transition: var(--transition);
}

/* 设置页面输入框样式 - 始终保持浅色主题样式 */
.settings-form :deep(.el-input__inner),
.settings-form :deep(.el-select__input),
.settings-form :deep(.el-textarea__inner) {
  background-color: #ffffff !important;
  border-color: #e0e0e0 !important;
  color: #333333 !important;
}

.settings-form :deep(.el-input__inner::placeholder),
.settings-form :deep(.el-select__input::placeholder),
.settings-form :deep(.el-textarea__inner::placeholder) {
  color: #999999 !important;
}

.settings-form :deep(.el-select__popper) {
  background-color: #ffffff !important;
  border-color: #e0e0e0 !important;
}

.settings-form :deep(.el-option) {
  color: #333333 !important;
}

.settings-form :deep(.el-option:hover) {
  background-color: #f8f9fa !important;
}

.settings-form :deep(.el-radio__label) {
  color: var(--text-primary) !important;
}

.settings-form :deep(.el-switch__core) {
  background-color: #e0e0e0 !important;
}

.settings-form :deep(.el-switch.is-checked .el-switch__core) {
  background-color: var(--primary-color) !important;
}

.settings-form :deep(.el-slider__runway) {
  background-color: #e0e0e0 !important;
}

.settings-form :deep(.el-slider__bar) {
  background-color: var(--primary-color) !important;
}

.settings-form :deep(.el-slider__button) {
  border-color: var(--primary-color) !important;
  background-color: var(--primary-color) !important;
}

/* 滚动条样式 */
.settings-content::-webkit-scrollbar {
  width: 6px;
}

.settings-content::-webkit-scrollbar-track {
  background: var(--surface-color);
  border-radius: 3px;
}

.settings-content::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 3px;
}

.settings-content::-webkit-scrollbar-thumb:hover {
  background: var(--border-hover);
}
</style>
