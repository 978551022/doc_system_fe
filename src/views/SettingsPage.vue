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
                  :action="''"
                  :show-file-list="false"
                  :on-change="handleAvatarChange"
                  :auto-upload="false"
                  accept="image/*"
                >
                  <el-avatar :size="100" :src="displayAvatar" class="avatar-preview">
                    <i v-if="!displayAvatar" class="el-icon-plus avatar-uploader-icon"></i>
                  </el-avatar>
                </el-upload>
                <div class="avatar-tip">支持 JPG、PNG 格式，大小不超过 10MB</div>
                <div class="avatar-actions">
                  <el-button v-if="tempAvatarPreview" size="small" @click="removeAvatarLocal">
                    <i class="el-icon-close"></i> 取消选择
                  </el-button>
                  <el-button v-if="displayAvatar && !tempAvatarPreview" size="small" type="danger" @click="removeAvatar">
                    <i class="el-icon-delete"></i> 删除头像
                  </el-button>
                </div>
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
import { ref, reactive, watch, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import userState, { updateUserInfo, updateUserAvatar, isLoggedIn } from '../utils/userStore.js'



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

// 用户信息 - 使用全局状态
const userInfo = reactive({
  username: userState.username,
  email: userState.email,
  phone: userState.phone,
  avatar: userState.avatar
})

// 监听全局状态变化，同步更新本地
watch(
  () => userState,
  (newState) => {
    userInfo.username = newState.username
    userInfo.email = newState.email
    userInfo.phone = newState.phone
    userInfo.avatar = newState.avatar
  },
  { deep: true }
)

// 存储当前选择的文件（用于保存时上传）
const selectedAvatarFile = ref(null)
// 临时预览URL，仅用于组件内显示，不同步到全局状态
const tempAvatarPreview = ref('')

// 头像上传URL（通过Vite代理到后端 /api/v1/docsearch/user/me/avatar）
// 后端 user_router 前缀为 /user，整体挂载在 /api/v1/docsearch 下
const uploadUrl = '/api/v1/docsearch/user/me/avatar'
// 删除头像URL
const deleteAvatarUrl = '/api/v1/docsearch/user/me/delete/avatar'

// 处理头像文件选择（本地预览 + 本地持久化，上传成功后再用后端URL覆盖）
const handleAvatarChange = (uploadFile) => {
  if (uploadFile && uploadFile.raw) {
    // 验证文件
    const isImage = uploadFile.raw.type.startsWith('image/')
    const isLt10M = uploadFile.raw.size / 1024 / 1024 < 10

    if (!isImage) {
      ElMessage.error('只支持图片格式!')
      return
    }
    if (!isLt10M) {
      ElMessage.error('头像大小不能超过 10MB!')
      return
    }

    // 存储文件，等待保存时上传到后端
    selectedAvatarFile.value = uploadFile.raw

    // 使用临时预览URL，仅用于组件内显示，不同步到localStorage
    // 这样可以避免大base64字符串阻塞localStorage
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      if (typeof result === 'string') {
        tempAvatarPreview.value = result
        ElMessage.success('头像已选择，点击"保存个人资料"后上传到服务器')
      }
    }
    reader.onerror = () => {
      console.error('读取头像文件失败')
      ElMessage.error('读取头像文件失败，请重试')
      tempAvatarPreview.value = ''
    }
    reader.readAsDataURL(uploadFile.raw)
  }
}

// 显示的头像URL：优先使用临时预览，否则使用用户头像
const displayAvatar = computed(() => {
  return tempAvatarPreview.value || userState.avatar
})

// 移除头像（仅本地移除，不调用后端）
const removeAvatarLocal = () => {
  tempAvatarPreview.value = ''
  selectedAvatarFile.value = null
  ElMessage.info('头像已移除，点击"保存个人资料"后生效')
}

// 删除头像（调用后端API）
const removeAvatar = async () => {
  try {
    // 检查登录状态
    if (!isLoggedIn()) {
      ElMessage.warning('请先登录')
      return
    }

    // 确认删除
    await ElMessageBox.confirm(
      '确定要删除头像吗？删除后无法恢复。',
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const response = await fetch(deleteAvatarUrl, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Authorization': `Bearer ${userState.token}`
      }
    })

    if (response.ok) {
      const result = await response.json()
      // 清空本地状态
      tempAvatarPreview.value = ''
      selectedAvatarFile.value = null
      userInfo.avatar = ''
      updateUserInfo({
        username: userInfo.username,
        email: userInfo.email,
        phone: userInfo.phone,
        avatar: ''
      })

      // 清除localStorage中的头像缓存
      if (userState.userId) {
        try {
          let avatarCache = {}
          const saved = localStorage.getItem('user_avatar_cache')
          if (saved) {
            avatarCache = JSON.parse(saved)
          }
          delete avatarCache[userState.userId]
          localStorage.setItem('user_avatar_cache', JSON.stringify(avatarCache))
        } catch (e) {
          console.error('清除头像缓存失败:', e)
        }
      }

      ElMessage.success('头像删除成功！')
    } else {
      const errorData = await response.json().catch(() => ({ detail: '删除失败' }))
      console.error('删除头像失败:', response.status, errorData)
      ElMessage.error(errorData.detail || '删除头像失败，请稍后重试')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除头像异常:', error)
      ElMessage.error('删除头像异常，请检查网络或后端服务')
    }
  }
}

