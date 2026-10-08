import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { fetchStores } from './api'
import { MAP_CATEGORIES, type LatLng, type MapCategoryKey, type StoreSummary } from './schema'

export function useStores(questOnly = false) {
  return useQuery({
    queryKey: ['stores', { questOnly }],
    queryFn: () => fetchStores(questOnly),
    select: (data) => data.stores,
  })
}

/** 카테고리 + 이름 검색으로 거른 가게 목록 */
export function useFilteredStores(
  stores: StoreSummary[] | undefined,
  category: MapCategoryKey | null,
  keyword: string,
) {
  return useMemo(() => {
    const codes = category
      ? (MAP_CATEGORIES.find((c) => c.key === category)?.codes as readonly string[])
      : null
    const q = keyword.trim().toLowerCase()
    return (stores ?? []).filter(
      (s) => (!codes || codes.includes(s.category)) && (!q || s.name.toLowerCase().includes(q)),
    )
  }, [stores, category, keyword])
}

type LocationState =
  | { status: 'loading' }
  | { status: 'ok'; position: LatLng }
  | { status: 'error'; message: string }

/** 브라우저 Geolocation으로 내 위치 추적 (https 또는 localhost에서만 동작) */
export function useMyLocation(): LocationState {
  const [state, setState] = useState<LocationState>(() =>
    'geolocation' in navigator
      ? { status: 'loading' }
      : { status: 'error', message: '위치 기능을 지원하지 않는 브라우저예요' },
  )

  useEffect(() => {
    if (!('geolocation' in navigator)) return
    const id = navigator.geolocation.watchPosition(
      (pos) =>
        setState({ status: 'ok', position: { lat: pos.coords.latitude, lng: pos.coords.longitude } }),
      (err) =>
        setState({
          status: 'error',
          message: err.code === err.PERMISSION_DENIED ? '위치 권한이 꺼져 있어요' : '위치를 찾지 못했어요',
        }),
      { enableHighAccuracy: true, maximumAge: 10_000, timeout: 15_000 },
    )
    return () => navigator.geolocation.clearWatch(id)
  }, [])

  return state
}

export interface StoreGroup {
  key: string
  position: LatLng
  stores: StoreSummary[]
}

/** 화면상 이 픽셀 거리 안에 겹치는 핀은 하나로 묶어 "OO 외 n개"로 표시 */
const GROUP_RADIUS_PX = 48

/**
 * 현재 지도 줌/위치 기준으로 겹치는 가게를 묶는다.
 * viewVersion은 지도 idle 때마다 올려서 재계산을 트리거한다.
 */
export function useStoreGroups(
  map: kakao.maps.Map | null,
  stores: StoreSummary[],
  viewVersion: number,
): StoreGroup[] {
  return useMemo(() => {
    if (!map) return []
    const projection = map.getProjection()
    const groups: (StoreGroup & { x: number; y: number })[] = []

    for (const store of stores) {
      const point = projection.containerPointFromCoords(
        new kakao.maps.LatLng(store.latitude, store.longitude),
      )
      const near = groups.find(
        (g) => Math.hypot(g.x - point.x, g.y - point.y) < GROUP_RADIUS_PX,
      )
      if (near) near.stores.push(store)
      else
        groups.push({
          key: String(store.storeId),
          position: { lat: store.latitude, lng: store.longitude },
          stores: [store],
          x: point.x,
          y: point.y,
        })
    }
    return groups
    // viewVersion: 줌/이동 후 픽셀 좌표가 바뀌므로 의존성에 포함
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [map, stores, viewVersion])
}
