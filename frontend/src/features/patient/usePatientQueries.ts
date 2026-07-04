import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../../stores/authStore'
import { queryKeys } from '../../shared/lib/queryKeys'
import {
  listDoctorOptions,
  listPatientAppointments,
  listPatientSessions,
  submitTestSession,
  updatePatientProfile,
  type SubmitSessionPayload,
  type UpdatePatientProfilePayload,
} from './patient.api'

export function usePatientSessions() {
  const patientId = useAuthStore((s) => s.user?.id)

  return useQuery({
    queryKey: queryKeys.patient.sessions(patientId ?? ''),
    queryFn: () => listPatientSessions(patientId!),
    enabled: !!patientId,
  })
}

export function usePatientAppointments() {
  const patientId = useAuthStore((s) => s.user?.id)

  return useQuery({
    queryKey: queryKeys.patient.appointments(patientId ?? ''),
    queryFn: () => listPatientAppointments(patientId!),
    enabled: !!patientId,
  })
}

export function useDoctorOptions() {
  const patientId = useAuthStore((s) => s.user?.id)

  return useQuery({
    queryKey: queryKeys.patient.clinicians(patientId ?? ''),
    queryFn: () => listDoctorOptions(patientId!),
    enabled: !!patientId,
  })
}

export function useSubmitSession() {
  const queryClient = useQueryClient()
  const patientId = useAuthStore((s) => s.user?.id)

  return useMutation({
    mutationFn: (payload: Omit<SubmitSessionPayload, 'patientId'>) =>
      submitTestSession({ ...payload, patientId: patientId! }),
    onSuccess: () => {
      if (patientId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.patient.sessions(patientId),
        })
      }
    },
  })
}

export function useUpdatePatientProfile() {
  const patientId = useAuthStore((s) => s.user?.id)
  const updateUser = useAuthStore((s) => s.updateUser)

  return useMutation({
    mutationFn: (payload: UpdatePatientProfilePayload) =>
      updatePatientProfile(patientId!, payload),
    onSuccess: (user) => updateUser(user),
  })
}
