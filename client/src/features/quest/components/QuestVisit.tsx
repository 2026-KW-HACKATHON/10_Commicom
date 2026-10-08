import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import pigeonGps from '@/assets/quest/pigeon-gps.png'
import pigeonTrophy from '@/assets/quest/pigeon-trophy.png'
import pigeonVerified from '@/assets/quest/pigeon-verified.png'
import { useMyLocation, useStores } from '@/features/map/hooks'
import type { StoreSummary } from '@/features/map/schema'
import { mockQrHint, USE_MOCK } from '@/mocks/db'
import { ApiError } from '@/shared/api/client'
import { errorMessage } from '@/shared/lib/error'
import { distanceMeters, getCurrentPosition, GPS_BYPASS } from '../geo'
import { useVisit } from '../hooks'
import { VISIT_RADIUS_M, withObjectParticle, type Quest, type VisitResult } from '../schema'
import { CelebrationScreen, FeedIcon, OutlineButton, PrimaryButton } from './QuestUi'

type Step = 'verify' | 'visited' | 'quest-done'

/** Figma 2. GPS 방문 인증 → 3. 방문 인증 완료 → 4. 퀘스트 완료 → 레벨업 뽑기 (2-2) */
export function QuestVisit({ quest }: { quest: Quest }) {
  const navigate = useNavigate()
  const { data: questStores, isLoading } = useStores(true)
  // 템플릿 퀘스트는 참여 가게에서만 인증 가능
  const stores = quest.storeIds ? questStores?.filter((s) => quest.storeIds!.includes(s.storeId)) : questStores
  const location = useMyLocation()
  const visit = useVisit(quest.questId)

  // 가게 QR을 찍고 들어오면 (/quest/scan) 가게와 QR 값이 채워져 있음
  const [params] = useSearchParams()
  const [storeId, setStoreId] = useState<number | null>(() => Number(params.get('storeId')) || null)
  const [qrToken, setQrToken] = useState(() => params.get('qrToken') ?? '')
  const [locating, setLocating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<Step>('verify')
  const [result, setResult] = useState<VisitResult | null>(null)

  const me = location.status === 'ok' ? location.position : null
  const sorted = [...(stores ?? [])].sort((a, b) => distanceTo(me, a) - distanceTo(me, b))
  const store = sorted.find((s) => s.storeId === storeId) ?? sorted[0]
  const hint = USE_MOCK && store ? mockQrHint(store.storeId) : null

  const finish = () => navigate('/quest', { replace: true })
  const afterVisited = () => (result?.quest.completed ? setStep('quest-done') : finish())

  const handleVerify = async () => {
    if (!store) return
    setError(null)
    if (!qrToken.trim()) {
      setError('가게에 있는 QR 코드 값을 입력해 주세요')
      return
    }
    setLocating(true)
    try {
      const position = GPS_BYPASS ? { lat: store.latitude, lng: store.longitude } : await getCurrentPosition()
      const res = await visit.mutateAsync({
        storeId: store.storeId,
        latitude: position.lat,
        longitude: position.lng,
        qrToken: qrToken.trim(),
      })
      setResult(res)
      setStep('visited')
    } catch (e) {
      setError(visitErrorMessage(e))
    } finally {
      setLocating(false)
    }
  }

  return (
    <div className="h-full overflow-y-auto px-5 pt-4 pb-8">
      <p className="mb-3 text-center text-[13px] text-q-muted">
        {quest.title} · {quest.currentCount} / {quest.targetCount}
      </p>

      {isLoading && <div className="h-24 animate-pulse rounded-2xl bg-q-mint" />}
      {stores && stores.length === 0 && (
        <p className="rounded-2xl bg-q-panel py-8 text-center text-sm text-q-muted">이 퀘스트에 참여한 가게가 없어요</p>
      )}

      {store && (
        <>
          <section className="rounded-2xl bg-q-mint px-4 py-5 text-center">
            <h2 className="text-[21px] font-bold text-q-text">{store.name}</h2>
            <p className="mt-1 text-[13px] text-q-muted">{store.address}</p>
            {me && <p className="mt-1 text-xs font-medium text-q-green">여기서 약 {formatDistance(distanceTo(me, store))}</p>}
          </section>

          {sorted.length > 1 && (
            <ul className="mt-3 flex gap-2 overflow-x-auto pb-1" aria-label="퀘스트 가게 선택">
              {sorted.map((s) => {
                const selected = s.storeId === store.storeId
                return (
                  <li key={s.storeId} className="shrink-0">
                    <button
                      type="button"
                      aria-pressed={selected}
                      onClick={() => {
                        setStoreId(s.storeId)
                        setQrToken('')
                        setError(null)
                      }}
                      className={`rounded-full border px-3 py-1.5 text-[13px] font-medium ${
                        selected ? 'border-q-green bg-q-green text-white' : 'border-q-line bg-white text-q-sub'
                      }`}
                    >
                      {s.name}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}

          <p className="mt-5 text-center text-[13px] leading-relaxed text-q-muted">
            매장에 도착한 후 가게의 QR 코드 값을 입력하고
            <br />
            아래 버튼을 눌러 방문 인증을 완료해주세요.
          </p>

          <div className="mx-auto mt-3 flex size-[170px] items-center justify-center rounded-full bg-q-mint">
            <img src={pigeonGps} alt="" className="size-[180px] object-contain" />
          </div>

          <label className="mt-5 block">
            <span className="text-[13px] font-bold text-q-text">QR 코드 값</span>
            <input
              value={qrToken}
              onChange={(e) => setQrToken(e.target.value)}
              placeholder="가게에 비치된 QR 아래 코드"
              autoCapitalize="none"
              autoComplete="off"
              className="mt-1.5 h-12 w-full rounded-xl border border-q-line px-4 text-base tracking-wider text-q-text outline-none focus:border-q-green"
            />
          </label>
          {hint && (
            <button type="button" onClick={() => setQrToken(hint)} className="mt-1.5 text-xs text-q-muted underline">
              테스트용 QR 값: {hint} (눌러서 입력)
            </button>
          )}

          <PrimaryButton className="mt-5" disabled={locating} onClick={handleVerify}>
            {locating ? '위치 확인 중...' : '방문 인증하기'}
          </PrimaryButton>
          {error && (
            <p role="alert" className="mt-2.5 text-center text-[13px] font-medium text-point-red-dark">
              {error}
            </p>
          )}

          <section className="mt-6 rounded-2xl bg-q-panel px-4 py-4">
            <h3 className="mb-2 text-sm font-bold text-q-text">인증 조건</h3>
            <ul className="flex flex-col gap-1.5 text-[13px] text-q-sub">
              {[
                `매장 반경 ${VISIT_RADIUS_M}m 이내 + 가게 QR 코드`,
                '같은 가게는 하루 1회만 인증 가능',
                '한 퀘스트에서는 서로 다른 가게만 인정',
              ].map((text) => (
                <li key={text} className="flex gap-2">
                  <span aria-hidden className="font-bold text-q-green">✓</span>
                  {text}
                </li>
              ))}
            </ul>
          </section>
        </>
      )}

      {step === 'visited' && result && store && (
        <CelebrationScreen
          image={pigeonVerified}
          title="방문 인증 완료!"
          subtitle={`${store.name} 방문이 확인되었습니다.`}
          actions={<PrimaryButton onClick={afterVisited}>확인</PrimaryButton>}
        >
          <RewardBox title={`먹이 ${result.feedGained}개를 획득했습니다`} caption="보유 먹이에 담았어요. 퀘스트 탭에서 비둘기에게 주세요!" />
        </CelebrationScreen>
      )}

      {step === 'quest-done' && result && (
        <CelebrationScreen
          image={pigeonTrophy}
          title="퀘스트 완료!"
          subtitle={`${withObjectParticle(quest.title)} 완료했어요!`}
          actions={
            <>
              <PrimaryButton onClick={finish}>비둘기에게 먹이 주러 가기</PrimaryButton>
              <OutlineButton onClick={finish}>확인</OutlineButton>
            </>
          }
        >
          <RewardBox title={`보너스 먹이 ${result.quest.bonusFeed}개를 획득했습니다`} caption="보유 먹이에 담았어요" />
        </CelebrationScreen>
      )}

    </div>
  )
}

function RewardBox({ title, caption }: { title: string; caption: string }) {
  return (
    <div className="rounded-2xl bg-q-panel px-4 py-5 text-center">
      <p className="flex items-center justify-center gap-2.5 text-[18px] font-bold text-q-text">
        <FeedIcon className="size-8" />
        {title}
      </p>
      <p className="mt-2 text-[13px] text-q-green">{caption}</p>
    </div>
  )
}

function visitErrorMessage(e: unknown) {
  if (e instanceof ApiError && e.code === 'QUEST4001') {
    const distanceM = (e.result as { distanceM?: number } | undefined)?.distanceM
    if (distanceM) return `매장에서 약 ${formatDistance(distanceM)} 떨어져 있어요. ${VISIT_RADIUS_M}m 안에서 인증해 주세요.`
  }
  return errorMessage(e)
}

function distanceTo(me: { lat: number; lng: number } | null, s: StoreSummary) {
  return me ? distanceMeters(me, { lat: s.latitude, lng: s.longitude }) : 0
}

function formatDistance(m: number) {
  return m >= 1000 ? `${(m / 1000).toFixed(1)}km` : `${Math.round(m)}m`
}
