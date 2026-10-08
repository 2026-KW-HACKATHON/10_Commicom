import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import logo from '@/assets/logo-itda.svg'
import { mockAddFeed, resetMockDb, USE_MOCK } from '@/mocks/db'
import { CloseIcon, MenuIcon } from '@/shared/ui/icons'
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

  const switchMode = (next: AppMode) => {
    setMode(next)
    setOpen(false)
    navigate(MODE_HOME[next])
  }

  return (
    <>
      <button type="button" aria-label="설정 열기" aria-expanded={open} className={buttonClassName} onClick={() => setOpen(true)}>
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

              <section className="mt-6 px-5">
                <h2 className="text-xs font-bold text-q-muted">계정</h2>
                <p className="mt-2 rounded-xl bg-q-panel px-4 py-3 text-[13px] text-q-muted">로그인·프로필·스크랩은 준비 중이에요</p>
              </section>

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
                  {USE_MOCK && (
                    <li>
                      <button
                        type="button"
                        onClick={() => {
                          mockAddFeed(1000)
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
                  {USE_MOCK && (
                    <li>
                      <button
                        type="button"
                        onClick={() => {
                          resetMockDb()
                          localStorage.removeItem('itda-pro')
                          window.location.reload()
                        }}
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
