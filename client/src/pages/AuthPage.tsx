import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import logo from '@/assets/logo-itda.svg'
import { LoginForm } from '@/features/auth/components/LoginForm'
import { MyProfile } from '@/features/auth/components/MyProfile'
import { SignupFlow } from '@/features/auth/components/SignupFlow'
import { modeOfRole } from '@/features/auth/schema'
import { BackIcon } from '@/shared/ui/icons'
import { useAuthStore } from '@/stores/authStore'
import { MODE_HOME } from '@/stores/modeStore'

/** 손님 프로필 수정 */
export const MyProfilePage = () => <MyProfile />

/** 회원가입 (?role=OWNER|RESIDENT 면 유형 선택 건너뜀) */
export function SignupPage() {
  const [params] = useSearchParams()
  const role = params.get('role')
  return <SignupFlow initialRole={role === 'OWNER' || role === 'RESIDENT' ? role : undefined} />
}

/** 로그인 화면 (설정 서랍 밖에서 로그인이 필요할 때). ?next= 로 돌아갈 곳 */
export function LoginPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const next = params.get('next')

  const done = () => {
    const member = useAuthStore.getState().member
    const home = MODE_HOME[member ? modeOfRole(member.role) : 'USER']
    navigate(next?.startsWith('/') ? next : home, { replace: true })
  }

  return (
    <div className="mx-auto flex h-full max-w-[430px] flex-col bg-white px-6 pt-[max(16px,env(safe-area-inset-top))] pb-[max(24px,env(safe-area-inset-bottom))]">
      <button
        type="button"
        aria-label="뒤로"
        onClick={() => navigate(-1)}
        className="mt-2 flex size-[44px] items-center justify-center self-end rounded-full border border-mint-line bg-white text-green-6 shadow-[0_4px_14px_rgba(8,104,22,0.14)]"
      >
        <BackIcon />
      </button>
      <img src={logo} alt="잇다" className="mt-6 h-[52px] w-fit" />
      <h1 className="mt-5 text-[26px] leading-snug font-bold text-ink">
        다시 만나서
        <br />
        반가워요!
      </h1>
      <div className="mt-8">
        <LoginForm onSuccess={done} />
      </div>
      <p className="mt-auto text-center text-[14px] text-q-muted">
        아직 계정이 없나요?{' '}
        <Link to="/signup" className="font-bold text-green-4 underline">
          회원가입
        </Link>
      </p>
    </div>
  )
}
