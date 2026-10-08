import { useRef, useState, type UIEvent } from 'react'

/** 이만큼 이상 움직여야 방향으로 인정 (손가락 떨림 무시) */
const THRESHOLD_PX = 10
/** 바 크기가 바뀌는 동안(내용 영역 높이도 바뀜)에는 스크롤 방향 판단을 쉼 */
const LOCK_MS = 300

/**
 * 아래로 스크롤하면 true(작게), 위로 스크롤하거나 맨 위면 false(원래대로).
 * 페이지마다 스크롤 상자가 달라서 바깥 요소에 onScrollCapture로 붙여 모든 스크롤을 받음.
 */
export function useShrinkOnScroll(resetKey: string) {
  const [shrunk, setShrunk] = useState(false)
  const [prevKey, setPrevKey] = useState(resetKey)
  const last = useRef(new WeakMap<EventTarget, number>())
  const lockUntil = useRef(0)

  // 화면을 옮기면 원래 크기로
  if (prevKey !== resetKey) {
    setPrevKey(resetKey)
    setShrunk(false)
  }

  const set = (next: boolean) => {
    if (next === shrunk) return
    lockUntil.current = Date.now() + LOCK_MS
    setShrunk(next)
  }

  const onScrollCapture = (e: UIEvent<HTMLElement>) => {
    const el = e.target as HTMLElement
    const top = el.scrollTop
    // 처음 스크롤이면 맨 위(0)에서 출발한 것으로 (숏폼은 한 번에 다음 영상으로 넘어가 이벤트가 한 번뿐일 수 있음)
    const prev = last.current.get(el) ?? 0
    if (Date.now() < lockUntil.current) {
      last.current.set(el, top)
      return
    }
    if (top <= 0) {
      last.current.set(el, top)
      set(false)
      return
    }
    const dy = top - prev
    if (Math.abs(dy) < THRESHOLD_PX) return
    last.current.set(el, top)
    set(dy > 0)
  }

  return { shrunk, onScrollCapture }
}
