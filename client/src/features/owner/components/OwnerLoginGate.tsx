import type { ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { PrimaryButton } from '@/features/quest/components/QuestUi'
import { useStoreManageAccess } from '../hooks'
import { OwnerScreen } from './OwnerUi'

/**
 * 로그인해야 쓸 수 있는 사장님 화면 (쿠폰·정산·퀘스트 참여 등 서버가 로그인을 요구하는 화면).
 * 로그인 전(시연용으로 열어 둔 사장님 모드)이면 데이터를 부르지 않고 로그인 안내를 보여 줌 — 기능이 목업이면 그냥 보여 줌
 */
export function OwnerLoginGate({
  feature,
  image,
  title,
  description,
  children,
}: {
  feature: 'coupon' | 'quest'
  image: string
  title: string
  description: string
  children: ReactNode
}) {
  const access = useStoreManageAccess(feature)
  const { pathname } = useLocation()
  const navigate = useNavigate()

  if (access.pending) {
    return (
      <OwnerScreen>
        <div className="h-60 animate-pulse rounded-2xl bg-white" />
      </OwnerScreen>
    )
  }
  if (access.canManage) return children

  return (
    <div className="flex h-full flex-col bg-q-panel px-5 pt-4 pb-4">
      <section className="flex flex-1 flex-col items-center justify-center rounded-3xl bg-white px-6 py-8 text-center">
        <img src={image} alt="" className="h-[150px] w-auto object-contain drop-shadow" />
        <p className="mt-5 text-[20px] font-bold text-q-text">{title}</p>
        <p className="mt-2 text-[14px] leading-relaxed whitespace-pre-line text-q-muted">{description}</p>
      </section>
      <div className="mt-4 flex flex-col gap-2">
        <PrimaryButton onClick={() => navigate(`/login?next=${encodeURIComponent(pathname)}`)}>사장님 계정으로 로그인</PrimaryButton>
        <Link to="/signup?role=OWNER" className="py-2 text-center text-[13px] text-q-muted underline">
          아직 계정이 없어요 · 사장님으로 가입하기
        </Link>
      </div>
    </div>
  )
}

