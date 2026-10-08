import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { USE_MOCK } from '@/mocks/db'
import { errorCode } from '@/shared/lib/error'
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

/**
 * 앱을 켤 때 저장된 로그인이 아직 유효한지 서버에 한 번 확인 (GET /api/members/me).
 * 서버 DB가 초기화됐거나 탈퇴한 계정이면(MEMBER404·COMMON401) 로그아웃, 유효하면 회원 정보를 최신으로
 */
export function useSessionCheck() {
  const token = useAuthStore((s) => s.accessToken)
  const setMember = useAuthStore((s) => s.setMember)
  const logout = useLogout()
  useEffect(() => {
    if (!token || USE_MOCK) return
    let alive = true
    fetchMe(token)
      .then((me) => alive && setMember(me))
      .catch((e) => {
        if (alive && ['MEMBER404', 'COMMON401'].includes(errorCode(e) ?? '')) logout('로그인 정보가 바뀌었어요 · 다시 로그인해 주세요')
      })
    return () => {
      alive = false
    }
    // 앱을 켤 때 한 번만 (로그인·로그아웃으로 토큰이 바뀌는 건 각자 처리)
  }, [])
}
