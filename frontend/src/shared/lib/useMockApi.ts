/** Mock all API calls in Vite dev when dev bypass is on. Override with VITE_USE_MOCK. */
export function useMockApi(): boolean {
  if (import.meta.env.VITE_USE_MOCK === 'true') return true
  if (import.meta.env.VITE_USE_MOCK === 'false') return false
  return import.meta.env.DEV && import.meta.env.VITE_DEV_BYPASS_AUTH === 'true'
}
