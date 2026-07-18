'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { onNativeSession, readNativeSession } from '@/lib/boss-bridge'

/**
 * Loads page data with mock fallback.
 * Critical for WebView: Flutter injects session AFTER first paint —
 * we wait briefly for token and reload when `__RESTROID_BOSS__` arrives.
 */
export function useBossLoad<T>(loader: () => Promise<T>, fallback: T) {
  const [data, setData] = useState<T>(fallback)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loaderRef = useRef(loader)
  const fallbackRef = useRef(fallback)
  loaderRef.current = loader
  fallbackRef.current = fallback

  const run = useCallback(() => {
    setLoading(true)
    return loaderRef
      .current()
      .then((d) => {
        setData(d)
        setError(null)
        return d
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : 'Yükleme hatası')
        setData(fallbackRef.current)
        return fallbackRef.current
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined

    const safeRun = () => {
      if (cancelled) return
      void run()
    }

    if (readNativeSession()?.token) {
      safeRun()
    } else {
      // Give Flutter injectSession a short window before mock fallback
      timer = setTimeout(safeRun, 750)
    }

    const off = onNativeSession(() => {
      if (timer) {
        clearTimeout(timer)
        timer = undefined
      }
      safeRun()
    })

    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
      off()
    }
  }, [run])

  return { data, setData, loading, error, reload: run }
}
