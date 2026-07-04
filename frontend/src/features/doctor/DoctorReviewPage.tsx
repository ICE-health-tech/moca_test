import React from 'react'
import { Sparkles, Loader2 } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { AppShell } from '../../shared/components/AppShell'
import { GlassCard } from '../../shared/components/GlassCard'
import { formatDateTimeVi } from '../../shared/utils/format'
import { useApproveReview, useSessionDetail } from './useDoctorQueries'
import type { SectionScore } from './doctor.api'

const DOCTOR_NAV = [
  { to: '/clinician', label: 'Dashboard' },
  { to: '/clinician/patients', label: 'Bệnh nhân' },
]

function SectionReviewCard({
  section,
  value,
  onChange,
}: {
  section: SectionScore
  value: number | null
  onChange: (v: number) => void
}) {
  const displayValue = value ?? section.autoScore ?? 0
  const isAdjusted = value !== null && value !== section.autoScore

  return (
    <GlassCard>
      <h3 className="mb-3 font-bold text-slate-900">
        {section.label} ({section.maxPoints})
      </h3>

      <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
        {section.note ?? 'Không có ghi chú'}
      </div>

      {section.autoScore !== null && (
        <div className="mt-4 rounded-2xl bg-violet-50 p-4 text-sm text-violet-900">
          <p className="flex items-center gap-2 font-semibold">
            <Sparkles size={16} /> Gợi ý AI
          </p>
          <p className="mt-1">
            Điểm tự động: {section.autoScore}/{section.maxPoints}
            {isAdjusted && (
              <span className="ml-2 text-amber-600">
                (đã điều chỉnh thành {value}/{section.maxPoints})
              </span>
            )}
          </p>
        </div>
      )}

      <label className="mt-4 block text-sm font-semibold text-slate-700">
        Điểm bác sĩ
        <input
          type="number"
          min={0}
          max={section.maxPoints}
          value={displayValue}
          onChange={(e) => {
            const v = Math.min(section.maxPoints, Math.max(0, Number(e.target.value)))
            onChange(v)
          }}
          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
        />
      </label>
    </GlassCard>
  )
}

export function DoctorReviewPage() {
  const { id } = useParams<{ id: string }>()
  const { data: session, isLoading, error } = useSessionDetail(id ?? '')
  const approveMutation = useApproveReview(id ?? '')

  const [scores, setScores] = React.useState<Record<string, number>>({})

  // Reset scores when session loads
  React.useEffect(() => {
    if (session) {
      const initial: Record<string, number> = {}
      for (const s of session.sectionScores) {
        if (s.doctorScore !== null) initial[s.sectionKey] = s.doctorScore
      }
      setScores(initial)
    }
  }, [session])

  const setSectionScore = (sectionKey: string, value: number) => {
    setScores((prev) => ({ ...prev, [sectionKey]: value }))
  }

  if (isLoading) {
    return (
      <AppShell title="Chấm điểm bài làm" nav={DOCTOR_NAV}>
        <div className="flex items-center justify-center gap-2 py-12 text-slate-500">
          <Loader2 size={20} className="animate-spin" />
          Đang tải…
        </div>
      </AppShell>
    )
  }

  if (error || !session) {
    return (
      <AppShell title="Chấm điểm bài làm" nav={DOCTOR_NAV}>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          Không tải được dữ liệu: {error?.message ?? 'Không tìm thấy phiên làm bài'}
        </div>
      </AppShell>
    )
  }

  const isFinalized = session.status === 'FINALIZED'
  const sectionsToReview = session.sectionScores.filter(
    (s) => s.maxPoints > 0,
  )

  const handleApprove = () => {
    approveMutation.mutate({
      scores: sectionsToReview.map((s) => ({
        sectionKey: s.sectionKey,
        doctorScore: scores[s.sectionKey] ?? s.autoScore ?? 0,
      })),
    })
  }

  const handleAcceptAi = () => {
    const accepted: Record<string, number> = {}
    for (const s of sectionsToReview) {
      if (s.autoScore !== null) accepted[s.sectionKey] = s.autoScore
    }
    setScores((prev) => ({ ...prev, ...accepted }))
  }

  return (
    <AppShell title="Chấm điểm bài làm" nav={DOCTOR_NAV}>
      <GlassCard className="mb-4">
        <p className="text-sm text-slate-500">Bệnh nhân</p>
        <p className="text-xl font-bold text-slate-900">
          {session.patientName}
        </p>
        <p className="mt-1 text-sm text-slate-600">
          {session.setId} · {formatDateTimeVi(session.submittedAt)}
        </p>
        {isFinalized && (
          <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
            Đã duyệt · {session.finalScore}/30 — {session.classification}
          </div>
        )}
      </GlassCard>

      <div className="grid gap-4 lg:grid-cols-2">
        {sectionsToReview.map((section) => (
          <SectionReviewCard
            key={section.sectionKey}
            section={section}
            value={scores[section.sectionKey] ?? null}
            onChange={(v) => setSectionScore(section.sectionKey, v)}
          />
        ))}
      </div>

      {!isFinalized && (
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleAcceptAi}
            className="rounded-2xl border border-violet-200 bg-violet-50 px-5 py-3 font-bold text-violet-700 hover:bg-violet-100"
          >
            Chấp nhận gợi ý AI
          </button>
          <button
            type="button"
            onClick={handleApprove}
            disabled={approveMutation.isPending}
            className="rounded-2xl bg-blue-600 px-5 py-3 font-bold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {approveMutation.isPending ? 'Đang duyệt…' : 'Lưu & hoàn tất duyệt'}
          </button>
          <Link
            to="/clinician"
            className="rounded-2xl border border-slate-200 px-5 py-3 font-medium text-slate-700 hover:bg-white"
          >
            Quay lại
          </Link>
        </div>
      )}

      {approveMutation.isSuccess && (
        <div className="mt-4 rounded-2xl bg-green-50 p-4 text-sm text-green-800">
          Đã duyệt thành công! Điểm chính thức: {session.finalScore}/30.
          <Link
            to="/clinician"
            className="ml-2 font-semibold text-green-900 underline"
          >
            Về dashboard
          </Link>
        </div>
      )}
    </AppShell>
  )
}
