import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import pigeonCrying from '@/assets/generation/pigeon-crying.jpg'
import pigeonUpload from '@/assets/generation/pigeon-upload.jpg'
import pigeonUploaded from '@/assets/generation/pigeon-uploaded.png'
import { FramedVideo } from '@/features/feed/components/FramedVideo'
import { useStoreShortforms } from '@/features/feed/hooks'
import type { Shortform } from '@/features/feed/schema'
import { useMyStoreId } from '@/features/owner/hooks'
import { errorMessage } from '@/shared/lib/error'
import { CloseIcon } from '@/shared/ui/icons'
import { cancelGeneration, deleteShortform, fetchGeneration, fetchShortformDetail, postGeneration, replaceShortform } from '../api'
import { EDIT_TARGETS, editPlaceholder, type EditTarget } from '../schema'
import { Dialog } from './Dialog'
import { ErrorText, Hero, Screen, StepWaiting } from './FlowUi'

type Step = 'pick' | 'input' | 'generate' | 'done'

/**
 * 이미 올린 숏폼 재수정 (PRO).
 * 새 버전을 만드는 동안 기존 영상은 손님 피드에 그대로 → 확인 후 "이걸로 교체"하면 그때 바뀜.
 */
export function ReviseShortformFlow({ shortformId }: { shortformId: number }) {
  const navigate = useNavigate()
  const storeId = useMyStoreId()
  const { data: videos, isLoading } = useStoreShortforms(storeId)
  // 교체하면 목록에서 원래 영상이 사라지므로 처음 찾은 것을 붙잡아 둠 (완료 화면까지 유지)
  const [original, setOriginal] = useState<Shortform | null>(null)
  const found = videos?.find((v) => v.shortformId === shortformId)
  if (!original && found) setOriginal(found)
  const backToList = () => navigate('/owner/videos', { replace: true })

  return (
    <div className="mx-auto flex h-full max-w-[430px] flex-col bg-white">
      <header className="flex h-[68px] shrink-0 items-center justify-between px-[18px] pt-[env(safe-area-inset-top)]">
        <button
          type="button"
          aria-label="닫기"
          onClick={backToList}
          className="flex size-[44px] items-center justify-center rounded-full border border-mint-line bg-white text-green-6 shadow-[0_4px_14px_rgba(8,104,22,0.14)]"
        >
          <CloseIcon />
        </button>
        <p className="flex items-center gap-1.5 text-[17px] font-bold text-ink">
          영상 수정 <span className="rounded-full bg-green-6 px-1.5 text-[10px] leading-4 text-white">PRO</span>
        </p>
        <span className="size-[44px]" />
      </header>

      {isLoading && <p className="py-20 text-center text-sm text-q-muted">영상을 불러오는 중...</p>}
      {videos && !original && !found && (
        <Screen prev={{ label: '내 영상으로', onClick: backToList }}>
          <p className="py-20 text-center text-sm text-q-muted">수정할 영상을 찾을 수 없어요</p>
        </Screen>
      )}
      {original && <Revise original={original} onExit={backToList} />}
    </div>
  )
}

