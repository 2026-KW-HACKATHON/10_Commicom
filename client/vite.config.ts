import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    // 팀원 공유용 cloudflared 임시 터널 주소 허용
    allowedHosts: ['.trycloudflare.com'],
    // 로컬 Spring Boot로 프록시 → CORS 설정 없이 개발
    proxy: { '/api': 'http://localhost:8080' },
  },
  // 팀원 공유는 개발 서버 대신 빌드본(vite preview)으로 — 터널로 수백 개 모듈을 받다 끊기는 문제 방지
  preview: {
    allowedHosts: ['.trycloudflare.com'],
    proxy: { '/api': 'http://localhost:8080' },
  },
})
