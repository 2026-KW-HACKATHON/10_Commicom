import { useNavigate } from 'react-router-dom'
import pigeonStar from '@/assets/event/pigeon-star.png'
import { canUseOwnerMode } from '@/features/auth/schema'
import { useMe } from '@/stores/authStore'
import { useModeStore } from '@/stores/modeStore'
import { toast } from '@/stores/toastStore'
import { useEarlyOwnerEvent, type EarlyOwnerEvent } from '../api'

const STEPS = [
  { title: '사장님으로 가입하고 가게 등록', desc: '잇다에 우리 가게를 등록해요' },
  { title: '쿠폰 발행 → "비둘기 레벨업 보상에 포함" 체크', desc: '손님이 비둘기를 레벨업하면 우리 쿠폰이 나가요' },
  { title: '발행하는 순간 혜택 자동 적용', desc: '잇다 PRO + 퀘스트 가게 등록을 바로 쓸 수 있어요' },
]

function startText(iso: string) {
  const d = new Date(iso)
  return `${d.getMonth() + 1}월 ${d.getDate()}일`
}

/** 진행 상태 배지 + 선착순 남은 자리 */
function EventStatus({ event }: { event: EarlyOwnerEvent }) {
  if (event.status === 'UPCOMING') {
    return <p className="mt-3 rounded-full bg-white/20 px-3 py-1.5 text-center text-[13px] font-bold">{startText(event.startsAt)}부터 시작해요</p>
  }
  if (event.status === 'CLOSED') {
    return <p className="mt-3 rounded-full bg-white/20 px-3 py-1.5 text-center text-[13px] font-bold">선착순 {event.limit}명이 모두 채워져 마감됐어요</p>
  }
  return (
    <div className="mt-3">
      <div className="flex items-baseline justify-between text-[13px] font-bold">
        <span>진행 중</span>
        <span>
          남은 자리 <b className="text-[18px] text-point-yellow">{event.remaining}</b> / {event.limit}
        </span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/25">
        <div className="h-full rounded-full bg-point-yellow" style={{ width: `${(event.joined / event.limit) * 100}%` }} />
      </div>
    </div>
  )
}

/** 메뉴 → 이벤트: 지금은 초기 사장님 이벤트 하나 */
export function EventList() {
  const { data: event } = useEarlyOwnerEvent()
  const navigate = useNavigate()
  const me = useMe()
  const { mode, setMode } = useModeStore()

  const join = () => {
    if (mode === 'OWNER') return navigate('/owner/coupons/new')
    if (!canUseOwnerMode(me)) return toast('사장님 계정으로 로그인하면 참여할 수 있어요')
    setMode('OWNER')
    navigate('/owner/coupons/new')
  }

  return (
    <div className="h-full overflow-y-auto px-5 pt-4 pb-10">
      {!event && <div className="h-64 animate-pulse rounded-3xl bg-q-panel" />}
      {event && (
        <article aria-label="초기 사장님 이벤트" className="overflow-hidden rounded-3xl bg-white shadow-[0_8px_24px_rgba(8,104,22,0.12)]">
          <div className="bg-gradient-to-br from-green-6 to-green-4 px-5 pt-5 pb-5 text-white">
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <span className="rounded-full bg-point-yellow px-2 py-0.5 text-[10px] font-extrabold tracking-wider text-green-6">EVENT</span>
                <h2 className="mt-2 text-[22px] leading-tight font-bold">초기 사장님 {event.limit}명 이벤트</h2>
                <p className="mt-1 text-[13px] text-white/85">
                  선착순 {event.limit}곳에 잇다 PRO + 퀘스트 가게 등록 {Math.round(event.benefitDays / 30)}개월 무료
                </p>
              </div>
              <img src={pigeonStar} alt="" className="size-[86px] shrink-0 object-contain drop-shadow-lg" />
            </div>
            <EventStatus event={event} />
          </div>

          <div className="px-5 py-5">
            <h3 className="text-[13px] font-bold text-q-muted">혜택</h3>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div className="rounded-2xl bg-q-mint px-3 py-3">
                <p className="text-[15px] font-bold text-green-6">⭐ 잇다 PRO</p>
                <p className="mt-0.5 text-[11px] leading-snug text-q-sub">피드 우선 노출 · 게시물 재수정 · 원본 다운로드</p>
              </div>
              <div className="rounded-2xl bg-q-mint px-3 py-3">
                <p className="text-[15px] font-bold text-green-6">🚩 퀘스트 가게</p>
                <p className="mt-0.5 text-[11px] leading-snug text-q-sub">방문 인증 퀘스트로 동네 손님이 찾아와요</p>
              </div>
            </div>

            <h3 className="mt-5 text-[13px] font-bold text-q-muted">참여 방법</h3>
            <ol className="mt-2 flex flex-col gap-2">
              {STEPS.map((s, i) => (
                <li key={s.title} className="flex gap-3 rounded-2xl bg-q-panel px-4 py-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-green-6 text-[12px] font-bold text-white">{i + 1}</span>
                  <span>
                    <span className="block text-[14px] font-bold text-q-text">{s.title}</span>
                    <span className="block text-[12px] text-q-muted">{s.desc}</span>
                  </span>
                </li>
              ))}
            </ol>

            <div className="mt-5 rounded-2xl border border-dashed border-point-orange bg-point-yellow/15 px-4 py-3 text-[12px] leading-relaxed text-q-sub">
              <b className="text-point-red-dark">쿠폰을 많이 내놓을수록 손님이 더 와요!</b>
              <br />
              레벨업 보상 쿠폰은 남은 수량만큼 추첨해서 나가요. 쿠폰 교환권을 들고 기다리는 손님에게도 바로 전달돼요.
            </div>

            <ul className="mt-4 list-disc pl-4 text-[11px] leading-relaxed text-q-muted">
              <li>{startText(event.startsAt)}부터 비둘기 보상 쿠폰을 처음 발행한 가게 순서로 {event.limit}곳까지예요.</li>
              <li>가게당 한 번이에요. 이미 PRO·퀘스트 가게를 쓰고 있으면 남은 기간 뒤로 늘려 드려요.</li>
              <li>선착순이 채워지면 이벤트가 끝나요.</li>
            </ul>

            <button
              type="button"
              disabled={event.status === 'CLOSED'}
              onClick={join}
              className="mt-5 h-[52px] w-full rounded-full bg-green-6 text-[15px] font-bold text-white active:bg-green-6/90 disabled:opacity-40"
            >
              {event.status === 'CLOSED' ? '마감된 이벤트예요' : mode === 'OWNER' ? '쿠폰 발행하러 가기' : '사장님으로 참여하기'}
            </button>
          </div>
        </article>
      )}
    </div>
  )
}
