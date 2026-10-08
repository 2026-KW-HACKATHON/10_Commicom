import { useParams, useSearchParams } from 'react-router-dom'
import { ScrapGrid } from '@/features/feed/components/ScrapGrid'
import { ShortformFeed } from '@/features/feed/components/ShortformFeed'

/** 숏폼 탭 (?start=영상id 로 특정 영상부터) */
export function FeedPage() {
  const [params] = useSearchParams()
  const start = Number(params.get('start')) || undefined
  return <ShortformFeed key={start ?? 'feed'} startId={start} />
}

/** 지도 → "홍보 영상 보기": 그 가게 영상부터 (사장님 내 영상 → "손님 화면에서 보기"는 ?start=로 그 영상부터) */
export function StoreShortformPage() {
  const { storeId } = useParams()
  const [params] = useSearchParams()
  const start = Number(params.get('start')) || undefined
  return <ShortformFeed key={`${storeId}-${start}`} storeId={Number(storeId)} startId={start} />
}

export function ScrapPage() {
  return <ScrapGrid />
}
