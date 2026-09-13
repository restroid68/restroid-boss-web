import Link from 'next/link'
import { Users } from 'lucide-react'
import type { AnaStaffSummary } from '@/lib/boss-p0-data'

export function BossMStaffCard({ staff }: { staff: AnaStaffSummary }) {
  if (staff.total <= 0 && !staff.topPerformer) return null
  const denom = staff.total > 0 ? staff.total : Math.max(staff.onDuty, 1)
  const pct = staff.total > 0 ? Math.round((staff.onDuty / denom) * 100) : 0

  return (
    <section className="mx-4 overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex items-center justify-between px-4 pb-1 pt-3.5">
        <h2 className="boss-card-title">Personel</h2>
        <Link href="/boss-m/personel" className="text-[11px] font-medium text-primary">
          Liste
        </Link>
      </div>
      <div className="flex flex-col gap-3 px-4 pb-4 pt-1">
        <div>
          <div className="flex items-baseline justify-between">
            <p className="text-2xl font-semibold tabular-nums text-foreground">
              {staff.onDuty}
              <span className="text-sm font-normal text-muted-foreground"> / {staff.total}</span>
            </p>
            <span className="text-[11px] text-muted-foreground">{staff.dutyLabel}</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2">
            <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, pct)}%` }} />
          </div>
        </div>

        {staff.topPerformer ? (
          <div className="boss-inset-row flex items-center gap-3 rounded-xl border px-3 py-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
              {staff.topPerformer
                .split(/\s+/)
                .map((w) => w[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{staff.topPerformer}</p>
              <p className="text-[11px] text-muted-foreground">Günün en yüksek satışı</p>
            </div>
            <span className="shrink-0 text-sm font-semibold tabular-nums">{staff.topPerformerSales}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <Users size={14} />
            Bu günde satış kaydı yok
          </div>
        )}

        {staff.initials.length > 0 ? (
          <div className="flex items-center">
            {staff.initials.map((ini, i) => (
              <span
                key={`${ini}-${i}`}
                className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-card bg-surface-2 text-[10px] font-semibold text-muted-foreground"
                style={{ marginLeft: i === 0 ? 0 : -8 }}
              >
                {ini}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  )
}
