import { Navigate, useParams, useSearchParams } from 'react-router-dom'
import { PigeonHistory } from '@/features/quest/components/PigeonHistory'
import { QuestHome } from '@/features/quest/components/QuestHome'
import { QuestVisit } from '@/features/quest/components/QuestVisit'
import { useQuests } from '@/features/quest/hooks'

export function QuestPage() {
  return <QuestHome />
}

export function QuestVisitPage() {
  const { questId } = useParams()
  const { data: quests, isLoading } = useQuests()
  const quest = quests?.find((q) => String(q.questId) === questId && q.type === 'VISIT')

  if (isLoading) return <div className="m-5 h-40 animate-pulse rounded-2xl bg-q-mint" />
  if (!quest) return <Message>방문 인증할 수 있는 퀘스트가 아니에요</Message>
  if (quest.status === 'COMPLETED') return <Message>이미 완료한 퀘스트예요</Message>
  return <QuestVisit key={quest.questId} quest={quest} />
}

/** 가게 QR을 카메라로 찍으면 열리는 주소 → 진행 중인 방문 퀘스트의 인증 화면으로 (QR 값 채워서) */
export function QuestScanPage() {
  const [params] = useSearchParams()
  const { data: quests, isLoading } = useQuests()
  if (isLoading) return <div className="m-5 h-40 animate-pulse rounded-2xl bg-q-mint" />
  const quest = quests?.find((q) => q.type === 'VISIT' && q.status === 'IN_PROGRESS')
  if (!quest) return <Message>진행 중인 방문 퀘스트가 없어요</Message>
  return <Navigate to={`/quest/${quest.questId}/visit?${params.toString()}`} replace />
}

export function PigeonHistoryPage() {
  return <PigeonHistory />
}

function Message({ children }: { children: string }) {
  return <div className="flex h-full items-center justify-center text-q-muted">{children}</div>
}
