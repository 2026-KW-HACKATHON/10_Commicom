import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// 최소 버전: 로그인/회원가입 담당 팀원이 확장
interface AuthState {
  accessToken: string | null
  setAccessToken: (token: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      setAccessToken: (accessToken) => set({ accessToken }),
      logout: () => set({ accessToken: null }),
    }),
    { name: 'itda-auth' },
  ),
)
