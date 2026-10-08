import { useQueryClient } from '@tanstack/react-query'
import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Hero, Screen } from '@/features/generation/components/FlowUi'
import { STORE_CATEGORIES } from '@/features/map/schema'
import { registerMyStore } from '@/features/owner/api'
import { useMyStoreId } from '@/features/owner/hooks'
import { errorMessage } from '@/shared/lib/error'
import { squareThumbnail } from '@/shared/lib/image'
import { AddressSearch } from '@/shared/ui/AddressSearch'
import { BackIcon } from '@/shared/ui/icons'
import { StoreAvatar } from '@/shared/ui/StoreAvatar'
import { MODE_HOME } from '@/stores/modeStore'
import { isNicknameTaken, signup } from '../api'
import { useLogin } from '../hooks'
import { isEmail, NICKNAME_MAX, PASSWORD_MIN, type SignupRequest } from '../schema'
import { Field, FieldButton, FieldInput, PasswordInput } from './AuthUi'

type Role = SignupRequest['role']
type Step = 'choose' | 'store' | 'storeName' | 'account' | 'welcome'

/**
 * 회원가입 (Figma 3:319 ~ 3:595)
 * 사장님: 가게 사진·주소·업종 → 가게명 → 계정(이메일·비밀번호) → 환영
 * 손님: 닉네임(중복확인)·이메일·비밀번호 → 환영
 * 명세상 가입은 email·password·nickname·role만 받고 토큰을 안 줘서, 가입 후 바로 로그인까지 이어서 함.
 */
