/**
 * 서버 없이 화면을 돌리기 위한 브라우저 목업 서버 (VITE_USE_MOCK=true).
 * 「잇다 API 명세 – Quest · 비둘기 · 쿠폰 · 지도」의 로직·에러 코드를 그대로 흉내 낸다.
 * 상태는 localStorage에 저장 — resetMockDb()로 초기화.
 */
import { ApiError } from '@/shared/api/client'
import { MOCK_STORES } from '@/features/map/mock'
import type {
  AvailableCoupon,
  CreateCouponRequest,
  CreateCouponResult,
  DiscountType,
  DownloadResult,
  MyCouponPage,
  OwnerCoupon,
  RedeemResult,
  Settlement,
  UserCouponSource,
  UserCouponStatus,
} from '@/features/coupon/schema'
import { validateCoupon } from '@/features/coupon/schema'
import { distanceMeters, GPS_BYPASS } from '@/features/quest/geo'
import {
  LEVEL_TABLE,
  QUEST_TEMPLATES,
  TEMPLATE_REWARD_FEED,
  TEMPLATE_TARGET,
  MAX_LEVEL,
  VISIT_RADIUS_M,
  type FeedPigeonResult,
  type FeedResult,
  type HistoryItem,
  type HistoryPage,
  type LevelUp,
  type Pigeon,
  type QuestListResult,
  type QuestQr,
  type QuestSubscription,
  type QuestType,
  type OwnerQuestTemplate,
  type QuestTemplateKey,
  type VisitRequest,
  type VisitResult,
} from '@/features/quest/schema'

export const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

/** 목업에서 "내 가게"(사장님 계정)로 쓰는 가게 — 내 가게 조회 API가 생기면 교체 */
export const MOCK_OWNER_STORE_ID = 2

const AD_FEED_LIMIT = 3
const COUPON_FEE = 100
const STORAGE_KEY = 'itda-mock-db-v1'

interface CouponRow {
  couponId: number
  storeId: number
  title: string
  discountType: DiscountType
  discountValue: number
  minOrderAmount: number
  totalQuantity: number
  issuedCount: number
  usedCount: number
  validDays: number
  useAsPigeonReward: boolean
  status: 'ACTIVE' | 'STOPPED' | 'SOLD_OUT'
  createdAt: string
}

interface UserCouponRow {
  userCouponId: number
  couponId: number
  /** 목업 사용자 본인 쿠폰인지 (사장님 사용 처리 데모용으로 다른 손님 쿠폰도 둠) */
  mine: boolean
  source: UserCouponSource
  redeemCode: string
  status: 'AVAILABLE' | 'USED'
  expiresAt: string
  usedAt: string | null
  createdAt: string
}

interface Db {
  seq: number
  /** feedBalance: 받았지만 아직 안 먹인 먹이 (2026-10-08: 자동 먹이기 → 쌓아 두고 직접 주기로 변경) */
  pigeon: { level: number; currentFeed: number; feedBalance?: number }
  feedLogs: { date: string; source: 'DAILY' | 'AD' | 'QUEST' | 'DRAW'; amount: number; adTransactionId?: string }[]
  history: HistoryItem[]
  quests: { questId: number; title: string; type: QuestType; targetCount: number; rewardFeed: number; basicCount: number }[]
  visits: { questId: number; storeId: number; date: string }[]
  /** 템플릿 퀘스트별 참여 가게 (2026-10-08 추가 — 예전 저장본엔 없을 수 있음) */
  questParticipants?: Partial<Record<QuestTemplateKey, number[]>>
  subscriptions: Record<number, { startedAt: string; expiresAt: string }>
  coupons: CouponRow[]
  userCoupons: UserCouponRow[]
  fees: { storeId: number; userCouponId: number; title: string; discountValue: number; fee: number; redeemedAt: string }[]
}

/* ── 시간 (KST 기준, 명세 0. 공통 규칙) ── */

const KST_OFFSET = 9 * 60 * 60 * 1000

function kstDate(ms = Date.now()) {
  return new Date(ms + KST_OFFSET).toISOString().slice(0, 10)
}

function kstIso(ms = Date.now()) {
  return `${new Date(ms + KST_OFFSET).toISOString().slice(0, 19)}+09:00`
}

function endOfKstDay(date: string) {
  return `${date}T23:59:59+09:00`
}

