import { useEffect, useState } from 'react'

const AD_SECONDS = 5

/**
 * 보상형 동영상 광고 자리 (3-3).
 * 해커톤: 시청 완료 콜백 대신 카운트다운 후 onComplete(adTransactionId).
 * 실제 출시: 광고 SDK가 준 시청 id를 넘기고, 지급은 서버 측 확인(SSV)으로.
 */
export function AdRewardModal({
  onComplete,
  onCancel,
}: {
  onComplete: (adTransactionId: string) => void
  onCancel: () => void
}) {
  const [left, setLeft] = useState(AD_SECONDS)

  useEffect(() => {
    if (left <= 0) {
      onComplete(`web-mock-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`)
      return
    }
    const t = setTimeout(() => setLeft((s) => s - 1), 1000)
    return () => clearTimeout(t)
    // onComplete는 부모가 매 렌더 새로 만들 수 있어 의존성에서 제외
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [left])

  return (
    <div role="dialog" aria-modal aria-label="광고 시청" className="fixed inset-0 z-50 flex justify-center bg-black">
      <div className="flex h-full w-full max-w-[430px] flex-col items-center justify-center px-8 text-white">
        <p className="rounded-full bg-white/15 px-3 py-1 text-xs">광고</p>
        <p className="mt-6 text-center text-xl font-bold">보상형 광고 시청 중</p>
        <p className="mt-2 text-center text-sm text-white/70">끝까지 보면 먹이 1개를 받아요</p>
        <div className="mt-10 flex size-24 items-center justify-center rounded-full border-4 border-white/30 text-3xl font-bold tabular-nums">
          {Math.max(left, 0)}
        </div>
        <button type="button" onClick={onCancel} className="mt-12 text-sm text-white/60 underline">
          그만 보기 (먹이 없음)
        </button>
      </div>
    </div>
  )
}
