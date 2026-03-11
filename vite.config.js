import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    proxy: {
      // 将 /api 请求代理到后端服务器（后端在8000端口运行）
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
        // 如果需要重写路径，可以配置
        // rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})
