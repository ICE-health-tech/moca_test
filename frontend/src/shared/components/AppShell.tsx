import { LogOut } from 'lucide-react'
import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import type { BreadcrumbCrumb } from '../lib/breadcrumbs'
import { MocaBreadcrumb } from './layout/MocaBreadcrumb'

type Props = {
  title: string
  children: ReactNode
  nav?: { to: string; label: string }[]
  breadcrumbs?: BreadcrumbCrumb[]
  fitViewport?: boolean
}

export function AppShell({
  title,
  children,
  nav = [],
  breadcrumbs,
  fitViewport = false,
}: Props) {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)

  return (
    <div className="app-shell bg-[var(--stitch-background)]">
      <header className="shrink-0 border-b border-white/50 bg-white/60 backdrop-blur-lg">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
              Moca-Test
            </p>
            <h1 className="text-lg font-bold text-slate-900 md:text-xl">{title}</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-600 sm:inline">
              {user?.fullName}
            </span>
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <LogOut size={16} />
              Đăng xuất
            </button>
          </div>
        </div>
        {nav.length > 0 && (
          <nav className="mx-auto flex max-w-5xl gap-2 overflow-x-auto px-4 pb-2">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end
                className={({ isActive }) =>
                  'whitespace-nowrap rounded-xl px-3 py-1.5 text-sm font-medium transition-colors ' +
                  (isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white/70 text-slate-700 hover:bg-white')
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        )}
      </header>
      <main
        className={[
          'app-shell__main mx-auto w-full max-w-5xl px-4 py-4',
          fitViewport ? 'app-shell__main--center' : '',
        ].join(' ')}
      >
        <MocaBreadcrumb items={breadcrumbs} variant="glass" className="mb-3" />
        {children}
      </main>
    </div>
  )
}
