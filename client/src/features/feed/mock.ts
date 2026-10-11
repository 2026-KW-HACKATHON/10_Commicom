import { MOCK_STORES } from '@/features/map/mock'
import type { Shortform } from './schema'

/** public/samples 에 넣어 둔 시연용 영상 (git에는 안 올림) */
const SAMPLE_VIDEO = '/samples/shortform-sample.mp4'
const SAMPLE_POSTER = '/samples/shortform-sample-poster.jpg'
/** 샘플 영상은 1080×1920 안에 가로 영상이 656~1263px 구간에만 있음 */
const SAMPLE_FRAME = { top: 656 / 1920, height: 607 / 1920 }

const DETAILS: Record<number, { menus: string[]; description: string }> = {
  1: { menus: ['치즈떡볶이 - 7,000원', '모둠튀김 - 5,000원', '마라떡볶이 - 8,000원'], description: '바삭한 튀김 위로 쭉 늘어나는 치즈를 듬뿍 올린 떡볶이 한 판! 메추리알과 파채까지 올려 친구들과 나눠 먹기 딱 좋아요.' },
  2: { menus: ['아메리카노 - 2,500원', '바닐라라떼 - 4,000원', '크로플 - 4,500원'], description: '매일 아침 직접 내린 원두로 만드는 부드러운 라떼. 공강 시간에 쉬어 가기 좋은 동네 카페예요 ☕' },
  3: { menus: ['뼈해장국 - 10,000원', '감자탕(중) - 32,000원', '순대국 - 9,000원'], description: '푸짐한 뼈다귀에 우거지 가득, 진하고 얼큰한 국물 한 그릇. 나 빼고 다 알고 있던 동네 해장국 맛집이에요.' },
  4: { menus: ['마라탕 100g - 1,800원', '꿔바로우(소) - 12,000원'], description: '원하는 재료를 골라 담는 마라탕. 숙주·푸주·피쉬볼 듬뿍, 맵기는 입맛대로 골라 보세요.' },
  5: { menus: ['커트 - 15,000원', '펌 - 60,000원~', '염색 - 50,000원~'], description: '커트·펌·염색 모두 OK! 학생 할인 있고 예약 없이도 방문 가능한 동네 미용실이에요 ✂️' },
  6: { menus: ['한우 꽃등심 1++ 100g - 15,000원', '한우 채끝 1++ 100g - 13,000원', '한우 안심 100g - 16,000원'], description: '매일 아침 들여오는 신선한 국내산 한우! 꽃등심·채끝·안심 모두 1++ 등급으로 준비했어요 🥩' },
  7: { menus: ['후라이드 - 18,000원', '양념치킨 - 19,000원', '생맥주 500cc - 4,000원'], description: '가마솥에 바삭하게 튀긴 옛날 통닭! 달콤매콤 양념치킨에 시원한 생맥주 한 잔, 오늘 저녁은 치맥 어때요? 🍗' },
  8: { menus: ['짜장면 - 7,000원', '찹쌀 탕수육(소) - 16,000원', '군만두 - 6,000원'], description: '직접 뽑은 쫄깃한 수타면 짜장면과 겉바속촉 찹쌀 탕수육. 군만두는 서비스로 드릴 때도 있어요 🥟' },
  9: { menus: ['모둠초밥 12p - 18,000원', '연어초밥 8p - 14,000원', '점심 오마카세 - 35,000원'], description: '매일 아침 들여온 생선으로 쥐는 신선한 초밥. 점심 오마카세는 예약하면 더 좋아요 🍣' },
  10: { menus: ['마르게리따 피자 - 17,000원', '봉골레 파스타 - 16,000원', '하우스 와인 - 8,000원'], description: '화덕에서 90초 만에 구워 내는 나폴리 피자와 생면 파스타. 와인 한 잔 곁들이기 좋은 분위기예요 🍕' },
  11: { menus: ['오늘의 채소 꾸러미 - 9,900원', '제철 과일 - 시세', '2만 원 이상 동네 배달 무료'], description: '산지에서 바로 온 싱싱한 채소와 과일! 매일 바뀌는 오늘의 특가, 2만 원 이상이면 동네 배달도 무료예요 🥬' },
}

const CDN = 'https://d3fsd6ho09c0x2.cloudfront.net/test-feed'
const unsplash = (id: string) => `https://images.unsplash.com/photo-${id}?w=1080&q=80&fm=jpg&fit=crop&ar=4:5`

/** 시연 피드: 가게마다 실제 사진 게시물 (5·6번은 마스코트 일러스트, public/demo) */
const POST_IMAGES: Record<number, string[]> = {
  1: [`${CDN}/tteokbokki.jpg`],
  2: [unsplash('1534687941688-651ccaafbff8'), unsplash('1747459707229-7b1b7c8367e0')],
  3: [`${CDN}/haejangguk.jpg`],
  4: [`${CDN}/malatang.jpg`],
  5: ['/demo/salon.jpg'],
  6: ['/demo/butcher.jpg'],
  7: ['/demo/chicken.jpg'],
  8: ['/demo/chinese.jpg'],
  9: ['/demo/sushi.jpg'],
  10: ['/demo/pasta.jpg'],
  11: ['/demo/mart.jpg'],
}

export const MOCK_SHORTFORMS: Shortform[] = MOCK_STORES.map((store, i) => {
  const images = POST_IMAGES[store.storeId]
  return {
    shortformId: 500 + i,
    storeId: store.storeId,
    storeName: store.name,
    category: store.category,
    categoryName: store.categoryName,
    address: store.address,
    menus: DETAILS[store.storeId]?.menus ?? [],
    description: DETAILS[store.storeId]?.description ?? '',
    ...(images ? { posterUrl: images[0], images } : { videoUrl: SAMPLE_VIDEO, posterUrl: SAMPLE_POSTER, frame: SAMPLE_FRAME }),
    // 하루씩 앞선 날짜 (최신 글이 위)
    createdAt: new Date(Date.UTC(2026, 9, 10 - i, 3)).toISOString().slice(0, 19),
  }
})

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
  imageUrl: string | null
  imageUrls?: string[]
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
    posterUrl: d.imageUrl,
    images: d.imageUrls,
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
