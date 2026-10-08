import { USE_MOCK } from '@/mocks/db'
import { api, request } from '@/shared/api/client'
import { useAuthStore } from '@/stores/authStore'
import { mockAuthApi } from './mock'
import type { LoginResult, MemberInfo, SignupRequest } from './schema'

const token = () => useAuthStore.getState().accessToken

/** POST /api/members/signup — 가입만 하고 토큰은 안 줌 → 이어서 login */
export function signup(body: SignupRequest): Promise<MemberInfo> {
  if (USE_MOCK) return mockAuthApi.signup(body)
  return request(api.post('/api/members/signup', body))
}

/** POST /api/members/login */
export function login(email: string, password: string): Promise<LoginResult> {
  if (USE_MOCK) return mockAuthApi.login(email, password)
  return request(api.post('/api/members/login', { email: email.trim(), password }))
}

/** GET /api/members/me */
export function fetchMe(accessToken = token()): Promise<MemberInfo> {
  if (USE_MOCK) return mockAuthApi.me(accessToken)
  return request(api.get('/api/members/me', accessToken ? { headers: { Authorization: `Bearer ${accessToken}` } } : undefined))
}

/**
 * 닉네임 중복 확인 (Figma 회원가입·프로필의 [중복확인]).
 * TODO: 명세에 API 없음 — 서버에 요청 필요. 서버 연동 시엔 가입·수정 때 서버가 막을 때까지 통과로 둠
 */
export async function isNicknameTaken(nickname: string, exceptMemberId?: number): Promise<boolean> {
  if (USE_MOCK) return mockAuthApi.isNicknameTaken(nickname, exceptMemberId)
  return false
}

/** PATCH /api/members/me/nickname */
export function updateNickname(nickname: string): Promise<MemberInfo> {
  if (USE_MOCK) return mockAuthApi.updateNickname(token(), nickname)
  return request(api.patch('/api/members/me/nickname', { nickname: nickname.trim() }))
}

/** 비밀번호 변경. TODO: 명세에 API 없음 (임시: PATCH /api/members/me/password) */
export async function updatePassword(password: string) {
  if (USE_MOCK) return mockAuthApi.updatePassword(token(), password)
  return request(api.patch('/api/members/me/password', { password }))
}

/** PATCH /api/members/me/profile-image (multipart image) */
export function updateProfileImage(file: File, previewDataUrl: string): Promise<MemberInfo> {
  if (USE_MOCK) return mockAuthApi.updateProfileImage(token(), previewDataUrl)
  const form = new FormData()
  form.append('image', file)
  return request(api.patch('/api/members/me/profile-image', form))
}

/** DELETE /api/members/me — 성공하면 토큰을 바로 지워야 함 (명세) */
export async function withdraw() {
  if (USE_MOCK) return mockAuthApi.withdraw(token())
  await request(api.delete('/api/members/me'))
}
