'use client'

import { BossMPageHeader } from '@/components/boss/BossMPageHeader'
import { BossMOrdersList } from '@/components/boss/BossMOrdersList'
import { useBossLoad } from '@/hooks/use-boss-load'
import { loadQrOrdersPage } from '@/lib/boss-page-data'

export default function BossMQrOrdersPage() {
  const { data, loading } = useBossLoad(loadQrOrdersPage, { orders: [], source: 'mock' })

  return (
    <main className="flex flex-col gap-4 pb-4">
      <BossMPageHeader title="QR menü siparişleri" showBack />
      <BossMOrdersList
        orders={data.orders}
        loading={loading}
        emptyTitle="QR sipariş yok"
      />
    </main>
  )
}
