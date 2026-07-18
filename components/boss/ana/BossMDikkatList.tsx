import { cn } from '@/lib/utils'
import type { AlertRow } from '@/lib/boss-mock'
import { AlertTriangle, AlertCircle } from 'lucide-react'

interface BossMDikkatListProps {
  alerts: AlertRow[]
}

export function BossMDikkatList({ alerts }: BossMDikkatListProps) {
  return (
    <div className="mx-4 bg-card rounded-2xl overflow-hidden border border-border">
      <div className="px-4 pt-3 pb-2 flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Dikkat
        </span>
        <span className="text-xs text-muted-foreground">{alerts.length} uyarı</span>
      </div>

      <div className="flex flex-col divide-y divide-border">
        {alerts.map((a) => (
          <div key={a.id} className="flex items-start gap-3 px-4 py-3.5">
            <div
              className={cn(
                'flex items-center justify-center w-8 h-8 rounded-lg shrink-0 mt-0.5',
                a.type === 'kritik'
                  ? 'bg-danger/10 text-danger'
                  : 'bg-warning/10 text-warning'
              )}
            >
              {a.type === 'kritik'
                ? <AlertCircle size={16} strokeWidth={2} />
                : <AlertTriangle size={16} strokeWidth={2} />
              }
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm font-medium text-foreground truncate">
                  {a.message}
                </span>
                <span className="text-xs text-muted-foreground shrink-0">{a.time}</span>
              </div>
              <span className="text-xs text-muted-foreground">{a.detail}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
