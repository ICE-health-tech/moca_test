import { useRef, useState } from 'react'
import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas-pro'
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Compass,
  FileDown,
  FileText,
  Languages,
  Layers,
  MemoryStick,
  PenLine,
  Shapes,
  Tag,
  X,
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
  educationYears?: number | null
  gender?: string
  dateOfBirth?: string | null
}

export function PatientResultsSummary({
  session,
  patientName = '—',
  educationYears,
  gender,
  dateOfBirth,
}: Props) {
  const score = session.finalScore ?? session.provisionalScore ?? 0
  const isNormal = score >= 26
  const isPending = session.status === 'PENDING_REVIEW'
  const classification =
    session.classification ??
    (isNormal ? 'Nhận thức bình thường' : 'Dưới ngưỡng bình thường')

  const rootRef = useRef<HTMLDivElement>(null)
  const [exporting, setExporting] = useState(false)
  const [showReport, setShowReport] = useState(false)

  async function handleExportPdf() {
    const el = rootRef.current
    if (!el || exporting) return
    setExporting(true)

    // html2canvas-pro renders the glass cards' backdrop-filter: blur(12px),
    // which makes the whole PDF look soft. Disable it for the capture.
    const noBackdrop = document.createElement('style')
    noBackdrop.textContent =
      '* { backdrop-filter: none !important; -webkit-backdrop-filter: none !important; }'
    document.head.appendChild(noBackdrop)

    try {
      // Target ~240 DPI at A4 print width so text stays crisp.
      const targetWidthPx = 1800
      const scale = Math.max(2, Math.ceil(targetWidthPx / Math.max(el.offsetWidth, 1)))
      const canvas = await html2canvas(el, {
        scale,
        useCORS: true,
        backgroundColor: '#ffffff',
      })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 10
      const imgWidth = pageWidth - margin * 2
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      const printableHeight = pageHeight - margin * 2

      let heightLeft = imgHeight
      let position = margin
      pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight)
      heightLeft -= printableHeight
      while (heightLeft > 0) {
        position = margin - (imgHeight - heightLeft)
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight)
        heightLeft -= printableHeight
      }
      pdf.save(`moca-ket-qua-${session.id}.pdf`)
    } finally {
      document.head.removeChild(noBackdrop)
      setExporting(false)
    }
  }

  const pct = Math.min(100, Math.max(0, (score / 30) * 100))
  const thresholdPct = (26 / 30) * 100

  return (
    <>
      <div ref={rootRef} className="space-y-4 stitch-fade-in">
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
                Chờ bác sĩ duyệt, đây không phải là kết quả chính thức!
              </div>
            ) : isNormal ? (
              <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                <CheckCircle2 size={14} />
                {classification}
              </div>
            ) : (
              <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-800">
                <AlertTriangle size={14} />
                {classification}
              </div>
            )}
            <div className="mt-4 space-y-1.5">
              <div className="flex justify-between text-[10px] font-medium">
                <span>Thang điểm</span>
                <span>
                  {score}/30 · ≥26 Bình thường
                </span>
              </div>
              <div className="relative w-full rounded-full bg-surface-container">
                <div
                  className={[
                    'h-full rounded-full transition-[width]',
                    isNormal ? 'bg-primary' : 'bg-error',
                  ].join(' ')}
                  style={{ width: `${pct}%` }}
                />
                <div
                  className="absolute top-[-2px] h-[12px] w-0.5 rounded bg-on-surface-variant"
                  style={{ left: `${thresholdPct}%` }}
                  title="Ngưỡng 26/30"
                />
              </div>
            </div>
          </div>

          <div className="stitch-glass-card rounded-xl p-4">
            <h3 className="text-sm font-semibold text-on-surface">
              Thông tin bài kiểm tra
            </h3>
            <div className="mt-2 space-y-2 text-sm">
              <div>
                <p className="text-[10px] text-outline">Họ và tên</p>
                <p className="font-semibold">{patientName}</p>
              </div>
              {educationYears != null && (
                <div>
                  <p className="text-[10px] text-outline">Trình độ học vấn</p>
                  <p className="font-semibold">{educationYears} năm</p>
                </div>
              )}
              {gender && (
                <div>
                  <p className="text-[10px] text-outline">Giới tính</p>
                  <p className="font-semibold">{gender}</p>
                </div>
              )}
              {dateOfBirth && (
                <div>
                  <p className="text-[10px] text-outline">Ngày sinh</p>
                  <p className="font-semibold">{formatDateVi(dateOfBirth)}</p>
                </div>
              )}
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
            <h2 className="text-base font-semibold text-on-surface">
              Phân tích theo phần
            </h2>
            <div className="moca-scroll-x flex gap-3 pb-1">
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
              onClick={() => setShowReport(true)}
              className="flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-on-primary active:scale-[0.98]"
            >
              <FileText size={18} />
              Xem báo cáo đầy đủ
            </button>
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={exporting}
              className="flex items-center justify-center gap-2 rounded-xl border-2 border-primary py-3 text-sm font-semibold text-primary active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FileDown size={18} />
              {exporting ? 'Đang xuất…' : 'Xuất PDF'}
            </button>
          </section>
        )}
      </div>

      {/* Full report modal — rendered outside rootRef so it never lands in the PDF */}
      {showReport && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowReport(false)}
        >
          <div
            className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-surface p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold text-on-surface">Báo cáo đầy đủ</h2>
              <button
                type="button"
                onClick={() => setShowReport(false)}
                className="rounded-full p-1 text-on-surface-variant hover:bg-surface-container"
                aria-label="Đóng"
              >
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-primary">{score}</span>
                <span className="text-lg text-outline">/ 30</span>
                <span className="ml-2 rounded-full bg-secondary-container px-2 py-0.5 text-xs font-semibold text-on-secondary-container">
                  {classification}
                </span>
              </div>
              <ul className="space-y-2">
                {DEFAULT_SECTIONS.map((cat) => (
                  <li
                    key={cat.id}
                    className="flex items-start justify-between gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest p-2"
                  >
                    <span className="font-semibold">{cat.label}</span>
                    <span className="shrink-0 font-bold">{cat.score}</span>
                  </li>
                ))}
              </ul>
              <p className="text-[10px] text-outline">
                Điểm chi tiết từng phần sẽ hiển thị khi bác sĩ duyệt xong phiên
                này.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
