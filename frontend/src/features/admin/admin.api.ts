import { api } from '../../shared/lib/axios'

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'

export type AdminStats = {
  doctorCount: number
  patientCount: number
  pendingReviews: number
  testsThisMonth: number
}

export type AdminDoctor = {
  id: string
  name: string
  specialty: string
  patientCount: number
  active: boolean
}

const MOCK_STATS: AdminStats = {
  doctorCount: 8,
  patientCount: 124,
  pendingReviews: 5,
  testsThisMonth: 37,
}

const MOCK_DOCTORS: AdminDoctor[] = [
  {
    id: 'd1',
    name: 'BS. Trần Minh',
    specialty: 'Thần kinh',
    patientCount: 12,
    active: true,
  },
  {
    id: 'd2',
    name: 'BS. Lê Hương',
    specialty: 'Lão khoa',
    patientCount: 8,
    active: true,
  },
]

export async function fetchAdminStats(): Promise<AdminStats> {
  if (USE_MOCK) return MOCK_STATS
  const { data } = await api.get<AdminStats>('/api/admin/stats')
  return data
}

export async function listAdminDoctors(): Promise<AdminDoctor[]> {
  if (USE_MOCK) return MOCK_DOCTORS
  const { data } = await api.get<AdminDoctor[]>('/api/admin/clinicians')
  return data
}
