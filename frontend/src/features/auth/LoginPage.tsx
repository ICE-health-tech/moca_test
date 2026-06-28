import { ArrowLeft, ArrowRight, Eye, EyeOff } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'

const inputClass =
  'stitch-input w-full h-11 px-4 bg-surface-container-lowest border border-outline-variant rounded-lg text-sm text-on-surface placeholder:text-outline transition-all duration-200'

export function LoginPage() {
  const user = useAuthStore((s) => s.user)
  const doctorLogin = useAuthStore((s) => s.doctorLogin)

  const [email, setEmail] = useState('doctor.tran@moca.local')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (user) {
    const home =
      user.role === 'PATIENT'
        ? '/patient'
        : user.role === 'DOCTOR'
          ? '/doctor'
          : '/admin'
    return <Navigate to={home} replace />
  }

  const handleSignIn = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await doctorLogin(email.trim(), password)
    } catch {
      setError('Email hoặc mật khẩu không đúng.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="app-shell bg-background text-on-background">
      <header className="flex h-12 shrink-0 items-center justify-center border-b border-outline-variant/40 bg-surface px-[var(--stitch-margin-mobile)]">
        <h1 className="text-lg font-semibold text-primary">Assessment Pro</h1>
      </header>

      <main className="app-shell__main app-shell__main--center px-[var(--stitch-margin-mobile)]">
        <div className="mx-auto w-full max-w-md">
          <section className="mb-5 text-center">
            <h2 className="text-2xl font-semibold tracking-tight text-on-background">
              Đăng nhập
            </h2>
            <p className="mt-1 text-sm text-on-surface-variant">
              Tài khoản đã đăng ký trong hệ thống bệnh viện.
            </p>
          </section>

          <form className="flex flex-col space-y-3" onSubmit={handleSignIn}>
            <div className="flex flex-col space-y-1">
              <label className="px-1 text-sm font-medium text-on-surface-variant" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                className={inputClass}
                placeholder="doctor.tran@moca.local"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div className="flex flex-col space-y-1">
              <label className="px-1 text-sm font-medium text-on-surface-variant" htmlFor="password">
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className={inputClass}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 flex -translate-y-1/2 items-center text-on-surface-variant"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-error" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="mt-1 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-on-primary shadow-sm transition-all active:scale-[0.98] disabled:opacity-60"
            >
              <span>{submitting ? 'Đang đăng nhập…' : 'Đăng nhập'}</span>
              <ArrowRight size={18} />
            </button>
          </form>

          <div className="mt-4 text-center">
            <Link
              to="/entry"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              <ArrowLeft size={16} />
              Quay lại trang chọn vai trò
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
