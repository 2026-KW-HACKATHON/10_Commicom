import { useState, type InputHTMLAttributes, type ReactNode } from 'react'

/**
 * Figma 회원가입·프로필 입력칸: 작은 라벨(+상태 문구) / 초록 밑줄 입력 / 오른쪽 초록 버튼(찾기·중복확인·수정)
 */
export function Field({
  label,
  status,
  error = false,
  action,
  children,
}: {
  label: string
  /** 라벨 옆 상태 문구 (예: 사용 가능한 닉네임이에요) */
  status?: string
  error?: boolean
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="mt-6 first:mt-0">
      <p className="flex items-baseline gap-2 text-[12px] font-medium text-ink">
        {label}
        {status && <span className={error ? 'text-point-red' : 'text-green-4'}>{status}</span>}
      </p>
      <div className={`mt-1 flex items-center gap-2 border-b-2 pb-1.5 ${error ? 'border-point-red' : 'border-green-4'}`}>
        {children}
        {action}
      </div>
    </div>
  )
}

export function FieldInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`h-10 min-w-0 flex-1 bg-transparent px-1 text-[15px] text-ink outline-none placeholder:text-gray-2 ${props.className ?? ''}`}
    />
  )
}

/** 비밀번호: 눈 아이콘으로 보이기/숨기기 */
export function PasswordInput(props: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>) {
  const [show, setShow] = useState(false)
  return (
    <>
      <FieldInput {...props} type={show ? 'text' : 'password'} />
      <button type="button" aria-label={show ? '비밀번호 숨기기' : '비밀번호 보기'} onClick={() => setShow((v) => !v)} className="flex size-9 items-center justify-center text-gray-2">
        <EyeIcon off={show} />
      </button>
    </>
  )
}

/** 입력칸 오른쪽 초록 버튼 (찾기·중복확인·수정) */
export function FieldButton({ children, onClick, disabled }: { children: ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="h-9 shrink-0 rounded-lg bg-green-4 px-4 text-[13px] font-bold text-white transition-colors disabled:bg-green-1"
    >
      {children}
    </button>
  )
}

function EyeIcon({ off }: { off: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
      <path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12Z" />
      <circle cx="12" cy="12" r="2.6" fill="currentColor" />
      {off && <path d="M4 20 20 4" />}
    </svg>
  )
}
