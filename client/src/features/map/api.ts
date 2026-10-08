import { mockStoreExtras, USE_MOCK } from '@/mocks/db'
import { api, ApiError, request } from '@/shared/api/client'
import { MOCK_STORE_DETAILS, MOCK_STORES } from './mock'
import type { StoreDetail, StoreListResult } from './schema'

/** GET /api/stores (questOnly: 지도 5-1 확장 쿼리) */
export async function fetchStores(questOnly = false): Promise<StoreListResult> {
  if (USE_MOCK) {
    const stores = MOCK_STORES.map((s) => ({ ...s, ...mockStoreExtras(s.storeId) })).filter(
      (s) => !questOnly || s.isQuestStore,
    )
    return { count: stores.length, stores }
  }
  return request(api.get('/api/stores', { params: questOnly ? { questOnly: true } : undefined }))
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
  return request(api.get(`/api/stores/${storeId}`))
}
