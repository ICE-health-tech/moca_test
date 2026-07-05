import { QueryClientProvider } from '@tanstack/react-query'
import { AppRouter } from './router'
import { seedDevAuth } from './shared/lib/devAuth'
import { queryClient } from './shared/lib/queryClient'

seedDevAuth()

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppRouter />
    </QueryClientProvider>
  )
}
