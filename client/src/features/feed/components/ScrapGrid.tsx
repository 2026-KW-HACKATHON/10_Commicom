import { Link } from 'react-router-dom'
import { OWNER_ILLUST } from '@/features/owner/illustrations'
import { PlayIcon } from '@/shared/ui/icons'
import { useScrapStore, useShortforms } from '../hooks'

/** 스크랩 — 3열 영상 썸네일 (Figma 11:1426) */
export function ScrapGrid() {
  const ids = useScrapStore((s) => s.ids)
  const { data: items, isLoading } = useShortforms()
  const scrapped = ids.map((id) => items?.find((s) => s.shortformId === id)).filter((s) => s !== undefined)

  if (isLoading) return <div className="grid h-40 animate-pulse grid-cols-3 gap-0.5 bg-q-panel" />
  if (scrapped.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-8 text-center text-sm leading-relaxed text-q-muted">
        <img src={OWNER_ILLUST.videoDownload} alt="" className="mb-3 h-[110px] w-auto object-contain opacity-90" />
        아직 스크랩한 영상이 없어요.
        <br />
        숏폼에서 🔖 버튼을 눌러 마음에 드는 가게를 모아 보세요!
      </div>
    )
  }

  return (
    <ul className="grid h-full auto-rows-min grid-cols-3 gap-0.5 overflow-y-auto">
      {scrapped.map((s) => (
        <li key={s.shortformId}>
          <Link to={`/?start=${s.shortformId}`} className="relative block aspect-[9/13] overflow-hidden bg-q-mint">
            {s.posterUrl && (
              // 샘플 영상은 위아래 검은 띠가 있어 가운데 그림 구간만 보이게 확대
              <img
                src={s.posterUrl}
                alt=""
                className="absolute left-1/2 max-w-none -translate-x-1/2"
                style={s.frame ? { height: `${100 / s.frame.height}%`, top: `${(-100 * s.frame.top) / s.frame.height}%` } : { height: '100%', top: 0 }}
              />
            )}
            <span className="absolute top-1.5 right-1.5 flex size-6 items-center justify-center rounded-md bg-white/90 pl-0.5 text-q-text">
              <span className="scale-[0.35]">
                <PlayIcon />
              </span>
            </span>
            <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/70 to-transparent px-1.5 pt-4 pb-1 text-[11px] font-bold text-white">
              {s.storeName}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}
