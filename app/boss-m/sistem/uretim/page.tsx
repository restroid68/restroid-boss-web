'use client'

import { Flame } from 'lucide-react'
import { BossMPageHeader } from '@/components/boss/BossMPageHeader'
import { BossMEmptyState } from '@/components/boss/BossMEmptyState'
import { useBossLoad } from '@/hooks/use-boss-load'
import { loadUretimPage } from '@/lib/boss-page-data'
import { cn } from '@/lib/utils'

export default function BossMUretimPage() {
  const { data, loading } = useBossLoad(loadUretimPage, { areas: [], source: 'mock' })

  return (
    <main className="flex flex-col pb-4">
      <BossMPageHeader title="Üretim Yerleri" showBack />

      {loading ? (
        <div className="px-4 space-y-2 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-14 bg-surface-2 rounded-2xl" />
          ))}
        </div>
      ) : data.areas.length === 0 ? (
        <BossMEmptyState icon={Flame} title="Üretim yeri yok" description="Tanımlı üretim alanı bulunamadı." />
      ) : (
        <div className="mx-4 bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border">
          {data.areas.map((a) => (
            <div key={a.id} className="flex items-center gap-3 px-4 py-3.5">
              <div className={cn('w-2 h-2 rounded-full', a.active ? 'bg-success' : 'bg-muted-foreground/30')} />
              <p className={cn('flex-1 text-sm font-semibold', a.active ? 'text-foreground' : 'text-muted-foreground')}>
                {a.name}
              </p>
              <span
                className={cn(
                  'text-[10px] font-semibold px-2 py-0.5 rounded-full',
                  a.active ? 'bg-success/10 text-success' : 'bg-surface-2 text-muted-foreground',
                )}
              >
                {a.active ? 'Aktif' : 'Pasif'}
              </span>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
