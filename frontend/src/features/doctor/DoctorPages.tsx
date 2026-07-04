import { AlertCircle, Sparkles, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AppShell } from '../../shared/components/AppShell'
import { GlassCard } from '../../shared/components/GlassCard'
import { QueryState } from '../../shared/components/QueryState'
import { formatDateVi } from '../../shared/utils/format'
import { useUiStore } from '../../stores/uiStore'
import { useDoctorPatients, useDoctorReviews } from './useDoctorQueries'

const DOCTOR_NAV = [
  { to: '/clinician', label: 'Dashboard' },
  { to: '/clinician/patients', label: 'Bệnh nhân' },
]

export function DoctorDashboardPage() {
  const { data: reviews = [], isLoading, error } = useDoctorReviews()
  const aiOn = useUiStore((s) => s.doctorAiAssist)
  const setAiOn = useUiStore((s) => s.setDoctorAiAssist)

  return (
    <AppShell title="Bác sĩ" nav={DOCTOR_NAV}>
      <div className="mb-4 grid shrink-0 gap-3 sm:grid-cols-3">
        <GlassCard>
          <p className="text-sm text-slate-500">Chờ duyệt</p>
          <p className="text-3xl font-bold text-amber-600">{reviews.length}</p>
        </GlassCard>
        <GlassCard>
          <p className="text-sm text-slate-500">Bệnh nhân</p>
          <p className="text-3xl font-bold text-blue-600">12</p>
        </GlassCard>
        <GlassCard>
          <p className="text-sm text-slate-500">AI hỗ trợ</p>
          <button
            type="button"
            onClick={() => setAiOn(!aiOn)}
            className="mt-1 flex items-center gap-2 text-lg font-bold text-violet-700"
          >
            <Sparkles size={20} />
            {aiOn ? 'Bật' : 'Tắt'}
          </button>
        </GlassCard>
      </div>

      <h2 className="mb-2 flex shrink-0 items-center gap-2 text-base font-bold text-slate-900">
        <AlertCircle size={20} className="text-amber-600" />
        Hàng chờ chấm điểm
      </h2>

      <QueryState isLoading={isLoading} error={error} isEmpty={reviews.length === 0}>
        <div className="space-y-2">
          {reviews.map((item) => (
            <GlassCard
              key={item.id}
              className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-bold text-slate-900">{item.patientName}</p>
                <p className="text-sm text-slate-600">
                  Nộp {formatDateVi(item.submittedAt)} · Điểm tạm{' '}
                  {item.provisionalScore}/30
                </p>
              </div>
              <Link
                to={`/clinician/reviews/${item.id}`}
                className="rounded-2xl bg-blue-600 px-4 py-2 text-center text-sm font-bold text-white hover:bg-blue-700"
              >
                Chấm điểm
              </Link>
            </GlassCard>
          ))}
        </div>
      </QueryState>
    </AppShell>
  )
}

export function DoctorPatientsPage() {
  const { data: patients = [], isLoading, error } = useDoctorPatients()

  return (
    <AppShell title="Bệnh nhân chỉ định" nav={DOCTOR_NAV}>
      <div className="mb-4 flex items-center gap-2 text-slate-600">
        <Users size={18} />
        <span>Danh sách bệnh nhân được gán cho bạn</span>
      </div>
      <QueryState isLoading={isLoading} error={error}>
        <div className="space-y-3">
          {patients.map((p) => (
            <GlassCard key={p.id}>
              <p className="font-bold text-slate-900">{p.name}</p>
              <p className="text-sm text-slate-600">
                Lần test gần nhất: {formatDateVi(p.lastTestAt)} · {p.lastScoreLabel}
                /30
              </p>
            </GlassCard>
          ))}
        </div>
      </QueryState>
    </AppShell>
  )
}
