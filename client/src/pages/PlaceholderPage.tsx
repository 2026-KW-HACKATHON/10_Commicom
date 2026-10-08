/** 다른 팀원 담당 화면 자리 (실제 화면으로 교체) */
export function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex h-full items-center justify-center text-gray-2">
      {title} 화면 준비 중
    </div>
  )
}
