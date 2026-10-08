import { useEffect, useState } from 'react'
import { errorCode, errorMessage } from '@/shared/lib/error'
import { confirmEmailCode, sendEmailCode } from '../api'
import { isEmail } from '../schema'
import { Field, FieldButton, FieldInput } from './AuthUi'

type Status = { text: string; error?: boolean } | null

/**
 * 가입 이메일 + 인증번호 확인.
 * 이메일 입력 → [인증번호 받기] → 6자리 입력(5분) → [확인] → 인증 완료(이메일 잠금, "이메일 바꾸기"로 다시)
 */
export function EmailVerification({
  email,
  onEmailChange,
  verified,
  onVerifiedChange,
}: {
  email: string
  onEmailChange: (email: string) => void
  verified: boolean
  onVerifiedChange: (verified: boolean) => void
}) {
  const [sending, setSending] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [code, setCode] = useState('')
  const [expiresAt, setExpiresAt] = useState<number | null>(null)
  const [resendAt, setResendAt] = useState(0)
  const [devCode, setDevCode] = useState<string | null>(null)
  const [emailStatus, setEmailStatus] = useState<Status>(null)
  const [codeStatus, setCodeStatus] = useState<Status>(null)
  const [now, setNow] = useState(() => Date.now())

  // 인증번호를 보낸 뒤 남은 시간 표시용 시계
  const sent = expiresAt !== null && !verified
  useEffect(() => {
    if (!sent) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [sent])

  const left = expiresAt ? Math.max(0, Math.ceil((expiresAt - now) / 1000)) : 0
  const resendLeft = Math.max(0, Math.ceil((resendAt - now) / 1000))
  const expired = sent && left === 0
  const badEmail = email !== '' && !isEmail(email)

  const send = async () => {
    setSending(true)
    setEmailStatus(null)
    setCodeStatus(null)
    try {
      const res = await sendEmailCode(email)
      const t = Date.now()
      setNow(t)
      setExpiresAt(t + res.expiresInSeconds * 1000)
      setResendAt(t + res.resendAfterSeconds * 1000)
      setDevCode(res.devCode ?? null)
      setCode('')
      setEmailStatus({ text: '인증번호를 보냈어요. 메일함을 확인해 주세요' })
    } catch (e) {
      setEmailStatus({ text: errorCode(e) === 'MEMBER409' ? '이미 가입된 이메일이에요' : errorMessage(e), error: true })
    } finally {
      setSending(false)
    }
  }

  const confirm = async () => {
    setConfirming(true)
    setCodeStatus(null)
    try {
      await confirmEmailCode(email, code)
      onVerifiedChange(true)
      setEmailStatus({ text: '인증됐어요' })
      setExpiresAt(null)
    } catch (e) {
      setCodeStatus({ text: errorMessage(e), error: true })
      // 만료·시도 초과면 인증번호를 새로 받아야 함
      if (['EMAIL400_2', 'EMAIL429'].includes(errorCode(e) ?? '')) {
        setExpiresAt(null)
        setResendAt(0)
      }
    } finally {
      setConfirming(false)
    }
  }

  const reset = () => {
    onVerifiedChange(false)
    setExpiresAt(null)
    setResendAt(0)
    setDevCode(null)
    setCode('')
    setEmailStatus(null)
    setCodeStatus(null)
  }

  return (
    <>
      <Field
        label="이메일"
        status={badEmail ? '이메일 형식을 확인해주세요' : emailStatus?.text}
        error={badEmail || emailStatus?.error}
        action={
          verified ? (
            <button type="button" onClick={reset} className="shrink-0 px-1 text-[12px] text-q-muted underline">
              이메일 바꾸기
            </button>
          ) : (
            <FieldButton onClick={send} disabled={!isEmail(email) || sending || resendLeft > 0}>
              {sending ? '보내는 중' : resendLeft > 0 ? `다시 받기 ${resendLeft}초` : sent || expired ? '다시 받기' : '인증번호 받기'}
            </FieldButton>
          )
        }
      >
        <FieldInput
          type="email"
          autoComplete="email"
          value={email}
          readOnly={verified}
          onChange={(e) => {
            onEmailChange(e.target.value)
            // 이메일을 바꾸면 처음부터 다시 인증
            if (expiresAt || devCode) reset()
          }}
          placeholder="로그인에 쓸 이메일을 입력해주세요"
          className={verified ? 'text-q-muted' : ''}
        />
      </Field>

      {sent && (
        <Field
          label="인증번호"
          status={codeStatus?.text ?? (expired ? '인증번호가 만료됐어요. 다시 받아 주세요' : `남은 시간 ${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`)}
          error={codeStatus?.error || expired}
          action={
            <FieldButton onClick={confirm} disabled={code.length !== 6 || confirming || expired}>
              {confirming ? '확인 중' : '확인'}
            </FieldButton>
          }
        >
          <FieldInput
            value={code}
            onChange={(e) => {
              setCode(e.target.value.replace(/\D/g, '').slice(0, 6))
              setCodeStatus(null)
            }}
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="6자리 숫자"
            className="tracking-[0.3em]"
            autoFocus
          />
        </Field>
      )}
      {sent && devCode && (
        // 메일 서버 없는 개발·목업 환경에서만 (실제 서비스에선 메일로만 감)
        <button type="button" onClick={() => setCode(devCode)} className="mt-1.5 text-xs text-q-muted underline">
          테스트용 인증번호: {devCode} (눌러서 입력)
        </button>
      )}
    </>
  )
}