function addDays(date: string, days: number) {
  return kstDate(Date.parse(`${date}T00:00:00+09:00`) + days * 86_400_000)
}

/* ── 저장소 ── */

function seed(): Db {
  const today = kstDate()
  const ago = (d: number) => addDays(today, -d)
  return {
    seq: 1000,
    pigeon: { level: 2, currentFeed: 3, feedBalance: 2 },
    feedLogs: [],
    history: [
      {
        historyId: 1,
        fromLevel: 1,
        toLevel: 2,
        reward: { type: 'FEED', feedAmount: 1, userCoupon: null },
        createdAt: `${ago(2)}T20:12:00+09:00`,
      },
    ],
    // 명세 7. 시드 데이터
    quests: [
      { questId: 1, title: '동네 가게 3곳 방문하기', type: 'VISIT', targetCount: 3, rewardFeed: 2, basicCount: 0 },
      { questId: 2, title: '숏폼 5개 보기', type: 'BASIC', targetCount: 5, rewardFeed: 1, basicCount: 5 },
      { questId: 3, title: '지도에서 가게 3곳 둘러보기', type: 'BASIC', targetCount: 3, rewardFeed: 1, basicCount: 1 },
    ],
    visits: [{ questId: 1, storeId: 5, date: ago(1) }],
    // 1 월계 분식, 3 김가네, 5 헤어살롱 (모두 퀘스트 가게). 2 광운 카페(사장님 데모)는 아직 미참여
    questParticipants: { restaurant: [1, 3], korean: [3], snack: [1], beauty: [5] },
    subscriptions: {
      1: { startedAt: `${ago(10)}T00:00:00+09:00`, expiresAt: endOfKstDay(addDays(today, 20)) },
      3: { startedAt: `${ago(5)}T00:00:00+09:00`, expiresAt: endOfKstDay(addDays(today, 25)) },
      5: { startedAt: `${ago(3)}T00:00:00+09:00`, expiresAt: endOfKstDay(addDays(today, 27)) },
    },
    coupons: [
      coupon(1, 3, '라면 1,000원 할인', 'AMOUNT', 1000, 8000, 50, 12, 5, 7, true, ago(6)),
      coupon(2, 1, '떡볶이 10% 할인', 'RATE', 10, 0, 30, 4, 1, 7, true, ago(4)),
      coupon(3, 2, '아메리카노 1,000원 할인', 'AMOUNT', 1000, 5000, 100, 8, 3, 7, true, ago(9)),
      coupon(4, 5, '커트 2,000원 할인', 'AMOUNT', 2000, 15000, 20, 2, 0, 14, false, ago(2)),
    ],
    userCoupons: [
      userCoupon(11, 1, true, 'PIGEON_REWARD', 'KM4T9A', 'AVAILABLE', endOfKstDay(addDays(today, 3)), null, ago(4)),
      userCoupon(12, 2, true, 'DOWNLOAD', 'TB7X2Q', 'USED', endOfKstDay(addDays(today, 2)), `${ago(1)}T12:30:00+09:00`, ago(5)),
      userCoupon(13, 4, true, 'DOWNLOAD', 'HC2R8M', 'AVAILABLE', endOfKstDay(ago(1)), null, ago(15)),
      // 다른 손님이 받은 내 가게 쿠폰 → 사장님 "쿠폰 사용 처리" 데모용
      userCoupon(14, 3, false, 'DOWNLOAD', 'QK7M2P', 'AVAILABLE', endOfKstDay(addDays(today, 5)), null, ago(2)),
    ],
    fees: [1, 3, 6].map((d, i) => ({
      storeId: 2,
      userCouponId: 900 + i,
      title: '아메리카노 1,000원 할인',
      discountValue: 1000,
      fee: COUPON_FEE,
      redeemedAt: `${ago(d)}T1${i}:20:00+09:00`,
    })),
  }
}

function coupon(
  couponId: number,
  storeId: number,
  title: string,
  discountType: DiscountType,
  discountValue: number,
  minOrderAmount: number,
  totalQuantity: number,
  issuedCount: number,
  usedCount: number,
  validDays: number,
  useAsPigeonReward: boolean,
  date: string,
): CouponRow {
  return {
    couponId, storeId, title, discountType, discountValue, minOrderAmount, totalQuantity,
    issuedCount, usedCount, validDays, useAsPigeonReward, status: 'ACTIVE', createdAt: `${date}T15:00:00+09:00`,
  }
}

