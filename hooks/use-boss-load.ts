'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { onNativeSession, readNativeSession } from '@/lib/boss-bridge'
import {
  bossCacheScope,
  BOSS_TTL,
  clearBossPageCache,
  peekBossCache,
  withBossCache,
} from '@/lib/boss-page-cache'

export type BossLoadOptions = {
  /** Sayfa/loader cache anahtarı (örn. page:ana). Yoksa loader.name kullanılır. */
  cacheKey?: string
  ttlMs?: number
  /** Tanım verisi → sessionStorage L2 */
  persist?: boolean
}

/**
 * Sayfa verisi — mock fallback + SWR cache.
 * Flutter oturum inject sonrası yeniden yükler; aynı scope + taze cache’te atlar.
 */
export function useBossLoad<T>(
  loader: () => Promise<T>,
  fallback: T,
  options?: BossLoadOptions,
) {
  const cacheKey =
    options?.cacheKey ||
    (typeof loader === 'function' && loader.name ? `fn:${loader.name}` : undefined)
  const ttlMs = options?.ttlMs ?? BOSS_TTL.kpi
  const persist = options?.persist ?? false

  const initialPeek = cacheKey ? peekBossCache<T>(cacheKey) : null

  const [data, setData] = useState<T>(initialPeek?.data ?? fallback)
  const [loading, setLoading] = useState(!initialPeek)
  const [error, setError] = useState<string | null>(null)

  const loaderRef = useRef(loader)
  const fallbackRef = useRef(fallback)
  const scopeRef = useRef(bossCacheScope())
  loaderRef.current = loader
  fallbackRef.current = fallback

  const run = useCallback(
    (mode: 'hard' | 'soft' = 'hard') => {
      if (mode === 'hard') setLoading(true)

      const exec = async (): Promise<T> => {
        if (cacheKey) {
          return withBossCache(cacheKey, ttlMs, () => loaderRef.current(), {
            persist,
            isCacheable: (d) => {
              if (d == null) return false
              if (typeof d === 'object' && d !== null && 'source' in d) {
                return (d as { source?: string }).source !== 'mock'
              }
              return true
            },
          })
        }
        return loaderRef.current()
      }

      return exec()
        .then((d) => {
          setData(d)
          setError(null)
          return d
        })
        .catch((e) => {
          setError(e instanceof Error ? e.message : 'Yükleme hatası')
          if (mode === 'hard') setData(fallbackRef.current)
          return fallbackRef.current
        })
        .finally(() => {
          setLoading(false)
        })
    },
    [cacheKey, ttlMs, persist],
  )

  useEffect(() => {
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined

    const safeRun = (force = false) => {
      if (cancelled) return
      if (!force && cacheKey) {
        const peek = peekBossCache<T>(cacheKey)
        if (peek?.fresh) {
          setData(peek.data)
          setLoading(false)
          return
        }
        if (peek?.stale) {
          setData(peek.data)
          setLoading(false)
          void run('soft')
          return
        }
      }
      void run('hard')
    }

    if (readNativeSession()?.token) {
      safeRun()
    } else {
      timer = setTimeout(() => safeRun(), 180)
    }

    const off = onNativeSession((session) => {
      if (timer) {
        clearTimeout(timer)
        timer = undefined
      }
      const nextScope = `${session.restaurantId ?? '_'}|${session.branchCode ?? '_'}`
      if (nextScope !== scopeRef.current) {
        clearBossPageCache(true)
        scopeRef.current = nextScope
        safeRun(true)
        return
      }
      // Aynı restoran — taze cache varsa session reinject’te tekrar çekme
      safeRun(false)
    })

    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
      off()
    }
  }, [run, cacheKey])

  return { data, setData, loading, error, reload: () => run('hard') }
}
