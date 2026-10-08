import { useNavigate } from 'react-router-dom'
import { OWNER_ILLUST } from '@/features/owner/illustrations'

/** 손님이 + 를 눌렀을 때 (Figma 9:176 "숏폼 생성 - 불가") */
export function OwnerOnlyNotice() {
  const navigate = useNavigate()

  return (
    <div className="mx-auto flex h-full max-w-[430px] flex-col bg-white px-6 pt-[max(72px,env(safe-area-inset-top))] pb-[max(20px,env(safe-area-inset-bottom))]">
      <h1 className="text-center text-[26px] font-bold tracking-tight text-ink">우리 동네 손님과 잇-다</h1>
      <p className="mt-6 text-center text-[15px] leading-relaxed font-medium text-green-4">
        잇다에서는
        <br />
        사장님만 홍보 영상을
        <br />
        만들 수 있어요!
      </p>
      <img src={OWNER_ILLUST.videoEdit} alt="" className="mx-auto mt-8 h-[180px] w-auto object-contain" />
      <div className="mt-auto flex flex-col gap-2.5">
        <button
          type="button"
          onClick={() => navigate('/signup?role=OWNER')}
          className="h-[52px] rounded-xl bg-green-4 text-base font-bold text-white"
        >
          사장님으로 가입할래요
        </button>
        <button type="button" onClick={() => navigate(-1)} className="h-[52px] rounded-xl bg-green-1 text-base font-bold text-white">
          이전 화면으로 돌아갈래요
        </button>
      </div>
    </div>
  )
}
