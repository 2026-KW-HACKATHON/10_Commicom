import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import pigeonStar from '@/assets/event/pigeon-star.png'
import { useEarlyOwnerEvent } from '../api'

/** 다시 보지 않기 → 이 기기에서 계속 숨김 */
const HIDDEN_KEY = 'itda-early-owner-popup-hidden'

function hiddenForever() {
  try {
    return localStorage.getItem(HIDDEN_KEY) === '1'
  } catch {
    return false
  }
}

/**
 * 사장님 화면에 들어올 때마다 초기 사장님 이벤트 팝업 (마감되면 안 뜸).
 * 닫기: 지금만 닫음 (사장님 화면에 다시 들어오면 또 뜸) / 다시 보지 않기: 이 기기에서 계속 숨김.
 * 이벤트 화면의 [사장님으로 참여하기]로 들어온 경우(state.fromEvent)는 이미 이벤트를 봤으니 띄우지 않음
 * canOpenDetail: 가게 등록 전이면 상세 화면 대신 등록부터 하도록 버튼 문구만 바꿈
 */
export function EarlyOwnerPopup({ canOpenDetail = true }: { canOpenDetail?: boolean }) {
  const { data: event } = useEarlyOwnerEvent()
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(() => !hiddenForever() && !(location.state as { fromEvent?: boolean } | null)?.fromEvent)
  if (!open || !event || event.status === 'CLOSED') return null

  const close = () => setOpen(false)
  const hideForever = () => {
    try {
      localStorage.setItem(HIDDEN_KEY, '1')
    } catch {
      // 저장 못 해도 이번엔 닫힘
    }
    setOpen(false)
  }

  return (
    <div role="dialog" aria-modal aria-label="초기 사장님 이벤트" className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-6">
      <div className="w-full max-w-[360px] animate-[rise-center_.3s_ease-out] overflow-hidden rounded-[28px] bg-white shadow-2xl">
        <div className="relative bg-gradient-to-br from-green-6 to-green-4 px-6 pt-6 pb-5 text-center text-white">
          <span className="rounded-full bg-point-yellow px-2.5 py-0.5 text-[11px] font-extrabold tracking-wider text-green-6">EVENT</span>
          <img src={pigeonStar} alt="" className="mx-auto mt-3 size-[104px] object-contain drop-shadow-lg" />
          <h2 className="mt-2 text-[22px] leading-tight font-bold">초기 사장님 {event.limit}명 이벤트</h2>
          <p className="mt-1.5 text-[13px] leading-relaxed text-white/90">
            비둘기 보상 쿠폰을 처음 발행하면
            <br />
            <b className="text-point-yellow">잇다 PRO + 퀘스트 가게 등록 1개월 무료!</b>
          </p>
          {event.status === 'OPEN' && (
            <p className="mx-auto mt-3 w-fit rounded-full bg-white/20 px-3 py-1 text-[12px] font-bold">
              선착순 남은 자리 <span className="text-point-yellow">{event.remaining}</span> / {event.limit}
            </p>
          )}
        </div>

        <div className="px-5 pt-4 pb-3">
          <button
            type="button"
            onClick={() => {
              close()
              if (canOpenDetail) navigate('/owner/events/early-owner')
            }}
            className="h-[50px] w-full rounded-full bg-green-6 text-[15px] font-bold text-white active:bg-green-6/90"
          >
            {canOpenDetail ? '자세히 보기' : '가게 등록하고 참여하기'}
          </button>
          <div className="mt-2 grid grid-cols-2 text-[13px] font-medium text-q-muted">
            <button type="button" onClick={hideForever} className="h-10 border-r border-q-line">
              다시 보지 않기
            </button>
            <button type="button" onClick={close} className="h-10">
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
