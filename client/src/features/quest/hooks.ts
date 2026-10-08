import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { mockFor } from '@/mocks/db'
import { useMe } from '@/stores/authStore'
import { toast } from '@/stores/toastStore'
import {
  deleteJoinQuestTemplate,
  fetchPigeon,
  fetchPigeonAlbum,
  fetchPigeonHistory,
  fetchQuestQr,
  fetchQuests,
  fetchQuestSubscription,
  fetchQuestTemplates,
  postAdFeed,
  postDailyFeed,
  postFeedPigeon,
  postGraduate,
  postJoinQuestTemplate,
  postQuestEvent,
  postQuestSubscription,
  postVisit,
} from './api'
import type { QuestEventType, QuestTemplateKey, VisitRequest } from './schema'

export const questKeys = {
  quests: ['quests'] as const,
  pigeon: ['pigeon'] as const,
  history: ['pigeon', 'history'] as const,
  album: ['pigeon', 'album'] as const,
  subscription: (storeId: number) => ['quest-subscription', storeId] as const,
  qr: (storeId: number) => ['quest-qr', storeId] as const,
  templates: (storeId: number) => ['quest-templates', storeId] as const,
}

/**
 * 비둘기는 회원마다 따로라 서버 연동 땐 로그인해야 볼 수 있음 (목업은 로그인 없이도).
 * 계정이 바뀌면 다시 받도록 쿼리 키에 회원 id를 넣음
 */
export function usePigeonAccess() {
  const memberId = useMe()?.memberId ?? null
  return { memberId, needsLogin: !mockFor('quest') && memberId === null }
}

export function useQuests() {
  const { memberId } = usePigeonAccess()
  // 로그인 전에도 목록은 보임 (진행도 0)
  return useQuery({ queryKey: [...questKeys.quests, memberId], queryFn: fetchQuests, select: (d) => d.quests })
}

export function usePigeon() {
  const { memberId, needsLogin } = usePigeonAccess()
  return useQuery({ queryKey: [...questKeys.pigeon, 'me', memberId], queryFn: fetchPigeon, enabled: !needsLogin })
}

export function usePigeonAlbum() {
  const { memberId, needsLogin } = usePigeonAccess()
  return useQuery({ queryKey: [...questKeys.album, memberId], queryFn: fetchPigeonAlbum, enabled: !needsLogin })
}

/** 졸업하면 새 알·앨범·기록이 바뀜 (모두 ['pigeon'] 아래) */
export function useGraduate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: postGraduate,
    onSuccess: () => qc.invalidateQueries({ queryKey: questKeys.pigeon }),
  })
}

export function usePigeonHistory() {
  const { memberId, needsLogin } = usePigeonAccess()
  return useQuery({ queryKey: [...questKeys.history, memberId], queryFn: () => fetchPigeonHistory(0, 50), enabled: !needsLogin })
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

/** 이번 접속에서 이미 서버에 알린 행동 (같은 숏폼·가게를 다시 봐도 또 보내지 않음) */
const reportedEvents = new Set<string>()

/**
 * 기본 퀘스트 진행: 숏폼을 delayMs 동안 보거나 가게 상세를 열면 서버에 기록.
 * 로그인 전이면 기록하지 않음. 퀘스트를 깨면 토스트로 알림
 */
export function useQuestEvent(type: QuestEventType, targetId: number | null | undefined, delayMs = 0) {
  const me = useMe()
  const qc = useQueryClient()
  const memberId = me?.memberId
  useEffect(() => {
    if (!memberId || targetId == null) return
    const key = `${memberId}:${type}:${targetId}`
    if (reportedEvents.has(key)) return
    const timer = setTimeout(() => {
      reportedEvents.add(key)
      postQuestEvent(type, targetId)
        .then((res) => {
          if (!res) return
          qc.invalidateQueries({ queryKey: questKeys.quests })
          if (res.completedQuests.length === 0) return
          qc.invalidateQueries({ queryKey: questKeys.pigeon })
          const feed = res.completedQuests.reduce((sum, q) => sum + q.rewardFeed, 0)
          toast(`퀘스트 완료! 먹이 ${feed}개를 획득했습니다`)
        })
        // 실패하면 다음에 다시 볼 때 보내도록
        .catch(() => reportedEvents.delete(key))
    }, delayMs)
    return () => clearTimeout(timer)
  }, [memberId, type, targetId, delayMs, qc])
}
