'use client'

import { useEffect } from 'react'
import {
  applyAppearance,
  loadAppearance,
  normalizeAppearance,
  saveAppearance,
  type BossAppearance,
} from '@/lib/boss-appearance'
import { onNativeSession, readNativeSession } from '@/lib/boss-bridge'

function appearanceFromSession(): BossAppearance | null {
  const s = readNativeSession() as
    | (ReturnType<typeof readNativeSession> & {
        appearance?: unknown
        fontScale?: unknown
        themeAccent?: unknown
      })
    | null
  if (!s) return null
  if (s.appearance) return normalizeAppearance(s.appearance)
  if (s.fontScale || s.themeAccent) {
    return normalizeAppearance({
      fontScale: s.fontScale,
      themeAccent: s.themeAccent,
    })
  }
  return null
}

/** Uygulama açılışında localStorage + Flutter oturumundan görünümü uygular. */
export default function BossAppearanceRoot() {
  useEffect(() => {
    const fromNative = appearanceFromSession()
    const prefs = fromNative ?? loadAppearance()
    applyAppearance(prefs)
    if (fromNative) saveAppearance(prefs)

    return onNativeSession((session) => {
      const raw = session as typeof session & {
        appearance?: unknown
        fontScale?: unknown
        themeAccent?: unknown
      }
      let next: BossAppearance | null = null
      if (raw.appearance) next = normalizeAppearance(raw.appearance)
      else if (raw.fontScale || raw.themeAccent) {
        next = normalizeAppearance({
          fontScale: raw.fontScale,
          themeAccent: raw.themeAccent,
        })
      }
      if (!next) return
      applyAppearance(next)
      saveAppearance(next)
    })
  }, [])

  return null
}
