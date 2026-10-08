import { useEffect, useRef, useState } from 'react'
import { StoreCouponSheet } from '@/features/coupon/components/StoreCouponSheet'
import { useStores } from '@/features/map/hooks'
import { useShortforms } from '../hooks'
import type { Shortform } from '../schema'
import { ShortformItem } from './ShortformItem'

/**
 * 숏폼 피드 — 위아래로 넘기면 한 장씩 딱 맞춰 멈추고, 화면에 보이는 영상만 재생.
 * storeId: 지도 "홍보 영상 보기"로 들어오면 그 가게 영상부터. startId: 스크랩 목록에서 고른 영상부터.
 */
export function ShortformFeed({ storeId, startId }: { storeId?: number; startId?: number }) {
  const { data: items, isLoading, isError } = useShortforms(storeId)
  const { data: stores } = useStores()
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

  // 스크랩 목록에서 고른 영상으로 바로 이동
  useEffect(() => {
    if (!startId || !items) return
    const index = items.findIndex((s) => s.shortformId === startId)
    if (index > 0) containerRef.current?.querySelector(`[data-index="${index}"]`)?.scrollIntoView()
  }, [startId, items])

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
      </div>

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

function Message({ children }: { children: string }) {
  return <div className="flex h-full items-center justify-center bg-neutral-900 text-sm text-white/70">{children}</div>
}