function userCoupon(
  userCouponId: number,
  couponId: number,
  mine: boolean,
  source: UserCouponSource,
  redeemCode: string,
  status: 'AVAILABLE' | 'USED',
  expiresAt: string,
  usedAt: string | null,
  date: string,
): UserCouponRow {
  return { userCouponId, couponId, mine, source, redeemCode, status, expiresAt, usedAt, createdAt: `${date}T10:00:00+09:00` }
}

let cache: Db | null = null

function db(): Db {
  if (cache) return cache
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    cache = saved ? (JSON.parse(saved) as Db) : seed()
    // 예전에 저장된 목업에는 퀘스트 참여 정보가 없음 → 기본값으로 채움
    cache.questParticipants ??= seed().questParticipants
  } catch {
    cache = seed()
  }
  return cache
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db()))
  } catch {
    // 저장 실패해도 메모리 상태로 계속 동작
  }
}

export function resetMockDb() {
  cache = seed()
  save()
}

/** 목업 전용 테스트: 보유 먹이를 바로 채움 (Lv.10까지 해보기용) */
export function mockAddFeed(amount: number) {
  const d = db()
  d.pigeon.feedBalance = (d.pigeon.feedBalance ?? 0) + amount
  save()
}

function nextId() {
  db().seq += 1
  return db().seq
}

/** 실제 네트워크처럼 약간 늦게 응답 */
async function respond<T>(fn: () => T): Promise<T> {
  await new Promise((r) => setTimeout(r, 250))
  const result = fn()
  save()
  // 화면 쪽에서 원본 객체를 건드리지 않게 복사본을 넘김
  return structuredClone(result)
}

function fail(status: number, code: string, message: string, result?: unknown): never {
  void status
  throw new ApiError(code, message, result)
}

/* ── 가게 공통 ── */

function storeName(storeId: number) {
  return MOCK_STORES.find((s) => s.storeId === storeId)?.name ?? `가게 ${storeId}`
}

function isQuestStore(storeId: number) {
  const sub = db().subscriptions[storeId]
  return Boolean(sub && Date.parse(sub.expiresAt) > Date.now())
}

function remaining(c: CouponRow) {
  return c.totalQuantity - c.issuedCount
}

/** 지도 5-1: GET /api/stores 응답에 추가되는 필드 */
export function mockStoreExtras(storeId: number) {
  return {
    isQuestStore: isQuestStore(storeId),
    availableCouponCount: db().coupons.filter((c) => c.storeId === storeId && c.status === 'ACTIVE' && remaining(c) > 0).length,
  }
}

/* ── 먹이 지급: 보유 먹이에 쌓기만 함 (레벨업 없음) ── */

function grantFeed(amount: number, source: 'DAILY' | 'AD' | 'QUEST', adTransactionId?: string) {
  const d = db()
  d.feedLogs.push({ date: kstDate(), source, amount, adTransactionId })
  d.pigeon.feedBalance = (d.pigeon.feedBalance ?? 0) + amount
  return { pigeon: pigeonChange(d.pigeon.level), levelUps: [] as LevelUp[], feedBalance: d.pigeon.feedBalance }
}

function pigeonChange(levelBefore: number) {
  const d = db()
  return {
    levelBefore,
    levelAfter: d.pigeon.level,
    currentFeed: d.pigeon.currentFeed,
    requiredFeed: requiredFeed(d.pigeon.level),
    levelName: null,
  }
}

/* ── 3-0. 레벨업 처리 로직 (먹이 주기 때 실행) ── */

function feedPigeon(amount: number) {
  const d = db()
  const levelBefore = d.pigeon.level
  const levelUps: LevelUp[] = []
  d.pigeon.feedBalance = (d.pigeon.feedBalance ?? 0) - amount

  d.pigeon.currentFeed += amount
  while (d.pigeon.level < MAX_LEVEL && d.pigeon.currentFeed >= LEVEL_TABLE[d.pigeon.level].requiredFeed) {
    const row = LEVEL_TABLE[d.pigeon.level]
    d.pigeon.currentFeed -= row.requiredFeed
    d.pigeon.level += 1
    const reward = draw(row, d.pigeon.level)
    // 뽑기로 나온 먹이도 바로 먹이지 않고 보유 먹이에 쌓음
    if (reward.type === 'FEED') d.pigeon.feedBalance = (d.pigeon.feedBalance ?? 0) + reward.feedAmount

    const levelUp: LevelUp = { fromLevel: d.pigeon.level - 1, toLevel: d.pigeon.level, reward }
    levelUps.push(levelUp)
    d.history.unshift({ ...levelUp, historyId: nextId(), createdAt: kstIso() })
  }
  if (d.pigeon.level >= MAX_LEVEL) d.pigeon.currentFeed = 0

  return { fed: amount, pigeon: pigeonChange(levelBefore), levelUps, feedBalance: d.pigeon.feedBalance }
}

