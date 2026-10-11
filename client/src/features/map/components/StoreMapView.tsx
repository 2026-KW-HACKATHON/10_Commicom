import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Map, useKakaoLoader } from 'react-kakao-maps-sdk'
import { useNavigate, useSearchParams } from 'react-router-dom'
import pigeonWalk from '@/assets/map/pigeon-walk.png'
import { StoreCouponSheet } from '@/features/coupon/components/StoreCouponSheet'
import { useFilteredStores, useMyLocation, useStoreGroups, useStores } from '../hooks'
import { openStatus } from '../openStatus'
import { KAKAO_KEY, KAKAO_LOADER_OPTIONS } from '../kakao'
import { DEFAULT_CENTER, type MapCategoryKey, type StoreSummary } from '../schema'
import { MapBottomSheet } from './MapBottomSheet'
import { MyLocationMarker } from './MyLocationMarker'
import { StoreMarker } from './StoreMarker'

/** 지도 기본 배율 (카카오 level, 작을수록 확대) */
const DEFAULT_LEVEL = 3
/** 핀 끝에서 창 위까지 높이(쿠폰 버튼 포함) + 위쪽 메뉴·퀘스트 필터 자리 */
const POPUP_TOP = 380
/** 창 너비(216px)의 절반 + 여백 */
const POPUP_SIDE = 124

/** 잇다 맵 화면 */
export function StoreMapView() {
  return (
    // 시트를 내렸을 때 아래 탭 바를 덮지 않도록 지도 영역 밖은 잘라냄
    <div className="relative h-full overflow-hidden bg-gray-1">
      {KAKAO_KEY ? (
        <KakaoStoreMap />
      ) : (
        <MapMessage>
          .env에 VITE_KAKAO_MAP_KEY(카카오 JavaScript 키)를 넣어주세요
        </MapMessage>
      )}
    </div>
  )
}

