import { cn } from '@/lib/utils'
import type { KpiMetric } from '@/lib/boss-mock'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface BossMKpiRowProps {
  metrics: KpiMetric[]
}

export function BossMKpiRow({ metrics }: BossMKpiRowProps) {
  return (
    <div className="grid grid-cols-4 gap-2 px-4">
      {metrics.map((m) => (
        <div
          key={m.label}
          className="bg-card rounded-xl px-2.5 py-3 flex flex-col gap-0.5"
        >
          <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider leading-none">
            {m.label}
          </span>
          <span className="text-sm font-bold text-foreground leading-tight tabular-nums">
            {m.unit}{m.value}
          </span>
          <span
            className={cn(
              'flex items-center gap-0.5 text-[9px] font-semibold leading-none',
              m.delta >= 0 ? 'text-success' : 'text-danger'
            )}
          >
            {m.delta >= 0
              ? <TrendingUp size={8} strokeWidth={2.5} />
              : <TrendingDown size={8} strokeWidth={2.5} />
            }
            {m.delta >= 0 ? '+' : ''}{m.delta}%
          </span>
        </div>
      ))}
    </div>
  )
}
