import beautyIcon from '@/assets/map/category-beauty.png'
import cafeIcon from '@/assets/map/category-cafe.png'
import groceryIcon from '@/assets/map/category-grocery.png'
import restaurantIcon from '@/assets/map/category-restaurant.png'
import serviceIcon from '@/assets/map/category-service.png'
import shoppingIcon from '@/assets/map/category-shopping.png'

/** GET /api/stores 의 stores[] */
export interface StoreSummary {
  storeId: number
  name: string
  category: string
  categoryName: string
  address: string
  latitude: number
  longitude: number
  thumbnailUrl: string | null
  stepFree: boolean
  /** 지도 5-1 확장 필드 (store 담당과 합의 전이라 선택값) */
  isQuestStore?: boolean
  availableCouponCount?: number
}

/** GET /api/stores/{storeId} */
export interface StoreDetail {
  storeId: number
  name: string
  category: string
  categoryName: string
  address: string
  latitude: number
  longitude: number
  phone: string | null
  /** 자유 형식 (예: 매일 11:00-21:00) */
  businessHours: string
  description: string
  thumbnailUrl: string | null
  accessibility: { stepFree: boolean; elevator: boolean }
}

export interface StoreListResult {
  count: number
  stores: StoreSummary[]
}

export interface LatLng {
  lat: number
  lng: number
}

/**
 * 지도 바텀시트 카테고리(Figma 6종) → 서버 업종 코드(16종) 매핑.
 * 서버 category 필터는 1개 코드만 받으므로 전체를 받아 클라이언트에서 거른다.
 */
export const MAP_CATEGORIES = [
  { key: 'restaurant', label: '식당', icon: restaurantIcon, codes: ['RESTAURANT'] },
  { key: 'beauty', label: '뷰티', icon: beautyIcon, codes: ['BEAUTY'] },
  {
    key: 'shopping',
    label: '쇼핑',
    icon: shoppingIcon,
    codes: ['FASHION', 'LIVING', 'ELECTRONICS', 'HOBBY_LEISURE'],
  },
  { key: 'cafe', label: '카페', icon: cafeIcon, codes: ['CAFE_BAKERY_PUB'] },
  { key: 'grocery', label: '장보기', icon: groceryIcon, codes: ['FOOD_RETAIL', 'GENERAL_RETAIL'] },
  {
    key: 'service',
    label: '서비스',
    icon: serviceIcon,
    codes: [
      'EDUCATION',
      'PET',
      'CONSTRUCTION_INTERIOR',
      'AUTO_TRANSPORT',
      'MANUFACTURING',
      'ADVERTISING_MEDIA',
      'ETC_SERVICE',
    ],
  },
] as const

export type MapCategoryKey = (typeof MAP_CATEGORIES)[number]['key']

/** 명세 업종 코드 16종 (GET /api/stores/categories 와 같은 순서) — 사장님 가입·가게 정보 편집의 대분류 */
export const STORE_CATEGORIES = [
  { code: 'RESTAURANT', name: '음식점' },
  { code: 'CAFE_BAKERY_PUB', name: '카페·베이커리·주점' },
  { code: 'FOOD_RETAIL', name: '식품 판매' },
  { code: 'BEAUTY', name: '뷰티' },
  { code: 'FASHION', name: '패션·잡화' },
  { code: 'LIVING', name: '생활·리빙' },
  { code: 'EDUCATION', name: '교육' },
  { code: 'PET', name: '반려동물' },
  { code: 'HOBBY_LEISURE', name: '취미·레저' },
  { code: 'GENERAL_RETAIL', name: '종합 소매·유통' },
  { code: 'ELECTRONICS', name: 'IT·통신·전기·전자' },
  { code: 'CONSTRUCTION_INTERIOR', name: '건축·인테리어·설비' },
  { code: 'AUTO_TRANSPORT', name: '자동차·운송' },
  { code: 'MANUFACTURING', name: '제조·산업기계' },
  { code: 'ADVERTISING_MEDIA', name: '광고·미디어' },
  { code: 'ETC_SERVICE', name: '기타 서비스' },
] as const

/** 사장님이 고치는 가게 정보 (가입·프로필 편집) */
export interface StoreEdit {
  name?: string
  /** 도로명 주소 (찾기로 고른 값) */
  roadAddress?: string
  addressDetail?: string
  category?: string
  subCategory?: string
  thumbnailUrl?: string | null
}

/** 광운대 정문 근처 — 위치 권한이 없을 때 기본 중심 */
export const DEFAULT_CENTER: LatLng = { lat: 37.6194, lng: 127.0597 }
