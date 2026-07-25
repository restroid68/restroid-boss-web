'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { isBossStackPath, isBossTabPath } from '@/lib/boss-navigation'
import { cn } from '@/lib/utils'

/** Stack (drawer) sayfalarında sağdan kayma; sekmelerde animasyon yok. */
export default function BossRouteTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const prevRef = useRef(pathname)
  const [enter, setEnter] = useState(false)

  useEffect(() => {
    const prev = prevRef.current
    const wasTab = isBossTabPath(prev)
    const isStack = isBossStackPath(pathname)
    const wasStack = isBossStackPath(prev)
    if (isStack && (!wasStack || (wasTab && isStack))) {
      setEnter(true)
      const t = window.setTimeout(() => setEnter(false), 320)
      prevRef.current = pathname
      return () => window.clearTimeout(t)
    }
    prevRef.current = pathname
    setEnter(false)
  }, [pathname])

  return (
    <div className={cn('min-h-0 flex-1', enter && isBossStackPath(pathname) && 'boss-stack-enter')}>
      {children}
    </div>
  )
}
