import { mockAddFeed, mockFor, mockPigeonApi, mockQrHint, mockQuestApi } from '@/mocks/db'
import { api, request } from '@/shared/api/client'
import type {
  AlbumItem,
  GraduateResult,
  QuestEventResult,
  QuestEventType,
  FeedPigeonResult,
  FeedResult,
  HistoryPage,
  OwnerQuestTemplate,
  QuestTemplateKey,
  Pigeon,
  QuestListResult,
  QuestQr,
  QuestSubscription,
  VisitRequest,
  VisitResult,
} from './schema'

/* 2. Quest */

export function fetchQuests(): Promise<QuestListResult> {
  if (mockFor('quest')) return mockQuestApi.list()
  return request(api.get('/api/quests'))
}

export function postVisit(questId: number, body: VisitRequest): Promise<VisitResult> {
  if (mockFor('quest')) return mockQuestApi.visit(questId, body)
  return request(api.post(`/api/quests/${questId}/visits`, body))
}

/**
 * 기본 퀘스트 진행 기록 — 숏폼을 보거나(SHORTFORM_VIEW) 가게 상세를 열면(STORE_VIEW).
 * 같은 대상은 서버가 한 번만 셈. 목업은 기본 퀘스트 진행도가 고정값이라 기록하지 않음
 */
export async function postQuestEvent(type: QuestEventType, targetId: number): Promise<QuestEventResult | null> {
  if (mockFor('quest')) return null
  return request(api.post('/api/quests/events', { type, targetId }))
}

export function fetchQuestSubscription(storeId: number): Promise<QuestSubscription> {
  if (mockFor('quest')) return mockQuestApi.getSubscription(storeId)
  return request(api.get(`/api/stores/${storeId}/quest-subscription`))
}

/** 해커톤: 결제는 모의 처리 */
export function postQuestSubscription(storeId: number): Promise<QuestSubscription> {
  if (mockFor('quest')) return mockQuestApi.subscribe(storeId)
  return request(api.post(`/api/stores/${storeId}/quest-subscription`, { plan: 'MONTHLY' }))
}

/* 사장님: 퀘스트 템플릿 참여 (명세 추가 제안) */

export function fetchQuestTemplates(storeId: number): Promise<{ templates: OwnerQuestTemplate[] }> {
  if (mockFor('quest')) return mockQuestApi.templates(storeId)
  return request(api.get(`/api/stores/${storeId}/quest-templates`))
}

export function postJoinQuestTemplate(storeId: number, key: QuestTemplateKey) {
  if (mockFor('quest')) return mockQuestApi.joinTemplate(storeId, key)
  return request<{ templateKey: QuestTemplateKey; joined: boolean }>(api.post(`/api/stores/${storeId}/quest-templates/${key}`))
}

export function deleteJoinQuestTemplate(storeId: number, key: QuestTemplateKey) {
  if (mockFor('quest')) return mockQuestApi.leaveTemplate(storeId, key)
  return request<{ templateKey: QuestTemplateKey; joined: boolean }>(api.delete(`/api/stores/${storeId}/quest-templates/${key}`))
}

export function fetchQuestQr(storeId: number): Promise<QuestQr> {
  if (mockFor('quest')) return mockQuestApi.getQr(storeId)
  return request(api.get(`/api/stores/${storeId}/quest-qr`))
}

/* 3. 비둘기 */

export function fetchPigeon(): Promise<Pigeon> {
  if (mockFor('quest')) return mockPigeonApi.get()
  return request(api.get('/api/pigeon'))
}

export function postDailyFeed(): Promise<FeedResult> {
  if (mockFor('quest')) return mockPigeonApi.daily()
  return request(api.post('/api/pigeon/feeds/daily'))
}

export function postAdFeed(adTransactionId: string): Promise<FeedResult> {
  if (mockFor('quest')) return mockPigeonApi.ad(adTransactionId)
  return request(api.post('/api/pigeon/feeds/ad', { adTransactionId }))
}

/** 보유 먹이 주기 (명세에 없는 추가 API 제안: POST /api/pigeon/feed) */
export function postFeedPigeon(amount: number): Promise<FeedPigeonResult> {
  if (mockFor('quest')) return mockPigeonApi.feed(amount)
  return request(api.post('/api/pigeon/feed', { amount }))
}

/**
 * 테스트용 QR 값 (방문 인증 화면 힌트). 목업은 목업 값, 서버는 로컬 프로필에만 있는 API
 * (운영 서버면 404 → 힌트 없음)
 */
export async function fetchTestQrHint(storeId: number): Promise<string | null> {
  if (mockFor('quest')) return mockQrHint(storeId)
  try {
    return (await request<QuestQr>(api.get(`/api/dev/quest-qr/${storeId}`))).qrToken
  } catch {
    return null
  }
}

/** Lv.10 졸업 → 앨범에 남기고 새 알 */
export function postGraduate(): Promise<GraduateResult> {
  if (mockFor('quest')) return mockPigeonApi.graduate()
  return request(api.post('/api/pigeon/graduate'))
}

/** 내 비둘기 앨범 (졸업한 비둘기, 최근 순) */
export function fetchPigeonAlbum(): Promise<{ graduates: AlbumItem[] }> {
  if (mockFor('quest')) return mockPigeonApi.album()
  return request(api.get('/api/pigeon/album'))
}

/** 테스트용 먹이 (설정 서랍) — 서버는 로컬 프로필에만 있는 API */
export async function addTestFeed(amount: number) {
  if (mockFor('quest')) return mockAddFeed(amount)
  await request(api.post('/api/dev/pigeon/feed', { amount }))
}

export function fetchPigeonHistory(page = 0, size = 20): Promise<HistoryPage> {
  if (mockFor('quest')) return mockPigeonApi.history(page, size)
  return request(api.get('/api/pigeon/history', { params: { page, size } }))
}
