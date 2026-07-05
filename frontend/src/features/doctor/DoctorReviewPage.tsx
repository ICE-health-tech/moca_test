import React from 'react'
import { Minus, Plus, Sparkles, Loader2 } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { AppShell } from '../../shared/components/AppShell'
import { GlassCard } from '../../shared/components/GlassCard'
import { api } from '../../shared/lib/axios'
import { formatDateTimeVi } from '../../shared/utils/format'
import { useApproveReview, useSessionDetail } from './useDoctorQueries'
import type { SectionScore } from './doctor.api'
import {
  SectionPatientEvidence,
  canvasInlineSrc,
  type RawAnswers,
} from './sectionEvidence'

const DOCTOR_NAV = [
  { to: '/clinician', label: 'Dashboard' },
  { to: '/clinician/patients', label: 'Bệnh nhân' },
]

const SECTION_ORDER = [
  'visuospatial',
  'naming',
  'attention',
  'language',
  'abstraction',
  'delayed',
  'orientation',
]

const DRAWING_KEYS = [
  { key: 'section_1a_trail_canvas', label: 'Nối điểm' },
  { key: 'section_1b_cube_canvas', label: 'Khối lập phương' },
  { key: 'section_1c_clock_canvas', label: 'Đồng hồ' },
] as const

function sortSections(sections: SectionScore[]) {
  return [...sections].sort((a, b) => {
    const ai = SECTION_ORDER.indexOf(a.sectionKey)
    const bi = SECTION_ORDER.indexOf(b.sectionKey)
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
  })
}

