'use client'

import { BossMKpiRow } from '@/components/boss/ana/BossMKpiRow'
import { BossMRevenueTrend } from '@/components/boss/ana/BossMRevenueTrend'
import { BossMFinanceSnapshot } from '@/components/boss/ana/BossMFinanceSnapshot'
import { BossMChannelShares } from '@/components/boss/ana/BossMChannelShares'
import { BossMPlatforms } from '@/components/boss/ana/BossMPlatforms'
import { BossMStaffCard } from '@/components/boss/ana/BossMStaffCard'
import { BossMOpsAlerts } from '@/components/boss/ana/BossMOpsAlerts'
import { BossMBranchCompare } from '@/components/boss/ana/BossMBranchCompare'
import { BossMSkeletonKpiRow, BossMSkeletonList } from '@/components/boss/BossMSkeleton'
import { ANA_KPIS } from '@/lib/boss-mock'
import { loadAnaDashboard, type AnaDashboardData } from '@/lib/boss-p0-data'
import { postToNative, readNativeSession } from '@/lib/boss-bridge'
import { useBossLoad } from '@/hooks/use-boss-load'
import { Store, ChevronDown } from 'lucide-react'

const ANA_FALLBACK: AnaDashboardData = {
  restaurantName: 'Restroid',
  branchLabel: '',
  kpis: ANA_KPIS.map((k) => ({ ...k })),
  revenueTrend: [],
  channelShares: [],
  platforms: [],
  finance: [],
  staff: {
    onDuty: 0,
    total: 0,
    dutyLabel: 'aktif kadro',
    topPerformer: null,
    topPerformerSales: null,
    initials: [],
  },
  branches: [],
  channels: [],
  alerts: [],
  opsAlerts: [],
  operasyonBadges: {},
  source: 'mock',
}

export default function BossMDashboard() {
  const { data, loading } = useBossLoad(loadAnaDashboard, ANA_FALLBACK, {
    cacheKey: 'page:ana:v2',
    ttlMs: 45_000,
  })
  const today = new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric',
    month: 'long',
    weekday: 'long',
  }).format(new Date())

  if (loading) {
    return (
      <main className="flex flex-col gap-4 bg-transparent pb-4 pt-5">
        <BossMSkeletonKpiRow />
        <BossMSkeletonList rows={4} />
      </main>
    )
  }

  const session = readNativeSession()
  const nativeShell = Boolean(session?.token)

  return (
    <main className="flex flex-col gap-3.5 bg-transparent pb-4">
      <header className="px-4 pb-1 pt-3">
        {nativeShell ? (
          <span className="text-xs capitalize text-muted-foreground">
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
              <Store size={15} className="shrink-0 text-primary" />
              <span className="text-base font-bold text-foreground">
                {data.restaurantName || session?.restaurantName || 'Restroid'}
              </span>
              {data.branchLabel.trim() ? (
                <span className="inline-flex items-center gap-0.5 rounded-full border border-border bg-surface-2 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {data.branchLabel}
                  <ChevronDown size={10} />
                </span>
              ) : (
                <ChevronDown size={14} className="shrink-0 text-muted-foreground" />
              )}
            </button>
            <span className="pl-0.5 text-xs capitalize text-muted-foreground">
              {today} &mdash; Bugün
              {data.source === 'mock' ? ' · örnek veri' : ''}
            </span>
          </div>
        )}
      </header>

      <BossMKpiRow metrics={data.kpis} />
      <BossMRevenueTrend points={data.revenueTrend} />
      <BossMFinanceSnapshot rows={data.finance} />
      <BossMChannelShares channels={data.channelShares} />
      <BossMPlatforms platforms={data.platforms} />
      <BossMBranchCompare branches={data.branches} />
      <BossMStaffCard staff={data.staff} />
      <BossMOpsAlerts alerts={data.opsAlerts} />
    </main>
  )
}
