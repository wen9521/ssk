// frontend/vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  // **核心修正：指定项目根目录**
  // 默认情况下，Vite 会在 vite.config.js 所在的目录寻找 index.html
  // 如果你的 index.html 在 public 目录下，而 vite.config.js 在 frontend 目录下
  // 我们需要告诉 Vite 项目的根是当前目录。
  root: process.cwd(),
  
  // **指定 public 文件夹的位置**
  publicDir: 'public',

  plugins: [react()],

  // 确保资源路径正确
  base: "./",

  build: {
    // 构建输出目录
    outDir: 'build',
    // 确保 index.html 是构建入口
    rollupOptions: {
      input: path.resolve(process.cwd(), 'index.html')
    }
  },

  resolve: {
    // 设置别名，方便导入
    alias: {
      '@': path.resolve(process.cwd(), 'src'),
    },
  },
});