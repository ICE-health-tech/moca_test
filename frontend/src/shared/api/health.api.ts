import { api } from '../lib/axios'
import { useMockApi } from '../lib/useMockApi'
import type { HealthResponse } from '../types/health'

export async function fetchHealth(): Promise<HealthResponse> {
  if (useMockApi()) return { status: 'UP', service: 'moca-platform' }
  const { data } = await api.get<HealthResponse>('/api/health')
  return data
}
