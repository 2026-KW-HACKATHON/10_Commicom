import { Link } from 'react-router-dom'
import { usePigeon, usePigeonAccess, usePigeonAlbum } from '../hooks'
import { breedLabel, PIGEON_BREEDS, PIGEON_EGG_IMAGE, pigeonImage, type AlbumItem } from '../schema'

/** 내 비둘기 앨범 — 졸업한 비둘기 + 지금 키우는 비둘기 */
export function PigeonAlbum() {
  const { needsLogin } = usePigeonAccess()
  const { data: pigeon } = usePigeon()
  const { data, isLoading, isError } = usePigeonAlbum()

  if (needsLogin) return <p className="py-10 text-center text-sm text-q-muted">로그인하면 내 비둘기 앨범을 볼 수 있어요</p>

  return (
    <div className="h-full overflow-y-auto px-5 pt-4 pb-8">
      {pigeon && (
        <Link to="/quest" className="flex items-center gap-3 rounded-2xl border border-q-green bg-q-mint px-4 py-3">
          <img src={pigeonImage(pigeon.level, pigeon.breed)} alt="" className="size-14 object-contain" />
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-bold text-q-green">지금 키우는 {pigeon.generation}번째 비둘기</p>
            <p className="truncate text-[15px] font-bold text-q-text">
              {pigeon.isEgg ? '🥚 아직 알이에요' : `${breedLabel(pigeon.breed)} · Lv. ${pigeon.level}`}
            </p>
          </div>
          <span className="text-q-green">›</span>
        </Link>
      )}

      <h2 className="mt-6 text-[13px] font-bold text-q-text">졸업한 비둘기</h2>
      {isLoading && <div className="mt-3 h-40 animate-pulse rounded-2xl bg-q-panel" />}
      {isError && <p className="py-10 text-center text-sm text-q-muted">앨범을 불러오지 못했어요</p>}
      {data && data.graduates.length === 0 && (
        <div className="mt-3 flex flex-col items-center rounded-2xl bg-q-panel px-6 py-10 text-center">
          <img src={PIGEON_EGG_IMAGE} alt="" className="h-16 w-auto opacity-80" />
          <p className="mt-3 text-sm text-q-muted">
            아직 졸업한 비둘기가 없어요.
            <br />
            Lv.10까지 키우면 졸업해서 여기에 남아요!
          </p>
        </div>
      )}
      {data && data.graduates.length > 0 && (
        <ul className="mt-3 grid grid-cols-2 gap-2.5">
          {data.graduates.map((g) => (
            <li key={g.generation}>
              <GraduateCard item={g} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function GraduateCard({ item }: { item: AlbumItem }) {
  const b = PIGEON_BREEDS[item.breed]
  return (
    <div className="flex flex-col items-center rounded-2xl border border-q-line bg-white px-3 pt-3 pb-3.5 text-center">
      <span className="self-start rounded-full bg-q-mint px-2 py-0.5 text-[11px] font-bold text-q-green">🎓 {item.generation}기</span>
      <img src={b.image} alt="" className="mt-1 h-[96px] w-auto object-contain" />
      <p className="mt-2 text-[14px] font-bold text-q-text">
        {b.emoji} {b.name} 비둘기
      </p>
      <p className="mt-0.5 text-[11px] text-q-muted">
        {dateText(item.graduatedAt)} 졸업 · {item.days}일
      </p>
      {item.rewardCouponCount > 0 && <p className="mt-0.5 text-[11px] font-medium text-q-green">쿠폰 {item.rewardCouponCount}장</p>}
    </div>
  )
}

/** "2026-10-09T..." → "10.9" */
function dateText(iso: string) {
  const d = new Date(iso)
  return `${d.getMonth() + 1}.${d.getDate()}`
}
