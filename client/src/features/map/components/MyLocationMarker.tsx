import { CustomOverlayMap } from 'react-kakao-maps-sdk'
import pigeonWalk from '@/assets/map/pigeon-walk.png'
import type { LatLng } from '../schema'

/** 내 위치: 걷는 비둘기 + "저벅저벅" 말풍선 (Figma 94:154) */
export function MyLocationMarker({ position }: { position: LatLng }) {
  return (
    <CustomOverlayMap position={position} yAnchor={0.5} xAnchor={0.5} zIndex={0}>
      <div className="pointer-events-none relative size-[47px]">
        <span className="absolute top-3 left-5 h-[22px] w-2 rounded-sm shadow-[0_0_16px_18px_rgba(204,255,205,0.8)]" />
        <img src={pigeonWalk} alt="내 위치" className="relative size-full object-contain" />
        <span className="absolute bottom-[38px] left-8 rounded-full border border-green-1 bg-white px-[10px] py-2 text-base leading-none font-medium whitespace-nowrap text-ink">
          저벅저벅
        </span>
      </div>
    </CustomOverlayMap>
  )
}
