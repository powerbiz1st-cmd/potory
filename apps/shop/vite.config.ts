import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: './', // GitHub Pages 하위 경로에서도 동작하도록 상대 경로로 빌드
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: {
    watch: { usePolling: true }, // Docker + Windows 볼륨에서 파일 변경 감지
    // Docker 안 감시 컨테이너(watchdog)가 http://shop:포트 로 접속하는 걸 허용
    allowedHosts: ['shop', 'localhost'],
  },
})
