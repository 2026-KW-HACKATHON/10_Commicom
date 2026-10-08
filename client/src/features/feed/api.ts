import { useProStore } from '@/features/pro/store'
import { MOCK_OWNER_STORE_ID, USE_MOCK } from '@/mocks/db'
import { api, request } from '@/shared/api/client'
import { allMockShortforms, removeMockShortform } from './mock'
import { FEED_PAGE_SIZE, type Shortform, type ShortformListResult } from './schema'

/** 목업: PRO 구독 중인 가게. PRO는 아직 기기 저장이라 이 기기의 사장님 가게만 해당 */
function mockProStoreIds() {
  const { expiresAt } = useProStore.getState()
  return new Set(expiresAt && Date.parse(expiresAt) > Date.now() ? [MOCK_OWNER_STORE_ID] : [])
}

/** 목업 목록을 명세 페이지 형식으로 자르기 */
function pageOf(list: Shortform[], page: number, size: number): ShortformListResult {
  return { totalCount: list.length, page, size, hasNext: (page + 1) * size < list.length, shortforms: list.slice(page * size, (page + 1) * size) }
}

/**
 * GET /api/shortforms?storeId&page&size — 숏폼 피드 (페이지 단위)
 * TODO: 숏폼 담당과 필드 확정 (명세엔 menus·description·address 등 화면용 필드가 아직 없음)
 */
export async function fetchShortforms(storeId?: number, page = 0, size = FEED_PAGE_SIZE): Promise<ShortformListResult> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, page > 0 ? 500 : 0))
    // PRO 혜택 "숏폼 우선 노출": PRO 가게 영상을 앞으로 (서버에선 숏폼 담당이 PRO 가중치로 정렬)
    const pro = mockProStoreIds()
    const all = allMockShortforms().map((s) => (pro.has(s.storeId) ? { ...s, promoted: true } : s))
    const rank = (s: Shortform) => (storeId ? Number(s.storeId === storeId) * 2 : 0) + Number(!!s.promoted)
    // 특정 가게에서 들어오면 그 가게 영상이 가장 앞, 그다음 PRO 가게 (같은 순위끼리는 원래 순서 유지)
    return pageOf([...all].sort((a, b) => rank(b) - rank(a)), page, size)
  }
  return request(api.get('/api/shortforms', { params: { ...(storeId ? { storeId } : {}), page, size } }))
}

/** 내 가게 영상만 (사장님 "내 영상"·가게 프로필). 한 가게 영상은 많지 않아 한 번에 받음 */
export async function fetchStoreShortforms(storeId: number): Promise<ShortformListResult> {
  if (USE_MOCK) return pageOf(allMockShortforms().filter((s) => s.storeId === storeId), 0, 100)
  return request(api.get('/api/shortforms', { params: { storeId, page: 0, size: 100 } }))
}

/** 올린 영상 지우기. TODO: 명세에 삭제 API 없음 — 서버와 정해야 함 (임시: DELETE /api/shortforms/{id}) */
export async function deleteStoreShortform(shortformId: number) {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 300))
    return removeMockShortform(shortformId)
  }
  return request(api.delete(`/api/shortforms/${shortformId}`))
}
