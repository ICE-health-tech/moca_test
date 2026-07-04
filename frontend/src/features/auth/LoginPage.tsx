import { ArrowLeft, ArrowRight, Eye, EyeOff } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { AuthPageShell, authInputClass, authPrimaryBtn, authSecondaryBtn } from './AuthPageShell'

export function LoginPage() {
  const user = useAuthStore((s) => s.user)
  const doctorLogin = useAuthStore((s) => s.doctorLogin)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (user) {
    const home =
      user.role === 'PATIENT' ? '/patient' : user.role === 'DOCTOR' ? '/clinician' : '/admin'
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
    <AuthPageShell
      title="Đăng nhập"
      subtitle="Tài khoản đã đăng ký trong hệ thống bệnh viện."
    >
      <form className="flex flex-col space-y-3" onSubmit={handleSignIn}>
        <div className="flex flex-col space-y-1">
          <label className="px-1 text-sm font-medium text-on-surface-variant" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            className={authInputClass}
            placeholder="doctor@benhvien.vn"
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
              className={authInputClass}
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

        <div className="mt-1 flex gap-3">
          <button type="submit" disabled={submitting} className={authPrimaryBtn}>
            <span>{submitting ? 'Đang đăng nhập…' : 'Đăng nhập'}</span>
            <ArrowRight size={18} />
          </button>
          <Link to="/signup" className={authSecondaryBtn}>
            Đăng ký
          </Link>
        </div>
      </form>

      <div className="mt-4 text-center">
        <Link
          to="/entry"
          className="inline-flex items-center gap-1 text-sm text-on-surface-variant hover:underline"
        >
          <ArrowLeft size={16} />
          Quay lại trang chọn vai trò
        </Link>
      </div>
    </AuthPageShell>
  )
}
