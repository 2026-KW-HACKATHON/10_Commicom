import { useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MAP_CATEGORIES } from '@/features/map/schema'
import { shareLink } from '@/shared/lib/share'
import { BookmarkIcon, LocationIcon, ShareIcon, TicketSmallIcon } from '@/shared/ui/icons'
import { toast } from '@/stores/toastStore'
import { useCanScrap, useIsScrapped, useToggleScrap } from '../hooks'
import type { Shortform } from '../schema'

interface Props {
  item: Shortform
  couponCount: number
  onOpenCoupons: () => void
}

/**
 * 피드 게시물 한 장 — 사장님이 AI로 만든 사진을 인스타그램 게시물처럼:
 * 가게 프로필 → 사진 → 버튼(스크랩·위치·공유·쿠폰) → 소개 글·메뉴·올린 날짜. 한 화면에 한 장씩 (위아래로 넘기기는 ShortformFeed)
 */
export function ShortformItem({ item, couponCount, onOpenCoupons }: Props) {
  const navigate = useNavigate()
  const [menusOpen, setMenusOpen] = useState(false)
  const scrapped = useIsScrapped(item.shortformId)
  const canScrap = useCanScrap()
  const toggleScrap = useToggleScrap()
  const icon = MAP_CATEGORIES.find((c) => (c.codes as readonly string[]).includes(item.category))?.icon

  const onScrap = () => {
    if (!canScrap) {
      // 로그인 전엔 저장할 곳이 없으니 로그인부터 (로그인 후 이 게시물로 돌아옴)
      toast('로그인하면 스크랩할 수 있어요')
      navigate(`/login?next=${encodeURIComponent(`/?start=${item.shortformId}`)}`)
      return
    }
    toggleScrap.mutate({ item, scrapped })
    toast(scrapped ? '스크랩을 취소했어요' : '스크랩했어요 · 메뉴 > 스크랩한 게시물에서 볼 수 있어요')
  }

  return (
    <article className="flex h-full flex-col bg-white" aria-label={`${item.storeName} 홍보 게시물`}>
      {/* 가게 프로필 */}
      <header className="flex shrink-0 items-center gap-2.5 px-4 py-2.5">
        <Link
          to={`/map/stores/${item.storeId}`}
          aria-label={`${item.storeName} 프로필`}
          className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white ring-2 ring-green-4 ring-offset-2"
        >
          {icon ? <img src={icon} alt="" className="size-8 object-contain" /> : null}
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <Link to={`/map/stores/${item.storeId}`} className="truncate text-[15px] font-bold text-ink">
              {item.storeName}
            </Link>
            {/* PRO 가게(우선 노출)는 손님에게도 알 수 있게 표시 */}
            {item.promoted && <span className="shrink-0 rounded-full bg-point-yellow px-1.5 py-px text-[10px] font-bold text-ink">추천</span>}
          </div>
          <Link to={`/map?storeId=${item.storeId}`} className="block truncate text-[12px] text-q-muted">
            {item.categoryName && <span className="font-medium text-green-4">{item.categoryName} · </span>}
            {item.address}
          </Link>
        </div>
        <Link to={`/map/stores/${item.storeId}`} className="shrink-0 rounded-full border border-q-line px-3 py-1.5 text-[12px] font-bold text-green-6">
          가게 보기
        </Link>
      </header>

      {/* 사진: 남는 높이를 모두 써서 화면을 채움 */}
      <div className="relative min-h-0 flex-1 overflow-hidden bg-q-mint">
        <PostPhoto item={item} icon={icon} />
      </div>

      {/* 버튼 */}
      <div className="flex shrink-0 items-center px-1.5 pt-1">
        <ActionButton label={scrapped ? '스크랩됨' : '스크랩'} onClick={onScrap} pressed={scrapped}>
          <BookmarkIcon filled={scrapped} />
        </ActionButton>
        {/* 길 안내(내비)는 없어서 지도에서 가게 위치만 보여줌 */}
        <ActionButton label="위치 보기" onClick={() => navigate(`/map?storeId=${item.storeId}`)}>
          <LocationIcon />
        </ActionButton>
        <ActionButton
          label="공유"
          onClick={() =>
            shareLink({
              title: `${item.storeName} | 잇다`,
              text: `우리 동네 ${item.storeName} 게시물 보러 가기${item.description ? ` - ${item.description}` : ''}`,
              path: `/map/stores/${item.storeId}/shortform?start=${item.shortformId}`,
            })
          }
        >
          <ShareIcon />
        </ActionButton>
        {couponCount > 0 && (
          <button
            type="button"
            onClick={onOpenCoupons}
            className="mr-2.5 ml-auto flex h-9 items-center gap-1.5 rounded-full bg-point-red px-3.5 text-[13px] font-bold text-white active:scale-95"
          >
            <span className="scale-[0.8]">
              <TicketSmallIcon />
            </span>
            쿠폰 {couponCount}장
          </button>
        )}
      </div>

      {/* 소개 글 */}
      <div className="shrink-0 px-4 pb-3">
        {item.description && (
          <p className="line-clamp-2 text-[14px] leading-snug text-ink">
            <span className="mr-1.5 font-bold">{item.storeName}</span>
            {item.description}
          </p>
        )}
        {item.menus.length > 0 && (
          <button type="button" onClick={() => setMenusOpen((v) => !v)} className="mt-1 block w-full text-left text-[13px] text-q-sub">
            {menusOpen ? (
              <span className="flex flex-col gap-0.5">
                {item.menus.map((m) => (
                  <span key={m}>· {m}</span>
                ))}
              </span>
            ) : (
              <span className="flex gap-1">
                <span className="min-w-0 truncate">{item.menus.join('  ·  ')}</span>
                <span className="shrink-0 text-q-muted">더 보기</span>
              </span>
            )}
          </button>
        )}
        {item.createdAt && <p className="mt-1 text-[11px] text-q-muted">{timeAgo(item.createdAt)}</p>}
      </div>
    </article>
  )
}

