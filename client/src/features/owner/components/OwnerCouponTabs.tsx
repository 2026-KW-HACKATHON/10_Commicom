import { useSearchParams } from 'react-router-dom'
import { OwnerCoupons } from './OwnerCoupons'
import { OwnerSettlement } from './OwnerSettlement'

const VIEWS = [
  { key: 'coupons', label: '쿠폰 관리' },
  { key: 'settlement', label: '정산' },
] as const

/** 쿠폰 탭: 쿠폰 관리 / 정산을 위쪽 전환 버튼으로 (주소 ?view=settlement — 홈의 "정산 보기"에서 바로 열림) */
export function OwnerCouponTabs() {
  const [params, setParams] = useSearchParams()
  const view = params.get('view') === 'settlement' ? 'settlement' : 'coupons'

  return (
    <div className="flex h-full flex-col bg-q-panel">
      <div className="shrink-0 px-5 pt-4" role="tablist">
        <div className="grid grid-cols-2 rounded-full bg-white p-1 shadow-[0_2px_8px_rgba(8,104,22,0.06)]">
          {VIEWS.map((v) => (
            <button
              key={v.key}
              type="button"
              role="tab"
              aria-selected={view === v.key}
              onClick={() => setParams(v.key === 'coupons' ? {} : { view: v.key }, { replace: true })}
              className="h-9 rounded-full text-[14px] font-bold text-q-muted transition-colors aria-selected:bg-q-green aria-selected:text-white"
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>
      <div className="min-h-0 flex-1">{view === 'settlement' ? <OwnerSettlement /> : <OwnerCoupons />}</div>
    </div>
  )
}
