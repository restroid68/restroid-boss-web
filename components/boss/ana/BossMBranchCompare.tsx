import { ArrowDown, ArrowUp } from 'lucide-react'
import { formatMoneyTR } from '@/lib/boss-api'
import { cn } from '@/lib/utils'
import type { AnaBranchShare } from '@/lib/boss-p0-data'

export function BossMBranchCompare({ branches }: { branches: AnaBranchShare[] }) {
  if (branches.length < 2) return null

  return (
    <section className="mx-4 overflow-hidden rounded-2xl border border-border bg-card">
      <div className="px-4 pb-1 pt-3.5">
        <h2 className="boss-card-title">Şube karşılaştırması</h2>
      </div>
      <div className="flex flex-col gap-3 px-4 pb-4 pt-2">
        {branches.map((b) => (
          <div key={b.id} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2 text-sm">
              <div className="flex min-w-0 items-center gap-2">
                <span className="truncate font-medium text-foreground">{b.name}</span>
                {b.warning ? (
                  <span className="rounded-md bg-danger/15 px-1.5 py-0.5 text-[10px] text-danger">
                    Dikkat
                  </span>
                ) : null}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="tabular-nums">₺{formatMoneyTR(b.revenue)}</span>
                {Math.abs(b.trend) >= 0.05 ? (
                  <span
                    className={cn(
                      'inline-flex items-center text-[11px]',
                      b.trend >= 0 ? 'text-success' : 'text-danger',
                    )}
                  >
                    {b.trend >= 0 ? <ArrowUp size={11} /> : <ArrowDown size={11} />}
                    {Math.abs(b.trend)}%
                  </span>
                ) : null}
              </div>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${Math.max(0, Math.min(100, b.share))}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
