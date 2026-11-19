import type { AnaOwnerBrief } from '@/lib/boss-p0-data'

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-2xl bg-surface-2 px-3 py-2.5">
      <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
      <p className="mt-0.5 truncate text-sm font-bold tabular-nums text-foreground">{value}</p>
    </div>
  )
}

/** Dönem özeti (seçili günle biten son 7 gün). Gün özeti `BossMDaySummary` içindedir. */
export function BossMOwnerBrief({ brief }: { brief: AnaOwnerBrief }) {
  return (
    <section className="px-4" aria-label="Dönem özeti">
      <article className="rounded-3xl border border-border bg-card p-4">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-sm font-semibold text-foreground">Dönem özeti</h2>
          <p className="text-xs text-muted-foreground">{brief.periodLabel}</p>
        </div>
        <p className="mt-3 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Kapanan hesap
        </p>
        <p className="mt-0.5 text-3xl font-bold tabular-nums tracking-tight text-foreground">{brief.periodNet}</p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <Mini label="Gider" value={brief.periodExpense} />
          <Mini label="İptal + ikram + zayi" value={brief.periodLoss} />
          <Mini label="Satış olan" value={brief.busyDays} />
        </div>
      </article>
    </section>
  )
}
