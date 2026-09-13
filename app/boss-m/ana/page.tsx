'use client'

import { useCallback } from 'react'
import { BossMKpiRow } from '@/components/boss/ana/BossMKpiRow'
import { BossMRevenueTrend } from '@/components/boss/ana/BossMRevenueTrend'
import { BossMFinanceSnapshot } from '@/components/boss/ana/BossMFinanceSnapshot'
import { BossMChannelShares } from '@/components/boss/ana/BossMChannelShares'
import { BossMPlatforms } from '@/components/boss/ana/BossMPlatforms'
import { BossMStaffCard } from '@/components/boss/ana/BossMStaffCard'
import { BossMOpsAlerts } from '@/components/boss/ana/BossMOpsAlerts'
import { BossMBranchCompare } from '@/components/boss/ana/BossMBranchCompare'
import { BossMDayPicker } from '@/components/boss/BossMDayPicker'
import { BossMSkeletonKpiRow, BossMSkeletonList } from '@/components/boss/BossMSkeleton'
import { useBossSelectedDay } from '@/hooks/use-boss-selected-day'
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
  const { day } = useBossSelectedDay()
  const load = useCallback(() => loadAnaDashboard(day), [day])
  const { data, loading } = useBossLoad(load, ANA_FALLBACK, {
    cacheKey: `page:ana:v4:${day}`,
    ttlMs: 45_000,
  })

  const session = readNativeSession()
  const nativeShell = Boolean(session?.token)
  const mockNote = data.source === 'mock' ? ' · örnek veri' : ''

  if (loading) {
    return (
      <main className="flex flex-col gap-4 bg-transparent pb-8 pt-5">
        <header className="px-4 pb-1">
          <BossMDayPicker />
        </header>
        <BossMSkeletonKpiRow />
        <BossMSkeletonList rows={4} />
      </main>
    )
  }

  return (
    <main className="flex flex-col gap-3.5 bg-transparent pb-8">
      <header className="px-4 pb-1 pt-3">
        {nativeShell ? (
          <div className="flex items-center gap-2">
            <BossMDayPicker />
            {mockNote ? (
              <span className="text-xs text-muted-foreground">{mockNote.trim()}</span>
            ) : null}
          </div>
        ) : (
          <div className="flex flex-col gap-2 pt-2">
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
            <div className="flex items-center gap-2">
              <BossMDayPicker />
              {mockNote ? (
                <span className="text-xs text-muted-foreground">{mockNote.trim()}</span>
              ) : null}
            </div>
          </div>
        )}
      </header>

      <BossMKpiRow metrics={data.kpis} />
      <BossMRevenueTrend points={data.revenueTrend} />
      <BossMFinanceSnapshot rows={data.finance} day={day} />
      <BossMChannelShares channels={data.channelShares} />
      <BossMPlatforms platforms={data.platforms} />
      <BossMBranchCompare branches={data.branches} />
      <BossMStaffCard staff={data.staff} />
      <BossMOpsAlerts alerts={data.opsAlerts} />
    </main>
  )
}
