// frontend/vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // 'base' 选项确保所有资源都使用相对路径加载
  base: "./",
  // 'build.outDir' 告诉Vite将构建结果输出到 'build' 文件夹
  build: {
    outDir: 'build'
  }
})