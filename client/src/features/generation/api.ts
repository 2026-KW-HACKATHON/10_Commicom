import { removeMockShortform } from '@/features/feed/mock'
import { MOCK_ONLY, USE_MOCK } from '@/mocks/db'
import { api, request } from '@/shared/api/client'
import { mockExtractMenus, mockGenerationApi, mockShortformApi } from './mock'
import type { GenerationCreated, GenerationRequest, GenerationState, MenuItem, ShortformDetail } from './schema'

/**
 * 화면에서 고른 메뉴·어필·수정 요청 → 서버 menuInfo 한 덩어리 (서버는 storeId + menuInfo만 받음)
 * 예) "메뉴: 아메리카노 2,500원, 크로플 4,500원\n가게 어필: 공강에 쉬어 가요\n수정 요청(영상): 음식 장면을 길게"
 */
function toMenuInfo(body: GenerationRequest) {
  const lines: string[] = []
  const menus = (body.menus ?? []).filter((m) => m.name.trim())
  if (menus.length) lines.push(`메뉴: ${menus.map((m) => (m.price ? `${m.name} ${m.price.toLocaleString()}원` : m.name)).join(', ')}`)
  if (body.appeal?.trim()) lines.push(`가게 어필: ${body.appeal.trim()}`)
  if (body.mapUrl?.trim()) lines.push(`지도 링크: ${body.mapUrl.trim()}`)
  if (body.revision) lines.push(`수정 요청(${body.revision.target === 'VIDEO' ? '영상' : '대본·자막'}): ${body.revision.request}`)
  return lines.join('\n') || undefined
}

/** POST /api/generation { storeId, menuInfo } */
export function postGeneration(body: GenerationRequest): Promise<GenerationCreated> {
  if (USE_MOCK) return mockGenerationApi.create(body)
  return request(api.post('/api/generation', { storeId: body.storeId, menuInfo: toMenuInfo(body) }))
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

/** OCR 결과 한 줄 "아메리카노 2,500원" / "치즈떡볶이 - 7000" → { name, price } */
function parseMenuLine(line: string): MenuItem | null {
  const text = line.replace(/^[\s\-•·*\d.)]+/, '').trim()
  if (!text) return null
  const m = text.match(/^(.*?)[\s:：\-–]*([\d,]{3,})\s*원?\s*$/)
  if (m && m[1].trim()) return { name: m[1].trim(), price: Number(m[2].replace(/,/g, '')) }
  return { name: text, price: null }
}

/**
 * 메뉴판 사진에서 메뉴 읽기 — POST /api/ocr (multipart image) → { menuText }.
 * 사진마다 요청해 줄 단위로 메뉴·가격을 나눔. 지도 링크만 있으면 읽을 API가 없어 직접 입력.
 */
export async function extractMenus(storeId: number, files: File[], _mapUrl: string): Promise<MenuItem[]> {
  if (USE_MOCK) return mockExtractMenus(storeId)
  const menus: MenuItem[] = []
  for (const file of files) {
    const form = new FormData()
    form.append('image', file)
    const { menuText } = await request<{ menuText: string }>(api.post('/api/ocr', form, { timeout: 60_000 }))
    menuText.split('\n').forEach((line) => {
      const item = parseMenuLine(line)
      if (item) menus.push(item)
    })
  }
  return menus
}

/**
 * 업로드(손님 피드에 공개). 명세상 생성 완료 = 바로 공개라 서버에선 할 일 없음.
 * TODO: "확인 후 공개"가 필요하면 서버와 공개 API를 정해야 함
 */
export async function publishShortform(shortformId: number) {
  if (USE_MOCK) return mockShortformApi.publish(shortformId)
}

/**
 * 이미 올린 영상을 재수정한 새 버전으로 바꾸기 (PRO).
 * TODO: 명세에 없음 (임시: PUT /api/shortforms/{oldId}/replace). 그전까지 서버 연동 중엔 옛 영상을 이 기기에서 숨김
 */
export async function replaceShortform(oldId: number, newId: number) {
  if (USE_MOCK) return mockShortformApi.replace(oldId, newId)
  if (MOCK_ONLY.shortformManage) return removeMockShortform(oldId)
  return request(api.put(`/api/shortforms/${oldId}/replace`, { shortformId: newId }))
}

/** 만든 영상 지우기. TODO: 명세에 삭제 API 없음 — 그전까지 서버 연동 중엔 이 기기에서 숨김 */
export async function deleteShortform(shortformId: number) {
  if (USE_MOCK) return mockShortformApi.remove(shortformId)
  if (MOCK_ONLY.shortformManage) return removeMockShortform(shortformId)
  return request(api.delete(`/api/shortforms/${shortformId}`))
}
