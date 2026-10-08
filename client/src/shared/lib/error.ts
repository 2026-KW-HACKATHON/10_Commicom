import { ApiError } from '@/shared/api/client'

/** 화면에 보여줄 에러 문구 — 서버 message 우선 */
export function errorMessage(error: unknown, fallback = '잠시 후 다시 시도해 주세요') {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error && error.message) return error.message
  return fallback
}

export function errorCode(error: unknown) {
  return error instanceof ApiError ? error.code : null
}
