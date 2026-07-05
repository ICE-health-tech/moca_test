import { useEffect } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import type { UserRole } from '../../stores/authStore'
import { useAuthStore } from '../../stores/authStore'
import { adoptDevRole, isDevAuthBypass } from '../lib/devAuth'

type Props = {
  roles?: UserRole[]
}

export function PrivateRoute({ roles }: Props) {
  const user = useAuthStore((s) => s.user)

  useEffect(() => {
    if (isDevAuthBypass() && roles?.[0]) adoptDevRole(roles[0])
  }, [roles])

  if (!user) {
    const loginPath = roles?.includes('PATIENT') ? '/entry' : '/login'
    return <Navigate to={loginPath} replace />
  }
  if (!isDevAuthBypass() && roles && !roles.includes(user.role)) {
    const home =
      user.role === 'PATIENT'
        ? '/patient'
        : user.role === 'DOCTOR'
          ? '/clinician'
          : '/admin'
    return <Navigate to={home} replace />
  }

  return <Outlet />
}
