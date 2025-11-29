<template>
  <div class="about-page">
    <el-card class="about-card">
      <template #header>
        <h2>关于</h2>
      </template>
      
      <div class="about-content">
        <!-- 系统信息 -->
        <section class="about-section">
          <div class="about-logo">
            <i class="el-icon-folder-opened"></i>
          </div>
          <h3 class="about-title">个人文档系统</h3>
          <p class="about-version">版本 1.0.0</p>
          <p class="about-description">
            一个基于Vue3的个人文档管理系统，集成了智能对话和API接口测试功能，
            帮助您更高效地管理文档、获取信息和测试API。
          </p>
        </section>
        
        <!-- 技术栈 -->
        <section class="about-section">
          <h4 class="about-section__title">技术栈</h4>
          <div class="about-tech-stack">
            <el-tag v-for="tech in techStack" :key="tech.name" type="primary" effect="light">
              {{ tech.name }}
            </el-tag>
          </div>
        </section>
        
        <!-- 功能特性 -->
        <section class="about-section">
          <h4 class="about-section__title">功能特性</h4>
          <div class="about-features">
            <div class="about-feature">
              <i class="el-icon-chat-dot-round"></i>
              <span>智能对话</span>
            </div>
            <div class="about-feature">
              <i class="el-icon-document-copy"></i>
              <span>文档管理</span>
            </div>
            <div class="about-feature">
              <i class="el-icon-s-cooperation"></i>
              <span>API测试</span>
            </div>
            <div class="about-feature">
              <i class="el-icon-time"></i>
              <span>历史记录</span>
            </div>
            <div class="about-feature">
              <i class="el-icon-setting"></i>
              <span>个性化设置</span>
            </div>
            <div class="about-feature">
              <i class="el-icon-mobile"></i>
              <span>响应式设计</span>
            </div>
          </div>
        </section>
        
        <!-- 版权信息 -->
        <section class="about-section">
          <h4 class="about-section__title">版权信息</h4>
          <div class="about-copyright">
            <p>© 2024 个人文档系统 | 版权所有</p>
            <p>本系统采用 MIT 开源协议</p>
          </div>
        </section>
        
        <!-- 联系方式 -->
        <section class="about-section">
          <h4 class="about-section__title">联系方式</h4>
          <div class="about-contact">
            <div class="about-contact__item">
              <i class="el-icon-email"></i>
              <span>contact@example.com</span>
            </div>
            <div class="about-contact__item">
              <i class="el-icon-chat-line-round"></i>
              <span>反馈建议</span>
            </div>
            <div class="about-contact__item">
              <i class="el-icon-star-on"></i>
              <span>给个好评</span>
            </div>
          </div>
        </section>
      </div>
    </el-card>
  </div>
</template>

<script setup>
// 技术栈
const techStack = [
  { name: 'Vue 3' },
  { name: 'Element Plus' },
  { name: 'Vue Router' },
  { name: 'Axios' },
  { name: 'Vite' },
  { name: 'JavaScript' },
  { name: 'CSS3' },
  { name: 'HTML5' }
]
</script>

<style scoped>
.about-page {
  width: 100%;
  height: 100%;
}

.about-card {
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.about-card :deep(.el-card__header) {
  border-bottom: 1px solid #ebeef5;
  padding: 16px 20px;
}

.about-card :deep(.el-card__header) h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.about-content {
  flex: 1;
  overflow-y: auto;
  padding: 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.about-section {
  margin-bottom: 32px;
  width: 100%;
  max-width: 600px;
}

.about-logo {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 64px;
  margin: 0 auto 24px;
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3);
}

.about-title {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.about-version {
  font-size: 16px;
  color: #667eea;
  margin-bottom: 16px;
  font-weight: 500;
}

.about-description {
  font-size: 16px;
  color: #606266;
  line-height: 1.6;
  margin-bottom: 32px;
}

.about-section__title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 16px;
  text-align: center;
}

.about-tech-stack {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
  margin-bottom: 24px;
}

.about-tech-stack :deep(.el-tag) {
  font-size: 14px;
  padding: 6px 12px;
  border-radius: 20px;
}

.about-features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.about-feature {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px;
  background-color: #f8f9fa;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.about-feature:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.about-feature i {
  font-size: 24px;
  color: #667eea;
}

.about-feature span {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

.about-copyright {
  color: #909399;
  line-height: 1.6;
  margin-bottom: 24px;
}

.about-copyright p {
  margin-bottom: 8px;
}

.about-contact {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
  justify-content: center;
}

.about-contact__item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #606266;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.about-contact__item:hover {
  color: #667eea;
}

.about-contact__item i {
  font-size: 18px;
}
</style>
