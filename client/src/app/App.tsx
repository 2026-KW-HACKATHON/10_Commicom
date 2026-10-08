import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { useSessionCheck } from '@/features/auth/hooks'
import { Toaster } from '@/shared/ui/Toaster'
import { router } from './router'
import { Splash } from './Splash'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
})

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionCheck />
      <RouterProvider router={router} />
      {/* 앱 위에 덮어 두고 그 사이 첫 화면이 뒤에서 미리 불러와짐 */}
      <Toaster />
      <Splash />
    </QueryClientProvider>
  )
}

/** 저장된 로그인 확인 (useLogout 이 QueryClient 를 쓰므로 Provider 안에서) */
function SessionCheck() {
  useSessionCheck()
  return null
}
