<template>
  <div class="help-page">
    <el-card class="help-card">
      <template #header>
        <h2>帮助中心</h2>
      </template>
      
      <div class="help-content">
        <!-- 常见问题 -->
        <section class="help-section">
          <h3 class="help-section__title">
            <i class="el-icon-question"></i>
            常见问题
          </h3>
          
          <el-collapse v-model="activeFaqNames">
            <el-collapse-item title="如何上传文档？" name="1">
              <div class="help-section__content">
                <p>您可以通过以下方式上传文档：</p>
                <ol>
                  <li>在智能对话页面底部的输入区域，点击"上传文档"按钮</li>
                  <li>直接将文件拖拽到聊天输入框中</li>
                  <li>在文档列表页面，点击"上传文档"按钮</li>
                </ol>
                <p>支持的文件类型：doc, docx, pdf, txt，单个文件大小不超过10MB。</p>
              </div>
            </el-collapse-item>
            
            <el-collapse-item title="如何使用智能对话？" name="2">
              <div class="help-section__content">
                <p>使用智能对话功能非常简单：</p>
                <ol>
                  <li>在左侧导航栏点击"智能对话"进入对话页面</li>
                  <li>在底部输入框中输入您的问题</li>
                  <li>点击"发送"按钮或按Ctrl+Enter发送消息</li>
                  <li>等待智能助手的回复</li>
                </ol>
                <p>您还可以上传文档，让智能助手基于文档内容进行回答。</p>
              </div>
            </el-collapse-item>
            
            <el-collapse-item title="如何测试API接口？" name="3">
              <div class="help-section__content">
                <p>API接口测试功能使用步骤：</p>
                <ol>
                  <li>在左侧导航栏点击"API接口测试"进入测试页面</li>
                  <li>在左侧API列表中选择要测试的接口</li>
                  <li>在右侧填写请求参数</li>
                  <li>点击"发送请求"按钮</li>
                  <li>查看响应结果</li>
                </ol>
                <p>支持GET、POST、PUT、DELETE等HTTP方法。</p>
              </div>
            </el-collapse-item>
            
            <el-collapse-item title="如何查看历史对话？" name="4">
              <div class="help-section__content">
                <p>查看历史对话记录：</p>
                <ol>
                  <li>在左侧导航栏点击"历史对话"进入历史记录页面</li>
                  <li>在历史列表中选择要查看的对话</li>
                  <li>点击对话卡片，系统会自动跳转到聊天页面并加载该对话</li>
                </ol>
                <p>您可以删除不需要的历史对话，或清空所有历史记录。</p>
              </div>
            </el-collapse-item>
            
            <el-collapse-item title="如何修改个人设置？" name="5">
              <div class="help-section__content">
                <p>修改个人设置：</p>
                <ol>
                  <li>在左侧导航栏点击"设置"进入设置页面</li>
                  <li>在不同的标签页中修改相应的设置</li>
                  <li>点击"保存设置"按钮保存修改</li>
                </ol>
                <p>您可以修改主题、语言、字体大小等设置，也可以修改密码。</p>
              </div>
            </el-collapse-item>
          </el-collapse>
        </section>
        
        <!-- 使用指南 -->
        <section class="help-section">
          <h3 class="help-section__title">
            <i class="el-icon-document"></i>
            使用指南
          </h3>
          
          <div class="help-guide">
            <div class="help-guide__item">
              <div class="help-guide__icon">
                <i class="el-icon-chat-dot-round"></i>
              </div>
              <div class="help-guide__content">
                <h4>智能对话</h4>
                <p>与智能助手进行自然语言交互，获取信息和帮助。</p>
              </div>
            </div>
            
            <div class="help-guide__item">
              <div class="help-guide__icon">
                <i class="el-icon-document-copy"></i>
              </div>
              <div class="help-guide__content">
                <h4>文档管理</h4>
                <p>上传、查看和管理您的文档文件。</p>
              </div>
            </div>
            
            <div class="help-guide__item">
              <div class="help-guide__icon">
                <i class="el-icon-s-cooperation"></i>
              </div>
              <div class="help-guide__content">
                <h4>API测试</h4>
                <p>测试和调试API接口，查看响应结果。</p>
              </div>
            </div>
            
            <div class="help-guide__item">
              <div class="help-guide__icon">
                <i class="el-icon-time"></i>
              </div>
              <div class="help-guide__content">
                <h4>历史对话</h4>
                <p>查看和管理您的对话历史记录。</p>
              </div>
            </div>
          </div>
        </section>
        
        <!-- 联系我们 -->
        <section class="help-section">
          <h3 class="help-section__title">
            <i class="el-icon-phone"></i>
            联系我们
          </h3>
          
          <div class="help-contact">
            <div class="help-contact__item">
              <i class="el-icon-message"></i>
              <div>
                <h4>在线客服</h4>
                <p>工作日 9:00-18:00</p>
              </div>
            </div>
            
            <div class="help-contact__item">
              <i class="el-icon-email"></i>
              <div>
                <h4>邮箱</h4>
                <p>support@example.com</p>
              </div>
            </div>
            
            <div class="help-contact__item">
              <i class="el-icon-chat-line-round"></i>
              <div>
                <h4>反馈建议</h4>
                <p>feedback@example.com</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'

