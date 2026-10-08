import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import pigeonCrying from '@/assets/generation/pigeon-crying.jpg'
import pigeonUpload from '@/assets/generation/pigeon-upload.jpg'
import pigeonUploaded from '@/assets/generation/pigeon-uploaded.png'
import working2 from '@/assets/generation/pigeon-working-2.jpg'
import { PostCarousel } from '@/features/feed/components/PostCarousel'
import { useMyStore, useMyStoreId } from '@/features/owner/hooks'
import { useIsPro } from '@/features/pro/hooks'
import { errorMessage } from '@/shared/lib/error'
import { CloseIcon } from '@/shared/ui/icons'
import {
  cancelGeneration,
  deleteShortform,
  extractMenus,
  fetchGeneration,
  fetchShortformDetail,
  MAX_POST_PHOTOS,
  postGeneration,
  publishShortform,
} from '../api'
import { EDIT_TARGETS, editPlaceholder, isMapUrl, type EditTarget, type GenerationRequest, type MenuItem } from '../schema'
import { Dialog } from './Dialog'
import { ErrorText, Hero, Screen, StepWaiting } from './FlowUi'

type Step = 'source' | 'menus' | 'appeal' | 'generate' | 'editPick' | 'editInput' | 'done'

/**
 * 숏폼 만들기 (Figma 9:220 ~ 9:1170, 사장님 전용)
 * 재료 입력 → 메뉴 확인 → 어필 → 생성 대기(폴링) → 확인 → (수정: PRO) → 업로드 → 완료
 */
