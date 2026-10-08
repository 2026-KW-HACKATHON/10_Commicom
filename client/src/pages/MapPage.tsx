import { useParams } from 'react-router-dom'
import { StoreMapView } from '@/features/map/components/StoreMapView'
import { StoreProfile } from '@/features/map/components/StoreProfile'

export function MapPage() {
  return <StoreMapView />
}

/** 지도 → 가게 프로필 */
export function StoreProfilePage() {
  const { storeId } = useParams()
  return <StoreProfile key={storeId} storeId={Number(storeId)} />
}
