import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCreateCoupon } from '@/features/coupon/hooks'
import { discountText, RATE_MAX, RATE_MIN, validateCoupon, type CreateCouponRequest, type DiscountType } from '@/features/coupon/schema'
import { PrimaryButton } from '@/features/quest/components/QuestUi'
import { errorMessage } from '@/shared/lib/error'
import { useMyStoreId } from '../hooks'
import { OWNER_ILLUST } from '../illustrations'

/** 쿠폰 발행 (4-1) */
export function CouponCreateForm() {
  const navigate = useNavigate()
  const create = useCreateCoupon(useMyStoreId())
  const [form, setForm] = useState({
    title: '',
    discountType: 'AMOUNT' as DiscountType,
    discountValue: '1000',
    minOrderAmount: '',
    totalQuantity: '100',
    validDays: '7',
    useAsPigeonReward: true,
  })
  const [error, setError] = useState<string | null>(null)
  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((f) => ({ ...f, [key]: value }))

  const body: CreateCouponRequest = {
    title: form.title,
    discountType: form.discountType,
    discountValue: Number(form.discountValue),
    minOrderAmount: Number(form.minOrderAmount || 0),
    totalQuantity: Number(form.totalQuantity),
    validDays: Number(form.validDays),
    useAsPigeonReward: form.useAsPigeonReward,
  }

  const submit = () => {
    const invalid = validateCoupon(body)
    if (invalid) {
      setError(invalid)
      return
    }
    setError(null)
    create.mutate(body, {
      onSuccess: () => navigate('/owner/coupons', { replace: true }),
      onError: (e) => setError(errorMessage(e)),
    })
  }

  return (
    <form
      className="h-full overflow-y-auto px-5 pt-4 pb-10"
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
    >
      <div className="mb-5 flex items-center gap-3 rounded-2xl bg-q-mint py-2 pr-4 pl-2">
        <img src={OWNER_ILLUST.couponNew} alt="" className="h-[80px] w-auto object-contain" />
        <p className="text-[13px] leading-relaxed text-q-sub">
          <b className="block text-[15px] text-q-text">우리 가게 쿠폰 만들기</b>
          손님이 받아서 가게에서 바로 쓸 수 있어요
        </p>
      </div>

      <Field label="쿠폰 이름" hint={`${form.title.trim().length} / 30`}>
        <input
          value={form.title}
          maxLength={30}
          onChange={(e) => set('title', e.target.value)}
          placeholder="예) 아메리카노 1,000원 할인"
          className={inputClass}
        />
      </Field>

      <Field label="할인 방식">
        <div className="grid grid-cols-2 gap-2">
          {(['AMOUNT', 'RATE'] as const).map((type) => (
            <button
              key={type}
              type="button"
              aria-pressed={form.discountType === type}
              onClick={() => {
                set('discountType', type)
                set('discountValue', type === 'AMOUNT' ? '1000' : String(RATE_MIN))
              }}
              className="h-11 rounded-xl border border-q-line text-sm font-bold text-q-sub aria-pressed:border-q-green aria-pressed:bg-q-mint aria-pressed:text-q-green"
            >
              {type === 'AMOUNT' ? '금액 (원)' : '비율 (%)'}
            </button>
          ))}
        </div>
      </Field>

      <Field
        label={form.discountType === 'AMOUNT' ? '할인 금액' : '할인율'}
        hint={form.discountType === 'AMOUNT' ? '100원 이상' : `${RATE_MIN}~${RATE_MAX}%`}
      >
        <NumberInput value={form.discountValue} onChange={(v) => set('discountValue', v)} unit={form.discountType === 'AMOUNT' ? '원' : '%'} />
      </Field>

      <Field label="최소 주문 금액" hint="선택">
        <NumberInput value={form.minOrderAmount} onChange={(v) => set('minOrderAmount', v)} unit="원" placeholder="0" />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="발행 수량" hint="1~1,000">
          <NumberInput value={form.totalQuantity} onChange={(v) => set('totalQuantity', v)} unit="장" />
        </Field>
        <Field label="유효 기간" hint="받은 날부터 1~30일">
          <NumberInput value={form.validDays} onChange={(v) => set('validDays', v)} unit="일" />
        </Field>
      </div>

      <label className="mt-2 flex items-start gap-3 rounded-2xl bg-q-panel px-4 py-3">
        <input
          type="checkbox"
          checked={form.useAsPigeonReward}
          onChange={(e) => set('useAsPigeonReward', e.target.checked)}
          className="mt-1 size-4 accent-q-green"
        />
        <span>
          <span className="block text-sm font-bold text-q-text">비둘기 레벨업 보상에 포함</span>
          <span className="text-xs text-q-muted">손님이 비둘기를 레벨업할 때 뽑기 보상으로 우리 쿠폰이 나갈 수 있어요</span>
        </span>
      </label>

      <div className="mt-5 rounded-2xl border border-dashed border-q-line px-4 py-3 text-center">
        <p className="text-xs text-q-muted">미리보기</p>
        <p className="mt-0.5 text-[15px] font-bold text-q-text">{form.title.trim() || '쿠폰 이름'}</p>
        <p className="text-sm font-bold text-point-red-dark">{body.discountValue > 0 ? discountText(body) : '-'}</p>
      </div>

      <p className="mt-3 text-center text-xs text-q-muted">할인 금액은 사장님 부담, 손님이 사용한 쿠폰 1건당 소액 수수료가 붙어요</p>
      {error && (
        <p role="alert" className="mt-3 text-center text-[13px] font-medium text-point-red-dark">
          {error}
        </p>
      )}
      <PrimaryButton type="submit" className="mt-4" disabled={create.isPending}>
        {create.isPending ? '발행 중...' : '쿠폰 발행하기'}
      </PrimaryButton>
    </form>
  )
}

const inputClass =
  'h-12 w-full rounded-xl border border-q-line px-4 text-base text-q-text outline-none focus:border-q-green'

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="mb-4 block">
      <div className="mb-1.5 flex items-end justify-between">
        <span className="text-[13px] font-bold text-q-text">{label}</span>
        {hint && <span className="text-[11px] text-q-muted">{hint}</span>}
      </div>
      {children}
    </div>
  )
}

function NumberInput({
  value,
  onChange,
  unit,
  placeholder,
}: {
  value: string
  onChange: (value: string) => void
  unit: string
  placeholder?: string
}) {
  return (
    <div className="relative">
      <input
        inputMode="numeric"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, ''))}
        className={`${inputClass} pr-10 text-right tabular-nums`}
      />
      <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-sm text-q-muted">{unit}</span>
    </div>
  )
}
