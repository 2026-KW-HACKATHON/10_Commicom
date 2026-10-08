import { USE_MOCK } from '@/mocks/db'
import { api, request } from '@/shared/api/client'
import { MOCK_SHORTFORMS } from './mock'
import type { ShortformListResult } from './schema'

/**
 * 숏폼 피드. TODO: 숏폼 담당과 경로·필드 확정 (임시: GET /api/shortforms?storeId=)
 */
export async function fetchShortforms(storeId?: number): Promise<ShortformListResult> {
  if (USE_MOCK) {
    // 특정 가게에서 들어오면 그 가게 영상을 맨 앞에
    const list = storeId
      ? [...MOCK_SHORTFORMS].sort((a, b) => Number(b.storeId === storeId) - Number(a.storeId === storeId))
      : MOCK_SHORTFORMS
    return { shortforms: list }
  }
  return request(api.get('/api/shortforms', { params: storeId ? { storeId } : undefined }))
}
