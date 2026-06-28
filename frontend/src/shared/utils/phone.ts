/** Count digits only — ignores spaces, +, dashes. */
export function phoneDigitCount(raw: string): number {
  return raw.replace(/\D/g, '').length
}

/** 0901234567 → 84901234567 — mirrors AuthService.normalizePhone */
export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('0')) {
    return '84' + digits.slice(1)
  }
  return digits
}

const VN_MOBILE = /^84[35789]\d{8}$/

export function validateVnPhone(
  raw: string,
):
  | { ok: true; normalized: string }
  | { ok: false; message: string } {
  const count = phoneDigitCount(raw)
  if (count === 0) {
    return { ok: false, message: 'Vui lòng nhập số điện thoại.' }
  }
  const normalized = normalizePhone(raw.trim())
  if (normalized.length !== 11 || !VN_MOBILE.test(normalized)) {
    return {
      ok: false,
      message: `Số điện thoại không hợp lệ (${count} số). Nhập 10 số, ví dụ 0901234567.`,
    }
  }
  return { ok: true, normalized }
}

/** 84901234567 → 0901234567 for display */
export function formatPhoneDisplay(phoneNumber: string | undefined): string {
  if (!phoneNumber) return '—'
  if (phoneNumber.startsWith('84') && phoneNumber.length === 11) {
    return '0' + phoneNumber.slice(2)
  }
  return phoneNumber
}
