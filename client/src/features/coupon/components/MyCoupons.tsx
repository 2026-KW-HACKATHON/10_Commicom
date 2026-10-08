import { useState } from 'react'
import { OWNER_ILLUST } from '@/features/owner/illustrations'
import { Sheet } from '@/shared/ui/Sheet'
import { useMyCoupons } from '../hooks'
import {
  discountText,
  minOrderText,
  SOURCE_LABEL,
  untilText,
  type UserCoupon,
  type UserCouponStatus,
} from '../schema'
import { CouponTicket } from './CouponTicket'

const TABS: { status: UserCouponStatus; label: string }[] = [
  { status: 'AVAILABLE', label: '사용 가능' },
  { status: 'USED', label: '사용 완료' },
  { status: 'EXPIRED', label: '기간 만료' },
]

/** 내 쿠폰함 (4-6) — 다운로드·비둘기 보상·퀘스트 보상 모두 */
export function MyCoupons() {
  const [status, setStatus] = useState<UserCouponStatus>('AVAILABLE')
  const { data: coupons, isLoading, isError } = useMyCoupons(status)
  const [opened, setOpened] = useState<UserCoupon | null>(null)

  return (
    <div className="h-full overflow-y-auto px-5 pt-4 pb-8">
      <div role="tablist" className="mb-4 grid grid-cols-3 rounded-full bg-q-panel p-1">
        {TABS.map((tab) => (
          <button
            key={tab.status}
            type="button"
            role="tab"
            aria-selected={tab.status === status}
            onClick={() => setStatus(tab.status)}
            className="h-9 rounded-full text-[13px] font-bold text-q-muted aria-selected:bg-white aria-selected:text-q-green aria-selected:shadow-sm"
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading && <div className="h-24 animate-pulse rounded-2xl bg-q-panel" />}
      {isError && <p className="py-10 text-center text-sm text-q-muted">쿠폰함을 불러오지 못했어요</p>}
      {coupons && coupons.length === 0 && (
        <div className="rounded-2xl bg-q-panel py-8 text-center text-sm leading-relaxed text-q-muted">
          <img src={OWNER_ILLUST.coupon} alt="" className="mx-auto mb-3 h-[110px] w-auto object-contain opacity-90" />
          {status === 'AVAILABLE' ? (
            <>
              사용할 수 있는 쿠폰이 없어요.
              <br />
              지도에서 쿠폰 배지가 있는 가게를 찾아보세요!
            </>
          ) : (
            '쿠폰이 없어요'
          )}
        </div>
      )}

      <ul className="flex flex-col gap-2.5">
        {coupons?.map((c) => (
          <li key={c.userCouponId}>
            <CouponTicket
              discountType={c.discountType}
              discountValue={c.discountValue}
              title={c.title}
              lines={[
                `${c.storeName} · ${minOrderText(c.minOrderAmount)}`,
                c.status === 'USED' && c.usedAt
                  ? `${untilText(c.usedAt).replace('까지', '')} 사용 · ${SOURCE_LABEL[c.source]}`
                  : `${untilText(c.expiresAt)} · ${SOURCE_LABEL[c.source]}`,
              ]}
              dimmed={c.status !== 'AVAILABLE'}
              onClick={c.status === 'AVAILABLE' ? () => setOpened(c) : undefined}
              action={c.status === 'AVAILABLE' ? <span className="text-[13px] font-bold text-q-green">사용 ›</span> : undefined}
            />
          </li>
        ))}
      </ul>

      {opened && (
        <Sheet title="쿠폰 사용하기" onClose={() => setOpened(null)}>
          <p className="text-center text-[15px] font-bold text-q-text">{opened.storeName}</p>
          <p className="mt-1 text-center text-sm text-q-sub">
            {opened.title} · {discountText(opened)}
          </p>
          <div className="mx-auto mt-5 w-fit rounded-2xl border-2 border-dashed border-q-green px-8 py-5 text-center">
            <p className="text-xs text-q-muted">사용 코드</p>
            <p className="mt-1 font-mono text-[34px] font-bold tracking-[0.25em] text-q-text">{opened.redeemCode}</p>
          </div>
          <p className="mt-4 text-center text-[13px] leading-relaxed text-q-muted">
            결제할 때 사장님께 이 코드를 보여주세요.
            <br />
            {minOrderText(opened.minOrderAmount)} · {untilText(opened.expiresAt)}
          </p>
        </Sheet>
      )}
    </div>
  )
}
