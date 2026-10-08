import type { LatLng } from '@/features/map/schema'

/** 두 좌표 사이 거리(m) — 하버사인 */
export function distanceMeters(a: LatLng, b: LatLng) {
  const R = 6_371_000
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

/** 인증 버튼을 누른 순간의 위치를 새로 받는다 (캐시 위치로 인증되지 않게 maximumAge 0) */
export function getCurrentPosition(): Promise<LatLng> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('위치 기능을 지원하지 않는 브라우저예요'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) =>
        reject(
          new Error(err.code === err.PERMISSION_DENIED ? '위치 권한을 허용해 주세요' : '위치를 찾지 못했어요'),
        ),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15_000 },
    )
  })
}

/** 개발·시연용: true면 거리 검사 없이 인증 (.env VITE_QUEST_GPS_BYPASS) */
export const GPS_BYPASS = import.meta.env.VITE_QUEST_GPS_BYPASS === 'true'
