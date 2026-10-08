import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchPigeon,
  fetchPigeonHistory,
  fetchQuestQr,
  fetchQuests,
  fetchQuestSubscription,
  postAdFeed,
  postDailyFeed,
  postFeedPigeon,
  postQuestSubscription,
  postVisit,
} from './api'
import type { VisitRequest } from './schema'

export const questKeys = {
  quests: ['quests'] as const,
  pigeon: ['pigeon'] as const,
  history: ['pigeon', 'history'] as const,
  subscription: (storeId: number) => ['quest-subscription', storeId] as const,
  qr: (storeId: number) => ['quest-qr', storeId] as const,
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

export function useQuestQr(storeId: number, enabled: boolean) {
  return useQuery({ queryKey: questKeys.qr(storeId), queryFn: () => fetchQuestQr(storeId), enabled })
}
