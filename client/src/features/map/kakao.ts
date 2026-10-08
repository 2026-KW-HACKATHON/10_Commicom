import { Loader, type LoaderOptions } from 'react-kakao-maps-sdk'
import { DEFAULT_CENTER, type LatLng } from './schema'

export const KAKAO_KEY = import.meta.env.VITE_KAKAO_MAP_KEY

/**
 * 카카오 SDK 로드 옵션. 지도(useKakaoLoader)와 주소 → 좌표(Geocoder)가 같은 옵션을 써야 함
 * (옵션이 다르면 SDK 로더가 두 번째 로드를 거부함)
 */
export const KAKAO_LOADER_OPTIONS: LoaderOptions = { appkey: KAKAO_KEY ?? '', libraries: ['services'] }

/**
 * 도로명 주소 → 좌표 (가게 등록·주소 수정 때 지도 위치용).
 * 카카오 키가 없는 개발 환경은 기본 중심(광운대 정문)으로.
 */
export async function geocodeAddress(address: string): Promise<LatLng> {
  if (!KAKAO_KEY) return DEFAULT_CENTER
  await new Loader(KAKAO_LOADER_OPTIONS).load()
  return new Promise((resolve, reject) => {
    new kakao.maps.services.Geocoder().addressSearch(address, (result, status) => {
      if (status === kakao.maps.services.Status.OK && result[0]) {
        resolve({ lat: Number(result[0].y), lng: Number(result[0].x) })
      } else {
        reject(new Error('주소 위치를 찾지 못했어요. 주소 찾기로 다시 골라 주세요'))
      }
    })
  })
}
