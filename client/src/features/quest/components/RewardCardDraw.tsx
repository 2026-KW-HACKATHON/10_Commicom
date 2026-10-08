import { useEffect, useState } from 'react'
import { LEVEL_TABLE, type LevelUp } from '../schema'
import { FeedIcon } from './QuestUi'

type Kind = 'FEED1' | 'FEED2' | 'COUPON'
type Phase = 'intro' | 'flipping' | 'shuffling' | 'pick' | 'reveal-picked' | 'reveal-all'

const KINDS: Kind[] = ['FEED1', 'FEED2', 'COUPON']
const CARD_W = 96
const CARD_H = 132
const GAP = 12
const SHUFFLE_STEPS = 8
/** 처음에 어떤 보상이 있는지 보여주는 시간 */
const INTRO_MS = 3500

/** 서버가 정한 보상 → 카드 종류 (쿠폰 풀이 비어 먹이로 대체된 경우도 그대로 먹이 카드) */
function kindOf(reward: LevelUp['reward']): Kind {
  if (reward.type === 'COUPON') return 'COUPON'
  return reward.feedAmount >= 2 ? 'FEED2' : reward.feedAmount === 1 ? 'FEED1' : 'COUPON'
}

/**
 * 레벨업 보상 뽑기 연출: 3장(먹이 1 / 먹이 2 / 쿠폰) 공개 → 뒤집기 → 섞기 → 한 장 고르기 → 공개.
 * 결과는 서버 응답(levelUp.reward)으로 이미 정해져 있고, 고른 카드에 그 결과를 보여줌.
 */
