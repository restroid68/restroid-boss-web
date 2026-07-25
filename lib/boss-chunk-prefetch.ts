import { BOSS_TAB_PATHS } from '@/lib/boss-navigation'

const STACK_PREFETCH = [
  '/boss-m/stok',
  '/boss-m/menu',
  '/boss-m/raporlar',
  '/boss-m/siparisler/online',
  '/boss-m/personel',
  '/boss-m/cariler',
  '/boss-m/sistem',
] as const

/** Boot sonrası sekme + drawer chunk'larını arka planda ısıt. */
export function prefetchBossChunks(routerPrefetch?: (path: string) => void): void {
  if (typeof window === 'undefined') return
  const idle = window.requestIdleCallback ?? ((cb: IdleRequestCallback) =>
    window.setTimeout(() => cb({ didTimeout: false, timeRemaining: () => 50 } as IdleDeadline), 500))

  idle(() => {
    for (const p of BOSS_TAB_PATHS) {
      try {
        routerPrefetch?.(p)
      } catch {
        /* ignore */
      }
    }
    for (const p of STACK_PREFETCH) {
      try {
        routerPrefetch?.(p)
      } catch {
        /* ignore */
      }
    }
    void import('@/app/boss-m/stok/page')
    void import('@/app/boss-m/menu/page')
    void import('@/app/boss-m/raporlar/page')
    void import('@/app/boss-m/personel/page')
  })
}
