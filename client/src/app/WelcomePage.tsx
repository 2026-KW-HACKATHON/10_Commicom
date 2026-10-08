import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import pigeonWalk from '@/assets/map/pigeon-walk.png'
import pigeonGps from '@/assets/quest/pigeon-gps.png'
import logo from '@/assets/logo-itda.svg'
import { MODE_HOME, useModeStore, type AppMode } from '@/stores/modeStore'

const OPTIONS: { mode: AppMode; title: string; desc: string; points: string[]; image: string }[] = [
  {
    mode: 'USER',
    title: '손님으로 시작',
    desc: '우리 동네 가게를 구경하고 싶어요',
    points: ['동네 가게 숏폼·지도', '퀘스트로 비둘기 키우기', '레벨업하고 쿠폰 받기'],
    image: pigeonWalk,
  },
  {
    mode: 'OWNER',
    title: '사장님으로 시작',
    desc: '우리 가게를 알리고 싶어요',
    points: ['AI 홍보 영상 만들기', '퀘스트 가게 등록', '쿠폰 발행·정산'],
    image: pigeonGps,
  },
]

/** 앱 처음 실행 때 손님 / 사장님 선택 */
export function WelcomePage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const setMode = useModeStore((s) => s.setMode)
  const [picked, setPicked] = useState<AppMode | null>(null)

  const start = () => {
    if (!picked) return
    setMode(picked)
    // QR을 찍고 들어왔다가 온 경우 등 원래 가려던 곳으로 — 고른 모드의 화면일 때만
    const next = params.get('next')
    const nextFits = next?.startsWith('/') && next.startsWith('/owner') === (picked === 'OWNER')
    navigate(nextFits ? next! : MODE_HOME[picked], { replace: true })
  }

  return (
    <div className="mx-auto flex h-full max-w-[430px] flex-col bg-white px-6 pt-[max(48px,env(safe-area-inset-top))] pb-[max(24px,env(safe-area-inset-bottom))]">
      <img src={logo} alt="잇다" className="h-[56px] w-fit" />
      <h1 className="mt-6 text-[26px] leading-snug font-bold text-ink">
        반가워요!
        <br />
        잇다를 어떻게 쓰실 건가요?
      </h1>
      <p className="mt-2 text-sm text-q-muted">나중에 설정에서 언제든 바꿀 수 있어요</p>

      <div role="radiogroup" aria-label="이용 모드" className="mt-7 flex flex-col gap-3">
        {OPTIONS.map((o) => {
          const active = picked === o.mode
          return (
            <button
              key={o.mode}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setPicked(o.mode)}
              className={`relative flex items-center gap-4 overflow-hidden rounded-3xl border-2 px-5 py-5 text-left transition-colors ${
                active ? 'border-green-6 bg-q-mint' : 'border-q-line bg-white'
              }`}
            >
              <span className="min-w-0 flex-1">
                <span className="block text-[19px] font-bold text-ink">{o.title}</span>
                <span className="mt-0.5 block text-[13px] text-q-muted">{o.desc}</span>
                <span className="mt-3 flex flex-wrap gap-1.5">
                  {o.points.map((p) => (
                    <span
                      key={p}
                      className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                        active ? 'bg-white text-green-6' : 'bg-q-panel text-q-sub'
                      }`}
                    >
                      {p}
                    </span>
                  ))}
                </span>
              </span>
              <img src={o.image} alt="" className="size-[84px] shrink-0 object-contain" />
              <span
                aria-hidden
                className={`absolute top-4 right-4 flex size-6 items-center justify-center rounded-full border-2 text-xs font-bold ${
                  active ? 'border-green-6 bg-green-6 text-white' : 'border-q-line bg-white text-transparent'
                }`}
              >
                ✓
              </span>
            </button>
          )
        })}
      </div>

      <button
        type="button"
        disabled={!picked}
        onClick={start}
        className="mt-auto h-[54px] w-full rounded-full bg-green-6 text-base font-bold text-white transition-opacity disabled:opacity-30"
      >
        {picked === 'OWNER' ? '사장님으로 시작하기' : picked === 'USER' ? '손님으로 시작하기' : '하나를 골라 주세요'}
      </button>
      <p className="mt-4 text-center text-[13px] text-q-muted">
        이미 계정이 있나요?{' '}
        <Link to="/login" className="font-bold text-green-6 underline">
          로그인
        </Link>
      </p>
    </div>
  )
}
