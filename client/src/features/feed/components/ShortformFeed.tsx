import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import pigeonUploaded from '@/assets/generation/pigeon-uploaded.png'
import { StoreCouponSheet } from '@/features/coupon/components/StoreCouponSheet'
import { useStores } from '@/features/map/hooks'
import { useShortformFeed } from '../hooks'
import type { Shortform } from '../schema'
import { ShortformItem } from './ShortformItem'

/**
 * 숏폼 피드 — 위아래로 넘기면 한 장씩 딱 맞춰 멈추고, 화면에 보이는 영상만 재생.
 * storeId: 지도 "홍보 영상 보기"로 들어오면 그 가게 영상부터. startId: 스크랩 목록에서 고른 영상부터.
 */
export function ShortformFeed({ storeId, startId }: { storeId?: number; startId?: number }) {
  const { data: items, isLoading, isError, hasNextPage, isFetchingNextPage, fetchNextPage } = useShortformFeed(storeId)
  const { data: stores } = useStores()
  const navigate = useNavigate()
  const containerRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  // 브라우저는 소리 있는 자동재생을 막아서 처음엔 음소거로 시작
  const [muted, setMuted] = useState(true)
  const [hintDone, setHintDone] = useState(false)
  const [couponFor, setCouponFor] = useState<Shortform | null>(null)

  // 화면에 60% 이상 보이는 영상을 "지금 영상"으로
  useEffect(() => {
    const root = containerRef.current
    if (!root || !items?.length) return
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveIndex(Number((entry.target as HTMLElement).dataset.index))
        }
      },
      { root, threshold: 0.6 },
    )
    root.querySelectorAll('[data-index]').forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [items])

  // 끝에서 두 번째 영상쯤 오면 다음 묶음을 미리 받기 (명세: 스와이프 중 다음 배치 미리 요청)
  useEffect(() => {
    if (items && activeIndex >= items.length - 2 && hasNextPage && !isFetchingNextPage) fetchNextPage()
  }, [activeIndex, items, hasNextPage, isFetchingNextPage, fetchNextPage])

  // 스크랩 목록 등에서 고른 영상으로 한 번만 이동 (뒤 페이지에 있으면 찾을 때까지 더 받음)
  const reachedStart = useRef(false)
  useEffect(() => {
    if (!startId || !items || reachedStart.current) return
    const index = items.findIndex((s) => s.shortformId === startId)
    if (index < 0) {
      if (hasNextPage && !isFetchingNextPage) fetchNextPage()
      else if (!hasNextPage) reachedStart.current = true
      return
    }
    reachedStart.current = true
    if (index > 0) containerRef.current?.querySelector(`[data-index="${index}"]`)?.scrollIntoView()
  }, [startId, items, hasNextPage, isFetchingNextPage, fetchNextPage])

  // PC에서는 ↑↓ 키로 넘기기
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const root = containerRef.current
      if (!root || (e.key !== 'ArrowDown' && e.key !== 'ArrowUp')) return
      e.preventDefault()
      root.scrollBy({ top: e.key === 'ArrowDown' ? root.clientHeight : -root.clientHeight, behavior: 'smooth' })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  if (isLoading) return <div className="h-full animate-pulse bg-neutral-900" />
  if (isError || !items) return <Message>영상을 불러오지 못했어요</Message>
  if (items.length === 0) return <Message>아직 올라온 영상이 없어요</Message>

  const couponCount = (id: number) => stores?.find((s) => s.storeId === id)?.availableCouponCount ?? 0

  return (
    <div className="relative h-full bg-black">
      <div ref={containerRef} className="h-full snap-y snap-mandatory overflow-y-auto overscroll-contain [scrollbar-width:none]">
        {items.map((item, i) => (
          <div key={item.shortformId} data-index={i} className="h-full snap-start snap-always">
            <ShortformItem
              item={item}
              active={i === activeIndex}
              muted={muted}
              onToggleMute={() => setMuted((m) => !m)}
              couponCount={couponCount(item.storeId)}
              onOpenCoupons={() => setCouponFor(item)}
            />
          </div>
        ))}
        {/* 다음 묶음이 있으면 마지막에 불러오는 중 한 장 */}
        {hasNextPage && (
          <div className="flex h-full snap-start items-center justify-center text-sm text-white/70">
            <span className="flex items-center gap-2">
              <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              다음 영상을 불러오는 중...
            </span>
          </div>
        )}
        {/* 더 받을 영상이 없으면 끝 카드 (그냥 멈춘 것처럼 보이지 않게) */}
        {!hasNextPage && (
          <div className="flex h-full snap-start flex-col items-center justify-center bg-neutral-900 px-8 pb-[var(--nav-h,0px)] text-center text-white">
            <img src={pigeonUploaded} alt="" className="h-[150px] w-auto object-contain" />
            <p className="mt-5 text-[20px] font-bold">영상을 다 봤어요!</p>
            <p className="mt-1.5 text-[14px] text-white/70">
              {storeId ? '이 가게 영상은 여기까지예요' : `동네 가게 영상 ${items.length}개를 모두 구경했어요`}
            </p>
            <div className="mt-7 flex w-full max-w-[280px] flex-col gap-2.5">
              <button
                type="button"
                onClick={() => containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
                className="h-12 rounded-full bg-green-4 text-[15px] font-bold"
              >
                처음부터 다시 보기
              </button>
              <button type="button" onClick={() => navigate('/map')} className="h-12 rounded-full bg-white/15 text-[15px] font-bold backdrop-blur">
                지도에서 가게 둘러보기
              </button>
            </div>
          </div>
        )}
      </div>

      <FeedGuide />

      {/* 음소거여도 계속 떠 있지 않고 잠깐 보였다가 사라짐 (이후엔 오른쪽 소리 버튼으로) */}
      {muted && !hintDone && (
        <button
          type="button"
          onClick={() => setMuted(false)}
          onAnimationEnd={() => setHintDone(true)}
          className="absolute top-[86px] left-1/2 z-10 -translate-x-1/2 animate-[hint-fade_3s_ease-in-out_forwards] rounded-full bg-black/45 px-3.5 py-1.5 text-xs font-bold text-white backdrop-blur-md"
        >
          🔇 눌러서 소리 켜기
        </button>
      )}

      {couponFor && (
        <StoreCouponSheet storeId={couponFor.storeId} storeName={couponFor.storeName} onClose={() => setCouponFor(null)} />
      )}
    </div>
  )
}

