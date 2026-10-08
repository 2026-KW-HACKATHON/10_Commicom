import { useQueryClient } from '@tanstack/react-query'
import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import pigeonCrying from '@/assets/generation/pigeon-crying.jpg'
import { useWithdraw } from '@/features/auth/hooks'
import { useStoreShortforms } from '@/features/feed/hooks'
import type { Shortform } from '@/features/feed/schema'
import { Dialog } from '@/features/generation/components/Dialog'
import { errorMessage } from '@/shared/lib/error'
import { squareThumbnail } from '@/shared/lib/image'
import { AddressSearch } from '@/shared/ui/AddressSearch'
import { PlayIcon } from '@/shared/ui/icons'
import { StoreAvatar } from '@/shared/ui/StoreAvatar'
import { updateNickname } from '@/features/auth/api'
import { useAuthStore, useMe } from '@/stores/authStore'
import { toast } from '@/stores/toastStore'
import { storeEditOf, updateMyStore } from '../api'
import { useMyStore, useMyStoreId } from '../hooks'

/** 사장님 프로필 (Figma 11:1746·11:1889) — 가게 정보(사진·가게명·주소) 편집 + 내 영상 */
export function OwnerProfile() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const storeId = useMyStoreId()
  const store = useMyStore()
  const me = useMe()
  const setMember = useAuthStore((s) => s.setMember)
  const { data: videos } = useStoreShortforms(storeId)
  const withdraw = useWithdraw()
  const fileRef = useRef<HTMLInputElement>(null)
  const [editing, setEditing] = useState<'name' | 'address' | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmWithdraw, setConfirmWithdraw] = useState(false)

  const save = async (patch: Parameters<typeof updateMyStore>[1], image?: File) => {
    setSaving(true)
    setError(null)
    try {
      await updateMyStore(storeId, patch, image)
      // 사장님은 상호가 곧 닉네임 (Figma 로그인 "닉네임/상호") → 가게명을 바꾸면 회원 닉네임도 같이
      if (patch.name && me?.role === 'OWNER') setMember(await updateNickname(patch.name))
      await queryClient.invalidateQueries({ queryKey: ['stores'] })
      queryClient.invalidateQueries({ queryKey: ['shortforms'] })
      setEditing(null)
      toast('저장했어요')
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  const onPickImage = async (file: File | undefined) => {
    if (!file) return
    try {
      await save({ thumbnailUrl: await squareThumbnail(file) }, file)
    } catch (e) {
      setError(errorMessage(e))
    }
  }

  if (!store) return <div className="h-full animate-pulse bg-white" />

  return (
    <div className="h-full overflow-y-auto bg-white pb-10">
      <section className="px-5 pt-6">
        <h2 className="text-[13px] font-bold text-ink">가게 정보</h2>

        <div className="mt-4 flex items-start justify-between border-b-2 border-green-4 pb-3">
          <span className="pt-1 pl-1 text-[15px] text-green-4">프로필 사진</span>
          <button type="button" aria-label="프로필 사진 바꾸기" onClick={() => fileRef.current?.click()} className="relative" disabled={saving}>
            <StoreAvatar url={store.thumbnailUrl} className="size-[92px]" />
            <span className="absolute -right-1.5 -bottom-1.5 flex size-8 items-center justify-center rounded-full border-2 border-white bg-green-4 text-white">
              <PencilIcon />
            </span>
          </button>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => onPickImage(e.target.files?.[0])} />
        </div>

        {editing === 'name' ? (
          <NameEditor initial={store.name} saving={saving} onCancel={() => setEditing(null)} onSave={(name) => save({ name })} />
        ) : (
          <Row label="가게명" value={store.name} onEdit={() => setEditing('name')} />
        )}
        {editing === 'address' ? (
          <AddressEditor storeId={storeId} current={store.address} saving={saving} onCancel={() => setEditing(null)} onSave={save} />
        ) : (
          <Row label="주소" value={store.address} onEdit={() => setEditing('address')} />
        )}
        {error && <p role="alert" className="mt-2 text-[13px] text-point-red-dark">{error}</p>}

        <Link
          to={`/map/stores/${storeId}`}
          className="mt-4 flex h-11 items-center justify-center rounded-xl bg-q-panel text-[14px] font-bold text-green-4"
        >
          손님에게 보이는 우리 가게 보기 ›
        </Link>

        {me && (
          <button type="button" onClick={() => setConfirmWithdraw(true)} className="mx-auto mt-6 block text-[12px] text-gray-2 underline">
            회원탈퇴
          </button>
        )}
      </section>

      <section className="mt-8">
        <div className="flex items-center justify-between px-5">
          <h2 className="text-[13px] font-bold text-ink">내 영상</h2>
          {videos && videos.length > 0 && (
            <Link to="/owner/videos" className="text-xs font-medium text-green-4">
              관리하기 ›
            </Link>
          )}
        </div>
        {videos && videos.length === 0 ? (
          <p className="py-14 text-center text-[14px] text-green-4">업로드한 영상이 없습니다</p>
        ) : (
          <ul className="mt-3 grid grid-cols-3 gap-px bg-white">
            {videos?.map((v) => (
              <li key={v.shortformId}>
                <Link to="/owner/videos" className="relative block aspect-[9/13] overflow-hidden bg-[#dde5e2]">
                  <Thumb video={v} />
                  <span className="absolute top-1.5 right-1.5 flex size-5 items-center justify-center rounded bg-white/90 pl-px text-q-text">
                    <span className="scale-[0.3]">
                      <PlayIcon />
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {confirmWithdraw && (
        <Dialog
          title="정말 탈퇴하실 건가요?"
          text="탈퇴하면 계정 정보가 모두 지워져요"
          image={pigeonCrying}
          primary={{ label: '아니요', onClick: () => setConfirmWithdraw(false) }}
          secondary={{
            label: withdraw.isPending ? '탈퇴 중...' : '네 탈퇴할래요',
            onClick: () => withdraw.mutate(undefined, { onSuccess: () => navigate('/owner', { replace: true }) }),
          }}
        />
      )}
    </div>
  )
}

function Row({ label, value, onEdit }: { label: string; value: string; onEdit: () => void }) {
  return (
    <button type="button" onClick={onEdit} className="flex w-full items-center gap-4 border-b-2 border-green-4 px-1 py-3.5 text-left">
      <span className="w-14 shrink-0 text-[15px] text-green-4">{label}</span>
      <span className="min-w-0 flex-1 truncate text-[15px] text-ink">{value}</span>
      <span aria-hidden className="text-green-4">
        <PencilIcon />
      </span>
      <span className="sr-only">{label} 수정</span>
    </button>
  )
}

function NameEditor({ initial, saving, onSave, onCancel }: { initial: string; saving: boolean; onSave: (v: string) => void; onCancel: () => void }) {
  const [name, setName] = useState(initial)
  const ok = name.trim().length > 0 && name.trim() !== initial
  return (
    <div className="border-b-2 border-green-4 px-1 py-2.5">
      <div className="flex items-center gap-4">
        <span className="w-14 shrink-0 text-[15px] text-green-4">가게명</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={30}
          autoFocus
          placeholder="ex. 잇다가게 월계점"
          className="h-9 min-w-0 flex-1 rounded-lg bg-q-panel px-3 text-[15px] text-ink outline-none"
        />
      </div>
      <EditButtons saving={saving} disabled={!ok} onSave={() => onSave(name.trim())} onCancel={onCancel} />
    </div>
  )
}

function AddressEditor({
  storeId,
  current,
  saving,
  onSave,
  onCancel,
}: {
  storeId: number
  current: string
  saving: boolean
  onSave: (patch: { roadAddress: string; addressDetail: string }) => void
  onCancel: () => void
}) {
  const [initial] = useState(() => storeEditOf(storeId))
  const [road, setRoad] = useState(initial.roadAddress ?? current)
  const [detail, setDetail] = useState(initial.addressDetail ?? '')
  const [searching, setSearching] = useState(false)
  return (
    <div className="border-b-2 border-green-4 px-1 py-2.5">
      <div className="flex items-center gap-4">
        <span className="w-14 shrink-0 text-[15px] text-green-4">주소</span>
        <input
          value={road}
          onChange={(e) => setRoad(e.target.value)}
          placeholder="주소를 입력해주세요"
          className="h-9 min-w-0 flex-1 rounded-lg bg-q-panel px-3 text-[15px] text-ink outline-none"
        />
        <button type="button" onClick={() => setSearching(true)} className="h-9 shrink-0 rounded-lg bg-green-4 px-3 text-[13px] font-bold text-white">
          찾기
        </button>
      </div>
      <input
        value={detail}
        onChange={(e) => setDetail(e.target.value)}
        placeholder="상세주소 (선택)"
        className="mt-2 ml-[72px] h-9 w-[calc(100%-72px)] rounded-lg bg-q-panel px-3 text-[15px] text-ink outline-none"
      />
      <EditButtons saving={saving} disabled={!road.trim()} onSave={() => onSave({ roadAddress: road.trim(), addressDetail: detail.trim() })} onCancel={onCancel} />
      {searching && (
        <AddressSearch
          onClose={() => setSearching(false)}
          onSelect={(a) => {
            setRoad(a)
            setSearching(false)
          }}
        />
      )}
    </div>
  )
}

function EditButtons({ saving, disabled, onSave, onCancel }: { saving: boolean; disabled: boolean; onSave: () => void; onCancel: () => void }) {
  return (
    <div className="mt-2.5 flex justify-end gap-2">
      <button type="button" onClick={onCancel} className="h-9 rounded-lg bg-q-panel px-4 text-[13px] font-bold text-green-4">
        취소
      </button>
      <button type="button" onClick={onSave} disabled={disabled || saving} className="h-9 rounded-lg bg-green-4 px-4 text-[13px] font-bold text-white disabled:bg-green-1">
        {saving ? '저장 중...' : '저장'}
      </button>
    </div>
  )
}

function Thumb({ video }: { video: Shortform }) {
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

function PencilIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 20h4L19 9l-4-4L4 16v4ZM13.5 6.5l4 4" />
    </svg>
  )
}
