import { useEffect, useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MAP_CATEGORIES } from '@/features/map/schema'
import { shareLink } from '@/shared/lib/share'
import { BookmarkIcon, LocationIcon, PlayIcon, ShareIcon, SoundIcon, TicketSmallIcon } from '@/shared/ui/icons'
import { toast } from '@/stores/toastStore'
import { useCanScrap, useIsScrapped, useToggleScrap } from '../hooks'
import type { Shortform } from '../schema'
import { useSpeedPress } from '../useSpeedPress'

interface Props {
  item: Shortform
  active: boolean
  muted: boolean
  onToggleMute: () => void
  couponCount: number
  onOpenCoupons: () => void
}

/** 숏폼 한 장 (Figma 3:203) — 영상 + 가게 정보 + 오른쪽 버튼 + 진행 바 */
export function ShortformItem({ item, active, muted, onToggleMute, couponCount, onOpenCoupons }: Props) {
  const navigate = useNavigate()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [paused, setPaused] = useState(false)
  const [progress, setProgress] = useState(0)
  const [menusOpen, setMenusOpen] = useState(false)
  const pressRef = useRef<HTMLButtonElement>(null)
  const { speed, unlock, consumeClick, pressHandlers } = useSpeedPress(pressRef, videoRef, active)
  const scrapped = useIsScrapped(item.shortformId)
  const canScrap = useCanScrap()
  const toggleScrap = useToggleScrap()

  // 화면에 보이는 영상만 재생, 지나간 영상은 처음으로
  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    if (active) {
      v.play().catch(() => setPaused(true))
    } else {
      v.pause()
      v.currentTime = 0
    }
  }, [active])

  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = muted
  }, [muted])

  const togglePlay = () => {
    const v = videoRef.current
    if (!v) return
    if (v.paused) v.play().then(() => setPaused(false)).catch(() => {})
    else {
      v.pause()
      setPaused(true)
    }
  }

  const seek = (e: PointerEvent<HTMLDivElement>) => {
    const v = videoRef.current
    if (!v || !v.duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    v.currentTime = ((e.clientX - rect.left) / rect.width) * v.duration
  }

  const icon = MAP_CATEGORIES.find((c) => (c.codes as readonly string[]).includes(item.category))?.icon
  const frame = item.frame

  return (
    <section className="relative h-full w-full overflow-hidden bg-black" aria-label={`${item.storeName} 홍보 영상`}>
      {/* 배경: 같은 장면을 크게 흐려 깔기 (가로 영상이어도 화면이 꽉 차 보이게) */}
      {item.posterUrl && (
        <img
          src={item.posterUrl}
          alt=""
          aria-hidden
          className="absolute left-1/2 max-w-none -translate-x-1/2 scale-110 opacity-70 blur-2xl brightness-75"
          style={frame ? { height: `${100 / frame.height}%`, top: `${(-100 * frame.top) / frame.height}%` } : { height: '100%', top: 0 }}
        />
      )}

      {/* 영상: 검은 띠가 박힌 영상은 실제 그림 구간만 잘라서 화면 가운데에 */}
      {/* 누르면 재생/일시정지, 꾹 누르면 2배속, 꾹 누른 채 아래로 내리면 2배속 고정 */}
      <button
        ref={pressRef}
        type="button"
        aria-label={paused ? '재생' : '일시정지'}
        onClick={() => !consumeClick() && togglePlay()}
        {...pressHandlers}
        className="absolute inset-0 flex items-center select-none [-webkit-touch-callout:none]"
      >
        {frame ? (
          // 원본이 9:16이라고 보고, 실제 그림 구간(frame.height) 비율로 상자를 만든 뒤 영상을 위로 당겨 잘라 보여줌
          <span className="relative block w-full overflow-hidden" style={{ aspectRatio: `${9 / 16 / frame.height}` }}>
            <video
              ref={videoRef}
              src={item.videoUrl}
              poster={item.posterUrl ?? undefined}
              muted={muted}
              loop
              playsInline
              preload={active ? 'auto' : 'metadata'}
              onTimeUpdate={(e) => setProgress(e.currentTarget.currentTime / (e.currentTarget.duration || 1))}
              onPlay={() => setPaused(false)}
              className="absolute left-0 w-full max-w-none object-fill"
              style={{ height: `${100 / frame.height}%`, top: `${(-100 * frame.top) / frame.height}%` } as CSSProperties}
            />
          </span>
        ) : (
          <video
            ref={videoRef}
            src={item.videoUrl}
            poster={item.posterUrl ?? undefined}
            muted={muted}
            loop
            playsInline
            preload={active ? 'auto' : 'metadata'}
            onTimeUpdate={(e) => setProgress(e.currentTarget.currentTime / (e.currentTarget.duration || 1))}
            onPlay={() => setPaused(false)}
            className="size-full object-cover"
          />
        )}
      </button>

      {active && speed !== 'normal' && (
        <div className="absolute top-[124px] left-1/2 z-10 -translate-x-1/2">
          {speed === 'hold' ? (
            <p className="flex items-center gap-1.5 rounded-full bg-black/55 px-3.5 py-1.5 text-xs font-bold whitespace-nowrap text-white backdrop-blur-md">
              <span className="tracking-[-0.2em]">▶▶</span> 2배속
              <span className="font-medium opacity-75">· 아래로 내리면 고정</span>
            </p>
          ) : (
            <button
              type="button"
              onClick={unlock}
              className="flex items-center gap-1.5 rounded-full bg-green-6/90 px-3.5 py-1.5 text-xs font-bold whitespace-nowrap text-white shadow-lg backdrop-blur-md"
            >
              <span className="tracking-[-0.2em]">▶▶</span> 2배속 고정
              <span className="rounded-full bg-white/25 px-1.5 py-px font-medium">해제 ✕</span>
            </button>
          )}
        </div>
      )}

      {paused && (
        <span aria-hidden className="pointer-events-none absolute top-1/2 left-1/2 flex size-[72px] -translate-1/2 items-center justify-center rounded-full bg-black/35 pl-1.5 text-white/95 backdrop-blur-sm">
          <PlayIcon />
        </span>
      )}

      {/* 위·아래 그늘 (글자·버튼이 잘 보이게) */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/45 to-transparent" />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-96 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

      {/* 오른쪽 버튼 */}
      {/* 하단 탭 바가 영상 위에 떠 있으므로 그 높이(--nav-h, 바가 줄면 같이 줄어듦)만큼 위로 */}
      <div className="absolute right-3 bottom-[calc(var(--nav-h,0px)+120px)] flex transition-[bottom] duration-300 flex-col items-center gap-4 text-white">
        {couponCount > 0 && (
          <SideButton label={`쿠폰 ${couponCount}`} onClick={onOpenCoupons} accent>
            <TicketSmallIcon />
          </SideButton>
        )}
        <SideButton
          label={scrapped ? '스크랩됨' : '스크랩'}
          onClick={() => {
            if (!canScrap) {
              // 로그인 전엔 저장할 곳이 없으니 로그인부터 (로그인 후 이 영상으로 돌아옴)
              toast('로그인하면 스크랩할 수 있어요')
              navigate(`/login?next=${encodeURIComponent(`/?start=${item.shortformId}`)}`)
              return
            }
            toggleScrap.mutate({ item, scrapped })
            toast(scrapped ? '스크랩을 취소했어요' : '스크랩했어요 · 메뉴 > 스크랩한 영상에서 볼 수 있어요')
          }}
          pressed={scrapped}
        >
          <BookmarkIcon filled={scrapped} />
        </SideButton>
        {/* 길 안내(내비)는 없어서 지도에서 가게 위치만 보여줌 */}
        <SideButton label="위치 보기" onClick={() => navigate(`/map?storeId=${item.storeId}`)}>
          <LocationIcon />
        </SideButton>
        <SideButton
          label="공유"
          onClick={() =>
            shareLink({
              title: `${item.storeName} | 잇다`,
              text: `우리 동네 ${item.storeName} 영상 보러 가기${item.description ? ` - ${item.description}` : ''}`,
              path: `/map/stores/${item.storeId}/shortform?start=${item.shortformId}`,
            })
          }
        >
          <ShareIcon />
        </SideButton>
        <SideButton label={muted ? '소리 켜기' : '소리 끄기'} onClick={onToggleMute}>
          <SoundIcon muted={muted} />
        </SideButton>
      </div>

      {/* 가게 정보 */}
      <div className="absolute inset-x-0 bottom-0 px-4 pb-[calc(var(--nav-h,0px)+12px)] text-white transition-[padding] duration-300">
        <div className="flex items-center gap-2.5 pr-14">
          <Link
            to={`/map/stores/${item.storeId}`}
            aria-label={`${item.storeName} 프로필`}
            className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-green-4 bg-white"
          >
            {icon ? <img src={icon} alt="" className="size-9 object-contain" /> : null}
          </Link>
          <div className="min-w-0">
            <Link to={`/map/stores/${item.storeId}`} className="block truncate text-[17px] font-bold drop-shadow">
              {item.storeName}
            </Link>
            <div className="mt-0.5 flex items-center gap-1.5 text-[11px]">
              {/* PRO 가게(우선 노출)는 손님에게도 알 수 있게 표시 */}
              {item.promoted && <span className="shrink-0 rounded-full bg-point-yellow px-1.5 py-px font-bold text-ink">추천</span>}
              <span className="shrink-0 rounded-full bg-green-4 px-1.5 py-px font-bold">{item.categoryName}</span>
              <Link to={`/map?storeId=${item.storeId}`} className="truncate opacity-90">
                📍 {item.address}
              </Link>
            </div>
          </div>
        </div>

        {item.description && <p className="mt-2.5 pr-14 text-[14px] leading-snug drop-shadow">{item.description}</p>}

        {item.menus.length > 0 && (
          <button type="button" onClick={() => setMenusOpen((v) => !v)} className="mt-1.5 block w-full pr-14 text-left text-[13px] opacity-90">
            {menusOpen ? (
              <span className="flex flex-col gap-0.5">
                {item.menus.map((m) => (
                  <span key={m}>· {m}</span>
                ))}
              </span>
            ) : (
              <span className="block truncate">{item.menus.join('   ')}</span>
            )}
          </button>
        )}

        {/* 영상 진행 바: 누른 위치로 이동 */}
        <div role="slider" aria-label="재생 위치" aria-valuenow={Math.round(progress * 100)} onPointerDown={seek} className="mt-3 -mb-1 cursor-pointer py-1.5">
          <div className="h-[3px] overflow-hidden rounded-full bg-white/30">
            <div className="h-full rounded-full bg-white transition-[width] duration-200 ease-linear" style={{ width: `${progress * 100}%` }} />
          </div>
        </div>
      </div>
    </section>
  )
}

function SideButton({
  label,
  onClick,
  children,
  pressed,
  accent = false,
}: {
  label: string
  onClick: () => void
  children: ReactNode
  pressed?: boolean
  accent?: boolean
}) {
  return (
    <button type="button" onClick={onClick} aria-pressed={pressed} aria-label={label} className="flex flex-col items-center gap-1">
      <span
        className={`flex size-11 items-center justify-center rounded-full backdrop-blur-md transition-transform active:scale-90 ${
          accent ? 'bg-point-red/90' : pressed ? 'bg-green-4/90' : 'bg-black/25'
        }`}
      >
        {children}
      </span>
      <span className="text-[11px] font-bold drop-shadow">{label}</span>
    </button>
  )
}
