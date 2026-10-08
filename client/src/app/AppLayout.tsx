import pigeonCouponBox from '@/assets/user/pigeon-coupon-box.png'
import pigeonGrowth from '@/assets/user/pigeon-growth.png'
import pigeonQuest from '@/assets/user/pigeon-quest.png'
import { OWNER_ILLUST } from '@/features/owner/illustrations'
import { FlagNavIcon, MapNavIcon, PhotoNavIcon } from '@/shared/ui/icons'
import { AppShell, type TabItem } from './AppShell'
import type { MenuItem } from './SettingsDrawer'

export type { RouteHandle } from './AppShell'

const TABS: TabItem[] = [
  { to: '/', label: '피드', Icon: PhotoNavIcon, end: true },
  { to: '/map', label: '지도', Icon: MapNavIcon },
  { to: '/quest', label: '퀘스트', Icon: FlagNavIcon },
]

/** 로그인·스크랩·프로필 항목은 담당 팀원이 이어서 추가 */
const MENU: MenuItem[] = [
  { to: '/coupons', label: '내 쿠폰함', icon: '🎟', image: pigeonCouponBox },
  { to: '/quest', label: '내 비둘기·퀘스트', icon: '🕊', image: pigeonQuest },
  { to: '/quest/history', label: '성장 기록', icon: '📈', image: pigeonGrowth },
  { to: '/quest/album', label: '비둘기 앨범', icon: '🎓', image: pigeonQuest },
  { to: '/scraps', label: '스크랩한 게시물', icon: '🔖', image: OWNER_ILLUST.videoDownload },
]

/** 손님 모드: 숏폼 / 지도 / 퀘스트 */
export function AppLayout() {
  return <AppShell tabs={TABS} menuItems={MENU} />
}
