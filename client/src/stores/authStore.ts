import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/** 로그인한 회원 (명세 로그인·내 정보 조회 응답에서 화면에 필요한 만큼) */
export interface AuthMember {
  memberId: number
  email: string
  nickname: string
  /** 명세 회원 유형: RESIDENT(주민·손님) / OWNER(사장님) */
  role: 'RESIDENT' | 'OWNER' | 'ADMIN'
  profileImageUrl: string | null
}

interface AuthState {
  accessToken: string | null
  member: AuthMember | null
  setAccessToken: (token: string) => void
  setSession: (token: string, member: AuthMember) => void
  setMember: (member: AuthMember) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      member: null,
      setAccessToken: (accessToken) => set({ accessToken }),
      setSession: (accessToken, member) => set({ accessToken, member }),
      setMember: (member) => set({ member }),
      logout: () => set({ accessToken: null, member: null }),
    }),
    { name: 'itda-auth' },
  ),
)

/** 로그인했으면 회원 정보, 아니면 null */
export const useMe = () => useAuthStore((s) => (s.accessToken ? s.member : null))
