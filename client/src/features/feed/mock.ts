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
  createdAt: `2026-09-${String(20 + i).padStart(2, '0')}T12:00:00`,
}))

/**
 * 사장님이 숏폼 만들기에서 "업로드"한 영상 (목업 전용, 브라우저에 저장).
 * 피드 맨 앞에 보임.
 */
const PUBLISHED_KEY = 'itda-mock-published'

function loadPublished(): Shortform[] {
  try {
    return JSON.parse(localStorage.getItem(PUBLISHED_KEY) ?? '[]') as Shortform[]
  } catch {
    return []
  }
}

export const PUBLISHED_SHORTFORMS: Shortform[] = loadPublished()

/** 생성 결과(ShortformDetail) 중 피드에 필요한 부분 */
interface Draft {
  shortformId: number
  storeId: number
  storeName: string
  storeCategory: string
  storeCategoryName: string
  videoUrl: string
  thumbnailUrl: string | null
  title: string
  frame?: { top: number; height: number }
  createdAt: string
}

function toShortform(d: Draft): Shortform {
  const store = MOCK_STORES.find((s) => s.storeId === d.storeId)
  return {
    createdAt: d.createdAt,
    shortformId: d.shortformId,
    storeId: d.storeId,
    storeName: d.storeName,
    category: d.storeCategory,
    categoryName: d.storeCategoryName,
    address: store?.address ?? '',
    menus: DETAILS[d.storeId]?.menus ?? [],
    description: d.title,
    videoUrl: d.videoUrl,
    posterUrl: d.thumbnailUrl,
    frame: d.frame,
  }
}

export function publishMockShortform(d: Draft) {
  PUBLISHED_SHORTFORMS.unshift(toShortform(d))
  savePublished()
}

/**
 * 재수정한 새 버전으로 바꾸기: 원래 영상 자리에 넣고, 처음 올린 날짜는 유지 + 수정 시각 기록.
 * (기본 샘플 영상이면 지운 것으로 표시하고 새 버전을 올린 영상으로 추가)
 */
export function replaceMockShortform(oldId: number, d: Draft) {
  const old = allMockShortforms().find((s) => s.shortformId === oldId)
  const next = { ...toShortform(d), createdAt: old?.createdAt ?? d.createdAt, updatedAt: d.createdAt }
  const i = PUBLISHED_SHORTFORMS.findIndex((s) => s.shortformId === oldId)
  if (i >= 0) {
    PUBLISHED_SHORTFORMS[i] = next
  } else {
    removeMockShortform(oldId)
    PUBLISHED_SHORTFORMS.unshift(next)
  }
  savePublished()
}

function savePublished() {
  try {
    localStorage.setItem(PUBLISHED_KEY, JSON.stringify(PUBLISHED_SHORTFORMS))
  } catch {
    // 저장 실패해도 이번 접속 동안은 보임
  }
}

/** 내 영상에서 삭제한 영상 (기본 샘플 영상도 지울 수 있게 id로 기억) */
const DELETED_KEY = 'itda-mock-deleted'
const deleted = new Set<number>(loadDeleted())

function loadDeleted(): number[] {
  try {
    return JSON.parse(localStorage.getItem(DELETED_KEY) ?? '[]') as number[]
  } catch {
    return []
  }
}

/** 삭제(숨김)한 영상인지 — 서버에 삭제 API가 없을 때 실제 서버 영상도 이 기기에서 숨김 */
export const isHiddenShortform = (shortformId: number) => deleted.has(shortformId)

/** 피드·내 영상에 보여 줄 전체 목록 (올린 영상이 앞, 지운 영상은 뺌) */
export function allMockShortforms() {
  return [...PUBLISHED_SHORTFORMS, ...MOCK_SHORTFORMS]
    .filter((s) => !deleted.has(s.shortformId))
    .map((s) => {
      // 사장님이 가게 정보를 고치면 바로 반영 (이름·주소·업종은 가게 기준)
      const store = MOCK_STORES.find((x) => x.storeId === s.storeId)
      return store ? { ...s, storeName: store.name, address: store.address, category: store.category, categoryName: store.categoryName } : s
    })
}

export function removeMockShortform(shortformId: number) {
  const i = PUBLISHED_SHORTFORMS.findIndex((s) => s.shortformId === shortformId)
  if (i >= 0) {
    PUBLISHED_SHORTFORMS.splice(i, 1)
    savePublished()
  } else {
    deleted.add(shortformId)
    try {
      localStorage.setItem(DELETED_KEY, JSON.stringify([...deleted]))
    } catch {
      // 이번 접속 동안만 지워짐
    }
  }
}
