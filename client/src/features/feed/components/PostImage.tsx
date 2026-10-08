import { useState, type ReactNode } from 'react'

/**
 * 게시물 사진 (AI 생성 이미지). 부모가 크기를 정함 (relative + 크기 필요).
 * 비율이 제각각이라 자르지 않고 통째로, 남는 곳은 같은 사진을 흐리게 깔아 채움. 없거나 못 불러오면 fallback
 */
export function PostImage({
  url,
  alt,
  frame,
  fallback,
}: {
  url: string | null | undefined
  alt: string
  /** 목업 샘플 사진: 위아래 검은 띠 안의 실제 그림 구간(0~1)만 보이게 확대 */
  frame?: { top: number; height: number }
  fallback?: ReactNode
}) {
  const [failed, setFailed] = useState(false)
  if (!url || failed) return <>{fallback ?? <div className="size-full bg-q-mint" />}</>
  if (frame) {
    return (
      <img
        src={url}
        alt={alt}
        onError={() => setFailed(true)}
        className="absolute left-1/2 max-w-none -translate-x-1/2"
        style={{ height: `${100 / frame.height}%`, top: `${(-100 * frame.top) / frame.height}%` }}
      />
    )
  }
  return (
    <>
      <img src={url} alt="" aria-hidden className="absolute inset-0 size-full scale-110 object-cover opacity-60 blur-2xl" />
      <img src={url} alt={alt} onError={() => setFailed(true)} className="relative size-full object-contain" />
    </>
  )
}
