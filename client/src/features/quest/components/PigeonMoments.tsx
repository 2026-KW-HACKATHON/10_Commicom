import { useNavigate } from 'react-router-dom'
import { ConfettiBurst } from '@/shared/ui/Confetti'
import { PIGEON_BREEDS, PIGEON_EGG_IMAGE, type AlbumItem, type PigeonBreed } from '../schema'
import { CelebrationScreen, OutlineButton, PrimaryButton } from './QuestUi'

/** 알이 깨어남 — 어떤 종류 비둘기인지 공개 (Lv.10이 되면 이 모습) */
export function HatchScreen({ breed, onDone }: { breed: PigeonBreed; onDone: () => void }) {
  const b = PIGEON_BREEDS[breed]
  return (
    <CelebrationScreen
      image={b.image}
      title="알이 깨어났어요!"
      subtitle={
        <>
          <p className="text-[17px] font-bold text-q-text">
            {b.emoji} {b.name} 비둘기가 태어났어요
          </p>
          <p className="mt-1 text-xs text-q-muted">Lv.10까지 키우면 이렇게 {b.name} 비둘기의 모습이 돼요</p>
        </>
      }
      actions={
        <>
          <ConfettiBurst />
          <PrimaryButton onClick={onDone}>키우러 가기</PrimaryButton>
        </>
      }
    />
  )
}

/** Lv.10 졸업 — 앨범에 남고 새 알이 옴 */
export function GraduationScreen({ graduated, onDone }: { graduated: AlbumItem; onDone: () => void }) {
  const navigate = useNavigate()
  const b = PIGEON_BREEDS[graduated.breed]
  return (
    <CelebrationScreen
      image={b.image}
      title={`🎓 ${graduated.generation}번째 비둘기 졸업!`}
      subtitle={
        <>
          <p className="text-[17px] font-bold text-q-text">
            {b.emoji} {b.name} 비둘기와 {graduated.days}일을 함께했어요
          </p>
          {graduated.rewardCouponCount > 0 && (
            <p className="mt-1 text-xs text-q-muted">레벨업 쿠폰을 {graduated.rewardCouponCount}장 받았어요</p>
          )}
        </>
      }
      actions={
        <>
          <ConfettiBurst />
          <PrimaryButton onClick={onDone}>새 알 받기</PrimaryButton>
          <OutlineButton
            onClick={() => {
              onDone()
              navigate('/quest/album')
            }}
          >
            앨범에서 보기
          </OutlineButton>
        </>
      }
    >
      <div className="flex items-center gap-3 rounded-2xl bg-q-mint px-4 py-3">
        <img src={PIGEON_EGG_IMAGE} alt="" className="h-12 w-auto" />
        <p className="text-[13px] leading-relaxed text-q-sub">
          새 알이 도착했어요!
          <br />
          모은 먹이는 그대로 이어져요
        </p>
      </div>
    </CelebrationScreen>
  )
}
