import {
  Cake, GraduationCap, LogOut, Mail, Phone, Pencil, User,
} from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { MocaPatientLayout } from '../../shared/components/layout/MocaPatientLayout'
import { formatDateVi } from '../../shared/utils/format'
import { formatPhoneDisplay } from '../../shared/utils/phone'
import { useUpdatePatientProfile } from './usePatientQueries'

const inputClass =
  'stitch-input w-full h-11 px-4 bg-surface-container-lowest border border-outline-variant rounded-lg text-sm text-on-surface placeholder:text-outline'

function displayGender(gender?: string) {
  if (!gender) return '—'
  return gender
}

export function PatientSettingsPage() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()
  const updateProfile = useUpdatePatientProfile()

  const [editing, setEditing] = useState(false)
  const [fullName, setFullName] = useState(user?.fullName ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [gender, setGender] = useState(user?.gender ?? '')
  const [dateOfBirth, setDateOfBirth] = useState(user?.dateOfBirth?.slice(0, 10) ?? '')
  const [educationYears, setEducationYears] = useState(
    user?.educationYears != null ? String(user.educationYears) : '',
  )
  const [error, setError] = useState<string | null>(null)

  const initials = user?.fullName
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() ?? 'BN'

  const startEdit = () => {
    setFullName(user?.fullName ?? '')
    setEmail(user?.email ?? '')
    setGender(user?.gender ?? '')
    setDateOfBirth(user?.dateOfBirth?.slice(0, 10) ?? '')
    setEducationYears(user?.educationYears != null ? String(user.educationYears) : '')
    setError(null)
    setEditing(true)
  }

  const handleSave = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      await updateProfile.mutateAsync({
        fullName: fullName.trim(),
        email: email.trim() || undefined,
        gender: gender || undefined,
        dateOfBirth: dateOfBirth || null,
        educationYears: educationYears ? Number(educationYears) : null,
      })
      setEditing(false)
    } catch {
      setError('Không lưu được thông tin. Thử lại sau.')
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/entry', { replace: true })
  }

  return (
    <MocaPatientLayout title="Cài đặt">
      <div className="mx-auto w-full max-w-lg space-y-6">
        <section className="flex flex-col items-center space-y-4 pt-2 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <span className="text-3xl font-bold text-primary">{initials}</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-on-surface">{user?.fullName ?? 'Người bệnh'}</h2>
            <p className="text-sm text-on-surface-variant">Bệnh nhân</p>
          </div>
          {!editing && (
            <button
              type="button"
              onClick={startEdit}
              className="inline-flex items-center gap-2 rounded-lg border border-outline-variant px-4 py-2 text-sm font-medium text-primary"
            >
              <Pencil size={16} />
              Chỉnh sửa hồ sơ
            </button>
          )}
        </section>

        {editing ? (
          <form
            onSubmit={handleSave}
            className="space-y-4 rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-5 shadow-sm"
          >
            <div className="space-y-1">
              <label className="px-1 text-xs font-semibold uppercase tracking-wider text-outline" htmlFor="fullName">
                Họ và tên
              </label>
              <input
                id="fullName"
                className={inputClass}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="px-1 text-xs font-semibold uppercase tracking-wider text-outline" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                className={inputClass}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="px-1 text-xs font-semibold uppercase tracking-wider text-outline" htmlFor="gender">
                Giới tính
              </label>
              <select
                id="gender"
                className={inputClass}
                value={gender}
                onChange={(e) => setGender(e.target.value)}
              >
                <option value="">—</option>
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
                <option value="Khác">Khác</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="px-1 text-xs font-semibold uppercase tracking-wider text-outline" htmlFor="dob">
                Ngày sinh
              </label>
              <input
                id="dob"
                type="date"
                className={inputClass}
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="px-1 text-xs font-semibold uppercase tracking-wider text-outline" htmlFor="edu">
                Số năm học
              </label>
              <input
                id="edu"
                type="number"
                min={0}
                max={30}
                className={inputClass}
                value={educationYears}
                onChange={(e) => setEducationYears(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-error">{error}</p>}
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="flex-1 rounded-lg border border-outline-variant py-2.5 text-sm font-medium"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={updateProfile.isPending}
                className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-medium text-on-primary disabled:opacity-60"
              >
                {updateProfile.isPending ? 'Đang lưu…' : 'Lưu'}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-6 rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-5 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="rounded-xl bg-primary/10 p-2.5">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 border-b border-outline-variant/10 pb-4">
                <p className="mb-0.5 text-xs font-semibold uppercase tracking-wider text-outline">Email</p>
                <p className="text-base text-on-surface">{user?.email || 'Chưa có'}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="rounded-xl bg-secondary/10 p-2.5">
                <Phone className="h-5 w-5 text-secondary" />
              </div>
              <div className="flex-1 border-b border-outline-variant/10 pb-4">
                <p className="mb-0.5 text-xs font-semibold uppercase tracking-wider text-outline">Số điện thoại</p>
                <p className="text-base text-on-surface">{formatPhoneDisplay(user?.phoneNumber)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-tertiary/10 p-2.5">
                  <User className="h-5 w-5 text-tertiary" />
                </div>
                <div>
                  <p className="mb-0.5 text-xs font-semibold uppercase tracking-wider text-outline">Giới tính</p>
                  <p className="text-base text-on-surface">{displayGender(user?.gender)}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-primary-container/10 p-2.5">
                  <Cake className="h-5 w-5 text-primary-container" />
                </div>
                <div>
                  <p className="mb-0.5 text-xs font-semibold uppercase tracking-wider text-outline">Ngày sinh</p>
                  <p className="text-base text-on-surface">
                    {user?.dateOfBirth ? formatDateVi(user.dateOfBirth) : '—'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="rounded-xl bg-secondary-container/10 p-2.5">
                <GraduationCap className="h-5 w-5 text-secondary-container" />
              </div>
              <div className="flex-1">
                <p className="mb-0.5 text-xs font-semibold uppercase tracking-wider text-outline">Học vấn</p>
                <p className="text-base text-on-surface">
                  {user?.educationYears != null ? `${user.educationYears} năm học` : '—'}
                </p>
              </div>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-error/30 py-3 text-sm font-medium text-error"
        >
          <LogOut size={18} />
          Đăng xuất
        </button>
      </div>
    </MocaPatientLayout>
  )
}
