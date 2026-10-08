import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { untilText } from '@/features/coupon/schema'
import { ConfettiBurst } from '@/shared/ui/Confetti'
import { pigeonImage, type LevelUp } from '../schema'
import { CelebrationScreen, OutlineButton, PrimaryButton } from './QuestUi'
import { RewardCardDraw } from './RewardCardDraw'

/**
 * 먹이 지급 API 응답의 levelUps[]를 순서대로 연출 (Figma 6. 레벨업 + 3-0 보상 뽑기).
 */
export function LevelUpSequence({ levelUps, onDone }: { levelUps: LevelUp[]; onDone: () => void }) {
  const [index, setIndex] = useState(0)
  const current = levelUps[index]
  if (!current) return null
  const isLast = index >= levelUps.length - 1

  return (
    <LevelUpStep
      key={index}
      levelUp={current}
      position={levelUps.length > 1 ? `${index + 1} / ${levelUps.length}` : null}
      isLast={isLast}
      onNext={() => (isLast ? onDone() : setIndex((i) => i + 1))}
    />
  )
}

/** 레벨업 축하 + 카드 뽑기 → 결과 */
function LevelUpStep({
  levelUp,
  position,
  isLast,
  onNext,
}: {
  levelUp: LevelUp
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
      image={pigeonImage(levelUp.toLevel)}
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
        {revealed && (
          <p
            role="status"
            className={`mt-2 animate-[rise-center_.3s_ease-out] rounded-2xl px-3 py-2.5 text-[13px] font-bold ${
              wonCoupon ? 'bg-point-yellow/30 text-point-red-dark' : 'bg-white text-q-green'
            }`}
          >
            {rewardResultText(reward)}
          </p>
        )}
      </div>
      {wonCoupon && <ConfettiBurst />}
    </CelebrationScreen>
  )
}

/** 결과 안내 문구 (카드 아래) */
function rewardResultText(reward: LevelUp['reward']) {
  if (reward.type === 'COUPON' && reward.userCoupon) {
    return `${reward.userCoupon.storeName} · ${reward.userCoupon.title} (${untilText(reward.userCoupon.expiresAt)}) — 쿠폰함에 담았어요`
  }
  if (reward.feedAmount > 0) return `먹이 ${reward.feedAmount}개를 획득했습니다 — 보유 먹이에 담았어요`
  return '최고 레벨 달성을 축하해요!'
}
