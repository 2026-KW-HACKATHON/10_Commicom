import { STORE_CATEGORIES, type StoreEdit, type StoreSummary } from './schema'

/** VITE_USE_MOCK=true 일 때 쓰는 샘플 가게 (서버 없이 UI 확인용) */
export const MOCK_STORES: StoreSummary[] = [
  { storeId: 1, name: '월계 분식', category: 'RESTAURANT', categoryName: '음식점', address: '서울 노원구 월계동', latitude: 37.6195, longitude: 127.06, thumbnailUrl: null, stepFree: true },
  { storeId: 2, name: '광운 카페', category: 'CAFE_BAKERY_PUB', categoryName: '카페·베이커리·주점', address: '서울 노원구 월계동', latitude: 37.6202, longitude: 127.0578, thumbnailUrl: null, stepFree: false },
  { storeId: 3, name: '김가네 광운대점', category: 'RESTAURANT', categoryName: '음식점', address: '서울 노원구 광운로', latitude: 37.6188, longitude: 127.0585, thumbnailUrl: null, stepFree: true },
  { storeId: 4, name: '광운 꽃집', category: 'LIVING', categoryName: '생활·리빙', address: '서울 노원구 광운로', latitude: 37.61883, longitude: 127.05856, thumbnailUrl: null, stepFree: false },
  { storeId: 5, name: '헤어살롱 잇다', category: 'BEAUTY', categoryName: '뷰티', address: '서울 노원구 석계로', latitude: 37.6175, longitude: 127.0612, thumbnailUrl: null, stepFree: true },
  { storeId: 6, name: '월계 정육마트', category: 'FOOD_RETAIL', categoryName: '식품 판매', address: '서울 노원구 월계로', latitude: 37.6215, longitude: 127.0625, thumbnailUrl: null, stepFree: true },
]

/** 가게 상세 조회에만 있는 값 (명세 GET /api/stores/{storeId}) */
export const MOCK_STORE_DETAILS: Record<number, { phone: string | null; businessHours: string; description: string; elevator: boolean }> = {
  1: { phone: '02-000-0001', businessHours: '매일 11:00-21:00', description: '광운대 앞 30년 분식집. 떡볶이와 튀김이 맛있어요.', elevator: false },
  2: { phone: '02-000-0002', businessHours: '평일 08:00-22:00 · 주말 10:00-20:00', description: '공강 시간에 쉬어 가기 좋은 동네 카페. 크로플이 인기예요.', elevator: false },
  3: { phone: '02-000-0003', businessHours: '매일 10:00-22:00', description: '든든한 한 끼, 돈까스와 김밥이 있는 김가네 광운대점.', elevator: true },
  4: { phone: null, businessHours: '화-일 10:00-19:00 (월 휴무)', description: '졸업·생일 꽃다발을 당일 제작해 드려요.', elevator: false },
  5: { phone: '02-000-0005', businessHours: '매일 10:00-20:00 (예약 우선)', description: '학생 할인 있는 동네 미용실. 예약 없이도 방문 가능해요.', elevator: true },
  6: { phone: '02-000-0006', businessHours: '매일 09:00-21:00', description: '매일 아침 들여오는 신선한 고기를 파는 정육점.', elevator: false },
}

/**
 * 사장님이 고친 가게 정보 (가입·프로필 편집, 목업 전용으로 브라우저에 저장).
 * 불러올 때 MOCK_STORES에 덮어써서 지도·숏폼·사장님 화면이 모두 같은 값을 봄.
 */
const EDITS_KEY = 'itda-mock-store-edits'
const edits: Record<number, StoreEdit> = loadEdits()

function loadEdits(): Record<number, StoreEdit> {
  try {
    return JSON.parse(localStorage.getItem(EDITS_KEY) ?? '{}') as Record<number, StoreEdit>
  } catch {
    return {}
  }
}

function apply(storeId: number) {
  const store = MOCK_STORES.find((s) => s.storeId === storeId)
  const e = edits[storeId]
  if (!store || !e) return
  if (e.name) store.name = e.name
  if (e.roadAddress) store.address = [e.roadAddress, e.addressDetail].filter(Boolean).join(' ')
  if (e.category) {
    store.category = e.category
    store.categoryName = STORE_CATEGORIES.find((c) => c.code === e.category)?.name ?? store.categoryName
  }
  if (e.thumbnailUrl !== undefined) store.thumbnailUrl = e.thumbnailUrl
}
Object.keys(edits).forEach((id) => apply(Number(id)))

export function mockStoreEdit(storeId: number): StoreEdit {
  return { ...edits[storeId] }
}

export function saveMockStoreEdit(storeId: number, patch: StoreEdit) {
  edits[storeId] = { ...edits[storeId], ...patch }
  apply(storeId)
  try {
    localStorage.setItem(EDITS_KEY, JSON.stringify(edits))
  } catch {
    // 이번 접속 동안만 유지
  }
}
