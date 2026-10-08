import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // VITE_ 가 아닌 값도 읽음 (설정 파일에서만 쓰고 앱 번들에는 안 들어감)
  const env = loadEnv(mode, process.cwd(), '')
  /** 기본 API 서버 — 비우면 로컬 Spring Boot */
  const server = env.API_PROXY_TARGET || 'http://localhost:8080'
  /** 회원 API(/api/members)만 다른 서버로 (예: 배포 서버 연동부터 해 볼 때). 비우면 기본 서버 */
  const memberServer = env.MEMBER_API_TARGET || server
  const to = (target: string) => ({
    target,
    changeOrigin: true,
    // 중계 요청은 같은 주소에서 온 것이라 CORS 검사가 필요 없음 → Origin 헤더를 빼고 넘김.
    // (배포 서버는 Origin이 붙으면 CORS 설정 오류로 500, 로컬 서버는 공유 링크 주소를 허용 안 함)
    configure: (proxy: { on: (event: 'proxyReq', fn: (req: { removeHeader: (name: string) => void }) => void) => void }) =>
      proxy.on('proxyReq', (req) => req.removeHeader('origin')),
  })

  /**
   * 브라우저 → vite(같은 주소) → 서버로 중계: CORS 설정 없이 붙음.
   * 순서 중요: /api/members 를 /api 보다 먼저 둬야 회원 API가 따로 감.
   * Swagger 문서도 중계 — 공유 링크/swagger-ui/index.html
   * (/swagger-ui.html 은 서버가 localhost:8080 주소로 넘겨 버려 공유 링크에선 깨짐)
   */
  const proxy = {
    '/api/members': to(memberServer),
    '/api': to(server),
    '/swagger-ui': to(server),
    '/v3/api-docs': to(server),
  }

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    server: {
      // 팀원 공유용 cloudflared 임시 터널 주소 허용
      allowedHosts: ['.trycloudflare.com'],
      proxy,
    },
    // 팀원 공유는 개발 서버 대신 빌드본(vite preview)으로 — 터널로 수백 개 모듈을 받다 끊기는 문제 방지
    preview: {
      allowedHosts: ['.trycloudflare.com'],
      proxy,
    },
  }
})
