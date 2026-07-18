'use client'

import { useEffect } from 'react'
import { notifyNativeReady } from '@/lib/boss-bridge'

/** Mount once under boss-m — tells Flutter WebView the SPA is ready for session inject. */
export default function BossBridgeBootstrap() {
  useEffect(() => {
    notifyNativeReady()
  }, [])
  return null
}