function KakaoStoreMap() {
  const [sdkLoading, sdkError] = useKakaoLoader(KAKAO_LOADER_OPTIONS)
  const navigate = useNavigate()

  const [map, setMap] = useState<kakao.maps.Map | null>(null)
  const [viewVersion, setViewVersion] = useState(0)
  // 숏폼 "위치 보기"·주소에서 ?storeId= 로 들어오면 그 가게를 처음부터 선택 (내 위치 이동보다 우선)
  const [params] = useSearchParams()
  const focusStoreId = Number(params.get('storeId')) || null
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(focusStoreId)
  const [openGroupKey, setOpenGroupKey] = useState<string | null>(null)
  const [category, setCategory] = useState<MapCategoryKey | null>(null)
  const [keyword, setKeyword] = useState('')
  const [questOnly, setQuestOnly] = useState(false)
  const [openOnly, setOpenOnly] = useState(false)
  const [couponStore, setCouponStore] = useState<StoreSummary | null>(null)

  const { data: stores, isError } = useStores(questOnly)
  const categoryFiltered = useFilteredStores(stores, category, keyword)
  // "영업 중만": 영업시간을 못 읽는 가게는 빼지 않음
  const filtered = openOnly ? categoryFiltered.filter((s) => openStatus(s.businessHours) !== 'CLOSED') : categoryFiltered
  const groups = useStoreGroups(map, filtered, viewVersion)
  const location = useMyLocation()

  /**
   * 핀을 누르면 지도는 그대로 두고 핀 위에 창을 띄움.
   * 창이 화면 위·옆으로 잘릴 때만 잘리지 않을 만큼 지도를 밀어 줌
   */
  const revealPopup = (lat: number, lng: number) => {
    if (!map) return
    const point = map.getProjection().containerPointFromCoords(new kakao.maps.LatLng(lat, lng))
    const width = map.getNode().clientWidth
    const dx = point.x < POPUP_SIDE ? point.x - POPUP_SIDE : point.x > width - POPUP_SIDE ? point.x - (width - POPUP_SIDE) : 0
    const dy = point.y < POPUP_TOP ? point.y - POPUP_TOP : 0
    if (dx || dy) map.panBy(dx, dy)
  }

  /** 내 위치로: 확대·축소해 둔 배율을 기본으로 되돌리고 지금 위치를 가운데로 */
  const goToMe = () => {
    if (!map || location.status !== 'ok') return
    const me = new kakao.maps.LatLng(location.position.lat, location.position.lng)
    if (map.getLevel() !== DEFAULT_LEVEL) map.setLevel(DEFAULT_LEVEL, { anchor: me })
    map.panTo(me)
  }

  // 그 가게를 지도 가운데로
  const focused = useRef(false)
  useEffect(() => {
    if (!map || !focusStoreId || focused.current || !stores) return
    const target = stores.find((s) => s.storeId === focusStoreId)
    if (!target) return
    focused.current = true
    map.setCenter(new kakao.maps.LatLng(target.latitude, target.longitude))
  }, [map, focusStoreId, stores])

  // 처음 위치를 받으면 한 번만 내 위치로 이동
  const centeredOnMe = useRef(false)
  useEffect(() => {
    if (!map || location.status !== 'ok' || centeredOnMe.current || focusStoreId) return
    centeredOnMe.current = true
    map.setCenter(new kakao.maps.LatLng(location.position.lat, location.position.lng))
  }, [map, location, focusStoreId])

  const clearSelection = () => {
    setSelectedStoreId(null)
    setOpenGroupKey(null)
  }

  const selectStore = (store: StoreSummary) => {
    setSelectedStoreId(store.storeId)
    setOpenGroupKey(null)
    revealPopup(store.latitude, store.longitude)
  }

  if (sdkError) {
    // 가장 흔한 원인: 터널 주소가 바뀌었는데 카카오 Developers > 플랫폼 > Web 도메인에 등록 안 함
    return (
      <MapMessage>
        지도를 불러오지 못했어요.
        <br />
        카카오 Developers의 Web 사이트 도메인에
        <br />
        <b className="break-all text-green-6">{window.location.origin}</b>
        <br />이 등록되어 있는지 확인해 주세요.
      </MapMessage>
    )
  }
  if (sdkLoading) return <MapMessage>지도를 불러오는 중...</MapMessage>

  return (
    <>
      <Map
        center={DEFAULT_CENTER}
        level={DEFAULT_LEVEL}
        className="size-full"
        onCreate={setMap}
        onIdle={() => setViewVersion((v) => v + 1)}
        onClick={clearSelection}
      >
        {groups.map((group) => (
          <StoreMarker
            key={group.key}
            group={group}
            selectedStoreId={selectedStoreId}
            isListOpen={openGroupKey === group.key}
            onSelectStore={selectStore}
            onToggleList={(key) => {
              setSelectedStoreId(null)
              setOpenGroupKey((prev) => (prev === key ? null : key))
            }}
            onWatchVideo={(store) => navigate(`/map/stores/${store.storeId}/shortform`)}
            onOpenProfile={(store) => navigate(`/map/stores/${store.storeId}`)}
            onOpenCoupons={setCouponStore}
          />
        ))}
        {location.status === 'ok' && <MyLocationMarker position={location.position} />}
      </Map>

      <button
        type="button"
        aria-pressed={questOnly}
        onClick={() => {
          setQuestOnly((v) => !v)
          clearSelection()
        }}
        className="absolute top-[78px] left-[14px] z-20 rounded-full border border-green-1 bg-white px-3 py-1.5 text-[13px] font-bold text-ink shadow-sm aria-pressed:border-green-6 aria-pressed:bg-green-6 aria-pressed:text-white"
      >
        🚩 퀘스트 가게만
      </button>

      <button
        type="button"
        aria-pressed={openOnly}
        onClick={() => {
          setOpenOnly((v) => !v)
          clearSelection()
        }}
        className="absolute top-[78px] left-[146px] z-20 rounded-full border border-green-1 bg-white px-3 py-1.5 text-[13px] font-bold text-ink shadow-sm aria-pressed:border-green-6 aria-pressed:bg-green-6 aria-pressed:text-white"
      >
        🕒 영업 중만
      </button>

      {couponStore && (
        <StoreCouponSheet
          storeId={couponStore.storeId}
          storeName={couponStore.name}
          onClose={() => setCouponStore(null)}
        />
      )}

      {isError && (
        <p className="absolute inset-x-[14px] top-[124px] z-20 rounded-full border border-point-orange bg-white px-4 py-2 text-center text-sm font-medium text-point-red-dark">
          가게 정보를 불러오지 못했어요
        </p>
      )}

      <MapBottomSheet
        floating={
          location.status === 'ok' && (
            <button
              type="button"
              aria-label="내 위치로 이동"
              className="flex size-[49px] items-center justify-center rounded-full border border-green-1 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
              onClick={goToMe}
            >
              <img src={pigeonWalk} alt="" className="size-8 object-contain" />
            </button>
          )
        }
        keyword={keyword}
        onKeywordChange={setKeyword}
        category={category}
        onCategoryChange={(next) => {
          setCategory(next)
          clearSelection()
        }}
        results={filtered}
        onSelectStore={(store) => {
          setKeyword('')
          selectStore(store)
        }}
      />
    </>
  )
}

function MapMessage({ children }: { children: ReactNode }) {
  return (
    <div className="flex size-full items-center justify-center bg-gray-1 px-6 text-center text-base font-medium text-ink">
      {children}
    </div>
  )
}
