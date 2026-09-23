import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // GitHub Pages 项目页部署在 https://<用户名>.github.io/<仓库名>/ 子路径下，
  // 资源引用必须带上该前缀，否则会 404 白屏。
  base: '/xiaoce/',
  plugins: [react()],
  server: {
    port: 5173,
  },
})