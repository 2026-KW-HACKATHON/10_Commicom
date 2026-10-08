import { useState } from 'react'
import { CloseIcon } from '@/shared/ui/icons'

/** 지도 상단 안내 배너 (Figma 94:148) */
export function MapBanner() {
  const [open, setOpen] = useState(true)
  if (!open) return null

  return (
    <div className="absolute inset-x-[14px] top-1.5 z-20 flex h-[37px] items-center justify-between rounded-full border border-green-1 bg-white pr-4 pl-[18px] text-base font-medium text-ink">
      <span className="truncate">내 주변 잇-다 업로드 매장을 확인해보세요!</span>
      <button
        type="button"
        aria-label="배너 닫기"
        className="ml-2 flex size-6 shrink-0 items-center justify-center text-green-1"
        onClick={() => setOpen(false)}
      >
        <CloseIcon />
      </button>
    </div>
  )
}
