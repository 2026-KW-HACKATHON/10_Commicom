import { OWNER_ILLUST } from '@/features/owner/illustrations'
import { ChartNavIcon, FlagNavIcon, HomeNavIcon, ScanNavIcon, TicketNavIcon } from '@/shared/ui/icons'
import { AppShell, type TabItem } from './AppShell'
import type { MenuItem } from './SettingsDrawer'

const TABS: TabItem[] = [
  { to: '/owner', label: '홈', Icon: HomeNavIcon, end: true },
  { to: '/owner/quests', label: '퀘스트', Icon: FlagNavIcon },
  { to: '/owner/coupons', label: '쿠폰', Icon: TicketNavIcon },
  { to: '/owner/redeem', label: '사용 처리', Icon: ScanNavIcon },
  { to: '/owner/settlement', label: '정산', Icon: ChartNavIcon },
]

const MENU: MenuItem[] = [
  { to: '/owner/quest-store', label: '퀘스트 가게 · 방문 QR', icon: '📍', image: OWNER_ILLUST.qr },
  { to: '/owner/coupons/new', label: '쿠폰 발행', icon: '🎟', image: OWNER_ILLUST.couponNew },
  { to: '/owner/redeem', label: '쿠폰 사용 처리', icon: '✅', image: OWNER_ILLUST.coupon },
  { to: '/owner/pro', label: '잇다 PRO', icon: '⭐', image: OWNER_ILLUST.pro },
]

/**
 * 사장님 모드: 홈 / 퀘스트 / 쿠폰 / 사용 처리 / 정산.
 * TODO: 로그인 담당이 role(OWNER)을 authStore에 넣으면 사장님만 들어오게 막기 — 지금은 설정에서 전환.
 */
export function OwnerLayout() {
  return <AppShell tabs={TABS} menuItems={MENU} modeBadge="사장님" />
}
