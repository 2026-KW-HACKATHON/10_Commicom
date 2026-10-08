import { useEffect, useState, type ReactNode } from 'react'
import working1 from '@/assets/generation/pigeon-working-1.jpg'
import working2 from '@/assets/generation/pigeon-working-2.jpg'
import working3 from '@/assets/generation/pigeon-working-3.jpg'

/** 숏폼 만들기·영상 수정 공통 화면 조각 */

const WORKING = [working1, working2, working3]
const STAGES = ['가게 정보를 모으고 있어요', '홍보 대본을 쓰고 있어요', '목소리와 영상을 합치고 있어요']

/* ── 생성 대기 (Figma 9:518) ── */
export function StepWaiting({
  startedAt,
  failed,
  onCancel,
  onRetry,
  sub = '잠시 기다리시면\n내 가게 홍보 영상이 완성돼요!',
  note = '보통 수십 초 걸려요. 이 화면을 닫아도 만들기는 계속돼요.',
}: {
  startedAt: number
  failed: string | null
  onCancel: () => void
  onRetry: () => void
  sub?: string
  note?: string
}) {
  const [elapsed, setElapsed] = useState(() => Date.now() - startedAt)
  useEffect(() => {
    const id = setInterval(() => setElapsed(Date.now() - startedAt), 500)
    return () => clearInterval(id)
  }, [startedAt])
  const stage = Math.min(STAGES.length - 1, Math.floor(elapsed / 3500))
  const pigeon = Math.floor(elapsed / 2500) % WORKING.length

  return (
    <Screen hero={<Hero sub={failed ? '영상을 만들지 못했어요' : sub} />} next={failed ? { label: '다시 시도', onClick: onRetry } : undefined} prev={failed ? undefined : { label: '취소', onClick: onCancel, wide: true }}>
      {/* 일하는 비둘기 3장 (개발 → 디자인 → 서버, 2026-10-09 사용자 제공)을 차례로 */}
      <div className="relative mx-auto mt-2 size-[220px] overflow-hidden rounded-3xl bg-white ring-1 ring-q-line">
        {WORKING.map((src, i) => (
          <img key={src} src={src} alt="" className={`absolute inset-0 size-full object-cover transition-opacity duration-700 ${i === pigeon ? 'opacity-100' : 'opacity-0'}`} />
        ))}
      </div>
      {failed ? (
        <ErrorText>{failed}</ErrorText>
      ) : (
        <>
          <p className="mt-5 text-center text-[15px] font-bold text-green-4">{STAGES[stage]}...</p>
          <div className="mx-auto mt-3 h-1.5 w-48 overflow-hidden rounded-full bg-green-1">
            <div className="h-full rounded-full bg-green-4 transition-[width] duration-500" style={{ width: `${Math.min(95, (elapsed / 10000) * 100)}%` }} />
          </div>
          <p className="mt-3 text-center text-xs text-q-muted">{note}</p>
        </>
      )}
    </Screen>
  )
}

/* ── 공통 레이아웃 ── */

export function Hero({ sub, plain = false }: { sub: string; plain?: boolean }) {
  return (
    <div className="mb-8 text-center">
      {!plain && <h1 className="text-[26px] font-bold tracking-tight text-ink">우리 동네 손님과 잇-다</h1>}
      <p className={`whitespace-pre-line text-[15px] font-medium text-green-4 ${plain ? 'mt-10' : 'mt-4'}`}>{sub}</p>
    </div>
  )
}

interface ButtonSpec {
  label?: string
  onClick: () => void
  disabled?: boolean
  wide?: boolean
}

export function Screen({ hero, children, prev, next }: { hero?: ReactNode; children: ReactNode; prev?: ButtonSpec; next?: ButtonSpec }) {
  return (
    <>
      <div className="min-h-0 flex-1 overflow-y-auto px-6 pt-6 pb-4">
        {hero}
        {children}
      </div>
      {(prev || next) && (
        <div className="flex shrink-0 gap-2.5 px-4 pt-2 pb-[max(16px,env(safe-area-inset-bottom))]">
          {prev && (
            <button
              type="button"
              onClick={prev.onClick}
              className={`h-[52px] rounded-xl bg-q-panel text-base font-bold text-green-4 ${prev.wide || !next ? 'flex-1' : 'w-[42%]'}`}
            >
              {prev.label ?? '이전'}
            </button>
          )}
          {next && (
            <button
              type="button"
              onClick={next.onClick}
              disabled={next.disabled}
              className="h-[52px] flex-1 rounded-xl bg-green-4 text-base font-bold text-white transition-colors disabled:bg-green-1"
            >
              {next.label ?? '다음'}
            </button>
          )}
        </div>
      )}
    </>
  )
}

export function ErrorText({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="mt-2 text-center text-[13px] font-medium text-point-red-dark">
      {children}
    </p>
  )
}
