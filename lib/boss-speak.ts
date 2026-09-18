/**
 * RestroidBOSS hoparlör.
 * Ücretsiz: cihaz / Web Speech (token yok). Gelişmiş: Flutter → cloud TTS.
 */
import { stripBossAiMarkup } from '@/lib/boss-ai-plain-text'
import { getBossApiPrefix } from '@/lib/boss-config'
import {
  hasNativeBossBridge,
  onNativeSpeech,
  postToNative,
  readNativeSession,
} from '@/lib/boss-bridge'

let speakGen = 0
let resumeTimer: number | null = null
let currentAudio: HTMLAudioElement | null = null
let userPaused = false
let nativeSpeechHooked = false

export type BossSpeechStatus = 'idle' | 'loading' | 'playing' | 'paused'

export type BossSpeechState = {
  status: BossSpeechStatus
  messageId: string | null
}

let speechState: BossSpeechState = { status: 'idle', messageId: null }
const speechListeners = new Set<(s: BossSpeechState) => void>()

function emitSpeech(next: Partial<BossSpeechState>) {
  speechState = { ...speechState, ...next }
  for (const l of speechListeners) {
    try {
      l(speechState)
    } catch {
      /* ignore */
    }
  }
}

export function getBossSpeechState(): BossSpeechState {
  return speechState
}

export function subscribeBossSpeech(listener: (s: BossSpeechState) => void): () => void {
  speechListeners.add(listener)
  listener(speechState)
  return () => {
    speechListeners.delete(listener)
  }
}

function hookNativeSpeech() {
  if (nativeSpeechHooked || typeof window === 'undefined') return
  nativeSpeechHooked = true
  onNativeSpeech((status) => {
    if (status === 'playing' || status === 'loading') {
      emitSpeech({ status: status === 'loading' ? 'loading' : 'playing' })
      return
    }
    if (status === 'paused') {
      emitSpeech({ status: 'paused' })
      return
    }
    emitSpeech({ status: 'idle', messageId: null })
  })
}

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

function cancelWebSpeech() {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    try {
      window.speechSynthesis.cancel()
    } catch {
      /* ignore */
    }
  }
}

function beginLocalPlayback(messageId?: string) {
  speakGen += 1
  userPaused = false
  clearResumeTimer()
  stopWebAudio()
  cancelWebSpeech()
  emitSpeech({ status: 'loading', messageId: messageId ?? speechState.messageId })
}

export function stopBossSpeech(): void {
  speakGen += 1
  userPaused = false
  clearResumeTimer()
  stopWebAudio()
  postToNative({ type: 'speakStop' })
  cancelWebSpeech()
  emitSpeech({ status: 'idle', messageId: null })
}

export function pauseBossSpeech(): void {
  if (speechState.status !== 'playing' && speechState.status !== 'loading') return
  userPaused = true
  if (hasNativeBossBridge()) {
    postToNative({ type: 'speakPause' })
  }
  try {
    currentAudio?.pause()
  } catch {
    /* ignore */
  }
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    try {
      window.speechSynthesis.pause()
    } catch {
      /* ignore */
    }
  }
  emitSpeech({ status: 'paused' })
}

export function resumeBossSpeech(): void {
  if (speechState.status !== 'paused') return
  userPaused = false
  if (hasNativeBossBridge()) {
    postToNative({ type: 'speakResume' })
  }
  try {
    void currentAudio?.play()
  } catch {
    /* ignore */
  }
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    try {
      window.speechSynthesis.resume()
    } catch {
      /* ignore */
    }
  }
  emitSpeech({ status: 'playing' })
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
      if (gen === speakGen && !userPaused) emitSpeech({ status: 'playing' })
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
  const gen = speakGen
  await whenVoicesReady()
  if (gen !== speakGen) return 'aborted'
  const voice = pickTurkishVoice()
  // Chrome ~15 sn sonra duraklatır; kısa cümle parçaları + resume.
  const chunks = splitSpeakChunks(text, 180)
  if (!chunks.length) return 'silent'
  clearResumeTimer()
  resumeTimer = window.setInterval(() => {
    if (userPaused) return
    try {
      window.speechSynthesis.resume()
    } catch {
      /* ignore */
    }
  }, 4000)
  try {
    const first = await speakUtterance(chunks[0]!, voice, gen, 2800)
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
      while (userPaused && gen === speakGen) {
        await new Promise((r) => window.setTimeout(r, 180))
      }
      if (gen !== speakGen) return 'aborted'
      const next = await speakUtterance(chunk, voice, gen)
      if (next === 'aborted') return 'aborted'
    }
    return gen === speakGen ? 'ok' : 'aborted'
  } finally {
    if (gen === speakGen) clearResumeTimer()
    if (gen === speakGen && speechState.status !== 'paused') {
      emitSpeech({ status: 'idle', messageId: null })
    }
  }
}

async function speakCloudInBrowser(text: string): Promise<void> {
  const gen = speakGen
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
  const timer = window.setTimeout(() => controller.abort(), 150_000)
  try {
    const res = await fetch(`${prefix}/api/boss/ai/speak`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ text }),
      cache: 'no-store',
      signal: controller.signal,
    })
    if (gen !== speakGen) return
    if (res.status === 204 || !res.ok) {
      emitSpeech({ status: 'idle', messageId: null })
      return
    }
    const blob = await res.blob()
    if (gen !== speakGen || blob.size < 64) return
    const url = URL.createObjectURL(blob)
    const audio = new Audio(url)
    currentAudio = audio
    audio.onended = () => {
      URL.revokeObjectURL(url)
      if (currentAudio === audio) currentAudio = null
      if (gen === speakGen) emitSpeech({ status: 'idle', messageId: null })
    }
    audio.onerror = () => {
      URL.revokeObjectURL(url)
      if (currentAudio === audio) currentAudio = null
      if (gen === speakGen) emitSpeech({ status: 'idle', messageId: null })
    }
    await audio.play()
    if (gen === speakGen && !userPaused) emitSpeech({ status: 'playing' })
  } catch {
    if (gen === speakGen) emitSpeech({ status: 'idle', messageId: null })
  } finally {
    window.clearTimeout(timer)
  }
}

export function speakBossAnswer(
  text: string,
  voice: 'device' | 'cloud',
  opts?: { messageId?: string },
): void {
  const cleaned = stripBossAiMarkup(text).trim()
  if (!cleaned) return
  hookNativeSpeech()
  beginLocalPlayback(opts?.messageId)
  if (voice === 'cloud') {
    if (hasNativeBossBridge()) {
      postToNative({ type: 'speak', text: cleaned, voice: 'cloud' })
      return
    }
    void speakCloudInBrowser(cleaned)
    return
  }

  if (hasNativeBossBridge()) {
    postToNative({ type: 'speak', text: cleaned, voice: 'device' })
    return
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    void speakWithWebSpeech(cleaned)
  }
}
