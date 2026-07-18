'use client'

import { ShoppingBag } from 'lucide-react'
import { BossMEmptyState } from '@/components/boss/BossMEmptyState'
import type { BossOrderRow } from '@/lib/boss-page-data'
import { cn } from '@/lib/utils'

export function BossMOrdersList({
  orders,
  loading,
  emptyTitle,
}: {
  orders: BossOrderRow[]
  loading?: boolean
  emptyTitle: string
}) {
  if (loading) {
    return (
      <div className="flex flex-col gap-2 px-4 animate-pulse">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-surface-2 rounded-2xl" />
        ))}
      </div>
    )
  }

  if (!orders.length) {
    return (
      <BossMEmptyState
        icon={ShoppingBag}
        title={emptyTitle}
        description="Bekleyen veya son sipariş bulunamadı."
      />
    )
  }

  return (
    <div className="mx-4 bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border">
      {orders.map((o) => (
        <div key={o.id} className="flex items-center gap-3 px-4 py-3.5">
          <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-foreground truncate">{o.title}</p>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-surface-2 text-muted-foreground shrink-0">
                {o.platform}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {o.customer} · {o.time}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-sm font-bold tabular-nums text-foreground">{o.amount}</p>
            <p className={cn('text-[10px] font-medium text-muted-foreground')}>{o.status}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
