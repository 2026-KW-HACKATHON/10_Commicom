import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import { Splash } from './Splash'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
})

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      {/* 앱 위에 덮어 두고 그 사이 첫 화면이 뒤에서 미리 불러와짐 */}
      <Splash />
    </QueryClientProvider>
  )
}
