import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { untilText } from '@/features/coupon/schema'
import { useMyStoreName } from '@/features/owner/hooks'
import { OWNER_ILLUST } from '@/features/owner/illustrations'
import { CelebrationScreen, PrimaryButton } from '@/features/quest/components/QuestUi'
import { errorMessage } from '@/shared/lib/error'
import { Sheet } from '@/shared/ui/Sheet'
import { toast } from '@/stores/toastStore'
import { useCanSubscribePro, useProQuery, useSetProAutoRenew, useSubscribePro } from '../hooks'
import { PRO_BENEFITS } from '../store'

const COMPARE = [
  ['AI 홍보 영상 만들기', true, true],
  ['지도·숏폼에 영상 올리기', true, true],
  ['숏폼 피드 우선 노출', false, true],
  ['영상 재수정', false, true],
  ['원본 영상 다운로드', false, true],
] as const

/** 가입 전에 알아 둘 것 */
const TERMS = [
  ['이용 기간', '가입한 날부터 30일'],
  ['요금', '미정 · 해커톤 모의 결제'],
  ['해지하면', '남은 기간까지 이용하고 그 뒤로 결제되지 않아요'],
]

/** 잇다 PRO 구독 안내·가입·해지 (해커톤: 모의 결제) */
export function ProPlan() {
  const navigate = useNavigate()
  const { data: pro, isPending } = useProQuery()
  const canSubscribe = useCanSubscribePro()
  const subscribe = useSubscribePro()
  const setAutoRenew = useSetProAutoRenew()
  const storeName = useMyStoreName()
  const [paying, setPaying] = useState(false)
  const [welcome, setWelcome] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)

  const isPro = pro?.status === 'ACTIVE'
  const startedAt = pro?.startedAt ?? null
  const expiresAt = pro?.expiresAt ?? null
  const canceled = isPro && !pro?.autoRenew

  const changeAutoRenew = (autoRenew: boolean) =>
    setAutoRenew.mutate(autoRenew, {
      onSuccess: () => {
        setConfirmCancel(false)
        toast(autoRenew ? 'PRO를 계속 이용해요' : '해지를 예약했어요')
      },
      onError: (e) => toast(errorMessage(e)),
    })

  return (
    // 가입·해지 취소 버튼은 탭 바 바로 위에 고정, 위 내용은 스크롤 (퀘스트 가게 화면과 같은 구성)
    <div className="flex h-full flex-col bg-q-panel">
      <div className="flex-1 overflow-y-auto px-5 pt-4 pb-4">
        {/* min-h-full + 소개 박스 flex-1: 화면이 길면 소개 박스가 늘어나 빈 공간 없이 채움 */}
        <div className="flex min-h-full flex-col">
          <section className="flex min-h-[230px] flex-1 flex-col overflow-hidden rounded-3xl bg-gradient-to-br from-q-green to-q-green-dark px-6 pt-6 pb-5 text-white">
            <span className="w-fit rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-bold tracking-wider">PRO</span>
            <h2 className="mt-3 text-[26px] leading-snug font-bold">
              홍보 영상을
              <br />
              끝까지 내 마음대로
            </h2>
            <p className="mt-2 text-[13px] leading-relaxed opacity-85">
              사장님을 위한 잇다 PRO 월 구독
              <br />
              {storeName} 영상이 손님 피드 앞쪽에 떠요
            </p>
            <img src={OWNER_ILLUST.pro} alt="" className="mt-auto -mr-2 -mb-3 ml-auto h-[150px] w-auto object-contain drop-shadow-lg" />
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
              <li key={b.title} className="flex items-center gap-3.5 rounded-2xl bg-white py-3.5 pr-4 pl-3">
                <span aria-hidden className="flex size-[68px] shrink-0 items-center justify-center rounded-2xl bg-q-mint">
                  <img src={b.image} alt="" className="h-[60px] w-auto object-contain" />
                </span>
                <span>
                  <span className="block text-[16px] font-bold text-q-text">{b.title}</span>
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

          <section className="mt-3 rounded-2xl bg-white px-4 py-4">
            <p className="mb-3 text-[15px] font-bold text-q-text">이용 안내</p>
            <dl className="flex flex-col gap-2 text-[13px]">
              {TERMS.map(([label, value]) => (
                <div key={label} className="flex gap-3">
                  <dt className="w-[84px] shrink-0 text-q-muted">{label}</dt>
                  <dd className="text-q-text">{value}</dd>
                </div>
              ))}
            </dl>
          </section>

          {isPro && !canceled && (
            <button type="button" onClick={() => setConfirmCancel(true)} className="mx-auto mt-5 block text-sm text-q-muted underline">
              구독 해지
            </button>
          )}
        </div>
      </div>

      {((!isPro && !isPending) || canceled) && (
        <div className="shrink-0 border-t border-q-line bg-white px-5 pt-3 pb-3">
          {!isPro && (
            <PrimaryButton
              onClick={() => {
                if (canSubscribe) return setPaying(true)
                // 로그인 전엔 결제 화면 대신 로그인부터 (로그인 후 이 화면으로 돌아옴)
                toast('사장님 계정으로 로그인하면 PRO를 시작할 수 있어요')
                navigate('/login?next=/owner/pro')
              }}
            >
              {canSubscribe ? 'PRO 시작하기' : '로그인하고 PRO 시작하기'}
            </PrimaryButton>
          )}
          {canceled && (
            <PrimaryButton onClick={() => changeAutoRenew(true)} disabled={setAutoRenew.isPending}>
              해지 취소하고 계속 이용하기
            </PrimaryButton>
          )}
        </div>
      )}

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
            disabled={subscribe.isPending}
            onClick={() =>
              subscribe.mutate(undefined, {
                onSuccess: () => {
                  setPaying(false)
                  setWelcome(true)
                },
                onError: (e) => toast(errorMessage(e)),
              })
            }
          >
            {subscribe.isPending ? '결제 중...' : '모의 결제하고 시작'}
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
              onClick={() => changeAutoRenew(false)}
              disabled={setAutoRenew.isPending}
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
