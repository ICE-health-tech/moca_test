import {
  Activity,
  ArrowRight,
  BarChart3,
  Check,
  ChevronRight,
  ClipboardList,
  FileText,
  Home,
  MapPin,
  Menu,
  ShieldCheck,
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

const features = [
  {
    icon: MapPin,
    title: 'Lâm sàng chuẩn hóa',
    desc: 'Hiệu chỉnh phù hợp với văn hóa Việt Nam.',
  },
  {
    icon: ShieldCheck,
    title: 'Độ chính xác 98%',
    desc: 'Độ nhạy cao trong phát hiện MCI sớm.',
  },
  {
    icon: Activity,
    title: 'Theo dõi thời gian thực',
    desc: 'Ghi nhận phản hồi người dùng tức thì.',
  },
  {
    icon: FileText,
    title: 'Báo cáo chuyên nghiệp',
    desc: 'Xuất kết quả chuẩn y khoa nhanh chóng.',
  },
]

const doctorBenefits = [
  'Tối ưu hóa quy trình lâm sàng',
  'Hồ sơ điện tử tập trung',
  'Hỗ trợ tư vấn từ xa hiệu quả',
]

const patientBenefits = [
  'Trải nghiệm kiểm tra nhẹ nhàng',
  'Kết quả và khuyến nghị tức thì',
  'Bảo mật dữ liệu tuyệt đối',
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
      <header className="relative z-40 flex h-14 shrink-0 items-center justify-between border-b border-outline-variant bg-surface px-[var(--stitch-margin-mobile)]">
        <img src="/moca-viet-logo.png" alt="MoCA Việt" className="h-9 w-auto object-contain" />
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
        {/* Hero */}
        <section className="px-[var(--stitch-margin-mobile)] pt-8">
          <span className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary">
            Nền tảng sức khỏe não bộ hàng đầu
          </span>
          <h1 className="mt-5 text-3xl font-bold leading-tight text-on-surface">
            Đánh Giá Nhận Thức{' '}
            <span className="text-primary">MoCA Việt</span>
          </h1>
          <p className="mt-4 text-base leading-relaxed text-on-surface-variant">
            Giải pháp lâm sàng toàn diện giúp phát hiện sớm và theo dõi suy giảm nhận thức nhẹ,
            được chuẩn hóa cho người Việt.
          </p>
          <button
            type="button"
            onClick={openPhoneSheet}
            className="mt-8 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-base font-bold uppercase tracking-wide text-on-primary shadow-sm transition active:scale-[0.98]"
          >
            Bắt đầu đánh giá
            <ChevronRight size={20} />
          </button>
        </section>

        {/* Features */}
        <section className="mt-12 px-[var(--stitch-margin-mobile)]">
          <h2 className="text-xl font-bold text-on-surface">Tính năng &amp; Hiệu quả</h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            Công nghệ tiên phong trong chẩn đoán thần kinh học.
          </p>
          <div className="mt-5 space-y-4">
            {features.map((feat) => (
              <div
                key={feat.title}
                className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm"
              >
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <feat.icon size={24} />
                </div>
                <p className="mt-4 text-center text-base font-bold text-on-surface">{feat.title}</p>
                <p className="mt-1 text-center text-sm leading-relaxed text-on-surface-variant">
                  {feat.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Benefits */}
        <section className="mt-12 bg-primary/5 px-[var(--stitch-margin-mobile)] py-10">
          <h2 className="text-xl font-bold text-on-surface">Lợi ích vượt trội</h2>

          <div className="mt-6 rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-5">
            <div className="flex items-center gap-2">
              <Stethoscope size={20} className="text-primary" />
              <p className="font-bold text-on-surface">Dành cho Bác sĩ</p>
            </div>
            <ul className="mt-4 space-y-3">
              {doctorBenefits.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-on-surface-variant">
                  <Check size={18} className="mt-0.5 shrink-0 text-primary" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-4 rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-5">
            <div className="flex items-center gap-2">
              <UserRound size={20} className="text-primary" />
              <p className="font-bold text-on-surface">Dành cho Bệnh nhân</p>
            </div>
            <ul className="mt-4 space-y-3">
              {patientBenefits.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-on-surface-variant">
                  <Check size={18} className="mt-0.5 shrink-0 text-primary" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* CTA */}
        <section className="px-[var(--stitch-margin-mobile)] py-10 text-center">
          <h2 className="text-xl font-bold text-on-surface">Sẵn sàng chăm sóc sức khỏe não bộ?</h2>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-on-surface-variant">
            Tham gia cùng hàng ngàn chuyên gia y tế trong việc số hóa quy trình đánh giá nhận thức.
          </p>
          <button
            type="button"
            onClick={openPhoneSheet}
            className="mt-6 flex h-14 w-full items-center justify-center rounded-2xl bg-primary text-base font-bold text-on-primary shadow-sm transition active:scale-[0.98]"
          >
            Đăng ký ngay
          </button>
          <button
            type="button"
            onClick={openPhoneSheet}
            className="mt-3 flex h-14 w-full items-center justify-center rounded-2xl border-2 border-primary bg-transparent text-base font-bold text-primary transition active:scale-[0.98]"
          >
            Tải ứng dụng
          </button>
        </section>

        {/* Footer */}
        <footer className="border-t border-outline-variant px-[var(--stitch-margin-mobile)] py-8 text-center">
          <img src="/moca-viet-logo.png" alt="MoCA Việt" className="mx-auto h-8 w-auto object-contain" />
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
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
          <button
            type="button"
            className="absolute inset-0"
            aria-label="Đóng"
            onClick={() => setPhoneOpen(false)}
          />
          <form
            onSubmit={(e) => { e.preventDefault(); handleContinue() }}
            className="relative w-full max-w-lg rounded-t-3xl border border-outline-variant bg-surface-container-lowest p-6 shadow-xl"
          >
            <div className="mb-4 flex items-center justify-between">
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
