import type { StoreSummary } from './schema'

/** VITE_USE_MOCK=true 일 때 쓰는 샘플 가게 (서버 없이 UI 확인용) */
export const MOCK_STORES: StoreSummary[] = [
  { storeId: 1, name: '월계 분식', category: 'RESTAURANT', categoryName: '음식점', address: '서울 노원구 월계동', latitude: 37.6195, longitude: 127.06, thumbnailUrl: null, stepFree: true },
  { storeId: 2, name: '광운 카페', category: 'CAFE_BAKERY_PUB', categoryName: '카페·베이커리·주점', address: '서울 노원구 월계동', latitude: 37.6202, longitude: 127.0578, thumbnailUrl: null, stepFree: false },
  { storeId: 3, name: '김가네 광운대점', category: 'RESTAURANT', categoryName: '음식점', address: '서울 노원구 광운로', latitude: 37.6188, longitude: 127.0585, thumbnailUrl: null, stepFree: true },
  { storeId: 4, name: '광운 꽃집', category: 'LIVING', categoryName: '생활·리빙', address: '서울 노원구 광운로', latitude: 37.61883, longitude: 127.05856, thumbnailUrl: null, stepFree: false },
  { storeId: 5, name: '헤어살롱 잇다', category: 'BEAUTY', categoryName: '뷰티', address: '서울 노원구 석계로', latitude: 37.6175, longitude: 127.0612, thumbnailUrl: null, stepFree: true },
  { storeId: 6, name: '월계 정육마트', category: 'FOOD_RETAIL', categoryName: '식품 판매', address: '서울 노원구 월계로', latitude: 37.6215, longitude: 127.0625, thumbnailUrl: null, stepFree: true },
]
