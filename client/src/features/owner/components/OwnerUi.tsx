import type { ReactNode } from 'react'
import type { CouponStatus } from '@/features/coupon/schema'

export function OwnerCard({
  title,
  aside,
  children,
  className = '',
}: {
  title?: string
  aside?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={`rounded-2xl bg-white px-5 py-4 ${className}`}>
      {(title || aside) && (
        <header className="mb-3 flex items-center justify-between gap-2">
          {title && <h3 className="text-[16px] font-bold text-q-text">{title}</h3>}
          {aside}
        </header>
      )}
      {children}
    </section>
  )
}

export function CouponStatusBadge({ status }: { status: CouponStatus }) {
  const map = {
    ACTIVE: ['발행 중', 'bg-q-mint text-q-green'],
    STOPPED: ['중지', 'bg-q-panel text-q-muted'],
    SOLD_OUT: ['소진', 'bg-point-yellow/40 text-point-red-dark'],
  } as const
  const [label, className] = map[status]
  return <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${className}`}>{label}</span>
}

/** 사장님 화면 공통 배경 (연한 회녹색 위에 흰 카드) */
export function OwnerScreen({ children }: { children: ReactNode }) {
  return <div className="h-full overflow-y-auto bg-q-panel px-5 pt-4 pb-10">{children}</div>
}
