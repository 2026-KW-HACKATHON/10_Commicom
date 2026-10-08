import { mockCouponApi, USE_MOCK } from '@/mocks/db'
import { api, request } from '@/shared/api/client'
import type {
  AvailableCoupon,
  CouponStatus,
  CreateCouponRequest,
  CreateCouponResult,
  DownloadResult,
  MyCouponPage,
  OwnerCoupon,
  RedeemResult,
  Settlement,
  UserCouponStatus,
} from './schema'

/* 사장님 */

export function postCoupon(storeId: number, body: CreateCouponRequest): Promise<CreateCouponResult> {
  if (USE_MOCK) return mockCouponApi.create(storeId, body)
  return request(api.post(`/api/stores/${storeId}/coupons`, body))
}

export function fetchOwnerCoupons(storeId: number, status?: CouponStatus): Promise<{ coupons: OwnerCoupon[] }> {
  if (USE_MOCK) return mockCouponApi.ownerList(storeId, status)
  return request(api.get(`/api/stores/${storeId}/coupons`, { params: status ? { status } : undefined }))
}

export function stopCoupon(storeId: number, couponId: number): Promise<{ couponId: number; status: CouponStatus }> {
  if (USE_MOCK) return mockCouponApi.stop(storeId, couponId)
  return request(api.patch(`/api/stores/${storeId}/coupons/${couponId}`, { status: 'STOPPED' }))
}

export function postRedeem(redeemCode: string): Promise<RedeemResult> {
  if (USE_MOCK) return mockCouponApi.redeem(redeemCode)
  return request(api.post('/api/coupons/redeem', { redeemCode }))
}

export function fetchSettlement(storeId: number, month: string): Promise<Settlement> {
  if (USE_MOCK) return mockCouponApi.settlements(storeId, month)
  return request(api.get(`/api/stores/${storeId}/coupon-settlements`, { params: { month } }))
}

/* 손님 */

export function fetchAvailableCoupons(storeId: number): Promise<{ coupons: AvailableCoupon[] }> {
  if (USE_MOCK) return mockCouponApi.available(storeId)
  return request(api.get(`/api/stores/${storeId}/coupons/available`))
}

export function postDownload(couponId: number): Promise<DownloadResult> {
  if (USE_MOCK) return mockCouponApi.download(couponId)
  return request(api.post(`/api/coupons/${couponId}/downloads`))
}

export function fetchMyCoupons(status?: UserCouponStatus): Promise<MyCouponPage> {
  if (USE_MOCK) return mockCouponApi.mine(status)
  return request(api.get('/api/coupons/me', { params: { status, page: 0, size: 20 } }))
}
