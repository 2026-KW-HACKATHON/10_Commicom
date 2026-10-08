import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchAvailableCoupons,
  fetchMyCoupons,
  fetchOwnerCoupons,
  fetchSettlement,
  postCoupon,
  postDownload,
  postRedeem,
  stopCoupon,
} from './api'
import type { CouponStatus, CreateCouponRequest, UserCouponStatus } from './schema'

export const couponKeys = {
  mine: (status?: UserCouponStatus) => ['coupons', 'me', status ?? 'ALL'] as const,
  available: (storeId: number) => ['coupons', 'available', storeId] as const,
  owner: (storeId: number) => ['coupons', 'owner', storeId] as const,
  settlement: (storeId: number, month: string) => ['coupons', 'settlement', storeId, month] as const,
}

export function useMyCoupons(status?: UserCouponStatus) {
  return useQuery({ queryKey: couponKeys.mine(status), queryFn: () => fetchMyCoupons(status), select: (d) => d.coupons })
}

export function useAvailableCoupons(storeId: number) {
  return useQuery({
    queryKey: couponKeys.available(storeId),
    queryFn: () => fetchAvailableCoupons(storeId),
    select: (d) => d.coupons,
  })
}

/** 쿠폰 관련 화면은 모두 'coupons' 아래라 한 번에 새로고침 */
function useInvalidateCoupons() {
  const qc = useQueryClient()
  return () => {
    qc.invalidateQueries({ queryKey: ['coupons'] })
    qc.invalidateQueries({ queryKey: ['stores'] })
  }
}

export function useDownloadCoupon() {
  return useMutation({ mutationFn: postDownload, onSuccess: useInvalidateCoupons() })
}

export function useOwnerCoupons(storeId: number, status?: CouponStatus) {
  return useQuery({
    queryKey: [...couponKeys.owner(storeId), status ?? 'ALL'],
    queryFn: () => fetchOwnerCoupons(storeId, status),
    select: (d) => d.coupons,
  })
}

export function useCreateCoupon(storeId: number) {
  return useMutation({
    mutationFn: (body: CreateCouponRequest) => postCoupon(storeId, body),
    onSuccess: useInvalidateCoupons(),
  })
}

export function useStopCoupon(storeId: number) {
  return useMutation({ mutationFn: (couponId: number) => stopCoupon(storeId, couponId), onSuccess: useInvalidateCoupons() })
}

export function useRedeemCoupon() {
  return useMutation({ mutationFn: postRedeem, onSuccess: useInvalidateCoupons() })
}

export function useSettlement(storeId: number, month: string) {
  return useQuery({ queryKey: couponKeys.settlement(storeId, month), queryFn: () => fetchSettlement(storeId, month) })
}
