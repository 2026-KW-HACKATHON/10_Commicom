import tplRestaurant from '@/assets/quest/templates/restaurant.png'
import tplKorean from '@/assets/quest/templates/korean.png'
import tplChinese from '@/assets/quest/templates/chinese.png'
import tplJapanese from '@/assets/quest/templates/japanese.png'
import tplWestern from '@/assets/quest/templates/western.png'
import tplSnack from '@/assets/quest/templates/snack.png'
import tplChicken from '@/assets/quest/templates/chicken.png'
import tplCafe from '@/assets/quest/templates/cafe.png'
import tplMart from '@/assets/quest/templates/mart.png'
import tplShopping from '@/assets/quest/templates/shopping.png'
import tplBeauty from '@/assets/quest/templates/beauty.png'
import tplService from '@/assets/quest/templates/service.png'
import lv01 from '@/assets/quest/pigeon-lv-01.png'
import lv02 from '@/assets/quest/pigeon-lv-02.png'
import lv03 from '@/assets/quest/pigeon-lv-03.png'
import lv04 from '@/assets/quest/pigeon-lv-04.png'
import lv05 from '@/assets/quest/pigeon-lv-05.png'
import lv06 from '@/assets/quest/pigeon-lv-06.png'
import lv07 from '@/assets/quest/pigeon-lv-07.png'
import lv08 from '@/assets/quest/pigeon-lv-08.png'
import lv09 from '@/assets/quest/pigeon-lv-09.png'
import lv10 from '@/assets/quest/pigeon-lv-10.png'

/* ── 명세: 잇다 API 명세 – Quest · 비둘기 ── */

export type QuestType = 'BASIC' | 'VISIT'
export type QuestStatus = 'IN_PROGRESS' | 'COMPLETED'

/** GET /api/quests 의 quests[] */
export interface Quest {
  questId: number
  title: string
  type: QuestType
  targetCount: number
  currentCount: number
  rewardFeed: number
  status: QuestStatus
  /** 템플릿 퀘스트면 템플릿 키 (명세 추가 제안). 앱 기본 퀘스트는 null */
  templateKey?: QuestTemplateKey | null
  /** 방문 인증할 수 있는 가게. null이면 모든 퀘스트 가게 (명세 추가 제안) */
  storeIds?: number[] | null
}

export interface QuestListResult {
  quests: Quest[]
}

/** POST /api/quests/{questId}/visits body */
export interface VisitRequest {
  storeId: number
  latitude: number
  longitude: number
  qrToken: string
}

export interface PigeonChange {
  levelBefore: number
  levelAfter: number
  currentFeed: number
  requiredFeed: number | null
  levelName: string | null
}

export interface RewardCoupon {
  userCouponId: number
  storeName: string
  title: string
  expiresAt: string
}

/** 먹이를 지급하는 모든 API 응답의 levelUps[] (3-0) */
export interface LevelUp {
  fromLevel: number
  toLevel: number
  reward: {
    type: 'FEED' | 'COUPON'
    feedAmount: number
    userCoupon: RewardCoupon | null
  }
}

export interface VisitResult {
  visitId: number
  feedGained: number
  quest: {
    questId: number
    currentCount: number
    targetCount: number
    completed: boolean
    bonusFeed: number
  }
  pigeon: PigeonChange
  levelUps: LevelUp[]
  feedBalance: number
}

/** GET /api/pigeon */
export interface Pigeon {
  level: number
  maxLevel: number
  levelName: string | null
  currentFeed: number
  requiredFeed: number | null
  isMaxLevel: boolean
  /** 받았지만 아직 안 먹인 먹이 (명세 추가 필드 제안) */
  feedBalance: number
  today: {
    dailyFeedClaimed: boolean
    adFeedCount: number
    adFeedLimit: number
  }
}

/** POST /api/pigeon/feeds/daily, /ad — 먹이는 보유 먹이에 쌓이고 레벨업은 일어나지 않음 */
export interface FeedResult {
  feedGained: number
  adFeedCount?: number
  adFeedLimit?: number
  pigeon: PigeonChange
  levelUps: LevelUp[]
  feedBalance: number
}

/** POST /api/pigeon/feed { amount } (명세 추가 제안) — 보유 먹이를 먹이고 레벨업·뽑기 처리 */
export interface FeedPigeonResult {
  fed: number
  pigeon: PigeonChange
  levelUps: LevelUp[]
  feedBalance: number
}

export interface HistoryItem extends LevelUp {
  historyId: number
  createdAt: string
}

/** GET /api/pigeon/history */
export interface HistoryPage {
  history: HistoryItem[]
  page: number
  size: number
  hasNext: boolean
}

export type SubscriptionStatus = 'ACTIVE' | 'EXPIRED' | 'NONE'

/** GET·POST /api/stores/{storeId}/quest-subscription */
export interface QuestSubscription {
  storeId?: number
  status: SubscriptionStatus
  startedAt: string | null
  expiresAt: string | null
}

/** GET /api/stores/{storeId}/quest-qr */
export interface QuestQr {
  qrToken: string
  expiresAt: string
}

/* ── 퀘스트 템플릿 (서버 고정값, 2026-10-08 추가) ──
 * 사장님은 이 중 우리 가게가 참여할 퀘스트를 고르고,
 * 손님에게는 참여 가게가 1곳 이상인 템플릿만 퀘스트로 보인다. */

