'use client'

import { CreditCard } from 'lucide-react'
import { BossMPageHeader } from '@/components/boss/BossMPageHeader'
import { BossMEmptyState } from '@/components/boss/BossMEmptyState'
import { useBossLoad } from '@/hooks/use-boss-load'
import { loadOdemePage } from '@/lib/boss-page-data'
import { cn } from '@/lib/utils'

export default function BossMOdemeTurleriPage() {
  const { data, loading } = useBossLoad(loadOdemePage, { payments: [], source: 'mock' })
  const active = data.payments.filter((p) => p.active).length

  return (
    <main className="flex flex-col pb-4">
      <BossMPageHeader title="Ödeme Türleri" showBack />

      <div className="mx-4 mb-4 bg-card border border-border rounded-2xl px-4 py-3 flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-info/10">
          <CreditCard size={18} className="text-info" strokeWidth={1.6} />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{active} aktif</p>
          <p className="text-[11px] text-muted-foreground">{data.payments.length} kayıt</p>
        </div>
      </div>

      {loading ? (
        <div className="px-4 space-y-2 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-14 bg-surface-2 rounded-2xl" />
          ))}
        </div>
      ) : data.payments.length === 0 ? (
        <BossMEmptyState icon={CreditCard} title="Ödeme türü yok" description="Tanımlı ödeme yöntemi bulunamadı." />
      ) : (
        <div className="mx-4 bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border">
          {data.payments.map((p) => (
            <div key={p.id} className="flex items-center gap-3 px-4 py-3.5">
              <div className={cn('w-2 h-2 rounded-full', p.active ? 'bg-success' : 'bg-muted-foreground/30')} />
              <p className={cn('flex-1 text-sm font-medium', p.active ? 'text-foreground' : 'text-muted-foreground')}>
                {p.name}
              </p>
              <span
                className={cn(
                  'text-[10px] font-semibold px-2 py-0.5 rounded-full',
                  p.active ? 'bg-success/10 text-success' : 'bg-surface-2 text-muted-foreground',
                )}
              >
                {p.active ? 'Aktif' : 'Pasif'}
              </span>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
