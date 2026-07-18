'use client'

import { LayoutGrid } from 'lucide-react'
import { BossMPageHeader } from '@/components/boss/BossMPageHeader'
import { BossMEmptyState } from '@/components/boss/BossMEmptyState'
import { useBossLoad } from '@/hooks/use-boss-load'
import { loadSalonPage } from '@/lib/boss-page-data'

export default function BossMSalonPage() {
  const { data, loading } = useBossLoad(loadSalonPage, {
    salons: [],
    totalTables: 0,
    source: 'mock',
  })

  return (
    <main className="flex flex-col pb-4">
      <BossMPageHeader title="Salon / Masa" showBack />

      <div className="mx-4 mb-4 bg-card border border-border rounded-2xl px-4 py-3 flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary/10">
          <LayoutGrid size={18} className="text-primary" strokeWidth={1.6} />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{data.totalTables} masa</p>
          <p className="text-[11px] text-muted-foreground">{data.salons.length} salon</p>
        </div>
      </div>

      {loading ? (
        <div className="px-4 space-y-2 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-surface-2 rounded-2xl" />
          ))}
        </div>
      ) : data.salons.length === 0 ? (
        <BossMEmptyState icon={LayoutGrid} title="Salon yok" description="Salon tanımı bulunamadı." />
      ) : (
        <div className="mx-4 bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border">
          {data.salons.map((s) => (
            <div key={s.id} className="flex items-center gap-3 px-4 py-3.5">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{s.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {s.tableCount} masa
                  {s.capacity ? ` · ${s.capacity} kapasite` : ''}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
