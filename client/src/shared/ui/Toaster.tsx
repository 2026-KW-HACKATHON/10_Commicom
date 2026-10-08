import { useEffect } from 'react'
import { useToastStore } from '@/stores/toastStore'

const SHOW_MS = 2200

/** 화면 위쪽에 잠깐 떴다 사라지는 공통 알림 (App에 하나만 둠) */
export function Toaster() {
  const current = useToastStore((s) => s.current)
  const hide = useToastStore((s) => s.hide)

  useEffect(() => {
    if (!current) return
    const t = setTimeout(() => hide(current.id), SHOW_MS)
    return () => clearTimeout(t)
  }, [current, hide])

  if (!current) return null
  return (
    <div className="pointer-events-none fixed inset-x-0 top-[max(84px,calc(env(safe-area-inset-top)+76px))] z-[90] flex justify-center px-6">
      <p
        key={current.id}
        role="status"
        aria-live="polite"
        className={`max-w-[380px] animate-[toast_2.2s_ease-in-out_forwards] rounded-full px-4 py-2.5 text-center text-[14px] font-bold shadow-[0_6px_20px_rgba(0,0,0,0.18)] ${
          current.tone === 'error' ? 'bg-point-red-dark text-white' : 'bg-ink/90 text-white backdrop-blur'
        }`}
      >
        {current.message}
      </p>
    </div>
  )
}
