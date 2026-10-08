/**
 * 숏폼(가게 홍보 영상) 피드.
 * 숏폼 API는 명세에 아직 없어 필드는 화면에 필요한 만큼만 정의 — 서버 담당과 맞춰 교체.
 */
export interface Shortform {
  shortformId: number
  storeId: number
  storeName: string
  category: string
  categoryName: string
  address: string
  /** 메뉴판에서 뽑은 "메뉴 - 가격" 목록 */
  menus: string[]
  /** 한 줄 소개 */
  description: string
  videoUrl: string
  posterUrl: string | null
  /**
   * 영상 파일 안에서 실제 그림이 있는 세로 구간(0~1). 위아래 검은 띠가 박힌 영상을 잘라 보여줄 때 사용.
   * 없으면 전체를 그대로 보여줌.
   */
  frame?: { top: number; height: number }
}

export interface ShortformListResult {
  shortforms: Shortform[]
}
