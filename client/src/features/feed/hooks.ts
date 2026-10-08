import { useQuery } from '@tanstack/react-query'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { fetchShortforms } from './api'

export function useShortforms(storeId?: number) {
  return useQuery({
    queryKey: ['shortforms', storeId ?? 'all'],
    queryFn: () => fetchShortforms(storeId),
    select: (d) => d.shortforms,
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
