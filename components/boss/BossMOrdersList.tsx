'use client'

import { ShoppingBag } from 'lucide-react'
import { BossMEmptyState } from '@/components/boss/BossMEmptyState'
import { BossMMoneyText } from '@/components/boss/BossMMoneyText'
import type { BossOrderRow } from '@/lib/boss-page-data'
import { formatMoneyTR } from '@/lib/boss-money'
import { bossOrderStatusTone, type BossOrderStatusTone } from '@/lib/boss-online-platform'
import { cn } from '@/lib/utils'

const STATUS_TONE: Record<BossOrderStatusTone, string> = {
  new: 'text-emerald-400',
  prep: 'text-amber-400',
  ready: 'text-cyan-400',
  ship: 'text-violet-400',
  done: 'text-muted-foreground',
  cancel: 'text-rose-400',
  muted: 'text-muted-foreground',
}

function PlatformMark({ order }: { order: BossOrderRow }) {
  if (order.logoSrc) {
    return (
      <span
        className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white"
        aria-hidden
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={order.logoSrc} alt="" className="h-full w-full object-cover" />
      </span>
    )
  }
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
      <ShoppingBag size={18} strokeWidth={1.7} />
    </span>
  )
}

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
          <div key={i} className="h-[4.5rem] rounded-2xl bg-surface-2" />
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
    <div className="mx-4 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
      {orders.map((o) => {
        const tone = bossOrderStatusTone(o.statusKey || o.status)
        const settled = tone === 'done' || tone === 'cancel'
        return (
          <div
            key={o.id}
            className={cn('flex items-center gap-3 px-3 py-3.5', settled && 'opacity-70')}
            aria-label={`${o.platform} ${o.title} ${o.status}`}
          >
            <PlatformMark order={o} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-semibold text-foreground">{o.title}</p>
                {o.serviceLabel ? (
                  <span className="shrink-0 rounded-md bg-surface-2 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {o.serviceLabel}
                  </span>
                ) : null}
              </div>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {o.customer !== '—' ? o.customer : o.platform}
                {o.time !== '—' ? ` · ${o.time}` : ''}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <BossMMoneyText
                amount={formatMoneyTR(o.amount, 2)}
                amountClassName="text-sm"
              />
              <p className={cn('mt-0.5 text-[10px] font-semibold', STATUS_TONE[tone])}>{o.status}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
