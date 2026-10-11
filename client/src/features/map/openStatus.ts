/**
 * 가게 영업시간 원문 → 지금 영업 중인지.
 * 사장님이 자유롭게 적는 글이라 흔한 모양만 읽고, 못 읽으면 null(표시 안 함).
 * 예) "매일 11:00-21:00", "평일 08:00-22:00 · 주말 10:00-20:00", "화-일 10:00-19:00 (월 휴무)",
 *     "매일 11:00-21:00 (브레이크 15:00-16:30)", "매일 16:00-02:00", "24시간 영업"
 */
export type OpenStatus = 'OPEN' | 'CLOSED'

const DAYS = ['일', '월', '화', '수', '목', '금', '토']
const TIME_RANGE = /(\d{1,2}):(\d{2})\s*[-~]\s*(\d{1,2}):(\d{2})/

const toMinutes = (h: string, m: string) => Number(h) * 60 + Number(m)

/** "매일" / "평일" / "주말" / "화-일" / "월~금" / "토,일" / "월 수 금" → 해당 요일(0=일) */
function daysOf(spec: string): number[] | null {
  if (/매일|연중무휴/.test(spec)) return [0, 1, 2, 3, 4, 5, 6]
  if (/평일/.test(spec)) return [1, 2, 3, 4, 5]
  if (/주말/.test(spec)) return [0, 6]
  const range = spec.match(/([일월화수목금토])\s*[-~]\s*([일월화수목금토])/)
  if (range) {
    const from = DAYS.indexOf(range[1])
    const to = DAYS.indexOf(range[2])
    const out: number[] = []
    for (let d = from; ; d = (d + 1) % 7) {
      out.push(d)
      if (d === to) break
    }
    return out
  }
  const singles = [...spec.matchAll(/[일월화수목금토](?=요일|[\s,·/]|$)/g)].map((m) => DAYS.indexOf(m[0]))
  return singles.length ? singles : null
}

/** 그 요일의 영업 구간 [시작, 끝] (분). 끝이 시작보다 작으면 다음 날 새벽까지 */
function windowsFor(text: string, day: number): [number, number][] | null {
  // 휴무 요일
  const closed = text.match(/\(?\s*([일월화수목금토,\s·]+)\s*(요일)?\s*휴무/)
  if (closed && daysOf(closed[1])?.includes(day)) return []

  const body = text.replace(/\([^)]*\)/g, ' ')
  const segments = body.split(/[·,/|]|\s{2,}/).map((s) => s.trim()).filter(Boolean)
  let found: [number, number][] | null = null
  let general: [number, number] | null = null
  for (const seg of segments) {
    const t = seg.match(TIME_RANGE)
    if (!t) continue
    const range: [number, number] = [toMinutes(t[1], t[2]), toMinutes(t[3], t[4])]
    const days = daysOf(seg.slice(0, t.index))
    if (!days) {
      general ??= range
    } else if (days.includes(day)) {
      found = [range]
    }
  }
  if (found) return found
  return general ? [general] : null
}

export function openStatus(businessHours: string | null | undefined, now = new Date()): OpenStatus | null {
  if (!businessHours) return null
  if (/24\s*시간/.test(businessHours)) return 'OPEN'
  // 한국 시간 기준
  const kst = new Date(now.getTime() + (now.getTimezoneOffset() + 540) * 60_000)
  const day = kst.getDay()
  const minute = kst.getHours() * 60 + kst.getMinutes()

  const inWindows = (d: number, at: number, overnightOnly: boolean) => {
    const wins = windowsFor(businessHours, d)
    if (wins === null) return null
    return wins.some(([s, e]) => (e > s ? !overnightOnly && at >= s && at < e : overnightOnly ? at < e : at >= s))
  }
  const today = inWindows(day, minute, false)
  // 어제 새벽까지 이어지는 영업 (예: 16:00-02:00 의 01:00)
  const yesterday = inWindows((day + 6) % 7, minute, true)
  if (today === null && yesterday === null) return null
  let open = Boolean(today) || Boolean(yesterday)

  // 브레이크 타임
  const brk = businessHours.match(/브레이크[^\d]*(\d{1,2}):(\d{2})\s*[-~]\s*(\d{1,2}):(\d{2})/)
  if (open && brk && minute >= toMinutes(brk[1], brk[2]) && minute < toMinutes(brk[3], brk[4])) open = false
  return open ? 'OPEN' : 'CLOSED'
}
