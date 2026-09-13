import { cn } from '@/lib/utils'
import type { KpiMetric } from '@/lib/boss-mock'
import { ArrowDown, ArrowUp, Minus } from 'lucide-react'

interface BossMKpiRowProps {
  metrics: KpiMetric[]
}

export function BossMKpiRow({ metrics }: BossMKpiRowProps) {
  return (
    <div className="grid grid-cols-2 gap-2 px-4">
      {metrics.map((m) => {
        const showTrend = !m.neutral && Math.abs(m.delta) >= 0.05
        return (
          <div
            key={m.label}
            className="flex flex-col gap-1.5 rounded-2xl border border-border bg-card px-3.5 py-3"
          >
            <span className="text-[11px] font-medium text-muted-foreground">
              {m.label}
            </span>
            <div className="flex items-end justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xl font-bold leading-tight tabular-nums text-foreground">
                  {m.value}
                  {m.unit ? (
                    <span className="ml-0.5 text-[0.7em] font-semibold text-muted-foreground">
                      {m.unit}
                    </span>
                  ) : null}
                </p>
                {m.description ? (
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{m.description}</p>
                ) : null}
              </div>
              {m.neutral ? (
                <span className="inline-flex shrink-0 items-center gap-0.5 rounded-md bg-surface-2 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                  <Minus size={10} strokeWidth={2.4} />
                  canlı
                </span>
              ) : showTrend ? (
                <span
                  className={cn(
                    'inline-flex shrink-0 items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-semibold tabular-nums',
                    m.delta >= 0 ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger',
                  )}
                >
                  {m.delta >= 0 ? (
                    <ArrowUp size={10} strokeWidth={2.4} />
                  ) : (
                    <ArrowDown size={10} strokeWidth={2.4} />
                  )}
                  {Math.abs(m.delta)}%
                </span>
              ) : null}
            </div>
          </div>
        )
      })}
    </div>
  )
}
