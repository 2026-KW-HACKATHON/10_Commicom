import type { ComponentType, CSSProperties } from 'react'
import { Navigate, NavLink, Outlet, useLocation, useMatches, useNavigate } from 'react-router-dom'
import { BackIcon, PlusIcon } from '@/shared/ui/icons'
import { useModeStore } from '@/stores/modeStore'
import { SettingsDrawer, type MenuItem } from './SettingsDrawer'
import { useShrinkOnScroll } from './useShrinkOnScroll'

export interface TabItem {
  to: string
  label: string
  Icon: ComponentType
  /** 하위 경로에서는 활성화하지 않음 (예: 루트 '/') */
  end?: boolean
}

export interface RouteHandle {
  title?: string
  /** 숏폼처럼 화면 전체를 쓰는 페이지: 상단 바를 투명하게 영상 위에 띄움 (Figma 3:203) */
  immersive?: boolean
  /** 숏폼: 하단 탭 바도 투명하게 영상 위에 띄워 화면을 넓게 */
  overlayNav?: boolean
  /** 탭 화면 우상단 + 버튼. 없으면(undefined) 숏폼 만들기, null 이면 버튼 없음 */
  action?: { label: string; to: string } | null
}

const DEFAULT_ACTION = { label: '숏폼 만들기', to: '/create' }

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
  const handle = matches.at(-1)?.handle as RouteHandle | undefined
  const title = handle?.title
  const immersive = Boolean(handle?.immersive)
  const overlayNav = Boolean(handle?.overlayNav)
  // 탭 루트가 아닌 하위 화면(예: 지도 → 홍보 영상)이면 우상단을 뒤로가기로
  const showBack = !tabs.some((tab) => tab.to === pathname)
  const action = handle?.action === undefined ? DEFAULT_ACTION : handle.action
  const mode = useModeStore((s) => s.mode)
  // 탭이 많으면(사장님 5개) 선택된 탭도 아이콘 위·글자 아래로
  const compact = tabs.length >= 5
  const { shrunk, onScrollCapture } = useShrinkOnScroll(pathname)

  // 처음 실행이면 손님/사장님 선택부터 (QR로 들어온 경우 고른 뒤 돌아오도록 next)
  if (!mode) return <Navigate to={`/welcome?next=${encodeURIComponent(pathname + search)}`} replace />
  // 사장님 모드에서 앱 첫 화면(숏폼)을 열면 사장님 홈으로
  if (mode === 'OWNER' && pathname === '/') return <Navigate to="/owner" replace />

  return (
    <div className="relative mx-auto flex h-full max-w-[430px] flex-col bg-white">
      <header
        className={`flex h-[76px] shrink-0 items-center justify-between gap-2 px-[18px] pt-[env(safe-area-inset-top)] ${
          immersive ? 'absolute inset-x-0 top-0 z-30' : 'border-b border-green-1 bg-white'
        }`}
      >
        <SettingsDrawer buttonClassName={circleButton} items={menuItems} />
        <div className="flex min-w-0 flex-col items-center">
          {modeBadge && (
            <span className="mb-0.5 rounded-full bg-green-6 px-2 py-px text-[10px] font-bold text-white">{modeBadge}</span>
          )}
          {!immersive && (
            <h1 className={`truncate font-bold text-ink ${modeBadge ? 'text-[21px] leading-tight' : 'text-[25px]'}`}>{title}</h1>
          )}
        </div>
        {showBack ? (
          <button type="button" aria-label="뒤로" className={circleButton} onClick={() => navigate(-1)}>
            <BackIcon />
          </button>
        ) : action ? (
          <button type="button" aria-label={action.label} className={primaryCircleButton} onClick={() => navigate(action.to)}>
            <PlusIcon />
          </button>
        ) : (
          // 버튼이 없어도 제목이 가운데에 오도록 자리만 차지
          <span aria-hidden className="size-[46px] shrink-0" />
        )}
      </header>

      {/* --nav-h: 영상 위에 떠 있는 탭 바 높이 (바가 줄면 그만큼 영상 위 글자·버튼도 내려감) */}
      <main
        className="relative min-h-0 flex-1"
        onScrollCapture={onScrollCapture}
        style={{
          '--nav-h': overlayNav ? `calc(${shrunk ? 52 : 76}px + max(16px, env(safe-area-inset-bottom)))` : '0px',
        } as CSSProperties}
      >
        <Outlet />
      </main>

      {/* 아래로 스크롤하면 작아지고(아이콘만), 위로 스크롤하면 원래대로 */}
      <nav
        className={`shrink-0 pb-[max(16px,env(safe-area-inset-bottom))] transition-[padding] duration-300 ${
          shrunk ? 'px-12 pt-1.5' : 'px-5 pt-3'
        } ${
          // 영상 위(z-10~20)에는 뜨되, 설정 서랍이 들어 있는 상단 바(z-30)보다는 아래
          overlayNav ? 'absolute inset-x-0 bottom-0 z-[25] bg-transparent' : 'bg-white'
        }`}
      >
        <div
          className={`grid items-center gap-1 rounded-full border px-[7px] transition-[height] duration-300 ${
            shrunk ? 'h-[46px]' : 'h-[64px]'
          } ${
            overlayNav
              ? 'border-white/25 bg-white/10 backdrop-blur-md'
              : 'border-mint-line bg-white shadow-[0_6px_20px_rgba(8,104,22,0.14)]'
          }`}
          style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
        >
          {tabs.map(({ to, label, Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              aria-label={label}
              className={({ isActive }) =>
                `flex items-center justify-center gap-1.5 rounded-full text-[13px] font-bold whitespace-nowrap transition-[height,color,background-color] duration-300 ${
                  shrunk ? 'h-[34px]' : 'h-[50px]'
                } ${
                  isActive
                    ? `bg-green-6 text-white shadow-[0_4px_10px_rgba(8,104,22,0.3)] ${compact ? 'flex-col gap-0.5' : ''}`
                    : `flex-col gap-0.5 ${overlayNav ? 'text-white/80 hover:text-white' : 'text-green-6/55 hover:text-green-6'}`
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`flex items-center ${isActive ? 'scale-[0.8]' : 'scale-[0.72]'}`}>
                    <Icon />
                  </span>
                  {!shrunk && <span className={isActive && !compact ? '' : 'text-[11px] leading-none'}>{label}</span>}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
