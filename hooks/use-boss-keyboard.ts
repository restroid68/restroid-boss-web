'use client'

import { useEffect, useState } from 'react'
import { postToNative } from '@/lib/boss-bridge'

/**
 * Soft keyboard görünürlüğü — SPA + Flutter alt nav.
 * html[data-keyboard="1"] ile layout alt boşluğu küçülür.
 */
export function useBossKeyboard() {
  const [keyboardOpen, setKeyboardOpen] = useState(false)
  const [keyboardInset, setKeyboardInset] = useState(0)

  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return

    let last = false
    const sync = () => {
      const overflow = Math.max(0, window.innerHeight - vv.height - vv.offsetTop)
      const open = overflow > 80
      setKeyboardInset(open ? overflow : 0)
      if (open !== last) {
        last = open
        setKeyboardOpen(open)
        document.documentElement.dataset.keyboard = open ? '1' : '0'
        postToNative({ type: 'keyboard', open })
      } else if (open) {
        setKeyboardInset(overflow)
      }
    }

    vv.addEventListener('resize', sync)
    vv.addEventListener('scroll', sync)
    window.addEventListener('focusin', sync)
    window.addEventListener('focusout', () => {
      window.setTimeout(sync, 120)
    })
    sync()
    return () => {
      vv.removeEventListener('resize', sync)
      vv.removeEventListener('scroll', sync)
      window.removeEventListener('focusin', sync)
      document.documentElement.dataset.keyboard = '0'
      postToNative({ type: 'keyboard', open: false })
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
