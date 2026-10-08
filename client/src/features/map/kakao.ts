import { Loader, type LoaderOptions } from 'react-kakao-maps-sdk'
import { DEFAULT_CENTER, type LatLng } from './schema'

export const KAKAO_KEY = import.meta.env.VITE_KAKAO_MAP_KEY

/**
 * 카카오 SDK 로드 옵션. 지도(useKakaoLoader)와 주소 → 좌표(Geocoder)가 같은 옵션을 써야 함
 * (옵션이 다르면 SDK 로더가 두 번째 로드를 거부함)
 */
export const KAKAO_LOADER_OPTIONS: LoaderOptions = { appkey: KAKAO_KEY ?? '', libraries: ['services'] }

/**
 * 주소 검색(services)까지 쓸 수 있게 SDK를 불러옴.
 * 주소 찾기(우편번호) 스크립트가 window.kakao 를 먼저 만들어 두기 때문에 kakao 만으로는 판단할 수 없어 maps.services 까지 확인.
 * 카카오 키에 등록되지 않은 주소(localhost:5173 외)로 접속하면 SDK 로드가 실패함
 */
async function loadKakaoServices() {
  if (window.kakao?.maps?.services) return
  try {
    await new Loader(KAKAO_LOADER_OPTIONS).load()
  } catch {
    // 아래에서 한 번에 처리
  }
  if (!window.kakao?.maps?.services) {
    console.warn(`카카오 지도 SDK를 불러오지 못했어요. 카카오 개발자 콘솔의 Web 플랫폼에 ${location.origin} 이 등록돼 있는지 확인해 주세요`)
    throw new Error('지도 서비스에 연결하지 못해 주소 위치를 찾을 수 없어요. 잠시 후 다시 시도해 주세요')
  }
}

/**
 * 도로명 주소 → 좌표 (가게 등록·주소 수정 때 지도 위치용).
 * 카카오 키가 없는 개발 환경은 기본 중심(광운대 정문)으로.
 */
export async function geocodeAddress(address: string): Promise<LatLng> {
  if (!KAKAO_KEY) return DEFAULT_CENTER
  await loadKakaoServices()
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
