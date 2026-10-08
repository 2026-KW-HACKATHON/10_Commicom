/**
 * 9:16 영상 미리보기 — 검은 띠가 박힌 영상은 실제 그림 구간(frame)만 잘라 가운데에, 배경은 흐린 썸네일.
 * 피드(ShortformItem)와 같은 방식. 부모가 크기를 정함 (relative + 크기 필요)
 */
export function FramedVideo({
  videoUrl,
  posterUrl,
  frame,
}: {
  videoUrl: string
  posterUrl: string | null
  frame?: { top: number; height: number }
}) {
  const crop = (f: { top: number; height: number }) => ({ height: `${100 / f.height}%`, top: `${(-100 * f.top) / f.height}%` })
  return (
    <div className="absolute inset-0 overflow-hidden bg-black">
      {posterUrl && (
        <img
          src={posterUrl}
          alt=""
          aria-hidden
          className="absolute left-1/2 max-w-none -translate-x-1/2 scale-110 opacity-70 blur-2xl brightness-75"
          style={frame ? crop(frame) : { height: '100%', top: 0 }}
        />
      )}
      <div className="absolute inset-0 flex items-center">
        {frame ? (
          <span className="relative block w-full overflow-hidden" style={{ aspectRatio: `${9 / 16 / frame.height}` }}>
            <video src={videoUrl} poster={posterUrl ?? undefined} autoPlay muted loop playsInline className="absolute left-0 w-full max-w-none object-fill" style={crop(frame)} />
          </span>
        ) : (
          <video src={videoUrl} poster={posterUrl ?? undefined} autoPlay muted loop playsInline className="size-full object-cover" />
        )}
      </div>
    </div>
  )
}
