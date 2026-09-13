import { BossMMoneyText } from '@/components/boss/BossMMoneyText'
import { formatMoneyTR } from '@/lib/boss-money'
import type { AnaPlatformRow } from '@/lib/boss-p0-data'
import {
  bossPlatformLabel,
  bossPlatformLogoSrc,
  normalizeBossPlatformCode,
} from '@/lib/boss-online-platform'

export function BossMPlatforms({ platforms }: { platforms: AnaPlatformRow[] }) {
  if (!platforms.length) return null

  return (
    <section className="mx-4 overflow-hidden rounded-2xl border border-border bg-card">
      <div className="px-4 pb-1 pt-3.5">
        <h2 className="boss-card-title">Sipariş platformları</h2>
      </div>
      <div className="flex flex-col gap-2 px-3 pb-3 pt-1">
        {platforms.map((p) => {
          const code = normalizeBossPlatformCode(p.key || p.name)
          const logo = bossPlatformLogoSrc(code)
          const name = logo ? bossPlatformLabel(code) : p.name.trim() || bossPlatformLabel(code)
          return (
            <div
              key={p.key}
              className="boss-inset-row flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                {logo ? (
                  <span className="relative flex h-8 w-8 shrink-0 overflow-hidden rounded-lg bg-white">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={logo} alt="" className="h-full w-full object-cover" />
                  </span>
                ) : (
                  <span className="h-2 w-2 shrink-0 rounded-full bg-success" aria-hidden />
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{name}</p>
                  {p.orders > 0 ? (
                    <p className="text-[11px] text-muted-foreground">{p.orders} sipariş</p>
                  ) : null}
                </div>
              </div>
              <BossMMoneyText
                amount={formatMoneyTR(p.revenue, 2)}
                amountClassName="text-sm"
              />
            </div>
          )
        })}
      </div>
    </section>
  )
}
