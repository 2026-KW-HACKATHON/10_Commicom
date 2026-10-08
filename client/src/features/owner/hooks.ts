import { useStores } from '@/features/map/hooks'
import { MOCK_OWNER_STORE_ID } from '@/mocks/db'

/**
 * 로그인한 사장님의 가게 id.
 * TODO: "내 가게" 조회 API(store 담당)가 생기면 교체 — 지금은 목업 가게(2번) 고정.
 */
export function useMyStoreId() {
  return MOCK_OWNER_STORE_ID
}

export function useMyStore() {
  const storeId = useMyStoreId()
  const { data: stores } = useStores()
  return stores?.find((s) => s.storeId === storeId) ?? null
}

export function useMyStoreName() {
  return useMyStore()?.name ?? '내 가게'
}
