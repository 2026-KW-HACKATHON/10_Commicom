import { useRef, useState, type ReactNode } from 'react'
import { PostImage } from './PostImage'

/**
 * 게시물 사진 여러 장을 옆으로 넘겨 봄 (AI 사진 1장 + 사장님 사진 최대 4장). 부모가 크기를 정함 (relative + 크기 필요).
 * 손가락으로 밀면 한 장씩 멈추고, PC에서는 좌우 화살표. 한 장이면 넘기기 없이 그대로
 */
export function PostCarousel({
  images,
  alt,
  frame,
  fallback,
}: {
  images: string[]
  alt: string
  /** 목업 샘플 사진: 첫 장만 해당 (feed/schema 의 frame) */
  frame?: { top: number; height: number }
  fallback?: ReactNode
}) {
  const listRef = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(0)

  if (images.length <= 1) return <PostImage url={images[0]} alt={alt} frame={frame} fallback={fallback} />

  const go = (to: number) => {
    const list = listRef.current
    if (!list) return
    list.scrollTo({ left: Math.max(0, Math.min(images.length - 1, to)) * list.clientWidth, behavior: 'smooth' })
  }

  return (
    <div className="group absolute inset-0">
      <div
        ref={listRef}
        onScroll={(e) => setIndex(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
        className="flex size-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none]"
        aria-roledescription="carousel"
      >
        {images.map((url, i) => (
          <div key={`${url}-${i}`} className="relative size-full shrink-0 snap-start snap-always overflow-hidden" aria-label={`${i + 1} / ${images.length}`}>
            <PostImage url={url} alt={i === 0 ? alt : `${alt} ${i + 1}`} frame={i === 0 ? frame : undefined} fallback={i === 0 ? fallback : undefined} />
          </div>
        ))}
      </div>

      <span className="pointer-events-none absolute top-3 right-3 rounded-full bg-black/45 px-2.5 py-0.5 text-[12px] font-bold text-white tabular-nums backdrop-blur-sm">
        {index + 1}/{images.length}
      </span>
      <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center gap-1.5" aria-hidden>
        {images.map((url, i) => (
          <span key={`${url}-${i}`} className={`size-1.5 rounded-full transition-colors ${i === index ? 'bg-white' : 'bg-white/45'}`} />
        ))}
      </div>

      {/* PC: 마우스를 올리면 좌우 화살표 */}
      {index > 0 && <ArrowButton side="left" onClick={() => go(index - 1)} />}
      {index < images.length - 1 && <ArrowButton side="right" onClick={() => go(index + 1)} />}
    </div>
  )
}

function ArrowButton({ side, onClick }: { side: 'left' | 'right'; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === 'left' ? '이전 사진' : '다음 사진'}
      className={`absolute top-1/2 ${side === 'left' ? 'left-2' : 'right-2'} hidden size-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-lg font-bold text-ink shadow group-hover:flex`}
    >
      {side === 'left' ? '‹' : '›'}
    </button>
  )
}
