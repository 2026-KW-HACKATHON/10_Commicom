/** Figma(컴미컴) 디자인 시스템 아이콘 — 경로는 Figma SVG 그대로 */

const stroke = {
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const

export function MenuIcon() {
  return (
    <svg width="22" height="17" viewBox="0 0 22 17" fill="none" aria-hidden>
      <path d="M1 8.5H21M1 16H21M1 1H21" {...stroke} />
    </svg>
  )
}

export function PlusIcon() {
  return (
    <svg width="21.5" height="21" viewBox="0 0 21.5 21" fill="none" aria-hidden>
      <path d="M1 10.5H20.5M10.5 20V1" {...stroke} />
    </svg>
  )
}

export function BackIcon() {
  return (
    <svg width="14" height="21" viewBox="15.5 14 14 21" fill="none" aria-hidden>
      <path
        d="M28.577 14.3844C29.141 14.897 28.2179 15.9874 27.6538 16.5L18.6538 24.5L28.1538 33C28.7179 33.5125 29.141 34.1031 28.577 34.6156C28.0129 35.1281 27.0983 35.1281 26.5342 34.6156L16.4231 25.4281C15.859 24.9156 15.859 24.0845 16.4231 23.5719L26.5342 14.3844C27.0983 13.8719 28.0129 13.8719 28.577 14.3844Z"
        fill="currentColor"
      />
    </svg>
  )
}

export function CloseIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden>
      <path
        d="M0.170382 0.314519L0.237974 0.237974C0.530872 -0.0549164 0.991746 -0.077447 1.31048 0.170382L1.38703 0.237974L6.5 5.35031L11.613 0.237974C11.9303 -0.0793239 12.4447 -0.0793239 12.762 0.237974C13.0793 0.555279 13.0793 1.06972 12.762 1.38703L7.64969 6.5L12.762 11.613C13.0549 11.9059 13.0774 12.3667 12.8296 12.6855L12.762 12.762C12.4691 13.0549 12.0083 13.0774 11.6895 12.8296L11.613 12.762L6.5 7.64969L1.38703 12.762C1.06972 13.0793 0.555279 13.0793 0.237974 12.762C-0.0793239 12.4447 -0.0793239 11.9303 0.237974 11.613L5.35031 6.5L0.237974 1.38703C-0.0549164 1.09413 -0.077447 0.633255 0.170382 0.314519Z"
        fill="currentColor"
      />
    </svg>
  )
}

export function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <circle cx="8.5" cy="8.5" r="6.5" {...stroke} strokeWidth={2.4} />
      <path d="M13.5 13.5L18 18" {...stroke} strokeWidth={2.4} />
    </svg>
  )
}

/** 하단 네비: 숏폼(비디오) */
export function VideoNavIcon() {
  return (
    <svg width="30" height="21" viewBox="46 20 30 21" fill="none" aria-hidden>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M48.9268 20H73.0732C75.0244 20 76 21.12 76 23.36V37.64C76 39.88 75.0244 41 73.0732 41H48.9268C46.9756 41 46 39.88 46 37.64V23.36C46 21.12 46.9756 20 48.9268 20ZM58.0732 25.04V35.96L66.122 30.5L58.0732 25.04Z"
        fill="currentColor"
      />
    </svg>
  )
}

/** 하단 네비: 지도 */
export function MapNavIcon() {
  return (
    <svg width="26" height="23.5" viewBox="167 19 26 23.5" fill="none" aria-hidden>
      <path
        d="M168 23.6922L176 19.9999L184 23.6922L192 19.9999V37.8461L184 41.5384L176 37.8461L168 41.5384V23.6922ZM176 20V37.8462M184 23.6923V41.5385"
        {...stroke}
        strokeWidth={1.84615}
      />
    </svg>
  )
}

/** 하단 네비: 퀘스트(깃발) */
export function FlagNavIcon() {
  return (
    <svg width="22.6" height="25.2" viewBox="287 18 22.6 25.2" fill="none" aria-hidden>
      <path
        d="M288 19V42.1737M288 22.5404C295.081 17.3907 301.196 27.6902 308.599 22.5404V35.0929C301.196 40.2426 295.081 29.9432 288 35.0929"
        {...stroke}
        strokeWidth={1.93114}
      />
    </svg>
  )
}

