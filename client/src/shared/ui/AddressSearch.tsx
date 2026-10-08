import { useEffect, useRef, useState } from 'react'
import { CloseIcon } from './icons'

/** 다음(카카오) 우편번호 서비스 — 키 없이 쓰는 주소 검색 */
const SCRIPT = 'https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js'

interface PostcodeData {
  roadAddress: string
  jibunAddress: string
  buildingName: string
}
declare global {
  interface Window {
    daum?: { Postcode: new (o: { oncomplete: (d: PostcodeData) => void; width: string; height: string }) => { embed: (el: HTMLElement) => void } }
  }
}

let loading: Promise<void> | null = null
function loadScript() {
  if (window.daum?.Postcode) return Promise.resolve()
  loading ??= new Promise<void>((resolve, reject) => {
    const s = document.createElement('script')
    s.src = SCRIPT
    s.onload = () => resolve()
    s.onerror = () => {
      loading = null
      reject(new Error('주소 검색을 불러오지 못했어요'))
    }
    document.head.appendChild(s)
  })
  return loading
}

/** 주소 검색 창 (화면 아래에서 올라옴). 고르면 도로명 주소를 돌려줌 */
export function AddressSearch({ onSelect, onClose }: { onSelect: (address: string) => void; onClose: () => void }) {
  const box = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    loadScript()
      .then(() => {
        if (!alive || !box.current || !window.daum) return
        new window.daum.Postcode({
          width: '100%',
          height: '100%',
          oncomplete: (d) => onSelect(d.roadAddress || d.jibunAddress),
        }).embed(box.current)
      })
      .catch((e: Error) => alive && setError(e.message))
    return () => {
      alive = false
    }
  }, [onSelect])

  return (
    <div role="dialog" aria-modal aria-label="주소 검색" className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
      <div className="flex h-[78%] w-full max-w-[430px] animate-[rise_.25s_ease-out] flex-col rounded-t-3xl bg-white pt-3">
        <div className="flex items-center justify-between px-5 pb-2">
          <p className="text-[16px] font-bold text-ink">주소 검색</p>
          <button type="button" aria-label="닫기" onClick={onClose} className="flex size-9 items-center justify-center text-q-muted">
            <CloseIcon />
          </button>
        </div>
        {error ? (
          <p className="px-6 py-10 text-center text-sm text-q-muted">
            {error}
            <br />
            주소를 직접 입력해 주세요
          </p>
        ) : (
          <div ref={box} className="min-h-0 flex-1" />
        )}
      </div>
    </div>
  )
}
