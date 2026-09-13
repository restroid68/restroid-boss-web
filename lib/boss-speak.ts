/**
 * RestroidBOSS hoparlör.
 * Ücretsiz: cihaz / Web Speech (token yok). Gelişmiş: Flutter → cloud TTS.
 */
import { getBossApiPrefix } from '@/lib/boss-config'
import {
  hasNativeBossBridge,
  postToNative,
  readNativeSession,
} from '@/lib/boss-bridge'

let speakGen = 0
let resumeTimer: number | null = null
let currentAudio: HTMLAudioElement | null = null

function clearResumeTimer() {
  if (resumeTimer != null) {
    window.clearInterval(resumeTimer)
    resumeTimer = null
  }
}

function stopWebAudio() {
  if (currentAudio) {
    try {
      currentAudio.pause()
    } catch {
      /* ignore */
    }
    currentAudio = null
  }
}

export function stopBossSpeech(): void {
  speakGen += 1
  clearResumeTimer()
  stopWebAudio()
  postToNative({ type: 'speakStop' })
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    try {
      window.speechSynthesis.cancel()
    } catch {
      /* ignore */
    }
  }
}

/** Ücretsiz ses — tarayıcıda async speak için kullanıcı jestinde kilidi aç. Native kabukta gerekmez. */
export function unlockBossDeviceSpeech(): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) return
  if (hasNativeBossBridge()) return
  try {
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance('\u00a0')
    u.lang = 'tr-TR'
    u.volume = 0.01
    u.rate = 1
    window.speechSynthesis.speak(u)
  } catch {
    /* ignore */
  }
}

function splitSpeakChunks(text: string, maxChars: number): string[] {
  const t = text.trim()
  if (!t) return []
  if (t.length <= maxChars) return [t]
  const chunks: string[] = []
  let rest = t
  while (rest.length > maxChars) {
    let cut = rest.lastIndexOf('. ', maxChars)
    if (cut < maxChars / 2) cut = rest.lastIndexOf('! ', maxChars)
    if (cut < maxChars / 2) cut = rest.lastIndexOf('? ', maxChars)
    if (cut < maxChars / 3) cut = rest.lastIndexOf(' ', maxChars)
    if (cut < 40) cut = maxChars
    chunks.push(rest.slice(0, cut).trim())
    rest = rest.slice(cut).trim()
  }
  if (rest) chunks.push(rest)
  return chunks
}

function pickTurkishVoice(): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices()
  const tr = voices.filter((v) => v.lang.toLowerCase().startsWith('tr'))
  if (!tr.length) return undefined
  const score = (v: SpeechSynthesisVoice) => {
    const n = `${v.name} ${v.voiceURI}`.toLowerCase()
    let s = 0
    if (n.includes('yelda')) s += 50
    if (n.includes('cem')) s += 40
    if (n.includes('enhanced') || n.includes('premium')) s += 40
    if (n.includes('compact')) s -= 30
    if (v.localService) s += 25
    return s
  }
  tr.sort((a, b) => score(b) - score(a))
  return tr[0]
}

function whenVoicesReady(): Promise<void> {
  return new Promise((resolve) => {
    if (window.speechSynthesis.getVoices().length) {
      resolve()
      return
    }
    const timer = window.setTimeout(() => resolve(), 900)
    window.speechSynthesis.addEventListener(
      'voiceschanged',
      () => {
        window.clearTimeout(timer)
        resolve()
      },
      { once: true },
    )
  })
}

