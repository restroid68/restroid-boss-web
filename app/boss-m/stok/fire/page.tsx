'use client'

import { useState } from 'react'
import { Flame, Package, Warehouse, StickyNote, CalendarDays } from 'lucide-react'
import { BossMPageHeader } from '@/components/boss/BossMPageHeader'
import { BossMEmptyState } from '@/components/boss/BossMEmptyState'
import { FIRE_DATA, STOK_WAREHOUSES } from '@/lib/boss-mock'
import type { FirePeriod, FireEntry, StokWarehouse } from '@/lib/boss-mock'
import { useBossLoad } from '@/hooks/use-boss-load'
import { loadFirePage } from '@/lib/boss-page-data'
import { cn } from '@/lib/utils'

function warehouseName(id: string, warehouses: StokWarehouse[]) {
  return warehouses.find((w) => w.id === id)?.name ?? id
}

const PERIODS: FirePeriod[] = ['Bugün', '7 Gün', '30 Gün']

function totalAmount(entries: FireEntry[]): string {
  const total = entries.reduce((sum, e) => {
    const num = parseFloat(e.amount.replace('₺', '').replace(',', '.')) || 0
    return sum + num
  }, 0)
  return `₺${total.toLocaleString('tr-TR')}`
}

function FireKpiStrip({ entries }: { entries: FireEntry[] }) {
  return (
    <div className="flex gap-3 px-4 pb-4">
      <div className="flex-1 bg-card border border-danger/25 rounded-2xl px-4 py-3.5 flex flex-col gap-1">
        <div className="flex items-center gap-1.5">
          <Flame size={13} className="text-danger" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-danger">Tutar</span>
        </div>
        <p className="text-xl font-bold text-danger tabular-nums">{totalAmount(entries)}</p>
      </div>
      <div className="flex-1 bg-card border border-border rounded-2xl px-4 py-3.5 flex flex-col gap-1">
        <div className="flex items-center gap-1.5">
          <Package size={13} className="text-muted-foreground" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Satır</span>
        </div>
        <p className="text-xl font-bold text-foreground tabular-nums">{entries.length}</p>
      </div>
    </div>
  )
}

function FireRow({ entry, warehouses }: { entry: FireEntry; warehouses: StokWarehouse[] }) {
  return (
    <div className="flex items-start gap-3 px-4 py-3.5">
      <div className="flex items-center justify-center w-9 h-9 bg-danger/10 rounded-xl shrink-0 mt-0.5">
        <Flame size={15} className="text-danger" strokeWidth={1.7} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground leading-tight">{entry.name}</p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <div className="flex items-center gap-1">
            <Package size={10} className="text-muted-foreground" />
            <span className="text-[11px] text-muted-foreground tabular-nums">
              {entry.qty} {entry.unit}
            </span>
          </div>
          <span className="text-muted-foreground/30 text-[10px]">·</span>
          <div className="flex items-center gap-1">
            <Warehouse size={10} className="text-muted-foreground" />
            <span className="text-[11px] text-muted-foreground">
              {warehouseName(entry.warehouseId, warehouses)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 mt-0.5">
          <StickyNote size={10} className="text-muted-foreground" />
          <span className="text-[11px] text-muted-foreground/70">{entry.reason}</span>
        </div>
        <div className="flex items-center gap-1 mt-0.5">
          <CalendarDays size={10} className="text-muted-foreground" />
          <span className="text-[11px] text-muted-foreground/60">{entry.date}</span>
        </div>
      </div>

      <div className="shrink-0 text-right">
        <span className="text-sm font-bold text-danger tabular-nums">{entry.amount}</span>
      </div>
    </div>
  )
}

export default function BossMStokFirePage() {
  const { data, loading } = useBossLoad(loadFirePage, {
    byPeriod: FIRE_DATA,
    warehouses: STOK_WAREHOUSES,
    source: 'mock',
  })
  const [period, setPeriod] = useState<FirePeriod>('Bugün')
  const entries = data.byPeriod[period]

  return (
    <main className="flex flex-col h-full bg-transparent overflow-hidden">
      <BossMPageHeader title="Fire / Çıkışlar" showBack />

      <div className="flex gap-2 px-4 pb-4">
        {PERIODS.map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={cn(
              'px-4 py-2 rounded-xl border text-sm font-medium transition-colors',
              period === p
                ? 'bg-danger/10 border-danger/40 text-danger'
                : 'bg-card border-border text-muted-foreground'
            )}
          >
            {p}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col gap-4 px-4 animate-pulse">
          <div className="flex gap-3">
            <div className="flex-1 h-20 bg-surface-2 rounded-2xl" />
            <div className="flex-1 h-20 bg-surface-2 rounded-2xl" />
          </div>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-surface-2 rounded-2xl" />
          ))}
        </div>
      ) : (
        <>
          <FireKpiStrip entries={entries} />

          <div className="px-4 mb-3">
            <h2 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Kayıtlar
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto overscroll-none pb-[72px] px-4">
            {entries.length === 0 ? (
              <BossMEmptyState
                icon={Flame}
                title="Fire kaydı yok"
                description="Bu dönemde kayıt bulunmuyor."
              />
            ) : (
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className="flex flex-col divide-y divide-border">
                  {entries.map((entry) => (
                    <FireRow key={entry.id} entry={entry} warehouses={data.warehouses} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </main>
  )
}
