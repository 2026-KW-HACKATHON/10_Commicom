import pigeonWalk from '@/assets/map/pigeon-walk.png'

/** 가게 프로필 사진 (없으면 비둘기) — 사장님 프로필·가게 프로필·회원가입 공통 */
export function StoreAvatar({ url, className = '' }: { url: string | null; className?: string }) {
  return (
    <span className={`flex shrink-0 items-center justify-center overflow-hidden rounded-[22%] bg-[#dfe7d8] ${className}`}>
      {url ? <img src={url} alt="" className="size-full object-cover" /> : <img src={pigeonWalk} alt="" className="size-[78%] object-contain" />}
    </span>
  )
}
