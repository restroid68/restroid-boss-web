import { cn } from '@/lib/utils'
import type { Movement } from '@/lib/boss-mock'
import {
  CreditCard,
  Banknote,
  Receipt,
  Globe,
  XCircle,
  ArrowRightLeft,
} from 'lucide-react'

const iconMap: Record<string, React.ElementType> = {
  card:    CreditCard,
  cash:    Banknote,
  expense: Receipt,
  online:  Globe,
  cancel:  XCircle,
  transfer:ArrowRightLeft,
}

interface BossMMovementListProps {
  movements: Movement[]
}

export function BossMMovementList({ movements }: BossMMovementListProps) {
  return (
    <div className="mx-4 bg-card rounded-2xl border border-border overflow-hidden">
      <div className="px-4 pt-3 pb-2">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Son Hareketler
        </span>
      </div>

      <div className="flex flex-col divide-y divide-border">
        {movements.map((m) => {
          const Icon = iconMap[m.icon] ?? Receipt
          return (
            <div key={m.id} className="flex items-center gap-3 px-4 py-3.5">
              <div
                className={cn(
                  'flex items-center justify-center w-9 h-9 rounded-xl shrink-0',
                  m.sign === 'positive'
                    ? 'bg-success/10 text-success'
                    : 'bg-danger/10 text-danger'
                )}
              >
                <Icon size={16} strokeWidth={1.8} />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground leading-tight truncate">
                  {m.title}
                </p>
                <p className="text-xs text-muted-foreground">{m.sub}</p>
              </div>

              <div className="flex flex-col items-end shrink-0">
                <span
                  className={cn(
                    'text-sm font-bold tabular-nums',
                    m.sign === 'positive' ? 'text-success' : 'text-danger'
                  )}
                >
                  {m.amount}
                </span>
                <span className="text-[10px] text-muted-foreground">{m.time}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
