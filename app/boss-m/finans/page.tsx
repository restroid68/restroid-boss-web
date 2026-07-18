'use client'

import { useEffect, useState } from 'react'
import { BossMPageHeader } from '@/components/boss/BossMPageHeader'
import { BossMPaymentDonut } from '@/components/boss/finans/BossMPaymentDonut'
import { BossMQuickTiles } from '@/components/boss/finans/BossMQuickTiles'
import { BossMMovementList } from '@/components/boss/finans/BossMMovementList'
import { BossMSkeletonCard, BossMSkeletonList } from '@/components/boss/BossMSkeleton'
import { loadFinansDashboard, type FinansDashboardData } from '@/lib/boss-p0-data'
import { onNativeSession } from '@/lib/boss-bridge'

export default function BossMFinans() {
  const [data, setData] = useState<FinansDashboardData | null>(null)

  useEffect(() => {
    let cancelled = false
    const reload = () => {
      loadFinansDashboard().then((d) => {
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
        <BossMPageHeader title="Finans" />
        <BossMSkeletonCard />
        <BossMSkeletonList rows={4} />
      </main>
    )
  }

  return (
    <main className="flex flex-col gap-4 pb-4">
      <BossMPageHeader
        title="Finans"
        trailing={
          data.source === 'mock' ? (
            <span className="text-[10px] text-muted-foreground">örnek</span>
          ) : null
        }
      />

      <BossMPaymentDonut slices={data.paymentMix} total={data.totalLabel} />

      <div className="px-4 flex items-center gap-2">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Özet
        </span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <BossMQuickTiles tiles={data.tiles} />

      <div className="px-4 flex items-center gap-2">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Hareketler
        </span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <BossMMovementList movements={data.movements} />
    </main>
  )
}
