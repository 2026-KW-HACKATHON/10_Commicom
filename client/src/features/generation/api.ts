import { USE_MOCK } from '@/mocks/db'
import { api, request } from '@/shared/api/client'
import { mockExtractMenus, mockGenerationApi, mockShortformApi } from './mock'
import type { GenerationCreated, GenerationRequest, GenerationState, MenuItem, ShortformDetail } from './schema'

/** POST /api/generation */
export function postGeneration(body: GenerationRequest): Promise<GenerationCreated> {
  if (USE_MOCK) return mockGenerationApi.create(body)
  return request(api.post('/api/generation', body))
}

/** GET /api/generation/{generationId} — COMPLETED/FAILED 될 때까지 폴링 */
export function fetchGeneration(generationId: number): Promise<GenerationState> {
  if (USE_MOCK) return mockGenerationApi.get(generationId)
  return request(api.get(`/api/generation/${generationId}`))
}

/** 생성 취소. TODO: 명세에 취소 API가 없어 서버에선 폴링만 멈춤 */
export function cancelGeneration(generationId: number) {
  if (USE_MOCK) mockGenerationApi.cancel(generationId)
}

/** GET /api/shortforms/{shortformId} */
export function fetchShortformDetail(shortformId: number): Promise<ShortformDetail> {
  if (USE_MOCK) return mockShortformApi.get(shortformId)
  return request(api.get(`/api/shortforms/${shortformId}`))
}

/**
 * 메뉴판 사진·지도 링크에서 메뉴 읽기.
 * TODO: 명세에 API 없음 (서버 파이프라인엔 OCR 있음) — 서버 연동 전엔 빈 목록으로 직접 입력
 */
export async function extractMenus(storeId: number, _files: File[], _mapUrl: string): Promise<MenuItem[]> {
  if (USE_MOCK) return mockExtractMenus(storeId)
  return []
}

/**
 * 업로드(손님 피드에 공개). TODO: 명세상 생성 완료 = 바로 공개라 별도 API 없음 — 서버와 정해야 함
 */
export async function publishShortform(shortformId: number) {
  if (USE_MOCK) return mockShortformApi.publish(shortformId)
}

/**
 * 이미 올린 영상을 재수정한 새 버전으로 바꾸기 (PRO).
 * TODO: 명세에 없음 — 서버와 정해야 함 (임시: PUT /api/shortforms/{oldId}/replace { shortformId: newId })
 */
export async function replaceShortform(oldId: number, newId: number) {
  if (USE_MOCK) return mockShortformApi.replace(oldId, newId)
  return request(api.put(`/api/shortforms/${oldId}/replace`, { shortformId: newId }))
}

/** 만든 영상 지우기. TODO: 명세에 삭제 API 없음 */
export async function deleteShortform(shortformId: number) {
  if (USE_MOCK) return mockShortformApi.remove(shortformId)
}
