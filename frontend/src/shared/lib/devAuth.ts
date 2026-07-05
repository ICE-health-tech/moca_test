import { useAuthStore, type UserRole } from '../../stores/authStore'
import { DEV_USERS } from './devFixtures'

const enabled = import.meta.env.DEV && import.meta.env.VITE_DEV_BYPASS_AUTH === 'true'

/** Seed a fake session so PrivateRoute passes during Vite dev. */
export function seedDevAuth() {
  if (!enabled) return
  if (!useAuthStore.getState().user) {
    useAuthStore.setState({ user: DEV_USERS.PATIENT, token: 'dev-bypass' })
  }
}

/** Swap dev identity to match the route (patient / doctor / admin). */
export function adoptDevRole(role: UserRole) {
  if (!enabled) return
  useAuthStore.setState({ user: DEV_USERS[role], token: 'dev-bypass' })
}

export function isDevAuthBypass() {
  return enabled
}
