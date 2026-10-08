import { mockStoreExtras, USE_MOCK } from '@/mocks/db'
import { api, request } from '@/shared/api/client'
import { MOCK_STORES } from './mock'
import type { StoreListResult } from './schema'

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
