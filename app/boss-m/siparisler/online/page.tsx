'use client'

import { useMemo, useState } from 'react'
import { BossMPageHeader } from '@/components/boss/BossMPageHeader'
import { BossMOrdersList } from '@/components/boss/BossMOrdersList'
import { useBossLoad } from '@/hooks/use-boss-load'
import { loadOnlineOrdersPage } from '@/lib/boss-page-data'
import { isOpenBossOrderStatus } from '@/lib/boss-online-platform'
import { cn } from '@/lib/utils'

type StatusSeg = 'all' | 'open' | 'done'

export default function BossMOnlineOrdersPage() {
  const { data, loading } = useBossLoad(
    loadOnlineOrdersPage,
    { orders: [], source: 'mock' },
    { cacheKey: 'page:online-orders:v2', ttlMs: 20_000 },
  )
  const [seg, setSeg] = useState<StatusSeg>('all')

  const orders = useMemo(() => {
    if (seg === 'open') return data.orders.filter((o) => isOpenBossOrderStatus(o.statusKey || o.status))
    if (seg === 'done') {
      return data.orders.filter((o) => !isOpenBossOrderStatus(o.statusKey || o.status))
    }
    return data.orders
  }, [data.orders, seg])

  return (
    <main className="flex min-h-0 flex-1 flex-col bg-transparent">
      <BossMPageHeader title="Online siparişler" showBack />

      <div className="mx-4 mb-3 flex gap-1 rounded-xl border border-border bg-surface-2 p-1">
        {(
          [
            ['all', 'Tümü'],
            ['open', 'Açık'],
            ['done', 'Kapalı'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setSeg(id)}
            className={cn(
              'h-9 !min-h-0 flex-1 rounded-lg text-xs font-semibold transition-colors',
              seg === id
                ? 'border border-border bg-card text-foreground shadow-sm'
                : 'text-muted-foreground',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto overscroll-none boss-nested-scroll">
        <BossMOrdersList
          orders={orders}
          loading={loading}
          emptyTitle={seg === 'open' ? 'Açık sipariş yok' : 'Online sipariş yok'}
        />
      </div>
    </main>
  )
}
