// frontend/vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "./", // 确保打包后的路径是相对路径，对Cloudflare Pages很重要
  build: {
    outDir: 'build' // 输出目录保持和create-react-app一致
  }
})