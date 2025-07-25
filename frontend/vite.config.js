// frontend/vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // 确保所有资源在打包后使用相对路径。
  base: "./", 

  // 明确指定构建输出目录
  build: {
    outDir: 'build'
  },

  // 使用 URL 对象来创建路径别名，不再依赖 Node.js 的 'path' 模块
  resolve: {
    alias: {
      '@': new URL('./src', import.meta.url).pathname,
    },
  },

  // 强制使用 JSX 解析器来处理所有 JS/JSX 文件，以解决之前的顽固问题
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.jsx?$/,
    exclude: [],
  },
})
