import type { ButtonHTMLAttributes, ReactNode } from 'react'
import feedBowl from '@/assets/quest/feed-bowl.png'
import feedSeed from '@/assets/quest/feed-seed.png'

export function ProgressBar({
  value,
  max,
  className = 'h-1.5',
}: {
  value: number
  max: number
  className?: string
}) {
  const percent = max > 0 ? Math.min(100, (value / max) * 100) : 0
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      className={`overflow-hidden rounded-full bg-q-track ${className}`}
    >
      <div className="h-full rounded-full bg-q-green transition-[width] duration-500" style={{ width: `${percent}%` }} />
    </div>
  )
}

/** 먹이(곡식) 아이콘 */
/** 먹이 1개 = 씨앗 한 알 */
export function FeedIcon({ className = 'size-6' }: { className?: string }) {
  return <img src={feedSeed} alt="" className={`object-contain ${className}`} />
}

/** 먹이 여러 개(2개·보유 먹이) = 먹이 그릇 */
export function FeedBowlIcon({ className = 'size-10' }: { className?: string }) {
  return <img src={feedBowl} alt="" className={`object-contain ${className}`} />
}

export function SectionTitle({ title, aside }: { title: string; aside?: ReactNode }) {
  return (
    <div className="mb-2.5 flex items-end justify-between">
      <h2 className="text-[17px] font-bold text-q-text">{title}</h2>
      {aside && <span className="text-xs text-q-muted">{aside}</span>}
    </div>
  )
}

export function PrimaryButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className={`h-[44px] w-full rounded-full bg-q-green text-[15px] font-bold text-white transition-opacity disabled:opacity-40 ${props.className ?? ''}`}
    />
  )
}

export function OutlineButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className={`h-[44px] w-full rounded-full border border-q-green bg-white text-[15px] font-bold text-q-green ${props.className ?? ''}`}
    />
  )
}

const CONFETTI = [
  'left-[18%] top-[8%] bg-[#f5a623]',
  'left-[30%] top-[3%] bg-[#7b61c9]',
  'right-[22%] top-[5%] bg-[#7b61c9]',
  'right-[14%] top-[15%] bg-[#f5a623]',
  'left-[12%] top-[38%] bg-[#e8554e]',
  'right-[10%] top-[34%] bg-[#e8554e]',
]

/**
 * 축하 화면 공통 레이아웃 (Figma 3. 방문 인증 완료 / 4. 퀘스트 완료 / 6. 레벨업).
 * 헤더·하단 네비를 덮는 전체 화면.
 */
export function CelebrationScreen({
  image,
  title,
  subtitle,
  children,
  actions,
  compact = false,
}: {
  image: string
  title: ReactNode
  subtitle: ReactNode
  children?: ReactNode
  actions: ReactNode
  /** 아래 내용(카드 뽑기 등)이 클 때 이미지를 작게 */
  compact?: boolean
}) {
  const imageSize = compact ? 'size-[132px]' : 'size-[200px]'
  return (
    <div role="dialog" aria-modal className="fixed inset-0 z-50 flex justify-center bg-black/20">
      <div className={`flex h-full w-full max-w-[430px] flex-col overflow-y-auto bg-white px-8 ${compact ? 'pt-[max(32px,env(safe-area-inset-top))]' : 'pt-[max(56px,env(safe-area-inset-top))]'} pb-10`}>
        <div className={`relative mx-auto w-full max-w-[300px] ${compact ? 'mb-4' : 'mb-7'}`}>
          {CONFETTI.map((c) => (
            <span key={c} className={`absolute size-1.5 rounded-full ${c}`} />
          ))}
          <img src={image} alt="" className={`mx-auto ${imageSize} object-contain drop-shadow-md`} />
        </div>
        <h1 className="text-center text-[24px] font-bold text-q-green">{title}</h1>
        <div className="mt-1.5 text-center text-sm text-q-sub">{subtitle}</div>
        {children && <div className={compact ? 'mt-4' : 'mt-6'}>{children}</div>}
        <div className="mt-7 flex flex-col gap-2.5">{actions}</div>
      </div>
    </div>
  )
}
