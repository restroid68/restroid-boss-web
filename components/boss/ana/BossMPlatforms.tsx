import { formatMoneyTR } from '@/lib/boss-api'
import type { AnaPlatformRow } from '@/lib/boss-p0-data'

export function BossMPlatforms({ platforms }: { platforms: AnaPlatformRow[] }) {
  if (!platforms.length) return null

  return (
    <section className="mx-4 overflow-hidden rounded-2xl border border-border bg-card">
      <div className="px-4 pb-1 pt-3.5">
        <h2 className="boss-card-title">Sipariş platformları</h2>
      </div>
      <div className="flex flex-col gap-2 px-3 pb-3 pt-1">
        {platforms.map((p) => (
          <div
            key={p.key}
            className="boss-inset-row flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5"
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="h-2 w-2 shrink-0 rounded-full bg-success" aria-hidden />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{p.name}</p>
                {p.orders > 0 ? (
                  <p className="text-[11px] text-muted-foreground">{p.orders} sipariş</p>
                ) : null}
              </div>
            </div>
            <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
              ₺{formatMoneyTR(p.revenue)}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}
