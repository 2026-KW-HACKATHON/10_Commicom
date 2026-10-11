import { useState } from 'react'
import pigeon from '@/assets/quest/pigeon-verified.png'
import { IS_BETA } from '@/shared/lib/beta'
import { Sheet } from '@/shared/ui/Sheet'
import { useModeStore } from '@/stores/modeStore'
import { toast } from '@/stores/toastStore'

const MAX = 1000

/**
 * 의견 남기기 → POST /api/feedback (로그인 없이, 베타 체험 중에도 실제 서버로).
 * 체험 계정의 목업 토큰이 붙지 않게 axios 대신 fetch
 */
async function postFeedback(body: { rating: number; good: string; bad: string; mode: string; beta: boolean }) {
  const res = await fetch('/api/feedback', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  const json = (await res.json().catch(() => ({}))) as { isSuccess?: boolean; message?: string }
  if (!res.ok || !json.isSuccess) throw new Error(json.message ?? '의견을 보내지 못했어요. 잠시 후 다시 시도해 주세요')
}

export function FeedbackSheet({ onClose }: { onClose: () => void }) {
  const mode = useModeStore((s) => s.mode)
  const [rating, setRating] = useState(0)
  const [good, setGood] = useState('')
  const [bad, setBad] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    if (rating === 0) return setError('별점을 골라 주세요')
    setSending(true)
    setError(null)
    try {
      await postFeedback({ rating, good: good.trim(), bad: bad.trim(), mode: mode === 'OWNER' ? 'OWNER' : 'USER', beta: IS_BETA })
      toast('소중한 의견 고마워요! 🕊')
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : '의견을 보내지 못했어요')
    } finally {
      setSending(false)
    }
  }

  return (
    <Sheet title="의견 남기기" onClose={onClose}>
      <div className="flex items-center gap-3 rounded-2xl bg-q-mint py-2 pr-4 pl-2">
        <img src={pigeon} alt="" className="size-14 shrink-0 object-contain" />
        <p className="text-[13px] leading-snug text-q-sub">
          잇다를 써 보니 어떠셨나요? 남겨 주신 의견은 잇다 팀이 하나하나 읽고 더 좋은 앱으로 만들게요.
        </p>
      </div>

      <p className="mt-5 text-[13px] font-bold text-q-text">만족도</p>
      <div role="radiogroup" aria-label="별점" className="mt-2 flex justify-center gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={rating === n}
            aria-label={`${n}점`}
            onClick={() => setRating(n)}
            className={`text-[36px] leading-none transition-transform active:scale-90 ${n <= rating ? 'text-point-yellow' : 'text-q-line'}`}
          >
            ★
          </button>
        ))}
      </div>

      <label className="mt-5 block">
        <span className="text-[13px] font-bold text-q-text">좋았던 점</span>
        <textarea
          value={good}
          maxLength={MAX}
          onChange={(e) => setGood(e.target.value)}
          rows={3}
          placeholder="예) 비둘기 키우는 게 재밌어요"
          className="mt-1.5 w-full resize-none rounded-2xl border border-q-line bg-white px-4 py-3 text-[14px] outline-none focus:border-green-4"
        />
      </label>
      <label className="mt-3 block">
        <span className="text-[13px] font-bold text-q-text">아쉬운 점 · 바라는 기능</span>
        <textarea
          value={bad}
          maxLength={MAX}
          onChange={(e) => setBad(e.target.value)}
          rows={3}
          placeholder="예) 우리 동네 가게가 더 많았으면 좋겠어요"
          className="mt-1.5 w-full resize-none rounded-2xl border border-q-line bg-white px-4 py-3 text-[14px] outline-none focus:border-green-4"
        />
      </label>

      {error && (
        <p role="alert" className="mt-3 text-center text-[13px] font-medium text-point-red-dark">
          {error}
        </p>
      )}
      <button
        type="button"
        disabled={sending}
        onClick={submit}
        className="mt-4 h-[52px] w-full rounded-full bg-green-6 text-[15px] font-bold text-white active:bg-green-6/90 disabled:opacity-50"
      >
        {sending ? '보내는 중...' : '의견 보내기'}
      </button>
    </Sheet>
  )
}
