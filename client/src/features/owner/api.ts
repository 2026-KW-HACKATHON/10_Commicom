import { mockStoreEdit, saveMockStoreEdit } from '@/features/map/mock'
import type { StoreEdit } from '@/features/map/schema'
import { USE_MOCK } from '@/mocks/db'
import { api, request } from '@/shared/api/client'

const wait = (ms = 400) => new Promise((r) => setTimeout(r, ms))

/**
 * 내 가게 정보 편집 (Figma 프로필 > 가게 정보: 프로필 사진·가게명·주소).
 * TODO: 명세에 가게 수정 API 없음 — store 담당과 정해야 함 (임시: PATCH /api/stores/{storeId}, 사진은 multipart)
 */
export async function updateMyStore(storeId: number, patch: StoreEdit, image?: File) {
  if (USE_MOCK) {
    await wait()
    return saveMockStoreEdit(storeId, patch)
  }
  if (image) {
    const form = new FormData()
    form.append('image', image)
    await request(api.patch(`/api/stores/${storeId}/image`, form))
  }
  const { thumbnailUrl: _t, ...body } = patch
  return request(api.patch(`/api/stores/${storeId}`, body))
}

/**
 * 사장님 가입 때 가게 등록.
 * TODO: 명세에 가게 등록 API 없음 (임시: POST /api/stores). 목업은 사장님 가게가 1곳(광운 카페)이라 그 가게 정보를 바꿈
 */
export async function registerMyStore(storeId: number, store: StoreEdit, image?: File) {
  if (USE_MOCK) {
    await wait()
    return saveMockStoreEdit(storeId, store)
  }
  const form = new FormData()
  form.append('data', new Blob([JSON.stringify(store)], { type: 'application/json' }))
  if (image) form.append('image', image)
  return request(api.post('/api/stores', form))
}

/** 편집 화면 초기값: 도로명·상세주소를 나눠 둔 값 (목업만 보관, 서버는 address 하나) */
export function storeEditOf(storeId: number): StoreEdit {
  return USE_MOCK ? mockStoreEdit(storeId) : {}
}
