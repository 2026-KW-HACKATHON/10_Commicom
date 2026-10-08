import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { deleteStoreShortform, fetchShortforms, fetchStoreShortforms } from './api'

export function useShortforms(storeId?: number) {
  return useQuery({
    queryKey: ['shortforms', storeId ?? 'all'],
    queryFn: () => fetchShortforms(storeId),
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

/**
 * 스크랩한 숏폼 (스크랩 API가 생기기 전까지 기기에 저장).
 * TODO: scrap 담당 API로 교체
 */
interface ScrapState {
  ids: number[]
  toggle: (shortformId: number) => void
}

export const useScrapStore = create<ScrapState>()(
  persist(
    (set) => ({
      ids: [],
      toggle: (id) => set((s) => ({ ids: s.ids.includes(id) ? s.ids.filter((x) => x !== id) : [id, ...s.ids] })),
    }),
    { name: 'itda-scraps' },
  ),
)
