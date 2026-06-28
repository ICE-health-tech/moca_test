import {
  Brain,
  ClipboardList,
  UserRound,
  ChevronRight,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { MocaPatientLayout } from '../../shared/components/layout/MocaPatientLayout'
import { useHealth } from '../../shared/hooks/useHealth'

const MENU = [
  {
    to: '/patient/test',
    label: 'Làm test MoCA',
    desc: 'Bài kiểm tra 9 phần',
    icon: Brain,
    color: 'bg-primary text-on-primary',
  },
  {
    to: '/patient/results',
    label: 'Kết quả',
    desc: 'Điểm tạm & chính thức',
    icon: ClipboardList,
    color: 'bg-secondary text-on-primary',
  },
  {
    to: '/patient/doctors',
    label: 'Bác sĩ',
    desc: 'Đổi bác sĩ phụ trách',
    icon: UserRound,
    color: 'bg-surface-container-high text-on-surface',
  },
]

export function PatientHomePage() {
  const navigate = useNavigate()
  const { data: health, isError } = useHealth()

  return (
    <MocaPatientLayout fitViewport>
      <section className="shrink-0 space-y-1">
        <p className="text-xs font-medium uppercase tracking-wider text-secondary">
          Task Overview
        </p>
        <h2 className="text-xl font-semibold text-on-surface md:text-2xl">
          Chào mừng trở lại
        </h2>
        {!isError && health && (
          <p className="text-xs text-secondary">
            API · {health.service} — {health.status}
          </p>
        )}
        {isError && (
          <p className="text-xs text-error">Không kết nối được API</p>
        )}
      </section>

      <div className="mt-4 grid min-h-0 flex-1 auto-rows-fr gap-3 sm:grid-cols-2">
        {MENU.map((item) => (
          <button
            key={item.to}
            type="button"
            onClick={() => navigate(item.to)}
            className="group flex min-h-[5.5rem] flex-col justify-between gap-2 rounded-xl border border-outline-variant bg-surface-container-lowest p-4 text-left transition-all hover:border-primary/40 active:scale-[0.98]"
          >
            <div
              className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${item.color}`}
            >
              <item.icon size={20} />
            </div>
            <div className="flex items-end justify-between gap-2">
              <div>
                <h3 className="text-base font-semibold text-on-surface">{item.label}</h3>
                <p className="text-xs text-on-surface-variant">{item.desc}</p>
              </div>
              <ChevronRight
                size={18}
                className="shrink-0 text-outline transition-transform group-hover:translate-x-0.5"
              />
            </div>
          </button>
        ))}
      </div>
    </MocaPatientLayout>
  )
}
