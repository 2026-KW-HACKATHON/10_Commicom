import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { FeedIcon } from '@/features/quest/components/QuestUi'
import { useQuestSubscription, useQuestTemplates, useToggleQuestTemplate } from '@/features/quest/hooks'
import { CATEGORY_TEMPLATES, questTemplate, type OwnerQuestTemplate } from '@/features/quest/schema'
import { errorMessage } from '@/shared/lib/error'
import { useMyStore, useMyStoreId } from '../hooks'
import { OWNER_ILLUST } from '../illustrations'
import { OwnerScreen } from './OwnerUi'

/**
 * 퀘스트 등록 — 정해진 템플릿 중 우리 가게가 참여할 퀘스트를 고름.
 * 참여 가게가 1곳 이상인 퀘스트만 손님에게 보임.
 */
export function OwnerQuests() {
  const storeId = useMyStoreId()
  const store = useMyStore()
  const { data: sub } = useQuestSubscription(storeId)
  const { data: templates, isLoading, isError } = useQuestTemplates(storeId)
  const toggle = useToggleQuestTemplate(storeId)
  const [pendingKey, setPendingKey] = useState<string | null>(null)

  const active = sub?.status === 'ACTIVE'
  const recommendedKeys: readonly string[] = (store && CATEGORY_TEMPLATES[store.category]) ?? []
  const recommended = templates?.filter((t) => recommendedKeys.includes(t.templateKey)) ?? []
  const others = templates?.filter((t) => !recommendedKeys.includes(t.templateKey)) ?? []
  const joinedCount = templates?.filter((t) => t.joined).length ?? 0

  const onToggle = (t: OwnerQuestTemplate) => {
    if (t.joined && !window.confirm(`"${t.title}" 참여를 그만둘까요?\n손님 퀘스트에서 우리 가게가 빠져요.`)) return
    setPendingKey(t.templateKey)
    toggle.mutate({ key: t.templateKey, join: !t.joined }, { onSettled: () => setPendingKey(null) })
  }

  return (
    <OwnerScreen>
      {sub && !active && (
        <Link to="/owner/quest-store" className="mb-3 flex items-center gap-3 overflow-hidden rounded-2xl bg-q-green py-2 pr-4 pl-3 text-white">
          <img src={OWNER_ILLUST.qr} alt="" className="-my-1 h-[72px] w-auto object-contain drop-shadow" />
          <span className="flex-1">
            <span className="block text-[15px] font-bold">먼저 퀘스트 가게로 등록해 주세요</span>
            <span className="text-xs opacity-85">등록해야 퀘스트에 참여할 수 있어요</span>
          </span>
          <span className="text-xl">›</span>
        </Link>
      )}

      <section className="rounded-2xl bg-white px-5 py-4">
        <p className="text-[15px] font-bold text-q-text">우리 가게가 참여할 퀘스트를 골라 주세요</p>
        <p className="mt-1 text-[13px] leading-relaxed text-q-muted">
          손님이 퀘스트를 깨려고 참여 가게를 찾아와요.
          <br />
          참여 가게가 한 곳도 없는 퀘스트는 손님에게 보이지 않아요.
        </p>
        <p className="mt-3 inline-block rounded-full bg-q-mint px-3 py-1 text-xs font-bold text-q-green">참여 중 {joinedCount}개</p>
      </section>

      {isLoading && <div className="mt-3 h-40 animate-pulse rounded-2xl bg-white" />}
      {isError && <p className="py-10 text-center text-sm text-q-muted">퀘스트 목록을 불러오지 못했어요</p>}
      {toggle.isError && (
        <p role="alert" className="mt-3 text-center text-[13px] font-medium text-point-red-dark">
          {errorMessage(toggle.error)}
        </p>
      )}

      {recommended.length > 0 && (
        <TemplateSection title={`${store?.categoryName ?? '우리 가게'} 추천`}>
          {recommended.map((t) => (
            <TemplateCard key={t.templateKey} t={t} recommended disabled={!active} pending={pendingKey === t.templateKey} onToggle={onToggle} />
          ))}
        </TemplateSection>
      )}
      {others.length > 0 && (
        <TemplateSection title={recommended.length > 0 ? '다른 퀘스트' : '전체 퀘스트'}>
          {others.map((t) => (
            <TemplateCard key={t.templateKey} t={t} disabled={!active} pending={pendingKey === t.templateKey} onToggle={onToggle} />
          ))}
        </TemplateSection>
      )}
    </OwnerScreen>
  )
}

function TemplateSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-5">
      <h3 className="mb-2 px-1 text-[15px] font-bold text-q-text">{title}</h3>
      <ul className="flex flex-col gap-2">{children}</ul>
    </section>
  )
}

function TemplateCard({
  t,
  recommended = false,
  disabled,
  pending,
  onToggle,
}: {
  t: OwnerQuestTemplate
  recommended?: boolean
  disabled: boolean
  pending: boolean
  onToggle: (t: OwnerQuestTemplate) => void
}) {
  const tpl = questTemplate(t.templateKey)
  const hidden = t.participantCount === 0
  return (
    <li className={`flex items-center gap-3 rounded-2xl bg-white py-3 pr-3 pl-3 ${t.joined ? 'ring-2 ring-q-green' : ''}`}>
      <span className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-q-mint">
        {tpl && <img src={tpl.image} alt="" className="h-14 w-auto object-contain" />}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-[15px] font-bold text-q-text">{t.title}</p>
          {recommended && <span className="shrink-0 rounded-full bg-point-yellow/50 px-1.5 py-px text-[10px] font-bold text-point-red-dark">추천</span>}
        </div>
        <p className="truncate text-xs text-q-muted">{t.description}</p>
        <p className="mt-1 flex items-center gap-2 text-[11px] whitespace-nowrap text-q-sub">
          <span className={hidden ? 'font-bold text-point-red-dark' : ''}>
            {hidden ? '참여 가게 없음 (숨김)' : `참여 가게 ${t.participantCount}곳`}
          </span>
          <span className="flex shrink-0 items-center gap-0.5">
            <FeedIcon className="size-3.5" />
            보상 {t.rewardFeed}개
          </span>
        </p>
      </div>
      <button
        type="button"
        disabled={disabled || pending}
        onClick={() => onToggle(t)}
        className={`h-9 shrink-0 rounded-full px-3.5 text-[13px] font-bold whitespace-nowrap transition-transform active:scale-95 disabled:opacity-40 ${
          t.joined ? 'bg-q-mint text-q-green' : 'bg-q-green text-white'
        }`}
      >
        {pending ? '...' : t.joined ? '✓ 참여 중' : hidden ? '첫 가게 되기' : '참여하기'}
      </button>
    </li>
  )
}
