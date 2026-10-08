import { useEffect, useState } from 'react'
import { errorMessage } from '@/shared/lib/error'
import { ConfettiBurst } from '@/shared/ui/Confetti'
import { Sheet } from '@/shared/ui/Sheet'
import { useAvailableCoupons, useDownloadCoupon } from '../hooks'
import { minOrderText } from '../schema'
import { CouponTicket } from './CouponTicket'

/** 가게의 받을 수 있는 쿠폰 + 받기 (4-4, 4-5) — 지도 핀·가게 화면에서 사용 */
export function StoreCouponSheet({
  storeId,
  storeName,
  onClose,
}: {
  storeId: number
  storeName: string
  onClose: () => void
}) {
  const { data: coupons, isLoading } = useAvailableCoupons(storeId)
  const download = useDownloadCoupon()
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)
  // 쿠폰을 받을 때마다 숫자를 올려 폭죽을 새로 터뜨림
  const [burst, setBurst] = useState(0)

  useEffect(() => {
    if (!burst) return
    const t = setTimeout(() => setBurst(0), 1300)
    return () => clearTimeout(t)
  }, [burst])

  return (
    <Sheet title={`${storeName} 쿠폰`} onClose={onClose} placement="center">
      {isLoading && <div className="h-24 animate-pulse rounded-2xl bg-q-panel" />}
      {coupons && coupons.length === 0 && (
        <p className="py-8 text-center text-sm text-q-muted">지금 받을 수 있는 쿠폰이 없어요</p>
      )}
      <ul className="flex flex-col gap-2.5">
        {coupons?.map((c) => (
          <li key={c.couponId}>
            <CouponTicket
              discountType={c.discountType}
              discountValue={c.discountValue}
              title={c.title}
              lines={[minOrderText(c.minOrderAmount), `받은 날부터 ${c.validDays}일 · 남은 ${c.remainingQuantity}장`]}
              action={
                <button
                  type="button"
                  disabled={c.alreadyDownloaded || download.isPending}
                  onClick={() =>
                    download.mutate(c.couponId, {
                      onSuccess: () => {
                        setMessage({ ok: true, text: '🎉 쿠폰함에 담았어요!' })
                        setBurst((n) => n + 1)
                      },
                      onError: (e) => setMessage({ ok: false, text: errorMessage(e) }),
                    })
                  }
                  className="h-9 rounded-full bg-q-green px-4 text-[13px] font-bold whitespace-nowrap text-white transition-transform active:scale-95 disabled:bg-q-mint disabled:text-q-green"
                >
                  {c.alreadyDownloaded ? '✓ 받음' : '받기'}
                </button>
              }
            />
          </li>
        ))}
      </ul>
      {message && (
        <p
          role="status"
          key={message.text + burst}
          className={`mt-4 animate-[rise-center_.3s_ease-out] rounded-full py-2.5 text-center text-sm font-bold ${
            message.ok ? 'bg-q-mint text-q-green' : 'bg-point-yellow/30 text-point-red-dark'
          }`}
        >
          {message.text}
        </p>
      )}
      {burst > 0 && <ConfettiBurst key={burst} />}
    </Sheet>
  )
}
