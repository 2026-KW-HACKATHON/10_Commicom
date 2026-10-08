import { CouponCreateForm } from '@/features/owner/components/CouponCreateForm'
import { OwnerCoupons } from '@/features/owner/components/OwnerCoupons'
import { OwnerHome } from '@/features/owner/components/OwnerHome'
import { OwnerLoginGate } from '@/features/owner/components/OwnerLoginGate'
import { OwnerProfile } from '@/features/owner/components/OwnerProfile'
import { OwnerQuests } from '@/features/owner/components/OwnerQuests'
import { OwnerRedeem } from '@/features/owner/components/OwnerRedeem'
import { OwnerSettlement } from '@/features/owner/components/OwnerSettlement'
import { OwnerVideos } from '@/features/owner/components/OwnerVideos'
import { QuestStoreScreen } from '@/features/owner/components/QuestStoreScreen'
import { OWNER_ILLUST } from '@/features/owner/illustrations'
import { ProPlan } from '@/features/pro/components/ProPlan'

/** 로그인 전 안내 문구 */
const OWNER_GATE = {
  coupons: { image: OWNER_ILLUST.couponNew, title: '로그인하면 쿠폰을 관리할 수 있어요', description: '우리 가게 쿠폰을 발행하고\n발행한 쿠폰을 한눈에 볼 수 있어요' },
  couponNew: { image: OWNER_ILLUST.couponNew, title: '로그인하면 쿠폰을 발행할 수 있어요', description: '손님을 부르는 할인 쿠폰을\n직접 만들어 보세요' },
  redeem: { image: OWNER_ILLUST.coupon, title: '로그인하면 쿠폰을 사용 처리할 수 있어요', description: '손님이 보여 준 6자리 코드를 입력해\n쿠폰 사용을 처리해요' },
  settlement: { image: OWNER_ILLUST.coupon, title: '로그인하면 정산 내역을 볼 수 있어요', description: '달마다 쿠폰 사용 건수와\n잇다 수수료를 확인할 수 있어요' },
  quests: { image: OWNER_ILLUST.qr, title: '로그인하면 참여할 퀘스트를 고를 수 있어요', description: '우리 가게가 참여할 퀘스트를 고르면\n손님이 퀘스트를 하러 찾아와요' },
} as const

export const OwnerHomePage = () => <OwnerHome />

// 로그인해야 쓸 수 있는 화면은 OwnerLoginGate 로 감쌈 (로그인 전엔 안내만)
export const OwnerQuestsPage = () => (
  <OwnerLoginGate feature="quest" {...OWNER_GATE.quests}>
    <OwnerQuests />
  </OwnerLoginGate>
)
export const OwnerCouponsPage = () => (
  <OwnerLoginGate feature="coupon" {...OWNER_GATE.coupons}>
    <OwnerCoupons />
  </OwnerLoginGate>
)
export const CouponCreatePage = () => (
  <OwnerLoginGate feature="coupon" {...OWNER_GATE.couponNew}>
    <CouponCreateForm />
  </OwnerLoginGate>
)
export const OwnerRedeemPage = () => (
  <OwnerLoginGate feature="coupon" {...OWNER_GATE.redeem}>
    <OwnerRedeem />
  </OwnerLoginGate>
)
export const OwnerSettlementPage = () => (
  <OwnerLoginGate feature="coupon" {...OWNER_GATE.settlement}>
    <OwnerSettlement />
  </OwnerLoginGate>
)
export const QuestStorePage = () => <QuestStoreScreen />
export const ProPage = () => <ProPlan />
export const OwnerVideosPage = () => <OwnerVideos />
export const OwnerProfilePage = () => <OwnerProfile />
