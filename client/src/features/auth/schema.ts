import type { AuthMember } from '@/stores/authStore'
import type { AppMode } from '@/stores/modeStore'

/** POST /api/members/signup */
export interface SignupRequest {
  email: string
  /** 8~64자 */
  password: string
  /** 30자 이하. 사장님은 가게명을 그대로 씀 */
  nickname: string
  role: 'RESIDENT' | 'OWNER'
}

/** POST /api/members/login → result */
export interface LoginResult {
  accessToken: string
  tokenType: 'Bearer'
  expiresIn: number
  memberId: number
  nickname: string
  role: AuthMember['role']
}

/** GET /api/members/me, 회원가입·닉네임 수정 응답 */
export interface MemberInfo extends AuthMember {
  roleName: string
}

/**
 * 사장님 가입 때 함께 받는 가게 정보 (Figma 회원가입 사장님 흐름).
 * TODO: 명세에 가게 등록 API 없음 — store 담당과 정해야 함
 */
export interface StoreDraft {
  name: string
  address: string
  addressDetail: string
  category: string
  /** 소분류 (직접 입력 가능) */
  subCategory: string
  /** 프로필 사진 (작게 줄인 data URL) */
  imageUrl: string | null
}

export const PASSWORD_MIN = 8
export const NICKNAME_MAX = 30

export const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())

/**
 * 사장님 모드를 쓸 수 있는지: 사장님 계정이거나, 아직 로그인 전(시연용으로 자유 전환).
 * 손님 계정으로 로그인했으면 막음.
 */
export const canUseOwnerMode = (me: AuthMember | null) => !me || me.role === 'OWNER'

/** 회원 유형 → 앱 이용 모드 (RESIDENT는 손님 화면) */
export const modeOfRole = (role: AuthMember['role']): AppMode => (role === 'OWNER' ? 'OWNER' : 'USER')
