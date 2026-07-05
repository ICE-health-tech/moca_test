import React from 'react'

export type RawAnswers = Record<string, unknown>

const NAMING_LABELS: Record<string, string> = {
  n1: 'Sư tử',
  n2: 'Tê giác',
  n3: 'Lạc đà',
}

const ORIENTATION_LABELS: Record<string, string> = {
  date: 'Ngày',
  month: 'Tháng',
  year: 'Năm',
  day: 'Thứ',
  place: 'Địa điểm',
  city: 'Thành phố / tỉnh',
}

const DELAYED_WORDS = ['Vẻ mặt', 'Vải nhung', 'Nhà thờ', 'Hoa cúc', 'Màu đỏ']

function asObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function textOf(value: unknown): string {
  if (value == null) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number') return String(value)
  return ''
}

function EvidenceRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-slate-900">{value || '—'}</dd>
    </div>
  )
}

function EvidenceBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">{title}</p>
      <dl className="space-y-3">{children}</dl>
    </div>
  )
}

function NamingEvidence({ raw }: { raw: RawAnswers }) {
  const naming = asObject(raw.section_2_naming)
  if (!naming) return <p className="text-sm text-slate-500">Không có câu trả lời.</p>

  return (
    <EvidenceBlock title="Câu trả lời bệnh nhân">
      {Object.entries(NAMING_LABELS).map(([id, label]) => {
        const entry = asObject(naming[id])
        const text = textOf(entry?.text)
        const hasRecording = entry?.recording != null && entry.recording !== ''
        return (
          <EvidenceRow
            key={id}
            label={label}
            value={
              <>
                {text || '—'}
                {hasRecording && (
                  <span className="ml-2 text-xs text-slate-500">(có ghi âm)</span>
                )}
              </>
            }
          />
        )
      })}
    </EvidenceBlock>
  )
}

function AttentionEvidence({ raw }: { raw: RawAnswers }) {
  const serial = Array.isArray(raw.section_4c) ? raw.section_4c : []
  const vigilance = asObject(raw.section_4b)

  return (
    <EvidenceBlock title="Câu trả lời bệnh nhân">
      <EvidenceRow label="Dãy số xuôi (2-1-8-5-4)" value={textOf(raw.section_4a_forward)} />
      <EvidenceRow label="Dãy số ngược (7-4-2)" value={textOf(raw.section_4a_backward)} />
      {vigilance && (
        <EvidenceRow
          label="Gõ chữ A (4B)"
          value={`Điểm ${textOf(vigilance.score) || '0'} — bỏ sót ${textOf(vigilance.omissions) || '0'}, nhấn nhầm ${textOf(vigilance.falseAlarms) || '0'}`}
        />
      )}
      <EvidenceRow
        label="Trừ 7 liên tiếp"
        value={serial.map((n) => textOf(n) || '—').join(' → ') || '—'}
      />
    </EvidenceBlock>
  )
}

function LanguageEvidence({ raw }: { raw: RawAnswers }) {
  const s5 = asObject(raw.section_5) ?? {}
  const fluency = asObject(raw.section_6)
  const fluencyText = textOf(raw.section_6_text)

  const sentences = [0, 1].map((idx) => {
    const entry = asObject(s5[String(idx)]) ?? asObject(s5[idx as unknown as string])
    return entry
  })

  return (
    <EvidenceBlock title="Câu trả lời bệnh nhân">
      {sentences.map((entry, idx) => (
        <EvidenceRow
          key={idx}
          label={`Nhắc lại câu ${idx + 1}`}
          value={
            entry?.transcript
              ? `"${textOf(entry.transcript)}"`
              : entry?.blobUrl
                ? '(đã ghi âm — nghe lại không khả dụng sau khi nộp)'
                : '—'
          }
        />
      ))}
      <EvidenceRow
        label="Lưu loát (chữ F)"
        value={
          fluencyText
            ? `"${fluencyText}" (${textOf(fluency?.count) || '0'} từ hợp lệ)`
            : fluency
              ? `${textOf(fluency.count) || '0'} từ hợp lệ`
              : '—'
        }
      />
    </EvidenceBlock>
  )
}

function AbstractionEvidence({ raw }: { raw: RawAnswers }) {
  const abs = asObject(raw.section_7)
  if (!abs) return <p className="text-sm text-slate-500">Không có câu trả lời.</p>

  return (
    <EvidenceBlock title="Câu trả lời bệnh nhân">
      {[0, 1].map((idx) => {
        const entry = asObject(abs[String(idx)])
        const pair = textOf(entry?.pair) || `Cặp ${idx + 1}`
        return (
          <EvidenceRow
            key={idx}
            label={pair}
            value={textOf(entry?.text)}
          />
        )
      })}
    </EvidenceBlock>
  )
}

function DelayedEvidence({ raw }: { raw: RawAnswers }) {
  const inputs = asObject(raw.section_8_inputs)
  if (!inputs) return <p className="text-sm text-slate-500">Không có câu trả lời.</p>

  return (
    <EvidenceBlock title="Câu trả lời bệnh nhân">
      {DELAYED_WORDS.map((expected, i) => {
        const key = `word_${i + 1}`
        const entry = asObject(inputs[key])
        const usedCue = entry?.used_cue === true
        return (
          <EvidenceRow
            key={key}
            label={expected}
            value={
              <>
                {textOf(entry?.text) || '—'}
                {usedCue && (
                  <span className="ml-2 text-xs font-medium text-amber-700">(đã dùng gợi ý)</span>
                )}
              </>
            }
          />
        )
      })}
    </EvidenceBlock>
  )
}

function OrientationEvidence({ raw }: { raw: RawAnswers }) {
  const o = asObject(raw.section_9)
  if (!o) return <p className="text-sm text-slate-500">Không có câu trả lời.</p>

  return (
    <EvidenceBlock title="Câu trả lời bệnh nhân">
      {Object.entries(ORIENTATION_LABELS).map(([key, label]) => (
        <EvidenceRow key={key} label={label} value={textOf(o[key])} />
      ))}
    </EvidenceBlock>
  )
}

export function SectionPatientEvidence({
  sectionKey,
  rawAnswers,
}: {
  sectionKey: string
  rawAnswers: RawAnswers | undefined
}) {
  if (!rawAnswers || Object.keys(rawAnswers).length === 0) {
    return (
      <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
        Không có dữ liệu câu trả lời.
      </p>
    )
  }

  switch (sectionKey) {
    case 'visuospatial':
      return (
        <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
          Xem bản vẽ bệnh nhân ở trên (nối điểm, khối lập phương, đồng hồ).
        </p>
      )
    case 'naming':
      return <NamingEvidence raw={rawAnswers} />
    case 'attention':
      return <AttentionEvidence raw={rawAnswers} />
    case 'language':
      return <LanguageEvidence raw={rawAnswers} />
    case 'abstraction':
      return <AbstractionEvidence raw={rawAnswers} />
    case 'delayed':
      return <DelayedEvidence raw={rawAnswers} />
    case 'orientation':
      return <OrientationEvidence raw={rawAnswers} />
    default:
      return null
  }
}

export function canvasInlineSrc(rawAnswers: RawAnswers | undefined, key: string): string | null {
  const value = rawAnswers?.[key]
  if (typeof value === 'string' && value.startsWith('data:image')) {
    return value
  }
  return null
}
