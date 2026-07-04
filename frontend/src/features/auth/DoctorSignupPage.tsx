import { ArrowLeft, ArrowRight, Eye, EyeOff } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { AuthPageShell, authInputClass, authPrimaryBtn } from './AuthPageShell'

export function DoctorSignupPage() {
  const user = useAuthStore((s) => s.user)
  const doctorSignup = useAuthStore((s) => s.doctorSignup)

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [licenseNumber, setLicenseNumber] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (user) {
    return <Navigate to={user.role === 'DOCTOR' ? '/doctor' : '/admin'} replace />
  }

  const handleSignup = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (password.length < 8) {
      setError('Mật khẩu tối thiểu 8 ký tự.')
      return
    }
    setSubmitting(true)
    try {
      await doctorSignup({
        email: email.trim(),
        password,
        fullName: fullName.trim(),
        specialty: specialty.trim() || undefined,
        licenseNumber: licenseNumber.trim() || undefined,
      })
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status
      if (status === 409) {
        setError('Email này đã được đăng ký. Vui lòng đăng nhập.')
      } else {
        setError('Không đăng ký được. Vui lòng thử lại sau.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthPageShell title="Đăng ký bác sĩ" subtitle="Tạo tài khoản mới để truy cập hệ thống.">
      <form className="flex flex-col space-y-3" onSubmit={handleSignup}>
        <div className="flex flex-col space-y-1">
          <label className="px-1 text-sm font-medium text-on-surface-variant" htmlFor="fullName">
            Họ và tên
          </label>
          <input
            id="fullName"
            className={authInputClass}
            placeholder="BS. Nguyễn Văn A"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </div>

        <div className="flex flex-col space-y-1">
          <label className="px-1 text-sm font-medium text-on-surface-variant" htmlFor="signup-email">
            Email
          </label>
          <input
            id="signup-email"
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
          <label className="px-1 text-sm font-medium text-on-surface-variant" htmlFor="signup-password">
            Mật khẩu
          </label>
          <div className="relative">
            <input
              id="signup-password"
              type={showPassword ? 'text' : 'password'}
              className={authInputClass}
              placeholder="Tối thiểu 8 ký tự"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
              minLength={8}
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

        <div className="flex flex-col space-y-1">
          <label className="px-1 text-sm font-medium text-on-surface-variant" htmlFor="specialty">
            Chuyên khoa <span className="text-outline">(không bắt buộc)</span>
          </label>
          <input
            id="specialty"
            className={authInputClass}
            placeholder="Thần kinh"
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
          />
        </div>

        <div className="flex flex-col space-y-1">
          <label className="px-1 text-sm font-medium text-on-surface-variant" htmlFor="license">
            Số CCHN <span className="text-outline">(không bắt buộc)</span>
          </label>
          <input
            id="license"
            className={authInputClass}
            placeholder="CCHN-12345"
            value={licenseNumber}
            onChange={(e) => setLicenseNumber(e.target.value)}
          />
        </div>

        {error && (
          <p className="text-sm text-error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" disabled={submitting} className={`mt-1 w-full ${authPrimaryBtn}`}>
          <span>{submitting ? 'Đang tạo tài khoản…' : 'Đăng ký'}</span>
          <ArrowRight size={18} />
        </button>
      </form>

      <div className="mt-4 flex flex-col items-center gap-2">
        <Link to="/login" className="text-sm font-medium text-primary hover:underline">
          Đã có tài khoản? Đăng nhập
        </Link>
        <Link
          to="/entry"
          className="inline-flex items-center gap-1 text-sm text-on-surface-variant hover:underline"
        >
          <ArrowLeft size={16} />
          Trang chủ
        </Link>
      </div>
    </AuthPageShell>
  )
}
