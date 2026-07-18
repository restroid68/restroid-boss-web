'use client'

import { BossMPageHeader } from '@/components/boss/BossMPageHeader'
import { BossMOrdersList } from '@/components/boss/BossMOrdersList'
import { useBossLoad } from '@/hooks/use-boss-load'
import { loadOnlineOrdersPage } from '@/lib/boss-page-data'

export default function BossMOnlineOrdersPage() {
  const { data, loading } = useBossLoad(loadOnlineOrdersPage, { orders: [], source: 'mock' })

  return (
    <main className="flex flex-col gap-4 pb-4">
      <BossMPageHeader title="Online siparişler" showBack />
      <BossMOrdersList
        orders={data.orders}
        loading={loading}
        emptyTitle="Online sipariş yok"
      />
    </main>
  )
}
