/* ── 명세: 잇다 API 명세 – 쿠폰 ── */

export type DiscountType = 'AMOUNT' | 'RATE'
export type CouponStatus = 'ACTIVE' | 'STOPPED' | 'SOLD_OUT'
export type UserCouponStatus = 'AVAILABLE' | 'USED' | 'EXPIRED'
export type UserCouponSource = 'DOWNLOAD' | 'PIGEON_REWARD' | 'QUEST_REWARD'

/** POST /api/stores/{storeId}/coupons body */
export interface CreateCouponRequest {
  title: string
  discountType: DiscountType
  discountValue: number
  minOrderAmount?: number
  totalQuantity: number
  validDays: number
  useAsPigeonReward?: boolean
}

export interface CreateCouponResult {
  couponId: number
  status: CouponStatus
  createdAt: string
}

/** GET /api/stores/{storeId}/coupons 의 coupons[] (사장님) */
export interface OwnerCoupon {
  couponId: number
  title: string
  discountType: DiscountType
  discountValue: number
  minOrderAmount: number
  totalQuantity: number
  issuedCount: number
  usedCount: number
  remainingQuantity: number
  useAsPigeonReward: boolean
  status: CouponStatus
  createdAt: string
}

/** GET /api/stores/{storeId}/coupons/available 의 coupons[] (손님) */
export interface AvailableCoupon {
  couponId: number
  title: string
  discountType: DiscountType
  discountValue: number
  minOrderAmount: number
  validDays: number
  remainingQuantity: number
  alreadyDownloaded: boolean
}

/** POST /api/coupons/{couponId}/downloads */
export interface DownloadResult {
  userCouponId: number
  redeemCode: string
  expiresAt: string
}

/** GET /api/coupons/me 의 coupons[] */
export interface UserCoupon {
  userCouponId: number
  storeId: number
  storeName: string
  title: string
  discountType: DiscountType
  discountValue: number
  minOrderAmount: number
  source: UserCouponSource
  redeemCode: string
  status: UserCouponStatus
  expiresAt: string
  usedAt: string | null
}

export interface MyCouponPage {
  coupons: UserCoupon[]
  page: number
  size: number
  hasNext: boolean
}

/** POST /api/coupons/redeem */
export interface RedeemResult {
  userCouponId: number
  title: string
  discountType: DiscountType
  discountValue: number
  minOrderAmount: number
  fee: number
  redeemedAt: string
}

/** GET /api/stores/{storeId}/coupon-settlements?month= */
export interface Settlement {
  month: string
  usedCount: number
  totalDiscount: number
  totalFee: number
  items: {
    userCouponId: number
    title: string
    discountValue: number
    fee: number
    redeemedAt: string
  }[]
}

export const SOURCE_LABEL: Record<UserCouponSource, string> = {
  DOWNLOAD: '직접 받은 쿠폰',
  PIGEON_REWARD: '비둘기 레벨업 보상',
  QUEST_REWARD: '퀘스트 보상',
}

export function discountText(c: { discountType: DiscountType; discountValue: number }) {
  return c.discountType === 'AMOUNT' ? `${c.discountValue.toLocaleString()}원 할인` : `${c.discountValue}% 할인`
}

export function minOrderText(minOrderAmount: number) {
  return minOrderAmount > 0 ? `${minOrderAmount.toLocaleString()}원 이상 주문 시` : '최소 주문 금액 없음'
}

/** "2026-10-15T23:59:59+09:00" → "10.15까지" */
export function untilText(iso: string) {
  const d = new Date(iso)
  return `${d.getMonth() + 1}.${d.getDate()}까지`
}

/** 비율 할인 범위 (2026-10-08 변경: 명세 1~50% → 10~80%, 서버 검증도 같이 맞춰야 함) */
export const RATE_MIN = 10
export const RATE_MAX = 80

/** 4-1 입력 검증 — 클라이언트 폼도 같은 규칙을 씀 */
export function validateCoupon(body: CreateCouponRequest): string | null {
  const title = body.title.trim()
  if (title.length < 1 || title.length > 30) return '쿠폰 이름은 1~30자로 입력해 주세요'
  if (body.discountType === 'AMOUNT' && body.discountValue < 100) return '할인 금액은 100원 이상이어야 해요'
  if (body.discountType === 'RATE' && (body.discountValue < RATE_MIN || body.discountValue > RATE_MAX)) {
    return `할인율은 ${RATE_MIN}~${RATE_MAX}% 사이여야 해요`
  }
  if (!Number.isInteger(body.totalQuantity) || body.totalQuantity < 1 || body.totalQuantity > 1000) {
    return '발행 수량은 1~1,000장 사이여야 해요'
  }
  if (!Number.isInteger(body.validDays) || body.validDays < 1 || body.validDays > 30) {
    return '유효 기간은 1~30일 사이여야 해요'
  }
  return null
}
