/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_KAKAO_MAP_KEY?: string
  readonly VITE_API_BASE_URL?: string
  readonly VITE_USE_MOCK?: string
  readonly VITE_QUEST_GPS_BYPASS?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
