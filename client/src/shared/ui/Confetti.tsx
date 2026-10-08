import { useState, type CSSProperties } from 'react'

const COLORS = ['#086816', '#3cb371', '#94db96', '#ffd166', '#f4a261', '#e76f51']
const COUNT = 36

/**
 * 화면 가운데에서 터지는 폭죽. 다시 터뜨리려면 key를 바꿔서 새로 그리기.
 * 클릭을 막지 않도록 pointer-events 없음.
 */
export function ConfettiBurst() {
  // 조각마다 날아갈 방향·거리·회전을 한 번만 정함
  const [pieces] = useState(() =>
    Array.from({ length: COUNT }, (_, i) => {
      const angle = (i / COUNT) * Math.PI * 2 + Math.random() * 0.5
      const distance = 90 + Math.random() * 110
      return {
        color: COLORS[i % COLORS.length],
        round: Math.random() < 0.35,
        style: {
          '--dx': `${Math.cos(angle) * distance}px`,
          '--dy': `${Math.sin(angle) * distance - 40}px`,
          '--rot': `${Math.random() * 720 - 360}deg`,
          animationDelay: `${Math.random() * 80}ms`,
        } as CSSProperties,
      }
    }),
  )

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[60] flex items-center justify-center overflow-hidden">
      <div className="relative">
        {pieces.map((p, i) => (
          <span
            key={i}
            style={{ ...p.style, backgroundColor: p.color }}
            className={`absolute top-0 left-0 animate-[confetti_1.1s_cubic-bezier(.15,.7,.3,1)_forwards] ${
              p.round ? 'size-2 rounded-full' : 'h-3 w-1.5 rounded-[2px]'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
