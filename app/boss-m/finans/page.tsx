'use client'

import { BossMPageHeader } from '@/components/boss/BossMPageHeader'
import { BossMPaymentDonut } from '@/components/boss/finans/BossMPaymentDonut'
import { BossMQuickTiles } from '@/components/boss/finans/BossMQuickTiles'
import { BossMMovementList } from '@/components/boss/finans/BossMMovementList'
import { BossMSkeletonCard, BossMSkeletonList } from '@/components/boss/BossMSkeleton'
import { loadFinansDashboard, type FinansDashboardData } from '@/lib/boss-p0-data'
import { useBossLoad } from '@/hooks/use-boss-load'

const FINANS_FALLBACK: FinansDashboardData = {
  paymentMix: [],
  totalLabel: '₺0',
  tiles: [
    { label: 'Açık Hesaplar', value: '₺0', sub: 'bugün', variant: 'warning' },
    { label: 'Giderler', value: '₺0', sub: 'bugün', variant: 'danger' },
    { label: 'Tahsilatlar', value: '₺0', sub: 'bugün', variant: 'success' },
    { label: 'Zayi / İptal', value: '₺0', sub: 'bugün', variant: 'neutral' },
    { label: 'Kasa açığı', value: '₺0', sub: 'nakit vardiya', variant: 'danger', href: '/boss-m/raporlar/vardiya' },
    { label: 'Kasa fazlası', value: '₺0', sub: 'nakit vardiya', variant: 'success', href: '/boss-m/raporlar/vardiya' },
  ],
  movements: [],
  source: 'mock',
}

export default function BossMFinans() {
  const { data, loading } = useBossLoad(loadFinansDashboard, FINANS_FALLBACK, {
    cacheKey: 'page:finans',
    ttlMs: 45_000,
  })

  if (loading) {
    return (
      <main className="flex flex-col gap-4 bg-transparent pb-4 pt-5">
        <BossMPageHeader title="Finans" />
        <BossMSkeletonCard />
        <BossMSkeletonList rows={4} />
      </main>
    )
  }

  return (
    <main className="flex flex-col gap-4 bg-transparent pb-4">
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
        <span className="boss-card-title">Özet</span>
        <div className="h-px flex-1 bg-[color:color-mix(in_srgb,var(--boss-glow)_22%,transparent)]" />
      </div>

      <BossMQuickTiles tiles={data.tiles} />

      <div className="px-4 flex items-center gap-2">
        <span className="boss-card-title">Hareketler</span>
        <div className="h-px flex-1 bg-[color:color-mix(in_srgb,var(--boss-glow)_22%,transparent)]" />
      </div>

      <BossMMovementList movements={data.movements} />
    </main>
  )
}
