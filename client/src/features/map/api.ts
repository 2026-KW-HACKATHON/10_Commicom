import { mockFor, mockStoreExtras, USE_MOCK } from '@/mocks/db'
import { api, ApiError, request } from '@/shared/api/client'
import { MOCK_STORE_DETAILS, MOCK_STORES, withStoreEdit } from './mock'
import type { StoreDetail, StoreListResult, StoreSummary } from './schema'

/**
 * 서버 가게에 아직 목업인 기능의 값을 덮어씀.
 * - 퀘스트·쿠폰이 목업이면 퀘스트 가게 여부·받을 쿠폰 수도 목업 값으로 (서버 값은 서버 퀘스트·쿠폰 기준이라 안 맞음)
 * - 가게 수정이 목업이면 사장님이 고친 이름·주소·사진
 */
function withMockParts<T extends StoreSummary>(s: T): T {
  const extras = mockStoreExtras(s.storeId)
  const merged = {
    ...s,
    ...(mockFor('quest') ? { isQuestStore: extras.isQuestStore } : {}),
    ...(mockFor('coupon') ? { availableCouponCount: extras.availableCouponCount } : {}),
  }
  return mockFor('storeEdit') ? withStoreEdit(merged) : merged
}

/** GET /api/stores (questOnly: 지도 5-1 확장 쿼리) */
export async function fetchStores(questOnly = false): Promise<StoreListResult> {
  if (USE_MOCK) {
    const stores = MOCK_STORES.map((s) => ({ ...s, ...mockStoreExtras(s.storeId) })).filter(
      (s) => !questOnly || s.isQuestStore,
    )
    return { count: stores.length, stores }
  }
  // 퀘스트가 목업이면 서버의 questOnly 필터 대신 목업 값으로 거름
  const res = await request<StoreListResult>(api.get('/api/stores', { params: questOnly && !mockFor('quest') ? { questOnly: true } : undefined }))
  const stores = res.stores.map(withMockParts).filter((s) => !questOnly || s.isQuestStore)
  return { count: stores.length, stores }
}

/** GET /api/stores/{storeId} */
export async function fetchStoreDetail(storeId: number): Promise<StoreDetail> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 200))
    const s = MOCK_STORES.find((x) => x.storeId === storeId)
    if (!s) throw new ApiError('STORE404', '가게를 찾을 수 없어요')
    const d = MOCK_STORE_DETAILS[storeId] ?? { phone: null, businessHours: '', description: '', elevator: false }
    return {
      storeId: s.storeId,
      name: s.name,
      category: s.category,
      categoryName: s.categoryName,
      address: s.address,
      latitude: s.latitude,
      longitude: s.longitude,
      thumbnailUrl: s.thumbnailUrl,
      phone: d.phone,
      businessHours: d.businessHours,
      description: d.description,
      accessibility: { stepFree: s.stepFree, elevator: d.elevator },
    }
  }
  const detail = await request<StoreDetail>(api.get(`/api/stores/${storeId}`))
  return mockFor('storeEdit') ? withStoreEdit(detail) : detail
}
