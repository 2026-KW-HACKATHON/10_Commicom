import { STORE_CATEGORIES, type StoreEdit, type StoreSummary } from './schema'

/** VITE_USE_MOCK=true 일 때 쓰는 샘플 가게 (서버 없이 UI 확인용) */
export const MOCK_STORES: StoreSummary[] = [
  { storeId: 1, name: '청년다방 광운대점', category: 'RESTAURANT', categoryName: '음식점', address: '서울 노원구 광운로 20', latitude: 37.6195, longitude: 127.06, thumbnailUrl: null, stepFree: true },
  { storeId: 2, name: '광운 카페', category: 'CAFE_BAKERY_PUB', categoryName: '카페·베이커리·주점', address: '서울 노원구 월계동', latitude: 37.6202, longitude: 127.0578, thumbnailUrl: null, stepFree: false },
  { storeId: 3, name: '월계 해장국', category: 'RESTAURANT', categoryName: '음식점', address: '서울 노원구 월계동', latitude: 37.6178, longitude: 127.0612, thumbnailUrl: null, stepFree: true },
  { storeId: 4, name: '춘리마라탕', category: 'RESTAURANT', categoryName: '음식점', address: '서울 노원구 광운로 30', latitude: 37.6188, longitude: 127.0585, thumbnailUrl: null, stepFree: false },
  { storeId: 5, name: '헤어살롱 잇다', category: 'BEAUTY', categoryName: '뷰티', address: '서울 노원구 석계로', latitude: 37.6168, longitude: 127.0575, thumbnailUrl: null, stepFree: true },
  { storeId: 6, name: '월계 정육마트', category: 'FOOD_RETAIL', categoryName: '식품 판매', address: '서울 노원구 월계로', latitude: 37.6215, longitude: 127.0625, thumbnailUrl: null, stepFree: true },
]

/** 가게 상세 조회에만 있는 값 (명세 GET /api/stores/{storeId}) */
export const MOCK_STORE_DETAILS: Record<number, { phone: string | null; businessHours: string; description: string; elevator: boolean }> = {
  1: { phone: '02-000-0001', businessHours: '매일 11:00-22:00', description: '치즈 이불 덮은 떡볶이 한 판! 튀김·메추리알까지 푸짐한 떡볶이집이에요.', elevator: false },
  2: { phone: '02-000-0002', businessHours: '평일 08:00-22:00 · 주말 10:00-20:00', description: '공강 시간에 쉬어 가기 좋은 동네 카페. 크로플이 인기예요.', elevator: false },
  3: { phone: '02-000-0003', businessHours: '24시간 영업', description: '푸짐한 뼈다귀에 우거지 가득, 진하고 얼큰한 동네 해장국집.', elevator: true },
  4: { phone: '02-000-0004', businessHours: '매일 11:00-21:30', description: '원하는 재료를 골라 담는 마라탕. 맵기는 입맛대로 골라 보세요.', elevator: false },
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

/**
 * 서버에서 받은 가게에 목업 편집 내용을 덮어씀 (가게 수정 API가 생기기 전, 실제 서버 연동 중에도 편집이 보이게).
 */
export function withStoreEdit<T extends { storeId: number; name: string; address: string; category: string; categoryName: string; thumbnailUrl: string | null }>(store: T): T {
  const e = edits[store.storeId]
  if (!e) return store
  return {
    ...store,
    ...(e.name ? { name: e.name } : {}),
    ...(e.roadAddress ? { address: [e.roadAddress, e.addressDetail].filter(Boolean).join(' ') } : {}),
    ...(e.category ? { category: e.category, categoryName: STORE_CATEGORIES.find((c) => c.code === e.category)?.name ?? store.categoryName } : {}),
    ...(e.thumbnailUrl !== undefined ? { thumbnailUrl: e.thumbnailUrl } : {}),
  }
}

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
