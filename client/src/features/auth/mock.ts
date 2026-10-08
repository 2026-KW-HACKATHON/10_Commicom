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

export const mockAuthApi = {
  async signup(body: SignupRequest): Promise<MemberInfo> {
    await wait()
    if (members.some((m) => m.email.toLowerCase() === body.email.trim().toLowerCase())) {
      throw new ApiError('MEMBER409', '이미 가입된 이메일이에요')
    }
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
    m.nickname = nickname.trim()
    save()
    return info(m)
  },

  async updatePassword(token: string | null, password: string) {
    await wait()
    me(token).password = password
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
