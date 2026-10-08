import { fetchStores } from '@/features/map/api'
import type { StoreSummary } from '@/features/map/schema'
import { useProStore } from '@/features/pro/store'
import { mockFor, mockOwnerStoreId, USE_MOCK } from '@/mocks/db'
import { api, request } from '@/shared/api/client'
import { errorCode } from '@/shared/lib/error'
import { allMockShortforms, isHiddenShortform, removeMockShortform } from './mock'
import { FEED_PAGE_SIZE, type Shortform, type ShortformListResult } from './schema'
import { useLocalScrapStore } from './scrapStore'

/** 목업: PRO 구독 중인 가게. 목업 PRO는 기기 저장이라 이 기기의 사장님 가게만 해당 */
function mockProStoreIds() {
  const { expiresAt } = useProStore.getState()
  return new Set(expiresAt && Date.parse(expiresAt) > Date.now() ? [mockOwnerStoreId()] : [])
}

/** 목업 목록을 명세 페이지 형식으로 자르기 */
function pageOf(list: Shortform[], page: number, size: number): ShortformListResult {
  return { totalCount: list.length, page, size, hasNext: (page + 1) * size < list.length, shortforms: list.slice(page * size, (page + 1) * size) }
}

/** 서버 숏폼 피드 응답 (명세 shortforms[]) */
interface ServerShortform {
  shortformId: number
  storeId: number
  storeName: string
  /** AI 생성 게시물 사진 (첫 장) */
  imageUrl: string | null
  /** 옆으로 넘겨 볼 사진 전체 */
  imageUrls?: string[]
  title: string
  /** 게시물 소개 글 (사장님 어필을 AI가 다듬은 문장, 없으면 null) */
  caption?: string | null
  createdAt: string
  /** PRO 가게 영상 (서버가 피드 앞쪽에 둠) */
  promoted?: boolean
}
type ServerPage = Omit<ShortformListResult, 'shortforms'> & { shortforms: ServerShortform[] }

/**
 * 서버 응답 → 화면용 숏폼. 서버엔 업종·주소·메뉴가 없어 가게 목록에서 업종·주소를 채움.
 * TODO: 숏폼 담당이 피드 응답에 업종·주소·메뉴를 넣어 주면 가게 목록 조회 없이 바로 사용
 */
function toShortform(s: ServerShortform, stores: StoreSummary[]): Shortform {
  const store = stores.find((x) => x.storeId === s.storeId)
  return {
    shortformId: s.shortformId,
    storeId: s.storeId,
    storeName: store?.name ?? s.storeName,
    category: store?.category ?? '',
    categoryName: store?.categoryName ?? '',
    address: store?.address ?? '',
    menus: [],
    description: s.caption || s.title,
    posterUrl: s.imageUrl,
    images: s.imageUrls,
    createdAt: s.createdAt,
    promoted: s.promoted,
  }
}

/** 서버 페이지를 화면용으로 (삭제가 목업이면 이 기기에서 지운 영상은 숨김) */
async function fromServer(res: ServerPage): Promise<ShortformListResult> {
  const { stores } = await fetchStores()
  const list = res.shortforms.filter((s) => !(mockFor('shortformManage') && isHiddenShortform(s.shortformId)))
  return { ...res, shortforms: list.map((s) => toShortform(s, stores)) }
}

/** GET /api/shortforms?storeId&page&size — 숏폼 피드 (페이지 단위) */
export async function fetchShortforms(storeId?: number, page = 0, size = FEED_PAGE_SIZE): Promise<ShortformListResult> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, page > 0 ? 500 : 0))
    // PRO 혜택 "숏폼 우선 노출": PRO 가게 영상을 앞으로 (서버는 GET /api/shortforms 가 정렬)
    const pro = mockProStoreIds()
    const all = allMockShortforms().map((s) => (pro.has(s.storeId) ? { ...s, promoted: true } : s))
    const rank = (s: Shortform) => (storeId ? Number(s.storeId === storeId) * 2 : 0) + Number(!!s.promoted)
    // 특정 가게에서 들어오면 그 가게 영상이 가장 앞, 그다음 PRO 가게 (같은 순위끼리는 원래 순서 유지)
    return pageOf([...all].sort((a, b) => rank(b) - rank(a)), page, size)
  }
  return fromServer(await request<ServerPage>(api.get('/api/shortforms', { params: { ...(storeId ? { storeId } : {}), page, size } })))
}

/** 내 가게 영상만 (사장님 "내 영상"·가게 프로필). 한 가게 영상은 많지 않아 한 번에 받음 */
export async function fetchStoreShortforms(storeId: number): Promise<ShortformListResult> {
  if (USE_MOCK) return pageOf(allMockShortforms().filter((s) => s.storeId === storeId), 0, 100)
  return fromServer(await request<ServerPage>(api.get('/api/shortforms', { params: { storeId, page: 0, size: 100 } })))
}

/** DELETE /api/shortforms/{id} — 올린 게시물 지우기 (내 가게만, 손님 스크랩도 같이 지워짐) */
export async function deleteStoreShortform(shortformId: number) {
  if (mockFor('shortformManage')) {
    await new Promise((r) => setTimeout(r, 300))
    return removeMockShortform(shortformId)
  }
  return request(api.delete(`/api/shortforms/${shortformId}`))
}

/* 숏폼 스크랩 (피드의 🔖) — 로그인 필요. 목업이면 이 기기에 저장 */

/** GET /api/scraps/shortforms — 스크랩한 순서(최신순) */
export async function fetchScrappedShortforms(): Promise<Shortform[]> {
  if (mockFor('scrap')) {
    const { shortforms } = await fetchShortforms(undefined, 0, 100)
    return useLocalScrapStore
      .getState()
      .ids.map((id) => shortforms.find((s) => s.shortformId === id))
      .filter((s) => s !== undefined)
  }
  const res = await request<{ count: number; shortforms: ServerShortform[] }>(api.get('/api/scraps/shortforms'))
  return (await fromServer({ totalCount: res.count, page: 0, size: res.count, hasNext: false, shortforms: res.shortforms })).shortforms
}

/** POST /api/scraps/shortforms — 이미 스크랩했으면(SCRAP409_2, 다른 기기 등) 그대로 둠 */
export async function addShortformScrap(shortformId: number) {
  if (mockFor('scrap')) return useLocalScrapStore.getState().add(shortformId)
  try {
    await request(api.post('/api/scraps/shortforms', { shortformId }))
  } catch (e) {
    if (errorCode(e) !== 'SCRAP409_2') throw e
  }
}

/** DELETE /api/scraps/shortforms/{id} — 이미 취소됐으면(SCRAP404_2) 그대로 둠 */
export async function removeShortformScrap(shortformId: number) {
  if (mockFor('scrap')) return useLocalScrapStore.getState().remove(shortformId)
  try {
    await request(api.delete(`/api/scraps/shortforms/${shortformId}`))
  } catch (e) {
    if (errorCode(e) !== 'SCRAP404_2') throw e
  }
}