/* 사장님 모드 하단 네비 (디자인 시스템 아이콘 톤에 맞춘 선 아이콘) */
const navStroke = { ...stroke, strokeWidth: 1.9 } as const

export function HomeNavIcon() {
  return (
    <svg width="26" height="24" viewBox="0 0 26 24" fill="none" aria-hidden>
      <path d="M2 11.5 13 2l11 9.5M5 9v13h6v-7h4v7h6V9" {...navStroke} />
    </svg>
  )
}

export function TicketNavIcon() {
  return (
    <svg width="28" height="22" viewBox="0 0 28 22" fill="none" aria-hidden>
      <path
        d="M2 4a2 2 0 0 1 2-2h20a2 2 0 0 1 2 2v4a3 3 0 0 0 0 6v4a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-4a3 3 0 0 0 0-6V4ZM10 2v18"
        {...navStroke}
      />
    </svg>
  )
}

export function ScanNavIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M2 7V4a2 2 0 0 1 2-2h3M17 2h3a2 2 0 0 1 2 2v3M22 17v3a2 2 0 0 1-2 2h-3M7 22H4a2 2 0 0 1-2-2v-3M7 12.5l3.2 3L17 9" {...navStroke} />
    </svg>
  )
}

export function ChartNavIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M2 22h20M5 22V13M10.5 22V5M16 22v-7.5M21 22V9" {...navStroke} />
    </svg>
  )
}

/* 숏폼 플레이어 (Figma 3:203 오른쪽 아이콘 톤) */
export function BookmarkIcon({ filled = false }: { filled?: boolean }) {
  return (
    <svg width="22" height="26" viewBox="0 0 20 23" fill={filled ? 'currentColor' : 'none'} aria-hidden>
      <path d="M19 1H1V22L10 13L19 22V1Z" {...stroke} />
    </svg>
  )
}

/** 위치 보기: 지도 핀 모양 */
export function LocationIcon() {
  return (
    <svg width="22" height="26" viewBox="0 0 22 26" fill="none" aria-hidden>
      <path d="M11 24.5s8.5-7.6 8.5-14A8.5 8.5 0 0 0 2.5 10.5c0 6.4 8.5 14 8.5 14Z" {...stroke} />
      <circle cx="11" cy="10.5" r="3" {...stroke} />
    </svg>
  )
}

/** 공유: 위로 나가는 화살표 + 상자 */
export function ShareIcon() {
  return (
    <svg width="22" height="24" viewBox="0 0 22 24" fill="none" aria-hidden>
      <path d="M11 15V2.5M6.5 7 11 2.5 15.5 7M6 11H4.5A1.5 1.5 0 0 0 3 12.5v8A1.5 1.5 0 0 0 4.5 22h13a1.5 1.5 0 0 0 1.5-1.5v-8a1.5 1.5 0 0 0-1.5-1.5H16" {...stroke} />
    </svg>
  )
}

export function SoundIcon({ muted }: { muted: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 9v6h4l5 4V5L8 9H4Z" {...stroke} fill="currentColor" />
      {muted ? <path d="m17 9 5 6M22 9l-5 6" {...stroke} /> : <path d="M17 8.5a5 5 0 0 1 0 7M19.5 6a8.5 8.5 0 0 1 0 12" {...stroke} />}
    </svg>
  )
}

export function PlayIcon() {
  return (
    <svg width="34" height="38" viewBox="0 0 34 38" aria-hidden>
      <path d="M4 3.5v31c0 1.6 1.7 2.5 3 1.6l23.4-15.5a1.9 1.9 0 0 0 0-3.2L7 1.9C5.7 1 4 1.9 4 3.5Z" fill="currentColor" />
    </svg>
  )
}

export function TicketSmallIcon() {
  return (
    <svg width="24" height="20" viewBox="0 0 28 22" fill="none" aria-hidden>
      <path d="M2 4a2 2 0 0 1 2-2h20a2 2 0 0 1 2 2v4a3 3 0 0 0 0 6v4a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-4a3 3 0 0 0 0-6V4ZM10 2v18" {...stroke} />
    </svg>
  )
}
