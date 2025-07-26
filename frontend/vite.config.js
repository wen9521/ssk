// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path' // 引入 Node.js 的 path 模块

export default defineConfig({
  plugins: [react()],
  
  base: "./", 

  build: {
    outDir: 'build'
  },

  // 使用 path.resolve 来创建更健壮的路径别名
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.jsx?$/,
    exclude: [],
  },
})