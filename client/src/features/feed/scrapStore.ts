import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/** 목업(mockFor('scrap'))일 때만 쓰는 기기 저장 스크랩 — 실서버는 GET /api/scraps/shortforms */
interface ScrapState {
  ids: number[]
  add: (shortformId: number) => void
  remove: (shortformId: number) => void
}

export const useLocalScrapStore = create<ScrapState>()(
  persist(
    (set) => ({
      ids: [],
      add: (id) => set((s) => ({ ids: [id, ...s.ids.filter((x) => x !== id)] })),
      remove: (id) => set((s) => ({ ids: s.ids.filter((x) => x !== id) })),
    }),
    { name: 'itda-scraps' },
  ),
)
