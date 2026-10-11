import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { noticeKeys, type ServerNotice } from '@/features/event/api'
import { api, request } from '@/shared/api/client'

/** 관리자 API (/api/admin/**, role ADMIN 만) */
export interface AdminSummary {
  residents: number
  owners: number
  stores: number
  shortforms: number
  activeCoupons: number
  rewardPool: boolean
  vouchersWaiting: number
  feedbacks: number
  averageRating: number
  earlyOwners: number
}

export interface AdminFeedback {
  feedbackId: number
  rating: number
  good: string | null
  bad: string | null
  mode: 'USER' | 'OWNER' | null
  beta: boolean
  createdAt: string
}

export interface AdminEarlyOwner {
  storeId: number
  storeName: string
  couponId: number
  grantedAt: string
}

export interface NoticeInput {
  title: string
  body: string
  pinned: boolean
}

const adminKeys = {
  summary: ['admin', 'summary'] as const,
  feedback: ['admin', 'feedback'] as const,
  earlyOwners: ['admin', 'early-owner'] as const,
}

export function useAdminSummary() {
  return useQuery({ queryKey: adminKeys.summary, queryFn: () => request<AdminSummary>(api.get('/api/admin/summary')) })
}

export function useAdminFeedback() {
  return useQuery({
    queryKey: adminKeys.feedback,
    queryFn: () => request<{ feedbacks: AdminFeedback[] }>(api.get('/api/admin/feedback', { params: { size: 100 } })),
    select: (d) => d.feedbacks,
  })
}

export function useAdminEarlyOwners() {
  return useQuery({ queryKey: adminKeys.earlyOwners, queryFn: () => request<AdminEarlyOwner[]>(api.get('/api/admin/early-owner')) })
}

/** 공지 작성·수정·삭제 → 공지 목록 다시 받음 */
export function useSaveNotice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ noticeId, ...body }: NoticeInput & { noticeId?: number }) =>
      request<ServerNotice>(noticeId ? api.patch(`/api/admin/notices/${noticeId}`, body) : api.post('/api/admin/notices', body)),
    onSuccess: () => qc.invalidateQueries({ queryKey: noticeKeys.all }),
  })
}

export function useDeleteNotice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (noticeId: number) => request(api.delete(`/api/admin/notices/${noticeId}`)),
    onSuccess: () => qc.invalidateQueries({ queryKey: noticeKeys.all }),
  })
}
