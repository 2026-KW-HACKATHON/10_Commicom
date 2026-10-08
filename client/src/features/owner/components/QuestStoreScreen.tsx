import { QRCodeSVG } from 'qrcode.react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { untilText } from '@/features/coupon/schema'
import { CelebrationScreen, OutlineButton, PrimaryButton } from '@/features/quest/components/QuestUi'
import { useQuestQr, useQuestSubscription, useSubscribeQuestStore } from '@/features/quest/hooks'
import { visitQrUrl } from '@/features/quest/schema'
import { errorMessage } from '@/shared/lib/error'
import { Sheet } from '@/shared/ui/Sheet'
import { useMyStoreId, useMyStoreName } from '../hooks'
import { OWNER_ILLUST } from '../illustrations'
import { OwnerCard, OwnerScreen } from './OwnerUi'

const BENEFITS = [
  { icon: '📍', title: '손님이 직접 찾아와요', text: '동네 퀘스트 "가게 방문하기"의 대상 가게가 돼요' },
  { icon: '🚩', title: '지도에서 눈에 띄어요', text: '잇다 맵에 퀘스트 가게로 표시되고 필터로도 찾을 수 있어요' },
  { icon: '🕊', title: '단골이 생겨요', text: '방문할 때마다 손님 비둘기가 자라서 다시 올 이유가 생겨요' },
]

const STEPS = ['계산대에 방문 인증 QR을 띄우거나 붙여 두세요', '손님이 가게 안에서 QR을 찍어요 (반경 100m 확인)', '손님은 먹이를 받고, 가게는 방문이 늘어요']

