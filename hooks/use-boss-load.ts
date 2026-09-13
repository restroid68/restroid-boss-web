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
  const seqRef = useRef(0)
  loaderRef.current = loader
  fallbackRef.current = fallback

  const run = useCallback(
    (mode: 'hard' | 'soft' = 'hard') => {
      const seq = ++seqRef.current
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
          if (seq !== seqRef.current) return d
          setData(d)
          setError(null)
          return d
        })
        .catch((e) => {
          if (seq !== seqRef.current) return fallbackRef.current
          setError(e instanceof Error ? e.message : 'Yükleme hatası')
          if (mode === 'hard') setData(fallbackRef.current)
          return fallbackRef.current
        })
        .finally(() => {
          if (seq !== seqRef.current) return
          setLoading(false)
        })
    },
    [cacheKey, ttlMs, persist],
  )

  useEffect(() => {
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined

    // cacheKey değişince önceki anahtarın verisini gösterme (kasa hesabı, gün vb.)
    if (cacheKey) {
      const peek = peekBossCache<T>(cacheKey)
      if (peek) {
        setData(peek.data)
        setLoading(!peek.fresh)
      } else {
        setData(fallbackRef.current)
        setLoading(true)
      }
    }

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

  useEffect(() => {
    if (typeof window === 'undefined' || !cacheKey) return
    const onInv = (ev: Event) => {
      const prefix = String((ev as CustomEvent<string>).detail ?? '')
      if (prefix && !cacheKey.startsWith(prefix)) return
      void run('soft')
    }
    window.addEventListener('boss-cache-invalidated', onInv)
    return () => window.removeEventListener('boss-cache-invalidated', onInv)
  }, [run, cacheKey])

  const reload = useCallback(() => run('hard'), [run])
  /** Skeleton göstermeden arka planda yenile (örn. visibilitychange). */
  const reloadSoft = useCallback(() => run('soft'), [run])

  return { data, setData, loading, error, reload, reloadSoft }
}
