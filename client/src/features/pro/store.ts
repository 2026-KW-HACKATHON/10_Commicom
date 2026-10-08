import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { OWNER_ILLUST } from '@/features/owner/illustrations'

/**
 * 이 기기에 저장하는 모의 PRO 구독 — 목업(mockFor('pro'))일 때만 씀.
 * 화면에서는 hooks.ts 의 usePro()/useIsPro() 로 읽음 (로그인한 사장님은 서버 GET /api/stores/{storeId}/pro)
 */
interface ProState {
  startedAt: string | null
  expiresAt: string | null
  /** 해지 예약: 만료일까지는 이용 가능, 이후 자동 갱신 안 함 */
  canceled: boolean
  subscribe: () => void
  cancel: () => void
  resume: () => void
}

export const useProStore = create<ProState>()(
  persist(
    (set) => ({
      startedAt: null,
      expiresAt: null,
      canceled: false,
      subscribe: () =>
        set({
          startedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 30 * 86_400_000).toISOString(),
          canceled: false,
        }),
      cancel: () => set({ canceled: true }),
      resume: () => set({ canceled: false }),
    }),
    { name: 'itda-pro' },
  ),
)

export const PRO_BENEFITS = [
  { image: OWNER_ILLUST.pro, title: '피드 우선 노출', description: '손님 피드에 우리 가게 홍보 게시물이 더 자주 떠요' },
  { image: OWNER_ILLUST.videoEdit, title: '게시물 재수정', description: 'AI가 만든 홍보 게시물의 사진·문구를 다시 고쳐 만들 수 있어요' },
  { image: OWNER_ILLUST.videoDownload, title: '원본 사진 다운로드', description: '완성된 게시물 사진을 원본 화질로 내려받아 다른 SNS에도 올릴 수 있어요' },
] as const