// 保存个人资料
const saveUserInfo = async () => {
  try {
    // 如果有选择的头像文件，先上传
    // 注意：为避免把临时 blob URL 持久化到 localStorage，这里从当前全局状态作为旧值起点
    let avatarUrl = userState.avatar

    if (selectedAvatarFile.value) {
      // 检查登录状态
      if (!isLoggedIn()) {
        ElMessage.warning('请先登录后再上传头像')
        return
      }

      const formData = new FormData()
      formData.append('file', selectedAvatarFile.value)

      try {
        // 上传头像到后端，携带 token
        const headers = {}
        if (userState.token) {
          headers['Authorization'] = `Bearer ${userState.token}`
        }

        const response = await fetch(uploadUrl, {
          method: 'POST',
          body: formData,
          credentials: 'include',
          headers
        })

        if (response.ok) {
          const result = await response.json()

          // 尝试从多种常见结构中提取头像 URL，兼容后端不同返回格式
          let extractedUrl = null

          // 直接在根对象上的字段
          if (result) {
            extractedUrl =
              result.avatar_url ||
              result.url ||
              result.avatar ||
              null
          }

          // data 包裹一层的情况：{ data: { avatar_url / url / avatar } }
          if (!extractedUrl && result && result.data) {
            extractedUrl =
              result.data.avatar_url ||
              result.data.url ||
              result.data.avatar ||
              null
          }

          // 用户信息字段下：{ user: { avatar_url / url / avatar } }
          if (!extractedUrl && result && result.user) {
            extractedUrl =
              result.user.avatar_url ||
              result.user.url ||
              result.user.avatar ||
              null
          }

          // 如果仍然拿不到，就保持原有头像（不覆盖为预览的 blob）
          if (extractedUrl && typeof extractedUrl === 'string') {
            // 如果是完整URL（http/https），直接使用
            // 如果是相对路径，也直接使用（通过Vite代理访问）
            avatarUrl = extractedUrl
          }
        } else {
          console.error('头像上传失败:', response.status, response.statusText)
          if (response.status === 401) {
            // 认证失败（token过期等），提示重新登录
            ElMessage.error('登录已过期，请重新登录')
          } else {
            ElMessage.error('头像上传失败，请稍后重试')
          }
          // 上传失败时不保存
          return
        }
      } catch (uploadError) {
        console.error('头像上传异常:', uploadError)
        ElMessage.error('头像上传异常，请检查网络或后端服务')
        // 上传失败时不保存
        return
      }
    }

    // 更新全局状态（会同步到 Header 和 Sidebar）
    updateUserInfo({
      username: userInfo.username,
      email: userInfo.email,
      phone: userInfo.phone,
      avatar: avatarUrl
    })

    // 保存头像到localStorage缓存，避免后端未返回头像时丢失
    if (avatarUrl && userState.userId) {
      try {
        let avatarCache = {}
        const saved = localStorage.getItem('user_avatar_cache')
        if (saved) {
          avatarCache = JSON.parse(saved)
        }
        avatarCache[userState.userId] = avatarUrl
        localStorage.setItem('user_avatar_cache', JSON.stringify(avatarCache))
      } catch (e) {
        console.error('保存头像缓存失败:', e)
      }
    }

    // 清空待上传文件和临时预览
    selectedAvatarFile.value = null
    tempAvatarPreview.value = ''

    ElMessage.success('个人资料保存成功！')
  } catch (error) {
    console.error('保存个人资料失败:', error)
    ElMessage.error('保存失败，请重试')
  }
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
  overflow: hidden; /* 防止外层滚动 */
}

.settings-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--card-background);
  border-color: var(--border-color);
  color: var(--text-primary);
  transition: var(--transition);
  overflow: hidden; /* 防止卡片本身滚动 */
}

/* 关键修复：让 el-card 的 body 成为 flex 容器并占满剩余空间 */
.settings-card :deep(.el-card__body) {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden; /* 防止 body 滚动，让内部 content 滚动 */
  padding: 0; /* 移除默认 padding，由内部元素控制 */
  min-height: 0; /* 重要：允许 flex 子元素收缩 */
}

.settings-card :deep(.el-card__header) {
  border-bottom: 1px solid var(--border-color);
  padding: 16px 20px;
  background-color: var(--card-header-background);
  transition: var(--transition);
  flex-shrink: 0; /* 头部不收缩 */
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
  overflow-x: hidden;
  padding: 20px;
  background-color: var(--background-color);
  transition: var(--transition);
  min-height: 0; /* 重要：允许 flex 子元素收缩并启用滚动 */
}

/* 设置章节样式 */
.settings-section {
  margin-bottom: 28px;
  padding-bottom: 20px;
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
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 2px solid var(--primary-color);
  display: inline-block;
  transition: var(--transition);
}

.settings-form {
  max-width: 500px;
}

.settings-form__unit {
  margin-left: 8px;
  color: var(--text-muted);
  font-size: 12px;
  transition: var(--transition);
}

.settings-actions {
  display: flex;
  gap: 10px;
  padding: 16px 20px;
  border-top: 1px solid var(--border-color);
  justify-content: flex-end;
  background-color: var(--card-background);
  transition: var(--transition);
  flex-shrink: 0;
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

/* 头像操作按钮 */
.avatar-actions {
  margin-top: 8px;
  display: flex;
  gap: 8px;
}

.avatar-actions .el-button {
  padding: 6px 12px;
  font-size: 12px;
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
