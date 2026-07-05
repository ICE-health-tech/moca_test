import { api } from '../../shared/lib/axios'
import { useMockApi } from '../../shared/lib/useMockApi'

const USE_MOCK = useMockApi()

export type ReviewQueueItem = {
  id: string
  patientName: string
  submittedAt: string
  provisionalScore: number
  setId: string
}

export type DoctorPatientSession = {
  id: string
  submittedAt: string
  score: number | null
  maxScore: number
  status: 'PENDING_REVIEW' | 'FINALIZED'
  classification: string | null
}

export type DoctorPatient = {
  id: string
  name: string
  phone: string
  lastTestAt: string
  lastScoreLabel: string
  sessions: DoctorPatientSession[]
}

export type SectionScore = {
  sectionKey: string
  label: string
  maxPoints: number
  autoScore: number | null
  doctorScore: number | null
  note: string | null
}

export type SessionDetail = {
  id: string
  patientId: string
  patientName: string
  submittedAt: string
  setId: string
  status: 'PENDING_REVIEW' | 'FINALIZED'
  provisionalScore: number | null
  finalScore: number | null
  classification: string | null
  educationBonus: number | null
  sectionScores: SectionScore[]
}

export type ApproveReviewPayload = {
  scores: { sectionKey: string; doctorScore: number }[]
}

const MOCK_REVIEWS: ReviewQueueItem[] = [
  {
    id: 's1',
    patientName: 'Nguyễn Văn Bệnh',
    submittedAt: '2026-06-24T08:00:00Z',
    provisionalScore: 22,
    setId: 'MOCA_SET_1',
  },
  {
    id: 's2',
    patientName: 'Trần Thị Lan',
    submittedAt: '2026-06-23T16:30:00Z',
    provisionalScore: 19,
    setId: 'MOCA_SET_1',
  },
]

const MOCK_PATIENTS: DoctorPatient[] = [
  {
    id: 'p1',
    name: 'Nguyễn Văn Bệnh',
    phone: '0912345678',
    lastTestAt: '2026-06-24T08:00:00Z',
    lastScoreLabel: '22 (chờ)',
    sessions: [
      { id: 's1', submittedAt: '2026-06-24T08:00:00Z', score: 22, maxScore: 30, status: 'PENDING_REVIEW', classification: null },
    ],
  },
  {
    id: 'p2',
    name: 'Trần Thị Lan',
    phone: '0909876543',
    lastTestAt: '2026-06-20T10:00:00Z',
    lastScoreLabel: '25',
    sessions: [
      { id: 's3', submittedAt: '2026-06-20T10:00:00Z', score: 25, maxScore: 30, status: 'FINALIZED', classification: 'Dưới ngưỡng bình thường' },
      { id: 's4', submittedAt: '2026-05-15T14:00:00Z', score: 27, maxScore: 30, status: 'FINALIZED', classification: 'Nhận thức bình thường' },
    ],
  },
  {
    id: 'p3',
    name: 'Lê Văn An',
    phone: '0933555777',
    lastTestAt: '2026-06-25T09:00:00Z',
    lastScoreLabel: '18 (chờ)',
    sessions: [
      { id: 's5', submittedAt: '2026-06-25T09:00:00Z', score: 18, maxScore: 30, status: 'PENDING_REVIEW', classification: null },
    ],
  },
]

export async function listDoctorReviews(
  doctorId: string,
): Promise<ReviewQueueItem[]> {
  if (USE_MOCK) return MOCK_REVIEWS
  const { data } = await api.get<ReviewQueueItem[]>(
    `/api/clinician/${doctorId}/reviews`,
  )
  return data
}

export async function listDoctorPatients(
  doctorId: string,
): Promise<DoctorPatient[]> {
  if (USE_MOCK) return MOCK_PATIENTS
  const { data } = await api.get<DoctorPatient[]>(
    `/api/clinician/${doctorId}/patients`,
  )
  return data
}

