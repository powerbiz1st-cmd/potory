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
      // Shop과 같은 디자인 타입·화분 그림을 그대로 씀 (가격표·모양이 어긋나지 않게)
      '@shop': path.resolve(__dirname, '../shop/src'),
    },
    dedupe: ['react', 'react-dom'],
  },
  server: {
    watch: { usePolling: true },
    // Docker 안 감시 컨테이너(watchdog)가 http://admin:포트 로 접속하는 걸 허용
    allowedHosts: ['admin', 'localhost'],
    fs: { allow: ['..'] },
  },
})