function Revise({ original, onExit }: { original: Shortform; onExit: () => void }) {
  const queryClient = useQueryClient()
  const [step, setStep] = useState<Step>('pick')
  const [target, setTarget] = useState<EditTarget>('VIDEO')
  const [text, setText] = useState('')
  const [generationId, setGenerationId] = useState<number | null>(null)
  const [startedAt, setStartedAt] = useState(0)
  const [modal, setModal] = useState<'cancel' | 'replace' | 'discard' | null>(null)

  const generate = useMutation({
    mutationFn: () =>
      postGeneration({ storeId: original.storeId, revision: { shortformId: original.shortformId, target, request: text.trim() } }),
    onSuccess: (g) => {
      setGenerationId(g.generationId)
      setStartedAt(Date.now())
      setStep('generate')
    },
  })
  const generation = useQuery({
    queryKey: ['generation', generationId],
    queryFn: () => fetchGeneration(generationId!),
    enabled: generationId !== null,
    refetchInterval: (q) => (q.state.data && ['COMPLETED', 'FAILED'].includes(q.state.data.status) ? false : 3000),
  })
  const newId = generation.data?.status === 'COMPLETED' ? generation.data.shortformId : null
  const detail = useQuery({
    queryKey: ['shortform-detail', newId],
    queryFn: () => fetchShortformDetail(newId!),
    enabled: newId !== null,
  })
  const replace = useMutation({
    mutationFn: () => replaceShortform(original.shortformId, newId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shortforms'] })
      setModal(null)
      setStep('done')
    },
  })
  const discard = useMutation({ mutationFn: () => deleteShortform(newId!), onSuccess: onExit })

  const restart = () => {
    setGenerationId(null)
    setStep('pick')
  }

  return (
    <>
      {step === 'pick' && (
        <Screen hero={<Hero sub="어떤 것을 수정하고 싶으신가요?" plain />} prev={{ label: '취소', onClick: onExit, wide: true }}>
          <OriginalCard video={original} />
          <div className="mt-6 flex flex-col gap-3">
            {EDIT_TARGETS.map(([t, label]) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setTarget(t)
                  setText('')
                  setStep('input')
                }}
                className="h-12 rounded-xl bg-green-4 text-[15px] font-bold text-white active:scale-[0.98]"
              >
                {label}
              </button>
            ))}
          </div>
          <p className="mt-4 text-center text-xs leading-relaxed text-q-muted">
            새 버전으로 바꾸기 전까지
            <br />
            지금 영상은 손님에게 그대로 보여요
          </p>
        </Screen>
      )}

      {step === 'input' && (
        <Screen
          hero={<Hero sub="어떻게 수정하고 싶으신가요?" plain />}
          prev={{ onClick: () => setStep('pick') }}
          next={{ label: generate.isPending ? '요청 중...' : '수정 요청', onClick: () => generate.mutate(), disabled: !text.trim() || generate.isPending }}
        >
          <p className="mb-2 text-xs font-bold text-q-muted">{target === 'VIDEO' ? '영상' : '대본 및 자막'} 수정</p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            maxLength={200}
            autoFocus
            placeholder={editPlaceholder(target)}
            className="w-full resize-none border-b-2 border-green-4 py-2 text-[15px] leading-relaxed text-ink outline-none placeholder:text-gray-2"
          />
          <p className="mt-1 text-right text-xs text-gray-2">{text.length} / 200</p>
          {generate.isError && <ErrorText>{errorMessage(generate.error)}</ErrorText>}
        </Screen>
      )}

      {step === 'generate' && generation.data?.status !== 'COMPLETED' && (
        <StepWaiting
          startedAt={startedAt}
          failed={generation.data?.status === 'FAILED' ? (generation.data.errorMessage ?? '영상을 만들지 못했어요') : null}
          onCancel={() => setModal('cancel')}
          onRetry={() => setStep('input')}
          sub={'요청하신 내용으로\n새 버전을 만들고 있어요!'}
          note="그동안 지금 영상은 손님 피드에 그대로 보여요."
        />
      )}

      {step === 'generate' && generation.data?.status === 'COMPLETED' && (
        <Screen
          prev={{ label: '다시 수정', onClick: restart }}
          next={{ label: '이걸로 교체', onClick: () => setModal('replace'), disabled: !detail.data }}
        >
          <p className="mb-2 text-center text-[13px] font-bold text-green-4">새 버전이 완성됐어요</p>
          <div className="relative mx-auto aspect-[9/16] w-full max-w-[260px] overflow-hidden rounded-3xl bg-green-1 shadow-[0_10px_30px_rgba(8,104,22,0.18)]">
            {detail.data ? (
              <FramedVideo videoUrl={detail.data.videoUrl} posterUrl={detail.data.thumbnailUrl} frame={detail.data.frame} />
            ) : (
              <p className="flex h-full items-center justify-center text-sm text-q-muted">영상을 불러오는 중...</p>
            )}
          </div>
          {detail.data && (
            <div className="mx-auto mt-4 max-w-[300px]">
              <p className="text-[16px] font-bold text-ink">{detail.data.title}</p>
              <p className="mt-1 line-clamp-3 text-[13px] leading-relaxed text-q-muted">{detail.data.script}</p>
            </div>
          )}
          {replace.isError && <ErrorText>{errorMessage(replace.error)}</ErrorText>}
          <button type="button" onClick={() => setModal('discard')} className="mx-auto mt-4 block text-[13px] text-q-muted underline">
            그만두고 지금 영상 유지하기
          </button>
        </Screen>
      )}

      {step === 'done' && (
        <div className="flex flex-1 flex-col items-center px-6 pb-[max(20px,env(safe-area-inset-bottom))]">
          <p className="mt-10 text-[22px] font-bold text-green-4">교체 완료!</p>
          <p className="mt-1 text-sm text-q-muted">이제 손님 숏폼 피드에 새 버전이 보여요</p>
          <img src={pigeonUploaded} alt="" className="mt-8 h-[220px] w-auto animate-[rise-center_.5s_ease-out] object-contain" />
          <button type="button" onClick={onExit} className="mt-auto h-[52px] w-full rounded-xl bg-green-4 text-base font-bold text-white">
            내 영상으로 가기
          </button>
        </div>
      )}

      {modal === 'cancel' && (
        <Dialog
          title="수정을 취소할까요?"
          text="지금 영상은 그대로 유지돼요"
          image={pigeonCrying}
          primary={{ label: '계속 기다릴래요', onClick: () => setModal(null) }}
          secondary={{
            label: '네 취소할래요',
            onClick: () => {
              if (generationId) cancelGeneration(generationId)
              setModal(null)
              restart()
            },
          }}
        />
      )}
      {modal === 'replace' && (
        <Dialog
          title="이 버전으로 바꿀까요?"
          text="지금 손님에게 보이는 영상이 새 버전으로 바뀌어요"
          image={pigeonUpload}
          primary={{ label: replace.isPending ? '바꾸는 중...' : '네 바꿀래요', onClick: () => replace.mutate() }}
          secondary={{ label: '아니요', onClick: () => setModal(null) }}
        />
      )}
      {modal === 'discard' && (
        <Dialog
          title="새 버전을 버릴까요?"
          text="지금 영상은 그대로 유지돼요"
          image={pigeonCrying}
          primary={{ label: '아니요', onClick: () => setModal(null) }}
          secondary={{ label: discard.isPending ? '정리 중...' : '네 버릴래요', onClick: () => discard.mutate() }}
        />
      )}
    </>
  )
}

/** 지금 손님에게 보이는 영상 (무엇을 고치는지 확인용) */
function OriginalCard({ video }: { video: Shortform }) {
  const f = video.frame
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-q-panel p-3">
      <span className="relative block h-[84px] w-[56px] shrink-0 overflow-hidden rounded-xl bg-q-mint">
        {video.posterUrl && (
          <img
            src={video.posterUrl}
            alt=""
            className="absolute left-1/2 max-w-none -translate-x-1/2"
            style={f ? { height: `${100 / f.height}%`, top: `${(-100 * f.top) / f.height}%` } : { height: '100%', top: 0 }}
          />
        )}
      </span>
      <span className="min-w-0">
        <span className="text-[11px] font-bold text-q-green">지금 공개 중인 영상</span>
        <span className="mt-0.5 line-clamp-2 block text-[14px] font-bold text-q-text">{video.description || video.storeName}</span>
      </span>
    </div>
  )
}
