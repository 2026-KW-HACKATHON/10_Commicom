import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import logo from '@/assets/logo-itda.svg'
import pigeonWalk from '@/assets/map/pigeon-walk.png'
import { LoginForm } from '@/features/auth/components/LoginForm'
import { useLogout } from '@/features/auth/hooks'
import { canUseOwnerMode, modeOfRole } from '@/features/auth/schema'
import { addTestFeed } from '@/features/quest/api'
import { HAS_MOCK, resetAllLocalData } from '@/mocks/db'
import { errorMessage } from '@/shared/lib/error'
import { CloseIcon, MenuIcon } from '@/shared/ui/icons'
import { toast } from '@/stores/toastStore'
import { useAuthStore, useMe } from '@/stores/authStore'
import { MODE_HOME, useModeStore, type AppMode } from '@/stores/modeStore'

export interface MenuItem {
  to: string
  label: string
  icon: string
  /** 있으면 이모지 대신 일러스트 */
  image?: string
}

const MODES: { mode: AppMode; label: string; desc: string }[] = [
  { mode: 'USER', label: '손님', desc: '가게 구경·퀘스트' },
  { mode: 'OWNER', label: '사장님', desc: '가게 홍보·쿠폰' },
]

/**
 * 계정 (Figma GNB: 로그인X → 로그인·회원가입 / 로그인O → 닉네임 님·로그아웃·스크랩·프로필)
 */
