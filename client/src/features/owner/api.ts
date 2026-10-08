import { geocodeAddress } from '@/features/map/kakao'
import { mockStoreEdit, saveMockStoreEdit } from '@/features/map/mock'
import type { StoreDetail, StoreEdit } from '@/features/map/schema'
import { mockFor } from '@/mocks/db'
import { api, request } from '@/shared/api/client'

const wait = (ms = 400) => new Promise((r) => setTimeout(r, ms))

/** 서버는 주소를 한 칸으로 받음 (도로명 + 상세주소) */
const joinAddress = (s: StoreEdit) => [s.roadAddress?.trim(), s.addressDetail?.trim()].filter(Boolean).join(' ')

/** 주소가 바뀌면 지도 위치(좌표)도 같이 — 도로명만으로 찾음 (상세주소는 좌표 찾기를 방해함) */
async function addressFields(s: StoreEdit) {
  if (!s.roadAddress?.trim()) return {}
  const { lat, lng } = await geocodeAddress(s.roadAddress.trim())
  return { address: joinAddress(s), latitude: lat, longitude: lng }
}

/** GET /api/stores/me — 로그인한 사장님의 가게 (없으면 STORE404_2) */
export function getMyStore() {
  return request<StoreDetail>(api.get('/api/stores/me'))
}

/**
 * 내 가게 정보 편집 (Figma 프로필 > 가게 정보: 프로필 사진·가게명·주소).
 * PATCH /api/stores/{storeId} (보낸 항목만) + PATCH /api/stores/{storeId}/image (사진)
 */
export async function updateMyStore(storeId: number, patch: StoreEdit, image?: File) {
  if (mockFor('storeEdit')) {
    await wait()
    return saveMockStoreEdit(storeId, patch)
  }
  const body = {
    ...(patch.name ? { name: patch.name } : {}),
    ...(patch.category ? { category: patch.category } : {}),
    ...(await addressFields(patch)),
  }
  if (image) {
    const form = new FormData()
    form.append('image', image)
    await request(api.patch(`/api/stores/${storeId}/image`, form))
  }
  if (Object.keys(body).length > 0) await request(api.patch(`/api/stores/${storeId}`, body))
}

/**
 * 사장님 가게 등록 — POST /api/stores (multipart: data JSON + image).
 * 목업은 사장님 가게가 1곳(광운 카페)이라 그 가게 정보를 바꿈
 */
export async function registerMyStore(storeId: number, store: StoreEdit, image?: File) {
  if (mockFor('storeEdit')) {
    await wait()
    return saveMockStoreEdit(storeId, store)
  }
  const data = { name: store.name, category: store.category, ...(await addressFields(store)) }
  const form = new FormData()
  form.append('data', new Blob([JSON.stringify(data)], { type: 'application/json' }))
  if (image) form.append('image', image)
  await request<StoreDetail>(api.post('/api/stores', form))
}

/** 편집 화면 초기값: 도로명·상세주소를 나눠 둔 값 (목업만 보관, 서버는 address 하나) */
export function storeEditOf(storeId: number): StoreEdit {
  return mockFor('storeEdit') ? mockStoreEdit(storeId) : {}
}
