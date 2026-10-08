import { api, request } from '@/shared/api/client'
import { useProStore } from './store'

export type ProStatusCode = 'ACTIVE' | 'EXPIRED' | 'NONE'

/** GET /api/stores/{storeId}/pro — autoRenew=false 면 해지 예약 */
export interface ProStatus {
  storeId: number | null
  status: ProStatusCode
  startedAt: string | null
  expiresAt: string | null
  autoRenew: boolean
}

export function fetchPro(storeId: number): Promise<ProStatus> {
  return request(api.get(`/api/stores/${storeId}/pro`))
}

/** PRO 가입 (해커톤: 모의 결제). 이용 중이면 PRO409 */
export function postPro(storeId: number): Promise<ProStatus> {
  return request(api.post(`/api/stores/${storeId}/pro`))
}

/** false = 해지 예약, true = 해지 취소. 이용 중이 아니면 PRO409_2 */
export function patchProAutoRenew(storeId: number, autoRenew: boolean): Promise<ProStatus> {
  return request(api.patch(`/api/stores/${storeId}/pro`, { autoRenew }))
}

/* 목업(mockFor('pro'))일 때만 이 기기에 저장 */

export function localPro(): ProStatus {
  const { startedAt, expiresAt, canceled } = useProStore.getState()
  const status: ProStatusCode = !expiresAt ? 'NONE' : Date.parse(expiresAt) > Date.now() ? 'ACTIVE' : 'EXPIRED'
  return { storeId: null, status, startedAt, expiresAt, autoRenew: status !== 'NONE' && !canceled }
}

export const localProApi = {
  subscribe() {
    useProStore.getState().subscribe()
    return localPro()
  },
  setAutoRenew(autoRenew: boolean) {
    const s = useProStore.getState()
    if (autoRenew) s.resume()
    else s.cancel()
    return localPro()
  },
}
