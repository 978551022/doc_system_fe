import { createRouter, createWebHistory } from 'vue-router'
import { isLoggedIn } from '../utils/userStore.js'

const routes = [
  {
    path: '/',
    redirect: '/chat'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/LoginPage.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/RegisterPage.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/chat',
    name: 'Chat',
    component: () => import('../views/ChatPage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/documents',
    name: 'Documents',
    component: () => import('../views/DocumentsPage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/canvas',
    name: 'Canvas',
    component: () => import('../views/CanvasWorkflow.vue'),
    meta: { requiresAuth: true }
  },
  // ==================== 知识图谱路由 ====================
  {
    path: '/knowledge-graph',
    name: 'KnowledgeGraph',
    component: () => import('../views/KnowledgeGraphPage.vue'),
    meta: { requiresAuth: true },
    redirect: '/knowledge-graph/overview',
    children: [
      {
        path: 'overview',
        name: 'KGOverview',
        component: () => import('../views/knowledgeGraph/OverviewPage.vue'),
        meta: { title: '概览仪表盘' }
      },
      {
        path: 'visualization',
        name: 'KGVisualization',
        component: () => import('../views/knowledgeGraph/VisualizationPage.vue'),
        meta: { title: '图谱可视化' }
      },
      {
        path: 'entities',
        name: 'KGEntities',
        component: () => import('../views/knowledgeGraph/EntitiesPage.vue'),
        meta: { title: '实体管理' }
      },
      {
        path: 'relations',
        name: 'KGRelations',
        component: () => import('../views/knowledgeGraph/RelationsPage.vue'),
        meta: { title: '关系管理' }
      },
      {
        path: 'document-build',
        name: 'KGDocumentBuild',
        component: () => import('../views/knowledgeGraph/DocumentBuildPage.vue'),
        meta: { title: '文档构建' }
      },
      {
        path: 'inference',
        name: 'KGInference',
        component: () => import('../views/knowledgeGraph/InferencePage.vue'),
        meta: { title: '推理分析' }
      },
      {
        path: 'disambiguation',
        name: 'KGDisambiguation',
        component: () => import('../views/knowledgeGraph/DisambiguationPage.vue'),
        meta: { title: '消歧处理' }
      },
      {
        path: 'settings',
        name: 'KGSettings',
        component: () => import('../views/knowledgeGraph/SettingsPage.vue'),
        meta: { title: '设置' }
      }
    ]
  },
  // =====================================================
  {
    path: '/api-test',
    name: 'ApiTest',
    component: () => import('../views/ApiTestPage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/history',
    name: 'History',
    component: () => import('../views/HistoryPage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('../views/SettingsPage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/help',
    name: 'Help',
    component: () => import('../views/HelpPage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/about',
    name: 'About',
    component: () => import('../views/AboutPage.vue'),
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const loggedIn = isLoggedIn()

  if (to.meta.requiresAuth && !loggedIn) {
    next({
      path: '/login',
      query: { redirect: to.fullPath }
    })
  } else if ((to.path === '/login' || to.path === '/register') && loggedIn) {
    next('/chat')
  } else {
    next()
  }
})

export default router
