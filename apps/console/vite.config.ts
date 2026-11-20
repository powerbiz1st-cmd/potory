import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: './', // GitHub Pages 하위 경로에서도 동작
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // 모양 이름 등은 Shop과 같은 정의를 씀
      '@shop': path.resolve(__dirname, '../shop/src'),
    },
    dedupe: ['react', 'react-dom'],
  },
  server: {
    watch: { usePolling: true },
    fs: { allow: ['..'] },
  },
})