function draw(row: (typeof LEVEL_TABLE)[number], toLevel: number): LevelUp['reward'] {
  const r = Math.random()
  if (r < row.coupon) {
    const pool = db().coupons.filter((c) => c.useAsPigeonReward && c.status === 'ACTIVE' && remaining(c) > 0)
    if (pool.length > 0) {
      const picked = pool[Math.floor(Math.random() * pool.length)]
      const uc = issueUserCoupon(picked, 'PIGEON_REWARD')
      return {
        type: 'COUPON',
        feedAmount: 0,
        userCoupon: { userCouponId: uc.userCouponId, storeName: storeName(picked.storeId), title: picked.title, expiresAt: uc.expiresAt },
      }
    }
    // 풀이 비었을 때: 중간 레벨은 먹이 2개로 대체. Lv.10 확정 쿠폰은 미정(열린 질문 4) → 목업은 먹이 0
    return { type: 'FEED', feedAmount: toLevel >= MAX_LEVEL ? 0 : 2, userCoupon: null }
  }
  return { type: 'FEED', feedAmount: r < row.coupon + row.feed1 ? 1 : 2, userCoupon: null }
}

function requiredFeed(level: number) {
  return level >= MAX_LEVEL ? null : LEVEL_TABLE[level].requiredFeed
}

function issueUserCoupon(c: CouponRow, source: UserCouponSource) {
  const uc: UserCouponRow = {
    userCouponId: nextId(),
    couponId: c.couponId,
    mine: true,
    source,
    redeemCode: newRedeemCode(),
    status: 'AVAILABLE',
    expiresAt: endOfKstDay(addDays(kstDate(), c.validDays)),
    usedAt: null,
    createdAt: kstIso(),
  }
  db().userCoupons.push(uc)
  c.issuedCount += 1
  if (remaining(c) <= 0) c.status = 'SOLD_OUT'
  return uc
}

function newRedeemCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  for (;;) {
    const code = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
    if (!db().userCoupons.some((u) => u.redeemCode === code)) return code
  }
}

/** 가게·날짜별 QR 값 (매일 자정 갱신) */
function qrToken(storeId: number, date = kstDate()) {
  let h = 2166136261
  for (const ch of `itda:${storeId}:${date}`) h = Math.imul(h ^ ch.charCodeAt(0), 16777619)
  return (h >>> 0).toString(36).padStart(7, '0').slice(0, 8)
}

/** 목업 전용: 방문 인증 화면에서 QR 대신 쓸 값 안내 */
export function mockQrHint(storeId: number) {
  return isQuestStore(storeId) ? qrToken(storeId) : null
}

/* ── 2. Quest ── */

type QuestRow = Db['quests'][number] & { templateKey: QuestTemplateKey | null; storeIds: number[] | null }

const TEMPLATE_QUEST_ID_BASE = 100

/** 지금 활성(유료 등록 유지 중)인 템플릿 참여 가게 */
function participants(key: QuestTemplateKey) {
  return (db().questParticipants?.[key] ?? []).filter(isQuestStore)
}

/**
 * 손님에게 보이는 퀘스트.
 * - 앱 기본 퀘스트(BASIC)는 항상
 * - "동네 가게 N곳 방문"(VISIT, 가게 제한 없음)은 퀘스트 가게가 1곳 이상일 때
 * - 템플릿 퀘스트는 참여 가게가 1곳 이상일 때만 (없으면 깰 수 없으니 숨김). 목표는 참여 가게 수를 넘지 않음
 */
