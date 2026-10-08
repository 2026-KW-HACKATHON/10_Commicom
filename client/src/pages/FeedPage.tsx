import { useParams, useSearchParams } from 'react-router-dom'
import { ScrapGrid } from '@/features/feed/components/ScrapGrid'
import { ShortformFeed } from '@/features/feed/components/ShortformFeed'

/** 숏폼 탭 (?start=영상id 로 특정 영상부터) */
export function FeedPage() {
  const [params] = useSearchParams()
  const start = Number(params.get('start')) || undefined
  return <ShortformFeed key={start ?? 'feed'} startId={start} />
}

/** 지도 → "홍보 영상 보기": 그 가게 영상부터 */
export function StoreShortformPage() {
  const { storeId } = useParams()
  return <ShortformFeed key={storeId} storeId={Number(storeId)} />
}

export function ScrapPage() {
  return <ScrapGrid />
}
