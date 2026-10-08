import { useState, type ReactNode } from 'react'
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

/** 지도 하단 시트 (Figma 83:2): 가게 검색 + 업종 6종. 손잡이를 눌러 펼치기/접기 */
export function MapBottomSheet({
  keyword,
  onKeywordChange,
  category,
  onCategoryChange,
  results,
  onSelectStore,
  floating,
}: Props) {
  const [expanded, setExpanded] = useState(false)
  const searching = keyword.trim().length > 0

  return (
    <section className="absolute inset-x-0 bottom-0 z-20 border-t border-green-1 bg-white px-5 pt-4 pb-4">
      {floating && <div className="absolute right-4 bottom-full mb-3">{floating}</div>}

      <button
        type="button"
        aria-label={expanded ? '시트 접기' : '시트 펼치기'}
        aria-expanded={expanded}
        className="mx-auto mb-3 block h-2 w-[101px] py-[3px]"
        onClick={() => setExpanded((v) => !v)}
      >
        <span className="block h-0.5 rounded-full bg-handle" />
      </button>

      <label className="flex h-[52px] items-center gap-3 rounded-full border border-[#e6e8e6] bg-white px-5 shadow-[0_0_10px_rgba(0,0,0,0.04)]">
        <span className="text-[#6c727a]">
          <SearchIcon />
        </span>
        <input
          value={keyword}
          onChange={(e) => onKeywordChange(e.target.value)}
          onFocus={() => setExpanded(true)}
          placeholder="가게 이름을 검색해 보세요"
          className="w-full bg-transparent text-base text-ink outline-none placeholder:text-[#8a9097]"
        />
      </label>

      {expanded &&
        (searching ? (
          <ul className="mt-3 max-h-56 overflow-y-auto">
            {results.length === 0 && (
              <li className="py-6 text-center text-sm text-gray-2">검색 결과가 없어요</li>
            )}
            {results.map((store) => (
              <li key={store.storeId}>
                <button
                  type="button"
                  className="w-full border-b border-gray-1 py-3 text-left"
                  onClick={() => onSelectStore(store)}
                >
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
                    <span className={`text-[15px] text-green-6 ${active ? 'font-semibold' : ''}`}>
                      {c.label}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        ))}
    </section>
  )
}
