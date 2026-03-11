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

        <!-- 当前用户信息（头像 + 基本资料） -->
        <section class="about-section about-user-section">
          <h4 class="about-section__title">当前登录用户</h4>
          <div class="about-user">
            <el-avatar
              :size="72"
              :src="userState.avatar"
              class="about-user__avatar"
            >
              <i v-if="!userState.avatar" class="el-icon-user-solid"></i>
            </el-avatar>
            <div class="about-user__info">
              <div class="about-user__name">{{ userState.username }}</div>
              <div class="about-user__email">{{ userState.email || '未设置邮箱' }}</div>
            </div>
          </div>
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
import userState from '../utils/userStore.js'

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
  background-color: var(--background-color);
  padding: 20px;
}

.about-card {
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background-color: var(--card-background);
  border-color: var(--border-color);
}

.about-card :deep(.el-card__header) {
  border-bottom: 1px solid var(--border-color);
  padding: 16px 20px;
  background-color: var(--card-header-background);
}

.about-card :deep(.el-card__header) h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
}

.about-card :deep(.el-card__body) {
  flex: 1;
  overflow-y: auto;
  background-color: var(--background-color);
}

.about-content {
  padding: 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.about-section {
  margin-bottom: 28px;
  width: 100%;
  max-width: 500px;
}

.about-logo {
  width: 80px;
  height: 80px;
  border-radius: var(--radius-xl);
  background: var(--primary-gradient);
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 40px;
  margin: 0 auto 20px;
  box-shadow: var(--shadow-lg);
}

.about-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.about-version {
  font-size: 14px;
  color: var(--primary-color);
  margin-bottom: 12px;
  font-weight: 500;
}

.about-description {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 24px;
}

.about-section__title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 14px;
  text-align: center;
}

.about-tech-stack {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  margin-bottom: 20px;
}

.about-tech-stack :deep(.el-tag) {
  font-size: 12px;
  padding: 4px 12px;
  border-radius: var(--radius-xl);
  background-color: var(--surface-color);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
}

.about-features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}

.about-feature {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 14px 10px;
  background-color: var(--card-background);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  transition: var(--transition);
}

.about-feature:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: var(--primary-color);
}

.about-feature i {
  font-size: 20px;
  color: var(--primary-color);
}

.about-feature span {
  font-size: 12px;
  color: var(--text-secondary);
  font-weight: 500;
}

.about-copyright {
  color: var(--text-muted);
  line-height: 1.6;
  margin-bottom: 20px;
  font-size: 12px;
}

.about-copyright p {
  margin-bottom: 4px;
}

.about-contact {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  justify-content: center;
}

.about-contact__item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--text-secondary);
  font-size: 13px;
  cursor: pointer;
  transition: var(--transition);
  padding: 6px 12px;
  border-radius: var(--radius-md);
}

.about-contact__item:hover {
  color: var(--primary-color);
  background-color: var(--surface-color);
}

.about-contact__item i {
  font-size: 16px;
}
</style>
