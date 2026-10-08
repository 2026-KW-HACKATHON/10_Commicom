import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  deleteJoinQuestTemplate,
  fetchPigeon,
  fetchPigeonHistory,
  fetchQuestQr,
  fetchQuests,
  fetchQuestSubscription,
  fetchQuestTemplates,
  postAdFeed,
  postDailyFeed,
  postFeedPigeon,
  postJoinQuestTemplate,
  postQuestSubscription,
  postVisit,
} from './api'
import type { QuestTemplateKey, VisitRequest } from './schema'

export const questKeys = {
  quests: ['quests'] as const,
  pigeon: ['pigeon'] as const,
  history: ['pigeon', 'history'] as const,
  subscription: (storeId: number) => ['quest-subscription', storeId] as const,
  qr: (storeId: number) => ['quest-qr', storeId] as const,
  templates: (storeId: number) => ['quest-templates', storeId] as const,
}

export function useQuests() {
  return useQuery({ queryKey: questKeys.quests, queryFn: fetchQuests, select: (d) => d.quests })
}

export function usePigeon() {
  return useQuery({ queryKey: questKeys.pigeon, queryFn: fetchPigeon })
}

export function usePigeonHistory() {
  return useQuery({ queryKey: questKeys.history, queryFn: () => fetchPigeonHistory(0, 50) })
}

/** 먹이가 지급되면 비둘기·기록·쿠폰함(뽑기 쿠폰)·쿠폰 수(지도)가 바뀜 */
function useInvalidateAfterFeed() {
  const qc = useQueryClient()
  return () => {
    qc.invalidateQueries({ queryKey: questKeys.pigeon })
    qc.invalidateQueries({ queryKey: ['coupons'] })
    qc.invalidateQueries({ queryKey: ['stores'] })
  }
}

export function useVisit(questId: number) {
  const invalidate = useInvalidateAfterFeed()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: VisitRequest) => postVisit(questId, body),
    onSuccess: () => {
      invalidate()
      qc.invalidateQueries({ queryKey: questKeys.quests })
    },
  })
}

export function useDailyFeed() {
  const invalidate = useInvalidateAfterFeed()
  return useMutation({ mutationFn: postDailyFeed, onSuccess: invalidate })
}

export function useAdFeed() {
  const invalidate = useInvalidateAfterFeed()
  return useMutation({ mutationFn: postAdFeed, onSuccess: invalidate })
}

export function useFeedPigeon() {
  const invalidate = useInvalidateAfterFeed()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: postFeedPigeon,
    onSuccess: () => {
      invalidate()
      qc.invalidateQueries({ queryKey: questKeys.history })
    },
  })
}

export function useQuestSubscription(storeId: number) {
  return useQuery({ queryKey: questKeys.subscription(storeId), queryFn: () => fetchQuestSubscription(storeId) })
}

export function useSubscribeQuestStore(storeId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => postQuestSubscription(storeId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: questKeys.subscription(storeId) })
      qc.invalidateQueries({ queryKey: questKeys.qr(storeId) })
      qc.invalidateQueries({ queryKey: ['stores'] })
    },
  })
}

export function useQuestTemplates(storeId: number) {
  return useQuery({
    queryKey: questKeys.templates(storeId),
    queryFn: () => fetchQuestTemplates(storeId),
    select: (d) => d.templates,
  })
}

/** 참여/취소 후 사장님 목록과 손님 퀘스트 목록을 함께 새로고침 */
export function useToggleQuestTemplate(storeId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ key, join }: { key: QuestTemplateKey; join: boolean }) =>
      join ? postJoinQuestTemplate(storeId, key) : deleteJoinQuestTemplate(storeId, key),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: questKeys.templates(storeId) })
      qc.invalidateQueries({ queryKey: questKeys.quests })
    },
  })
}

export function useQuestQr(storeId: number, enabled: boolean) {
  return useQuery({ queryKey: questKeys.qr(storeId), queryFn: () => fetchQuestQr(storeId), enabled })
}
