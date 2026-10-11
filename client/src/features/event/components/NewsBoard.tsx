import { Link, useSearchParams } from 'react-router-dom'
import { useEarlyOwnerEvent, useServerNotices } from '../api'
import { EVENTS, NOTICES, noticeDateText } from '../data'
import { useNewsBase } from '../useNewsBase'

type Tab = 'event' | 'notice'

/** 공지사항이 먼저 (왼쪽·기본), 이벤트는 ?tab=event */
const TABS: { key: Tab; label: string }[] = [
  { key: 'notice', label: '공지사항' },
  { key: 'event', label: '이벤트' },
]

/** 메뉴 → 이벤트 · 공지사항: 위 탭으로 고르고, 목록에서 누르면 상세 */
export function NewsBoard() {
  const [params, setParams] = useSearchParams()
  const tab: Tab = params.get('tab') === 'event' ? 'event' : 'notice'

  return (
    <div className="h-full overflow-y-auto px-5 pt-4 pb-10">
      <div role="tablist" aria-label="이벤트 · 공지사항" className="mb-4 grid grid-cols-2 rounded-full bg-q-panel p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={t.key === tab}
            onClick={() => setParams(t.key === 'notice' ? {} : { tab: t.key }, { replace: true })}
            className="h-10 rounded-full text-[14px] font-bold text-q-muted aria-selected:bg-white aria-selected:text-green-6 aria-selected:shadow-sm"
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'notice' ? <NoticeItems /> : <EventItems />}
    </div>
  )
}

function EventItems() {
  const base = useNewsBase()
  const { data: earlyOwner } = useEarlyOwnerEvent()
  const badge =
    earlyOwner?.status === 'OPEN'
      ? { text: `진행 중 · 남은 자리 ${earlyOwner.remaining}`, tone: 'bg-green-6 text-white' }
      : earlyOwner?.status === 'CLOSED'
        ? { text: '마감', tone: 'bg-q-panel text-q-muted' }
        : earlyOwner
          ? { text: '곧 시작', tone: 'bg-point-yellow text-green-6' }
          : null

  return (
    <ul className="flex flex-col gap-3">
      {EVENTS.map((e) => (
        <li key={e.id}>
          <Link
            to={`${base}/${e.id}`}
            className="flex items-center gap-3 overflow-hidden rounded-3xl bg-white py-3 pr-4 pl-3 shadow-[0_6px_18px_rgba(8,104,22,0.1)] active:bg-q-panel"
          >
            <span className="flex size-[72px] shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-green-6 to-green-4">
              <img src={e.image} alt="" className="size-[60px] object-contain" />
            </span>
            <span className="min-w-0 flex-1">
              {badge && <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${badge.tone}`}>{badge.text}</span>}
              <span className="mt-1 block text-[16px] font-bold text-q-text">{e.title}</span>
              <span className="mt-0.5 block text-[12px] leading-snug text-q-muted">{e.summary}</span>
            </span>
            <span className="text-q-muted">›</span>
          </Link>
        </li>
      ))}
    </ul>
  )
}

function NoticeItems() {
  const base = useNewsBase()
  const { data: serverNotices } = useServerNotices()
  // 관리자가 쓴 공지 + 앱에 들어 있는 출시 공지 (고정 먼저, 그다음 최신 순)
  const items = [
    ...(serverNotices ?? []).map((n) => ({ id: String(n.noticeId), title: n.title, date: n.createdAt.slice(0, 10), pinned: n.pinned })),
    ...NOTICES.map((n) => ({ id: n.id, title: n.title, date: n.date, pinned: Boolean(n.pinned) })),
  ].sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.date.localeCompare(a.date))
  return (
    <ul className="overflow-hidden rounded-3xl bg-white shadow-[0_6px_18px_rgba(8,104,22,0.1)]">
      {items.map((n, i) => (
        <li key={n.id} className={i > 0 ? 'border-t border-q-line' : ''}>
          <Link to={`${base}/notices/${n.id}`} className="flex items-center gap-3 px-4 py-4 active:bg-q-panel">
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5">
                {n.pinned && <span className="rounded-full bg-point-red px-1.5 py-px text-[10px] font-bold text-white">공지</span>}
                <span className="truncate text-[15px] font-bold text-q-text">{n.title}</span>
              </span>
              <span className="mt-0.5 block text-[12px] text-q-muted">{noticeDateText(n.date)}</span>
            </span>
            <span className="text-q-muted">›</span>
          </Link>
        </li>
      ))}
    </ul>
  )
}
