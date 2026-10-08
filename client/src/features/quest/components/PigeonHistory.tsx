import { untilText } from '@/features/coupon/schema'
import { usePigeonAccess, usePigeonHistory } from '../hooks'
import { pigeonImage, type HistoryItem } from '../schema'
import { FeedIcon } from './QuestUi'

/** 성장 기록 — 레벨업 이력과 뽑기 결과 (3-4) */
export function PigeonHistory() {
  const { needsLogin } = usePigeonAccess()
  const { data, isLoading, isError } = usePigeonHistory()

  return (
    <div className="h-full overflow-y-auto px-5 pt-4 pb-8">
      {needsLogin && <p className="py-10 text-center text-sm text-q-muted">로그인하면 성장 기록을 볼 수 있어요</p>}
      {isLoading && <div className="h-40 animate-pulse rounded-2xl bg-q-panel" />}
      {isError && <p className="py-10 text-center text-sm text-q-muted">성장 기록을 불러오지 못했어요</p>}
      {data && data.history.length === 0 && (
        <p className="rounded-2xl bg-q-panel py-10 text-center text-sm text-q-muted">
          아직 레벨업 기록이 없어요.
          <br />
          먹이를 모아 첫 레벨업을 해 보세요!
        </p>
      )}
      <ol className="relative flex flex-col gap-3 before:absolute before:top-2 before:bottom-2 before:left-[27px] before:w-0.5 before:bg-q-mint">
        {data?.history.map((item) => (
          <li key={item.historyId} className="relative flex items-center gap-3">
            <span className="relative flex size-14 shrink-0 items-center justify-center rounded-full border-2 border-white bg-q-mint">
              <img src={pigeonImage(item.toLevel)} alt="" className="size-11 object-contain" />
            </span>
            <div className="flex-1 rounded-2xl border border-q-line bg-white px-4 py-3">
              <div className="flex items-center justify-between">
                <p className="text-[15px] font-bold text-q-text">
                  Lv. {item.fromLevel} → Lv. {item.toLevel}
                </p>
                <time className="text-xs text-q-muted" dateTime={item.createdAt}>
                  {formatDate(item.createdAt)}
                </time>
              </div>
              <RewardText item={item} />
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}

function RewardText({ item }: { item: HistoryItem }) {
  const { reward } = item
  if (reward.type === 'COUPON' && reward.userCoupon) {
    return (
      <p className="mt-1 text-[13px] font-medium text-point-red-dark">
        🎟 {reward.userCoupon.storeName} · {reward.userCoupon.title} ({untilText(reward.userCoupon.expiresAt)})
      </p>
    )
  }
  return (
    <p className="mt-1 flex items-center gap-1 text-[13px] text-q-sub">
      <FeedIcon className="size-4" />
      {reward.feedAmount > 0 ? `먹이 ${reward.feedAmount}개 획득` : '보상 없음'}
    </p>
  )
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return `${d.getMonth() + 1}.${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
