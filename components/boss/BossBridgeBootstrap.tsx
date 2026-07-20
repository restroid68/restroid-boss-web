'use client'

import { useEffect } from 'react'
import { notifyNativeReady, onNativeCacheClear } from '@/lib/boss-bridge'
import { startBossKeyboardBridge } from '@/lib/boss-keyboard-bridge'
import { clearBossPageCache } from '@/lib/boss-page-cache'

/** Mount once under boss-m — Flutter ready + cache clear + klavye köprüsü. */
export default function BossBridgeBootstrap() {
  useEffect(() => {
    notifyNativeReady()
    const stopKeyboard = startBossKeyboardBridge()
    const stopCache = onNativeCacheClear(() => {
      clearBossPageCache(true)
    })
    return () => {
      stopKeyboard()
      stopCache()
    }
  }, [])
  return null
}
