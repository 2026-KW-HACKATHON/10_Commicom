import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import pigeonCrying from '@/assets/generation/pigeon-crying.jpg'
import pigeonUpload from '@/assets/generation/pigeon-upload.jpg'
import { FramedVideo } from '@/features/feed/components/FramedVideo'
import { useDeleteShortform, useStoreShortforms } from '@/features/feed/hooks'
import type { Shortform } from '@/features/feed/schema'
import { Dialog } from '@/features/generation/components/Dialog'
import { useIsPro } from '@/features/pro/hooks'
import { errorMessage } from '@/shared/lib/error'
import { toast } from '@/stores/toastStore'
import { CloseIcon, PlayIcon, PlusIcon } from '@/shared/ui/icons'
import { useMyStoreId } from '../hooks'
import { OWNER_ILLUST } from '../illustrations'
import { OwnerScreen } from './OwnerUi'

/** 사장님 내 영상 — 우리 가게가 올린 숏폼 목록, 눌러서 보기·다운로드(PRO)·삭제 */
export function OwnerVideos() {
  const navigate = useNavigate()
  const storeId = useMyStoreId()
  const { data: videos, isLoading, isError } = useStoreShortforms(storeId)
  const [openId, setOpenId] = useState<number | null>(null)
  const open = videos?.find((v) => v.shortformId === openId) ?? null

  return (
    <OwnerScreen>
      {/* 제작 탭의 주 동작 (예전엔 우상단 + 로만 만들 수 있었음) */}
      <button
        type="button"
        onClick={() => navigate('/create')}
        className="flex w-full items-center gap-3 overflow-hidden rounded-2xl bg-q-green py-2 pr-4 pl-3 text-left text-white active:scale-[0.99]"
      >
        <img src={OWNER_ILLUST.videoEdit} alt="" className="-my-1 h-[84px] w-auto object-contain drop-shadow" />
        <span className="flex-1">
          <span className="block text-[17px] font-bold">새 피드 만들기</span>
          <span className="block text-xs leading-relaxed break-keep opacity-85">
            사진·메뉴판만 있으면
            <br />
            AI가 홍보 피드를 만들어요
          </span>
        </span>
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/20">
          <span className="scale-[0.7]">
            <PlusIcon />
          </span>
        </span>
      </button>

      <div className="mt-5">
        <p className="text-[13px] text-q-muted">손님 피드에 공개 중</p>
        <h2 className="text-[20px] font-bold text-q-text">
          우리 가게 피드 <span className="text-q-green">{videos?.length ?? 0}</span>개
        </h2>
      </div>

      {isLoading && (
        <div className="mt-4 grid grid-cols-2 gap-3">
          {[0, 1].map((i) => (
            <div key={i} className="aspect-[9/14] animate-pulse rounded-2xl bg-white" />
          ))}
        </div>
      )}
      {isError && <p className="py-10 text-center text-sm text-q-muted">영상을 불러오지 못했어요</p>}

      {videos && videos.length === 0 && (
        <div className="mt-6 flex flex-col items-center rounded-2xl bg-white px-6 py-8 text-center">
          <img src={OWNER_ILLUST.videoEdit} alt="" className="h-[120px] w-auto object-contain" />
          <p className="mt-3 text-[16px] font-bold text-q-text">아직 올린 영상이 없어요</p>
          <p className="mt-1 text-[13px] leading-relaxed text-q-muted">지도 링크나 메뉴판만 있으면 홍보 영상을 만들어 드려요</p>
          <button
            type="button"
            onClick={() => navigate('/create')}
            className="mt-5 h-11 w-full rounded-xl bg-green-4 text-[15px] font-bold text-white"
          >
            첫 영상 만들기
          </button>
        </div>
      )}

      {videos && videos.length > 0 && (
        <ul className="mt-4 grid grid-cols-2 gap-x-3 gap-y-4">
          {videos.map((v, i) => (
            <li key={v.shortformId}>
              <button type="button" onClick={() => setOpenId(v.shortformId)} className="block w-full text-left active:scale-[0.98]">
                <span className="relative block aspect-[9/14] overflow-hidden rounded-2xl bg-q-mint">
                  <Poster video={v} />
                  {i === 0 && (
                    <span className="absolute top-2 left-2 rounded-full bg-point-orange px-2 py-0.5 text-[10px] font-bold text-white">NEW</span>
                  )}
                  <span className="absolute top-2 right-2 flex size-7 items-center justify-center rounded-full bg-black/35 pl-0.5 text-white backdrop-blur-sm">
                    <span className="scale-[0.4]">
                      <PlayIcon />
                    </span>
                  </span>
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2.5 pt-6 pb-2 text-[11px] font-medium text-white/90">
                    {formatDate(v.createdAt)}
                    {v.updatedAt && <span className="ml-1 rounded bg-white/25 px-1 text-[10px]">수정됨</span>}
                  </span>
                </span>
                <span className="mt-1.5 line-clamp-2 block text-[13px] leading-snug font-bold text-q-text">{v.description || v.storeName}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {open && <VideoDetail video={open} onClose={() => setOpenId(null)} />}
    </OwnerScreen>
  )
}

/** 영상 크게 보기 + 손님 화면에서 보기 / 다운로드(PRO) / 삭제 */
function VideoDetail({ video, onClose }: { video: Shortform; onClose: () => void }) {
  const navigate = useNavigate()
  const isPro = useIsPro()
  const remove = useDeleteShortform()
  const [modal, setModal] = useState<'delete' | 'pro-edit' | 'pro-download' | null>(null)

  return (
    <div role="dialog" aria-modal aria-label="영상 보기" className="fixed inset-0 z-40 flex items-end justify-center bg-black/50">
      <div className="max-h-full w-full max-w-[430px] animate-[rise_.3s_ease-out] overflow-y-auto rounded-t-3xl bg-white px-5 pt-4 pb-[max(20px,env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-between">
          <p className="text-[13px] text-q-muted">
            {formatDate(video.createdAt)} 업로드
            {video.updatedAt && <span className="text-q-green"> · {formatDate(video.updatedAt)} 수정</span>}
          </p>
          <button type="button" aria-label="닫기" onClick={onClose} className="flex size-9 items-center justify-center rounded-full bg-q-panel text-q-text">
            <span className="scale-[0.8]">
              <CloseIcon />
            </span>
          </button>
        </div>

        <div className="relative mx-auto mt-2 aspect-[9/16] w-full max-w-[240px] overflow-hidden rounded-3xl shadow-[0_10px_30px_rgba(8,104,22,0.18)]">
          <FramedVideo videoUrl={video.videoUrl} posterUrl={video.posterUrl} frame={video.frame} />
        </div>

        <p className="mt-4 text-[16px] font-bold text-q-text">{video.description || video.storeName}</p>
        {video.menus.length > 0 && <p className="mt-1 line-clamp-2 text-[13px] text-q-muted">{video.menus.join(' · ')}</p>}

        <div className="mt-5 grid grid-cols-4 gap-2">
          <Action label="손님 화면" onClick={() => navigate(`/map/stores/${video.storeId}/shortform?start=${video.shortformId}`)}>
            <span className="scale-[0.55] pl-0.5 text-q-green">
              <PlayIcon />
            </span>
          </Action>
          {/* PRO 기능: 재수정 · 다운로드 (PRO가 아니면 안내) */}
          <Action label="수정" pro={!isPro} onClick={() => (isPro ? navigate(`/owner/videos/${video.shortformId}/edit`) : setModal('pro-edit'))}>
            <img src={OWNER_ILLUST.videoEdit} alt="" className="size-9 object-contain" />
          </Action>
          {isPro ? (
            <a
              href={video.videoUrl}
              download={`${video.storeName}-숏폼.mp4`}
              className="flex flex-col items-center gap-1 rounded-xl bg-q-panel py-3 text-[12px] font-bold text-q-text active:bg-q-mint"
            >
              <img src={OWNER_ILLUST.videoDownload} alt="" className="size-9 object-contain" />
              다운로드
            </a>
          ) : (
            <Action label="다운로드" pro onClick={() => setModal('pro-download')}>
              <img src={OWNER_ILLUST.videoDownload} alt="" className="size-9 object-contain" />
            </Action>
          )}
          <Action label="삭제" danger onClick={() => setModal('delete')}>
            <TrashIcon />
          </Action>
        </div>
      </div>

      {modal === 'delete' && (
        <Dialog
          title="이 영상을 삭제할까요?"
          text="손님 숏폼 피드에서도 사라져요"
          image={pigeonCrying}
          primary={{ label: '아니요', onClick: () => setModal(null) }}
          secondary={{
            label: remove.isPending ? '삭제 중...' : '네 삭제할래요',
            onClick: () =>
              remove.mutate(video.shortformId, {
                onSuccess: () => {
                  onClose()
                  toast('영상을 삭제했어요')
                },
                onError: (e) => toast(errorMessage(e), 'error'),
              }),
          }}
        />
      )}
      {(modal === 'pro-download' || modal === 'pro-edit') && (
        <Dialog
          title={modal === 'pro-edit' ? '영상 수정은 PRO 기능이에요' : '다운로드는 PRO 기능이에요'}
          text={
            modal === 'pro-edit'
              ? 'PRO를 구독하면 올린 영상도 대본·자막·영상을 원하는 대로 고쳐 새 버전으로 바꿀 수 있어요'
              : 'PRO를 구독하면 완성된 영상을 원본 화질로 내려받아 다른 SNS에도 올릴 수 있어요'
          }
          image={pigeonUpload}
          primary={{ label: 'PRO 알아보기', onClick: () => navigate('/owner/pro') }}
          secondary={{ label: '닫기', onClick: () => setModal(null) }}
        />
      )}
    </div>
  )
}

function Action({
  label,
  onClick,
  danger = false,
  pro = false,
  children,
}: {
  label: string
  onClick: () => void
  danger?: boolean
  /** PRO 전용인데 아직 구독 안 함 → 오른쪽 위 PRO 표시 */
  pro?: boolean
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex flex-col items-center gap-1 rounded-xl bg-q-panel py-3 text-[12px] font-bold active:bg-q-mint ${danger ? 'text-point-red-dark' : 'text-q-text'}`}
    >
      {pro && <span className="absolute top-1 right-1 rounded-full bg-green-6 px-1.5 text-[9px] leading-4 font-bold text-white">PRO</span>}
      <span className="flex size-9 items-center justify-center">{children}</span>
      {label}
    </button>
  )
}

/** 썸네일: 샘플 영상은 위아래 검은 띠가 있어 그림 구간만 보이게 확대 (스크랩 목록과 같은 방식) */
function Poster({ video }: { video: Shortform }) {
  if (!video.posterUrl) return null
  const f = video.frame
  return (
    <img
      src={video.posterUrl}
      alt=""
      className="absolute left-1/2 max-w-none -translate-x-1/2"
      style={f ? { height: `${100 / f.height}%`, top: `${(-100 * f.top) / f.height}%` } : { height: '100%', top: 0 }}
    />
  )
}

function TrashIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 7h16M10 11v6M14 11v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
    </svg>
  )
}

function formatDate(iso?: string) {
  if (!iso) return ''
  const [y, m, d] = iso.slice(0, 10).split('-')
  return `${y}.${m}.${d}`
}
