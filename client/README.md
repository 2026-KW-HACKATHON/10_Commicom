# 잇다 client

React + Vite + TypeScript, Tailwind v4, React Query, Zustand, axios, react-kakao-maps-sdk

## 실행

```bash
cd client
cp .env.example .env   # VITE_KAKAO_MAP_KEY 입력
npm install
npm run dev            # http://localhost:5173
```

- `/api/*` 요청은 dev 서버가 `http://localhost:8080`(Spring Boot)으로 프록시합니다.
- 서버 없이 화면만 볼 때는 `.env`에 `VITE_USE_MOCK=true`를 넣습니다.
- 카카오 developers 앱의 플랫폼 > Web에 `http://localhost:5173`을 등록해야 지도가 뜹니다.

## 폴더

```
src/
├── app/        # router, Provider, 공통 레이아웃(상단 바 + 하단 3탭)
├── pages/      # 라우트 단위 화면 (features 조합만)
├── features/   # 담당자별 기능 (api.ts, hooks.ts, schema.ts, components/)
│   └── map/    # 잇다 맵
├── shared/     # api(axios + 공통 응답 처리), ui, lib
├── stores/     # Zustand (authStore)
├── assets/     # 비둘기, 아이콘, 로고
└── styles/     # Tailwind + 디자인 토큰
```

API 응답은 `{ isSuccess, code, message, result }` 형식이에요. `shared/api/client.ts`의 `request()`로 감싸면 `result`만 받아요. 실패하면 `ApiError(code, message)`를 던져요.
