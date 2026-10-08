import { useNavigate } from 'react-router-dom'
import pigeonUploaded from '@/assets/generation/pigeon-uploaded.png'
import pigeonCheer from '@/assets/quest/pigeon-lv-10.png'
import { ConfettiBurst } from '@/shared/ui/Confetti'
import { MODE_HOME } from '@/stores/modeStore'

const COPY = {
  RESIDENT: {
    badge: '손님으로 가입 완료',
    image: pigeonCheer,
    sub: '동네 가게 숏폼을 구경하고\n퀘스트로 내 비둘기를 키워 보세요',
    chips: ['🎬 동네 숏폼', '🗺 가게 지도', '🕊 비둘기 키우기'],
  },
  OWNER: {
    badge: '사장님으로 가입 완료',
    image: pigeonUploaded,
    sub: 'AI 홍보 영상으로\n우리 가게를 동네에 알려 보세요',
    chips: ['🎬 AI 홍보 영상', '🚩 퀘스트 가게', '🎟 쿠폰 발행'],
  },
} as const

/** 회원가입 완료 (Figma 3:595 "○○ 님, 반가워요!") — 비둘기 + 타이틀 폰트 + 할 수 있는 것 */
export function SignupWelcome({ role, name }: { role: 'RESIDENT' | 'OWNER'; name: string }) {
  const navigate = useNavigate()
  const c = COPY[role]
  const owner = role === 'OWNER'

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden bg-gradient-to-b from-[#fef9f3] via-[#f4f6ea] to-[#e0e5cf] px-6 pt-[max(40px,env(safe-area-inset-top))] pb-[max(20px,env(safe-area-inset-bottom))]">
      <div className="my-auto flex flex-col items-center text-center">
        <span className="animate-[rise-center_.4s_ease-out] rounded-full bg-green-6 px-3.5 py-1.5 text-[13px] font-bold text-white shadow-[0_4px_12px_rgba(8,104,22,0.25)]">
          {c.badge}
        </span>

        <div className="relative mt-6">
          <ConfettiBurst />
          <img src={c.image} alt="" className="relative h-[200px] w-auto animate-[float_3s_ease-in-out_infinite] object-contain drop-shadow-[0_12px_18px_rgba(8,104,22,0.18)]" />
          {/* 발밑 그림자 */}
          <span aria-hidden className="mx-auto mt-1 block h-3 w-28 rounded-[50%] bg-green-6/10 blur-[2px]" />
        </div>

        <h1 className="mt-6 font-title text-[30px] leading-[1.35] text-green-6">
          <span className="break-keep">{name}</span> 님,
          <br />
          반가워요!
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed whitespace-pre-line text-q-sub">{c.sub}</p>

        <ul className="mt-6 flex flex-wrap justify-center gap-2">
          {c.chips.map((chip) => (
            <li key={chip} className="rounded-full border border-mint-line bg-white/80 px-3 py-1.5 text-[13px] font-bold text-green-6">
              {chip}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-2.5">
        {owner && (
          <button
            type="button"
            onClick={() => navigate('/create', { replace: true })}
            className="h-[52px] rounded-xl border-2 border-green-4 bg-white text-base font-bold text-green-4"
          >
            첫 홍보 영상 만들기
          </button>
        )}
        <button
          type="button"
          onClick={() => navigate(MODE_HOME[owner ? 'OWNER' : 'USER'], { replace: true })}
          className="h-[52px] rounded-xl bg-green-4 text-base font-bold text-white shadow-[0_6px_16px_rgba(60,179,113,0.35)]"
        >
          메인 화면으로 가기
        </button>
      </div>
    </div>
  )
}
