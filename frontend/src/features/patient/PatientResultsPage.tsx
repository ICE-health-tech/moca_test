import { useState } from 'react'
import { MocaPatientLayout } from '../../shared/components/layout/MocaPatientLayout'
import { EmptyTestsState } from '../../shared/components/layout/EmptyTestsState'
import { QueryState } from '../../shared/components/QueryState'
import { useUiStore, type ResultsFilter } from '../../stores/uiStore'
import { useAuthStore } from '../../stores/authStore'
import { formatDateVi } from '../../shared/utils/format'
import { usePatientSessions } from './usePatientQueries'
import { PatientResultsSummary } from './PatientResultsSummary'
import './PatientResults.css'

const FILTERS: { id: ResultsFilter; label: string }[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'pending', label: 'Chờ duyệt' },
  { id: 'final', label: 'Đã duyệt' },
]

export function PatientResultsPage() {
  const { data = [], isLoading, error } = usePatientSessions()
  const filter = useUiStore((s) => s.patientResultsFilter)
  const setFilter = useUiStore((s) => s.setPatientResultsFilter)
  const user = useAuthStore((s) => s.user)
  const patientName = user?.fullName

  const filtered = data.filter((r) => {
    if (filter === 'pending') return r.status === 'PENDING_REVIEW'
    if (filter === 'final') return r.status === 'FINALIZED'
    return true
  })

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const activeSession =
    filtered.find((s) => s.id === selectedId) ??
    filtered.find((s) => s.status === 'FINALIZED') ??
    filtered[0]

  return (
    <MocaPatientLayout title="Kết quả">
      <div className="sticky top-0 z-10 -mx-1 mb-3 flex shrink-0 flex-wrap gap-2 bg-surface py-1">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={[
              'rounded-full px-3 py-1 text-sm font-medium transition',
              filter === f.id
                ? 'bg-primary text-on-primary'
                : 'border border-outline-variant bg-surface-container-lowest text-on-surface-variant',
            ].join(' ')}
          >
            {f.label}
          </button>
        ))}
      </div>

      <QueryState
        isLoading={isLoading}
        error={error}
        isEmpty={filtered.length === 0}
        empty={<EmptyTestsState />}
      >
        {activeSession && (
          <>
            {filtered.length > 1 && (
              <div className="moca-scroll-x mb-3 flex shrink-0 gap-2 pb-1">
                {filtered.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSelectedId(s.id)}
                    className={[
                      'shrink-0 rounded-lg border px-3 py-1.5 text-left text-xs transition',
                      s.id === activeSession.id
                        ? 'border-primary bg-primary-fixed text-on-primary-fixed-variant'
                        : 'border-outline-variant bg-white hover:border-primary/40',
                    ].join(' ')}
                  >
                    <span className="font-medium">{formatDateVi(s.submittedAt)}</span>
                    <span className="ml-2 opacity-70">
                      {s.finalScore ?? s.provisionalScore ?? '—'}/30
                    </span>
                  </button>
                ))}
              </div>
            )}
            <PatientResultsSummary
              session={activeSession}
              patientName={patientName ?? undefined}
              educationYears={user?.educationYears}
              gender={user?.gender}
              dateOfBirth={user?.dateOfBirth}
            />
          </>
        )}
      </QueryState>
    </MocaPatientLayout>
  )
}
