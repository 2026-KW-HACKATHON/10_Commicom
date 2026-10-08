import { useEffect, type ReactNode } from 'react'
import { CloseIcon } from './icons'

/**
 * 아래에서 올라오는 창. 배경을 누르거나 Esc로 닫힘.
 * - bottom: 화면 아래에 붙는 시트
 * - center: 아래에서 올라와 화면 가운데에 뜨는 카드
 */
export function Sheet({
  title,
  onClose,
  children,
  placement = 'bottom',
}: {
  title: string
  onClose: () => void
  children: ReactNode
  placement?: 'bottom' | 'center'
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const center = placement === 'center'

  return (
    <div className={`fixed inset-0 z-40 flex justify-center ${center ? 'items-center px-5' : 'items-end'}`}>
      <button type="button" aria-label="닫기" className="absolute inset-0 animate-[fade_.2s] bg-black/35" onClick={onClose} />
      <section
        role="dialog"
        aria-modal
        aria-label={title}
        className={
          center
            ? 'relative max-h-[78vh] w-full max-w-[390px] animate-[rise-center_.32s_cubic-bezier(.2,.9,.25,1.05)] overflow-y-auto rounded-3xl bg-white px-5 pt-5 pb-6 shadow-[0_20px_50px_rgba(8,104,22,0.25)]'
            : 'relative max-h-[80vh] w-full max-w-[430px] animate-[rise_.25s_ease-out] overflow-y-auto rounded-t-3xl bg-white px-5 pt-5 pb-[max(24px,env(safe-area-inset-bottom))]'
        }
      >
        <header className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-q-text">{title}</h2>
          <button type="button" aria-label="닫기" onClick={onClose} className="flex size-8 items-center justify-center text-q-muted">
            <CloseIcon />
          </button>
        </header>
        {children}
      </section>
    </div>
  )
}
