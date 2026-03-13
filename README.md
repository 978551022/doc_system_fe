# 个人文档系统 (Personal Doc System)

> 一个基于现代前端技术栈构建的智能文档管理系统，集成AI对话、文档管理、API测试等功能

[![Vue 3](https://img.shields.io/badge/Vue-3.5-42b883)](https://vuejs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646cff)](https://vitejs.dev/)
[![Element Plus](https://img.shields.io/badge/Element_Plus-2.11-409eff)](https://element-plus.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## ✨ 功能亮点

### 🤖 智能对话
- **流式输出**：AI响应逐字渲染，体验流畅
- **Markdown渲染**：支持代码高亮、表格、列表等富文本
- **深度推理**：可折叠展示AI的思考过程
- **多模型切换**：支持 DeepSeek、GLM、Qwen、Doubao、Llama 等多种AI模型
- **联网搜索**：可选开启在线搜索功能，增强AI回答能力
- **文件上传**：支持上传文档作为对话上下文（支持 .doc, .docx, .pdf, .txt，最大500MB）
- **优化交互**：
  - 精美的开关控件，支持深色/浅色主题自适应
  - 实时状态指示，操作反馈清晰
  - 会话历史持久化存储

### 📁 文档管理
- 文档上传与处理状态追踪
- 文档列表预览与管理
- 支持多种文档格式

### 🔧 API测试
- OpenAPI文档导入
- 动态生成测试界面
- 支持多种HTTP方法
- 响应结果格式化展示

### 🎨 界面特性
- **主题切换**：浅色/深色/跟随系统，使用 CSS 变量实现
- **响应式设计**：适配桌面和移动设备
- **会话管理**：历史对话记录与搜索，支持本地持久化
- **性能优化**：
  - 组件代码优化，消除冗余逻辑
  - localStorage 操作高效管理
  - 样式复用，减少代码重复

## 🛠️ 技术栈

| 技术 | 说明 |
|------|------|
| Vue 3 | 渐进式前端框架，使用Composition API |
| Element Plus | Vue 3 组件库，提供丰富的UI组件 |
| Vue Router 4 | 路由管理，支持嵌套路由和导航守卫 |
| Axios | HTTP客户端，支持请求拦截和响应处理 |
| Vite | 下一代前端构建工具，极速开发体验 |
| marked | Markdown解析器，支持GFM（GitHub Flavored Markdown） |
| highlight.js | 代码语法高亮，支持180+种编程语言 |

## 🎬 最近更新

### v1.1.0 (2026-03)
- ✨ **聊天输入组件优化**：
  - 重构开关控件样式，支持自适应主题
  - 优化 localStorage 配置管理，提升性能
  - 消除代码重复，减少150+行冗余CSS
  - 改进视觉反馈，开启状态更明显
- 🐛 **Bug修复**：
  - 修复 prop 默认值未生效问题
  - 修复 localStorage 双重写入问题
  - 移除未使用的导入和变量
- 🎨 **样式优化**：
  - 开关控件使用紫色主题色
  - 深色/浅色模式完美适配
  - Hover 效果优化，交互更流畅

## 📦 快速开始

```bash
# 克隆项目
git clone <repository-url>

# 进入项目目录
cd doc_system_fe

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

访问 http://localhost:5173

```bash
# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

## 📁 项目结构

```
doc_system_fe/
├── src/
│   ├── api/              # API接口封装
│   │   ├── document.js           # 文档管理接口
│   │   └── intelligentSearch.js  # 智能搜索接口
│   ├── components/       # 公共组件
│   │   ├── ChatInput.vue         # 聊天输入组件
│   │   ├── Header.vue            # 顶部导航
│   │   ├── Sidebar.vue           # 侧边栏菜单
│   │   └── ...
│   ├── utils/            # 工具函数
│   │   └── userStore.js          # 用户状态管理
│   ├── views/            # 页面组件
│   │   ├── ChatPage.vue          # 智能对话页面
│   │   ├── DocumentsPage.vue     # 文档管理页面
│   │   ├── ApiTestPage.vue       # API测试页面
│   │   ├── HistoryPage.vue       # 历史记录页面
│   │   ├── SettingsPage.vue      # 设置页面
│   │   └── LoginPage.vue         # 登录页面
│   ├── router/           # 路由配置
│   ├── App.vue           # 根组件
│   └── main.js           # 入口文件
├── public/               # 静态资源
├── index.html            # HTML模板
├── vite.config.js        # Vite配置
└── package.json          # 项目配置
```

## 🔑 核心功能说明

### 流式输出实现

智能对话采用SSE（Server-Sent Events）实现流式输出：

1. **逐字渲染**：接收chunk时立即累加显示，提供流畅的打字效果
2. **内容解析**：自动分离推理过程（`<推理过程>`）和最终答案（`<最终答案>`）
3. **Markdown处理**：渲染完成时自动解析Markdown并高亮代码块
4. **状态管理**：支持思考中/已完成状态展示

### 主题系统

使用CSS变量实现主题切换，主要变量定义在 `App.vue`：

- `--primary-color` - 主题色
- `--bg-color` / `--surface-color` - 背景色
- `--text-primary` / `--text-secondary` - 文字颜色

### 路由配置

| 路径 | 组件 | 说明 |
|------|------|------|
| / | - | 重定向到聊天页面 |
| /chat | ChatPage | 智能对话 |
| /documents | DocumentsPage | 文档管理 |
| /api-test | ApiTestPage | API测试 |
| /history | HistoryPage | 历史记录 |
| /settings | SettingsPage | 系统设置 |
| /help | HelpPage | 帮助中心 |
| /about | AboutPage | 关于系统 |

## 🚀 部署

```bash
# 构建
npm run build

# 将 dist 目录部署到静态服务器
# 例如 Nginx:
cp -r dist/* /usr/share/nginx/html/
```

## 📝 开发规范

- 使用 Vue 3 Composition API
- 组件命名采用 PascalCase
- 提交遵循 Conventional Commits 规范
- 避免使用 `v-html`，注意 XSS 防护

## 🌐 浏览器兼容性

- Chrome >= 90
- Firefox >= 88
- Safari >= 14
- Edge >= 90

## 📄 许可证

MIT License

---

如有问题或建议，欢迎提交 Issue 或 Pull Request。
