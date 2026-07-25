'use client'

import { useEffect, useState } from 'react'
import { WifiOff } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function BossOfflineBanner({ className }: { className?: string }) {
  const [offline, setOffline] = useState(false)

  useEffect(() => {
    const sync = () => setOffline(typeof navigator !== 'undefined' && !navigator.onLine)
    sync()
    window.addEventListener('online', sync)
    window.addEventListener('offline', sync)
    return () => {
      window.removeEventListener('online', sync)
      window.removeEventListener('offline', sync)
    }
  }, [])

  if (!offline) return null

  return (
    <div
      role="status"
      className={cn(
        'flex shrink-0 items-center justify-center gap-2 border-b border-amber-500/30 bg-amber-500/15 px-3 py-2 text-xs font-medium text-amber-100',
        className,
      )}
    >
      <WifiOff className="h-3.5 w-3.5 shrink-0" aria-hidden />
      <span>İnternet bağlantısı yok — önbellekteki veriler gösteriliyor</span>
    </div>
  )
}