export function SignupFlow({ initialRole }: { initialRole?: Role }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const storeId = useMyStoreId()
  const login = useLogin()

  const [role, setRole] = useState<Role | null>(initialRole ?? null)
  const [step, setStep] = useState<Step>(initialRole ? (initialRole === 'OWNER' ? 'store' : 'account') : 'choose')

  // 사장님 가게 정보
  const fileRef = useRef<HTMLInputElement>(null)
  const [image, setImage] = useState<{ file: File; preview: string } | null>(null)
  const [road, setRoad] = useState('')
  const [detail, setDetail] = useState('')
  const [category, setCategory] = useState('')
  const [subCategory, setSubCategory] = useState('')
  const [storeName, setStoreName] = useState('')
  const [searching, setSearching] = useState(false)

  // 계정
  const [nickname, setNickname] = useState('')
  const [nickChecked, setNickChecked] = useState<'ok' | 'taken' | null>(null)
  const [checking, setChecking] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const owner = role === 'OWNER'
  const roleLabel = owner ? '사장님으로 가입' : '손님으로 가입'
  const displayName = owner ? storeName.trim() : nickname.trim()

  const back = () => {
    setError(null)
    if (step === 'choose') return navigate(-1)
    if (step === 'store' || (step === 'account' && !owner)) return initialRole ? navigate(-1) : setStep('choose')
    if (step === 'storeName') return setStep('store')
    if (step === 'account') return setStep('storeName')
  }

  const checkNickname = async () => {
    setChecking(true)
    try {
      setNickChecked((await isNicknameTaken(nickname)) ? 'taken' : 'ok')
    } finally {
      setChecking(false)
    }
  }

  const submit = async () => {
    if (!role) return
    setSubmitting(true)
    setError(null)
    try {
      await signup({ email: email.trim(), password, nickname: displayName, role })
      await login.mutateAsync({ email, password })
      if (owner) {
        await registerMyStore(
          storeId,
          { name: storeName.trim(), roadAddress: road.trim(), addressDetail: detail.trim(), category, subCategory: subCategory.trim(), thumbnailUrl: image?.preview ?? null },
          image?.file,
        )
        queryClient.invalidateQueries({ queryKey: ['stores'] })
      }
      setStep('welcome')
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setSubmitting(false)
    }
  }

  const storeReady = road.trim() !== '' && category !== ''
  const accountReady = isEmail(email) && password.length >= PASSWORD_MIN && (owner || nickChecked === 'ok')

  return (
    <div className="mx-auto flex h-full max-w-[430px] flex-col bg-white">
      {step !== 'welcome' && (
        <header className="flex h-[68px] shrink-0 items-center justify-between px-[18px] pt-[env(safe-area-inset-top)]">
          <span className="size-[44px]" />
          {step !== 'choose' && <h1 className="text-[22px] font-bold text-ink">회원가입</h1>}
          <button
            type="button"
            aria-label="뒤로"
            onClick={back}
            className="flex size-[44px] items-center justify-center rounded-full border border-mint-line bg-white text-green-6 shadow-[0_4px_14px_rgba(8,104,22,0.14)]"
          >
            <BackIcon />
          </button>
        </header>
      )}

      {step === 'choose' && (
        <div className="flex flex-1 flex-col px-6 pb-[max(20px,env(safe-area-inset-bottom))]">
          <div className="mt-4 flex flex-col items-center">
            <StoreAvatar url={null} className="size-[76px]" />
            <h1 className="mt-4 text-[28px] font-bold tracking-tight text-ink">회원가입</h1>
          </div>
          <div className="mt-auto mb-auto flex flex-col gap-4 pt-10">
            {(['OWNER', 'RESIDENT'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => {
                  setRole(r)
                  setStep(r === 'OWNER' ? 'store' : 'account')
                }}
                className="h-[53px] rounded-xl bg-green-4 text-[16px] font-medium text-white active:scale-[0.98]"
              >
                {r === 'OWNER' ? '사장님으로 가입할래요' : '손님으로 가입할래요'}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => navigate(-1)} className="mx-auto mb-6 text-[14px] text-ink underline">
            이전으로 돌아가기
          </button>
        </div>
      )}

      {step === 'store' && (
        <Screen hero={<Hero sub={roleLabel} plain />} prev={{ onClick: back }} next={{ onClick: () => setStep('storeName'), disabled: !storeReady }}>
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
              aria-label="업종 대분류"
              className={`h-10 min-w-0 flex-1 bg-transparent px-1 text-[15px] outline-none ${category ? 'text-ink' : 'text-gray-2'}`}
            >
              <option value="">대분류</option>
              {STORE_CATEGORIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
            <span className="h-6 w-px bg-green-1" />
            <FieldInput value={subCategory} onChange={(e) => setSubCategory(e.target.value)} placeholder="소분류 (직접입력)" maxLength={20} aria-label="업종 소분류" />
          </Field>
        </Screen>
      )}

      {step === 'storeName' && (
        <Screen hero={<Hero sub={roleLabel} plain />} prev={{ onClick: back }} next={{ onClick: () => setStep('account'), disabled: !storeName.trim() }}>
          <Field label="가게명">
            <FieldInput value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder="ex. 잇다가게 월계점" maxLength={NICKNAME_MAX} autoFocus />
          </Field>
          <p className="mt-2 text-xs text-q-muted">손님에게 보이는 가게 이름이에요. 로그인 후 프로필에서 바꿀 수 있어요.</p>
        </Screen>
      )}

      {step === 'account' && (
        <Screen
          hero={<Hero sub={roleLabel} plain />}
          prev={{ onClick: back }}
          next={{ label: submitting ? '가입 중...' : '가입하기', onClick: submit, disabled: !accountReady || submitting }}
        >
          {!owner && (
            <Field
              label="닉네임"
              status={nickChecked === 'ok' ? '사용 가능한 닉네임이에요' : nickChecked === 'taken' ? '중복된 이름이에요' : undefined}
              error={nickChecked === 'taken'}
              action={
                <FieldButton onClick={checkNickname} disabled={!nickname.trim() || checking || nickChecked === 'ok'}>
                  {checking ? '확인 중' : '중복확인'}
                </FieldButton>
              }
            >
              <FieldInput
                value={nickname}
                onChange={(e) => {
                  setNickname(e.target.value)
                  setNickChecked(null)
                }}
                placeholder="닉네임을 입력해주세요"
                maxLength={NICKNAME_MAX}
              />
            </Field>
          )}
          <Field label="이메일" status={email && !isEmail(email) ? '이메일 형식을 확인해주세요' : undefined} error={!!email && !isEmail(email)}>
            <FieldInput type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="로그인에 쓸 이메일을 입력해주세요" />
          </Field>
          <Field
            label="비밀번호"
            status={password && password.length < PASSWORD_MIN ? `${PASSWORD_MIN}자 이상 입력해주세요` : undefined}
            error={!!password && password.length < PASSWORD_MIN}
          >
            <PasswordInput autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="비밀번호를 입력해주세요" maxLength={64} />
          </Field>
          {error && (
            <p role="alert" className="mt-4 text-center text-[13px] font-medium text-point-red-dark">
              {error}
            </p>
          )}
        </Screen>
      )}

      {step === 'welcome' && (
        <div className="flex flex-1 flex-col px-4 pt-[max(48px,env(safe-area-inset-top))] pb-[max(16px,env(safe-area-inset-bottom))]">
          <p className="mt-16 text-center text-[16px] font-medium text-green-4">{roleLabel}</p>
          <p className="mt-24 text-center text-[24px] leading-relaxed text-ink">
            {displayName} 님,
            <br />
            반가워요 !
          </p>
          <button
            type="button"
            onClick={() => navigate(MODE_HOME[owner ? 'OWNER' : 'USER'], { replace: true })}
            className="mt-auto h-[52px] rounded-xl bg-green-4 text-base font-bold text-white"
          >
            메인 화면으로 돌아가기
          </button>
        </div>
      )}

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
