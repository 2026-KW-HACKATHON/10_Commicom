import { useState } from 'react'
import { useSettlement } from '@/features/coupon/hooks'
import { useMyStoreId } from '../hooks'
import { currentMonth, dateTimeText, shiftMonth } from '../date'
import { OwnerCard, OwnerScreen } from './OwnerUi'

/** 쿠폰 수수료 정산 내역 (4-8) */
export function OwnerSettlement() {
  const storeId = useMyStoreId()
  const thisMonth = currentMonth()
  const [month, setMonth] = useState(thisMonth)
  const { data, isLoading, isError } = useSettlement(storeId, month)
  const [y, m] = month.split('-')

  return (
    <OwnerScreen>
      <div className="flex items-center justify-center gap-4">
        <button type="button" aria-label="이전 달" onClick={() => setMonth(shiftMonth(month, -1))} className="size-9 rounded-full bg-white text-lg text-q-sub">
          ‹
        </button>
        <p className="text-lg font-bold text-q-text tabular-nums">
          {y}년 {Number(m)}월
        </p>
        <button
          type="button"
          aria-label="다음 달"
          disabled={month >= thisMonth}
          onClick={() => setMonth(shiftMonth(month, 1))}
          className="size-9 rounded-full bg-white text-lg text-q-sub disabled:opacity-30"
        >
          ›
        </button>
      </div>

      {isLoading && <div className="mt-4 h-40 animate-pulse rounded-2xl bg-white" />}
      {isError && <p className="py-10 text-center text-sm text-q-muted">정산 내역을 불러오지 못했어요</p>}
      {data && (
        <>
          <section className="mt-4 rounded-3xl bg-q-green-dark px-6 py-5 text-white">
            <p className="text-xs opacity-80">{Number(m)}월 잇다 수수료</p>
            <p className="mt-1 text-[30px] font-bold tabular-nums">{data.totalFee.toLocaleString()}원</p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-xl bg-white/15 px-3 py-2">
                <p className="text-[11px] opacity-80">쿠폰 사용</p>
                <p className="font-bold">{data.usedCount}건</p>
              </div>
              <div className="rounded-xl bg-white/15 px-3 py-2">
                <p className="text-[11px] opacity-80">손님 할인 (사장님 부담)</p>
                <p className="font-bold">{data.totalDiscount.toLocaleString()}원</p>
              </div>
            </div>
          </section>

          <OwnerCard title="사용 내역" className="mt-3" aside={<span className="text-xs text-q-muted">{data.items.length}건</span>}>
            {data.items.length === 0 ? (
              <p className="py-4 text-center text-sm text-q-muted">이 달에 사용된 쿠폰이 없어요</p>
            ) : (
              <ul className="flex flex-col divide-y divide-q-line">
                {data.items.map((item) => (
                  <li key={item.userCouponId} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-q-text">{item.title}</p>
                      <p className="text-xs text-q-muted">{dateTimeText(item.redeemedAt)}</p>
                    </div>
                    <div className="shrink-0 text-right text-xs">
                      <p className="text-q-sub">할인 {item.discountValue.toLocaleString()}원</p>
                      <p className="font-bold text-q-green">수수료 {item.fee}원</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </OwnerCard>

          <p className="mt-4 text-center text-xs leading-relaxed text-q-muted">
            할인 금액은 사장님 부담이고,
            <br />
            손님이 실제로 사용한 쿠폰 1건당 소액 수수료가 붙어요.
          </p>
        </>
      )}
    </OwnerScreen>
  )
}
