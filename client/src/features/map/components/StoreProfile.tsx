import { useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { StoreCouponSheet } from '@/features/coupon/components/StoreCouponSheet'
import { useStoreShortforms } from '@/features/feed/hooks'
import type { Shortform } from '@/features/feed/schema'
import { errorMessage } from '@/shared/lib/error'
import { shareLink } from '@/shared/lib/share'
import { LocationIcon, PlayIcon, ShareIcon, TicketSmallIcon } from '@/shared/ui/icons'
import { StoreAvatar } from '@/shared/ui/StoreAvatar'
import { useStoreDetail, useStores } from '../hooks'

/**
 * 가게 프로필 (손님) — 지도 핀 "프로필 보기"·숏폼 가게 이름에서 들어옴.
 * 명세 GET /api/stores/{storeId}(연락처·운영시간·소개·접근성) + 목록의 퀘스트·쿠폰 표시 + 이 가게 홍보 영상.
 */
export function StoreProfile({ storeId }: { storeId: number }) {
  const navigate = useNavigate()
  const { data: store, isLoading, isError, error } = useStoreDetail(storeId)
  const { data: stores } = useStores()
  const { data: videos } = useStoreShortforms(storeId)
  const [couponOpen, setCouponOpen] = useState(false)

  const summary = stores?.find((s) => s.storeId === storeId)
  const couponCount = summary?.availableCouponCount ?? 0
  const menus = videos?.find((v) => v.menus.length > 0)?.menus ?? []

  if (isLoading) return <div className="h-full animate-pulse bg-q-panel" />
  if (isError || !store) {
    return <p className="flex h-full items-center justify-center px-8 text-center text-sm text-q-muted">{errorMessage(error) || '가게를 찾을 수 없어요'}</p>
  }

  return (
    <div className="h-full overflow-y-auto bg-q-panel pb-10">
      {/* 가게 머리 */}
      <section className="bg-white px-5 pt-5 pb-5">
        <div className="flex items-center gap-4">
          <StoreAvatar url={store.thumbnailUrl} className="size-[84px]" />
          <div className="min-w-0">
            <h2 className="text-[22px] leading-tight font-bold text-q-text">{store.name}</h2>
            <div className="mt-1.5 flex flex-wrap gap-1.5 text-[11px] font-bold">
              <span className="rounded-full bg-green-4 px-2 py-0.5 text-white">{store.categoryName}</span>
              {summary?.isQuestStore && <span className="rounded-full bg-q-mint px-2 py-0.5 text-q-green">🚩 퀘스트 가게</span>}
              {store.accessibility.stepFree && <span className="rounded-full bg-q-panel px-2 py-0.5 text-q-sub">♿ 턱 없음</span>}
            </div>
            <p className="mt-1.5 truncate text-[13px] text-q-muted">📍 {store.address}</p>
          </div>
        </div>
        {store.description && <p className="mt-4 text-[14px] leading-relaxed text-q-sub">{store.description}</p>}

        <div className={`mt-4 grid gap-2 ${couponCount > 0 ? 'grid-cols-4' : 'grid-cols-3'}`}>
          <Action label="위치 보기" onClick={() => navigate(`/map?storeId=${storeId}`)}>
            <LocationIcon />
          </Action>
          {couponCount > 0 && (
            <Action label={`쿠폰 ${couponCount}장`} accent onClick={() => setCouponOpen(true)}>
              <TicketSmallIcon />
            </Action>
          )}
          <Action
            label="홍보 영상"
            disabled={!videos?.length}
            onClick={() => videos?.[0] && navigate(`/map/stores/${storeId}/shortform?start=${videos[0].shortformId}`)}
          >
            <span className="scale-[0.55] pl-0.5">
              <PlayIcon />
            </span>
          </Action>
          <Action
            label="공유"
            onClick={() =>
              shareLink({ title: `${store.name} | 잇다`, text: `우리 동네 ${store.name}을(를) 소개해요`, path: `/map/stores/${storeId}` })
            }
          >
            <ShareIcon />
          </Action>
        </div>
      </section>

      {summary?.isQuestStore && (
        <Link to="/quest" className="mx-5 mt-3 flex items-center gap-3 rounded-2xl bg-q-green px-4 py-3 text-white">
          <span className="text-xl">🚩</span>
          <span className="flex-1">
            <span className="block text-[14px] font-bold">이 가게에서 방문 인증할 수 있어요</span>
            <span className="text-xs opacity-85">GPS + 가게 QR로 인증하고 비둘기 먹이 받기</span>
          </span>
          <span className="text-lg">›</span>
        </Link>
      )}

      {/* 가게 정보 */}
      <section className="mx-5 mt-3 rounded-2xl bg-white px-5 py-2">
        <InfoRow label="운영시간">{store.businessHours || '정보 없음'}</InfoRow>
        <InfoRow label="전화">
          {store.phone ? (
            <a href={`tel:${store.phone}`} className="font-medium text-q-green underline">
              {store.phone}
            </a>
          ) : (
            '정보 없음'
          )}
        </InfoRow>
        <InfoRow label="접근성">
          {[store.accessibility.stepFree ? '입구 턱 없음' : '입구 턱 있음', store.accessibility.elevator ? '엘리베이터 있음' : null].filter(Boolean).join(' · ')}
        </InfoRow>
      </section>

      {menus.length > 0 && (
        <section className="mx-5 mt-3 rounded-2xl bg-white px-5 py-4">
          <h3 className="text-[15px] font-bold text-q-text">대표 메뉴</h3>
          <ul className="mt-2 flex flex-col gap-1.5">
            {menus.map((m) => {
              const [name, price] = m.split(' - ')
              return (
                <li key={m} className="flex justify-between text-[14px]">
                  <span className="text-q-text">{name}</span>
                  {price && <span className="font-bold text-q-green">{price}</span>}
                </li>
              )
            })}
          </ul>
        </section>
      )}

      <section className="mt-5">
        <h3 className="px-5 text-[15px] font-bold text-q-text">홍보 영상 {videos?.length ? <span className="text-q-green">{videos.length}</span> : null}</h3>
        {videos && videos.length === 0 ? (
          <p className="py-10 text-center text-[13px] text-q-muted">아직 올라온 영상이 없어요</p>
        ) : (
          <ul className="mt-2 grid grid-cols-3 gap-px">
            {videos?.map((v) => (
              <li key={v.shortformId}>
                <Link to={`/map/stores/${storeId}/shortform?start=${v.shortformId}`} className="relative block aspect-[9/13] overflow-hidden bg-[#dde5e2]">
                  <Thumb video={v} />
                  <span className="absolute top-1.5 right-1.5 flex size-5 items-center justify-center rounded bg-white/90 pl-px text-q-text">
                    <span className="scale-[0.3]">
                      <PlayIcon />
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {couponOpen && <StoreCouponSheet storeId={storeId} storeName={store.name} onClose={() => setCouponOpen(false)} />}
    </div>
  )
}

function Action({ label, onClick, accent = false, disabled = false, children }: { label: string; onClick: () => void; accent?: boolean; disabled?: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col items-center gap-1 rounded-xl py-2.5 text-[12px] font-bold disabled:opacity-40 ${
        accent ? 'bg-point-red text-white' : 'bg-q-mint text-q-green'
      }`}
    >
      <span className="flex size-7 items-center justify-center">{children}</span>
      {label}
    </button>
  )
}

function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex gap-4 border-b border-q-line py-3 text-[14px] last:border-b-0">
      <span className="w-14 shrink-0 text-q-muted">{label}</span>
      <span className="min-w-0 flex-1 text-q-text">{children}</span>
    </div>
  )
}

function Thumb({ video }: { video: Shortform }) {
  if (!video.posterUrl) return null
  const f = video.frame
  return (
    <img
      src={video.posterUrl}
      alt=""
      className="absolute left-1/2 max-w-none -translate-x-1/2"
      style={f ? { height: `${100 / f.height}%`, top: `${(-100 * f.top) / f.height}%` } : { height: '100%', top: 0 }}
    />
  )
}
