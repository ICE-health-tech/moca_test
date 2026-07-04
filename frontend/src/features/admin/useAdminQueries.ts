import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '../../shared/lib/queryKeys'
import { fetchAdminStats, listAdminDoctors } from './admin.api'

export function useAdminStats() {
  return useQuery({
    queryKey: queryKeys.admin.stats,
    queryFn: fetchAdminStats,
  })
}

export function useAdminDoctors() {
  return useQuery({
    queryKey: queryKeys.admin.clinicians,
    queryFn: listAdminDoctors,
  })
}
