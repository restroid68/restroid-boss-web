'use client'

import { useState } from 'react'
import { Plus, ClipboardList, ClipboardCheck, User, CalendarDays } from 'lucide-react'
import { BossMPageHeader } from '@/components/boss/BossMPageHeader'
import { BossMEmptyState } from '@/components/boss/BossMEmptyState'
import { SAYIMLAR, STOK_WAREHOUSES } from '@/lib/boss-mock'
import type { SayimStatus, Sayim, StokWarehouse } from '@/lib/boss-mock'
import { useBossLoad } from '@/hooks/use-boss-load'
import { loadSayimlarPage } from '@/lib/boss-page-data'
import { cn } from '@/lib/utils'

function warehouseName(id: string, warehouses: StokWarehouse[]) {
  return warehouses.find((w) => w.id === id)?.name ?? id
}

function progressPercent(counted: number, total: number) {
  if (total === 0) return 100
  return Math.round((counted / total) * 100)
}

const TAB_OPTIONS: SayimStatus[] = ['Sayımda', 'Kapalı']

function ProgressBar({ counted, total }: { counted: number; total: number }) {
  const pct = progressPercent(counted, total)
  const complete = counted === total
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground tabular-nums">
          {counted}/{total} kalem
        </span>
        <span className={cn(
          'text-[11px] font-semibold tabular-nums',
          complete ? 'text-success' : 'text-warning'
        )}>
          %{pct}
        </span>
      </div>
      <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', complete ? 'bg-success' : 'bg-warning')}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function SayimCard({ sayim, warehouses }: { sayim: Sayim; warehouses: StokWarehouse[] }) {
  const isOpen = sayim.status === 'Sayımda'

  return (
    <div className={cn(
      'bg-card border rounded-2xl px-4 py-4 flex flex-col gap-3',
      isOpen ? 'border-warning/30' : 'border-border'
    )}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className={cn(
            'flex items-center justify-center w-9 h-9 rounded-xl shrink-0',
            isOpen ? 'bg-warning/10' : 'bg-success/10'
          )}>
            {isOpen
              ? <ClipboardList size={16} className="text-warning" strokeWidth={1.7} />
              : <ClipboardCheck size={16} className="text-success" strokeWidth={1.7} />
            }
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">
              {warehouseName(sayim.warehouseId, warehouses)}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">#{sayim.id}</p>
          </div>
        </div>
        <span className={cn(
          'text-[10px] font-semibold px-2 py-1 rounded-full border shrink-0',
          isOpen
            ? 'bg-warning/10 text-warning border-warning/20'
            : 'bg-success/10 text-success border-success/20'
        )}>
          {sayim.status}
        </span>
      </div>

      <ProgressBar counted={sayim.counted} total={sayim.total} />

      <div className="flex items-center gap-4 pt-1 border-t border-border">
        <div className="flex items-center gap-1.5">
          <User size={12} className="text-muted-foreground" />
          <span className="text-[11px] text-muted-foreground">{sayim.createdBy}</span>
        </div>
        <div className="flex items-center gap-1.5 ml-auto">
          <CalendarDays size={12} className="text-muted-foreground" />
          <span className="text-[11px] text-muted-foreground">{sayim.date}</span>
        </div>
      </div>
    </div>
  )
}

export default function BossMStokSayimlarPage() {
  const { data, loading } = useBossLoad(loadSayimlarPage, {
    sayimlar: SAYIMLAR,
    warehouses: STOK_WAREHOUSES,
    source: 'mock',
  })
  const [activeTab, setActiveTab] = useState<SayimStatus>('Sayımda')

  const filtered = data.sayimlar.filter((s) => s.status === activeTab)
  const acikCount   = data.sayimlar.filter((s) => s.status === 'Sayımda').length
  const kapaliCount = data.sayimlar.filter((s) => s.status === 'Kapalı').length

  return (
    <main className="flex flex-col h-svh bg-background overflow-hidden">
      <BossMPageHeader
        title="Sayımlar"
        showBack
        trailing={
          <button
            aria-label="Yeni sayım"
            className="flex items-center gap-1.5 h-11 px-3 rounded-xl text-xs font-medium text-primary border border-primary/30 active:bg-primary/10 transition-colors"
          >
            <Plus size={14} />
            Yeni sayım
          </button>
        }
      />

      <div className="flex gap-2 px-4 pb-4">
        {TAB_OPTIONS.map((tab) => {
          const count = tab === 'Sayımda' ? acikCount : kapaliCount
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-colors',
                activeTab === tab
                  ? tab === 'Sayımda'
                    ? 'bg-warning/10 border-warning/40 text-warning'
                    : 'bg-success/10 border-success/40 text-success'
                  : 'bg-card border-border text-muted-foreground'
              )}
            >
              {tab}
              <span className={cn(
                'text-[10px] font-bold px-1.5 py-0.5 rounded-full',
                activeTab === tab
                  ? tab === 'Sayımda' ? 'bg-warning/20 text-warning' : 'bg-success/20 text-success'
                  : 'bg-surface-3 text-muted-foreground'
              )}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      <div className="flex-1 overflow-y-auto overscroll-none pb-[72px] px-4">
        {loading ? (
          <div className="flex flex-col gap-3 animate-pulse">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-36 bg-surface-2 rounded-2xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <BossMEmptyState
            icon={ClipboardList}
            title="Sayım bulunamadı"
            description={activeTab === 'Sayımda' ? 'Açık sayım yok.' : 'Kapalı sayım yok.'}
          />
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((sayim) => (
              <SayimCard key={sayim.id} sayim={sayim} warehouses={data.warehouses} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