export function RewardCardDraw({ levelUp, onRevealed }: { levelUp: LevelUp; onRevealed: () => void }) {
  const odds = LEVEL_TABLE[levelUp.fromLevel]
  const [phase, setPhase] = useState<Phase>('intro')
  // slots[cardId] = 왼쪽부터 몇 번째 자리인지
  const [slots, setSlots] = useState([0, 1, 2])
  // faces[cardId] = 카드 앞면 내용
  const [faces, setFaces] = useState<Kind[]>(KINDS)
  const [picked, setPicked] = useState<number | null>(null)

  // intro → flipping → shuffling → pick
  useEffect(() => {
    if (phase === 'intro') {
      const t = setTimeout(() => setPhase('flipping'), INTRO_MS)
      return () => clearTimeout(t)
    }
    if (phase === 'flipping') {
      const t = setTimeout(() => setPhase('shuffling'), 650)
      return () => clearTimeout(t)
    }
    if (phase === 'shuffling') {
      let step = 0
      let done: ReturnType<typeof setTimeout> | undefined
      const id = setInterval(() => {
        step += 1
        setSlots((prev) => shuffleDifferent(prev))
        if (step >= SHUFFLE_STEPS) {
          clearInterval(id)
          done = setTimeout(() => setPhase('pick'), 320)
        }
      }, 260)
      return () => {
        clearInterval(id)
        clearTimeout(done)
      }
    }
    if (phase === 'reveal-picked') {
      const t = setTimeout(() => setPhase('reveal-all'), 1000)
      return () => clearTimeout(t)
    }
    if (phase === 'reveal-all') {
      const t = setTimeout(onRevealed, 450)
      return () => clearTimeout(t)
    }
    // onRevealed는 부모가 매 렌더 새로 만들 수 있어 의존성에서 제외
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  const pick = (cardId: number) => {
    if (phase !== 'pick') return
    const won = kindOf(levelUp.reward)
    const rest = KINDS.filter((k) => k !== won)
    if (Math.random() < 0.5) rest.reverse()
    const next: Kind[] = []
    next[cardId] = won
    ;[0, 1, 2].filter((id) => id !== cardId).forEach((id, i) => (next[id] = rest[i]))
    setFaces(next)
    setPicked(cardId)
    setPhase('reveal-picked')
  }

  const isFaceUp = (cardId: number) =>
    phase === 'intro' || phase === 'reveal-all' || (phase === 'reveal-picked' && cardId === picked)

  const guide = {
    intro: '이 중 하나가 나와요!',
    flipping: '카드를 뒤집는 중...',
    shuffling: '섞는 중...',
    pick: '카드를 한 장 골라 주세요',
    'reveal-picked': '두근두근...',
    'reveal-all': picked !== null && faces[picked] === 'COUPON' ? '🎉 쿠폰 당첨!' : '보상을 받았어요!',
  }[phase]

  return (
    <div className="text-center">
      <p className={`text-[15px] font-bold ${phase === 'pick' ? 'animate-pulse text-q-green' : 'text-q-text'}`}>{guide}</p>
      {phase === 'intro' && (
        // 곧 카드를 섞는다는 걸 알려주는 줄어드는 막대
        <div className="mx-auto mt-2 h-1 w-24 overflow-hidden rounded-full bg-q-track">
          <div className="h-full origin-left rounded-full bg-q-green" style={{ animation: `shrink ${INTRO_MS}ms linear forwards` }} />
        </div>
      )}

      <div className="relative mx-auto mt-4" style={{ width: CARD_W * 3 + GAP * 2, height: CARD_H + 16, perspective: 900 }}>
        {[0, 1, 2].map((cardId) => {
          const faceUp = isFaceUp(cardId)
          const isPicked = picked === cardId
          const dimmed = phase === 'reveal-all' && !isPicked
          const lift = phase === 'shuffling' ? -10 : isPicked && phase.startsWith('reveal') ? -8 : 0
          return (
            <button
              key={cardId}
              type="button"
              disabled={phase !== 'pick'}
              aria-label={`${slots[cardId] + 1}번째 카드`}
              onClick={() => pick(cardId)}
              className={`group absolute top-2 left-0 ${phase === 'pick' ? 'cursor-pointer' : ''}`}
              style={{
                width: CARD_W,
                height: CARD_H,
                transform: `translate(${slots[cardId] * (CARD_W + GAP)}px, ${lift}px) scale(${isPicked && phase.startsWith('reveal') ? 1.06 : 1})`,
                transition: 'transform 260ms cubic-bezier(.3,.7,.3,1)',
                zIndex: isPicked ? 2 : 1,
              }}
            >
              <span
                className="relative block size-full transition-transform duration-500 group-enabled:group-hover:-translate-y-1"
                style={{ transformStyle: 'preserve-3d', transform: `rotateY(${faceUp ? 0 : 180}deg)` }}
              >
                <CardFront
                  kind={faces[cardId]}
                  odds={phase === 'intro' ? oddsText(faces[cardId], odds) : null}
                  reward={isPicked ? levelUp.reward : null}
                  highlight={isPicked && phase.startsWith('reveal')}
                  dimmed={dimmed}
                />
                <CardBack pickable={phase === 'pick'} />
              </span>
            </button>
          )
        })}
      </div>

      {phase === 'intro' && (
        // 기다리기 싫은 사람은 바로 섞기 (누르면 공개 시간 타이머는 phase가 바뀌며 취소됨)
        <button
          type="button"
          onClick={() => setPhase('flipping')}
          className="mt-3 inline-flex h-10 items-center gap-1.5 rounded-full bg-green-6 px-5 text-sm font-bold text-white shadow-[0_4px_10px_rgba(8,104,22,0.3)] transition-transform active:scale-95"
        >
          카드 바로 섞기
        </button>
      )}
    </div>
  )
}

function CardFront({
  kind,
  odds,
  reward,
  highlight,
  dimmed,
}: {
  kind: Kind
  odds: string | null
  reward: LevelUp['reward'] | null
  highlight: boolean
  dimmed: boolean
}) {
  const coupon = kind === 'COUPON'
  return (
    <span
      className={`absolute inset-0 flex flex-col items-center justify-center rounded-2xl border-2 px-1.5 transition-opacity duration-300 ${
        coupon ? 'border-point-orange bg-point-yellow/25' : 'border-mint-line bg-white'
      } ${highlight ? 'shadow-[0_0_0_4px_rgba(60,179,113,0.35),0_10px_24px_rgba(8,104,22,0.25)]' : 'shadow-sm'} ${
        dimmed ? 'opacity-45' : ''
      }`}
      style={{ backfaceVisibility: 'hidden' }}
    >
      {highlight && (
        <span className="absolute -top-2.5 rounded-full bg-green-6 px-2 py-0.5 text-[10px] font-bold text-white">내 선택</span>
      )}
      {kind === 'FEED1' && <FeedIcon className="size-10" />}
      {kind === 'FEED2' && (
        <span className="flex -space-x-3">
          <FeedIcon className="size-9" />
          <FeedIcon className="size-9" />
        </span>
      )}
      {coupon && <span className="text-[34px] leading-none">🎟</span>}
      <span className={`mt-2 text-[14px] font-bold ${coupon ? 'text-point-red-dark' : 'text-q-text'}`}>
        {kind === 'FEED1' ? '먹이 1개' : kind === 'FEED2' ? '먹이 2개' : '쿠폰'}
      </span>
      {odds && <span className="mt-0.5 text-[11px] text-q-muted">{odds}</span>}
      {reward?.type === 'COUPON' && reward.userCoupon && (
        <span className="mt-1 line-clamp-2 text-[10px] leading-tight text-q-sub">
          {reward.userCoupon.storeName}
          <br />
          {reward.userCoupon.title}
        </span>
      )}
    </span>
  )
}

function CardBack({ pickable }: { pickable: boolean }) {
  return (
    <span
      className={`absolute inset-0 flex items-center justify-center overflow-hidden rounded-2xl border-2 border-white bg-gradient-to-br from-green-4 to-green-6 shadow-md ${
        pickable ? 'ring-2 ring-mint-line ring-offset-2' : ''
      }`}
      style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
    >
      <span className="absolute inset-2 rounded-xl border border-dashed border-white/40" />
      <span className="text-[38px] font-bold text-white/90 drop-shadow">?</span>
    </span>
  )
}

function oddsText(kind: Kind, odds: (typeof LEVEL_TABLE)[number] | undefined) {
  if (!odds) return null
  const p = kind === 'FEED1' ? odds.feed1 : kind === 'FEED2' ? odds.feed2 : odds.coupon
  return `확률 ${Number((p * 100).toFixed(1))}%`
}

/** 이전과 다른 자리 배치로 섞기 */
function shuffleDifferent(prev: number[]) {
  for (;;) {
    const next = [...prev]
    for (let i = next.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[next[i], next[j]] = [next[j], next[i]]
    }
    if (next.some((v, i) => v !== prev[i])) return next
  }
}