function AccountSection({ onLoggedIn, onLoggedOut }: { onLoggedIn: (mode: AppMode) => void; onLoggedOut: () => void }) {
  const me = useMe()
  const logout = useLogout()

  if (!me) {
    return (
      <section className="mt-6 px-5">
        <h2 className="text-xs font-bold text-q-muted">계정</h2>
        <div className="mt-2 rounded-2xl bg-q-panel px-4 pt-4 pb-3">
          <LoginForm
            compact
            onSuccess={() => {
              const m = useAuthStore.getState().member
              if (m) onLoggedIn(modeOfRole(m.role))
            }}
          />
          <p className="mt-3 text-center text-[12px] text-q-muted">
            아직 계정이 없나요?{' '}
            <Link to="/signup" className="font-bold text-green-4 underline">
              회원가입
            </Link>
          </p>
        </div>
      </section>
    )
  }

  const owner = me.role === 'OWNER'
  return (
    <section className="mt-6 px-5">
      <h2 className="text-xs font-bold text-q-muted">계정</h2>
      <div className="mt-2 flex items-center gap-3 rounded-2xl bg-q-panel px-4 py-3">
        <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white">
          {me.profileImageUrl ? <img src={me.profileImageUrl} alt="" className="size-full object-cover" /> : <img src={pigeonWalk} alt="" className="size-9 object-contain" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-bold text-ink">{me.nickname} 님</span>
          <span className="block truncate text-[11px] text-q-muted">
            {owner ? '사장님' : '손님'} · {me.email}
          </span>
        </span>
      </div>
      <ul className="mt-1 text-[15px] text-ink">
        <li>
          <Link to={owner ? '/owner/profile' : '/profile'} className="flex justify-between border-b border-q-line py-3.5">
            프로필 <span className="text-q-muted">›</span>
          </Link>
        </li>
        {!owner && (
          <li>
            <Link to="/scraps" className="flex justify-between border-b border-q-line py-3.5">
              스크랩 <span className="text-q-muted">›</span>
            </Link>
          </li>
        )}
        <li>
          <button
            type="button"
            onClick={() => {
              logout()
              onLoggedOut()
            }}
            className="w-full border-b border-q-line py-3.5 text-left text-q-muted"
          >
            로그아웃
          </button>
        </li>
      </ul>
    </section>
  )
}

/** 햄버거 버튼 → 왼쪽에서 열리는 설정 (이용 모드 전환, 바로가기, 앱 설정) */
export function SettingsDrawer({ buttonClassName, items }: { buttonClassName: string; items: MenuItem[] }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { mode, setMode, reset } = useModeStore()
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()

  // 화면이 바뀌면 닫기
  const [lastPath, setLastPath] = useState(pathname)
  if (lastPath !== pathname) {
    setLastPath(pathname)
    setOpen(false)
  }

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const me = useMe()
  const logout = useLogout()
  // 손님 계정으로 로그인한 채 사장님 모드를 고르면 막고 안내
  const [ownerBlocked, setOwnerBlocked] = useState(false)

  const switchMode = (next: AppMode) => {
    if (next === 'OWNER' && !canUseOwnerMode(me)) return setOwnerBlocked(true)
    setOwnerBlocked(false)
    setMode(next)
    setOpen(false)
    navigate(MODE_HOME[next])
  }

  return (
    <>
      <button type="button" aria-label="설정 열기" aria-expanded={open} className={buttonClassName}
        onClick={() => {
          setOwnerBlocked(false)
          setOpen(true)
        }}
      >
        <MenuIcon />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex justify-center">
          <div className="relative h-full w-full max-w-[430px] overflow-hidden">
            <button type="button" aria-label="닫기" className="absolute inset-0 animate-[fade_.2s] bg-black/35" onClick={() => setOpen(false)} />
            <aside
              role="dialog"
              aria-modal
              aria-label="설정"
              className="absolute inset-y-0 left-0 flex w-[84%] max-w-[340px] animate-[slide-in_.22s_ease-out] flex-col overflow-y-auto bg-white pt-[max(20px,env(safe-area-inset-top))] pb-6 shadow-2xl"
            >
              <header className="flex items-center justify-between px-5">
                <img src={logo} alt="잇다" className="h-9 w-fit" />
                <button type="button" aria-label="닫기" onClick={() => setOpen(false)} className="flex size-9 items-center justify-center text-q-muted">
                  <CloseIcon />
                </button>
              </header>

              <section className="mt-6 px-5">
                <h2 className="text-xs font-bold text-q-muted">이용 모드</h2>
                <div role="radiogroup" aria-label="이용 모드" className="mt-2 grid grid-cols-2 gap-2">
                  {MODES.map((m) => {
                    const active = mode === m.mode
                    return (
                      <button
                        key={m.mode}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => !active && switchMode(m.mode)}
                        className={`rounded-2xl border-2 px-3 py-3 text-left ${
                          active ? 'border-green-6 bg-green-6 text-white' : 'border-q-line bg-white text-ink'
                        }`}
                      >
                        <span className="block text-[15px] font-bold">{m.label}</span>
                        <span className={`text-[11px] ${active ? 'opacity-80' : 'text-q-muted'}`}>{active ? '지금 사용 중' : m.desc}</span>
                      </button>
                    )
                  })}
                </div>
                {ownerBlocked && (
                  <div role="alert" className="mt-2 rounded-2xl border border-point-orange bg-point-yellow/20 px-4 py-3">
                    <p className="text-[13px] font-bold text-point-red-dark">사장님 모드는 사장님 계정으로 쓸 수 있어요</p>
                    <p className="mt-0.5 text-[12px] text-q-sub">지금은 손님 계정({me?.nickname})으로 로그인되어 있어요</p>
                    <div className="mt-2.5 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          logout('로그아웃했어요 · 사장님 계정으로 로그인해 주세요')
                          setOwnerBlocked(false)
                        }}
                        className="h-9 rounded-lg bg-white text-[12px] font-bold text-q-text"
                      >
                        다른 계정으로 로그인
                      </button>
                      <Link to="/signup?role=OWNER" className="flex h-9 items-center justify-center rounded-lg bg-green-4 text-[12px] font-bold text-white">
                        사장님으로 가입
                      </Link>
                    </div>
                  </div>
                )}
              </section>

              <section className="mt-6 px-5">
                <h2 className="text-xs font-bold text-q-muted">바로가기</h2>
                <ul className="mt-1">
                  {items.map((item) => (
                    <li key={item.to}>
                      <Link to={item.to} className="flex items-center gap-3 border-b border-q-line py-3.5 text-[15px] font-medium text-ink">
                        <span aria-hidden className="flex size-9 items-center justify-center overflow-hidden rounded-xl bg-q-mint text-sm">
                          {item.image ? <img src={item.image} alt="" className="size-8 object-contain" /> : item.icon}
                        </span>
                        <span className="flex-1">{item.label}</span>
                        <span className="text-q-muted">›</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>

              <AccountSection
                onLoggedIn={(role) => {
                  setOpen(false)
                  if (role !== mode) navigate(MODE_HOME[role])
                }}
                onLoggedOut={() => setOpen(false)}
              />

              <section className="mt-6 px-5">
                <h2 className="text-xs font-bold text-q-muted">앱 설정</h2>
                <ul className="mt-1 text-[15px] text-ink">
                  <li>
                    <button
                      type="button"
                      onClick={() => {
                        // 먼저 이동한 뒤 초기화해야 레이아웃이 next=현재 주소로 보내지 않음
                        navigate('/welcome', { replace: true })
                        reset()
                      }}
                      className="w-full border-b border-q-line py-3.5 text-left"
                    >
                      처음 화면(모드 선택) 다시 보기
                    </button>
                  </li>
                  {HAS_MOCK && (
                    <li>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await addTestFeed(1000)
                          } catch (e) {
                            toast(errorMessage(e, '로그인한 뒤 받을 수 있어요'))
                            return
                          }
                          queryClient.invalidateQueries({ queryKey: ['pigeon'] })
                          if (mode !== 'USER') setMode('USER')
                          navigate('/quest')
                        }}
                        className="w-full border-b border-q-line py-3.5 text-left"
                      >
                        테스트용 먹이 1000개 받기
                      </button>
                    </li>
                  )}
                  {HAS_MOCK && (
                    <li>
                      <button
                        type="button"
                        onClick={resetAllLocalData}
                        className="w-full border-b border-q-line py-3.5 text-left"
                      >
                        목업 데이터 초기화
                      </button>
                    </li>
                  )}
                  <li className="flex justify-between py-3.5 text-q-muted">
                    <span>앱 버전</span>
                    <span>0.1.0</span>
                  </li>
                </ul>
              </section>
            </aside>
          </div>
        </div>
      )}
    </>
  )
}
