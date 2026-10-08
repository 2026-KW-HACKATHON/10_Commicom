import { CouponCreateForm } from '@/features/owner/components/CouponCreateForm'
import { OwnerCoupons } from '@/features/owner/components/OwnerCoupons'
import { OwnerHome } from '@/features/owner/components/OwnerHome'
import { OwnerQuests } from '@/features/owner/components/OwnerQuests'
import { OwnerRedeem } from '@/features/owner/components/OwnerRedeem'
import { OwnerSettlement } from '@/features/owner/components/OwnerSettlement'
import { QuestStoreScreen } from '@/features/owner/components/QuestStoreScreen'
import { ProPlan } from '@/features/pro/components/ProPlan'

export const OwnerHomePage = () => <OwnerHome />
export const OwnerQuestsPage = () => <OwnerQuests />
export const OwnerCouponsPage = () => <OwnerCoupons />
export const CouponCreatePage = () => <CouponCreateForm />
export const OwnerRedeemPage = () => <OwnerRedeem />
export const OwnerSettlementPage = () => <OwnerSettlement />
export const QuestStorePage = () => <QuestStoreScreen />
export const ProPage = () => <ProPlan />
