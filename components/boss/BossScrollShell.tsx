'use client'

import { useCallback, useRef, type ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { invalidateBossCache } from '@/lib/boss-page-cache'
import { isBossTabPath, normalizeBossPath } from '@/lib/boss-navigation'
import { useBossPullToRefresh } from '@/hooks/use-boss-pull-to-refresh'
import { cn } from '@/lib/utils'

const PULL_REFRESH_PATHS: Record<string, string> = {
  '/boss-m/ana': 'page:ana',
}

export default function BossScrollShell({ children }: { children: ReactNode }) {
  const pathname = normalizeBossPath(usePathname())
  const router = useRouter()
  const scrollRef = useRef<HTMLDivElement>(null)
  const cacheKey = PULL_REFRESH_PATHS[pathname]

  const onRefresh = useCallback(async () => {
    if (cacheKey) invalidateBossCache(cacheKey)
    router.refresh()
  }, [cacheKey, router])

  const { pull, refreshing } = useBossPullToRefresh(scrollRef, onRefresh, Boolean(cacheKey))

  return (
    <div className="boss-native-scroll relative z-10 flex min-h-0 flex-1 flex-col pb-[var(--boss-native-nav-inset)]">
      {(pull > 8 || refreshing) && cacheKey ? (
        <div
          className="pointer-events-none absolute inset-x-0 top-2 z-20 flex justify-center"
          style={{ transform: `translateY(${refreshing ? 16 : Math.min(pull, 40)}px)` }}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1a2332]/90 shadow-lg">
            <Loader2 className={cn('h-4 w-4 text-primary', refreshing && 'animate-spin')} />
          </div>
        </div>
      ) : null}
      <div
        ref={scrollRef}
        className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain touch-pan-y"
        style={
          pull > 0 && !refreshing && isBossTabPath(pathname)
            ? { transform: `translateY(${pull * 0.35}px)`, transition: 'none' }
            : { transition: 'transform 0.22s ease-out' }
        }
      >
        {children}
      </div>
    </div>
  )
}
