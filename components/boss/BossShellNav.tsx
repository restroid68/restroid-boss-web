'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { postToNative } from '@/lib/boss-bridge'

const TAB_PREFETCH = [
  '/boss-m/ana',
  '/boss-m/finans',
  '/boss-m/ai',
  '/boss-m/denetim',
  '/boss-m/kasa',
] as const

/**
 * Flutter kabuğu ↔ Next App Router soft navigasyon.
 * `location.href` yerine `router.push` — layout/WebView yeniden yüklenmez;
 * sayfa verisi `boss-page-cache` ile anında gelir.
 */
export default function BossShellNav() {
  const router = useRouter()
  const pathname = usePathname()
  const pathRef = useRef(pathname)

  useEffect(() => {
    window.__RESTROID_BOSS_NAVIGATE__ = (path: string) => {
      const raw = (path || '').trim()
      if (!raw) return false
      const target = raw.startsWith('/') ? raw.split('?')[0]! : `/${raw.split('?')[0]}`
      if (target === pathRef.current) return true
      try {
        // Flutter goTab ile yarışmasın — hedefi hemen kilitle
        pathRef.current = target
        router.push(raw.startsWith('/') ? raw : `/${raw}`)
        return true
      } catch {
        return false
      }
    }

    for (const p of TAB_PREFETCH) {
      try {
        router.prefetch(p)
      } catch {
        /* ignore */
      }
    }

    return () => {
      delete window.__RESTROID_BOSS_NAVIGATE__
    }
  }, [router])

  useEffect(() => {
    pathRef.current = pathname
    postToNative({ type: 'path', path: pathname })
  }, [pathname])

  return null
}