function visibleQuests(): QuestRow[] {
  const anyQuestStore = MOCK_STORES.some((s) => isQuestStore(s.storeId))
  const base: QuestRow[] = db()
    .quests.filter((q) => q.type === 'BASIC' || anyQuestStore)
    .map((q) => ({ ...q, templateKey: null, storeIds: null }))
  const templates: QuestRow[] = QUEST_TEMPLATES.flatMap((t, i) => {
    const storeIds = participants(t.key)
    if (storeIds.length === 0) return []
    return [{
      questId: TEMPLATE_QUEST_ID_BASE + i,
      title: t.title,
      type: 'VISIT' as const,
      targetCount: Math.min(TEMPLATE_TARGET, storeIds.length),
      rewardFeed: TEMPLATE_REWARD_FEED,
      basicCount: 0,
      templateKey: t.key,
      storeIds,
    }]
  })
  return [...base, ...templates]
}

function questView(q: QuestRow) {
  const currentCount =
    q.type === 'VISIT' ? db().visits.filter((v) => v.questId === q.questId).length : q.basicCount
  return {
    questId: q.questId,
    title: q.title,
    type: q.type,
    targetCount: q.targetCount,
    currentCount: Math.min(currentCount, q.targetCount),
    rewardFeed: q.rewardFeed,
    status: currentCount >= q.targetCount ? ('COMPLETED' as const) : ('IN_PROGRESS' as const),
    templateKey: q.templateKey,
    storeIds: q.storeIds,
  }
}

export const mockQuestApi = {
  list: () => respond<QuestListResult>(() => ({ quests: visibleQuests().map(questView) })),

  visit: (questId: number, body: VisitRequest) =>
    respond<VisitResult>(() => {
      const d = db()
      const q = visibleQuests().find((x) => x.questId === questId && x.type === 'VISIT')
      if (!q) fail(404, 'QUEST4041', '퀘스트를 찾을 수 없어요')
      const before = questView(q)
      if (before.status === 'COMPLETED') fail(409, 'QUEST4092', '이미 완료한 퀘스트예요')
      if (!isQuestStore(body.storeId)) fail(403, 'QUEST4031', '퀘스트 가게가 아니에요')
      if (q.storeIds && !q.storeIds.includes(body.storeId)) {
        fail(403, 'QUEST4032', '이 퀘스트에 참여한 가게가 아니에요')
      }

      const store = MOCK_STORES.find((s) => s.storeId === body.storeId)
      if (store && !GPS_BYPASS) {
        const distanceM = Math.round(
          distanceMeters({ lat: body.latitude, lng: body.longitude }, { lat: store.latitude, lng: store.longitude }),
        )
        if (distanceM > VISIT_RADIUS_M) fail(400, 'QUEST4001', '가게 반경 100m 밖이에요', { distanceM })
      }
      if (body.qrToken.trim().toLowerCase() !== qrToken(body.storeId)) {
        fail(400, 'QUEST4002', 'QR 코드가 맞지 않거나 만료됐어요')
      }
      const today = kstDate()
      if (d.visits.some((v) => v.storeId === body.storeId && v.date === today)) {
        fail(409, 'QUEST4091', '오늘 이미 이 가게에서 인증했어요')
      }
      if (d.visits.some((v) => v.questId === questId && v.storeId === body.storeId)) {
        fail(409, 'QUEST4093', '이 퀘스트에서 이미 인정된 가게예요')
      }

      d.visits.push({ questId, storeId: body.storeId, date: today })
      const after = questView(q)
      const completed = after.status === 'COMPLETED'
      const granted = grantFeed(1 + (completed ? q.rewardFeed : 0), 'QUEST')
      return {
        visitId: nextId(),
        feedGained: 1,
        quest: {
          questId,
          currentCount: after.currentCount,
          targetCount: after.targetCount,
          completed,
          bonusFeed: completed ? q.rewardFeed : 0,
        },
        ...granted,
      }
    }),

  /* 사장님: 퀘스트 템플릿 참여 (명세 추가 제안) */

  templates: (storeId: number) =>
    respond<{ templates: OwnerQuestTemplate[] }>(() => {
      assertMyStore(storeId, 'COMMON403')
      return {
        templates: QUEST_TEMPLATES.map((t) => {
          const count = participants(t.key).length
          return {
            templateKey: t.key,
            title: t.title,
            description: `동네 ${t.place} ${TEMPLATE_TARGET}곳 방문하기`,
            targetCount: TEMPLATE_TARGET,
            rewardFeed: TEMPLATE_REWARD_FEED,
            participantCount: count,
            joined: (db().questParticipants?.[t.key] ?? []).includes(storeId),
          }
        }),
      }
    }),

  joinTemplate: (storeId: number, key: QuestTemplateKey) =>
    respond<{ templateKey: QuestTemplateKey; joined: boolean }>(() => {
      assertMyStore(storeId, 'COMMON403')
      if (!isQuestStore(storeId)) fail(403, 'QUEST4031', '퀘스트 가게로 등록해야 퀘스트에 참여할 수 있어요')
      const d = db()
      d.questParticipants ??= {}
      const list = d.questParticipants[key] ?? []
      if (list.includes(storeId)) fail(409, 'QUEST4096', '이미 참여 중인 퀘스트예요')
      d.questParticipants[key] = [...list, storeId]
      return { templateKey: key, joined: true }
    }),

  leaveTemplate: (storeId: number, key: QuestTemplateKey) =>
    respond<{ templateKey: QuestTemplateKey; joined: boolean }>(() => {
      assertMyStore(storeId, 'COMMON403')
      const d = db()
      const list = d.questParticipants?.[key] ?? []
      if (!list.includes(storeId)) fail(409, 'QUEST4097', '참여하지 않은 퀘스트예요')
      d.questParticipants = { ...d.questParticipants, [key]: list.filter((id) => id !== storeId) }
      return { templateKey: key, joined: false }
    }),

  getSubscription: (storeId: number) =>
    respond<QuestSubscription>(() => {
      const sub = db().subscriptions[storeId]
      if (!sub) return { storeId, status: 'NONE', startedAt: null, expiresAt: null }
      return { storeId, status: isQuestStore(storeId) ? 'ACTIVE' : 'EXPIRED', ...sub }
    }),

  subscribe: (storeId: number) =>
    respond<QuestSubscription>(() => {
      assertMyStore(storeId, 'COMMON403')
      if (isQuestStore(storeId)) fail(409, 'QUEST4094', '이미 퀘스트 가게로 등록되어 있어요')
      const today = kstDate()
      const sub = { startedAt: `${today}T00:00:00+09:00`, expiresAt: endOfKstDay(addDays(today, 30)) }
      db().subscriptions[storeId] = sub
      return { storeId, status: 'ACTIVE', ...sub }
    }),

  getQr: (storeId: number) =>
    respond<QuestQr>(() => {
      assertMyStore(storeId, 'COMMON403')
      if (!isQuestStore(storeId)) fail(403, 'QUEST4031', '퀘스트 가게로 등록해야 QR을 받을 수 있어요')
      return { qrToken: qrToken(storeId), expiresAt: endOfKstDay(kstDate()) }
    }),
}

