import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import pigeonCrying from '@/assets/generation/pigeon-crying.jpg'
import pigeonWalk from '@/assets/map/pigeon-walk.png'
import { Dialog } from '@/features/generation/components/Dialog'
import { errorMessage } from '@/shared/lib/error'
import { useAuthStore, useMe } from '@/stores/authStore'
import { isNicknameTaken, updateNickname, updatePassword } from '../api'
import { useWithdraw } from '../hooks'
import { NICKNAME_MAX, PASSWORD_MIN } from '../schema'
import { Field, FieldButton, FieldInput, PasswordInput } from './AuthUi'

type Status = { text: string; error?: boolean } | null

/** 손님 프로필 수정 (Figma 11:1829 · 11:1978 · 11:2030): 닉네임(중복확인 = 저장) · 비밀번호 · 회원탈퇴 */
export function MyProfile() {
  const navigate = useNavigate()
  const me = useMe()
  const setMember = useAuthStore((s) => s.setMember)
  const withdraw = useWithdraw()

  const [nickname, setNickname] = useState(me?.nickname ?? '')
  const [nickStatus, setNickStatus] = useState<Status>(null)
  const [nickBusy, setNickBusy] = useState(false)
  const [password, setPassword] = useState('')
  const [pwStatus, setPwStatus] = useState<Status>(null)
  const [pwBusy, setPwBusy] = useState(false)
  const [confirmWithdraw, setConfirmWithdraw] = useState(false)

  if (!me) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-8 text-center">
        <img src={pigeonWalk} alt="" className="h-24 w-auto object-contain" />
        <p className="mt-4 text-[16px] font-bold text-ink">로그인하면 프로필을 볼 수 있어요</p>
        <Link to="/login?next=/profile" className="mt-5 flex h-11 w-full items-center justify-center rounded-xl bg-green-4 text-[15px] font-bold text-white">
          로그인
        </Link>
        <Link to="/signup" className="mt-3 text-[13px] text-q-muted underline">
          회원가입
        </Link>
      </div>
    )
  }

  const nickChanged = nickname.trim() !== '' && nickname.trim() !== me.nickname

  // 중복확인을 누르면 확인 후 바로 저장 (Figma: "수정되었어요")
  const saveNickname = async () => {
    setNickBusy(true)
    try {
      if (await isNicknameTaken(nickname, me.memberId)) return setNickStatus({ text: '중복된 이름이에요', error: true })
      setMember(await updateNickname(nickname))
      setNickStatus({ text: '수정되었어요' })
    } catch (e) {
      setNickStatus({ text: errorMessage(e), error: true })
    } finally {
      setNickBusy(false)
    }
  }

  const savePassword = async () => {
    setPwBusy(true)
    try {
      await updatePassword(password)
      setPassword('')
      setPwStatus({ text: '수정되었어요' })
    } catch (e) {
      setPwStatus({ text: errorMessage(e), error: true })
    } finally {
      setPwBusy(false)
    }
  }

  const pwShort = password !== '' && password.length < PASSWORD_MIN

  return (
    <div className="h-full overflow-y-auto bg-white px-5 pt-16 pb-10">
      <Field
        label="닉네임"
        status={nickStatus?.text}
        error={nickStatus?.error}
        action={
          <FieldButton onClick={saveNickname} disabled={!nickChanged || nickBusy}>
            {nickBusy ? '확인 중' : '중복확인'}
          </FieldButton>
        }
      >
        <FieldInput
          value={nickname}
          maxLength={NICKNAME_MAX}
          onChange={(e) => {
            setNickname(e.target.value)
            setNickStatus(null)
          }}
          placeholder="닉네임을 입력해주세요"
        />
      </Field>

      <Field
        label="비밀번호"
        status={pwShort ? `${PASSWORD_MIN}자 이상 입력해주세요` : pwStatus?.text}
        error={pwShort || pwStatus?.error}
        action={
          <FieldButton onClick={savePassword} disabled={password.length < PASSWORD_MIN || pwBusy}>
            {pwBusy ? '수정 중' : '수정'}
          </FieldButton>
        }
      >
        <PasswordInput
          value={password}
          autoComplete="new-password"
          maxLength={64}
          onChange={(e) => {
            setPassword(e.target.value)
            setPwStatus(null)
          }}
          placeholder="수정할 비밀번호 입력"
        />
      </Field>

      <p className="mt-6 text-center text-[12px] text-q-muted">{me.email}</p>
      <button type="button" onClick={() => setConfirmWithdraw(true)} className="mx-auto mt-3 block text-[12px] text-gray-2 underline">
        회원탈퇴
      </button>

      {confirmWithdraw && (
        <Dialog
          title="정말 탈퇴하실 건가요?"
          text="탈퇴하면 계정 정보가 모두 지워져요"
          image={pigeonCrying}
          primary={{ label: '아니요', onClick: () => setConfirmWithdraw(false) }}
          secondary={{
            label: withdraw.isPending ? '탈퇴 중...' : '네 탈퇴할래요',
            onClick: () => withdraw.mutate(undefined, { onSuccess: () => navigate('/', { replace: true }) }),
          }}
        />
      )}
    </div>
  )
}
