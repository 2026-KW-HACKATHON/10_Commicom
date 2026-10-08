import { useQueryClient } from '@tanstack/react-query'
import { useRef, useState } from 'react'
import { Field, FieldButton, FieldInput } from '@/features/auth/components/AuthUi'
import { NICKNAME_MAX } from '@/features/auth/schema'
import { Hero, Screen } from '@/features/generation/components/FlowUi'
import { STORE_CATEGORIES } from '@/features/map/schema'
import { errorMessage } from '@/shared/lib/error'
import { squareThumbnail } from '@/shared/lib/image'
import { AddressSearch } from '@/shared/ui/AddressSearch'
import { useMe } from '@/stores/authStore'
import { toast } from '@/stores/toastStore'
import { registerMyStore } from '../api'
import { useMyStoreId } from '../hooks'

/**
 * 가게를 아직 등록하지 않은 사장님 계정 (가입 중 가게 등록이 실패한 경우 등) — 사장님 화면 들어가기 전에 등록.
 * 가게명은 사장님 닉네임과 같게 시작 (사장님은 상호 = 닉네임)
 */
export function OwnerStoreRegister() {
  const queryClient = useQueryClient()
  const me = useMe()
  const storeId = useMyStoreId()
  const fileRef = useRef<HTMLInputElement>(null)
  const [image, setImage] = useState<{ file: File; preview: string } | null>(null)
  const [name, setName] = useState(me?.nickname ?? '')
  const [road, setRoad] = useState('')
  const [detail, setDetail] = useState('')
  const [category, setCategory] = useState('')
  const [searching, setSearching] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const ready = name.trim() !== '' && road.trim() !== '' && category !== ''

  const submit = async () => {
    setSubmitting(true)
    setError(null)
    try {
      await registerMyStore(storeId, { name: name.trim(), roadAddress: road.trim(), addressDetail: detail.trim(), category }, image?.file)
      await queryClient.invalidateQueries({ queryKey: ['myStore'] })
      queryClient.invalidateQueries({ queryKey: ['stores'] })
      toast('가게를 등록했어요')
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto flex h-full max-w-[430px] flex-col bg-white pt-[env(safe-area-inset-top)]">
      <Screen
        hero={<Hero sub={'아직 등록한 가게가 없어요\n가게 정보를 알려 주세요'} plain />}
        next={{ label: submitting ? '등록 중...' : '가게 등록하기', onClick: submit, disabled: !ready || submitting }}
      >
        <Field label="가게명">
          <FieldInput value={name} onChange={(e) => setName(e.target.value)} placeholder="ex. 잇다가게 월계점" maxLength={NICKNAME_MAX} />
        </Field>

        <Field label="프로필 사진 (선택)" action={<FieldButton onClick={() => fileRef.current?.click()}>찾기</FieldButton>}>
          {image && <img src={image.preview} alt="" className="size-9 rounded-lg object-cover" />}
          <span className={`min-w-0 flex-1 truncate px-1 text-[15px] ${image ? 'text-ink' : 'text-gray-2'}`}>{image?.file.name ?? '사진을 선택해주세요'}</span>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={async (e) => {
              const file = e.target.files?.[0]
              if (file) setImage({ file, preview: await squareThumbnail(file) })
            }}
          />
        </Field>

        <Field label="가게 주소" action={<FieldButton onClick={() => setSearching(true)}>찾기</FieldButton>}>
          <FieldInput value={road} onChange={(e) => setRoad(e.target.value)} placeholder="주소를 입력해주세요" />
        </Field>
        {road.trim() && (
          <div className="mt-1 border-b-2 border-green-4 pb-1.5">
            <FieldInput value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="상세주소" className="w-full" />
          </div>
        )}

        <Field label="업종">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            aria-label="업종"
            style={{ colorScheme: 'light' }}
            className={`h-10 min-w-0 flex-1 bg-transparent px-1 text-[15px] outline-none ${category ? 'text-ink' : 'text-gray-2'}`}
          >
            <option value="" className="bg-white text-gray-2">
              대분류
            </option>
            {STORE_CATEGORIES.map((c) => (
              <option key={c.code} value={c.code} className="bg-white text-ink">
                {c.name}
              </option>
            ))}
          </select>
        </Field>

        {error && (
          <p role="alert" className="mt-4 text-center text-[13px] font-medium text-point-red-dark">
            {error}
          </p>
        )}
      </Screen>

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
