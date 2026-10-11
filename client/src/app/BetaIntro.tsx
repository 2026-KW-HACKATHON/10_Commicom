import { useState } from 'react'
import pigeonPhoto from '@/assets/generation/pigeon-uploaded.png'
import pigeonCoupon from '@/assets/owner/pigeon-coupon.png'
import pigeonEgg from '@/assets/quest/pigeon-egg.png'
import pigeonMap from '@/assets/quest/pigeon-gps.png'
import pigeon from '@/assets/quest/pigeon-lv-01.png'

const SEEN_KEY = 'itda-beta-intro-seen'

const TRY_LIST = [
  { image: pigeonPhoto, text: '피드에서 동네 가게 게시물 넘겨 보기' },
  { image: pigeonMap, text: '지도에서 가게 핀 눌러 보기' },
  { image: pigeonEgg, text: '퀘스트 하고 비둘기 먹이 주기 · 레벨업 뽑기' },
  { image: pigeonCoupon, text: '메뉴 → 사장님 모드에서 AI 게시물·쿠폰 만들기' },
]

function seen() {
  try {
    return localStorage.getItem(SEEN_KEY) === '1'
  } catch {
    return true
  }
}

/** 베타 체험을 시작하면 한 번 보여 주는 안내 (무엇을 해 볼 수 있는지) */
export function BetaIntro() {
  const [open, setOpen] = useState(() => !seen())
  if (!open) return null

  const close = () => {
    try {
      localStorage.setItem(SEEN_KEY, '1')
    } catch {
      // 저장 못 해도 이번엔 닫힘
    }
    setOpen(false)
  }

  return (
    <div role="dialog" aria-modal aria-label="베타 테스트 안내" className="fixed inset-0 z-[60] flex items-end justify-center bg-black/45">
      <div className="w-full max-w-[430px] animate-[rise_.25s_ease-out] rounded-t-[28px] bg-white px-6 pt-6 pb-[max(24px,env(safe-area-inset-bottom))]">
        <div className="flex items-center gap-3">
          <img src={pigeon} alt="" className="size-14 object-contain" />
          <div>
            <span className="rounded-full bg-green-6 px-2 py-0.5 text-[10px] font-bold tracking-wider text-white">BETA</span>
            <h2 className="mt-1 text-[20px] leading-tight font-bold text-ink">잇다 베타 테스트에 오신 걸 환영해요!</h2>
          </div>
        </div>
        <p className="mt-3 text-[13px] leading-relaxed text-q-sub">
          로그인 없이 모든 기능을 자유롭게 써 보세요. 체험 데이터는 <b className="text-ink">이 기기에만</b> 저장되고, 메뉴에서 언제든 처음부터
          다시 할 수 있어요.
        </p>

        <h3 className="mt-5 text-xs font-bold text-q-muted">이렇게 해 보세요</h3>
        <ul className="mt-2 flex flex-col gap-2">
          {TRY_LIST.map((item) => (
            <li key={item.text} className="flex items-center gap-3 rounded-2xl bg-q-panel py-2 pr-4 pl-2.5 text-[14px] font-medium text-ink">
              <span aria-hidden className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white">
                <img src={item.image} alt="" className="size-10 object-contain" />
              </span>
              {item.text}
            </li>
          ))}
        </ul>

        <button type="button" onClick={close} className="mt-6 h-[54px] w-full rounded-full bg-green-6 text-base font-bold text-white active:bg-green-6/90">
          체험 시작하기
        </button>
      </div>
    </div>
  )
}
