import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Compass,
  FileDown,
  Languages,
  Layers,
  MemoryStick,
  PenLine,
  Shapes,
  Tag,
} from 'lucide-react'
import type { TestSessionSummary } from '../../shared/types/session'
import { formatDateVi } from '../../shared/utils/format'

type SectionScore = {
  id: string
  label: string
  score: string
  note: string
  icon: typeof PenLine
  highlight?: boolean
}

const DEFAULT_SECTIONS: SectionScore[] = [
  {
    id: 'visuospatial',
    label: 'Thị giác – không gian',
    score: '5/5',
    note: 'Nối theo mẫu, vẽ khối, vẽ đồng hồ.',
    icon: PenLine,
  },
  {
    id: 'naming',
    label: 'Gọi tên con vật',
    score: '3/3',
    note: 'Sư tử, tê giác, lạc đà.',
    icon: Tag,
  },
  {
    id: 'memory',
    label: 'Trí nhớ (ghi nhận)',
    score: '—',
    note: 'Ghi nhận tức thì (không tính điểm).',
    icon: MemoryStick,
  },
  {
    id: 'attention',
    label: 'Sự chú ý',
    score: '5/6',
    note: 'Sai dãy số đọc ngược.',
    icon: Layers,
    highlight: true,
  },
  {
    id: 'language',
    label: 'Ngôn ngữ',
    score: '3/3',
    note: 'Nhắc lại câu và sự lưu loát.',
    icon: Languages,
  },
  {
    id: 'abstraction',
    label: 'Tư duy trừu tượng',
    score: '2/2',
    note: 'Tìm điểm giống nhau giữa các vật.',
    icon: Shapes,
  },
  {
    id: 'delayed',
    label: 'Nhớ lại có trì hoãn',
    score: '4/5',
    note: 'Không nhớ «Vải nhung» khi không gợi ý.',
    icon: Clock,
    highlight: true,
  },
  {
    id: 'orientation',
    label: 'Định hướng',
    score: '6/6',
    note: 'Ngày, tháng, năm, thứ, địa điểm, thành phố.',
    icon: Compass,
  },
]

type Props = {
  session: TestSessionSummary
  patientName?: string
}

export function PatientResultsSummary({
  session,
  patientName = 'Bệnh nhân',
}: Props) {
  const score = session.finalScore ?? session.provisionalScore ?? 0
  const isNormal = score >= 26
  const isPending = session.status === 'PENDING_REVIEW'

  return (
    <div className="space-y-4 stitch-fade-in">
      {/* Hero score */}
      <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="stitch-glass-card relative overflow-hidden rounded-xl p-4 md:col-span-2">
          <p className="text-xs font-medium uppercase tracking-wider text-on-surface-variant">
            Tổng điểm
          </p>
          <div className="mt-0.5 flex items-baseline gap-1">
            <span className="text-5xl font-bold leading-none text-primary">
              {score}
            </span>
            <span className="text-xl font-medium text-outline">/ 30</span>
          </div>
          {isPending ? (
            <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
              <AlertTriangle size={14} />
              Chờ bác sĩ duyệt, đây không phải là quết quả chính thức!
            </div>
          ) : (
            <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-secondary-container px-3 py-1 text-xs font-semibold text-on-secondary-container">
              <CheckCircle2 size={14} />
              {session.classification ?? (isNormal ? 'Nhận thức bình thường' : 'Dưới ngưỡng bình thường')}
            </div>
          )}
          <div className="mt-4 space-y-1.5">
            <div className="flex justify-between text-[10px] font-medium">
              <span>Thang điểm</span>
              <span>≥26 Bình thường</span>
            </div>
            <div className="flex h-2 w-full overflow-hidden rounded-full bg-surface-container">
              <div className="h-full bg-error" style={{ width: '60%' }} />
              <div className="h-full bg-primary" style={{ width: '40%' }} />
            </div>
          </div>
        </div>

        <div className="stitch-glass-card rounded-xl p-4">
          <h3 className="text-sm font-semibold text-on-surface">Thông tin phiên</h3>
          <div className="mt-2 space-y-2 text-sm">
            <div>
              <p className="text-[10px] text-outline">Bệnh nhân</p>
              <p className="font-semibold">{patientName}</p>
            </div>
            <div>
              <p className="text-[10px] text-outline">Ngày làm bài</p>
              <p className="font-semibold">{formatDateVi(session.submittedAt)}</p>
            </div>
            <div>
              <p className="text-[10px] text-outline">Mã đề</p>
              <p className="font-semibold">{session.setId}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Category breakdown — horizontal scroll on mobile */}
      {!isPending && (
        <section className="space-y-2">
          <h2 className="text-base font-semibold text-on-surface">Phân tích theo phần</h2>
          <div className="flex gap-3 overflow-x-auto pb-1 snap-x snap-mandatory">
            {DEFAULT_SECTIONS.map((cat) => {
              const Icon = cat.icon
              return (
                <div
                  key={cat.id}
                  className={[
                    'w-36 shrink-0 snap-start rounded-xl border bg-surface-container-lowest p-3',
                    cat.highlight
                      ? 'border-primary ring-1 ring-primary/20'
                      : 'border-outline-variant',
                  ].join(' ')}
                >
                  <div className="mb-2 flex items-start justify-between">
                    <div
                      className={[
                        'rounded-lg p-1.5',
                        cat.highlight
                          ? 'bg-primary text-on-primary'
                          : 'bg-primary-fixed text-on-primary-fixed-variant',
                      ].join(' ')}
                    >
                      <Icon size={16} />
                    </div>
                    <span className="text-sm font-bold">{cat.score}</span>
                  </div>
                  <p className="text-xs font-semibold leading-tight">{cat.label}</p>
                  <p
                    className={[
                      'mt-0.5 line-clamp-2 text-[10px]',
                      cat.highlight ? 'text-error' : 'text-outline',
                    ].join(' ')}
                  >
                    {cat.note}
                  </p>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Actions */}
      {!isPending && (
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            className="flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-on-primary active:scale-[0.98]"
          >
            <CheckCircle2 size={18} />
            Xem báo cáo đầy đủ
          </button>
          <button
            type="button"
            className="flex items-center justify-center gap-2 rounded-xl border-2 border-primary py-3 text-sm font-semibold text-primary active:scale-[0.98]"
          >
            <FileDown size={18} />
            Xuất PDF
          </button>
        </section>
      )}
    </div>
  )
}
