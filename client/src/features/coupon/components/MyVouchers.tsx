import { useState } from 'react'
import { useExchangeVoucher, useVouchers } from '@/features/quest/hooks'
import { errorMessage } from '@/shared/lib/error'
import { num } from '@/shared/lib/format'
import { toast } from '@/stores/toastStore'
import { untilText } from '../schema'

/**
 * 쿠폰 교환권 (레벨업 쿠폰이 나왔는데 쿠폰을 내놓은 가게가 없을 때 받은 것).
 * 쿠폰이 생기면 바꾸고, 기한(3주)이 지나면 먹이로 바뀜 — 바꿀 수 있는 교환권만 보여 줌
 */
export function MyVouchers() {
  const { data } = useVouchers()
  const exchange = useExchangeVoucher()
  const [pendingId, setPendingId] = useState<number | null>(null)
  const issued = data?.vouchers.filter((v) => v.status === 'ISSUED') ?? []
  if (!data || issued.length === 0) return null

  const onExchange = (voucherId: number) => {
    setPendingId(voucherId)
    exchange.mutate(voucherId, {
      onSuccess: (r) => {
        if (r.feedGained > 0) toast(`기한이 지나 먹이 ${num(r.feedGained)}개로 바꿨어요`)
        else if (r.voucher.userCoupon) toast(`🎉 ${r.voucher.userCoupon.storeName} 쿠폰으로 바꿨어요!`)
      },
      onError: (e) => toast(errorMessage(e)),
      onSettled: () => setPendingId(null),
    })
  }

  return (
    <section aria-label="쿠폰 교환권" className="mb-5">
      <h2 className="mb-2 flex items-center justify-between text-[13px] font-bold text-q-text">
        🎟 쿠폰 교환권 {num(issued.length)}장
        <span className="text-[11px] font-medium text-q-muted">
          {data.validDays / 7}주 안에 못 바꾸면 먹이 {data.expiryFeed}개
        </span>
      </h2>
      <ul className="flex flex-col gap-2">
        {issued.map((v) => (
          <li key={v.voucherId} className="flex items-center gap-3 rounded-2xl border border-dashed border-point-orange bg-point-yellow/20 px-4 py-3">
            <span aria-hidden className="text-[26px] leading-none">🎟</span>
            <span className="min-w-0 flex-1">
              <span className="block text-[14px] font-bold text-q-text">비둘기 레벨업 쿠폰 교환권</span>
              <span className="block text-[11px] text-q-muted">{untilText(v.expiresAt)}</span>
            </span>
            <button
              type="button"
              disabled={!data.poolAvailable || pendingId !== null}
              onClick={() => onExchange(v.voucherId)}
              className="h-9 shrink-0 rounded-full bg-q-green px-3.5 text-[12px] font-bold whitespace-nowrap text-white disabled:bg-q-panel disabled:text-q-muted"
            >
              {pendingId === v.voucherId ? '바꾸는 중...' : data.poolAvailable ? '쿠폰으로 바꾸기' : '쿠폰 기다리는 중'}
            </button>
          </li>
        ))}
      </ul>
      {!data.poolAvailable && (
        <p className="mt-2 text-[11px] leading-relaxed text-q-muted">
          아직 비둘기 보상 쿠폰을 내놓은 가게가 없어요. 동네 가게가 쿠폰을 내놓으면 바로 바꿀 수 있어요!
        </p>
      )}
    </section>
  )
}
