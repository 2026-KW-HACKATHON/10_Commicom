import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useServerNotices, type ServerNotice } from '@/features/event/api'
import { errorMessage } from '@/shared/lib/error'
import { num } from '@/shared/lib/format'
import { BackIcon } from '@/shared/ui/icons'
import { useMe } from '@/stores/authStore'
import { toast } from '@/stores/toastStore'
import { useAdminEarlyOwners, useAdminFeedback, useAdminSummary, useDeleteNotice, useSaveNotice } from './api'

type Tab = 'summary' | 'feedback' | 'notice' | 'event'

const TABS: { key: Tab; label: string }[] = [
  { key: 'summary', label: '현황' },
  { key: 'feedback', label: '의견' },
  { key: 'notice', label: '공지' },
  { key: 'event', label: '이벤트' },
]

const card = 'rounded-3xl bg-white px-5 py-4 shadow-[0_6px_18px_rgba(8,104,22,0.08)]'

function dateTime(iso: string) {
  const d = new Date(iso)
  return `${d.getMonth() + 1}.${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/** 관리자 화면 (role ADMIN 계정으로 로그인했을 때만) */
export function AdminScreen() {
  const me = useMe()
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('summary')

  return (
    <div className="mx-auto flex h-full max-w-[430px] flex-col bg-app">
      <header className="flex h-[64px] shrink-0 items-center gap-3 border-b border-green-1 px-4">
        <button type="button" aria-label="뒤로" onClick={() => navigate(-1)} className="flex size-10 items-center justify-center rounded-full text-green-6">
          <BackIcon />
        </button>
        <h1 className="text-[20px] font-bold text-ink">관리자 화면</h1>
      </header>

      {me?.role !== 'ADMIN' ? (
        <p className="px-6 pt-16 text-center text-[14px] leading-relaxed text-q-muted">
          관리자 계정으로 로그인해야 볼 수 있어요.
          <br />
          메뉴에서 관리자 계정으로 로그인해 주세요.
        </p>
      ) : (
        <>
          <div role="tablist" className="mx-4 mt-3 grid shrink-0 grid-cols-4 rounded-full bg-q-panel p-1">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={tab === t.key}
                onClick={() => setTab(t.key)}
                className="h-9 rounded-full text-[13px] font-bold text-q-muted aria-selected:bg-white aria-selected:text-green-6 aria-selected:shadow-sm"
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-3 pb-10">
            {tab === 'summary' && <SummaryTab />}
            {tab === 'feedback' && <FeedbackTab />}
            {tab === 'notice' && <NoticeTab />}
            {tab === 'event' && <EventTab />}
          </div>
        </>
      )}
    </div>
  )
}

function SummaryTab() {
  const { data, isLoading, error } = useAdminSummary()
  if (isLoading) return <div className="h-64 animate-pulse rounded-3xl bg-q-panel" />
  if (!data) return <p className="py-10 text-center text-sm text-q-muted">{errorMessage(error, '현황을 불러오지 못했어요')}</p>
  const tiles: [string, string][] = [
    ['손님 회원', `${num(data.residents)}명`],
    ['사장님 회원', `${num(data.owners)}명`],
    ['가게', `${num(data.stores)}곳`],
    ['게시물', `${num(data.shortforms)}개`],
    ['발행 중 쿠폰', `${num(data.activeCoupons)}종`],
    ['보상 쿠폰 풀', data.rewardPool ? '있음' : '비어 있음'],
    ['기다리는 교환권', `${num(data.vouchersWaiting)}장`],
    ['초기 사장님 이벤트', `${num(data.earlyOwners)} / 10곳`],
    ['의견', `${num(data.feedbacks)}개`],
    ['평균 별점', data.feedbacks ? `★ ${data.averageRating}` : '-'],
  ]
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {tiles.map(([label, value]) => (
        <div key={label} className={card}>
          <p className="text-[12px] text-q-muted">{label}</p>
          <p className="mt-1 text-[20px] font-bold text-q-text">{value}</p>
        </div>
      ))}
    </div>
  )
}

function FeedbackTab() {
  const { data, isLoading, error } = useAdminFeedback()
  if (isLoading) return <div className="h-64 animate-pulse rounded-3xl bg-q-panel" />
  if (!data) return <p className="py-10 text-center text-sm text-q-muted">{errorMessage(error, '의견을 불러오지 못했어요')}</p>
  if (data.length === 0) return <p className="py-10 text-center text-sm text-q-muted">아직 의견이 없어요</p>
  return (
    <ul className="flex flex-col gap-2.5">
      {data.map((f) => (
        <li key={f.feedbackId} className={card}>
          <div className="flex items-center justify-between">
            <span className="text-[15px] tracking-wider text-point-yellow">{'★'.repeat(f.rating)}<span className="text-q-line">{'★'.repeat(5 - f.rating)}</span></span>
            <span className="text-[11px] text-q-muted">
              {f.beta && <b className="mr-1 text-green-6">BETA</b>}
              {f.mode === 'OWNER' ? '사장님' : '손님'} · {dateTime(f.createdAt)}
            </span>
          </div>
          {f.good && <p className="mt-2 text-[13px] leading-relaxed text-q-text">👍 {f.good}</p>}
          {f.bad && <p className="mt-1.5 text-[13px] leading-relaxed text-q-sub">🙏 {f.bad}</p>}
        </li>
      ))}
    </ul>
  )
}

function NoticeTab() {
  const { data: notices } = useServerNotices()
  const save = useSaveNotice()
  const remove = useDeleteNotice()
  const [editing, setEditing] = useState<ServerNotice | null>(null)
  const [form, setForm] = useState({ title: '', body: '', pinned: false })

  const startEdit = (n: ServerNotice | null) => {
    setEditing(n)
    setForm(n ? { title: n.title, body: n.body, pinned: n.pinned } : { title: '', body: '', pinned: false })
  }

  const submit = () => {
    if (!form.title.trim() || !form.body.trim()) return toast('제목과 내용을 적어 주세요')
    save.mutate(
      { ...form, noticeId: editing?.noticeId },
      {
        onSuccess: () => {
          toast(editing ? '공지를 고쳤어요' : '공지를 올렸어요')
          startEdit(null)
        },
        onError: (e) => toast(errorMessage(e)),
      },
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <section className={card}>
        <h2 className="text-[15px] font-bold text-q-text">{editing ? '공지 고치기' : '새 공지 쓰기'}</h2>
        <input
          value={form.title}
          maxLength={100}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="제목"
          className="mt-3 h-11 w-full rounded-xl border border-q-line px-3 text-[14px] outline-none focus:border-green-4"
        />
        <textarea
          value={form.body}
          maxLength={5000}
          onChange={(e) => setForm({ ...form, body: e.target.value })}
          rows={6}
          placeholder="내용 (줄바꿈 그대로 보여요)"
          className="mt-2 w-full resize-none rounded-xl border border-q-line px-3 py-2.5 text-[14px] outline-none focus:border-green-4"
        />
        <label className="mt-2 flex items-center gap-2 text-[13px] text-q-sub">
          <input type="checkbox" checked={form.pinned} onChange={(e) => setForm({ ...form, pinned: e.target.checked })} className="size-4 accent-green-6" />
          목록 맨 위에 고정
        </label>
        <div className="mt-3 flex gap-2">
          {editing && (
            <button type="button" onClick={() => startEdit(null)} className="h-11 flex-1 rounded-full bg-q-panel text-[14px] font-bold text-q-sub">
              취소
            </button>
          )}
          <button type="button" disabled={save.isPending} onClick={submit} className="h-11 flex-1 rounded-full bg-green-6 text-[14px] font-bold text-white disabled:opacity-50">
            {save.isPending ? '저장 중...' : editing ? '고치기' : '올리기'}
          </button>
        </div>
      </section>

      <h2 className="mt-2 px-1 text-[13px] font-bold text-q-muted">올린 공지 (앱에 들어 있는 출시 공지는 여기 없어요)</h2>
      {(notices ?? []).length === 0 && <p className="py-6 text-center text-sm text-q-muted">아직 올린 공지가 없어요</p>}
      {notices?.map((n) => (
        <article key={n.noticeId} className={card}>
          <div className="flex items-center gap-1.5">
            {n.pinned && <span className="rounded-full bg-point-red px-1.5 py-px text-[10px] font-bold text-white">고정</span>}
            <h3 className="min-w-0 flex-1 truncate text-[15px] font-bold text-q-text">{n.title}</h3>
            <span className="text-[11px] text-q-muted">{dateTime(n.createdAt)}</span>
          </div>
          <p className="mt-1.5 line-clamp-3 text-[13px] whitespace-pre-line text-q-sub">{n.body}</p>
          <div className="mt-2 flex justify-end gap-3 text-[13px] font-bold">
            <button type="button" onClick={() => startEdit(n)} className="text-green-6">
              고치기
            </button>
            <button
              type="button"
              onClick={() =>
                window.confirm('이 공지를 지울까요?') &&
                remove.mutate(n.noticeId, { onSuccess: () => toast('공지를 지웠어요'), onError: (e) => toast(errorMessage(e)) })
              }
              className="text-point-red-dark"
            >
              지우기
            </button>
          </div>
        </article>
      ))}
    </div>
  )
}

function EventTab() {
  const { data, isLoading, error } = useAdminEarlyOwners()
  if (isLoading) return <div className="h-40 animate-pulse rounded-3xl bg-q-panel" />
  if (!data) return <p className="py-10 text-center text-sm text-q-muted">{errorMessage(error, '당첨 가게를 불러오지 못했어요')}</p>
  return (
    <section className={card}>
      <h2 className="flex items-center justify-between text-[15px] font-bold text-q-text">
        초기 사장님 이벤트 당첨 가게 <span className="text-[13px] text-green-6">{num(data.length)} / 10</span>
      </h2>
      {data.length === 0 ? (
        <p className="py-6 text-center text-sm text-q-muted">아직 당첨된 가게가 없어요</p>
      ) : (
        <ol className="mt-2 divide-y divide-q-line">
          {data.map((r, i) => (
            <li key={r.storeId} className="flex items-center gap-3 py-2.5 text-[14px]">
              <span className="flex size-6 items-center justify-center rounded-full bg-green-6 text-[12px] font-bold text-white">{i + 1}</span>
              <span className="min-w-0 flex-1 truncate font-medium text-q-text">{r.storeName}</span>
              <span className="text-[11px] text-q-muted">{dateTime(r.grantedAt)}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
