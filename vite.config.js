import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react({
    // 允许在 .js 文件中使用 JSX
    include: '**/*.{js,jsx,ts,tsx}'
  })],
  root: './',
  // 添加GLB文件到资源包含列表
  assetsInclude: ['**/*.glb'],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        preview: resolve(__dirname, 'preview.html'),
        preview3d: resolve(__dirname, 'preview3d.html'),
        preview3d1: resolve(__dirname, 'preview3d1.html'),
        preview3DCabinet: resolve(__dirname, 'preview3DCabinet.html'),
      }
    }
  },
  server: {
    host: true,
    port: 3001,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8081/api',
        changeOrigin: true
      },
      '/graph': {
        target: 'http://localhost:8081',
        changeOrigin: true
      }
    },
    open: true
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    },
    extensions: ['.js', '.jsx', '.ts', '.tsx']
  },
  publicDir: 'public'
});
