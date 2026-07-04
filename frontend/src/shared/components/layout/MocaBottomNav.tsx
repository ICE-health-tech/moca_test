import { BarChart3, Home, LogOut, UserRound } from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../../stores/authStore'

const NAV = [
  { to: '/patient', label: 'Trang chủ', icon: Home, end: true },
  { to: '/patient/doctors', label: 'Bác sĩ', icon: UserRound },
  { to: '/patient/results', label: 'Kết quả', icon: BarChart3 },
] as const

export function MocaBottomNav() {
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/entry', { replace: true })
  }

  return (
    <nav className="fixed bottom-0 z-50 flex w-full shrink-0 items-center justify-around border-t border-outline-variant bg-surface px-2 py-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom,0px))] md:hidden">
      {NAV.map((item) => {
        const Icon = item.icon
        return (
        <NavLink
          key={item.to}
          to={item.to}
          end={'end' in item ? item.end : undefined}
          className={({ isActive }) =>
            [
              'flex flex-col items-center justify-center rounded-xl px-4 py-1 transition-transform active:scale-90',
              isActive
                ? 'bg-secondary-container text-on-secondary-container'
                : 'text-on-surface-variant hover:bg-surface-container-low',
            ].join(' ')
          }
        >
          <Icon size={22} />
          <span className="text-xs">{item.label}</span>
        </NavLink>
        )
      })}
      <button
        type="button"
        onClick={handleLogout}
        className="flex flex-col items-center justify-center rounded-xl px-4 py-1 text-on-surface-variant transition-transform active:scale-90 hover:bg-surface-container-low"
      >
        <LogOut size={22} />
        <span className="text-xs">Thoát</span>
      </button>
    </nav>
  )
}
