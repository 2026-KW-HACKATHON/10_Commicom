/**
 * Vercel 함수: 화면의 /api/* 요청을 팀 배포 서버로 넘김 (vercel.json 이 /api/:path* → /api/proxy?path=... 로 보냄).
 * 브라우저가 붙이는 Origin 헤더를 빼서 서버 CORS 설정과 상관없이 동작 — 개발 서버(vite) 프록시와 같은 방식.
 * Vercel 함수 요청 본문은 4.5MB 까지라 그보다 큰 사진 업로드는 안 됨
 */
const TARGET = process.env.API_PROXY_TARGET || 'http://15.164.102.84:8080'

/** 서버로 넘기지 않을 요청 헤더 */
const DROP_REQUEST = ['origin', 'referer', 'host', 'connection', 'content-length', 'x-forwarded-host']
/** fetch 가 이미 풀어 둔 응답이라 그대로 넘기면 깨지는 헤더 */
const DROP_RESPONSE = ['content-encoding', 'content-length', 'transfer-encoding', 'connection']

async function handler(request) {
  const url = new URL(request.url)
  const path = url.searchParams.get('path') ?? ''
  url.searchParams.delete('path')
  const query = url.searchParams.toString()

  const headers = new Headers(request.headers)
  DROP_REQUEST.forEach((h) => headers.delete(h))
  const hasBody = request.method !== 'GET' && request.method !== 'HEAD'

  const res = await fetch(`${TARGET}/api/${path}${query ? `?${query}` : ''}`, {
    method: request.method,
    headers,
    body: hasBody ? await request.arrayBuffer() : undefined,
    redirect: 'manual',
  })
  const out = new Headers(res.headers)
  DROP_RESPONSE.forEach((h) => out.delete(h))
  return new Response(res.body, { status: res.status, headers: out })
}

export { handler as GET, handler as POST, handler as PUT, handler as PATCH, handler as DELETE }
