/** 지도 핀 아이콘 (Figma 94:124). 기본 초록6, 선택 시 밝은 초록4 + 조금 크게 */
export function PinIcon({ active = false }: { active?: boolean }) {
  return (
    <svg width={active ? 36 : 30} height={active ? 42.3 : 35.26} viewBox="0 0 30 35.2646" aria-hidden className="transition-all">
      <path
        d="M26.4706 24.7059L17.569 34.1553C16.1756 35.6344 13.8243 35.6344 12.4309 34.1553L3.52941 24.7059H3.56303L3.54812 24.6883L3.52941 24.6662C2.961 23.9923 2.45081 23.2676 2.00673 22.5C0.730456 20.2937 0 17.7321 0 15C0 6.71577 6.71577 0 15 0C23.2842 0 30 6.71577 30 15C30 17.7321 29.2695 20.2937 27.9933 22.5C27.5492 23.2676 27.039 23.9923 26.4706 24.6662L26.4519 24.6883L26.437 24.7059H26.4706Z"
        className={active ? 'fill-green-4' : 'fill-green-6'}
      />
      <rect x="8.82" y="8.82" width="12.35" height="12.35" rx="6.18" className="fill-white" />
    </svg>
  )
}