const MOCK_SESSION_DETAIL: Record<string, SessionDetail> = {
  s1: {
    id: 's1',
    patientId: 'p1',
    patientName: 'Nguyễn Văn Bệnh',
    submittedAt: '2026-06-24T08:00:00Z',
    setId: 'MOCA_SET_1',
    status: 'PENDING_REVIEW',
    provisionalScore: 22,
    finalScore: null,
    classification: null,
    educationBonus: 1,
    sectionScores: [
      { sectionKey: 'visuospatial', label: 'Thị giác – không gian', maxPoints: 5, autoScore: 4, doctorScore: null, note: 'Đồng hồ thiếu kim phút đúng 11:10' },
      { sectionKey: 'naming', label: 'Gọi tên con vật', maxPoints: 3, autoScore: 3, doctorScore: null, note: null },
      { sectionKey: 'memory', label: 'Trí nhớ (ghi nhận)', maxPoints: 0, autoScore: null, doctorScore: null, note: 'Ghi nhận tức thì (không tính điểm)' },
      { sectionKey: 'attention', label: 'Sự chú ý', maxPoints: 6, autoScore: 5, doctorScore: null, note: 'Sai dãy số đọc ngược' },
      { sectionKey: 'language', label: 'Ngôn ngữ', maxPoints: 3, autoScore: 3, doctorScore: null, note: null },
      { sectionKey: 'abstraction', label: 'Tư duy trừu tượng', maxPoints: 2, autoScore: 2, doctorScore: null, note: null },
      { sectionKey: 'delayed', label: 'Nhớ lại có trì hoãn', maxPoints: 5, autoScore: 4, doctorScore: null, note: 'Không nhớ «Vải nhung» khi không gợi ý' },
      { sectionKey: 'orientation', label: 'Định hướng', maxPoints: 6, autoScore: 6, doctorScore: null, note: null },
    ],
  },
  s2: {
    id: 's2',
    patientId: 'p2',
    patientName: 'Trần Thị Lan',
    submittedAt: '2026-06-23T16:30:00Z',
    setId: 'MOCA_SET_1',
    status: 'PENDING_REVIEW',
    provisionalScore: 19,
    finalScore: null,
    classification: null,
    educationBonus: 1,
    sectionScores: [
      { sectionKey: 'visuospatial', label: 'Thị giác – không gian', maxPoints: 5, autoScore: 4, doctorScore: null, note: null },
      { sectionKey: 'naming', label: 'Gọi tên con vật', maxPoints: 3, autoScore: 3, doctorScore: null, note: null },
      { sectionKey: 'memory', label: 'Trí nhớ (ghi nhận)', maxPoints: 0, autoScore: null, doctorScore: null, note: 'Ghi nhận tức thì (không tính điểm)' },
      { sectionKey: 'attention', label: 'Sự chú ý', maxPoints: 6, autoScore: 5, doctorScore: null, note: null },
      { sectionKey: 'language', label: 'Ngôn ngữ', maxPoints: 3, autoScore: 2, doctorScore: null, note: null },
      { sectionKey: 'abstraction', label: 'Tư duy trừu tượng', maxPoints: 2, autoScore: 2, doctorScore: null, note: null },
      { sectionKey: 'delayed', label: 'Nhớ lại có trì hoãn', maxPoints: 5, autoScore: 3, doctorScore: null, note: 'Không nhớ «Vải nhung»' },
      { sectionKey: 'orientation', label: 'Định hướng', maxPoints: 6, autoScore: 6, doctorScore: null, note: null },
    ],
  },
  s5: {
    id: 's5',
    patientId: 'p3',
    patientName: 'Lê Văn An',
    submittedAt: '2026-06-25T09:00:00Z',
    setId: 'MOCA_SET_1',
    status: 'PENDING_REVIEW',
    provisionalScore: 18,
    finalScore: null,
    classification: null,
    educationBonus: 1,
    sectionScores: [
      { sectionKey: 'visuospatial', label: 'Thị giác – không gian', maxPoints: 5, autoScore: 3, doctorScore: null, note: 'Vẽ khối lập phương thiếu nét' },
      { sectionKey: 'naming', label: 'Gọi tên con vật', maxPoints: 3, autoScore: 2, doctorScore: null, note: 'Không nhận ra tê giác' },
      { sectionKey: 'memory', label: 'Trí nhớ (ghi nhận)', maxPoints: 0, autoScore: null, doctorScore: null, note: 'Ghi nhận tức thì (không tính điểm)' },
      { sectionKey: 'attention', label: 'Sự chú ý', maxPoints: 6, autoScore: 4, doctorScore: null, note: 'Sai cả dãy xuôi và ngược' },
      { sectionKey: 'language', label: 'Ngôn ngữ', maxPoints: 3, autoScore: 2, doctorScore: null, note: 'Câu 2 không nhắc lại được' },
      { sectionKey: 'abstraction', label: 'Tư duy trừu tượng', maxPoints: 2, autoScore: 1, doctorScore: null, note: null },
      { sectionKey: 'delayed', label: 'Nhớ lại có trì hoãn', maxPoints: 5, autoScore: 3, doctorScore: null, note: 'Chỉ nhớ 3/5 từ' },
      { sectionKey: 'orientation', label: 'Định hướng', maxPoints: 6, autoScore: 6, doctorScore: null, note: null },
    ],
  },
}

export async function getSessionDetail(
  sessionId: string,
): Promise<SessionDetail> {
  if (USE_MOCK) {
    const detail = MOCK_SESSION_DETAIL[sessionId]
    if (!detail) throw new Error(`Session ${sessionId} not found`)
    return detail
  }
  const { data } = await api.get<SessionDetail>(
    `/api/clinician/reviews/${sessionId}`,
  )
  return data
}

export async function approveReview(
  sessionId: string,
  payload: ApproveReviewPayload,
): Promise<SessionDetail> {
  if (USE_MOCK) {
    const detail = MOCK_SESSION_DETAIL[sessionId]
    if (!detail) throw new Error(`Session ${sessionId} not found`)
    const doctorTotal = payload.scores.reduce((sum, s) => sum + s.doctorScore, 0)
    const bonus = detail.educationBonus ?? 0
    detail.finalScore = Math.min(30, doctorTotal + bonus)
    detail.status = 'FINALIZED'
    detail.classification = doctorTotal >= 26
      ? 'Nhận thức bình thường'
      : 'Dưới ngưỡng bình thường'
    for (const s of payload.scores) {
      const sec = detail.sectionScores.find((ss) => ss.sectionKey === s.sectionKey)
      if (sec) sec.doctorScore = s.doctorScore
    }
    return detail
  }
  const { data } = await api.patch<SessionDetail>(
    `/api/clinician/reviews/${sessionId}/approve`,
    payload,
  )
  return data
}
