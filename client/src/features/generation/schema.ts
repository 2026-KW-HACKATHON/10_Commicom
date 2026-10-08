/* ── server/docs/api-spec.md — Generation · Shortform 단건 ── */

export type GenerationStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'

export interface MenuItem {
  name: string
  /** 원 단위. 모르면 null */
  price: number | null
}

/**
 * POST /api/generation body.
 * 명세는 storeId만 받음 — Figma 흐름의 지도 링크·메뉴·어필·수정 요청은 추가 필드로 제안 (서버가 모르면 무시)
 */
export interface GenerationRequest {
  storeId: number
  mapUrl?: string
  menus?: MenuItem[]
  appeal?: string
  /** 재수정(PRO): 무엇을 어떻게 고칠지 */
  revision?: { shortformId: number; target: 'VIDEO' | 'SCRIPT'; request: string }
}

export interface GenerationCreated {
  generationId: number
  storeId: number
  storeName: string
  status: GenerationStatus
  requestedAt: string
}

/** GET /api/generation/{generationId} */
export interface GenerationState extends GenerationCreated {
  shortformId: number | null
  errorMessage: string | null
}

/** GET /api/shortforms/{shortformId} */
export interface ShortformDetail {
  shortformId: number
  storeId: number
  storeName: string
  storeCategory: string
  storeCategoryName: string
  videoUrl: string
  thumbnailUrl: string | null
  title: string
  script: string
  duration: number
  createdAt: string
  /** 목업 전용: 샘플 영상의 실제 그림 구간 (feed/schema 의 frame 과 같음) */
  frame?: { top: number; height: number }
}

/** 재수정(PRO)에서 무엇을 고칠지: 영상 / 대본 및 자막 */
export const EDIT_TARGETS = [
  ['VIDEO', '영상'],
  ['SCRIPT', '대본 및 자막'],
] as const
export type EditTarget = (typeof EDIT_TARGETS)[number][0]

export const editPlaceholder = (target: EditTarget) =>
  target === 'VIDEO' ? '예) 음식 장면을 더 길게 보여주세요' : '예) 마지막에 "학생 10% 할인" 문구를 넣어주세요'

/**
 * 네이버·카카오 지도 공유 링크인지
 * - 네이버: naver.me 단축 링크, (m.)map.naver.com
 * - 카카오: kko.kakao.com 단축 링크, (m.)map.kakao.com, place.map.kakao.com
 */
export function isMapUrl(url: string) {
  return /^https?:\/\/(naver\.me|(m\.)?map\.naver\.com|kko\.kakao\.com|(m\.|place\.)?map\.kakao\.com)\//.test(url.trim())
}
