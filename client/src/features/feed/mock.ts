import { MOCK_STORES } from '@/features/map/mock'
import type { Shortform } from './schema'

/** public/samples 에 넣어 둔 시연용 영상 (git에는 안 올림) */
const SAMPLE_VIDEO = '/samples/shortform-sample.mp4'
const SAMPLE_POSTER = '/samples/shortform-sample-poster.jpg'
/** 샘플 영상은 1080×1920 안에 가로 영상이 656~1263px 구간에만 있음 */
const SAMPLE_FRAME = { top: 656 / 1920, height: 607 / 1920 }

const DETAILS: Record<number, { menus: string[]; description: string }> = {
  1: { menus: ['치즈떡볶이 - 7,000원', '모둠튀김 - 5,000원', '마라떡볶이 - 8,000원'], description: '광운대 앞 30년 분식집, 오늘도 떡볶이 맛있게!' },
  2: { menus: ['아메리카노 - 2,500원', '바닐라라떼 - 4,000원', '크로플 - 4,500원'], description: '공강 시간엔 광운 카페에서 쉬어 가세요 ☕' },
  3: { menus: ['돈까스 - 8,500원', '김치볶음밥 - 7,000원', '라면 - 4,500원'], description: '든든한 한 끼, 김가네 광운대점' },
  4: { menus: ['꽃다발 - 15,000원~', '화분 - 9,000원~'], description: '졸업·생일 꽃다발 당일 제작해 드려요 💐' },
  5: { menus: ['커트 - 15,000원', '펌 - 60,000원~', '염색 - 50,000원~'], description: '학생 할인 있어요! 예약 없이 방문 가능' },
  6: { menus: ['한우 등심 100g - 12,000원', '삼겹살 100g - 2,900원'], description: '매일 아침 들여오는 신선한 고기' },
}

export const MOCK_SHORTFORMS: Shortform[] = MOCK_STORES.map((store, i) => ({
  shortformId: 500 + i,
  storeId: store.storeId,
  storeName: store.name,
  category: store.category,
  categoryName: store.categoryName,
  address: store.address,
  menus: DETAILS[store.storeId]?.menus ?? [],
  description: DETAILS[store.storeId]?.description ?? '',
  videoUrl: SAMPLE_VIDEO,
  posterUrl: SAMPLE_POSTER,
  frame: SAMPLE_FRAME,
}))
