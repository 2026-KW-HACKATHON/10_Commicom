import { EarlyOwnerEventDetail } from '@/features/event/components/EarlyOwnerEventDetail'
import { NewsBoard } from '@/features/event/components/NewsBoard'
import { NoticeDetail } from '@/features/event/components/NoticeDetail'

/** 이벤트 · 공지사항 목록 */
export function EventPage() {
  return <NewsBoard />
}

export function EarlyOwnerEventPage() {
  return <EarlyOwnerEventDetail />
}

export function NoticePage() {
  return <NoticeDetail />
}