function assertMyStore(storeId: number, code: string) {
  if (storeId !== MOCK_OWNER_STORE_ID) fail(403, code, '내 가게가 아니에요')
}

/* ── 3. 비둘기 ── */

export const mockPigeonApi = {
  get: () =>
    respond<Pigeon>(() => {
      const d = db()
      const today = kstDate()
      return {
        level: d.pigeon.level,
        maxLevel: MAX_LEVEL,
        levelName: null,
        currentFeed: d.pigeon.currentFeed,
        requiredFeed: requiredFeed(d.pigeon.level),
        isMaxLevel: d.pigeon.level >= MAX_LEVEL,
        feedBalance: d.pigeon.feedBalance ?? 0,
        today: {
          dailyFeedClaimed: d.feedLogs.some((l) => l.date === today && l.source === 'DAILY'),
          adFeedCount: d.feedLogs.filter((l) => l.date === today && l.source === 'AD').length,
          adFeedLimit: AD_FEED_LIMIT,
        },
      }
    }),

  daily: () =>
    respond<FeedResult>(() => {
      const d = db()
      if (d.pigeon.level >= MAX_LEVEL) fail(409, 'PIGEON4093', '이미 최고 레벨이에요')
      if (d.feedLogs.some((l) => l.date === kstDate() && l.source === 'DAILY')) {
        fail(409, 'PIGEON4091', '오늘은 이미 무료 먹이를 받았어요')
      }
      return { feedGained: 1, ...grantFeed(1, 'DAILY') }
    }),

  ad: (adTransactionId: string) =>
    respond<FeedResult>(() => {
      const d = db()
      if (!adTransactionId) fail(400, 'COMMON400', '입력값이 올바르지 않아요')
      if (d.pigeon.level >= MAX_LEVEL) fail(409, 'PIGEON4093', '이미 최고 레벨이에요')
      const todayAds = d.feedLogs.filter((l) => l.date === kstDate() && l.source === 'AD').length
      if (todayAds >= AD_FEED_LIMIT) fail(429, 'PIGEON4291', '오늘 광고 보상을 모두 받았어요')
      if (d.feedLogs.some((l) => l.adTransactionId === adTransactionId)) {
        fail(409, 'PIGEON4092', '이미 처리한 광고 시청이에요')
      }
      const granted = grantFeed(1, 'AD', adTransactionId)
      return { feedGained: 1, adFeedCount: todayAds + 1, adFeedLimit: AD_FEED_LIMIT, ...granted }
    }),

  /** 명세에 없는 추가 API(제안): POST /api/pigeon/feed { amount } — 보유 먹이를 비둘기에게 줌 */
  feed: (amount: number) =>
    respond<FeedPigeonResult>(() => {
      const d = db()
      if (!Number.isInteger(amount) || amount < 1) fail(400, 'COMMON400', '입력값이 올바르지 않아요')
      if (d.pigeon.level >= MAX_LEVEL) fail(409, 'PIGEON4093', '이미 최고 레벨이에요')
      if ((d.pigeon.feedBalance ?? 0) < amount) fail(409, 'PIGEON4094', '먹이가 부족해요')
      return feedPigeon(amount)
    }),

  history: (page = 0, size = 20) =>
    respond<HistoryPage>(() => {
      if (size > 50) fail(400, 'COMMON400', '입력값이 올바르지 않아요')
      const all = db().history
      return { history: all.slice(page * size, (page + 1) * size), page, size, hasNext: (page + 1) * size < all.length }
    }),
}

