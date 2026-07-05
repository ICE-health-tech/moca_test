import type { AuthUser, UserRole } from '../../stores/authStore'

export const DEV_USERS: Record<UserRole, AuthUser> = {
  PATIENT: {
    id: '00000000-0000-0000-0000-000000000001',
    fullName: 'Dev Patient',
    email: 'dev-patient@moca.local',
    phoneNumber: '0900000001',
    role: 'PATIENT',
  },
  DOCTOR: {
    id: '00000000-0000-0000-0000-000000000002',
    fullName: 'Dev Doctor',
    email: 'dev-doctor@moca.local',
    phoneNumber: '0900000002',
    role: 'DOCTOR',
  },
  ADMIN: {
    id: '00000000-0000-0000-0000-000000000003',
    fullName: 'Dev Admin',
    email: 'dev-admin@moca.local',
    phoneNumber: '0900000003',
    role: 'ADMIN',
  },
}

export function getDevUser(role: UserRole): AuthUser {
  return { ...DEV_USERS[role] }
}
