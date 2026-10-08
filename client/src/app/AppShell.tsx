import type { ComponentType } from 'react'
import { Navigate, NavLink, Outlet, useLocation, useMatches, useNavigate } from 'react-router-dom'
import { BackIcon, PlusIcon } from '@/shared/ui/icons'
import { useModeStore } from '@/stores/modeStore'
import { SettingsDrawer, type MenuItem } from './SettingsDrawer'

export interface TabItem {
  to: string
  label: string
  Icon: ComponentType
  /** 하위 경로에서는 활성화하지 않음 (예: 루트 '/') */
  end?: boolean
}

export interface RouteHandle {
  title?: string
}

/** 하단 네비와 같은 톤: 흰 바탕 + 민트 테두리 + 초록 그림자 */
const circleButton =
  'flex size-[46px] shrink-0 items-center justify-center rounded-full border border-mint-line bg-white text-green-6 shadow-[0_4px_14px_rgba(8,104,22,0.14)] transition-colors active:bg-mint'
/** 주요 동작(숏폼 만들기)은 하단 네비의 선택된 탭처럼 진한 초록 */
const primaryCircleButton =
  'flex size-[46px] shrink-0 items-center justify-center rounded-full bg-green-6 text-white shadow-[0_4px_10px_rgba(8,104,22,0.3)] transition-colors active:bg-green-6/90'

/** 손님·사장님 모드 공통 틀: 상단 바(메뉴·제목·+/뒤로) + 하단 탭 (모바일 폭 고정) */
export function AppShell({
  tabs,
  menuItems,
  modeBadge,
}: {
  tabs: TabItem[]
  menuItems: MenuItem[]
  modeBadge?: string
}) {
  const navigate = useNavigate()
  const { pathname, search } = useLocation()
  const matches = useMatches()
  const title = (matches.at(-1)?.handle as RouteHandle | undefined)?.title
  // 탭 루트가 아닌 하위 화면(예: 지도 → 홍보 영상)이면 우상단을 뒤로가기로
  const showBack = !tabs.some((tab) => tab.to === pathname)
  const mode = useModeStore((s) => s.mode)
  // 탭이 많으면(사장님 5개) 선택된 탭도 아이콘 위·글자 아래로
  const compact = tabs.length >= 5

  // 처음 실행이면 손님/사장님 선택부터 (QR로 들어온 경우 고른 뒤 돌아오도록 next)
  if (!mode) return <Navigate to={`/welcome?next=${encodeURIComponent(pathname + search)}`} replace />
  // 사장님 모드에서 앱 첫 화면(숏폼)을 열면 사장님 홈으로
  if (mode === 'OWNER' && pathname === '/') return <Navigate to="/owner" replace />

  return (
    <div className="mx-auto flex h-full max-w-[430px] flex-col bg-white">
      <header className="flex h-[76px] shrink-0 items-center justify-between gap-2 border-b border-green-1 bg-white px-[18px] pt-[env(safe-area-inset-top)]">
        <SettingsDrawer buttonClassName={circleButton} items={menuItems} />
        <div className="flex min-w-0 flex-col items-center">
          {modeBadge && (
            <span className="mb-0.5 rounded-full bg-green-6 px-2 py-px text-[10px] font-bold text-white">{modeBadge}</span>
          )}
          <h1 className={`truncate font-bold text-ink ${modeBadge ? 'text-[21px] leading-tight' : 'text-[25px]'}`}>{title}</h1>
        </div>
        {showBack ? (
          <button type="button" aria-label="뒤로" className={circleButton} onClick={() => navigate(-1)}>
            <BackIcon />
          </button>
        ) : (
          <button type="button" aria-label="숏폼 만들기" className={primaryCircleButton}>
            <PlusIcon />
          </button>
        )}
      </header>

      <main className="relative min-h-0 flex-1">
        <Outlet />
      </main>

      <nav className="shrink-0 bg-white px-5 pt-3 pb-[max(16px,env(safe-area-inset-bottom))]">
        <div
          className="grid h-[64px] items-center gap-1 rounded-full border border-mint-line bg-white px-[7px] shadow-[0_6px_20px_rgba(8,104,22,0.14)]"
          style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
        >
          {tabs.map(({ to, label, Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex h-[50px] items-center justify-center gap-1.5 rounded-full text-[13px] font-bold whitespace-nowrap transition-colors ${
                  isActive
                    ? `bg-green-6 text-white shadow-[0_4px_10px_rgba(8,104,22,0.3)] ${compact ? 'flex-col gap-0.5' : ''}`
                    : 'flex-col gap-0.5 text-green-6/55 hover:text-green-6'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`flex items-center ${isActive ? 'scale-[0.8]' : 'scale-[0.72]'}`}>
                    <Icon />
                  </span>
                  <span className={isActive && !compact ? '' : 'text-[11px] leading-none'}>{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
