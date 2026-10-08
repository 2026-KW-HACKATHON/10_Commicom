import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { mockFor } from '@/mocks/db'
import { useMe } from '@/stores/authStore'
import { toast } from '@/stores/toastStore'
import {
  addShortformScrap,
  deleteStoreShortform,
  fetchScrappedShortforms,
  fetchShortforms,
  fetchStoreShortforms,
  removeShortformScrap,
} from './api'
import type { Shortform } from './schema'

/** 숏폼 피드: 페이지 단위로 받아 이어 붙임 (fetchNextPage로 다음 묶음) */
export function useShortformFeed(storeId?: number) {
  return useInfiniteQuery({
    queryKey: ['shortforms', 'feed', storeId ?? 'all'],
    queryFn: ({ pageParam }) => fetchShortforms(storeId, pageParam),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.hasNext ? last.page + 1 : undefined),
    select: (d) => d.pages.flatMap((p) => p.shortforms),
  })
}

/** 한 번에 넉넉히 받는 목록 (스크랩 모아보기 등 피드가 아닌 곳) */
export function useShortforms(storeId?: number) {
  return useQuery({
    queryKey: ['shortforms', storeId ?? 'all'],
    queryFn: () => fetchShortforms(storeId, 0, 100),
    select: (d) => d.shortforms,
  })
}

/** 사장님 내 영상: 우리 가게 영상, 최근 올린 순 */
export function useStoreShortforms(storeId: number) {
  return useQuery({
    queryKey: ['shortforms', 'store', storeId],
    queryFn: () => fetchStoreShortforms(storeId),
    select: (d) => [...d.shortforms].sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? '')),
  })
}

export function useDeleteShortform() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteStoreShortform,
    // 피드·내 영상 모두 다시 불러오기 (키가 모두 'shortforms'로 시작)
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shortforms'] }),
  })
}

/** 스크랩할 수 있는지 — 서버 스크랩은 로그인 필요 (목업이면 로그인 없이 기기에 저장) */
export function useCanScrap() {
  const me = useMe()
  return mockFor('scrap') || !!me
}

const SCRAP_KEY = ['scraps', 'shortforms'] as const

/** 스크랩한 숏폼 (메뉴 > 스크랩한 영상). 로그인 전엔 부르지 않음 */
export function useScrappedShortforms() {
  const canScrap = useCanScrap()
  const me = useMe()
  return useQuery({ queryKey: [...SCRAP_KEY, me?.memberId ?? 'local'], queryFn: fetchScrappedShortforms, enabled: canScrap })
}

/** 이 숏폼을 스크랩했는지 */
export function useIsScrapped(shortformId: number) {
  const { data } = useScrappedShortforms()
  return data?.some((s) => s.shortformId === shortformId) ?? false
}

/** 스크랩 / 취소 — 버튼이 바로 바뀌게 목록을 먼저 고치고, 실패하면 되돌림 */
export function useToggleScrap() {
  const qc = useQueryClient()
  const me = useMe()
  const key = [...SCRAP_KEY, me?.memberId ?? 'local']
  return useMutation({
    mutationFn: ({ item, scrapped }: { item: Shortform; scrapped: boolean }) =>
      scrapped ? removeShortformScrap(item.shortformId) : addShortformScrap(item.shortformId),
    onMutate: async ({ item, scrapped }) => {
      await qc.cancelQueries({ queryKey: key })
      const prev = qc.getQueryData<Shortform[]>(key)
      qc.setQueryData<Shortform[]>(key, (list = []) =>
        scrapped ? list.filter((s) => s.shortformId !== item.shortformId) : [item, ...list],
      )
      return { prev }
    },
    onError: (_e, _v, ctx) => {
      qc.setQueryData(key, ctx?.prev)
      toast('스크랩하지 못했어요 · 잠시 후 다시 시도해 주세요')
    },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  })
}