/* ── 4. 쿠폰 ── */

function effectiveStatus(uc: UserCouponRow): UserCouponStatus {
  if (uc.status === 'AVAILABLE' && Date.parse(uc.expiresAt) < Date.now()) return 'EXPIRED'
  return uc.status
}

export const mockCouponApi = {
  create: (storeId: number, body: CreateCouponRequest) =>
    respond<CreateCouponResult>(() => {
      assertMyStore(storeId, 'COUPON4031')
      const invalid = validateCoupon(body)
      if (invalid) fail(400, 'COUPON4001', invalid)
      const row = coupon(
        nextId(), storeId, body.title.trim(), body.discountType, body.discountValue, body.minOrderAmount ?? 0,
        body.totalQuantity, 0, 0, body.validDays, body.useAsPigeonReward ?? false, kstDate(),
      )
      row.createdAt = kstIso()
      db().coupons.unshift(row)
      return { couponId: row.couponId, status: row.status, createdAt: row.createdAt }
    }),

  ownerList: (storeId: number, status?: OwnerCoupon['status']) =>
    respond<{ coupons: OwnerCoupon[] }>(() => {
      assertMyStore(storeId, 'COUPON4031')
      const coupons = db()
        .coupons.filter((c) => c.storeId === storeId && (!status || c.status === status))
        .map(({ storeId: _s, validDays: _v, ...c }) => ({ ...c, remainingQuantity: remaining(c as CouponRow) }))
      return { coupons }
    }),

  stop: (storeId: number, couponId: number) =>
    respond<{ couponId: number; status: OwnerCoupon['status'] }>(() => {
      assertMyStore(storeId, 'COUPON4031')
      const c = db().coupons.find((x) => x.couponId === couponId && x.storeId === storeId)
      if (!c) fail(404, 'COUPON4041', '쿠폰을 찾을 수 없어요')
      if (c.status !== 'ACTIVE') fail(409, 'COUPON4093', '이미 중지되었거나 소진된 쿠폰이에요')
      c.status = 'STOPPED'
      return { couponId, status: c.status }
    }),

  available: (storeId: number) =>
    respond<{ coupons: AvailableCoupon[] }>(() => ({
      coupons: db()
        .coupons.filter((c) => c.storeId === storeId && c.status === 'ACTIVE' && remaining(c) > 0)
        .map((c) => ({
          couponId: c.couponId,
          title: c.title,
          discountType: c.discountType,
          discountValue: c.discountValue,
          minOrderAmount: c.minOrderAmount,
          validDays: c.validDays,
          remainingQuantity: remaining(c),
          alreadyDownloaded: db().userCoupons.some((u) => u.mine && u.couponId === c.couponId),
        })),
    })),

  download: (couponId: number) =>
    respond<DownloadResult>(() => {
      const c = db().coupons.find((x) => x.couponId === couponId)
      if (!c) fail(404, 'COUPON4041', '쿠폰을 찾을 수 없어요')
      if (db().userCoupons.some((u) => u.mine && u.couponId === couponId)) fail(409, 'COUPON4091', '이미 받은 쿠폰이에요')
      if (c.status !== 'ACTIVE' || remaining(c) <= 0) fail(410, 'COUPON4101', '쿠폰이 모두 소진되었어요')
      const uc = issueUserCoupon(c, 'DOWNLOAD')
      return { userCouponId: uc.userCouponId, redeemCode: uc.redeemCode, expiresAt: uc.expiresAt }
    }),

  mine: (status?: UserCouponStatus) =>
    respond<MyCouponPage>(() => {
      const rows = db()
        .userCoupons.filter((u) => u.mine)
        .map((u) => {
          const c = db().coupons.find((x) => x.couponId === u.couponId)!
          return {
            userCouponId: u.userCouponId,
            storeId: c.storeId,
            storeName: storeName(c.storeId),
            title: c.title,
            discountType: c.discountType,
            discountValue: c.discountValue,
            minOrderAmount: c.minOrderAmount,
            source: u.source,
            redeemCode: u.redeemCode,
            status: effectiveStatus(u),
            expiresAt: u.expiresAt,
            usedAt: u.usedAt,
            createdAt: u.createdAt,
          }
        })
        .filter((u) => !status || u.status === status)
        .sort((a, b) =>
          a.status === 'AVAILABLE' && b.status === 'AVAILABLE'
            ? Date.parse(a.expiresAt) - Date.parse(b.expiresAt)
            : Date.parse(b.createdAt) - Date.parse(a.createdAt),
        )
        .map(({ createdAt: _c, ...u }) => u)
      return { coupons: rows, page: 0, size: 20, hasNext: false }
    }),

  redeem: (redeemCode: string) =>
    respond<RedeemResult>(() => {
      const uc = db().userCoupons.find((u) => u.redeemCode === redeemCode.trim().toUpperCase())
      if (!uc) fail(404, 'COUPON4042', '코드에 해당하는 쿠폰이 없어요')
      const c = db().coupons.find((x) => x.couponId === uc.couponId)!
      if (c.storeId !== MOCK_OWNER_STORE_ID) fail(403, 'COUPON4032', '다른 가게 쿠폰이에요')
      if (uc.status === 'USED') fail(409, 'COUPON4092', '이미 사용된 쿠폰이에요')
      if (effectiveStatus(uc) === 'EXPIRED') fail(410, 'COUPON4102', '기한이 지난 쿠폰이에요')

      const redeemedAt = kstIso()
      uc.status = 'USED'
      uc.usedAt = redeemedAt
      c.usedCount += 1
      db().fees.push({ storeId: c.storeId, userCouponId: uc.userCouponId, title: c.title, discountValue: c.discountValue, fee: COUPON_FEE, redeemedAt })
      return {
        userCouponId: uc.userCouponId,
        title: c.title,
        discountType: c.discountType,
        discountValue: c.discountValue,
        minOrderAmount: c.minOrderAmount,
        fee: COUPON_FEE,
        redeemedAt,
      }
    }),

  settlements: (storeId: number, month: string) =>
    respond<Settlement>(() => {
      assertMyStore(storeId, 'COUPON4031')
      if (!/^\d{4}-\d{2}$/.test(month)) fail(400, 'COMMON400', '입력값이 올바르지 않아요')
      const items = db()
        .fees.filter((f) => f.storeId === storeId && f.redeemedAt.startsWith(month))
        .sort((a, b) => Date.parse(b.redeemedAt) - Date.parse(a.redeemedAt))
        .map(({ storeId: _s, ...f }) => f)
      return {
        month,
        usedCount: items.length,
        totalDiscount: items.reduce((sum, f) => sum + f.discountValue, 0),
        totalFee: items.reduce((sum, f) => sum + f.fee, 0),
        items,
      }
    }),
}
