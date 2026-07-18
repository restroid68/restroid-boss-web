'use client'

import { useEffect } from 'react'
import { notifyNativeReady, onNativeCacheClear } from '@/lib/boss-bridge'
import { clearBossPageCache } from '@/lib/boss-page-cache'

/** Mount once under boss-m — Flutter ready + cache clear köprüsü. */
export default function BossBridgeBootstrap() {
  useEffect(() => {
    notifyNativeReady()
    return onNativeCacheClear(() => {
      clearBossPageCache(true)
    })
  }, [])
  return null
}
