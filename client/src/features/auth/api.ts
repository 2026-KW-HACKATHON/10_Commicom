import { MOCK_ONLY, USE_MOCK } from '@/mocks/db'
import { api, ApiError, request, type ApiResponse } from '@/shared/api/client'
import { errorCode } from '@/shared/lib/error'
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
 * 로그인 없이 쓰는 API(중복 확인·이메일 인증)인데 401 이 오면 서버에 그 기능이 아직 없다는 뜻
 * (이 서버는 없는 주소도 로그인 요구로 막음) → "로그인이 필요해요" 대신 알아볼 수 있는 문구로
 */
async function publicRequest<T>(promise: Promise<{ data: ApiResponse<T> }>): Promise<T> {
  try {
    return await request(promise)
  } catch (e) {
    if (errorCode(e) === 'COMMON401') throw new ApiError('NOT_READY', '서버가 아직 이 기능으로 업데이트되지 않았어요. 잠시 뒤 다시 시도해 주세요')
    throw e
  }
}

/**
 * 닉네임 중복 확인 — GET /api/members/check-nickname (Figma 회원가입·프로필의 [중복확인]).
 * 로그인한 상태면 서버가 내 현재 닉네임은 사용 가능으로 봄
 */
export async function isNicknameTaken(nickname: string, exceptMemberId?: number): Promise<boolean> {
  if (USE_MOCK) return mockAuthApi.isNicknameTaken(nickname, exceptMemberId)
  const res = await publicRequest<{ available: boolean } | boolean>(api.get('/api/members/check-nickname', { params: { nickname: nickname.trim() } }))
  // 예전 서버는 result 에 사용 가능 여부(true/false)만 줌 — 배포 서버가 아직 예전 버전일 때도 동작하게
  return !(typeof res === 'boolean' ? res : res.available)
}

/** 이메일 중복 확인 — GET /api/members/check-email */
export async function isEmailTaken(email: string): Promise<boolean> {
  if (USE_MOCK) return mockAuthApi.isEmailTaken(email)
  const { available } = await publicRequest<{ available: boolean }>(api.get('/api/members/check-email', { params: { email: email.trim() } }))
  return !available
}

/** 인증번호 발송 결과. devCode는 메일 서버 없는 로컬 개발 환경에서만 옴 */
export interface EmailCodeSent {
  expiresInSeconds: number
  resendAfterSeconds: number
  devCode?: string
}

/** 이메일 인증번호 받기 — POST /api/members/email-verifications (이미 가입된 이메일이면 MEMBER409) */
export function sendEmailCode(email: string): Promise<EmailCodeSent> {
  if (USE_MOCK) return mockAuthApi.sendEmailCode(email)
  return publicRequest(api.post('/api/members/email-verifications', { email: email.trim() }))
}

/** 이메일 인증번호 확인 — POST /api/members/email-verifications/confirm */
export async function confirmEmailCode(email: string, code: string) {
  if (USE_MOCK) return mockAuthApi.confirmEmailCode(email, code)
  await publicRequest(api.post('/api/members/email-verifications/confirm', { email: email.trim(), code: code.trim() }))
}

/** PATCH /api/members/me/nickname */
export function updateNickname(nickname: string): Promise<MemberInfo> {
  if (USE_MOCK) return mockAuthApi.updateNickname(token(), nickname)
  return request(api.patch('/api/members/me/nickname', { nickname: nickname.trim() }))
}

/** PATCH /api/members/me/password — 현재 비밀번호가 틀리면 MEMBER400_3, 지금과 같으면 MEMBER400_4 */
export async function updatePassword(currentPassword: string, newPassword: string) {
  if (USE_MOCK) return mockAuthApi.updatePassword(token(), currentPassword, newPassword)
  // 실제 서버 계정은 목업으로 바꿀 수 없어서 안내만
  if (MOCK_ONLY.memberExtra) throw new ApiError('NOT_READY', '비밀번호 변경은 서버 준비 중이에요')
  await request(api.patch('/api/members/me/password', { currentPassword, newPassword }))
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