export function CreateShortformFlow() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const storeId = useMyStoreId()
  const store = useMyStore()
  const isPro = useIsPro()

  const [step, setStep] = useState<Step>('source')
  const [mapUrl, setMapUrl] = useState('')
  const [files, setFiles] = useState<File[]>([])
  // 게시물에 같이 넣을 음식·가게 사진 (메뉴 읽기엔 안 씀)
  const [photos, setPhotos] = useState<File[]>([])
  const [menus, setMenus] = useState<MenuItem[]>([])
  const [appeal, setAppeal] = useState('')
  const [generationId, setGenerationId] = useState<number | null>(null)
  const [startedAt, setStartedAt] = useState(0)
  const [editTarget, setEditTarget] = useState<EditTarget>('VIDEO')
  const [editRequest, setEditRequest] = useState('')
  const [modal, setModal] = useState<'cancel' | 'upload' | 'delete' | 'pro' | null>(null)

  const extract = useMutation({ mutationFn: () => extractMenus(storeId, files, mapUrl), onSuccess: (m) => setMenus(m) })
  const generate = useMutation({
    mutationFn: (body: GenerationRequest) => postGeneration(body),
    onSuccess: (g) => {
      setGenerationId(g.generationId)
      setStartedAt(Date.now())
      setStep('generate')
    },
  })

  // 생성 상태 폴링 (명세: COMPLETED·FAILED 될 때까지 3초 간격)
  const generation = useQuery({
    queryKey: ['generation', generationId],
    queryFn: () => fetchGeneration(generationId!),
    enabled: generationId !== null,
    refetchInterval: (q) => (q.state.data && ['COMPLETED', 'FAILED'].includes(q.state.data.status) ? false : 3000),
  })
  const shortformId = generation.data?.status === 'COMPLETED' ? generation.data.shortformId : null
  const detail = useQuery({
    queryKey: ['shortform-detail', shortformId],
    queryFn: () => fetchShortformDetail(shortformId!),
    enabled: shortformId !== null,
  })
  const publish = useMutation({
    mutationFn: () => publishShortform(shortformId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shortforms'] })
      setModal(null)
      setStep('done')
    },
  })
  const remove = useMutation({ mutationFn: () => deleteShortform(shortformId!), onSuccess: () => navigate('/owner', { replace: true }) })

  const close = () => {
    const dirty = step !== 'source' || mapUrl || files.length > 0 || photos.length > 0
    if (step === 'done' || !dirty || window.confirm('게시물 만들기를 그만둘까요?\n입력한 내용은 저장되지 않아요.')) navigate('/owner', { replace: true })
  }

  const goMenus = () => {
    setStep('menus')
    if (menus.length === 0) extract.mutate()
  }
  const startGenerate = () =>
    generate.mutate({
      storeId,
      mapUrl: mapUrl.trim() || undefined,
      menus: menus.filter((m) => m.name.trim()),
      appeal: appeal.trim() || undefined,
      // 게시물 사진: AI 사진 뒤에 음식·가게 사진 먼저, 그다음 메뉴판 (합쳐 4장까지)
      photos: [...photos, ...files].slice(0, MAX_POST_PHOTOS),
    })
  const startRevision = () =>
    shortformId &&
    generate.mutate({ storeId, appeal: appeal.trim() || undefined, photoUrls: detail.data?.imageUrls?.slice(1), revision: { shortformId, target: editTarget, request: editRequest.trim() } })

  const inputStep = step === 'source' ? 1 : step === 'menus' ? 2 : step === 'appeal' ? 3 : 0

  return (
    <div className="mx-auto flex h-full max-w-[430px] flex-col bg-white">
      <header className="flex h-[68px] shrink-0 items-center justify-between px-[18px] pt-[env(safe-area-inset-top)]">
        <button
          type="button"
          aria-label="닫기"
          onClick={close}
          className="flex size-[44px] items-center justify-center rounded-full border border-mint-line bg-white text-green-6 shadow-[0_4px_14px_rgba(8,104,22,0.14)]"
        >
          <CloseIcon />
        </button>
        {inputStep > 0 && (
          <ol className="flex items-center gap-1.5" aria-label={`${inputStep} / 3 단계`}>
            {[1, 2, 3].map((n) => (
              <li key={n} className={`h-2 rounded-full transition-all ${n === inputStep ? 'w-6 bg-green-4' : n < inputStep ? 'w-2 bg-green-4' : 'w-2 bg-green-1'}`} />
            ))}
          </ol>
        )}
        <span className="size-[44px]" />
      </header>

      {step === 'source' && (
        <StepSource
          mapUrl={mapUrl}
          setMapUrl={setMapUrl}
          files={files}
          setFiles={setFiles}
          photos={photos}
          setPhotos={setPhotos}
          onPrev={close}
          onNext={goMenus}
        />
      )}

      {step === 'menus' && (
        <Screen
          hero={<Hero sub={'내 메뉴가 맞는지 확인해요\n아니라면 수정할 수 있어요'} />}
          prev={{ onClick: () => setStep('source') }}
          next={{ onClick: () => setStep('appeal'), disabled: extract.isPending }}
        >
          {extract.isPending ? (
            <div className="flex flex-col items-center py-6 text-center">
              <img src={working2} alt="" className="size-40 rounded-3xl object-cover" />
              <p className="mt-3 animate-pulse text-sm font-bold text-green-4">메뉴판을 읽고 있어요...</p>
            </div>
          ) : (
            <StepMenus storeName={store?.name ?? ''} address={store?.address ?? ''} menus={menus} setMenus={setMenus} />
          )}
        </Screen>
      )}

      {step === 'appeal' && (
        <Screen
          hero={<Hero sub={'손님에게 자랑하고 싶은 점을 적어 주세요\nAI가 게시물 글로 다듬어 드려요'} />}
          prev={{ onClick: () => setStep('menus') }}
          next={{ label: generate.isPending ? '요청 중...' : '생성', onClick: startGenerate, disabled: generate.isPending || !appeal.trim() }}
        >
          <textarea
            value={appeal}
            onChange={(e) => setAppeal(e.target.value)}
            maxLength={200}
            rows={5}
            placeholder="예) 가게가 넓고 고기가 맛있어요"
            className="w-full resize-none border-b-2 border-green-4 py-2 text-[15px] leading-relaxed text-ink outline-none placeholder:text-gray-2"
          />
          <p className="mt-1 text-right text-xs text-gray-2">{appeal.length} / 200</p>
          <p className="mt-4 rounded-xl bg-q-panel px-4 py-3 text-xs leading-relaxed break-keep text-q-muted">
            적어 주신 내용을 바탕으로 손님 피드에 보일 소개 글을 만들어요. 없는 내용은 지어내지 않아요.
          </p>
          {generate.isError && <ErrorText>{errorMessage(generate.error)}</ErrorText>}
        </Screen>
      )}

      {step === 'generate' && generation.data?.status !== 'COMPLETED' && (
        <StepWaiting
          startedAt={startedAt}
          failed={generation.data?.status === 'FAILED' ? (generation.data.errorMessage ?? '게시물을 만들지 못했어요') : null}
          onCancel={() => setModal('cancel')}
          onRetry={() => setStep('appeal')}
        />
      )}

      {step === 'generate' && generation.data?.status === 'COMPLETED' && (
        <Screen
          prev={{ label: '수정', onClick: () => (isPro ? setStep('editPick') : setModal('pro')) }}
          next={{ label: '업로드', onClick: () => setModal('upload'), disabled: !detail.data }}
        >
          <div className="relative mx-auto mt-2 aspect-[4/5] w-full max-w-[300px] overflow-hidden rounded-3xl bg-green-1 shadow-[0_10px_30px_rgba(8,104,22,0.18)]">
            {detail.data ? (
              <PostCarousel images={detail.data.imageUrls ?? (detail.data.imageUrl ? [detail.data.imageUrl] : [])} alt={detail.data.title} frame={detail.data.frame} />
            ) : (
              <p className="flex h-full items-center justify-center text-sm text-q-muted">게시물을 불러오는 중...</p>
            )}
          </div>
          {detail.data && (
            <div className="mx-auto mt-4 max-w-[300px]">
              <p className="text-[16px] font-bold text-ink">{detail.data.title}</p>
              {detail.data.caption && <p className="mt-1 text-[14px] leading-relaxed text-q-sub">{detail.data.caption}</p>}
            </div>
          )}
        </Screen>
      )}

      {step === 'editPick' && (
        <Screen hero={<Hero sub="어떤 것을 수정하고 싶으신가요?" plain />} prev={{ onClick: () => setStep('generate') }}>
          <div className="mt-6 flex flex-col gap-3">
            {EDIT_TARGETS.map(([target, label]) => (
              <button
                key={target}
                type="button"
                onClick={() => {
                  setEditTarget(target)
                  setEditRequest('')
                  setStep('editInput')
                }}
                className="h-12 rounded-xl bg-green-4 text-[15px] font-bold text-white active:scale-[0.98]"
              >
                {label}
              </button>
            ))}
            <button type="button" onClick={() => setModal('delete')} className="h-12 rounded-xl bg-[#475569] text-[15px] font-bold text-white active:scale-[0.98]">
              삭제
            </button>
          </div>
        </Screen>
      )}

      {step === 'editInput' && (
        <Screen
          hero={<Hero sub="어떻게 수정하고 싶으신가요?" plain />}
          prev={{ onClick: () => setStep('editPick') }}
          next={{ label: generate.isPending ? '요청 중...' : '확인', onClick: startRevision, disabled: !editRequest.trim() || generate.isPending }}
        >
          <p className="mb-2 text-xs font-bold text-q-muted">{editTarget === 'VIDEO' ? '사진' : '글·문구'} 수정</p>
          <textarea
            value={editRequest}
            onChange={(e) => setEditRequest(e.target.value)}
            rows={4}
            maxLength={200}
            autoFocus
            placeholder={editPlaceholder(editTarget)}
            className="w-full resize-none border-b-2 border-green-4 py-2 text-[15px] leading-relaxed text-ink outline-none placeholder:text-gray-2"
          />
          {generate.isError && <ErrorText>{errorMessage(generate.error)}</ErrorText>}
        </Screen>
      )}

      {step === 'done' && (
        <div className="flex flex-1 flex-col items-center px-6 pb-[max(20px,env(safe-area-inset-bottom))]">
          <p className="mt-10 text-[22px] font-bold text-green-4">업로드 성공!</p>
          <p className="mt-1 text-sm text-q-muted">이제 동네 손님들 피드에 내 가게 게시물이 보여요</p>
          <img src={pigeonUploaded} alt="" className="mt-8 h-[220px] w-auto animate-[rise-center_.5s_ease-out] object-contain" />
          <button
            type="button"
            onClick={() => navigate('/owner/videos', { replace: true })}
            className="mt-auto h-[52px] w-full rounded-xl bg-green-4 text-base font-bold text-white"
          >
            내 게시물로 가기
          </button>
        </div>
      )}

      {modal === 'cancel' && (
        <Dialog
          title="정말 취소하실건가요?"
          image={pigeonCrying}
          primary={{ label: '계속 기다릴래요', onClick: () => setModal(null) }}
          secondary={{
            label: '네 취소할래요',
            onClick: () => {
              if (generationId) cancelGeneration(generationId)
              setGenerationId(null)
              setModal(null)
              setStep('appeal')
            },
          }}
        />
      )}
      {modal === 'upload' && (
        <Dialog
          title="정말 업로드하실건가요?"
          image={pigeonUpload}
          primary={{ label: publish.isPending ? '올리는 중...' : '네 홍보할래요', onClick: () => publish.mutate() }}
          secondary={{
            label: '더 수정할래요',
            onClick: () => {
              if (!isPro) return setModal('pro')
              setModal(null)
              setStep('editPick')
            },
          }}
        />
      )}
      {modal === 'delete' && (
        <Dialog
          title="이 게시물을 삭제할까요?"
          image={pigeonCrying}
          primary={{ label: '아니요', onClick: () => setModal(null) }}
          secondary={{ label: remove.isPending ? '삭제 중...' : '네 삭제할래요', onClick: () => remove.mutate() }}
        />
      )}
      {modal === 'pro' && (
        <Dialog
          title="게시물 수정은 PRO 기능이에요"
          text="PRO를 구독하면 사진·문구를 원하는 대로 다시 만들 수 있어요"
          image={pigeonUpload}
          primary={{ label: 'PRO 알아보기', onClick: () => navigate('/owner/pro') }}
          secondary={{ label: '닫기', onClick: () => setModal(null) }}
        />
      )}
    </div>
  )
}

