/**
 * 베타 테스터 모드 (전시회·QR 체험용).
 * 켜면 서버 없이 이 기기 안의 목업으로만 돌아가서, 로그인 없이 손님·사장님 기능을 모두 써 볼 수 있음.
 * 체험 데이터는 이 기기 localStorage 에만 저장되고 운영 서버·DB 에는 아무것도 남지 않음.
 *
 * 목업 모듈(mocks/db.ts)이 이 값을 import 하므로 여기서는 다른 모듈을 import 하지 않음 (순환 방지)
 */
const KEY = 'itda-beta'

/** 베타 체험 중 계정 — 목업 사장님 계정(가게 있음)이라 손님·사장님 화면을 모두 쓸 수 있음 */
export const BETA_MEMBER = {
  memberId: 1,
  email: 'beta@itda.app',
  nickname: '베타 테스터',
  role: 'OWNER' as const,
  profileImageUrl: null,
}

function read() {
  try {
    return localStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

/** 앱을 연 순간의 값 (켜고 끌 때는 새로고침해서 목업/실서버 연결을 다시 정함) */
export const IS_BETA = read()

/** 잇다가 기기에 저장한 값 전부 (체험 데이터 초기화용) */
function clearItdaStorage() {
  try {
    Object.keys(localStorage)
      .filter((key) => key.startsWith('itda-'))
      .forEach((key) => localStorage.removeItem(key))
  } catch {
    // 저장소를 못 쓰는 브라우저: 새로고침만
  }
}

/** 베타 체험 시작 (또는 처음부터 다시): 깨끗한 체험 데이터 + 체험 계정으로 로그인한 상태로 손님 피드부터 */
export function startBeta() {
  clearItdaStorage()
  try {
    localStorage.setItem(KEY, '1')
    localStorage.setItem('itda-mode', JSON.stringify({ state: { mode: 'USER' }, version: 0 }))
    localStorage.setItem(
      'itda-auth',
      JSON.stringify({ state: { accessToken: `mock-token-${BETA_MEMBER.memberId}`, member: BETA_MEMBER }, version: 0 }),
    )
  } catch {
    // 저장소를 못 쓰면 체험 모드를 켤 수 없음
  }
  window.location.replace('/')
}

/** 베타 체험 끝내기: 체험 데이터를 지우고 처음 화면으로 */
export function endBeta() {
  clearItdaStorage()
  window.location.replace('/welcome')
}

/** 체험 중에 처음 화면에서 손님·사장님을 직접 고른 경우: 체험 데이터를 지우고 실제 서버 모드로 그 화면부터 */
export function leaveBetaTo(mode: 'USER' | 'OWNER', path: string) {
  clearItdaStorage()
  try {
    localStorage.setItem('itda-mode', JSON.stringify({ state: { mode }, version: 0 }))
  } catch {
    // 저장 못 하면 처음 화면이 다시 뜸
  }
  window.location.replace(path)
}
