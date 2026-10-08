import { useRef, useState } from 'react'
import { useRedeemCoupon, useSettlement } from '@/features/coupon/hooks'
import { discountText, minOrderText, type RedeemResult } from '@/features/coupon/schema'
import { PrimaryButton } from '@/features/quest/components/QuestUi'
import { mockFor } from '@/mocks/db'
import { errorMessage } from '@/shared/lib/error'
import { useMyStoreId } from '../hooks'
import { OWNER_ILLUST } from '../illustrations'
import { currentMonth, dateTimeText, isToday } from '../date'
import { OwnerCard, OwnerScreen } from './OwnerUi'

const CODE_LENGTH = 6

/** 쿠폰 사용 처리 (4-7) — 손님이 보여준 6자리 코드 입력 */
export function OwnerRedeem() {
  const storeId = useMyStoreId()
  const redeem = useRedeemCoupon()
  const { data: settlement } = useSettlement(storeId, currentMonth())
  const [code, setCode] = useState('')
  const [done, setDone] = useState<RedeemResult | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const today = settlement?.items.filter((i) => isToday(i.redeemedAt)) ?? []

  const submit = () => {
    if (code.length !== CODE_LENGTH) return
    redeem.mutate(code, {
      onSuccess: (r) => {
        setDone(r)
        setCode('')
      },
    })
  }

  if (done) {
    return (
      <OwnerScreen>
        <section className="rounded-3xl bg-white px-6 py-8 text-center">
          <img src={OWNER_ILLUST.coupon} alt="" className="mx-auto h-[130px] w-auto object-contain drop-shadow" />
          <p className="mt-3 text-sm font-bold text-q-green">사용 처리 완료</p>
          <p className="mt-1 text-xl font-bold text-q-text">{done.title}</p>
          <p className="mt-3 text-[32px] font-bold text-point-red-dark">{discountText(done)}</p>
          <p className="mt-4 rounded-xl bg-point-yellow/30 px-4 py-3 text-[13px] text-q-sub">
            {minOrderText(done.minOrderAmount)}
            <br />
            주문 금액은 계산대에서 직접 확인해 주세요
          </p>
          <p className="mt-3 text-xs text-q-muted">잇다 수수료 {done.fee.toLocaleString()}원이 정산에 기록돼요</p>
        </section>
        <PrimaryButton className="mt-4" onClick={() => setDone(null)}>
          다음 쿠폰 처리하기
        </PrimaryButton>
      </OwnerScreen>
    )
  }

  return (
    <OwnerScreen>
      <OwnerCard>
        <img src={OWNER_ILLUST.coupon} alt="" className="mx-auto mb-2 h-[92px] w-auto object-contain" />
        <p className="text-center text-[15px] font-bold text-q-text">손님 쿠폰의 사용 코드를 입력하세요</p>
        <p className="mt-1 text-center text-xs text-q-muted">손님 앱 → 내 쿠폰함 → 사용하기에 나오는 6자리</p>

        {/* 칸 6개처럼 보이지만 실제 입력은 숨긴 input 하나 */}
        <button type="button" onClick={() => inputRef.current?.focus()} className="mx-auto mt-5 flex gap-1.5" aria-label="코드 입력">
          {Array.from({ length: CODE_LENGTH }, (_, i) => (
            <span
              key={i}
              className={`flex h-14 w-11 items-center justify-center rounded-xl border-2 font-mono text-2xl font-bold text-q-text ${
                i === code.length ? 'border-q-green' : code[i] ? 'border-q-green/40 bg-q-mint' : 'border-q-line'
              }`}
            >
              {code[i] ?? ''}
            </span>
          ))}
        </button>
        <input
          ref={inputRef}
          value={code}
          autoFocus
          autoCapitalize="characters"
          autoComplete="off"
          maxLength={CODE_LENGTH}
          aria-label="쿠폰 사용 코드"
          onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, CODE_LENGTH))}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          className="sr-only"
        />

        {redeem.isError && (
          <p role="alert" className="mt-3 text-center text-[13px] font-medium text-point-red-dark">
            {errorMessage(redeem.error)}
          </p>
        )}
        <PrimaryButton className="mt-5" disabled={code.length !== CODE_LENGTH || redeem.isPending} onClick={submit}>
          {redeem.isPending ? '확인 중...' : '사용 처리하기'}
        </PrimaryButton>
        {/* 목업·로컬 개발 서버 모두 샘플 주민이 광운 카페 쿠폰 QK7M2P 를 가지고 있음 */}
        {(mockFor('coupon') || import.meta.env.DEV) && (
          <button type="button" onClick={() => setCode('QK7M2P')} className="mx-auto mt-2 block text-xs text-q-muted underline">
            테스트용 손님 코드 QK7M2P 넣기
          </button>
        )}
      </OwnerCard>

      <OwnerCard title="오늘 처리한 쿠폰" className="mt-3" aside={<span className="text-xs text-q-muted">{today.length}건</span>}>
        {today.length === 0 ? (
          <p className="py-3 text-center text-sm text-q-muted">아직 없어요</p>
        ) : (
          <ul className="flex flex-col gap-2 text-[13px]">
            {today.map((item) => (
              <li key={item.userCouponId} className="flex justify-between">
                <span className="truncate text-q-text">{item.title}</span>
                <span className="shrink-0 text-q-muted tabular-nums">{dateTimeText(item.redeemedAt).split(' ')[1]}</span>
              </li>
            ))}
          </ul>
        )}
      </OwnerCard>
    </OwnerScreen>
  )
}
