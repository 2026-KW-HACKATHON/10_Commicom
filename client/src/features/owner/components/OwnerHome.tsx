import { Link } from 'react-router-dom'
import { useOwnerCoupons, useSettlement } from '@/features/coupon/hooks'
import { untilText } from '@/features/coupon/schema'
import { useIsPro } from '@/features/pro/store'
import { useQuestSubscription } from '@/features/quest/hooks'
import { resetMockDb, USE_MOCK } from '@/mocks/db'
import { useMyStoreId, useMyStoreName } from '../hooks'
import { OWNER_ILLUST } from '../illustrations'
import { currentMonth } from '../date'
import { OwnerCard, OwnerScreen } from './OwnerUi'

/** 사장님 홈 — 우리 가게 현황과 바로가기 */
export function OwnerHome() {
  const storeId = useMyStoreId()
  const storeName = useMyStoreName()
  const { data: sub } = useQuestSubscription(storeId)
  const { data: coupons } = useOwnerCoupons(storeId)
  const { data: settlement } = useSettlement(storeId, currentMonth())
  const isPro = useIsPro()
  const questActive = sub?.status === 'ACTIVE'
  const activeCoupons = coupons?.filter((c) => c.status === 'ACTIVE') ?? []

  return (
    <OwnerScreen>
      <p className="text-[13px] text-q-muted">안녕하세요, 사장님</p>
      <h2 className="text-[24px] font-bold text-q-text">{storeName}</h2>

      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <StatusTile
          to="/owner/quest-store"
          label="퀘스트 가게"
          value={sub ? (questActive ? '운영 중' : '미등록') : '...'}
          sub={questActive && sub?.expiresAt ? untilText(sub.expiresAt) : '손님 방문을 늘려요'}
          on={questActive}
          image={OWNER_ILLUST.qr}
        />
        <StatusTile
          to="/owner/pro"
          label="잇다 PRO"
          value={isPro ? '이용 중' : '미구독'}
          sub={isPro ? '혜택 이용 중' : '숏폼 우선 노출'}
          on={isPro}
          image={OWNER_ILLUST.pro}
        />
      </div>

      {!questActive && sub && (
        <Link to="/owner/quest-store" className="mt-3 flex items-center gap-3 overflow-hidden rounded-2xl bg-q-green py-2 pr-4 pl-3 text-white">
          <img src={OWNER_ILLUST.qr} alt="" className="-my-1 h-[72px] w-auto object-contain drop-shadow" />
          <span className="flex-1">
            <span className="block text-[15px] font-bold">퀘스트 가게로 등록해 보세요</span>
            <span className="text-xs opacity-85">손님이 방문 인증하러 우리 가게에 와요</span>
          </span>
          <span className="text-xl">›</span>
        </Link>
      )}

      <OwnerCard title="이번 달 쿠폰" className="mt-3" aside={<Link to="/owner/settlement" className="text-xs font-medium text-q-green">정산 보기 ›</Link>}>
        <dl className="grid grid-cols-3 gap-2 text-center">
          <Stat label="발행 중" value={`${activeCoupons.length}종`} />
          <Stat label="사용" value={`${settlement?.usedCount ?? 0}건`} />
          <Stat label="손님 할인" value={`${(settlement?.totalDiscount ?? 0).toLocaleString()}원`} />
        </dl>
      </OwnerCard>

      <OwnerCard title="바로가기" className="mt-3">
        <div className="grid grid-cols-4 gap-2">
          <Shortcut to="/owner/redeem" image={OWNER_ILLUST.coupon} label="쿠폰 사용" />
          <Shortcut to="/owner/coupons/new" image={OWNER_ILLUST.couponNew} label="쿠폰 발행" />
          <Shortcut to="/owner/quest-store" image={OWNER_ILLUST.qr} label="방문 QR" />
          <Shortcut to="/owner/pro" image={OWNER_ILLUST.pro} label="PRO" />
        </div>
      </OwnerCard>

      {USE_MOCK && (
        <button
          type="button"
          onClick={() => {
            resetMockDb()
            localStorage.removeItem('itda-pro')
            window.location.reload()
          }}
          className="mx-auto mt-8 block text-xs text-q-muted underline"
        >
          목업 데이터 처음 상태로 되돌리기
        </button>
      )}
    </OwnerScreen>
  )
}

function StatusTile({
  to,
  label,
  value,
  sub,
  on,
  image,
}: {
  to: string
  label: string
  value: string
  sub: string
  on: boolean
  image: string
}) {
  return (
    <Link
      to={to}
      className={`relative overflow-hidden rounded-2xl px-4 pt-3.5 pb-3 ${on ? 'bg-q-green text-white' : 'bg-white text-q-text'}`}
    >
      <img src={image} alt="" className="absolute -right-2 -bottom-2 h-[66px] w-auto object-contain opacity-95" />
      <span className={`relative block text-xs ${on ? 'opacity-80' : 'text-q-muted'}`}>{label}</span>
      <span className="relative mt-0.5 block text-lg font-bold">{value}</span>
      <span className={`relative mt-3 block max-w-[62%] truncate text-[11px] leading-tight ${on ? 'opacity-85' : 'text-q-muted'}`}>{sub} ›</span>
    </Link>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-q-panel py-2.5">
      <dt className="text-[11px] text-q-muted">{label}</dt>
      <dd className="text-[15px] font-bold text-q-text">{value}</dd>
    </div>
  )
}

function Shortcut({ to, image, label }: { to: string; image: string; label: string }) {
  return (
    <Link to={to} className="flex flex-col items-center gap-1 rounded-xl py-2 active:bg-q-panel">
      <span aria-hidden className="flex size-14 items-center justify-center rounded-2xl bg-q-mint">
        <img src={image} alt="" className="size-12 object-contain" />
      </span>
      <span className="text-xs font-medium text-q-sub">{label}</span>
    </Link>
  )
}
