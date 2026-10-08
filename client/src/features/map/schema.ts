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

/** 광운대 정문 근처 — 위치 권한이 없을 때 기본 중심 */
export const DEFAULT_CENTER: LatLng = { lat: 37.6194, lng: 127.0597 }
