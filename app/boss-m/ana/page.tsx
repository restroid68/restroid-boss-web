'use client'

import { useEffect, useState } from 'react'
import { BossMKpiRow } from '@/components/boss/ana/BossMKpiRow'
import { BossMChannelGrid } from '@/components/boss/ana/BossMChannelGrid'
import { BossMDikkatList } from '@/components/boss/ana/BossMDikkatList'
import { BossMOperasyonChipsRow } from '@/components/boss/ana/BossMOperasyonChips'
import { BossMSubelerTeaser } from '@/components/boss/ana/BossMSubelerTeaser'
import { BossMSkeletonKpiRow, BossMSkeletonList } from '@/components/boss/BossMSkeleton'
import { BRANCHES } from '@/lib/boss-mock'
import { loadAnaDashboard, type AnaDashboardData } from '@/lib/boss-p0-data'
import { onNativeSession, postToNative, readNativeSession } from '@/lib/boss-bridge'
import { Store, ChevronDown } from 'lucide-react'

const BRANCH_REVENUE: Record<string, string> = {
  b1: '₺24.8K',
  b2: '₺18.2K',
  b3: '₺11.5K',
}

export default function BossMDashboard() {
  const [data, setData] = useState<AnaDashboardData | null>(null)
  const today = new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric',
    month: 'long',
    weekday: 'long',
  }).format(new Date())

  useEffect(() => {
    let cancelled = false
    const reload = () => {
      loadAnaDashboard().then((d) => {
        if (!cancelled) setData(d)
      })
    }
    reload()
    const off = onNativeSession(() => reload())
    return () => {
      cancelled = true
      off()
    }
  }, [])

  if (!data) {
    return (
      <main className="flex flex-col gap-4 pb-4 pt-5">
        <BossMSkeletonKpiRow />
        <BossMSkeletonList rows={4} />
      </main>
    )
  }

  const multiBranch = BRANCHES.length > 1
  const session = readNativeSession()

  return (
    <main className="flex flex-col gap-4 pb-4">
      <header className="px-4 pt-5 pb-1 flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
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

      {multiBranch && (
        <BossMSubelerTeaser branches={BRANCHES} revenue={BRANCH_REVENUE} />
      )}

      <div className="px-4 flex items-center gap-2">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Dikkat
        </span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <BossMDikkatList alerts={data.alerts} />
    </main>
  )
}
