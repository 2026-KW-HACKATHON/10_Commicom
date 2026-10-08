import { allMockShortforms, publishMockShortform, replaceMockShortform } from '@/features/feed/mock'
import { MOCK_STORES } from '@/features/map/mock'
import { ApiError } from '@/shared/api/client'
import type { GenerationCreated, GenerationRequest, GenerationState, MenuItem, ShortformDetail } from './schema'

/**
 * 숏폼 생성 목업 (VITE_USE_MOCK=true). 새로고침하면 초기화되는 메모리 저장.
 * 생성은 요청 후 약 2초 PENDING → 약 9초까지 PROCESSING → COMPLETED 로 흘러감.
 */
const SAMPLE = {
  imageUrl: '/samples/shortform-sample-poster.jpg',
  frame: { top: 656 / 1920, height: 607 / 1920 },
}

interface Job {
  state: GenerationState
  startedAt: number
  request: GenerationRequest
}

let seq = 9000
const jobs = new Map<number, Job>()
const drafts = new Map<number, ShortformDetail>()
const canceled = new Set<number>()

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))
const now = () => new Date().toISOString().slice(0, 19)

export const mockGenerationApi = {
  async create(body: GenerationRequest): Promise<GenerationCreated> {
    await wait(400)
    const store = MOCK_STORES.find((s) => s.storeId === body.storeId)
    if (!store) throw new ApiError('STORE404', '가게를 찾을 수 없어요')
    const running = [...jobs.values()].some(
      (j) => j.request.storeId === body.storeId && !canceled.has(j.state.generationId) && ['PENDING', 'PROCESSING'].includes(status(j)),
    )
    if (running) throw new ApiError('GENERATION409', '이미 생성 중인 요청이 있어요')
    const generationId = ++seq
    const state: GenerationState = {
      generationId,
      storeId: store.storeId,
      storeName: store.name,
      status: 'PENDING',
      shortformId: null,
      errorMessage: null,
      requestedAt: now(),
    }
    jobs.set(generationId, { state, startedAt: Date.now(), request: body })
    return { ...state }
  },

  async get(generationId: number): Promise<GenerationState> {
    await wait(200)
    const job = jobs.get(generationId)
    if (!job) throw new ApiError('GENERATION404', '생성 요청을 찾을 수 없어요')
    const s = status(job)
    if (s === 'COMPLETED' && job.state.shortformId === null) job.state.shortformId = makeDraft(job)
    return { ...job.state, status: s }
  },

  /** 목업 전용: 대기 화면에서 취소 (명세에 취소 API 없음) */
  cancel(generationId: number) {
    canceled.add(generationId)
  },
}

function status(job: Job): GenerationState['status'] {
  const elapsed = Date.now() - job.startedAt
  if (elapsed < 2000) return 'PENDING'
  if (elapsed < 9000) return 'PROCESSING'
  return 'COMPLETED'
}

function makeDraft(job: Job) {
  const store = MOCK_STORES.find((s) => s.storeId === job.request.storeId)!
  const shortformId = ++seq
  const revision = job.request.revision
  if (revision) {
    // 재수정: 원래 영상(올린 영상이면 피드 목록, 방금 만든 초안이면 drafts)을 바탕으로 요청을 반영한 새 버전
    const base = drafts.get(revision.shortformId)
    const published = allMockShortforms().find((s) => s.shortformId === revision.shortformId)
    const title = base?.title ?? published?.description ?? `동네 사람들이 사랑하는 ${store.name}`
    drafts.set(shortformId, {
      shortformId,
      storeId: store.storeId,
      storeName: store.name,
      storeCategory: store.category,
      storeCategoryName: store.categoryName,
      ...SAMPLE,
      imageUrls: [SAMPLE.imageUrl, ...(job.request.photoUrls ?? [])],
      title: `${title} (수정 요청 반영: ${revision.request})`,
      createdAt: now(),
    })
    return shortformId
  }
  const menuText = (job.request.menus ?? []).slice(0, 2).map((m) => m.name).join(', ')
  const appeal = job.request.appeal?.trim()
  drafts.set(shortformId, {
    shortformId,
    storeId: store.storeId,
    storeName: store.name,
    storeCategory: store.category,
    storeCategoryName: store.categoryName,
    ...SAMPLE,
    imageUrls: [SAMPLE.imageUrl, ...(job.request.photoUrls ?? [])],
    title: `${appeal || `동네 사람들이 사랑하는 ${store.name}`}${menuText ? ` · 대표 메뉴 ${menuText}` : ''}`,
    createdAt: now(),
  })
  return shortformId
}

export const mockShortformApi = {
  async get(shortformId: number): Promise<ShortformDetail> {
    await wait(200)
    const d = drafts.get(shortformId)
    if (!d) throw new ApiError('SHORTFORM404', '게시물을 찾을 수 없어요')
    return { ...d }
  },
  /** 목업 전용: 업로드하면 손님 숏폼 피드 맨 앞에 보이게 */
  async publish(shortformId: number) {
    await wait(500)
    const d = drafts.get(shortformId)
    if (!d) throw new ApiError('SHORTFORM404', '게시물을 찾을 수 없어요')
    publishMockShortform(d)
  },
  async remove(shortformId: number) {
    await wait(300)
    drafts.delete(shortformId)
  },
  /** 목업 전용: 이미 올린 영상(oldId)을 재수정한 새 버전(newId)으로 바꾸기 */
  async replace(oldId: number, newId: number) {
    await wait(500)
    const d = drafts.get(newId)
    if (!d) throw new ApiError('SHORTFORM404', '게시물을 찾을 수 없어요')
    replaceMockShortform(oldId, d)
    drafts.delete(newId)
  },
}

/**
 * 목업 전용: 지도 링크·메뉴판 사진에서 메뉴 읽기 (실제로는 서버 OCR/스크래핑 — 명세에 API 없음).
 * 가게마다 정해 둔 샘플 메뉴를 돌려줌.
 */
const SAMPLE_MENUS: Record<number, MenuItem[]> = {
  1: [{ name: '치즈떡볶이', price: 7000 }, { name: '모둠튀김', price: 5000 }, { name: '마라떡볶이', price: 8000 }],
  2: [{ name: '아메리카노', price: 2500 }, { name: '바닐라라떼', price: 4000 }, { name: '크로플', price: 4500 }],
  3: [{ name: '돈까스', price: 8500 }, { name: '김치볶음밥', price: 7000 }, { name: '라면', price: 4500 }],
}

export async function mockExtractMenus(storeId: number): Promise<MenuItem[]> {
  await wait(1400)
  return (SAMPLE_MENUS[storeId] ?? [{ name: '대표 메뉴', price: null }]).map((m) => ({ ...m }))
}
