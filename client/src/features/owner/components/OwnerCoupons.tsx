import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useOwnerCoupons, useStopCoupon } from '@/features/coupon/hooks'
import { discountText, minOrderText, type CouponStatus } from '@/features/coupon/schema'
import { ProgressBar } from '@/features/quest/components/QuestUi'
import { errorMessage } from '@/shared/lib/error'
import { useMyStoreId } from '../hooks'
import { OWNER_ILLUST } from '../illustrations'
import { CouponStatusBadge, OwnerScreen } from './OwnerUi'

const FILTERS: { status?: CouponStatus; label: string }[] = [
  { label: '전체' },
  { status: 'ACTIVE', label: '발행 중' },
  { status: 'STOPPED', label: '중지' },
  { status: 'SOLD_OUT', label: '소진' },
]

/** 발행한 쿠폰 목록 + 발행 중지 (4-2, 4-3) */
export function OwnerCoupons() {
  const storeId = useMyStoreId()
  const [status, setStatus] = useState<CouponStatus | undefined>()
  const { data: coupons, isLoading, isError } = useOwnerCoupons(storeId, status)
  const stop = useStopCoupon(storeId)

  return (
    <OwnerScreen>
      <Link to="/owner/coupons/new" className="flex items-center gap-3 overflow-hidden rounded-2xl bg-q-green py-2 pr-4 pl-3 text-white">
        <img src={OWNER_ILLUST.couponNew} alt="" className="-my-1 h-[76px] w-auto object-contain drop-shadow" />
        <span className="flex-1">
          <span className="block text-[16px] font-bold">새 쿠폰 발행하기</span>
          <span className="text-xs opacity-85">손님을 부르는 할인 쿠폰을 만들어요</span>
        </span>
        <span className="text-xl">›</span>
      </Link>

      <div className="mt-4 flex gap-1.5" role="tablist">
        {FILTERS.map((f) => (
          <button
            key={f.label}
            type="button"
            role="tab"
            aria-selected={status === f.status}
            onClick={() => setStatus(f.status)}
            className="rounded-full border border-q-line bg-white px-3.5 py-1.5 text-[13px] font-bold text-q-muted aria-selected:border-q-green aria-selected:bg-q-green aria-selected:text-white"
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading && <div className="mt-3 h-28 animate-pulse rounded-2xl bg-white" />}
      {isError && <p className="py-10 text-center text-sm text-q-muted">쿠폰을 불러오지 못했어요</p>}
      {coupons && coupons.length === 0 && (
        <p className="mt-3 rounded-2xl bg-white py-10 text-center text-sm text-q-muted">해당하는 쿠폰이 없어요</p>
      )}
      {stop.isError && <p className="mt-3 text-center text-[13px] text-point-red-dark">{errorMessage(stop.error)}</p>}

      <ul className="mt-3 flex flex-col gap-2.5">
        {coupons?.map((c) => (
          <li key={c.couponId} className="rounded-2xl bg-white px-4 py-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-[16px] font-bold text-q-text">{c.title}</p>
                <p className="text-xs text-q-muted">
                  {discountText(c)} · {minOrderText(c.minOrderAmount)}
                </p>
              </div>
              <CouponStatusBadge status={c.status} />
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              {[
                ['받은 손님', c.issuedCount],
                ['사용', c.usedCount],
                ['남은 수량', c.remainingQuantity],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl bg-q-panel py-2">
                  <p className="text-[11px] text-q-muted">{label}</p>
                  <p className="text-[15px] font-bold text-q-text tabular-nums">{value}</p>
                </div>
              ))}
            </div>
            <ProgressBar value={c.issuedCount} max={c.totalQuantity} className="mt-2.5 h-1.5" />
            <p className="mt-1 text-right text-[11px] text-q-muted">
              {c.issuedCount} / {c.totalQuantity}장 지급
            </p>

            <div className="mt-2 flex items-center justify-between border-t border-q-line pt-2.5">
              <span className={`text-xs ${c.useAsPigeonReward ? 'font-medium text-q-green' : 'text-q-muted'}`}>
                {c.useAsPigeonReward ? '🕊 비둘기 레벨업 보상 포함' : '직접 받기 전용'}
              </span>
              {c.status === 'ACTIVE' && (
                <button
                  type="button"
                  disabled={stop.isPending}
                  onClick={() =>
                    window.confirm('발행을 중지할까요?\n이미 받은 손님은 기한까지 쓸 수 있어요.') && stop.mutate(c.couponId)
                  }
                  className="rounded-full border border-point-red/40 px-3 py-1 text-xs font-bold text-point-red-dark"
                >
                  발행 중지
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </OwnerScreen>
  )
}