/** 퀘스트 가게 등록(유료) + 방문 인증 QR (2-3 ~ 2-5) */
export function QuestStoreScreen() {
  const storeId = useMyStoreId()
  const storeName = useMyStoreName()
  const { data: sub, isLoading } = useQuestSubscription(storeId)
  const subscribe = useSubscribeQuestStore(storeId)
  const active = sub?.status === 'ACTIVE'
  const qr = useQuestQr(storeId, active)
  const [paying, setPaying] = useState(false)
  const [welcome, setWelcome] = useState(false)
  const [bigQr, setBigQr] = useState(false)
  const navigate = useNavigate()

  if (isLoading || !sub) {
    return (
      <OwnerScreen>
        <div className="h-60 animate-pulse rounded-2xl bg-white" />
      </OwnerScreen>
    )
  }

  return (
    <OwnerScreen>
      {active ? (
        <>
          <OwnerCard>
            <div className="flex items-center gap-3">
              <img src={OWNER_ILLUST.qr} alt="" className="h-16 w-auto object-contain" />
              <div className="min-w-0 flex-1">
                <p className="text-[17px] font-bold text-q-text">퀘스트 가게 운영 중</p>
                <p className="text-[13px] text-q-muted">
                  {sub.expiresAt && untilText(sub.expiresAt)} · 월 구독
                </p>
              </div>
              <span className="rounded-full bg-q-mint px-2.5 py-1 text-xs font-bold text-q-green">등록됨</span>
            </div>
          </OwnerCard>

          <Link to="/owner/quests" className="mt-3 flex items-center justify-between rounded-2xl bg-q-green px-5 py-4 text-white">
            <span>
              <span className="block text-[15px] font-bold">참여할 퀘스트 고르기</span>
              <span className="text-xs opacity-85">한식·카페 등 퀘스트에 참여해야 손님에게 보여요</span>
            </span>
            <span className="text-xl">›</span>
          </Link>

          <OwnerCard title="오늘의 방문 인증 QR" className="mt-3" aside={<span className="text-xs text-q-muted">매일 자정 바뀜</span>}>
            {qr.isLoading && <div className="mx-auto size-[220px] animate-pulse rounded-2xl bg-q-panel" />}
            {qr.isError && <p className="text-center text-sm text-point-red-dark">{errorMessage(qr.error)}</p>}
            {qr.data && (
              <>
                <QrBox url={visitQrUrl(storeId, qr.data.qrToken)} code={qr.data.qrToken} storeName={storeName} size={200} />
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setBigQr(true)}
                    className="h-11 rounded-full bg-q-green text-sm font-bold text-white"
                  >
                    계산대에 크게 띄우기
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="h-11 rounded-full border border-q-green bg-white text-sm font-bold text-q-green"
                  >
                    인쇄하기
                  </button>
                </div>
                <p className="mt-3 text-center text-xs leading-relaxed text-q-muted">
                  캡처한 QR을 다시 쓰지 못하게 매일 자정에 바뀌어요.
                  <br />
                  출력해 두었다면 매일 새로 붙이거나 화면으로 띄워 주세요.
                </p>
              </>
            )}
          </OwnerCard>

          <HowItWorks />
        </>
      ) : (
        <>
          <section className="rounded-3xl bg-gradient-to-br from-q-green to-q-green-dark px-6 pt-6 pb-5 text-white">
            <p className="text-xs font-bold opacity-80">{sub.status === 'EXPIRED' ? '이용 기간이 끝났어요' : '우리 가게를'}</p>
            <h2 className="mt-1 text-[24px] leading-snug font-bold">
              손님이 찾아오는
              <br />
              퀘스트 가게로
            </h2>
            <img src={OWNER_ILLUST.qr} alt="" className="-mt-6 -mb-3 ml-auto h-[130px] w-auto object-contain drop-shadow-lg" />
          </section>

          <ul className="mt-3 flex flex-col gap-2">
            {BENEFITS.map((b) => (
              <li key={b.title} className="flex gap-3 rounded-2xl bg-white px-4 py-3.5">
                <span aria-hidden className="flex size-10 shrink-0 items-center justify-center rounded-full bg-q-mint text-lg">
                  {b.icon}
                </span>
                <span>
                  <span className="block text-[15px] font-bold text-q-text">{b.title}</span>
                  <span className="text-[13px] text-q-muted">{b.text}</span>
                </span>
              </li>
            ))}
          </ul>

          <HowItWorks />

          <div className="sticky bottom-0 -mx-5 mt-4 bg-gradient-to-t from-q-panel via-q-panel to-transparent px-5 pt-4 pb-2">
            <PrimaryButton onClick={() => setPaying(true)}>
              {sub.status === 'EXPIRED' ? '다시 등록하기 (월 구독)' : '퀘스트 가게 등록하기 (월 구독)'}
            </PrimaryButton>
          </div>
        </>
      )}

      {paying && (
        <Sheet title="퀘스트 가게 등록" onClose={() => setPaying(false)}>
          <dl className="rounded-2xl bg-q-panel px-4 py-3 text-sm">
            <Row label="가게" value={storeName} />
            <Row label="상품" value="퀘스트 가게 월 구독 (30일)" />
            <Row label="금액" value="미정 · 해커톤 모의 결제" />
          </dl>
          {subscribe.isError && <p className="mt-2 text-center text-[13px] text-point-red-dark">{errorMessage(subscribe.error)}</p>}
          <PrimaryButton
            className="mt-5"
            disabled={subscribe.isPending}
            onClick={() =>
              subscribe.mutate(undefined, {
                onSuccess: () => {
                  setPaying(false)
                  setWelcome(true)
                },
              })
            }
          >
            {subscribe.isPending ? '결제 중...' : '모의 결제하고 등록'}
          </PrimaryButton>
        </Sheet>
      )}

      {welcome && (
        <CelebrationScreen
          image={OWNER_ILLUST.qr}
          title="퀘스트 가게 등록 완료!"
          subtitle={`이제 ${storeName}에서 손님이 방문 인증을 할 수 있어요`}
          actions={
            <>
              <PrimaryButton onClick={() => navigate('/owner/quests')}>참여할 퀘스트 고르기</PrimaryButton>
              <OutlineButton onClick={() => setWelcome(false)}>방문 인증 QR 받기</OutlineButton>
            </>
          }
        />
      )}

      {bigQr && qr.data && (
        <div role="dialog" aria-modal aria-label="방문 인증 QR" className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white px-8">
          <p className="text-sm font-bold text-q-green">잇다 퀘스트 방문 인증</p>
          <p className="mt-1 text-[26px] font-bold text-q-text">{storeName}</p>
          <div className="mt-6 rounded-3xl border-4 border-q-green p-5">
            <QRCodeSVG value={visitQrUrl(storeId, qr.data.qrToken)} size={260} fgColor="#1e6b45" level="M" />
          </div>
          <p className="mt-5 font-mono text-2xl font-bold tracking-[0.2em] text-q-text">{qr.data.qrToken}</p>
          <p className="mt-2 text-center text-sm text-q-muted">카메라로 찍으면 방문 인증 화면이 열려요</p>
          <button type="button" onClick={() => setBigQr(false)} className="mt-10 text-sm text-q-muted underline">
            닫기
          </button>
        </div>
      )}
    </OwnerScreen>
  )
}

function QrBox({ url, code, storeName, size }: { url: string; code: string; storeName: string; size: number }) {
  return (
    // print:* — 인쇄할 때는 이 카드만 크게
    <div className="qr-print mx-auto w-fit rounded-2xl border-2 border-dashed border-q-green px-5 pt-4 pb-3 text-center">
      <p className="hidden text-lg font-bold print:block">{storeName} · 잇다 퀘스트 방문 인증</p>
      <QRCodeSVG value={url} size={size} fgColor="#1e6b45" level="M" className="mx-auto" />
      <p className="mt-2 text-[11px] text-q-muted">QR이 안 찍히면 아래 코드를 입력</p>
      <p className="font-mono text-xl font-bold tracking-[0.2em] text-q-text">{code}</p>
    </div>
  )
}

function HowItWorks() {
  return (
    <OwnerCard title="이렇게 진행돼요" className="mt-3">
      <ol className="flex flex-col gap-2.5">
        {STEPS.map((step, i) => (
          <li key={step} className="flex items-center gap-3 text-[13px] text-q-sub">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-q-green text-xs font-bold text-white">
              {i + 1}
            </span>
            {step}
          </li>
        ))}
      </ol>
    </OwnerCard>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1">
      <dt className="text-q-muted">{label}</dt>
      <dd className="font-bold text-q-text">{value}</dd>
    </div>
  )
}
