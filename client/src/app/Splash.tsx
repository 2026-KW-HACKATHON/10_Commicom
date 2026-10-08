import { useState } from 'react'
import logo from '@/assets/logo-itda.svg'

const SHOWN_KEY = 'itda-splash-shown'
/** 전체 길이: 로고 0.5s → 덩어리 퍼짐 1.1s → 사라짐 0.4s */
const TOTAL_MS = 2300

/** 이번 접속에서 이미 봤으면 다시 안 보여 줌 (새로고침·화면 이동마다 뜨지 않게) */
function shouldShow() {
  try {
    if (sessionStorage.getItem(SHOWN_KEY)) return false
    sessionStorage.setItem(SHOWN_KEY, '1')
  } catch {
    // 저장소를 못 쓰면 그냥 한 번 보여 줌
  }
  return true
}
// 앱을 열 때 한 번만 판단 (StrictMode에서 초기값 함수가 두 번 돌아도 결과가 같게)
const SHOW_ON_START = shouldShow()

/**
 * 시작 스플래시 (Figma 온보딩 3:400 → 3:433 → 3:437)
 * 크림색 바탕 + 로고 → 연두색 덩어리가 가운데서 퍼져 화면을 채움 → 앱으로. 누르면 바로 넘어감.
 */
export function Splash() {
  const [visible, setVisible] = useState(SHOW_ON_START)
  if (!visible) return null

  return (
    <div
      role="presentation"
      onClick={() => setVisible(false)}
      onAnimationEnd={(e) => e.animationName === 'splash-out' && setVisible(false)}
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-[#fef9f3]"
      style={{ animation: `splash-out .4s ease-in ${TOTAL_MS - 400}ms forwards` }}
    >
      {/* Figma 홈 2의 울퉁불퉁한 연두 덩어리 */}
      <svg
        aria-hidden
        viewBox="0 0 300 390"
        className="absolute w-[78%] max-w-[340px]"
        style={{ animation: 'splash-blob 1.1s cubic-bezier(.5,0,.3,1) .45s both' }}
      >
        <path
          fill="#e0e5cf"
          d="M110 14c26-4 70 14 104 12 16-1 20-14 32-6 22 16 38 60 40 84 2 24 6 70 6 120 0 40-14 30-16 60-2 30 6 60-24 70-36 12-84 22-120 22-30 0-74-20-92-38-24-24-10-70-16-110-4-30-14-50-18-80-4-34 18-62 46-70 24-6 34-4 46-30 4-10 6-32 12-34Z"
        />
      </svg>
      <span
        className="relative flex items-center rounded-2xl bg-[#e0e5cf] px-3 py-2"
        style={{ animation: 'splash-pop .5s cubic-bezier(.3,1.4,.5,1) both' }}
      >
        <img src={logo} alt="잇다" className="h-12 w-auto" />
      </span>
    </div>
  )
}
