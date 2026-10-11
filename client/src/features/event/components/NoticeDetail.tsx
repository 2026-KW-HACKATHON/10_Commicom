import { Link, useParams } from 'react-router-dom'
import { NOTICES, noticeDateText } from '../data'
import { useNewsBase } from '../useNewsBase'

/** 공지사항 상세 */
export function NoticeDetail() {
  const { noticeId } = useParams()
  const base = useNewsBase()
  const notice = NOTICES.find((n) => n.id === noticeId)

  if (!notice) {
    return (
      <div className="px-5 pt-16 text-center text-sm text-q-muted">
        공지사항을 찾을 수 없어요.
        <br />
        <Link to={base} className="mt-3 inline-block font-bold text-green-6 underline">
          공지사항 목록으로
        </Link>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto px-5 pt-4 pb-10">
      <article className="overflow-hidden rounded-3xl bg-white shadow-[0_8px_24px_rgba(8,104,22,0.12)]">
        <header className="flex items-center gap-3 bg-q-mint px-5 py-5">
          <div className="min-w-0 flex-1">
            {notice.pinned && <span className="rounded-full bg-point-red px-2 py-0.5 text-[10px] font-bold text-white">공지</span>}
            <h2 className="mt-1.5 text-[20px] leading-snug font-bold text-q-text">{notice.title}</h2>
            <p className="mt-1 text-[12px] text-q-muted">잇다 · {noticeDateText(notice.date)}</p>
          </div>
          <img src={notice.image} alt="" className="size-[72px] shrink-0 object-contain" />
        </header>

        <div className="px-5 py-5">
          <p className="text-[14px] leading-relaxed text-q-sub">{notice.intro}</p>
          {notice.sections.map((s) => (
            <section key={s.heading} className="mt-5">
              <h3 className="text-[15px] font-bold text-green-6">{s.heading}</h3>
              <ul className="mt-2 flex flex-col gap-2">
                {s.lines.map((line) => (
                  <li key={line.title} className="flex items-center gap-3 rounded-2xl bg-q-panel py-2.5 pr-4 pl-2.5">
                    <span aria-hidden className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-white">
                      <img src={line.image} alt="" className="size-11 object-contain" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[14px] font-bold text-q-text">{line.title}</span>
                      <span className="block text-[12px] leading-snug text-q-sub">{line.desc}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
          {notice.outro && <p className="mt-5 text-[13px] leading-relaxed text-q-sub">{notice.outro}</p>}
        </div>
      </article>
    </div>
  )
}
