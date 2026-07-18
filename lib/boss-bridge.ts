/**
 * Flutter WebView ↔ RestroidBOSS JS köprüsü.
 *
 * Flutter inject: window.__RESTROID_BOSS__ = { token, branchCode, restaurantName, apiBase, restaurantId }
 * Flutter kanal:  RestroidBoss.postMessage(JSON.stringify({ type, ... }))
 */

export type BossNativeSession = {
  token: string
  branchCode: string
  restaurantName: string
  restaurantId?: string
  apiBase?: string
  fullName?: string
}

export type BossToNativeMessage =
  | { type: 'openMic' }
  | { type: 'speak'; text: string }
  | { type: 'switchRestaurant' }
  | { type: 'logout' }
  | { type: 'openExternal'; url: string }
  | { type: 'navigate'; path: string }
  | { type: 'ready' }

type TranscriptHandler = (text: string) => void
type SessionHandler = (session: BossNativeSession) => void

const transcriptHandlers = new Set<TranscriptHandler>()
const sessionHandlers = new Set<SessionHandler>()

declare global {
  interface Window {
    __RESTROID_BOSS__?: BossNativeSession
    RestroidBoss?: { postMessage: (msg: string) => void }
    /** @deprecated internal fan-out — use onNativeTranscript */
    __RESTROID_BOSS_ON_TRANSCRIPT__?: TranscriptHandler
    /** @deprecated internal fan-out — use onNativeSession */
    __RESTROID_BOSS_ON_SESSION__?: SessionHandler
  }
}

function installGlobalFanout() {
  if (typeof window === 'undefined') return
  window.__RESTROID_BOSS_ON_TRANSCRIPT__ = (text: string) => {
    for (const h of transcriptHandlers) {
      try {
        h(text)
      } catch {
        /* ignore */
      }
    }
  }
  window.__RESTROID_BOSS_ON_SESSION__ = (session: BossNativeSession) => {
    window.__RESTROID_BOSS__ = session
    for (const h of sessionHandlers) {
      try {
        h(session)
      } catch {
        /* ignore */
      }
    }
  }
}

if (typeof window !== 'undefined') {
  installGlobalFanout()
}

export function readNativeSession(): BossNativeSession | null {
  if (typeof window === 'undefined') return null
  const s = window.__RESTROID_BOSS__
  if (!s?.token) return null
  return s
}

export function postToNative(message: BossToNativeMessage): void {
  if (typeof window === 'undefined') return
  try {
    window.RestroidBoss?.postMessage(JSON.stringify(message))
  } catch {
    /* WebView dışında (tarayıcı önizleme) sessiz */
  }
}

export function notifyNativeReady(): void {
  installGlobalFanout()
  postToNative({ type: 'ready' })
}

/** Flutter STT sonucu — AI composer dinler */
export function onNativeTranscript(handler: TranscriptHandler): () => void {
  if (typeof window === 'undefined') return () => {}
  installGlobalFanout()
  transcriptHandlers.add(handler)
  return () => {
    transcriptHandlers.delete(handler)
  }
}

export function onNativeSession(handler: SessionHandler): () => void {
  if (typeof window === 'undefined') return () => {}
  installGlobalFanout()
  sessionHandlers.add(handler)
  return () => {
    sessionHandlers.delete(handler)
  }
}

export function dispatchNativeTranscript(text: string): void {
  installGlobalFanout()
  window.__RESTROID_BOSS_ON_TRANSCRIPT__?.(text)
}

export function dispatchNativeSession(session: BossNativeSession): void {
  installGlobalFanout()
  window.__RESTROID_BOSS__ = session
  window.__RESTROID_BOSS_ON_SESSION__?.(session)
}
