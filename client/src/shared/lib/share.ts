import { toast } from '@/stores/toastStore'

/**
 * 링크 공유: 휴대폰은 공유창(카톡·문자 등), 공유창이 없으면 링크 복사 후 토스트.
 * path는 앱 안 경로 (예: /map/stores/1/shortform?start=500)
 */
export async function shareLink({ title, text, path }: { title: string; text: string; path: string }) {
  const url = new URL(path, window.location.origin).toString()
  if (navigator.share) {
    try {
      await navigator.share({ title, text, url })
      return
    } catch (e) {
      // 사용자가 공유창을 닫은 경우는 조용히 끝
      if (e instanceof DOMException && e.name === 'AbortError') return
    }
  }
  try {
    await navigator.clipboard.writeText(url)
    toast('링크를 복사했어요 · 친구에게 붙여넣어 보내 보세요')
  } catch {
    toast('공유하지 못했어요. 잠시 후 다시 시도해 주세요', 'error')
  }
}
