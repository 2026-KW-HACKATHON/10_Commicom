import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/** 명세의 역할 이름(USER 손님 / OWNER 사장님)과 맞춤 */
export type AppMode = 'USER' | 'OWNER'

/**
 * 앱을 손님으로 쓸지 사장님으로 쓸지 (처음 실행 때 고르고, 설정에서 바꿈).
 * TODO: 로그인 담당이 토큰에 role을 넣으면 사장님 모드는 OWNER 계정만 고를 수 있게.
 */
interface ModeState {
  mode: AppMode | null
  setMode: (mode: AppMode) => void
  reset: () => void
}

export const useModeStore = create<ModeState>()(
  persist(
    (set) => ({
      mode: null,
      setMode: (mode) => set({ mode }),
      reset: () => set({ mode: null }),
    }),
    { name: 'itda-mode' },
  ),
)

/** 모드별 첫 화면 (IA: 온보딩 → 숏폼) */
export const MODE_HOME: Record<AppMode, string> = { USER: '/', OWNER: '/owner' }