/* ── 1단계: 지도 링크 + 메뉴판 사진 (Figma 9:220·303·333) ── */
function StepSource({
  mapUrl,
  setMapUrl,
  files,
  setFiles,
  photos,
  setPhotos,
  onPrev,
  onNext,
}: {
  mapUrl: string
  setMapUrl: (v: string) => void
  files: File[]
  setFiles: (f: File[]) => void
  photos: File[]
  setPhotos: (f: File[]) => void
  onPrev: () => void
  onNext: () => void
}) {
  const urlInvalid = mapUrl.trim() !== '' && !isMapUrl(mapUrl)
  const ready = (mapUrl.trim() !== '' && !urlInvalid) || files.length > 0

  return (
    <Screen
      hero={<Hero sub={'지도 링크나 메뉴판만 올리면\n홍보 게시물이 완성돼요!'} />}
      prev={{ onClick: onPrev }}
      next={{ onClick: onNext, disabled: !ready }}
    >
      <label className="block">
        <span className="text-[13px] font-bold text-ink">지도 링크</span>
        <input
          value={mapUrl}
          onChange={(e) => setMapUrl(e.target.value)}
          inputMode="url"
          placeholder="네이버지도·카카오맵 URL을 붙여넣어주세요"
          className={`mt-1 h-11 w-full border-b-2 text-[15px] text-ink outline-none placeholder:text-gray-2 ${urlInvalid ? 'border-point-red' : 'border-green-4'}`}
        />
      </label>
      {urlInvalid ? (
        <ErrorText>네이버 지도나 카카오맵에서 공유한 링크를 붙여넣어 주세요</ErrorText>
      ) : (
        <p className="mt-1.5 text-xs text-gray-2">네이버 지도, 카카오맵 어느 쪽 링크든 괜찮아요</p>
      )}

      <PhotoPicker label="메뉴판 사진" files={files} setFiles={setFiles} className="mt-7" />
      <PhotoPicker label="음식·가게 사진 (선택)" files={photos} setFiles={setPhotos} className="mt-6" />
      <p className="mt-2 text-xs leading-relaxed break-keep text-gray-2">
        게시물에는 AI가 만든 사진 1장 뒤에 올린 사진이 {MAX_POST_PHOTOS}장까지 붙어 옆으로 넘겨 볼 수 있어요 (음식·가게 사진 먼저)
      </p>
      <p className="mt-6 rounded-xl bg-q-panel px-4 py-3 text-xs leading-relaxed break-keep text-q-muted">
        지도 링크나 메뉴판 사진 중 하나만 있어도 돼요. 둘 다 올리면 메뉴를 더 정확하게 읽어요.
      </p>
    </Screen>
  )
}

