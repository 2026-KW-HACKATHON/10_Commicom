import { useEffect, useRef, useState, type PointerEvent, type RefObject } from 'react'

export type Speed = 'normal' | 'hold' | 'locked'

/** 이만큼 누르고 있으면 2배속 */
const HOLD_MS = 350
/** 2배속 중 아래로 이만큼 내리면 고정 */
const LOCK_DY = 60
/** 길게 누르기 전에 이만큼 움직이면 피드 넘기기(스와이프)로 봄 */
const MOVE_CANCEL = 10

/**
 * 숏폼 꾹 누르기: 누르는 동안 2배속, 누른 채 아래로 내리면 2배속 고정.
 * - 길게 누르기 전에 움직이면 평소처럼 피드 넘기기
 * - 2배속이 켜진 뒤엔 아래로 끌어도 피드가 넘어가지 않게 막음
 */
export function useSpeedPress(
  targetRef: RefObject<HTMLElement | null>,
  videoRef: RefObject<HTMLVideoElement | null>,
  active: boolean,
) {
  const [speed, setSpeed] = useState<Speed>('normal')
  const press = useRef<{ timer: number; x: number; y: number; long: boolean } | null>(null)
  // 길게 누른 뒤 손을 뗄 때 따라오는 click(재생/일시정지)을 무시하기 위함
  const suppressClick = useRef(false)

  // 다른 영상으로 넘어가면 원래 속도로 (렌더 중 이전 값과 비교해 바로 맞춤)
  const [prevActive, setPrevActive] = useState(active)
  if (prevActive !== active) {
    setPrevActive(active)
    if (!active) setSpeed('normal')
  }

  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = speed === 'normal' ? 1 : 2
  }, [speed, videoRef])

  // touchmove를 막으려면 passive가 아닌 리스너가 필요 (React onTouchMove는 passive)
  useEffect(() => {
    const el = targetRef.current
    if (!el) return
    const onTouchMove = (e: TouchEvent) => {
      if (press.current?.long) e.preventDefault()
    }
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    return () => el.removeEventListener('touchmove', onTouchMove)
  }, [targetRef])

  const onPointerDown = (e: PointerEvent) => {
    // 새로 누를 때마다 초기화 (아래로 끌고 떼면 click이 안 와서 표시가 남을 수 있음)
    suppressClick.current = false
    const timer = window.setTimeout(() => {
      if (!press.current) return
      press.current.long = true
      setSpeed((s) => (s === 'locked' ? 'locked' : 'hold'))
      videoRef.current?.play().catch(() => {})
    }, HOLD_MS)
    press.current = { timer, x: e.clientX, y: e.clientY, long: false }
  }

  const onPointerMove = (e: PointerEvent) => {
    const p = press.current
    if (!p) return
    const dx = e.clientX - p.x
    const dy = e.clientY - p.y
    if (!p.long) {
      if (Math.hypot(dx, dy) > MOVE_CANCEL) {
        window.clearTimeout(p.timer)
        press.current = null
      }
      return
    }
    if (dy > LOCK_DY) setSpeed('locked')
  }

  const end = () => {
    const p = press.current
    if (!p) return
    window.clearTimeout(p.timer)
    if (p.long) {
      suppressClick.current = true
      setSpeed((s) => (s === 'hold' ? 'normal' : s))
    }
    press.current = null
  }

  /** click 핸들러 맨 앞에서 호출: 길게 누른 뒤의 click이면 true (무시) */
  const consumeClick = () => {
    if (!suppressClick.current) return false
    suppressClick.current = false
    return true
  }

  return {
    speed,
    unlock: () => setSpeed('normal'),
    consumeClick,
    pressHandlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: end,
      onPointerCancel: end,
      onPointerLeave: end,
      // 길게 누를 때 뜨는 브라우저 메뉴(이미지 저장 등) 막기
      onContextMenu: (e: { preventDefault: () => void }) => e.preventDefault(),
    },
  }
}
