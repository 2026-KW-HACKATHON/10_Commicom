import { useLocation } from 'react-router-dom'

/** 이벤트 · 공지사항은 손님·사장님 화면 모두 같은 화면을 씀 → 지금 주소 기준으로 목록·상세 주소를 만듦 */
export function useNewsBase() {
  const { pathname } = useLocation()
  return pathname.startsWith('/owner') ? '/owner/events' : '/events'
}
