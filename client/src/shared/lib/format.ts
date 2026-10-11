/** 숫자에 천 단위 쉼표: 1000 → "1,000" (금액·개수·건수 등 화면에 보이는 숫자는 모두 이걸로) */
export const num = (n: number) => n.toLocaleString('ko-KR')
