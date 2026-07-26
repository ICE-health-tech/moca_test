import { api } from '../../shared/lib/axios'
import { useMockApi } from '../../shared/lib/useMockApi'

const USE_MOCK = useMockApi()

export type TranscribeAudioPayload = {
  audioBase64: string
  contentType?: string
  filename?: string
  expectedSentence?: string
}

export type TranscribeAudioResult = {
  available: boolean
  transcript: string
  provider: string
  language?: string | null
  score?: number | null
  matchRatio?: number | null
  message?: string | null
}

/** Convert a recorded Blob to a durable data URL for AI STT + submit. */
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(reader.error || new Error('Failed to read audio blob'))
    reader.readAsDataURL(blob)
  })
}

/**
 * Server-side Whisper transcription (Vietnamese).
 * Returns null when mock mode / network / AI disabled — caller falls back to browser ASR.
 */
export async function transcribeAudio(
  payload: TranscribeAudioPayload,
): Promise<TranscribeAudioResult | null> {
  if (USE_MOCK) return null
  try {
    const { data } = await api.post<TranscribeAudioResult>(
      '/api/speech/transcribe',
      payload,
    )
    if (!data?.available || !data.transcript) return null
    return data
  } catch {
    return null
  }
}