const GUIDE_KEY = 'itda-feed-guide-seen'

/** 처음 한 번만: 숏폼 조작법 안내 (넘기기·2배속). 누르면 닫힘 */
function FeedGuide() {
  const [open, setOpen] = useState(() => {
    try {
      return !localStorage.getItem(GUIDE_KEY)
    } catch {
      return false
    }
  })
  if (!open) return null
  const close = () => {
    try {
      localStorage.setItem(GUIDE_KEY, '1')
    } catch {
      // 다음에 또 보여도 괜찮음
    }
    setOpen(false)
  }

  return (
    <button
      type="button"
      onClick={close}
      aria-label="안내 닫기"
      className="absolute inset-0 z-20 flex animate-[fade_.3s] flex-col items-center justify-center gap-9 bg-black/65 px-8 text-white"
    >
      <GuideRow icon={<span className="block animate-[guide-swipe_1.6s_ease-in-out_infinite] text-[34px]">👆</span>} title="위로 넘기면 다음 영상" sub="동네 가게 영상을 하나씩 구경해요" />
      <GuideRow icon={<span className="block animate-[guide-press_1.6s_ease-in-out_infinite] text-[34px]">👇</span>} title="꾹 누르면 2배속" sub="누른 채 아래로 내리면 2배속 고정, 다시 올리면 해제" />
      <GuideRow icon={<span className="text-[30px]">🔖</span>} title="마음에 들면 스크랩" sub="오른쪽 버튼으로 스크랩·쿠폰·위치 보기" />
      <span className="mt-2 rounded-full bg-white px-6 py-2.5 text-[15px] font-bold text-ink">알겠어요</span>
    </button>
  )
}

function GuideRow({ icon, title, sub }: { icon: ReactNode; title: string; sub: string }) {
  return (
    <span className="flex w-full max-w-[300px] items-center gap-4 text-left">
      <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-white/15">{icon}</span>
      <span>
        <span className="block text-[17px] font-bold">{title}</span>
        <span className="block text-[13px] text-white/75">{sub}</span>
      </span>
    </span>
  )
}

function Message({ children }: { children: string }) {
  return <div className="flex h-full items-center justify-center bg-neutral-900 text-sm text-white/70">{children}</div>
}
