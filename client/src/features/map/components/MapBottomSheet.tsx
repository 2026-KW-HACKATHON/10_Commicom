import { useRef, useState, type PointerEvent, type ReactNode } from 'react'
import { SearchIcon } from '@/shared/ui/icons'
import { MAP_CATEGORIES, type MapCategoryKey, type StoreSummary } from '../schema'

interface Props {
  keyword: string
  onKeywordChange: (keyword: string) => void
  category: MapCategoryKey | null
  onCategoryChange: (category: MapCategoryKey | null) => void
  results: StoreSummary[]
  onSelectStore: (store: StoreSummary) => void
  /** 시트 바로 위에 떠 있는 버튼(내 위치 등) */
  floating?: ReactNode
}

/** peek: 손잡이만 보이게 내림 / collapsed: 검색창 / expanded: 업종·검색 결과까지 */
type SheetState = 'peek' | 'collapsed' | 'expanded'

/** 내렸을 때 남겨 둘 높이 (손잡이를 다시 잡아 올릴 수 있게) */
const PEEK_PX = 30
/** 이만큼 끌면 한 단계 올리거나 내림 */
const SNAP_PX = 40

/**
 * 지도 하단 시트 (Figma 83:2): 가게 검색 + 업종 6종.
 * 손잡이를 아래로 끌면 접히고 끝까지 내리면 손잡이만 남음. 위로 끌거나 누르면 다시 올라옴.
 */
export function MapBottomSheet({
  keyword,
  onKeywordChange,
  category,
  onCategoryChange,
  results,
  onSelectStore,
  floating,
}: Props) {
  const [state, setState] = useState<SheetState>('collapsed')
  const [dragY, setDragY] = useState(0)
  const [dragging, setDragging] = useState(false)
  const drag = useRef<{ startY: number; moved: boolean } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const searching = keyword.trim().length > 0

  const go = (dir: 1 | -1) => {
    // dir 1 = 아래로(접기), -1 = 위로(펼치기)
    const order: SheetState[] = ['expanded', 'collapsed', 'peek']
    const next = order[Math.min(2, Math.max(0, order.indexOf(state) + dir))]
    if (next === 'peek') inputRef.current?.blur()
    setState(next)
  }

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { startY: e.clientY, moved: false }
    setDragging(true)
  }
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return
    const dy = e.clientY - drag.current.startY
    if (Math.abs(dy) > 5) drag.current.moved = true
    // 내린 상태에선 위로만, 펼친 상태에선 아래로만 따라오게
    setDragY(state === 'peek' ? Math.min(0, dy) : Math.max(state === 'expanded' ? 0 : -80, dy))
  }
  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current
    drag.current = null
    setDragY(0)
    setDragging(false)
    if (!d) return
    const dy = e.clientY - d.startY
    if (!d.moved) {
      // 누르기만 하면: 내려가 있으면 올리고, 아니면 펼침 ↔ 접힘
      setState((s) => (s === 'peek' ? 'collapsed' : s === 'collapsed' ? 'expanded' : 'collapsed'))
    } else if (dy > SNAP_PX) go(1)
    else if (dy < -SNAP_PX) go(-1)
  }

  const base = state === 'peek' ? `calc(100% - ${PEEK_PX}px)` : '0px'
  const label = state === 'peek' ? '검색창 올리기' : state === 'collapsed' ? '시트 펼치기' : '시트 접기'

  return (
    <section
      className="absolute inset-x-0 bottom-0 z-20 rounded-t-3xl border-t border-green-1 bg-white px-5 pb-4 shadow-[0_-6px_20px_rgba(8,104,22,0.08)]"
      style={{
        transform: `translateY(calc(${base} + ${dragY}px))`,
        transition: dragging ? 'none' : 'transform 280ms cubic-bezier(.2,.8,.2,1)',
      }}
    >
      {floating && <div className="absolute right-4 bottom-full mb-3">{floating}</div>}

      {/* 손잡이: 끌어서 올리고 내리기 (화면 스크롤과 겹치지 않게 touch-action 끔) */}
      <div
        role="button"
        tabIndex={0}
        aria-label={label}
        aria-expanded={state === 'expanded'}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && go(state === 'peek' ? -1 : state === 'collapsed' ? -1 : 1)}
        className="flex h-[30px] cursor-grab touch-none items-center justify-center active:cursor-grabbing"
      >
        <span className="block h-1 w-12 rounded-full bg-handle" />
      </div>

      <label className="flex h-[52px] items-center gap-3 rounded-full border border-[#e6e8e6] bg-white px-5 shadow-[0_0_10px_rgba(0,0,0,0.04)]">
        <span className="text-[#6c727a]">
          <SearchIcon />
        </span>
        <input
          ref={inputRef}
          value={keyword}
          onChange={(e) => onKeywordChange(e.target.value)}
          onFocus={() => setState('expanded')}
          placeholder="가게 이름을 검색해 보세요"
          className="w-full bg-transparent text-base text-ink outline-none placeholder:text-[#8a9097]"
        />
      </label>

      {state === 'expanded' &&
        (searching ? (
          <ul className="mt-3 max-h-56 overflow-y-auto">
            {results.length === 0 && <li className="py-6 text-center text-sm text-gray-2">검색 결과가 없어요</li>}
            {results.map((store) => (
              <li key={store.storeId}>
                <button type="button" className="w-full border-b border-gray-1 py-3 text-left" onClick={() => onSelectStore(store)}>
                  <p className="text-base font-medium text-ink">{store.name}</p>
                  <p className="text-xs text-gray-2">
                    {store.categoryName} · {store.address}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <ul className="mt-4 grid grid-cols-3 gap-y-3">
            {MAP_CATEGORIES.map((c) => {
              const active = category === c.key
              return (
                <li key={c.key}>
                  <button
                    type="button"
                    aria-pressed={active}
                    className="mx-auto flex w-24 flex-col items-center rounded-2xl pt-1 pb-1.5 transition-colors aria-pressed:bg-mint aria-pressed:ring-1 aria-pressed:ring-mint-line"
                    onClick={() => onCategoryChange(active ? null : c.key)}
                  >
                    <img src={c.icon} alt="" className="h-[68px] w-[68px] object-contain" />
                    <span className={`text-[15px] text-green-6 ${active ? 'font-semibold' : ''}`}>{c.label}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        ))}
    </section>
  )
}