export const QUEST_TEMPLATES = [
  { key: 'restaurant', label: '식당', title: '동네 밥집 탐방', place: '밥집', image: tplRestaurant },
  { key: 'korean', label: '한식', title: '한식 맛집 탐방', place: '한식집', image: tplKorean },
  { key: 'chinese', label: '중식', title: '중식 맛집 탐방', place: '중식집', image: tplChinese },
  { key: 'japanese', label: '일식', title: '일식 맛집 탐방', place: '일식집', image: tplJapanese },
  { key: 'western', label: '양식', title: '골목 양식집 찾기', place: '양식집', image: tplWestern },
  { key: 'snack', label: '분식', title: '분식 골목 투어', place: '분식집', image: tplSnack },
  { key: 'chicken', label: '치킨', title: '치킨 맛집 도장깨기', place: '치킨집', image: tplChicken },
  { key: 'cafe', label: '카페', title: '동네 카페 투어', place: '카페', image: tplCafe },
  { key: 'mart', label: '마트', title: '동네 장보기', place: '마트·식료품점', image: tplMart },
  { key: 'shopping', label: '쇼핑', title: '골목 쇼핑 나들이', place: '가게', image: tplShopping },
  { key: 'beauty', label: '뷰티', title: '뷰티 가게 방문', place: '뷰티 가게', image: tplBeauty },
  { key: 'service', label: '생활', title: '생활 서비스 이용하기', place: '생활 서비스 가게', image: tplService },
] as const

export type QuestTemplateKey = (typeof QUEST_TEMPLATES)[number]['key']

/** 템플릿 퀘스트 기본 목표·보상 (참여 가게가 적으면 목표는 참여 가게 수로 줄어듦) */
export const TEMPLATE_TARGET = 2
export const TEMPLATE_REWARD_FEED = 2

export function questTemplate(key: string | null | undefined) {
  return QUEST_TEMPLATES.find((t) => t.key === key) ?? null
}

/** 가게 업종 코드 → 추천 템플릿 (사장님 화면에서 "추천" 표시) */
export const CATEGORY_TEMPLATES: Record<string, QuestTemplateKey[]> = {
  RESTAURANT: ['restaurant', 'korean', 'chinese', 'japanese', 'western', 'snack', 'chicken'],
  CAFE_BAKERY_PUB: ['cafe'],
  FOOD_RETAIL: ['mart'],
  GENERAL_RETAIL: ['mart', 'shopping'],
  FASHION: ['shopping'],
  LIVING: ['shopping'],
  ELECTRONICS: ['shopping'],
  HOBBY_LEISURE: ['shopping'],
  BEAUTY: ['beauty'],
}

/** GET /api/stores/{storeId}/quest-templates (명세 추가 제안) */
export interface OwnerQuestTemplate {
  templateKey: QuestTemplateKey
  title: string
  description: string
  targetCount: number
  rewardFeed: number
  /** 지금 참여 중인 퀘스트 가게 수 (내 가게 포함) */
  participantCount: number
  joined: boolean
}

/* ── 레벨 표 (서버 고정값, 3-0) — 서버가 requiredFeed를 주지만 목업·안내 문구에서 사용 ── */

export const MAX_LEVEL = 10

/** key = 현재 레벨 (key → key+1 레벨업). 2026-10-08 확정 표 */
export const LEVEL_TABLE: Record<number, { requiredFeed: number; coupon: number; feed1: number; feed2: number }> = {
  1: { requiredFeed: 3, coupon: 0.01, feed1: 0.7, feed2: 0.29 },
  2: { requiredFeed: 5, coupon: 0.015, feed1: 0.7, feed2: 0.285 },
  3: { requiredFeed: 8, coupon: 0.02, feed1: 0.7, feed2: 0.28 },
  4: { requiredFeed: 11, coupon: 0.2, feed1: 0.7, feed2: 0.1 },
  5: { requiredFeed: 14, coupon: 0.04, feed1: 0.7, feed2: 0.26 },
  6: { requiredFeed: 17, coupon: 0.045, feed1: 0.7, feed2: 0.255 },
  7: { requiredFeed: 20, coupon: 0.05, feed1: 0.7, feed2: 0.25 },
  8: { requiredFeed: 25, coupon: 0.075, feed1: 0.7, feed2: 0.225 },
  9: { requiredFeed: 30, coupon: 0.99, feed1: 0.007, feed2: 0.003 },
}

/** 레벨별 비둘기 (Figma 디자인 시스템 pigeon-lv-01~10) */
const PIGEON_IMAGES = [lv01, lv02, lv03, lv04, lv05, lv06, lv07, lv08, lv09, lv10]

export function pigeonImage(level: number) {
  return PIGEON_IMAGES[Math.min(Math.max(level, 1), MAX_LEVEL) - 1]
}

/** 레벨 이름은 확정 전까지 서버가 null → "Lv. 4"만 표시 */
export function levelLabel(level: number, levelName: string | null) {
  return levelName ? `Lv. ${level} · ${levelName}` : `Lv. ${level}`
}

/** 방문 인증 조건 (2-2) */
export const VISIT_RADIUS_M = 100

/**
 * 가게 QR에 담는 값: 손님이 휴대폰 카메라로 찍으면 바로 방문 인증 화면이 열리는 주소.
 * 서버가 주는 qrToken을 쿼리로 넣고, /quest/scan 이 진행 중인 방문 퀘스트로 연결한다.
 */
export function visitQrUrl(storeId: number, qrToken: string) {
  return `${window.location.origin}/quest/scan?storeId=${storeId}&qrToken=${encodeURIComponent(qrToken)}`
}

/** "동네 가게 3곳 방문하기" + 을/를 */
export function withObjectParticle(word: string) {
  const code = word.charCodeAt(word.length - 1) - 0xac00
  const hasBatchim = code >= 0 && code <= 11171 && code % 28 !== 0
  return `${word}${hasBatchim ? '을' : '를'}`
}
