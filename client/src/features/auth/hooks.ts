import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/authStore'
import { useModeStore } from '@/stores/modeStore'
import { toast } from '@/stores/toastStore'
import { fetchMe, login, withdraw } from './api'
import { modeOfRole } from './schema'

/** 로그인 → 내 정보까지 받아 저장하고, 회원 유형에 맞는 모드로 전환 */
export function useLogin() {
  const setSession = useAuthStore((s) => s.setSession)
  const setMode = useModeStore((s) => s.setMode)
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const { accessToken } = await login(email, password)
      const me = await fetchMe(accessToken)
      return { accessToken, me }
    },
    onSuccess: ({ accessToken, me }) => {
      setSession(accessToken, me)
      setMode(modeOfRole(me.role))
      queryClient.invalidateQueries()
      toast(`${me.nickname} 님, 반가워요!`)
    },
  })
}

/** 로그아웃: 토큰만 지우면 끝 (명세에 로그아웃 API 없음, 토큰 24시간 만료) */
export function useLogout() {
  const logout = useAuthStore((s) => s.logout)
  const queryClient = useQueryClient()
  return (message = '로그아웃했어요') => {
    logout()
    queryClient.invalidateQueries()
    toast(message)
  }
}

/** 회원 탈퇴 → 토큰 즉시 제거 */
export function useWithdraw() {
  const logout = useLogout()
  return useMutation({ mutationFn: withdraw, onSuccess: () => logout('탈퇴했어요. 그동안 고마웠어요') })
}
