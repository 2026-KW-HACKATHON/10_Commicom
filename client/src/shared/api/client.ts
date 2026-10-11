import axios, { AxiosError } from 'axios'
import { useAuthStore } from '@/stores/authStore'

/** 서버 공통 응답 형식 (코드 컨벤션) */
export interface ApiResponse<T> {
  isSuccess: boolean
  code: string
  message: string
  result?: T
}

export class ApiError extends Error {
  readonly code: string
  readonly result?: unknown

  constructor(code: string, message: string, result?: unknown) {
    super(message)
    this.code = code
    this.result = result
  }
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '',
  timeout: 10_000,
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (error: AxiosError<ApiResponse<unknown>>) => {
    const body = error.response?.data
    if (error.response?.status === 401) useAuthStore.getState().logout()
    if (body?.code) return Promise.reject(new ApiError(body.code, body.message, body.result))
    // Vercel 함수 본문 한도(4.5MB)를 넘은 요청
    if (error.response?.status === 413) return Promise.reject(new ApiError('PAYLOAD_TOO_LARGE', '사진 용량이 너무 커요. 더 작은 사진으로 다시 시도해 주세요'))
    return Promise.reject(new ApiError('NETWORK', '서버에 연결할 수 없어요'))
  },
)

/** 응답에서 result만 꺼낸다. isSuccess=false면 ApiError */
export async function request<T>(promise: Promise<{ data: ApiResponse<T> }>): Promise<T> {
  const { data } = await promise
  if (!data.isSuccess) throw new ApiError(data.code, data.message, data.result)
  return data.result as T
}
