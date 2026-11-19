'use client'

import { useEffect, useState } from 'react'
import { isNativeIosBoss, onNativeSession } from '@/lib/boss-bridge'

/**
 * iPhone / iPad uygulaması içinde mi? (App Store kuralları: uygulama içinde lisans / satın alma
 * yönlendirmesi gösterilmez — bkz. Guideline 3.1.1 / 3.1.3.)
 */
export function useNativeIos(): boolean {
  const [ios, setIos] = useState(false)
  useEffect(() => {
    const sync = () => setIos(isNativeIosBoss())
    sync()
    return onNativeSession(() => sync())
  }, [])
  return ios
}
