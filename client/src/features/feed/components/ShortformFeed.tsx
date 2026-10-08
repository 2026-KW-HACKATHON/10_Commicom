import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import guideScrap from '@/assets/feed/guide-scrap.png'
import guideSwipe from '@/assets/feed/guide-swipe.png'
import pigeonUploaded from '@/assets/generation/pigeon-uploaded.png'
import { StoreCouponSheet } from '@/features/coupon/components/StoreCouponSheet'
import { useStores } from '@/features/map/hooks'
import { useQuestEvent } from '@/features/quest/hooks'
import { useShortformFeed } from '../hooks'
import type { Shortform } from '../schema'
import { ShortformItem } from './ShortformItem'

/**
 * 게시물 피드 — 위아래로 넘기면 한 장씩 딱 맞춰 멈춤 (한 장 = 인스타그램식 사진 게시물, ShortformItem).
 * storeId: 지도 "홍보 게시물 보기"로 들어오면 그 가게 게시물부터. startId: 스크랩 목록에서 고른 게시물부터.
 */
export function ShortformFeed({ storeId, startId }: { storeId?: number; startId?: number }) {
  const { data: items, isLoading, isError, hasNextPage, isFetchingNextPage, fetchNextPage } = useShortformFeed(storeId)
  const { data: stores } = useStores()
  const navigate = useNavigate()
  const containerRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [couponFor, setCouponFor] = useState<Shortform | null>(null)
  // 퀘스트 "게시물 5개 보기": 넘기다 스친 게시물은 빼고 2초 이상 본 게시물만 셈
  useQuestEvent('SHORTFORM_VIEW', items?.[activeIndex]?.shortformId, 2000)

  // 화면에 60% 이상 보이는 게시물을 "지금 게시물"로
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

  if (isLoading) return <div className="h-full animate-pulse bg-q-panel" />
  if (isError || !items) return <Message>게시물을 불러오지 못했어요</Message>
  if (items.length === 0) return <Message>아직 올라온 게시물이 없어요</Message>

  const couponCount = (id: number) => stores?.find((s) => s.storeId === id)?.availableCouponCount ?? 0

  return (
    <div className="relative h-full bg-white">
      <div ref={containerRef} className="h-full snap-y snap-mandatory overflow-y-auto overscroll-contain [scrollbar-width:none]">
        {items.map((item, i) => (
          <div key={item.shortformId} data-index={i} className="h-full snap-start snap-always">
            <ShortformItem item={item} couponCount={couponCount(item.storeId)} onOpenCoupons={() => setCouponFor(item)} />
          </div>
        ))}
        {/* 다음 묶음이 있으면 마지막에 불러오는 중 한 장 */}
        {hasNextPage && (
          <div className="flex h-full snap-start items-center justify-center text-sm text-q-muted">
            <span className="flex items-center gap-2">
              <span className="size-4 animate-spin rounded-full border-2 border-q-line border-t-green-4" />
              다음 게시물을 불러오는 중...
            </span>
          </div>
        )}
        {/* 더 받을 게시물이 없으면 끝 카드 (그냥 멈춘 것처럼 보이지 않게) */}
        {!hasNextPage && (
          <div className="flex h-full snap-start flex-col items-center justify-center bg-q-panel px-8 text-center text-ink">
            <img src={pigeonUploaded} alt="" className="h-[150px] w-auto object-contain" />
            <p className="mt-5 text-[20px] font-bold">게시물을 다 봤어요!</p>
            <p className="mt-1.5 text-[14px] text-q-muted">
              {storeId ? '이 가게 게시물은 여기까지예요' : `동네 가게 게시물 ${items.length}개를 모두 구경했어요`}
            </p>
            <div className="mt-7 flex w-full max-w-[280px] flex-col gap-2.5">
              <button
                type="button"
                onClick={() => containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
                className="h-12 rounded-full bg-green-4 text-[15px] font-bold text-white"
              >
                처음부터 다시 보기
              </button>
              <button type="button" onClick={() => navigate('/map')} className="h-12 rounded-full bg-white text-[15px] font-bold text-green-6">
                지도에서 가게 둘러보기
              </button>
            </div>
          </div>
        )}
      </div>

      <FeedGuide />

      {couponFor && (
        <StoreCouponSheet storeId={couponFor.storeId} storeName={couponFor.storeName} onClose={() => setCouponFor(null)} />
      )}
    </div>
  )
}

const GUIDE_KEY = 'itda-feed-guide-seen'

/** 처음 한 번만: 피드 사용법 안내 (넘기기·스크랩). 누르면 닫힘 */
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
      className="absolute inset-0 z-20 flex animate-[fade_.3s] flex-col items-center justify-center gap-7 bg-black/65 px-8 text-white"
    >
      {/* 아이콘: 2026-10-09 사용자 제공 */}
      <GuideRow icon={guideSwipe} motion="animate-[guide-swipe_1.6s_ease-in-out_infinite]" title="위로 넘기면 다음 게시물" sub="동네 가게 게시물을 하나씩 구경해요" />
      <GuideRow icon={guideScrap} title="마음에 들면 스크랩" sub="사진 아래 버튼으로 스크랩·위치·공유, 쿠폰도 바로 받아요" />
      <span className="mt-2 rounded-full bg-white px-6 py-2.5 text-[15px] font-bold text-ink">알겠어요</span>
    </button>
  )
}

function GuideRow({ icon, motion = '', title, sub }: { icon: string; motion?: string; title: string; sub: string }) {
  return (
    <span className="flex w-full max-w-[290px] items-center gap-4 text-left">
      <img src={icon} alt="" className={`size-16 shrink-0 object-contain drop-shadow-lg ${motion}`} />
      <span>
        <span className="block text-[17px] font-bold">{title}</span>
        <span className="block text-[13px] break-keep text-white/75">{sub}</span>
      </span>
    </span>
  )
}

function Message({ children }: { children: string }) {
  return <div className="flex h-full items-center justify-center bg-q-panel text-sm text-q-muted">{children}</div>
}
