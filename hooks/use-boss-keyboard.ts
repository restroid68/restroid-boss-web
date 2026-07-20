'use client'

import { useEffect, useState } from 'react'
import { startBossKeyboardBridge } from '@/lib/boss-keyboard-bridge'

/**
 * Soft keyboard görünürlüğü — sayfa UI (composer sticky vb.).
 * Native sinyal global bridge üzerinden gider (`BossBridgeBootstrap`).
 */
export function useBossKeyboard() {
  const [keyboardOpen, setKeyboardOpen] = useState(false)
  const [keyboardInset, setKeyboardInset] = useState(0)

  useEffect(() => {
    const stop = startBossKeyboardBridge()

    const read = () => {
      const open = document.documentElement.dataset.keyboard === '1'
      setKeyboardOpen(open)
      const raw = getComputedStyle(document.documentElement)
        .getPropertyValue('--boss-keyboard-inset')
        .trim()
      const n = Number.parseFloat(raw)
      setKeyboardInset(Number.isFinite(n) ? n : 0)
    }

    read()
    const mo = new MutationObserver(read)
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-keyboard', 'style'],
    })
    window.visualViewport?.addEventListener('resize', read)

    return () => {
      mo.disconnect()
      window.visualViewport?.removeEventListener('resize', read)
      stop()
    }
  }, [])

  useEffect(() => {
    if (!keyboardOpen) return
    const t = window.setTimeout(() => {
      const el = document.activeElement
      if (el instanceof HTMLElement && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) {
        el.scrollIntoView({ block: 'center', behavior: 'smooth' })
      }
    }, 100)
    return () => window.clearTimeout(t)
  }, [keyboardOpen, keyboardInset])

  return { keyboardOpen, keyboardInset }
}
