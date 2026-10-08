import { useState, type FormEvent } from 'react'
import { errorMessage } from '@/shared/lib/error'
import { useLogin } from '../hooks'
import { isEmail } from '../schema'

/** 로그인 (Figma 4:189: 햄버거 아래 카드). 설정 서랍·로그인 화면 공통 */
export function LoginForm({ onSuccess, compact = false }: { onSuccess?: () => void; compact?: boolean }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const login = useLogin()
  const ready = isEmail(email) && password.length > 0

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!ready || login.isPending) return
    login.mutate({ email, password }, { onSuccess })
  }

  const input = `w-full border-b-2 border-green-1 bg-transparent px-1 text-ink outline-none placeholder:text-gray-2 focus:border-green-4 ${compact ? 'h-9 text-[14px]' : 'h-11 text-[15px]'}`

  return (
    <form onSubmit={submit} className="flex flex-col">
      <label className="text-[12px] font-bold text-ink">
        이메일
        <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="이메일을 입력해주세요" className={input} />
      </label>
      <label className="mt-3 text-[12px] font-bold text-ink">
        비밀번호
        <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="비밀번호를 입력해주세요" className={input} />
      </label>
      {login.isError && (
        <p role="alert" className="mt-2 text-[12px] font-medium text-point-red-dark">
          {errorMessage(login.error)}
        </p>
      )}
      <button
        type="submit"
        disabled={!ready || login.isPending}
        className={`mt-4 rounded-xl bg-green-4 font-bold text-white transition-colors disabled:bg-green-1 ${compact ? 'h-10 text-[14px]' : 'h-12 text-[15px]'}`}
      >
        {login.isPending ? '로그인 중...' : '로그인'}
      </button>
    </form>
  )
}
