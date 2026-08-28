'use client'

import Link from 'next/link'
import { Clock } from 'lucide-react'
import { BossMPageHeader } from '@/components/boss/BossMPageHeader'
import { BossMEmptyState } from '@/components/boss/BossMEmptyState'
import { useBossLoad } from '@/hooks/use-boss-load'
import { loadTimesheetPage } from '@/lib/boss-page-data'

function fmtDt(raw: string | null): string {
  if (!raw) return '—'
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return raw
  return d.toLocaleString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function fmtHours(n: number | null): string {
  if (n == null || !Number.isFinite(n)) return '—'
  return n.toLocaleString('tr-TR', { maximumFractionDigits: 2 })
}

export default function BossMPuantajPage() {
  const { data, loading } = useBossLoad(loadTimesheetPage, {
    yearMonth: '',
    rows: [],
    hoursByPersonnel: [],
    source: 'mock',
  })

  const monthLabel = (() => {
    const [y, m] = data.yearMonth.split('-').map(Number)
    if (!y || !m) return data.yearMonth
    return new Date(y, m - 1, 1).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })
  })()

  return (
    <main className="flex flex-col h-full bg-transparent">
      <BossMPageHeader title="Puantaj" showBack />

      <div className="flex-1 overflow-y-auto overscroll-none px-4 pb-8">
        <p className="text-xs text-muted-foreground leading-relaxed mb-4">
          İşe giriş ve çıkış saati (PIN). Nakit teslimi (vardiya) ve Z raporu değildir. Kasada «Mesaiyi bitir» çıkışı kaydeder.
        </p>

        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
          {monthLabel}
        </p>

        {data.hoursByPersonnel.length > 0 && (
          <div className="bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border mb-4">
            {data.hoursByPersonnel.map((h) => (
              <div key={h.personnelId} className="flex items-baseline justify-between gap-3 px-4 py-3">
                <span className="text-sm text-foreground truncate">{h.fullName}</span>
                <span className="text-sm font-semibold tabular-nums text-foreground shrink-0">
                  {fmtHours(h.workedHours)} sa
                </span>
              </div>
            ))}
          </div>
        )}

        {loading ? (
          <div className="space-y-2 animate-pulse">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-14 bg-surface-2 rounded-2xl" />
            ))}
          </div>
        ) : data.rows.length === 0 ? (
          <BossMEmptyState
            icon={Clock}
            title="Puantaj kaydı yok"
            description="Bu ay için giriş-çıkış görünmüyor. Kasada PIN ile işe giriş saati başlar."
          />
        ) : (
          <div className="bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border">
            {data.rows.map((row) => (
              <div key={row.id} className="px-4 py-3.5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-foreground truncate">{row.personnelName}</p>
                  <span className="text-[10px] text-muted-foreground border border-border px-1.5 py-0.5 rounded-full shrink-0">
                    {row.source}
                  </span>
                </div>
                <div className="flex items-baseline justify-between gap-3 mt-1">
                  <p className="text-[10px] text-muted-foreground">
                    {fmtDt(row.startedAt)} → {row.endedAt ? fmtDt(row.endedAt) : 'Devam'}
                  </p>
                  <p className="text-sm font-semibold tabular-nums text-foreground">
                    {row.endedAt ? `${fmtHours(row.hours)} sa` : 'Devam'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-muted-foreground leading-relaxed mt-4">
          Nakit teslim listesi:{' '}
          <Link href="/boss-m/raporlar/vardiya" className="text-foreground font-medium underline underline-offset-2">
            Nakit vardiya
          </Link>
        </p>
      </div>
    </main>
  )
}
