import { useState } from 'react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { OWNER_ILLUST } from '@/features/owner/illustrations'

/**
 * 잇다 PRO 구독 상태.
 * 명세에 PRO API가 아직 없어 로컬 모의 구독으로 둠 → API가 생기면 서버 조회로 교체.
 * 숏폼 쪽 재수정·다운로드 버튼은 useIsPro()로 막고, 피드 우선 노출은 서버(숏폼 담당)에서 PRO 가게 가중치로 처리.
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

export function useIsPro() {
  const expiresAt = useProStore((s) => s.expiresAt)
  // 화면을 연 시점 기준으로 판단 (렌더마다 시간이 바뀌지 않게)
  const [now] = useState(() => Date.now())
  return Boolean(expiresAt && Date.parse(expiresAt) > now)
}

export const PRO_BENEFITS = [
  { image: OWNER_ILLUST.pro, title: '숏폼 우선 노출', description: '손님 숏폼 피드에 우리 가게 홍보 영상이 더 자주 떠요' },
  { image: OWNER_ILLUST.videoEdit, title: '영상 재수정', description: 'AI가 만든 홍보 영상의 대본·자막·BGM을 다시 고쳐 만들 수 있어요' },
  { image: OWNER_ILLUST.videoDownload, title: '제작 영상 다운로드', description: '완성된 9:16 영상을 원본 화질로 내려받아 다른 SNS에도 올릴 수 있어요' },
] as const
