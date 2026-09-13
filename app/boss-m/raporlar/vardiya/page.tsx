'use client'

import Link from 'next/link'
import { AlertTriangle, Scale, Wallet } from 'lucide-react'
import { BossMPageHeader } from '@/components/boss/BossMPageHeader'
import { BossMEmptyState } from '@/components/boss/BossMEmptyState'
import { useBossLoad } from '@/hooks/use-boss-load'
import { loadCashShiftsPage } from '@/lib/boss-page-data'
import { formatMoneyTR } from '@/lib/boss-money'
import { cn } from '@/lib/utils'

function fmtDt(raw: string | null): string {
  if (!raw) return '—'
  const d = new Date(raw.includes('T') ? raw : raw.replace(' ', 'T'))
  if (Number.isNaN(d.getTime())) return raw
  return d.toLocaleString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function money(n: number): string {
  return `₺${formatMoneyTR(n, 2)}`
}

function varianceClass(n: number): string {
  if (Math.abs(n) < 0.009) return 'text-muted-foreground'
  if (n < 0) return 'text-danger'
  return 'text-warning'
}

export default function BossMNakitVardiyaPage() {
  const { data, loading } = useBossLoad(loadCashShiftsPage, {
    items: [],
    summary: { closedCount: 0, shortageAmount: 0, surplusAmount: 0, netVariance: 0 },
    from: '',
    to: '',
    source: 'mock',
  })
  const s = data.summary

  return (
    <main className="flex min-h-0 flex-1 flex-col bg-transparent">
      <BossMPageHeader title="Nakit vardiya" showBack />

      <div className="flex-1 overflow-y-auto overscroll-none px-4 boss-nested-scroll">
        <p className="text-xs text-muted-foreground leading-relaxed mb-4">
          Çekmece veya garson cüzdanı teslimi. Puantaj (işe giriş saati) ve Z raporu değildir.
        </p>

        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-card border border-danger/25 rounded-2xl p-3.5">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
              Kasa açığı
            </p>
            <p className="text-lg font-bold tabular-nums text-danger">{money(s.shortageAmount)}</p>
          </div>
          <div className="bg-card border border-success/25 rounded-2xl p-3.5">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
              Kasa fazlası
            </p>
            <p className="text-lg font-bold tabular-nums text-success">{money(s.surplusAmount)}</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-3.5">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
              Net fark
            </p>
            <p className={cn('text-lg font-bold tabular-nums', varianceClass(s.netVariance))}>
              {money(s.netVariance)}
            </p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-3.5">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
              Kapalı vardiya
            </p>
            <p className="text-lg font-bold tabular-nums text-foreground">{s.closedCount}</p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-2 animate-pulse">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 bg-surface-2 rounded-2xl" />
            ))}
          </div>
        ) : data.items.length === 0 ? (
          <BossMEmptyState
            icon={Scale}
            title="Vardiya kaydı yok"
            description="Bu dönemde kapanmış nakit teslimi görünmüyor."
          />
        ) : (
          <div className="bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border">
            {data.items.map((row) => (
              <div key={row.id} className="px-4 py-3.5">
                <div className="flex items-center gap-2">
                  <Wallet size={14} className="text-muted-foreground shrink-0" />
                  <p className="text-sm font-semibold text-foreground truncate">
                    #{row.seq} · {row.personnelName}
                  </p>
                  <span className="text-[10px] text-muted-foreground border border-border px-1.5 py-0.5 rounded-full">
                    {row.mode === 'wallet' ? 'Cüzdan' : 'Havuz kasa'}
                  </span>
                </div>
                <div className="flex items-baseline justify-between gap-3 mt-1">
                  <p className="text-[10px] text-muted-foreground">
                    {fmtDt(row.startedAt)}
                    {row.closedAt ? ` → ${fmtDt(row.closedAt)}` : ' · açık'}
                  </p>
                  <p className={cn('text-sm font-bold tabular-nums', varianceClass(row.varianceAmount))}>
                    {money(row.varianceAmount)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-start gap-3 px-4 py-3.5 bg-surface-2 border border-border rounded-2xl mt-4">
          <AlertTriangle size={14} className="text-warning mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            Çalışma saati için{' '}
            <Link href="/boss-m/personel/puantaj" className="text-foreground font-medium underline-offset-2 underline">
              Puantaj
            </Link>
            . Gün sonu fişi için{' '}
            <Link href="/boss-m/raporlar/z" className="text-foreground font-medium underline-offset-2 underline">
              Z raporları
            </Link>
            .
          </p>
        </div>
      </div>
    </main>
  )
}
