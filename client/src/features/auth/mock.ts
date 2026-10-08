import { ApiError } from '@/shared/api/client'
import type { LoginResult, MemberInfo, SignupRequest } from './schema'

/**
 * 회원 목업 (VITE_USE_MOCK=true). 브라우저에 저장 — 서버 없이 가입·로그인 흐름 확인용.
 * 명세의 로컬 샘플 계정과 같게 시작 (비밀번호 password1234).
 */
interface MockMember extends MemberInfo {
  password: string
}

const KEY = 'itda-mock-members'
const SEED: MockMember[] = [
  { memberId: 1, email: 'owner@test.com', password: 'password1234', nickname: '광운 카페', role: 'OWNER', roleName: '사장님', profileImageUrl: null },
  { memberId: 2, email: 'resident@test.com', password: 'password1234', nickname: '월계동불주먹', role: 'RESIDENT', roleName: '주민', profileImageUrl: null },
]

function load(): MockMember[] {
  try {
    const saved = localStorage.getItem(KEY)
    return saved ? (JSON.parse(saved) as MockMember[]) : SEED.map((m) => ({ ...m }))
  } catch {
    return SEED.map((m) => ({ ...m }))
  }
}
const members = load()
const save = () => {
  try {
    localStorage.setItem(KEY, JSON.stringify(members))
  } catch {
    // 저장 실패해도 이번 접속 동안은 유지
  }
}

const wait = (ms = 400) => new Promise((r) => setTimeout(r, ms))
const tokenOf = (id: number) => `mock-token-${id}`
const idOfToken = (token: string | null) => Number(token?.replace('mock-token-', '')) || null
const info = ({ password: _password, ...m }: MockMember): MemberInfo => ({ ...m })

function me(token: string | null) {
  const m = members.find((x) => x.memberId === idOfToken(token))
  if (!m) throw new ApiError('COMMON401', '로그인이 필요해요')
  return m
}

/** 이메일 인증 (서버와 같은 규칙: 5분 유효, 60초 뒤 다시 받기, 5번까지 틀릴 수 있음, 인증 후 30분 안에 가입) */
const pendingCodes = new Map<string, { code: string; sentAt: number; expiresAt: number; attempts: number }>()
const verifiedUntil = new Map<string, number>()
const norm = (email: string) => email.trim().toLowerCase()
const emailTaken = (email: string) => members.some((m) => norm(m.email) === norm(email))
const nicknameTaken = (nickname: string, exceptMemberId?: number) =>
  members.some((m) => m.nickname === nickname.trim() && m.memberId !== exceptMemberId)

export const mockAuthApi = {
  async isEmailTaken(email: string) {
    await wait(300)
    return emailTaken(email)
  },

  async sendEmailCode(email: string) {
    await wait(500)
    if (emailTaken(email)) throw new ApiError('MEMBER409', '이미 가입된 이메일이에요')
    const before = pendingCodes.get(norm(email))
    if (before && before.sentAt + 60_000 > Date.now()) throw new ApiError('EMAIL429_2', '인증번호는 1분 뒤에 다시 받을 수 있어요')
    const code = String(Math.floor(Math.random() * 1_000_000)).padStart(6, '0')
    pendingCodes.set(norm(email), { code, sentAt: Date.now(), expiresAt: Date.now() + 5 * 60_000, attempts: 0 })
    verifiedUntil.delete(norm(email))
    // 목업은 메일을 못 보내므로 화면에 인증번호를 보여 줌 (서버 로컬 개발 모드와 같음)
    return { expiresInSeconds: 300, resendAfterSeconds: 60, devCode: code }
  },

  async confirmEmailCode(email: string, code: string) {
    await wait(300)
    const p = pendingCodes.get(norm(email))
    if (!p || p.expiresAt < Date.now()) {
      pendingCodes.delete(norm(email))
      throw new ApiError('EMAIL400_2', '인증번호가 만료됐어요. 다시 받아 주세요')
    }
    if (p.attempts >= 5) {
      pendingCodes.delete(norm(email))
      throw new ApiError('EMAIL429', '인증 시도가 너무 많아요. 인증번호를 다시 받아 주세요')
    }
    if (p.code !== code.trim()) {
      p.attempts += 1
      throw new ApiError('EMAIL400', '인증번호가 맞지 않아요')
    }
    pendingCodes.delete(norm(email))
    verifiedUntil.set(norm(email), Date.now() + 30 * 60_000)
  },

  async signup(body: SignupRequest): Promise<MemberInfo> {
    await wait()
    if (emailTaken(body.email)) throw new ApiError('MEMBER409', '이미 가입된 이메일이에요')
    if (nicknameTaken(body.nickname)) throw new ApiError('MEMBER409_2', '이미 사용 중인 닉네임이에요')
    if (!((verifiedUntil.get(norm(body.email)) ?? 0) > Date.now())) {
      throw new ApiError('MEMBER400_2', '이메일 인증을 먼저 완료해 주세요')
    }
    verifiedUntil.delete(norm(body.email))
    const m: MockMember = {
      memberId: Math.max(0, ...members.map((x) => x.memberId)) + 1,
      email: body.email.trim(),
      password: body.password,
      nickname: body.nickname.trim(),
      role: body.role,
      roleName: body.role === 'OWNER' ? '사장님' : '주민',
      profileImageUrl: null,
    }
    members.push(m)
    save()
    return info(m)
  },

  async login(email: string, password: string): Promise<LoginResult> {
    await wait()
    const m = members.find((x) => x.email.toLowerCase() === email.trim().toLowerCase())
    if (!m || m.password !== password) throw new ApiError('MEMBER401', '이메일 또는 비밀번호가 올바르지 않아요')
    return { accessToken: tokenOf(m.memberId), tokenType: 'Bearer', expiresIn: 86400, memberId: m.memberId, nickname: m.nickname, role: m.role }
  },

  async me(token: string | null): Promise<MemberInfo> {
    await wait(150)
    return info(me(token))
  },

  /** 목업 전용: 닉네임 중복 확인 (명세에 API 없음) */
  async isNicknameTaken(nickname: string, exceptMemberId?: number) {
    await wait(300)
    return members.some((m) => m.nickname === nickname.trim() && m.memberId !== exceptMemberId)
  },

  async updateNickname(token: string | null, nickname: string): Promise<MemberInfo> {
    await wait()
    const m = me(token)
    if (nicknameTaken(nickname, m.memberId)) throw new ApiError('MEMBER409_2', '이미 사용 중인 닉네임이에요')
    m.nickname = nickname.trim()
    save()
    return info(m)
  },

  async updatePassword(token: string | null, currentPassword: string, newPassword: string) {
    await wait()
    const m = me(token)
    if (m.password !== currentPassword) throw new ApiError('MEMBER400_3', '현재 비밀번호가 맞지 않아요')
    if (m.password === newPassword) throw new ApiError('MEMBER400_4', '지금과 다른 비밀번호를 입력해 주세요')
    m.password = newPassword
    save()
  },

  async updateProfileImage(token: string | null, dataUrl: string): Promise<MemberInfo> {
    await wait()
    const m = me(token)
    m.profileImageUrl = dataUrl
    save()
    return info(m)
  },

  async withdraw(token: string | null) {
    await wait()
    const m = me(token)
    members.splice(members.indexOf(m), 1)
    save()
  },
}
