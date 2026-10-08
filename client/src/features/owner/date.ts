/** KST 기준 이번 달 "YYYY-MM" */
export function currentMonth() {
  return new Date(Date.now() + 9 * 3_600_000).toISOString().slice(0, 7)
}

export function shiftMonth(month: string, delta: number) {
  const [y, m] = month.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1 + delta, 1)).toISOString().slice(0, 7)
}

/** "2026-10-07T12:30:00+09:00" → "10.7 12:30" */
export function dateTimeText(iso: string) {
  const d = new Date(iso)
  return `${d.getMonth() + 1}.${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export function isToday(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  return d.toDateString() === now.toDateString()
}
