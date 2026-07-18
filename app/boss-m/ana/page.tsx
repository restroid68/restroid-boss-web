'use client'

import { BossMKpiRow } from '@/components/boss/ana/BossMKpiRow'
import { BossMChannelGrid } from '@/components/boss/ana/BossMChannelGrid'
import { BossMDikkatList } from '@/components/boss/ana/BossMDikkatList'
import { BossMOperasyonChipsRow } from '@/components/boss/ana/BossMOperasyonChips'
import { BossMSkeletonKpiRow, BossMSkeletonList } from '@/components/boss/BossMSkeleton'
import { ANA_KPIS, CHANNEL_CARDS, DIKKAT_ALERTS, STOK_KPI } from '@/lib/boss-mock'
import { loadAnaDashboard, type AnaDashboardData } from '@/lib/boss-p0-data'
import { postToNative, readNativeSession } from '@/lib/boss-bridge'
import { useBossLoad } from '@/hooks/use-boss-load'
import { Store, ChevronDown } from 'lucide-react'

const ANA_FALLBACK: AnaDashboardData = {
  restaurantName: 'Restroid',
  branchLabel: 'HQ',
  kpis: ANA_KPIS,
  channels: CHANNEL_CARDS,
  alerts: DIKKAT_ALERTS,
  operasyonBadges: { stok: STOK_KPI.kritikAdet },
  source: 'mock',
}

export default function BossMDashboard() {
  const { data, loading } = useBossLoad(loadAnaDashboard, ANA_FALLBACK, {
    cacheKey: 'page:ana',
    ttlMs: 45_000,
  })
  const today = new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric',
    month: 'long',
    weekday: 'long',
  }).format(new Date())

  if (loading) {
    return (
      <main className="flex flex-col gap-4 pb-4 pt-5">
        <BossMSkeletonKpiRow />
        <BossMSkeletonList rows={4} />
      </main>
    )
  }

  const session = readNativeSession()
  // Flutter app bar restoran adını gösterir — WebView içinde tekrar etme
  const nativeShell = Boolean(session?.token)

  return (
    <main className="flex flex-col gap-4 pb-4">
      <header className="px-4 pt-3 pb-1">
        {nativeShell ? (
          <span className="text-xs text-muted-foreground capitalize">
            {today} &mdash; Bugün
            {data.source === 'mock' ? ' · örnek veri' : ''}
          </span>
        ) : (
          <div className="flex flex-col gap-0.5 pt-2">
            <button
              type="button"
              onClick={() => postToNative({ type: 'switchRestaurant' })}
              className="flex items-center gap-2 text-left active:opacity-80"
            >
              <Store size={15} className="text-primary shrink-0" />
              <span className="text-base font-bold text-foreground">
                {data.restaurantName || session?.restaurantName || 'Restroid'}
              </span>
              <span className="px-2 py-0.5 bg-surface-2 border border-border rounded-full text-[10px] font-medium text-muted-foreground inline-flex items-center gap-0.5">
                {data.branchLabel}
                <ChevronDown size={10} />
              </span>
            </button>
            <span className="text-xs text-muted-foreground pl-0.5 capitalize">
              {today} &mdash; Bugün
              {data.source === 'mock' ? ' · örnek veri' : ''}
            </span>
          </div>
        )}
      </header>

      <BossMKpiRow metrics={data.kpis} />

      <div className="px-4 flex items-center gap-2">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Kanallar
        </span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <BossMChannelGrid channels={data.channels} />

      <div className="px-4 flex items-center gap-2">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Operasyon
        </span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <BossMOperasyonChipsRow badgeOverrides={data.operasyonBadges} />

      {data.alerts.length > 0 && (
        <>
          <div className="px-4 flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Dikkat
            </span>
            <div className="flex-1 h-px bg-border" />
          </div>
          <BossMDikkatList alerts={data.alerts} />
        </>
      )}
    </main>
  )
}
