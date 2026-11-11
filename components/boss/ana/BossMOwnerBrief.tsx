import type { AnaOwnerBrief, AnaOwnerChip } from '@/lib/boss-p0-data'
import { cn } from '@/lib/utils'

function lossClass(tone: AnaOwnerChip['tone']) {
  if (tone === 'bad') return 'bg-rose-500/15 text-rose-200'
  if (tone === 'warn') return 'bg-amber-400/15 text-amber-100'
  return 'bg-surface-2 text-muted-foreground'
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-2xl bg-surface-2 px-3 py-2.5">
      <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
      <p className="mt-0.5 truncate text-sm font-bold tabular-nums text-foreground">{value}</p>
    </div>
  )
}

export function BossMOwnerBrief({ brief }: { brief: AnaOwnerBrief }) {
  return (
    <section className="flex flex-col gap-3 px-4" aria-label="Gün ve dönem özeti">
      <article className="rounded-3xl border border-border bg-card p-4">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-sm font-semibold text-foreground">Gün özeti</h2>
          <p className="text-xs text-muted-foreground">{brief.dayLabel}</p>
        </div>
        <p className="mt-3 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Kapanan hesap
        </p>
        <p className="mt-0.5 text-3xl font-bold tabular-nums tracking-tight text-foreground">{brief.closed}</p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <Mini label="Açık sipariş" value={brief.openOrders} />
          <Mini label="Tahsilat" value={brief.collected} />
          <Mini label="Kişi başı" value={brief.perGuest} />
        </div>
        <p className="mt-3 text-[11px] text-muted-foreground">Alınan ödeme oranı {brief.collectRate}</p>
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {brief.dayLoss.map((chip) => (
            <li
              key={chip.label}
              className={cn('rounded-full px-2.5 py-1 text-[11px] font-semibold tabular-nums', lossClass(chip.tone))}
            >
              {chip.label} {chip.value}
            </li>
          ))}
        </ul>
        {brief.note ? (
          <p className="mt-3 rounded-2xl bg-amber-400/10 px-3 py-2 text-xs leading-relaxed text-amber-100">
            {brief.note}
          </p>
        ) : null}
      </article>

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
