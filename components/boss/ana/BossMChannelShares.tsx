import { Lock } from 'lucide-react'
import { formatMoneyTR } from '@/lib/boss-api'
import type { AnaChannelShare } from '@/lib/boss-p0-data'

function Bar({ value }: { value: number }) {
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
      <div
        className="h-full rounded-full bg-primary"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  )
}

export function BossMChannelShares({ channels }: { channels: AnaChannelShare[] }) {
  if (!channels.length) return null
  const active = channels.filter((c) => c.active)
  const locked = channels.filter((c) => !c.active)

  return (
    <section className="mx-4 overflow-hidden rounded-2xl border border-border bg-card">
      <div className="px-4 pb-1 pt-3.5">
        <h2 className="boss-card-title">Satış kanalları</h2>
      </div>
      <div className="flex flex-col gap-3.5 px-4 pb-4 pt-2">
        {active.map((c) => (
          <div key={c.key} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="font-medium text-foreground">{c.label}</span>
              <div className="flex items-center gap-2 tabular-nums">
                <span className="text-foreground">₺{formatMoneyTR(c.amount)}</span>
                <span className="w-9 text-right text-[11px] text-muted-foreground">%{c.share}</span>
              </div>
            </div>
            <Bar value={c.share} />
          </div>
        ))}
        {locked.length > 0 ? (
          <div className="mt-1 flex flex-wrap gap-1.5 rounded-xl border border-dashed border-border p-2.5">
            {locked.map((c) => (
              <span
                key={c.key}
                className="inline-flex items-center gap-1 rounded-md bg-surface-2 px-2 py-1 text-[11px] text-muted-foreground"
              >
                <Lock size={11} />
                {c.label}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  )
}
