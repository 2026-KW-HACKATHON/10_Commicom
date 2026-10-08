import { Link } from 'react-router-dom'
import { useMyCoupons } from '@/features/coupon/hooks'
import { useQuests } from '../hooks'
import type { Quest } from '../schema'
import { PigeonCard } from './PigeonCard'
import { FeedIcon, ProgressBar, SectionTitle } from './QuestUi'

/** 퀘스트 탭 — 동네 퀘스트 (Figma 114:8 1번 화면을 비둘기 1마리 구조로) */
export function QuestHome() {
  const { data: quests, isLoading, isError } = useQuests()
  const { data: coupons } = useMyCoupons('AVAILABLE')

  const ongoing = quests?.filter((q) => q.status === 'IN_PROGRESS') ?? []
  const done = quests?.filter((q) => q.status === 'COMPLETED') ?? []

  return (
    <div className="h-full overflow-y-auto px-5 pt-3 pb-8">
      <p className="mb-3 flex items-center justify-end gap-1.5 text-[15px] font-bold text-q-green">
        월계동 <span aria-hidden className="size-2.5 rounded-full bg-q-green" />
      </p>

      <PigeonCard />

      <Link
        to="/coupons"
        className="mt-3 flex items-center justify-between rounded-2xl border border-q-line bg-white px-4 py-3"
      >
        <span className="text-[15px] font-bold text-q-text">내 쿠폰함</span>
        <span className="text-[13px] font-medium text-q-green">
          사용 가능 {coupons?.length ?? 0}장 ›
        </span>
      </Link>

      <section className="mt-7">
        <SectionTitle title="진행 중인 퀘스트" aside="완료하면 보너스 먹이" />
        {isLoading && <div className="h-24 animate-pulse rounded-2xl bg-q-panel" />}
        {isError && <p className="py-6 text-center text-sm text-q-muted">퀘스트를 불러오지 못했어요</p>}
        {quests && ongoing.length === 0 && (
          <p className="rounded-2xl bg-q-panel py-6 text-center text-sm text-q-muted">모든 퀘스트를 완료했어요!</p>
        )}
        <ul className="flex flex-col gap-2.5">
          {[...ongoing, ...done].map((quest) => (
            <li key={quest.questId}>
              <QuestCard quest={quest} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

const BASIC_HINT: Record<string, string> = {
  '숏폼 5개 보기': '숏폼 탭에서 진행돼요',
  '지도에서 가게 3곳 둘러보기': '지도 탭에서 진행돼요',
}

function QuestCard({ quest }: { quest: Quest }) {
  const done = quest.status === 'COMPLETED'
  const isVisit = quest.type === 'VISIT'
  const body = (
    <>
      <span
        aria-hidden
        className={`flex size-11 shrink-0 items-center justify-center rounded-full text-xl ${
          isVisit ? 'bg-q-mint' : 'bg-q-panel'
        }`}
      >
        {isVisit ? '📍' : '⭐'}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-[15px] font-bold text-q-text">{quest.title}</p>
          {done && (
            <span className="shrink-0 rounded-full bg-q-mint px-2 py-0.5 text-[11px] font-bold text-q-green">완료</span>
          )}
        </div>
        <p className="truncate text-xs text-q-muted">
          {isVisit ? '퀘스트 가게에서 GPS + QR로 방문 인증' : (BASIC_HINT[quest.title] ?? '앱 기본 퀘스트')}
        </p>
        <div className="mt-2 flex items-center gap-2.5">
          <span className="shrink-0 text-xs text-q-text">
            {quest.currentCount} / {quest.targetCount}
          </span>
          <ProgressBar value={quest.currentCount} max={quest.targetCount} className="h-1 w-[116px]" />
          <span className="ml-auto flex shrink-0 items-center gap-1 text-[13px] font-bold text-q-green">
            <FeedIcon className="size-5" />
            먹이 {quest.rewardFeed}개
          </span>
        </div>
      </div>
    </>
  )

  const className = 'flex items-center gap-3 rounded-2xl border border-q-line bg-white py-3 pr-4 pl-3'
  if (done || !isVisit) return <div className={`${className} ${done ? 'opacity-60' : ''}`}>{body}</div>
  return (
    <Link to={`/quest/${quest.questId}/visit`} className={`${className} border-q-green`}>
      {body}
    </Link>
  )
}
