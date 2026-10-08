import { Link, useNavigate } from 'react-router-dom'
import pigeonWalk from '@/assets/map/pigeon-walk.png'
import { useLogout } from '@/features/auth/hooks'
import { canUseOwnerMode } from '@/features/auth/schema'
import { OwnerStoreRegister } from '@/features/owner/components/OwnerStoreRegister'
import { useMyStoreQuery } from '@/features/owner/hooks'
import { OWNER_ILLUST } from '@/features/owner/illustrations'
import { errorCode, errorMessage } from '@/shared/lib/error'
import { CreateNavIcon, FlagNavIcon, HomeNavIcon, ScanNavIcon, TicketNavIcon } from '@/shared/ui/icons'
import { useMe } from '@/stores/authStore'
import { useModeStore } from '@/stores/modeStore'
import { AppShell, type TabItem } from './AppShell'
import type { MenuItem } from './SettingsDrawer'

const TABS: TabItem[] = [
  { to: '/owner', label: '홈', Icon: HomeNavIcon, end: true },
  { to: '/owner/quests', label: '퀘스트', Icon: FlagNavIcon },
  // 피드 제작이 주 동작이라 가운데 (예전엔 우상단 + 로만 만들 수 있었음)
  { to: '/owner/create', label: '제작', Icon: CreateNavIcon },
  { to: '/owner/redeem', label: '사용 처리', Icon: ScanNavIcon },
  // 쿠폰 관리 + 정산
  { to: '/owner/coupons', label: '쿠폰', Icon: TicketNavIcon },
]

const MENU: MenuItem[] = [
  { to: '/owner/profile', label: '가게 정보 · 프로필', icon: '🏪', image: pigeonWalk },
  { to: '/owner/create', label: '피드 제작', icon: '🎬', image: OWNER_ILLUST.videoEdit },
  { to: '/owner/quest-store', label: '퀘스트 가게 · 방문 QR', icon: '📍', image: OWNER_ILLUST.qr },
  { to: '/owner/coupons/new', label: '쿠폰 발행', icon: '🎟', image: OWNER_ILLUST.couponNew },
  { to: '/owner/redeem', label: '쿠폰 사용 처리', icon: '✅', image: OWNER_ILLUST.coupon },
  { to: '/owner/pro', label: '잇다 PRO', icon: '⭐', image: OWNER_ILLUST.pro },
]

/**
 * 사장님 모드: 홈 / 퀘스트 / 쿠폰 / 사용 처리 / 정산.
 * 손님 계정으로 로그인했으면 들어오지 못하게 안내 (로그인 전에는 시연용으로 열어 둠).
 */
export function OwnerLayout() {
  const me = useMe()
  const myStore = useMyStoreQuery()
  if (!canUseOwnerMode(me)) return <OwnerAccountNotice nickname={me?.nickname ?? ''} />
  // 서버의 내 가게를 불러오는 동안엔 샘플 가게 화면이 잠깐 보이지 않게 기다림
  if (myStore.isLoading) return <div className="mx-auto h-full max-w-[430px] animate-pulse bg-white" />
  if (errorCode(myStore.error) === 'STORE404_2') return <OwnerStoreRegister />
  if (myStore.isError) {
    return (
      <div className="mx-auto flex h-full max-w-[430px] flex-col items-center justify-center gap-3 bg-white px-6 text-center">
        <p className="text-[15px] text-ink">{errorMessage(myStore.error, '내 가게 정보를 불러오지 못했어요')}</p>
        <button type="button" onClick={() => myStore.refetch()} className="h-11 rounded-xl bg-green-4 px-5 text-[14px] font-bold text-white">
          다시 불러오기
        </button>
      </div>
    )
  }
  return <AppShell tabs={TABS} menuItems={MENU} modeBadge="사장님" />
}

function OwnerAccountNotice({ nickname }: { nickname: string }) {
  const navigate = useNavigate()
  const setMode = useModeStore((s) => s.setMode)
  const logout = useLogout()

  return (
    <div className="mx-auto flex h-full max-w-[430px] flex-col items-center bg-white px-6 pt-[max(72px,env(safe-area-inset-top))] pb-[max(20px,env(safe-area-inset-bottom))] text-center">
      <img src={OWNER_ILLUST.pro} alt="" className="h-[150px] w-auto object-contain" />
      <h1 className="mt-6 text-[22px] font-bold text-ink">사장님 계정으로 이용해 주세요</h1>
      <p className="mt-2 text-[14px] leading-relaxed text-q-muted">
        지금은 손님 계정({nickname})으로 로그인되어 있어요.
        <br />
        사장님 화면은 사장님 계정만 쓸 수 있어요.
      </p>
      <div className="mt-auto flex w-full flex-col gap-2.5">
        <Link to="/signup?role=OWNER" className="flex h-[52px] items-center justify-center rounded-xl bg-green-4 text-base font-bold text-white">
          사장님으로 가입할래요
        </Link>
        <button
          type="button"
          onClick={() => {
            logout('로그아웃했어요 · 사장님 계정으로 로그인해 주세요')
            navigate('/login?next=/owner', { replace: true })
          }}
          className="h-[52px] rounded-xl bg-q-panel text-base font-bold text-green-4"
        >
          사장님 계정으로 로그인
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('USER')
            navigate('/', { replace: true })
          }}
          className="h-11 text-[14px] text-q-muted underline"
        >
          손님 화면으로 돌아가기
        </button>
      </div>
    </div>
  )
}
