/** @param {string} s */
export function normalizeSpeech(s = '') {
  return s
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function getSpeechRecognition() {
  if (typeof window === 'undefined') return null
  const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition
  if (!Ctor) return null
  const rec = new Ctor()
  rec.continuous = true
  rec.interimResults = true
  rec.maxAlternatives = 1
  return rec
}

/**
 * MoCA sentence repetition: 1 point if most content words match (ASR-tolerant).
 * @returns {0 | 1}
 */
export function scoreSentenceRepetition(expected, transcript) {
  const expWords = normalizeSpeech(expected).split(' ').filter(Boolean)
  const gotWords = normalizeSpeech(transcript).split(' ').filter(Boolean)
  if (!expWords.length || !gotWords.length) return 0

  let matched = 0
  let j = 0
  for (const word of expWords) {
    while (j < gotWords.length) {
      const got = gotWords[j]
      if (got === word || got.includes(word) || word.includes(got)) {
        matched++
        j++
        break
      }
      j++
    }
  }

  const ratio = matched / expWords.length
  return ratio >= 0.85 ? 1 : 0
}

/**
 * Run browser ASR in parallel with an existing mic stream.
 * @param {MediaStream} stream
 * @param {string} lang
 * @returns {{ stop: () => Promise<string>, supported: boolean }}
 */
export function startParallelAsr(stream, lang = 'vi-VN') {
  const recognition = getSpeechRecognition()
  if (!recognition) {
    return { supported: false, stop: async () => '' }
  }

  const parts = []
  recognition.lang = lang

  recognition.onresult = (event) => {
    for (let i = event.resultIndex; i < event.results.length; i++) {
      if (event.results[i].isFinal) {
        parts.push(event.results[i][0].transcript)
      }
    }
  }

  try {
    recognition.start()
  } catch {
    return { supported: false, stop: async () => '' }
  }

  return {
    supported: true,
    stop: () =>
      new Promise((resolve) => {
        const finish = () => {
          recognition.onend = null
          resolve(parts.join(' ').trim())
        }
        recognition.onend = finish
        try {
          recognition.stop()
        } catch {
          finish()
        }
        setTimeout(finish, 800)
      }),
  }
}

export function recordingBlobUrl(value) {
  if (!value) return null
  if (typeof value === 'string') {
    if (value.startsWith('blob:') || value.startsWith('data:audio')) return value
    return null
  }
  return value.blobUrl || value.audioDataUrl || null
}

export function hasRecording(value) {
  if (!value) return false
  if (typeof value === 'string') return value.length > 0
  return !!(value.blobUrl || value.audioDataUrl || value.transcript)
}
