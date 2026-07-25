'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { postToNative } from '@/lib/boss-bridge'
import { bossHaptic } from '@/lib/boss-haptic'
import { prefetchBossChunks } from '@/lib/boss-chunk-prefetch'
import { normalizeBossPath } from '@/lib/boss-navigation'

/**
 * Flutter kabuğu ↔ Next App Router soft navigasyon.
 * `location.href` yerine `router.push` — layout/WebView yeniden yüklenmez;
 * sayfa verisi `boss-page-cache` ile anında gelir.
 */
export default function BossShellNav() {
  const router = useRouter()
  const pathname = usePathname()
  const pathRef = useRef(normalizeBossPath(pathname))

  useEffect(() => {
    window.__RESTROID_BOSS_NAVIGATE__ = (path: string) => {
      const target = normalizeBossPath(path)
      if (target === pathRef.current) return true
      try {
        pathRef.current = target
        bossHaptic('selection')
        router.push(path.startsWith('/') ? path : `/${path}`)
        return true
      } catch {
        return false
      }
    }

    prefetchBossChunks((p) => router.prefetch(p))

    return () => {
      delete window.__RESTROID_BOSS_NAVIGATE__
    }
  }, [router])

  useEffect(() => {
    pathRef.current = normalizeBossPath(pathname)
    postToNative({ type: 'path', path: pathname })
  }, [pathname])

  return null
}
