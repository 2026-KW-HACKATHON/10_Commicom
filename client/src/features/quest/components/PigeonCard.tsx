import { useState } from 'react'
import { Link } from 'react-router-dom'
import { errorMessage } from '@/shared/lib/error'
import { useAdFeed, useDailyFeed, useFeedPigeon, usePigeon } from '../hooks'
import { levelLabel, MAX_LEVEL, pigeonImage, type LevelUp } from '../schema'
import { AdRewardModal } from './AdRewardModal'
import { LevelUpSequence } from './LevelUpSequence'
import { FeedIcon, ProgressBar } from './QuestUi'

/**
 * 내 비둘기 — 3-1 ~ 3-3.
 * 먹이는 받으면 보유 먹이에 쌓이고, [먹이 주기]로 직접 먹일 때 레벨업·보상 뽑기가 일어남.
 */
export function PigeonCard() {
  const { data: pigeon, isLoading, isError } = usePigeon()
  const daily = useDailyFeed()
  const ad = useAdFeed()
  const feed = useFeedPigeon()
  const [watchingAd, setWatchingAd] = useState(false)
  const [levelUps, setLevelUps] = useState<LevelUp[]>([])
  const [toast, setToast] = useState<string | null>(null)

  if (isLoading) return <div className="h-[340px] animate-pulse rounded-3xl bg-q-mint" />
  if (isError || !pigeon) {
    return <p className="rounded-3xl bg-q-panel py-10 text-center text-sm text-q-muted">비둘기 정보를 불러오지 못했어요</p>
  }

  const { today, feedBalance } = pigeon
  const adLeft = today.adFeedLimit - today.adFeedCount
  const busy = daily.isPending || ad.isPending || feed.isPending
  const remaining = (pigeon.requiredFeed ?? 0) - pigeon.currentFeed
  const fail = (e: unknown) => setToast(errorMessage(e))
  const gained = (r: { feedGained: number }) => setToast(`먹이 ${r.feedGained}개를 획득했습니다`)
  const giveFeed = (amount: number) =>
    feed.mutate(amount, {
      onSuccess: (r) => {
        if (r.levelUps.length > 0) setLevelUps(r.levelUps)
        else setToast(`냠냠! 먹이 ${r.fed}개를 먹었어요`)
      },
      onError: fail,
    })
  // 레벨이 오를수록 비둘기가 커 보이게
  const scale = 0.72 + (pigeon.level / MAX_LEVEL) * 0.28

  return (
    <section className="rounded-3xl bg-q-mint px-5 pt-4 pb-5">
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-white px-3 py-1 text-[13px] font-bold text-q-green-dark">
          {levelLabel(pigeon.level, pigeon.levelName)}
        </span>
        <Link to="/quest/history" className="text-[13px] font-medium text-q-green">
          성장 기록 ›
        </Link>
      </div>

      <div className="relative mx-auto flex h-[150px] w-[220px] items-end justify-center">
        <span className="absolute bottom-0 h-[26px] w-[180px] rounded-[50%] bg-q-ground" />
        <img
          src={pigeonImage(pigeon.level)}
          alt={`Lv. ${pigeon.level} 비둘기`}
          style={{ height: `${145 * scale}px` }}
          className={`relative mb-2 object-contain transition-[height] duration-500 ${feed.isPending ? 'animate-bounce' : ''}`}
        />
      </div>

      {pigeon.isMaxLevel ? (
        <p className="mt-3 text-center text-[15px] font-bold text-q-green">최고 레벨까지 키웠어요!</p>
      ) : (
        <div className="mt-3">
          <div className="flex justify-between text-[13px]">
            <span className="font-bold text-q-text">다음 레벨까지</span>
            <span className="font-bold text-q-green">
              {pigeon.currentFeed} / {pigeon.requiredFeed}
            </span>
          </div>
          <ProgressBar value={pigeon.currentFeed} max={pigeon.requiredFeed ?? 1} className="mt-1.5 h-2" />
          <p className="mt-1.5 text-xs text-q-muted">
            먹이 {remaining}개 더 주면 Lv. {pigeon.level + 1} · 레벨업마다 보상 뽑기!
          </p>
        </div>
      )}

      {/* 보유 먹이 + 먹이 주기 (Figma 5. 리워드 탭의 "보유 먹이 + 먹이 주기") */}
      {!pigeon.isMaxLevel && (
        <div className="mt-4 flex items-center gap-3 rounded-2xl bg-white px-4 py-3">
          <FeedIcon className="size-9" />
          <div className="flex-1">
            <p className="text-[11px] text-q-muted">보유 먹이</p>
            <p className="text-xl leading-tight font-bold text-q-text tabular-nums">{feedBalance}개</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <button
              type="button"
              disabled={feedBalance < 1 || busy}
              onClick={() => giveFeed(1)}
              className="h-10 rounded-full bg-q-green px-5 text-sm font-bold text-white transition-transform active:scale-95 disabled:opacity-35"
            >
              먹이 주기
            </button>
            {feedBalance > 1 && (
              <button
                type="button"
                disabled={busy}
                onClick={() => giveFeed(Math.min(feedBalance, remaining))}
                className="text-[11px] font-medium text-q-green underline"
              >
                {feedBalance >= remaining ? `레벨업까지 ${remaining}개 주기` : `${feedBalance}개 모두 주기`}
              </button>
            )}
          </div>
        </div>
      )}

      {!pigeon.isMaxLevel && (
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={today.dailyFeedClaimed || busy}
            onClick={() => daily.mutate(undefined, { onSuccess: gained, onError: fail })}
            className="flex h-[52px] flex-col items-center justify-center rounded-2xl border border-q-green bg-white text-q-green disabled:border-transparent disabled:text-q-muted"
          >
            <span className="flex items-center gap-1 text-[14px] font-bold">
              <FeedIcon className="size-5" />
              {today.dailyFeedClaimed ? '오늘 받았어요' : '무료 먹이 받기'}
            </span>
            <span className="text-[11px] opacity-80">{today.dailyFeedClaimed ? '내일 또 받을 수 있어요' : '하루 1번'}</span>
          </button>
          <button
            type="button"
            disabled={adLeft <= 0 || busy}
            onClick={() => setWatchingAd(true)}
            className="flex h-[52px] flex-col items-center justify-center rounded-2xl border border-q-green bg-white text-q-green disabled:border-transparent disabled:text-q-muted"
          >
            <span className="text-[14px] font-bold">▶ 광고 보고 먹이</span>
            <span className="text-[11px]">
              오늘 {today.adFeedCount} / {today.adFeedLimit}
            </span>
          </button>
        </div>
      )}

      {toast && (
        <p key={toast} role="status" className="mt-3 animate-[rise-center_.3s_ease-out] text-center text-[13px] font-bold text-q-green-dark">
          {toast}
        </p>
      )}

      {watchingAd && (
        <AdRewardModal
          onCancel={() => {
            setWatchingAd(false)
            setToast('광고를 끝까지 봐야 먹이를 받을 수 있어요')
          }}
          onComplete={(id) => {
            setWatchingAd(false)
            ad.mutate(id, { onSuccess: gained, onError: fail })
          }}
        />
      )}
      {levelUps.length > 0 && <LevelUpSequence levelUps={levelUps} onDone={() => setLevelUps([])} />}
    </section>
  )
}
