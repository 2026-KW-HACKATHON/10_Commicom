import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { untilText } from '@/features/coupon/schema'
import { ConfettiBurst } from '@/shared/ui/Confetti'
import { pigeonImage, type LevelUp, type PigeonBreed } from '../schema'
import { CelebrationScreen, FeedBowlIcon, FeedIcon, OutlineButton, PrimaryButton } from './QuestUi'
import { RewardCardDraw } from './RewardCardDraw'

/**
 * 먹이 지급 API 응답의 levelUps[]를 순서대로 연출 (Figma 6. 레벨업 + 3-0 보상 뽑기).
 */
export function LevelUpSequence({
  levelUps,
  breed,
  onDone,
}: {
  levelUps: LevelUp[]
  /** Lv.10 이 되면 종류 비둘기 그림으로 */
  breed?: PigeonBreed | null
  onDone: () => void
}) {
  const [index, setIndex] = useState(0)
  const current = levelUps[index]
  if (!current) return null
  const isLast = index >= levelUps.length - 1

  return (
    <LevelUpStep
      key={index}
      levelUp={current}
      breed={breed ?? null}
      position={levelUps.length > 1 ? `${index + 1} / ${levelUps.length}` : null}
      isLast={isLast}
      onNext={() => (isLast ? onDone() : setIndex((i) => i + 1))}
    />
  )
}

/** 레벨업 축하 + 카드 뽑기 → 결과 */
function LevelUpStep({
  levelUp,
  breed,
  position,
  isLast,
  onNext,
}: {
  levelUp: LevelUp
  breed: PigeonBreed | null
  position: string | null
  isLast: boolean
  onNext: () => void
}) {
  const navigate = useNavigate()
  const [revealed, setRevealed] = useState(false)
  const { reward } = levelUp
  const wonCoupon = revealed && reward.type === 'COUPON' && reward.userCoupon

  return (
    <CelebrationScreen
      compact
      image={pigeonImage(levelUp.toLevel, breed)}
      title="비둘기 레벨업!"
      subtitle={
        <>
          <p className="text-[17px] font-bold text-q-text">
            Lv. {levelUp.fromLevel} → Lv. {levelUp.toLevel}
          </p>
          {position && <p className="mt-1 text-xs text-q-muted">레벨업 {position}</p>}
        </>
      }
      actions={
        revealed && (
          <>
            <PrimaryButton onClick={onNext}>{isLast ? '확인' : '다음 레벨업 뽑기'}</PrimaryButton>
            {wonCoupon && <OutlineButton onClick={() => navigate('/coupons')}>쿠폰함에서 보기</OutlineButton>}
          </>
        )
      }
    >
      <div className="rounded-3xl bg-q-panel px-3 pt-4 pb-3">
        <p className="mb-2 text-xs font-medium text-q-muted">레벨업 보상 뽑기</p>
        <RewardCardDraw levelUp={levelUp} onRevealed={() => setRevealed(true)} />
        {revealed && <RewardResult reward={reward} />}
      </div>
      {wonCoupon && <ConfettiBurst />}
    </CelebrationScreen>
  )
}

/** 뽑기 결과 (카드 아래): 아이콘 + 큰 글씨 보상 + 짧은 안내 */
function RewardResult({ reward }: { reward: LevelUp['reward'] }) {
  const coupon = reward.type === 'COUPON' ? reward.userCoupon : null
  const box = 'mt-2 flex animate-[rise-center_.3s_ease-out] items-center gap-3 rounded-2xl px-4 py-3 text-left'

  if (coupon) {
    return (
      <div role="status" className={`${box} border border-dashed border-point-orange bg-point-yellow/25`}>
        <span aria-hidden className="text-[30px] leading-none">🎟</span>
        <span className="min-w-0 flex-1">
          <span className="block text-[17px] font-bold text-point-red-dark">쿠폰 당첨!</span>
          <span className="block truncate text-[13px] font-bold text-q-text">
            {coupon.storeName} · {coupon.title}
          </span>
          <span className="block text-[11px] text-q-muted">{untilText(coupon.expiresAt)} · 쿠폰함에 넣어 뒀어요</span>
        </span>
      </div>
    )
  }
  if (reward.feedAmount > 0) {
    return (
      <div role="status" className={`${box} bg-white`}>
        {reward.feedAmount >= 2 ? <FeedBowlIcon className="h-10 w-11 shrink-0" /> : <FeedIcon className="size-10 shrink-0" />}
        <span className="flex-1">
          <span className="block text-[20px] leading-tight font-bold text-q-green">먹이 +{reward.feedAmount}</span>
          <span className="block text-[12px] text-q-muted">보유 먹이로 쏙! 비둘기에게 바로 줄 수 있어요</span>
        </span>
      </div>
    )
  }
  return (
    <div role="status" className={`${box} bg-white`}>
      <span aria-hidden className="text-[28px] leading-none">🏆</span>
      <span className="text-[16px] font-bold text-q-green">최고 레벨 달성을 축하해요!</span>
    </div>
  )
}
