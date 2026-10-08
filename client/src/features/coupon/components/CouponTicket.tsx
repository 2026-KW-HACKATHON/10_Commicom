import type { ReactNode } from 'react'
import { discountText, type DiscountType } from '../schema'

/** 쿠폰 한 장 모양 (왼쪽 할인 / 오른쪽 내용) */
export function CouponTicket({
  discountType,
  discountValue,
  title,
  lines,
  dimmed = false,
  action,
  onClick,
}: {
  discountType: DiscountType
  discountValue: number
  title: string
  lines: ReactNode[]
  dimmed?: boolean
  action?: ReactNode
  onClick?: () => void
}) {
  const amount = discountType === 'AMOUNT' ? discountValue.toLocaleString() : String(discountValue)
  // 왼쪽 칸(92px)을 넘지 않게 자릿수가 길수록 글자를 줄임: "500" / "2,000" / "10,000"
  const amountSize = amount.length <= 3 ? 'text-[22px]' : amount.length <= 5 ? 'text-[19px]' : 'text-[16px]'
  const body = (
    <>
      <div className="flex w-[92px] shrink-0 flex-col items-center justify-center border-r-2 border-dashed border-q-line bg-point-yellow/30 px-1.5 py-4">
        <span className={`leading-none font-bold whitespace-nowrap text-point-red-dark ${amountSize}`}>
          {amount}
          <span className="text-[13px]">{discountType === 'AMOUNT' ? '원' : '%'}</span>
        </span>
        <span className="mt-1 text-[11px] font-medium text-point-red-dark">할인</span>
      </div>
      <div className="min-w-0 flex-1 px-4 py-3 text-left">
        <p className="truncate text-[15px] font-bold text-q-text">{title}</p>
        {lines.map((line, i) => (
          <p key={i} className="truncate text-xs text-q-muted">
            {line}
          </p>
        ))}
      </div>
      {action && <div className="flex shrink-0 items-center pr-3">{action}</div>}
    </>
  )
  const className = `flex w-full overflow-hidden rounded-2xl border border-q-line bg-white ${dimmed ? 'opacity-50' : ''}`
  return onClick ? (
    <button type="button" onClick={onClick} className={className} aria-label={`${title} ${discountText({ discountType, discountValue })}`}>
      {body}
    </button>
  ) : (
    <div className={className}>{body}</div>
  )
}