function DrawingThumb({
  sessionId,
  answerKey,
  label,
  inlineSrc,
}: {
  sessionId: string
  answerKey: string
  label: string
  inlineSrc?: string | null
}) {
  const [src, setSrc] = React.useState<string | null>(inlineSrc ?? null)
  const [failed, setFailed] = React.useState(false)

  React.useEffect(() => {
    if (inlineSrc) {
      setSrc(inlineSrc)
      setFailed(false)
      return
    }

    let objectUrl: string | null = null
    let cancelled = false

    api
      .get(`/api/test-sessions/${sessionId}/drawings/${answerKey}`, {
        responseType: 'blob',
      })
      .then((res) => {
        if (cancelled) return
        objectUrl = URL.createObjectURL(res.data)
        setSrc(objectUrl)
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })

    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [sessionId, answerKey, inlineSrc])

  return (
    <figure className="flex flex-col items-center gap-1">
      <div className="flex h-20 w-full items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white">
        {src ? (
          <img src={src} alt={label} className="max-h-full max-w-full object-contain" />
        ) : (
          <span className="px-2 text-center text-xs text-slate-400">
            {failed ? 'Không tải được' : 'Đang tải…'}
          </span>
        )}
      </div>
      <figcaption className="text-xs text-slate-500">{label}</figcaption>
    </figure>
  )
}

function SectionReviewCard({
  sessionId,
  section,
  rawAnswers,
  value,
  onChange,
  readOnly,
}: {
  sessionId: string
  section: SectionScore
  rawAnswers: RawAnswers | undefined
  value: number | null
  onChange: (v: number) => void
  readOnly: boolean
}) {
  const displayValue = value ?? section.autoScore ?? 0
  const isAdjusted =
    value !== null && section.autoScore !== null && value !== section.autoScore

  const bump = (delta: number) => {
    const next = Math.min(section.maxPoints, Math.max(0, displayValue + delta))
    onChange(next)
  }

  return (
    <GlassCard>
      <h3 className="mb-3 font-bold text-slate-900">
        {section.label}{' '}
        <span className="font-normal text-slate-500">(0–{section.maxPoints})</span>
      </h3>

      {section.sectionKey === 'visuospatial' && (
        <div className="mb-4 grid grid-cols-3 gap-2">
          {DRAWING_KEYS.map((d) => (
            <DrawingThumb
              key={d.key}
              sessionId={sessionId}
              answerKey={d.key}
              label={d.label}
              inlineSrc={canvasInlineSrc(rawAnswers, d.key)}
            />
          ))}
        </div>
      )}

      <SectionPatientEvidence sectionKey={section.sectionKey} rawAnswers={rawAnswers} />

      {section.note && (
        <div className="mt-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
          {section.note}
        </div>
      )}

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

      <div className="mt-4">
        <p className="text-sm font-semibold text-slate-700">Điểm bác sĩ</p>
        {readOnly ? (
          <p className="mt-1 text-lg font-bold text-slate-900">
            {section.doctorScore ?? section.autoScore ?? 0}/{section.maxPoints}
          </p>
        ) : (
          <div className="mt-2 flex items-center gap-3">
            <button
              type="button"
              aria-label="Giảm điểm"
              onClick={() => bump(-1)}
              className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            >
              <Minus size={18} />
            </button>
            <span className="min-w-[3rem] text-center text-xl font-bold text-slate-900">
              {displayValue}
            </span>
            <button
              type="button"
              aria-label="Tăng điểm"
              onClick={() => bump(1)}
              className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            >
              <Plus size={18} />
            </button>
            <span className="text-sm text-slate-500">/ {section.maxPoints}</span>
          </div>
        )}
      </div>
    </GlassCard>
  )
}

function ScoreOverviewBar({
  autoScore,
  doctorScore,
  educationBonus,
}: {
  autoScore: number
  doctorScore: number
  educationBonus: number
}) {
  const total = Math.min(30, doctorScore + educationBonus)
  const pct = Math.round((total / 30) * 100)

  return (
    <GlassCard className="mb-4">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm text-slate-600">
        <span>
          Điểm tự động:{' '}
          <strong className="text-slate-900">{autoScore}</strong>
        </span>
        <span>
          Bạn chấm:{' '}
          <strong className="text-slate-900">{doctorScore}</strong>
        </span>
        <span>
          Tổng:{' '}
          <strong className="text-slate-900">
            {total}/30
          </strong>
          {educationBonus > 0 && (
            <span className="text-emerald-700"> (+{educationBonus} học vấn)</span>
          )}
        </span>
      </div>
      <div
        className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200"
        role="progressbar"
        aria-valuenow={total}
        aria-valuemin={0}
        aria-valuemax={30}
      >
        <div
          className="h-full rounded-full bg-blue-600 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </GlassCard>
  )
}

export function DoctorReviewPage() {
  const { id } = useParams<{ id: string }>()
  const { data: session, isLoading, error } = useSessionDetail(id ?? '')
  const approveMutation = useApproveReview(id ?? '')

  const [scores, setScores] = React.useState<Record<string, number>>({})

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
  const sectionsToReview = sortSections(
    session.sectionScores.filter((s) => s.maxPoints > 0),
  )
  const educationBonus = session.educationBonus ?? 0
  const autoScore = session.provisionalScore ?? 0
  const doctorSectionTotal = sectionsToReview.reduce(
    (sum, s) => sum + (scores[s.sectionKey] ?? s.autoScore ?? 0),
    0,
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
      <div className="pb-28 lg:pb-8">
        <GlassCard className="mb-4">
          <p className="text-sm text-slate-500">Bệnh nhân</p>
          <p className="text-xl font-bold text-slate-900">{session.patientName}</p>
          <p className="mt-1 text-sm text-slate-600">
            {session.setId} · {formatDateTimeVi(session.submittedAt)}
          </p>
          {isFinalized ? (
            <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
              Đã duyệt · {session.finalScore}/30 — {session.classification}
            </div>
          ) : (
            <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">
              Chờ bác sĩ duyệt
              {session.provisionalScore != null && (
                <span>· Tạm {session.provisionalScore}/30</span>
              )}
            </div>
          )}
        </GlassCard>

        {sectionsToReview.length > 0 && (
          <ScoreOverviewBar
            autoScore={autoScore}
            doctorScore={doctorSectionTotal}
            educationBonus={educationBonus}
          />
        )}

        {sectionsToReview.length === 0 ? (
          <GlassCard>
            <p className="text-sm text-slate-600">
              Chưa có dữ liệu chấm điểm cho phiên này. Vui lòng liên hệ IT nếu bệnh
              nhân đã nộp bài.
            </p>
          </GlassCard>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {sectionsToReview.map((section) => (
              <SectionReviewCard
                key={section.sectionKey}
                sessionId={session.id}
                section={section}
                rawAnswers={session.rawAnswers}
                value={scores[section.sectionKey] ?? null}
                onChange={(v) => setSectionScore(section.sectionKey, v)}
                readOnly={isFinalized}
              />
            ))}
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

        {approveMutation.isError && (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            Không duyệt được: {(approveMutation.error as Error)?.message ?? 'Lỗi máy chủ'}
          </div>
        )}
      </div>

      {!isFinalized && sectionsToReview.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur lg:static lg:mt-6 lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
          <div className="mx-auto flex max-w-5xl flex-wrap gap-3">
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
        </div>
      )}
    </AppShell>
  )
}