/** 사진 여러 장 고르기 (메뉴판 / 음식·가게 사진 공용) */
function PhotoPicker({ label, files, setFiles, className = '' }: { label: string; files: File[]; setFiles: (f: File[]) => void; className?: string }) {
  const fileRef = useRef<HTMLInputElement>(null)
  return (
    <div className={className}>
      <span className="text-[13px] font-bold text-ink">{label}</span>
      <div className="mt-1 flex items-center gap-2 border-b-2 border-green-4 pb-1.5">
        <span className="flex-1 truncate text-[15px] text-gray-2">{files.length ? `${files.length}장 선택됨` : '사진을 선택해주세요'}</span>
        <button type="button" onClick={() => fileRef.current?.click()} className="h-10 rounded-lg bg-green-4 px-5 text-sm font-bold text-white">
          추가
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => {
            setFiles([...files, ...Array.from(e.target.files ?? [])])
            e.target.value = ''
          }}
        />
      </div>
      <ul className="mt-2 flex flex-col gap-1.5">
        {files.map((f, i) => (
          <li key={`${f.name}-${i}`} className="flex h-11 items-center overflow-hidden rounded-lg bg-q-panel">
            <span className="flex-1 truncate px-3 text-sm text-ink">{f.name}</span>
            <button
              type="button"
              aria-label={`${f.name} 빼기`}
              onClick={() => setFiles(files.filter((_, j) => j !== i))}
              className="flex h-full w-11 items-center justify-center bg-green-1 text-xl text-white"
            >
              −
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ── 2단계: 가게 정보·메뉴 확인 (Figma 9:645·697·1014) ── */
function StepMenus({
  storeName,
  address,
  menus,
  setMenus,
}: {
  storeName: string
  address: string
  menus: MenuItem[]
  setMenus: (m: MenuItem[]) => void
}) {
  const update = (i: number, patch: Partial<MenuItem>) => setMenus(menus.map((m, j) => (j === i ? { ...m, ...patch } : m)))
  return (
    <>
      <p className="text-xs font-bold text-q-muted">가게 정보</p>
      <dl className="mt-2">
        {[['가게명', storeName], ['주소', address]].map(([k, v]) => (
          <div key={k} className="flex h-12 items-center gap-4 border-b-2 border-green-4">
            <dt className="w-12 shrink-0 text-[15px] text-green-4">{k}</dt>
            <dd className="truncate text-[15px] text-ink">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-6 text-xs font-bold text-q-muted">메뉴</p>
      <ul className="mt-2 flex flex-col items-center gap-2">
        {menus.map((m, i) => (
          <li key={i} className="flex w-full flex-col items-center gap-2">
            <div className="flex h-11 w-full items-center gap-2 rounded-lg bg-q-panel px-3">
              <input
                value={m.name}
                onChange={(e) => update(i, { name: e.target.value })}
                placeholder="메뉴 입력"
                aria-label="메뉴 이름"
                className="min-w-0 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-gray-2"
              />
              <input
                value={m.price === null ? '' : m.price.toLocaleString()}
                onChange={(e) => {
                  const n = e.target.value.replace(/[^0-9]/g, '')
                  update(i, { price: n ? Number(n) : null })
                }}
                inputMode="numeric"
                aria-label="가격"
                placeholder="가격"
                className="w-20 bg-transparent text-right text-[15px] text-green-4 outline-none placeholder:text-gray-2"
              />
              <span className="text-[15px] text-green-4">원</span>
            </div>
            <button
              type="button"
              aria-label={`${m.name || '메뉴'} 지우기`}
              onClick={() => setMenus(menus.filter((_, j) => j !== i))}
              className="flex h-6 w-6 items-center justify-center rounded bg-green-1 text-white"
            >
              −
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        aria-label="메뉴 추가"
        onClick={() => setMenus([...menus, { name: '', price: null }])}
        className="mx-auto mt-3 flex size-10 items-center justify-center rounded-lg bg-green-4 text-2xl text-white"
      >
        +
      </button>
    </>
  )
}

