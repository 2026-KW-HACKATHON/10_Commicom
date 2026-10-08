import { USE_MOCK } from '@/mocks/db'
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
  if (body.revision) lines.push(`수정 요청(${body.revision.target === 'VIDEO' ? '사진' : '글·문구'}): ${body.revision.request}`)
  return lines.join('\n') || undefined
}

/** 게시물 한 개의 사장님 사진은 4장까지 (AI 사진과 합쳐 5장) */
export const MAX_POST_PHOTOS = 4

/** POST /api/stores/{storeId}/photos (multipart photos) — 게시물에 넣을 사진을 올리고 주소를 받음 (사장님 본인 가게만) */
export function uploadStorePhotos(storeId: number, files: File[]): Promise<string[]> {
  const form = new FormData()
  files.forEach((f) => form.append('photos', f))
  return request(api.post(`/api/stores/${storeId}/photos`, form, { timeout: 60_000 }))
}

/** POST /api/generation { storeId, menuInfo, photoUrls } — 사장님 사진은 먼저 올리고 주소로 보냄 */
export async function postGeneration(body: GenerationRequest): Promise<GenerationCreated> {
  const photos = (body.photos ?? []).slice(0, MAX_POST_PHOTOS)
  if (USE_MOCK) {
    // 목업: 올리지 않고 이 기기에서만 보이는 주소로
    return mockGenerationApi.create({ ...body, photoUrls: body.photoUrls ?? photos.map((f) => URL.createObjectURL(f)) })
  }
  const photoUrls = photos.length ? await uploadStorePhotos(body.storeId, photos) : (body.photoUrls ?? [])
  return request(api.post('/api/generation', { storeId: body.storeId, menuInfo: toMenuInfo(body), photoUrls: photoUrls.slice(0, MAX_POST_PHOTOS) }))
}

/** GET /api/generation/{generationId} — COMPLETED/FAILED 될 때까지 폴링 */
export function fetchGeneration(generationId: number): Promise<GenerationState> {
  if (USE_MOCK) return mockGenerationApi.get(generationId)
  return request(api.get(`/api/generation/${generationId}`))
}

/** POST /api/generation/{id}/cancel — 만드는 중이면 결과를 저장하지 않고 끝냄 (이미 끝났으면 GENERATION409_2, 화면은 그냥 나감) */
export async function cancelGeneration(generationId: number) {
  if (USE_MOCK) return mockGenerationApi.cancel(generationId)
  await request(api.post(`/api/generation/${generationId}/cancel`)).catch(() => undefined)
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

/** POST /api/shortforms/{id}/publish — 업로드(손님 피드에 공개). AI로 만든 게시물은 비공개로 생김 */
export async function publishShortform(shortformId: number) {
  if (USE_MOCK) return mockShortformApi.publish(shortformId)
  await request(api.post(`/api/shortforms/${shortformId}/publish`))
}

/** PUT /api/shortforms/{oldId}/replace — 올린 게시물을 재수정한 새 버전으로 바꾸기 (PRO). 새 버전 공개 + 옛 게시물 삭제 */
export async function replaceShortform(oldId: number, newId: number) {
  if (USE_MOCK) return mockShortformApi.replace(oldId, newId)
  return request(api.put(`/api/shortforms/${oldId}/replace`, { shortformId: newId }))
}

/** DELETE /api/shortforms/{id} — 만든(아직 안 올린) 게시물 지우기 */
export async function deleteShortform(shortformId: number) {
  if (USE_MOCK) return mockShortformApi.remove(shortformId)
  return request(api.delete(`/api/shortforms/${shortformId}`))
}
