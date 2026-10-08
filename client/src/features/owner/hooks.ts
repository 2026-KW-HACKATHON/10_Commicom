import { useQuery } from '@tanstack/react-query'
import { useStores } from '@/features/map/hooks'
import { mockFor, MOCK_OWNER_STORE_ID, setMockOwnerStoreId } from '@/mocks/db'
import { errorCode } from '@/shared/lib/error'
import { useMe } from '@/stores/authStore'
import { getMyStore } from './api'

/**
 * 로그인한 사장님의 가게 (GET /api/stores/me).
 * 가게 수정이 목업이거나 로그인 전(시연용으로 열어 둔 사장님 화면)이면 부르지 않음.
 */
export function useMyStoreQuery() {
  const me = useMe()
  return useQuery({
    queryKey: ['myStore', me?.memberId],
    queryFn: getMyStore,
    enabled: !mockFor('storeEdit') && me?.role === 'OWNER',
    staleTime: 60_000,
    // 아직 가게를 등록하지 않은 사장님(STORE404_2)은 다시 물어봐도 같음
    retry: (count, e) => errorCode(e) !== 'STORE404_2' && count < 2,
    // 실패한 뒤 이 훅을 쓰는 화면(가게 등록 등)이 새로 뜰 때마다 다시 부르지 않게.
    // 다시 부르면 OwnerLayout 이 "불러오는 중"으로 바뀌어 그 화면을 내렸다 올리기를 반복함
    retryOnMount: false,
  })
}

/**
 * 유료 상품(퀘스트 가게·PRO)을 결제·관리할 수 있는지.
 * 가게를 등록한 사장님으로 로그인해야 함 — 그 기능이 목업이면 로그인 없이도 됨(시연용).
 * storeId: 서버를 부를 내 가게 (목업·로그인 전이면 null), pending: 내 가게를 불러오는 중
 */
export function useStoreManageAccess(feature: Parameters<typeof mockFor>[0]) {
  const me = useMe()
  const myStore = useMyStoreQuery()
  const local = mockFor(feature)
  const owner = me?.role === 'OWNER'
  return {
    local,
    storeId: !local && owner ? (myStore.data?.storeId ?? null) : null,
    pending: !local && owner && myStore.isLoading,
    canManage: local || (owner && !!myStore.data),
  }
}

/** 로그인한 사장님의 가게 id (불러오기 전·목업·로그인 전에는 샘플 가게) */
export function useMyStoreId() {
  const storeId = useMyStoreQuery().data?.storeId ?? MOCK_OWNER_STORE_ID
  // 아직 목업인 퀘스트·쿠폰도 같은 가게를 "내 가게"로 보게
  setMockOwnerStoreId(storeId)
  return storeId
}

export function useMyStore() {
  const storeId = useMyStoreId()
  const { data: stores } = useStores()
  return stores?.find((s) => s.storeId === storeId) ?? null
}

export function useMyStoreName() {
  return useMyStore()?.name ?? '내 가게'
}
