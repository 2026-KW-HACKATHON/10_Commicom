import pigeonWalk from '@/assets/map/pigeon-walk.png'
import pigeonCheer from '@/assets/quest/pigeon-lv-10.png'
import { ConfettiBurst } from '@/shared/ui/Confetti'

/** 둥둥 떠다니는 이모티콘 (위치·크기·지연) */
const FLOATERS = [
  { e: '🕊️', c: 'top-[9%] left-[10%] text-2xl', d: '0s' },
  { e: '💚', c: 'top-[14%] right-[12%] text-xl', d: '.4s' },
  { e: '✨', c: 'top-[34%] left-[6%] text-lg', d: '.8s' },
  { e: '🕊️', c: 'top-[30%] right-[7%] text-xl', d: '1.1s' },
  { e: '💚', c: 'bottom-[28%] left-[9%] text-lg', d: '.6s' },
  { e: '✨', c: 'bottom-[30%] right-[10%] text-2xl', d: '.2s' },
]

/** 설정 서랍의 히든 메시지 */
export function HiddenMessage({ onClose }: { onClose: () => void }) {
  return (
    <div role="dialog" aria-modal aria-label="히든 메시지" className="fixed inset-0 z-[55] flex items-center justify-center px-6">
      <button type="button" aria-label="닫기" className="absolute inset-0 animate-[fade_.2s] bg-black/40" onClick={onClose} />

      <section className="relative w-full max-w-[350px] animate-[rise-center_.4s_cubic-bezier(.2,.9,.25,1.1)] overflow-hidden rounded-[32px] bg-gradient-to-b from-q-mint via-white to-white px-6 pt-8 pb-6 text-center shadow-[0_24px_60px_rgba(8,104,22,0.35)]">
        {FLOATERS.map((f, i) => (
          <span
            key={i}
            aria-hidden
            className={`absolute animate-[float_2.4s_ease-in-out_infinite] ${f.c}`}
            style={{ animationDelay: f.d }}
          >
            {f.e}
          </span>
        ))}

        <p className="relative text-xs font-bold tracking-[0.3em] text-q-green">SECRET MESSAGE</p>

        <div className="relative mx-auto mt-3 flex items-end justify-center">
          <img src={pigeonWalk} alt="" className="-mr-3 mb-1 h-[64px] w-auto -scale-x-100 object-contain" />
          <img src={pigeonCheer} alt="" className="h-[150px] w-auto animate-[float_2s_ease-in-out_infinite] object-contain drop-shadow-lg" />
          <img src={pigeonWalk} alt="" className="-ml-3 mb-1 h-[64px] w-auto object-contain" />
        </div>

        <h2 className="relative mt-4 text-[34px] leading-tight font-bold tracking-tight text-green-6">
          김나은
          <br />
          화이팅!
        </h2>
        <p className="relative mt-3 text-[15px] font-medium text-q-sub">
          잇다 비둘기들이 응원하고 있어요 💚
          <br />
          구구구~ 오늘도 최고! 🕊️✨
        </p>

        <button
          type="button"
          onClick={onClose}
          className="relative mt-6 h-12 w-full rounded-full bg-green-6 text-[15px] font-bold text-white shadow-[0_6px_14px_rgba(8,104,22,0.3)] transition-transform active:scale-95"
        >
          고마워 🕊️
        </button>
      </section>

      <ConfettiBurst />
    </div>
  )
}