function speakUtterance(
  text: string,
  voice: SpeechSynthesisVoice | undefined,
  gen: number,
  waitForStartMs = 0,
): Promise<'ok' | 'silent' | 'aborted'> {
  return new Promise((resolve) => {
    if (gen !== speakGen) {
      resolve('aborted')
      return
    }
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'tr-TR'
    if (voice) u.voice = voice
    u.rate = 1.02
    let started = false
    let settled = false
    const finish = (v: 'ok' | 'silent' | 'aborted') => {
      if (settled) return
      settled = true
      resolve(v)
    }
    const timer =
      waitForStartMs > 0
        ? window.setTimeout(() => {
            if (!started) finish('silent')
          }, waitForStartMs)
        : null
    u.onstart = () => {
      started = true
      if (timer != null) window.clearTimeout(timer)
    }
    u.onend = () => finish(started ? 'ok' : 'silent')
    u.onerror = () => finish(started ? 'ok' : 'silent')
    try {
      window.speechSynthesis.speak(u)
    } catch {
      if (timer != null) window.clearTimeout(timer)
      finish('silent')
    }
  })
}

async function speakWithWebSpeech(text: string): Promise<'ok' | 'silent' | 'aborted'> {
  const gen = ++speakGen
  await whenVoicesReady()
  if (gen !== speakGen) return 'aborted'
  const voice = pickTurkishVoice()
  const chunks = splitSpeakChunks(text, 240)
  if (!chunks.length) return 'silent'
  clearResumeTimer()
  resumeTimer = window.setInterval(() => {
    try {
      window.speechSynthesis.resume()
    } catch {
      /* ignore */
    }
  }, 4000)
  try {
    const first = await speakUtterance(chunks[0]!, voice, gen, 1600)
    if (gen !== speakGen) return 'aborted'
    if (first === 'aborted') return 'aborted'
    if (first !== 'ok') {
      try {
        window.speechSynthesis.cancel()
      } catch {
        /* ignore */
      }
      return 'silent'
    }
    for (const chunk of chunks.slice(1)) {
      if (gen !== speakGen) return 'aborted'
      const next = await speakUtterance(chunk, voice, gen)
      if (next === 'aborted') return 'aborted'
    }
    return gen === speakGen ? 'ok' : 'aborted'
  } finally {
    if (gen === speakGen) clearResumeTimer()
  }
}

async function speakCloudInBrowser(text: string): Promise<void> {
  const gen = ++speakGen
  const prefix = getBossApiPrefix()
  const session = readNativeSession()
  const headers: Record<string, string> = {
    Accept: 'audio/mpeg',
    'Content-Type': 'application/json',
    'x-restroid-native-client': '1',
    'x-restroid-boss': '1',
  }
  if (session?.token) headers.Authorization = `Bearer ${session.token}`
  if (session?.branchCode) headers['x-restroid-branch-code'] = session.branchCode

  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), 90_000)
  try {
    const res = await fetch(`${prefix}/api/boss/ai/speak`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ text }),
      cache: 'no-store',
      signal: controller.signal,
    })
    if (gen !== speakGen) return
    if (res.status === 204 || !res.ok) return
    const blob = await res.blob()
    if (gen !== speakGen || blob.size < 64) return
    const url = URL.createObjectURL(blob)
    const audio = new Audio(url)
    currentAudio = audio
    audio.onended = () => {
      URL.revokeObjectURL(url)
      if (currentAudio === audio) currentAudio = null
    }
    await audio.play()
  } catch {
    /* tarayıcı önizleme — sessiz */
  } finally {
    window.clearTimeout(timer)
  }
}

export function speakBossAnswer(text: string, voice: 'device' | 'cloud'): void {
  const cleaned = text.trim()
  if (!cleaned) return
  stopBossSpeech()
  if (voice === 'cloud') {
    if (hasNativeBossBridge()) {
      postToNative({ type: 'speak', text: cleaned, voice: 'cloud' })
      return
    }
    void speakCloudInBrowser(cleaned)
    return
  }

  // Ücretsiz: Flutter cihaz TTS (Yelda / Android). Tarayıcı önizlemede Web Speech.
  if (hasNativeBossBridge()) {
    postToNative({ type: 'speak', text: cleaned, voice: 'device' })
    return
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    void speakWithWebSpeech(cleaned)
  }
}