/** 게시물 사진. 없거나 못 불러오면 업종 그림으로 채움 */
function PostPhoto({ item, icon }: { item: Shortform; icon?: string }) {
  const [failed, setFailed] = useState(false)
  if (!item.posterUrl || failed) {
    return (
      <div className="flex size-full flex-col items-center justify-center bg-gradient-to-br from-q-mint to-[#d7ebe0] text-center">
        {icon && <img src={icon} alt="" className="h-[120px] w-auto object-contain opacity-90" />}
        <p className="mt-3 text-[15px] font-bold text-green-6">{item.storeName}</p>
        <p className="mt-0.5 text-[12px] text-q-muted">사진을 준비하고 있어요</p>
      </div>
    )
  }
  const frame = item.frame
  if (frame) {
    // 위아래 검은 띠가 있는 샘플 사진은 실제 그림 구간(frame)만 보이게 확대
    return (
      <img
        src={item.posterUrl}
        alt={item.description || `${item.storeName} 사진`}
        onError={() => setFailed(true)}
        className="absolute left-1/2 max-w-none -translate-x-1/2"
        style={{ height: `${100 / frame.height}%`, top: `${(-100 * frame.top) / frame.height}%` }}
      />
    )
  }
  // 사진 비율이 제각각이라 자르지 않고 통째로, 남는 곳은 같은 사진을 흐리게 깔아 채움
  return (
    <>
      <img src={item.posterUrl} alt="" aria-hidden className="absolute inset-0 size-full scale-110 object-cover opacity-60 blur-2xl" />
      <img
        src={item.posterUrl}
        alt={item.description || `${item.storeName} 사진`}
        onError={() => setFailed(true)}
        className="relative size-full object-contain"
      />
    </>
  )
}

function ActionButton({ label, onClick, children, pressed }: { label: string; onClick: () => void; children: ReactNode; pressed?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={pressed}
      aria-label={label}
      className={`flex size-11 items-center justify-center transition-transform active:scale-90 ${pressed ? 'text-green-4' : 'text-ink'}`}
    >
      <span className="scale-90">{children}</span>
    </button>
  )
}

/** 올린 날짜: 방금 전 · N분 전 · N시간 전 · N일 전 · M월 D일 */
function timeAgo(iso: string) {
  const sec = (Date.now() - Date.parse(iso)) / 1000
  if (!Number.isFinite(sec) || sec < 60) return '방금 전'
  if (sec < 3600) return `${Math.floor(sec / 60)}분 전`
  if (sec < 86400) return `${Math.floor(sec / 3600)}시간 전`
  if (sec < 7 * 86400) return `${Math.floor(sec / 86400)}일 전`
  const d = new Date(iso)
  return `${d.getMonth() + 1}월 ${d.getDate()}일`
}
