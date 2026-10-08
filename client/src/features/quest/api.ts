import { mockPigeonApi, mockQuestApi, USE_MOCK } from '@/mocks/db'
import { api, request } from '@/shared/api/client'
import type {
  FeedPigeonResult,
  FeedResult,
  HistoryPage,
  Pigeon,
  QuestListResult,
  QuestQr,
  QuestSubscription,
  VisitRequest,
  VisitResult,
} from './schema'

/* 2. Quest */

export function fetchQuests(): Promise<QuestListResult> {
  if (USE_MOCK) return mockQuestApi.list()
  return request(api.get('/api/quests'))
}

export function postVisit(questId: number, body: VisitRequest): Promise<VisitResult> {
  if (USE_MOCK) return mockQuestApi.visit(questId, body)
  return request(api.post(`/api/quests/${questId}/visits`, body))
}

export function fetchQuestSubscription(storeId: number): Promise<QuestSubscription> {
  if (USE_MOCK) return mockQuestApi.getSubscription(storeId)
  return request(api.get(`/api/stores/${storeId}/quest-subscription`))
}

/** 해커톤: 결제는 모의 처리 */
export function postQuestSubscription(storeId: number): Promise<QuestSubscription> {
  if (USE_MOCK) return mockQuestApi.subscribe(storeId)
  return request(api.post(`/api/stores/${storeId}/quest-subscription`, { plan: 'MONTHLY' }))
}

export function fetchQuestQr(storeId: number): Promise<QuestQr> {
  if (USE_MOCK) return mockQuestApi.getQr(storeId)
  return request(api.get(`/api/stores/${storeId}/quest-qr`))
}

/* 3. 비둘기 */

export function fetchPigeon(): Promise<Pigeon> {
  if (USE_MOCK) return mockPigeonApi.get()
  return request(api.get('/api/pigeon'))
}

export function postDailyFeed(): Promise<FeedResult> {
  if (USE_MOCK) return mockPigeonApi.daily()
  return request(api.post('/api/pigeon/feeds/daily'))
}

export function postAdFeed(adTransactionId: string): Promise<FeedResult> {
  if (USE_MOCK) return mockPigeonApi.ad(adTransactionId)
  return request(api.post('/api/pigeon/feeds/ad', { adTransactionId }))
}

/** 보유 먹이 주기 (명세에 없는 추가 API 제안: POST /api/pigeon/feed) */
export function postFeedPigeon(amount: number): Promise<FeedPigeonResult> {
  if (USE_MOCK) return mockPigeonApi.feed(amount)
  return request(api.post('/api/pigeon/feed', { amount }))
}

export function fetchPigeonHistory(page = 0, size = 20): Promise<HistoryPage> {
  if (USE_MOCK) return mockPigeonApi.history(page, size)
  return request(api.get('/api/pigeon/history', { params: { page, size } }))
}
