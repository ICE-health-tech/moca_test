import { Plus, Stethoscope, Users } from 'lucide-react'
import { AppShell } from '../../shared/components/AppShell'
import { GlassCard } from '../../shared/components/GlassCard'
import { QueryState } from '../../shared/components/QueryState'
import { useAdminDoctors, useAdminStats } from './useAdminQueries'

const ADMIN_NAV = [
  { to: '/admin', label: 'Dashboard' },
  { to: '/admin/clinicians', label: 'Bác sĩ' },
]

export function AdminDashboardPage() {
  const { data: stats, isLoading, error } = useAdminStats()

  const cards = stats
    ? [
        { label: 'Bác sĩ', value: stats.doctorCount, icon: Stethoscope },
        { label: 'Bệnh nhân', value: stats.patientCount, icon: Users },
        { label: 'Chờ duyệt', value: stats.pendingReviews, icon: Plus },
        { label: 'Test tháng này', value: stats.testsThisMonth, icon: Plus },
      ]
    : []

  return (
    <AppShell title="Quản trị" nav={ADMIN_NAV}>
      <QueryState isLoading={isLoading} error={error}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((stat) => (
            <GlassCard key={stat.label}>
              <stat.icon size={20} className="text-blue-600" />
              <p className="mt-2 text-sm text-slate-500">{stat.label}</p>
              <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
            </GlassCard>
          ))}
        </div>
      </QueryState>
    </AppShell>
  )
}

export function AdminDoctorsPage() {
  const { data: doctors = [], isLoading, error } = useAdminDoctors()

  return (
    <AppShell title="Quản lý bác sĩ" nav={ADMIN_NAV}>
      <button
        type="button"
        className="mb-6 inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 font-bold text-white hover:bg-blue-700"
      >
        <Plus size={18} />
        Thêm bác sĩ
      </button>
      <QueryState isLoading={isLoading} error={error}>
        <div className="space-y-3">
          {doctors.map((d) => (
            <GlassCard key={d.id} className="flex justify-between gap-4">
              <div>
                <p className="font-bold text-slate-900">{d.name}</p>
                <p className="text-sm text-slate-600">
                  {d.specialty} · {d.patientCount} bệnh nhân
                </p>
              </div>
              <span
                className={`self-start rounded-full px-3 py-1 text-xs font-semibold ${
                  d.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {d.active ? 'Hoạt động' : 'Tắt'}
              </span>
            </GlassCard>
          ))}
        </div>
      </QueryState>
    </AppShell>
  )
}
