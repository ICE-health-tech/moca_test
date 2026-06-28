import { Brain, LogOut, Settings } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../../stores/authStore'

const actionClass =
  'flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container'

type Props = {
  title?: string
}

export function MocaAppHeader({ title = 'MoCA Assessment' }: Props) {
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/entry', { replace: true })
  }
  const handleSettings=()=>{
    navigate('/patient/settings')
  }
  return (
    <header className="sticky top-0 z-50 flex h-14 shrink-0 w-full items-center justify-between gap-3 border-b border-outline-variant bg-surface px-[var(--stitch-margin-mobile)]">
      <div className="flex min-w-0 items-center gap-3">
        <Brain className="h-6 w-6 shrink-0 text-primary" aria-hidden />
        <h1 className="truncate text-lg font-semibold text-primary md:text-xl">{title}</h1>
      </div>
      <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
        <button type="button" className={actionClass} onClick={handleSettings} aria-label="Cài đặt">
          <Settings className="h-5 w-5" />
          <span className="hidden sm:inline">Cài đặt</span>
        </button>
        <button
          type="button"
          onClick={handleLogout}
          className={actionClass}
          aria-label="Đăng xuất"
        >
          <LogOut className="h-5 w-5" />
          <span className="hidden sm:inline">Đăng xuất</span>
        </button>
      </div>
    </header>
  )
}
