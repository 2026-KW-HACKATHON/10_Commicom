import { useQuery } from '@tanstack/react-query'

/** GET /api/events/early-owner — 초기 사장님 이벤트 (UPCOMING 시작 전 / OPEN 진행 중 / CLOSED 선착순 마감) */
export interface EarlyOwnerEvent {
  status: 'UPCOMING' | 'OPEN' | 'CLOSED'
  startsAt: string
  limit: number
  joined: number
  remaining: number
  benefitDays: number
}

/** 서버가 아직 이 API를 모를 때(배포 전) 보여 줄 기본값 */
export const EARLY_OWNER_DEFAULT: EarlyOwnerEvent = {
  status: 'UPCOMING',
  startsAt: '2026-10-13T00:00:00+09:00',
  limit: 10,
  joined: 0,
  remaining: 10,
  benefitDays: 30,
}

/**
 * 로그인 없이 보는 공개 API라 베타 체험(목업)에서도 실제 서버 현황을 보여 줌.
 * 체험 계정의 목업 토큰이 붙지 않게 axios 대신 fetch
 */
export async function fetchEarlyOwnerEvent(): Promise<EarlyOwnerEvent> {
  try {
    const res = await fetch('/api/events/early-owner', { signal: AbortSignal.timeout(4000) })
    const body = (await res.json()) as { result?: EarlyOwnerEvent }
    return body.result?.status ? body.result : EARLY_OWNER_DEFAULT
  } catch {
    return EARLY_OWNER_DEFAULT
  }
}

export function useEarlyOwnerEvent() {
  return useQuery({ queryKey: ['events', 'early-owner'], queryFn: fetchEarlyOwnerEvent, staleTime: 30_000 })
}
