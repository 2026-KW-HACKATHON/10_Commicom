import { useState } from 'react'
import { Navigate, useLocation, useParams, useSearchParams } from 'react-router-dom'
import { PigeonAlbum } from '@/features/quest/components/PigeonAlbum'
import { PigeonHistory } from '@/features/quest/components/PigeonHistory'
import { QuestHome } from '@/features/quest/components/QuestHome'
import { QuestVisit } from '@/features/quest/components/QuestVisit'
import { usePigeonAccess, useQuests } from '@/features/quest/hooks'

export function QuestPage() {
  return <QuestHome />
}

export function QuestVisitPage() {
  const { needsLogin } = usePigeonAccess()
  const { questId } = useParams()
  const { data: quests, isLoading } = useQuests()
  const quest = quests?.find((q) => String(q.questId) === questId && q.type === 'VISIT')
  // "이미 완료" 판단은 처음 들어온 순간의 상태로만 — 이 화면에서 마지막 인증을 하면 목록이 COMPLETED로 바뀌는데,
  // 그때 다시 판단하면 "퀘스트 완료!" 축하 화면이 바로 "이미 완료한 퀘스트예요"로 바뀌어 버림
  const [completedOnEntry, setCompletedOnEntry] = useState<boolean | null>(null)
  if (quest && completedOnEntry === null) setCompletedOnEntry(quest.status === 'COMPLETED')

  if (needsLogin) return <LoginRedirect />
  if (isLoading) return <div className="m-5 h-40 animate-pulse rounded-2xl bg-q-mint" />
  if (!quest) return <Message>방문 인증할 수 있는 퀘스트가 아니에요</Message>
  if (completedOnEntry) return <Message>이미 완료한 퀘스트예요</Message>
  return <QuestVisit key={quest.questId} quest={quest} />
}

/** 가게 QR을 카메라로 찍으면 열리는 주소 → 진행 중인 방문 퀘스트의 인증 화면으로 (QR 값 채워서) */
export function QuestScanPage() {
  const { needsLogin } = usePigeonAccess()
  const [params] = useSearchParams()
  const { data: quests, isLoading } = useQuests()
  // 가게 QR을 찍고 들어왔으면 로그인 후 이 주소(QR 값 포함)로 돌아옴
  if (needsLogin) return <LoginRedirect />
  if (isLoading) return <div className="m-5 h-40 animate-pulse rounded-2xl bg-q-mint" />
  const quest = quests?.find((q) => q.type === 'VISIT' && q.status === 'IN_PROGRESS')
  if (!quest) return <Message>진행 중인 방문 퀘스트가 없어요</Message>
  return <Navigate to={`/quest/${quest.questId}/visit?${params.toString()}`} replace />
}

export function PigeonAlbumPage() {
  return <PigeonAlbum />
}

export function PigeonHistoryPage() {
  return <PigeonHistory />
}

/** 퀘스트 진행(방문 인증)은 로그인한 회원만 — 로그인 후 지금 주소로 돌아옴 */
function LoginRedirect() {
  const { pathname, search } = useLocation()
  return <Navigate to={`/login?next=${encodeURIComponent(pathname + search)}`} replace />
}

function Message({ children }: { children: string }) {
  return <div className="flex h-full items-center justify-center text-q-muted">{children}</div>
}
