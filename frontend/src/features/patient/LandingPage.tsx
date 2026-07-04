import {
  ArrowRight,
  BarChart3,
  Brain,
  ClipboardList,
  Compass,
  Focus,
  Home,
  Languages,
  LayoutGrid,
  Lightbulb,
  LineChart,
  ListOrdered,
  Menu,
  MousePointerClick,
  RotateCcw,
  Scan,
  Stethoscope,
  UserRound,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { validateVnPhone } from '../../shared/utils/phone'
import '../../styles/stitch-elderly.css'

/* LAYOUT: header | scroll body | footer | bottom nav | phone sheet (modal) */

const inputClass =
  'stitch-input w-full h-12 px-5 bg-surface-container-lowest border-2 border-outline rounded-xl text-lg text-on-surface placeholder:text-on-surface-variant'

const steps = [
  {
    icon: MousePointerClick,
    title: '1. Bắt đầu dễ dàng',
    desc: 'Nhấn nút bắt đầu và nhập số điện thoại để định danh.',
  },
  {
    icon: ListOrdered,
    title: '2. Làm từng phần',
    desc: 'Mỗi màn hình một câu hỏi, có hướng dẫn và bộ đếm thời gian.',
  },
  {
    icon: LineChart,
    title: '3. Xem kết quả',
    desc: 'Kết quả được bác sĩ chấm và tư vấn qua hệ thống.',
  },
]

const mocaSections = [
  { icon: LayoutGrid, title: 'Thị giác không gian' },
  { icon: Scan, title: 'Gọi tên' },
  { icon: Brain, title: 'Trí nhớ' },
  { icon: Focus, title: 'Sự chú ý' },
  { icon: Languages, title: 'Ngôn ngữ' },
  { icon: Lightbulb, title: 'Trừu tượng' },
  { icon: RotateCcw, title: 'Gợi nhớ' },
  { icon: Compass, title: 'Định hướng' },
]

const footerLinks = ['About', 'Services', 'Privacy', 'Contact'] as const

export function LandingPage() {
  const navigate = useNavigate()
  const patientLogin = useAuthStore((s) => s.patientLogin)
  const user = useAuthStore((s) => s.user)
  const [menuOpen, setMenuOpen] = useState(false)
  const [phoneOpen, setPhoneOpen] = useState(false)
  const [phone, setPhone] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const phoneCheck = validateVnPhone(phone)
  const phoneReady = phoneCheck.ok

  const openPhoneSheet = () => {
    setPhoneOpen(true)
    setError(null)
  }

  const handleContinue = async () => {
    if (!phoneCheck.ok) {
      setError('message' in phoneCheck ? phoneCheck.message : 'Số điện thoại không hợp lệ')
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      await patientLogin(phoneCheck.normalized)
      navigate('/patient')
    } catch {
      setError('Không đăng nhập được. Kiểm tra số điện thoại hoặc thử lại sau.')
    } finally {
      setSubmitting(false)
    }
  }

  const goDoctor = () => {
    if (user?.role === 'DOCTOR') navigate('/doctor')
    else navigate('/login')
  }

  const goReports = () => {
    if (user) navigate('/patient/results')
    else openPhoneSheet()
  }

  const goProfile = () => {
    if (user) navigate('/patient/settings')
    else openPhoneSheet()
  }

  return (
    <div className="app-shell elderly-layout bg-background text-on-background">
      {/* ── HEADER ── */}
      <header className="relative z-40 flex h-24 shrink-0 items-center justify-between border-b border-outline-variant bg-surface px-[var(--stitch-margin-mobile)]">
        <img src="/moca-viet-logo.png" alt="MoCA Việt" className="h-18 w-auto object-contain" />
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-on-surface-variant hover:bg-surface-container-low"
          aria-label="Menu"
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
        {menuOpen && (
          <div className="absolute right-[var(--stitch-margin-mobile)] top-full mt-1 w-52 rounded-xl border border-outline-variant bg-surface-container-lowest py-2 shadow-lg">
            <button
              type="button"
              onClick={() => { setMenuOpen(false); navigate('/login') }}
              className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-on-surface hover:bg-surface-container-low"
            >
              <Stethoscope size={18} className="text-primary" />
              Đăng nhập bác sĩ
            </button>
          </div>
        )}
      </header>

      {/* ── SCROLL BODY ── */}
      <main className="app-shell__main overflow-y-auto pb-24">
        {/* Hero card */}
        <section className="px-[var(--stitch-margin-mobile)] pt-6">
          <div className="overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-lowest shadow-sm">
            <div className="bg-primary px-4 py-2 text-center text-sm font-semibold text-on-primary">
              Đánh giá nhận thức MoCA
            </div>
            <div className="p-5">
              <h1 className="text-4xl font-bold leading-tight text-on-surface p-4">
                Thang đánh giá nhận thức
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-on-surface-variant">
                MoCA Việt giúp bạn thực hiện bài kiểm tra Montreal Cognitive Assessment (MoCA)
                tại nhà với giao diện rõ ràng và hướng dẫn chi tiết.
              </p>
              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={openPhoneSheet}
                  className="flex h-24 min-h-12 items-center justify-center rounded-xl bg-primary text-sm font-bold text-on-primary shadow-sm transition active:scale-[0.98]"
                >
                  Bắt đầu kiểm tra
                </button>
                <button
                  type="button"
                  onClick={goDoctor}
                  className="flex h-24 min-h-12 items-center justify-center rounded-xl border-2 border-primary bg-transparent text-sm font-bold text-primary transition active:scale-[0.98]"
                >
                  Bác sĩ
                </button>
              </div>
              <p className="mt-4 text-center text-xs text-on-surface-variant">
                Bài kiểm tra miễn phí · Kết quả được chuyên gia theo dõi
              </p>
            </div>
          </div>
        </section>

        {/* How to — 3-column grid */}
        <section className="mt-10 px-[var(--stitch-margin-mobile)]">
          <h2 className="text-xl font-bold text-on-surface">Cách thực hiện bài kiểm tra</h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            Bài kiểm tra gồm 8 phần theo chuẩn quốc tế
          </p>
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
            {steps.map((step) => (
              <div
                key={step.title}
                className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-4 shadow-sm"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <step.icon size={22} />
                </div>
                <p className="mt-3 text-sm font-bold text-on-surface">{step.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-on-surface-variant">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 8 MoCA sections — 2-column grid, icon left */}
        <section className="mt-10 px-[var(--stitch-margin-mobile)] pb-4">
          <h2 className="text-xl font-bold text-on-surface">
            8 vùng chức năng nhận thức được kiểm tra
          </h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            Bài kiểm tra MoCA đánh giá toàn diện các khía cạnh của trí nhớ và nhận thức.
          </p>
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-8">
            {mocaSections.map((section) => (
              <div
                key={section.title}
                className="flex items-center gap-3 rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3 shadow-sm"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <section.icon size={18} />
                </div>
                <p className="text-sm font-semibold text-on-surface">{section.title}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-outline-variant px-[var(--stitch-margin-mobile)] py-8 text-center">
   
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-on-surface-variant">
            {footerLinks.map((link) => (
              <button
                key={link}
                type="button"
                className="hover:text-primary"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              >
                {link}
              </button>
            ))}
          </div>
          <p className="mt-4 text-xs text-on-surface-variant">
            &copy; {new Date().getFullYear()} MoCA Việt. Precision Cognitive Excellence.
          </p>
        </footer>
      </main>

      {/* ── BOTTOM NAV (landing) ── */}
      <nav className="fixed bottom-0 z-40 flex w-full items-center justify-around border-t border-outline-variant bg-surface px-2 py-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom,0px))] md:hidden">
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex flex-col items-center justify-center rounded-xl bg-primary/10 px-4 py-1.5 text-primary"
        >
          <Home size={22} />
          <span className="text-xs font-medium">Home</span>
        </button>
        <button
          type="button"
          onClick={openPhoneSheet}
          className="flex flex-col items-center justify-center rounded-xl px-4 py-1.5 text-on-surface-variant"
        >
          <ClipboardList size={22} />
          <span className="text-xs">Assess</span>
        </button>
        <button
          type="button"
          onClick={goReports}
          className="flex flex-col items-center justify-center rounded-xl px-4 py-1.5 text-on-surface-variant"
        >
          <BarChart3 size={22} />
          <span className="text-xs">Reports</span>
        </button>
        <button
          type="button"
          onClick={goProfile}
          className="flex flex-col items-center justify-center rounded-xl px-4 py-1.5 text-on-surface-variant"
        >
          <UserRound size={22} />
          <span className="text-xs">Profile</span>
        </button>
      </nav>

      {/* ── PHONE LOGIN SHEET ── */}
      {phoneOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-[var(--stitch-margin-mobile)]">
          <button
            type="button"
            className="absolute inset-0"
            aria-label="Đóng"
            onClick={() => setPhoneOpen(false)}
          />
          <form
            onSubmit={(e) => { e.preventDefault(); handleContinue() }}
            className="relative w-full max-w-lg rounded-3xl border border-outline-variant bg-surface-container-lowest p-6 shadow-xl"
          >
            <div className="mxb-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-on-surface">Định danh bệnh nhân</h3>
              <button
                type="button"
                onClick={() => setPhoneOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-on-surface-variant hover:bg-surface-container-low"
                aria-label="Đóng"
              >
                <X size={20} />
              </button>
            </div>
            <p className="text-sm text-on-surface-variant">
              Nhập số điện thoại để bắt đầu bài đánh giá MoCA.
            </p>
            <div className="mt-4">
              <label htmlFor="landing-phone" className="mb-2 block text-sm font-semibold text-on-surface">
                Số điện thoại
              </label>
              <input
                id="landing-phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                className={inputClass}
                placeholder="0901234567"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value)
                  setError(null)
                }}
                required
                autoFocus
              />
            </div>
            {error && (
              <p className="mt-3 text-sm text-error" role="alert">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={submitting || !phoneReady}
              className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-base font-bold text-on-primary disabled:opacity-60"
            >
              {submitting ? 'Đang đăng nhập…' : 'Bắt đầu đánh giá'}
              <ArrowRight size={20} />
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
