import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { untilText } from '@/features/coupon/schema'
import { useMyStoreName } from '@/features/owner/hooks'
import { OWNER_ILLUST } from '@/features/owner/illustrations'
import { CelebrationScreen, PrimaryButton } from '@/features/quest/components/QuestUi'
import { Sheet } from '@/shared/ui/Sheet'
import { PRO_BENEFITS, useIsPro, useProStore } from '../store'

const COMPARE = [
  ['AI 홍보 영상 만들기', true, true],
  ['지도·숏폼에 영상 올리기', true, true],
  ['숏폼 피드 우선 노출', false, true],
  ['영상 재수정', false, true],
  ['원본 영상 다운로드', false, true],
] as const

/** 잇다 PRO 구독 안내·가입·해지 (모의 결제 — PRO API 미정) */
export function ProPlan() {
  const isPro = useIsPro()
  const { startedAt, expiresAt, canceled, subscribe, cancel, resume } = useProStore()
  const storeName = useMyStoreName()
  const [paying, setPaying] = useState(false)
  const [welcome, setWelcome] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const queryClient = useQueryClient()

  return (
    <div className="h-full overflow-y-auto bg-q-panel px-5 pt-4 pb-10">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-q-green to-q-green-dark px-6 py-6 text-white">
        <span className="rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-bold tracking-wider">PRO</span>
        <h2 className="mt-3 text-[24px] leading-snug font-bold">
          홍보 영상을
          <br />
          끝까지 내 마음대로
        </h2>
        <p className="mt-2 text-sm opacity-85">사장님을 위한 잇다 PRO 월 구독</p>
        <img src={OWNER_ILLUST.pro} alt="" className="absolute -right-2 -bottom-3 h-[150px] w-auto object-contain drop-shadow-lg" />
      </section>

      {isPro && expiresAt && (
        <section className="mt-3 rounded-2xl bg-white px-5 py-4">
          <div className="flex items-center justify-between">
            <p className="text-[16px] font-bold text-q-text">PRO 이용 중</p>
            <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${canceled ? 'bg-q-panel text-q-muted' : 'bg-q-mint text-q-green'}`}>
              {canceled ? '해지 예약됨' : '자동 갱신'}
            </span>
          </div>
          <p className="mt-1 text-[13px] text-q-muted">
            {startedAt && `${untilText(startedAt).replace('까지', '')} 시작 · `}
            {canceled ? `${untilText(expiresAt)} 이용 후 종료` : `다음 결제 ${untilText(expiresAt).replace('까지', '')}`}
          </p>
        </section>
      )}

      <ul className="mt-3 flex flex-col gap-2">
        {PRO_BENEFITS.map((b) => (
          <li key={b.title} className="flex items-center gap-3 rounded-2xl bg-white py-3 pr-4 pl-3">
            <span aria-hidden className="flex size-[68px] shrink-0 items-center justify-center rounded-2xl bg-q-mint">
              <img src={b.image} alt="" className="h-[60px] w-auto object-contain" />
            </span>
            <span>
              <span className="block text-[15px] font-bold text-q-text">{b.title}</span>
              <span className="text-[13px] text-q-muted">{b.description}</span>
            </span>
          </li>
        ))}
      </ul>

      <section className="mt-3 rounded-2xl bg-white px-4 py-4">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-xs text-q-muted">
              <th className="pb-2 text-left font-medium">기능</th>
              <th className="w-16 pb-2 font-medium">무료</th>
              <th className="w-16 pb-2 font-bold text-q-green">PRO</th>
            </tr>
          </thead>
          <tbody>
            {COMPARE.map(([label, free, pro]) => (
              <tr key={label} className="border-t border-q-line">
                <td className="py-2.5 text-q-text">{label}</td>
                <td className="text-center text-q-muted">{free ? '✓' : '–'}</td>
                <td className="text-center font-bold text-q-green">{pro ? '✓' : '–'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <div className="mt-5">
        {!isPro && <PrimaryButton onClick={() => setPaying(true)}>PRO 시작하기</PrimaryButton>}
        {isPro && !canceled && (
          <button type="button" onClick={() => setConfirmCancel(true)} className="mx-auto block text-sm text-q-muted underline">
            구독 해지
          </button>
        )}
        {isPro && canceled && <PrimaryButton onClick={resume}>해지 취소하고 계속 이용하기</PrimaryButton>}
      </div>

      {paying && (
        <Sheet title="잇다 PRO 구독" onClose={() => setPaying(false)}>
          <dl className="rounded-2xl bg-q-panel px-4 py-3 text-sm">
            {[
              ['가게', storeName],
              ['상품', 'PRO 월 구독 (30일, 자동 갱신)'],
              ['금액', '미정 · 해커톤 모의 결제'],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between py-1">
                <dt className="text-q-muted">{label}</dt>
                <dd className="font-bold text-q-text">{value}</dd>
              </div>
            ))}
          </dl>
          <PrimaryButton
            className="mt-5"
            onClick={() => {
              subscribe()
              // 우선 노출: 피드 순서를 바로 다시 받기
              queryClient.invalidateQueries({ queryKey: ['shortforms'] })
              setPaying(false)
              setWelcome(true)
            }}
          >
            모의 결제하고 시작
          </PrimaryButton>
        </Sheet>
      )}

      {confirmCancel && expiresAt && (
        <Sheet title="PRO 구독을 해지할까요?" onClose={() => setConfirmCancel(false)}>
          <p className="text-sm leading-relaxed text-q-sub">
            {untilText(expiresAt)}는 그대로 이용할 수 있고, 그 뒤로 자동 결제되지 않아요.
          </p>
          <div className="mt-5 grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setConfirmCancel(false)} className="h-11 rounded-full bg-q-green text-sm font-bold text-white">
              계속 이용하기
            </button>
            <button
              type="button"
              onClick={() => {
                cancel()
                setConfirmCancel(false)
              }}
              className="h-11 rounded-full border border-q-line bg-white text-sm font-bold text-q-muted"
            >
              해지하기
            </button>
          </div>
        </Sheet>
      )}

      {welcome && (
        <CelebrationScreen
          image={OWNER_ILLUST.pro}
          title="PRO 시작!"
          subtitle="이제 손님 숏폼 피드 맨 앞에 우리 가게 영상이 뜨고, 영상을 다시 고치거나 원본으로 내려받을 수 있어요"
          actions={<PrimaryButton onClick={() => setWelcome(false)}>확인</PrimaryButton>}
        />
      )}
    </div>
  )
}
