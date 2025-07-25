// frontend/vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  base: "./", 
  build: {
    outDir: 'build'
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // --- 核心修复：强制使用更宽容的解析器 ---
  esbuild: {
    loader: 'jsx', // 将所有 .js 文件作为 .jsx 处理
    include: /src/.*.jsx?$/, // 仅应用于 src 目录下的 js 和 jsx 文件
    exclude: [],
  },
})