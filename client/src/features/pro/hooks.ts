import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useStoreManageAccess } from '@/features/owner/hooks'
import { ApiError } from '@/shared/api/client'
import { fetchPro, localPro, localProApi, patchProAutoRenew, postPro, type ProStatus } from './api'

/** 로그인 전·가게 등록 전: 구독 없음으로 보고 가입·해지는 막음 */
const NO_PRO: ProStatus = { storeId: null, status: 'NONE', startedAt: null, expiresAt: null, autoRenew: false }

/**
 * PRO는 서버(가게 단위)에서 관리 → 가게를 등록한 사장님으로 로그인해야 가입할 수 있음.
 * 목업(mockFor('pro'))일 때만 이 기기에 저장한 모의 구독을 씀
 */
function useProTarget() {
  return useStoreManageAccess('pro')
}

export function useProQuery() {
  const { storeId, local, pending } = useProTarget()
  return useQuery({
    queryKey: ['pro', local ? 'local' : storeId],
    queryFn: () => (local ? localPro() : storeId ? fetchPro(storeId) : NO_PRO),
    enabled: !pending,
  })
}

/** 지금 PRO에 가입할 수 있는지 (아니면 로그인부터) */
export function useCanSubscribePro() {
  return useProTarget().canManage
}

/** PRO 이용 중인지. 불러오는 동안은 isLoading (PRO 전용 화면에서 바로 튕기지 않게) */
export function usePro() {
  const { data, isPending } = useProQuery()
  return { isPro: data?.status === 'ACTIVE', isLoading: isPending }
}

export function useIsPro() {
  return usePro().isPro
}

function useProMutation<T>(server: (storeId: number, arg: T) => Promise<unknown>, local: (arg: T) => unknown) {
  const target = useProTarget()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (arg: T) => {
      if (target.local) return local(arg)
      if (!target.storeId) throw new ApiError('COMMON401', '사장님 계정으로 로그인해 주세요')
      return server(target.storeId, arg)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pro'] })
      // 우선 노출: 피드 순서를 다시 받기
      qc.invalidateQueries({ queryKey: ['shortforms'] })
    },
  })
}

/** PRO 가입 (모의 결제) */
export function useSubscribePro() {
  return useProMutation<void>((storeId) => postPro(storeId), () => localProApi.subscribe())
}

/** 해지 예약(false) · 해지 취소(true) */
export function useSetProAutoRenew() {
  return useProMutation<boolean>(patchProAutoRenew, localProApi.setAutoRenew)
}
