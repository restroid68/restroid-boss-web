'use client'

import { BossMPageHeader } from '@/components/boss/BossMPageHeader'
import { BossMOrdersList } from '@/components/boss/BossMOrdersList'
import { useBossLoad } from '@/hooks/use-boss-load'
import { loadQrOrdersPage } from '@/lib/boss-page-data'

export default function BossMQrOrdersPage() {
  const { data, loading } = useBossLoad(
    loadQrOrdersPage,
    { orders: [], source: 'mock' },
    { cacheKey: 'page:qr-orders:v2', ttlMs: 20_000 },
  )

  return (
    <main className="flex min-h-0 flex-1 flex-col bg-transparent">
      <BossMPageHeader title="QR menü siparişleri" showBack />
      <div className="flex-1 overflow-y-auto overscroll-none boss-nested-scroll">
        <BossMOrdersList
          orders={data.orders}
          loading={loading}
          emptyTitle="QR sipariş yok"
        />
      </div>
    </main>
  )
}
