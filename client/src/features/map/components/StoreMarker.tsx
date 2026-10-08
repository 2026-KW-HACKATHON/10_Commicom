import { CustomOverlayMap } from 'react-kakao-maps-sdk'
import type { StoreGroup } from '../hooks'
import type { StoreSummary } from '../schema'
import { PinIcon } from './PinIcon'

interface Props {
  group: StoreGroup
  selectedStoreId: number | null
  isListOpen: boolean
  onSelectStore: (store: StoreSummary) => void
  onToggleList: (groupKey: string) => void
  onWatchVideo: (store: StoreSummary) => void
  onOpenProfile: (store: StoreSummary) => void
  onOpenCoupons: (store: StoreSummary) => void
}

const bubbleText = 'text-base font-medium tracking-[-0.96px] whitespace-nowrap'
const menuItem = `block w-full px-[10px] leading-10 ${bubbleText}`

/**
 * 가게 핀 + 말풍선 (Figma 94:106).
 * - 단일: "가게명" 민트 말풍선
 * - 겹침: "가게명 외 n개" → 탭하면 목록 말풍선
 * - 선택: 핀 밝은 초록 + 흰 카드 [홍보 게시물 보기 / 프로필 보기 / 쿠폰 받기]
 * - 퀘스트 가게: 이름 앞 깃발, 받을 쿠폰이 있으면 핀에 쿠폰 배지 (API 명세 5-4)
 */
export function StoreMarker({
  group,
  selectedStoreId,
  isListOpen,
  onSelectStore,
  onToggleList,
  onWatchVideo,
  onOpenProfile,
  onOpenCoupons,
}: Props) {
  const [first, ...rest] = group.stores
  const selected = group.stores.find((s) => s.storeId === selectedStoreId)
  const isGroup = rest.length > 0
  const couponCount = group.stores.reduce((sum, s) => sum + (s.availableCouponCount ?? 0), 0)

  const handlePinClick = () => {
    if (isGroup) onToggleList(group.key)
    else onSelectStore(first)
  }

  return (
    <CustomOverlayMap
      position={group.position}
      yAnchor={1}
      zIndex={selected || isListOpen ? 10 : 1}
      clickable
    >
      <div className="flex flex-col items-center">
        {selected ? (
          <StorePopup
            store={selected}
            onWatchVideo={onWatchVideo}
            onOpenProfile={onOpenProfile}
            onOpenCoupons={onOpenCoupons}
          />
        ) : isListOpen ? (
          <ul className="mb-1.5 max-h-52 divide-y-[0.7px] divide-mint-line overflow-y-auto rounded-[20px] border border-mint-line bg-mint py-1 text-green-6">
            {group.stores.map((store) => (
              <li key={store.storeId}>
                <button type="button" className={`${menuItem} max-w-52 truncate`} onClick={() => onSelectStore(store)}>
                  {store.isQuestStore && <QuestFlag />}
                  {store.name}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <button
            type="button"
            onClick={handlePinClick}
            className={`mb-1.5 max-w-48 truncate rounded-full border border-mint-line bg-mint px-[10px] py-1 text-green-6 ${bubbleText}`}
          >
            {group.stores.some((s) => s.isQuestStore) && <QuestFlag />}
            {isGroup ? `${truncate(first.name, 6)} 외 ${rest.length}개` : first.name}
          </button>
        )}
        <button type="button" aria-label={first.name} onClick={handlePinClick} className="relative">
          <PinIcon active={Boolean(selected)} />
          {couponCount > 0 && (
            <span
              aria-label={`쿠폰 ${couponCount}개`}
              className="absolute -top-1.5 -right-3 rounded-full border border-white bg-point-red px-1.5 text-[10px] leading-4 font-bold text-white"
            >
              쿠폰
            </span>
          )}
        </button>
      </div>
    </CustomOverlayMap>
  )
}

/** 핀을 눌렀을 때 뜨는 흰색·초록 카드 */
function StorePopup({
  store,
  onWatchVideo,
  onOpenProfile,
  onOpenCoupons,
}: {
  store: StoreSummary
  onWatchVideo: (store: StoreSummary) => void
  onOpenProfile: (store: StoreSummary) => void
  onOpenCoupons: (store: StoreSummary) => void
}) {
  const coupons = store.availableCouponCount ?? 0
  return (
    <div role="menu" aria-label={store.name} className="relative mb-2.5 w-[216px]">
      <div className="overflow-hidden rounded-[20px] border border-mint-line bg-white shadow-[0_8px_24px_rgba(8,104,22,0.18)]">
        <div className="border-b border-mint-line bg-mint/45 px-4 pt-3 pb-2.5">
          <p className="truncate text-base font-bold tracking-[-0.5px] text-ink">{store.name}</p>
          <div className="mt-1 flex items-center gap-1.5">
            <span className="truncate text-xs text-green-6/80">{store.categoryName}</span>
            {store.isQuestStore && (
              <span className="shrink-0 rounded-full bg-green-6 px-1.5 py-px text-[10px] font-bold text-white">퀘스트 가게</span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1.5 p-2.5">
          <button
            type="button"
            role="menuitem"
            onClick={() => onWatchVideo(store)}
            className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-green-6 text-sm font-bold text-white active:bg-green-6/90"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
              <path d="M2.5 1.2v9.6c0 .5.5.8.9.5l7.3-4.8a.6.6 0 0 0 0-1L3.4.7c-.4-.3-.9 0-.9.5Z" fill="currentColor" />
            </svg>
            홍보 게시물 보기
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => onOpenProfile(store)}
            className="h-10 rounded-xl border border-mint-line bg-white text-sm font-bold text-green-6 active:bg-mint/40"
          >
            프로필 보기
          </button>
          {coupons > 0 && (
            <button
              type="button"
              role="menuitem"
              onClick={() => onOpenCoupons(store)}
              className="flex h-10 items-center justify-between rounded-xl bg-mint px-3.5 text-sm font-bold text-green-6 active:bg-mint-line/60"
            >
              <span>쿠폰 받기</span>
              <span className="flex items-center gap-1">
                <span className="rounded-full bg-white px-2 py-px text-xs">{coupons}장</span>›
              </span>
            </button>
          )}
        </div>
      </div>
      {/* 핀을 가리키는 꼬리 */}
      <span
        aria-hidden
        className="absolute -bottom-[7px] left-1/2 size-3.5 -translate-x-1/2 rotate-45 border-r border-b border-mint-line bg-white"
      />
    </div>
  )
}

function QuestFlag() {
  return (
    <span aria-label="퀘스트 가게" className="mr-1">
      🚩
    </span>
  )
}

function truncate(text: string, max: number) {
  return text.length > max ? `${text.slice(0, max)}...` : text
}
