import { useState } from 'react'
import { Link } from 'react-router-dom'
import { errorMessage } from '@/shared/lib/error'
import { useAdFeed, useDailyFeed, useFeedPigeon, useGraduate, usePigeon, usePigeonAccess } from '../hooks'
import { breedLabel, levelLabel, MAX_LEVEL, pigeonImage, type AlbumItem, type FeedPigeonResult, type LevelUp } from '../schema'
import { AdRewardModal } from './AdRewardModal'
import { LevelUpSequence } from './LevelUpSequence'
import { GraduationScreen, HatchScreen } from './PigeonMoments'
import { FeedBowlIcon, FeedIcon, ProgressBar } from './QuestUi'

/**
 * 내 비둘기 — 3-1 ~ 3-3.
 * 먹이는 받으면 보유 먹이에 쌓이고, [먹이 주기]로 직접 먹일 때 레벨업·보상 뽑기가 일어남.
 * 알(Lv.0) → 먹이 1개로 부화(종류 랜덤) → Lv.10 → 졸업(앨범) → 새 알
 */
export function PigeonCard() {
  const { needsLogin } = usePigeonAccess()
  const { data: pigeon, isLoading, isError } = usePigeon()
  const daily = useDailyFeed()
  const ad = useAdFeed()
  const feed = useFeedPigeon()
  const graduate = useGraduate()
  const [watchingAd, setWatchingAd] = useState(false)
  const [levelUps, setLevelUps] = useState<LevelUp[]>([])
  // 부화 축하 → (같이 레벨업했으면) 레벨업 연출 순서로
  const [hatched, setHatched] = useState<{ result: FeedPigeonResult; next: LevelUp[] } | null>(null)
  const [graduated, setGraduated] = useState<AlbumItem | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  // 먹이를 먹을 때마다 1씩 → 이 값이 바뀌면 "냠" 동작을 한 번 재생
  const [eatTick, setEatTick] = useState(0)

  if (needsLogin) return <PigeonLoginPrompt />
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
        setEatTick((t) => t + 1)
        if (r.hatched) setHatched({ result: r, next: r.levelUps })
        else if (r.levelUps.length > 0) setLevelUps(r.levelUps)
        else setToast(`냠냠! 먹이 ${r.fed}개를 먹었어요`)
      },
      onError: fail,
    })
  const doGraduate = () =>
    graduate.mutate(undefined, {
      onSuccess: (r) => {
        setGraduated(r.graduated)
        setEatTick(0) // 새 알은 다시 흔들흔들
      },
      onError: fail,
    })
  // 레벨이 오를수록 비둘기가 커 보이게 (알은 작게)
  const scale = pigeon.isEgg ? 0.62 : 0.72 + (pigeon.level / MAX_LEVEL) * 0.28
  const breed = breedLabel(pigeon.breed)

  return (
    <section className="rounded-3xl bg-q-mint px-5 pt-4 pb-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="shrink-0 rounded-full bg-white px-3 py-1 text-[13px] font-bold text-q-green-dark">
            {levelLabel(pigeon.level, pigeon.levelName)}
          </span>
          {breed && (
            <span className="truncate rounded-full bg-white/70 px-2.5 py-1 text-[12px] font-bold text-q-green">{breed}</span>
          )}
        </div>
        <div className="flex shrink-0 gap-2.5 text-[13px] font-medium text-q-green">
          <Link to="/quest/album">앨범 ›</Link>
          <Link to="/quest/history">성장 기록 ›</Link>
        </div>
      </div>

      <div className="relative mx-auto flex h-[150px] w-[220px] items-end justify-center">
        <span className="absolute bottom-0 h-[26px] w-[180px] rounded-[50%] bg-q-ground" />
        {/* 먹이를 먹으면 발은 땅에 붙인 채 살짝 움츠렸다 펴짐 (key 가 바뀌면 다시 재생) */}
        <img
          key={eatTick}
          src={pigeonImage(pigeon.level, pigeon.breed)}
          alt={pigeon.isEgg ? '비둘기 알' : `Lv. ${pigeon.level} ${breed ?? '비둘기'}`}
          style={{ height: `${145 * scale}px` }}
          className={`relative mb-2 origin-bottom object-contain transition-[height] duration-500 ${
            eatTick > 0
              ? 'animate-[pigeon-eat_.5s_ease-out]'
              : pigeon.isEgg
                ? 'animate-[egg-wobble_2.4s_ease-in-out_infinite]'
                : ''
          }`}
        />
      </div>

      {pigeon.isMaxLevel ? (
        <div className="mt-3 text-center">
          <p className="text-[15px] font-bold text-q-green">최고 레벨까지 키웠어요!</p>
          <button
            type="button"
            disabled={graduate.isPending}
            onClick={doGraduate}
            className="mt-3 h-12 w-full rounded-2xl bg-q-green text-[15px] font-bold text-white shadow-[0_6px_16px_rgba(30,142,90,0.3)] active:scale-[0.98] disabled:opacity-50"
          >
            {graduate.isPending ? '졸업 준비 중...' : '🎓 졸업시키고 새 알 받기'}
          </button>
          <p className="mt-1.5 text-xs text-q-muted">졸업한 비둘기는 앨범에 남고, 모은 먹이는 새 비둘기에게 이어져요</p>
        </div>
      ) : pigeon.isEgg ? (
        <div className="mt-3 text-center">
          <p className="text-[15px] font-bold text-q-text">알을 품고 있어요</p>
          <p className="mt-1 text-xs text-q-muted">먹이 1개를 주면 깨어나요 · 어떤 비둘기가 나올까요?</p>
        </div>
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
          <FeedBowlIcon className="h-11 w-12" />
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
              {pigeon.isEgg ? '알 깨우기' : '먹이 주기'}
            </button>
            {feedBalance > 1 && !pigeon.isEgg && (
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

      {/* 최고 레벨이어도 먹이는 모아 둘 수 있음 (새 비둘기에게 이어짐) */}
      {pigeon.isMaxLevel && (
        <p className="mt-4 text-center text-[13px] text-q-sub">
          보유 먹이 <b className="text-q-text">{feedBalance}개</b>
        </p>
      )}
      <div className="mt-2 grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={today.dailyFeedClaimed || busy}
          onClick={() => daily.mutate(undefined, { onSuccess: gained, onError: fail })}
          // 씨앗은 왼쪽 고정 자리, 글자는 씨앗 오른쪽 남은 공간의 가운데 (문구 길이가 바뀌어도 겹치지 않음)
          className="relative flex h-[52px] items-center rounded-2xl border border-q-green bg-white pr-2 pl-10 text-q-green disabled:border-transparent disabled:text-q-muted"
        >
          <FeedIcon
            className={`absolute top-1/2 left-3 size-6 -translate-y-1/2 ${today.dailyFeedClaimed ? 'opacity-40' : ''}`}
          />
          <span className="flex flex-1 flex-col items-center whitespace-nowrap">
            <span className="text-[14px] font-bold">{today.dailyFeedClaimed ? '오늘 받았어요' : '무료 먹이 받기'}</span>
            <span className="text-[11px] opacity-80">{today.dailyFeedClaimed ? '내일 또 받을 수 있어요' : '하루 1번'}</span>
          </span>
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
      {hatched?.result.hatched && (
        <HatchScreen
          breed={hatched.result.hatched.breed}
          onDone={() => {
            setLevelUps(hatched.next)
            setHatched(null)
          }}
        />
      )}
      {levelUps.length > 0 && <LevelUpSequence levelUps={levelUps} breed={pigeon.breed} onDone={() => setLevelUps([])} />}
      {graduated && <GraduationScreen graduated={graduated} onDone={() => setGraduated(null)} />}
    </section>
  )
}

/** 로그인 전: 비둘기는 계정마다 따로 키움 → 로그인 안내 */
function PigeonLoginPrompt() {
  return (
    <div className="flex flex-col items-center rounded-3xl bg-q-mint px-6 py-8 text-center">
      <img src={pigeonImage(0)} alt="" className="h-[110px] w-auto origin-bottom animate-[egg-wobble_2.4s_ease-in-out_infinite] object-contain" />
      <p className="mt-4 text-[17px] font-bold text-q-text">로그인하고 알을 받아 보세요</p>
      <p className="mt-1.5 text-[13px] leading-relaxed text-q-sub">
        한식·일식·중식·양식·마트·카페 중 어떤 비둘기가 나올까요?
        <br />
        레벨업하면 동네 가게 쿠폰도 받을 수 있어요
      </p>
      <Link to="/login?next=/quest" className="mt-5 flex h-11 items-center rounded-xl bg-q-green px-6 text-[15px] font-bold text-white">
        로그인하기
      </Link>
    </div>
  )
}
