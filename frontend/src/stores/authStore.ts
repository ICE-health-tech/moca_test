import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { doctorLogin as doctorLoginApi, patientLogin as patientLoginApi } from '../features/auth/auth.api'

export type UserRole = 'PATIENT' | 'DOCTOR' | 'ADMIN'

export type AuthUser = {
  id: string
  fullName: string
  email: string
  phoneNumber: string
  role: UserRole
  gender?: string
  dateOfBirth?: string | null
  educationYears?: number | null
}

type AuthState = {
  user: AuthUser | null
  token: string | null
  /** Patient: phone only → POST /api/auth/patient/login */
  patientLogin: (phone: string) => Promise<void>
  /** Doctor / admin: email + password → POST /api/auth/doctor/login */
  doctorLogin: (email: string, password: string) => Promise<void>
  updateUser: (user: AuthUser) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      patientLogin: async (phone) => {
        const { user, accessToken } = await patientLoginApi(phone)
        set({ user, token: accessToken })
      },
      doctorLogin: async (email, password) => {
        const { user, accessToken } = await doctorLoginApi(email, password)
        set({ user, token: accessToken })
      },
      updateUser: (user) => set({ user }),
      logout: () => set({ user: null, token: null }),
    }),
    { name: 'moca-auth' },
  ),
)
