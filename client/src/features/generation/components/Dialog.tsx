/** 비둘기 그림이 들어간 확인 창 (숏폼 만들기·내 영상 공통, Figma 9:1033 등) */
export function Dialog({
  title,
  text,
  image,
  primary,
  secondary,
}: {
  title: string
  text?: string
  image: string
  primary: { label: string; onClick: () => void }
  secondary: { label: string; onClick: () => void }
}) {
  return (
    <div role="dialog" aria-modal aria-label={title} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-10">
      <div className="w-full max-w-[300px] animate-[rise-center_.3s_ease-out] rounded-3xl bg-white px-6 pt-7 pb-6 text-center shadow-2xl">
        <p className="text-[18px] font-bold text-ink">{title}</p>
        {text && <p className="mt-1.5 text-[13px] leading-relaxed text-q-muted">{text}</p>}
        <img src={image} alt="" className="mx-auto mt-4 w-[180px] rounded-2xl object-cover" />
        <div className="mt-5 flex flex-col gap-2">
          <button type="button" onClick={primary.onClick} className="h-11 rounded-xl bg-q-panel text-[15px] font-bold text-green-4">
            {primary.label}
          </button>
          <button type="button" onClick={secondary.onClick} className="h-11 rounded-xl bg-q-panel text-[15px] font-bold text-green-4">
            {secondary.label}
          </button>
        </div>
      </div>
    </div>
  )
}
