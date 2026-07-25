'use client'

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import { bossHaptic } from '@/lib/boss-haptic'

const THRESHOLD = 72
const MAX_PULL = 120

export function useBossPullToRefresh(
  scrollRef: RefObject<HTMLElement | null>,
  onRefresh: () => Promise<void> | void,
  enabled = true,
) {
  const [pull, setPull] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const startY = useRef(0)
  const pulling = useRef(false)
  const pullRef = useRef(0)
  const onRefreshRef = useRef(onRefresh)
  onRefreshRef.current = onRefresh

  const finishRefresh = useCallback(async () => {
    setRefreshing(true)
    bossHaptic('medium')
    try {
      await onRefreshRef.current()
    } finally {
      setRefreshing(false)
      setPull(0)
      pullRef.current = 0
    }
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el || !enabled) return

    const onTouchStart = (e: TouchEvent) => {
      if (refreshing) return
      if (el.scrollTop > 4) return
      startY.current = e.touches[0]?.clientY ?? 0
      pulling.current = true
    }

    const onTouchMove = (e: TouchEvent) => {
      if (!pulling.current || refreshing) return
      if (el.scrollTop > 4) {
        pulling.current = false
        pullRef.current = 0
        setPull(0)
        return
      }
      const dy = (e.touches[0]?.clientY ?? 0) - startY.current
      if (dy <= 0) {
        pullRef.current = 0
        setPull(0)
        return
      }
      const next = Math.min(MAX_PULL, dy * 0.45)
      pullRef.current = next
      setPull(next)
    }

    const onTouchEnd = () => {
      if (!pulling.current) return
      pulling.current = false
      if (pullRef.current >= THRESHOLD) {
        void finishRefresh()
      } else {
        pullRef.current = 0
        setPull(0)
      }
    }

    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: true })
    el.addEventListener('touchend', onTouchEnd)
    el.addEventListener('touchcancel', onTouchEnd)
    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
      el.removeEventListener('touchcancel', onTouchEnd)
    }
  }, [enabled, finishRefresh, refreshing, scrollRef])

  return { pull, refreshing }
}
