import { create } from 'zustand'

export type ToastTone = 'default' | 'error'

interface ToastState {
  /** 같은 문구를 연달아 띄워도 다시 나타나게 id로 구분 */
  current: { id: number; message: string; tone: ToastTone } | null
  show: (message: string, tone?: ToastTone) => void
  hide: (id: number) => void
}

let seq = 0

export const useToastStore = create<ToastState>()((set) => ({
  current: null,
  show: (message, tone = 'default') => set({ current: { id: ++seq, message, tone } }),
  hide: (id) => set((s) => (s.current?.id === id ? { current: null } : s)),
}))

/** 어디서든 짧은 알림 띄우기 (예: toast('스크랩했어요')) */
export const toast = (message: string, tone?: ToastTone) => useToastStore.getState().show(message, tone)