// 激活的FAQ项
const activeFaqNames = ref(['1'])
</script>

<style scoped>
.help-page {
  width: 100%;
  height: 100%;
}

.help-card {
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.help-card :deep(.el-card__header) {
  border-bottom: 1px solid var(--border-color);
  padding: 16px 20px;
  background-color: var(--card-header-background);
}

.help-card :deep(.el-card__header) h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
}

.help-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background-color: var(--background-color);
}

.help-section {
  margin-bottom: 32px;
  color: var(--text-primary);
}

.help-section__title {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.help-section__title i {
  color: var(--primary-color);
  font-size: 22px;
}

.help-section__content {
  color: var(--text-secondary);
  line-height: 1.6;
}

.help-section__content p {
  margin-bottom: 12px;
}

.help-section__content ol {
  margin-bottom: 12px;
  padding-left: 20px;
}

.help-section__content li {
  margin-bottom: 8px;
}

.help-guide {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
}

.help-guide__item {
  display: flex;
  gap: 16px;
  padding: 20px;
  background-color: var(--card-background);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  transition: all 0.3s ease;
}

.help-guide__item:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: var(--primary-color);
}

.help-guide__icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: var(--primary-color);
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 24px;
  flex-shrink: 0;
}

.help-guide__content h4 {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 8px 0;
}

.help-guide__content p {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
}

.help-contact {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}

.help-contact__item {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 16px 24px;
  background-color: var(--card-background);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  min-width: 200px;
}

.help-contact__item i {
  font-size: 24px;
  color: var(--primary-color);
}

.help-contact__item h4 {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 4px 0;
}

.help-contact__item p {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
}

/* 折叠面板样式 */
.help-section :deep(.el-collapse) {
  border: 1px solid var(--border-color);
  border-radius: 12px;
  overflow: hidden;
}

.help-section :deep(.el-collapse-item__header) {
  background-color: var(--card-background);
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-color);
}

.help-section :deep(.el-collapse-item__header.is-active) {
  background-color: var(--card-background);
  color: var(--primary-color);
}

.help-section :deep(.el-collapse-item__content) {
  background-color: var(--card-background);
  color: var(--text-secondary);
  border-bottom: 1px solid var(--border-color);
}

.help-section :deep(.el-collapse-item:last-child .el-collapse-item__content) {
  border-bottom: none;
}

.help-section :deep(.el-collapse-item__arrow) {
  color: var(--text-muted);
}

.help-section :deep(.el-collapse-item__header.is-active .el-collapse-item__arrow) {
  color: var(--primary-color);
}
</style>
