import Link from 'next/link'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import type { AnaFinanceRow } from '@/lib/boss-p0-data'

export function BossMFinanceSnapshot({ rows }: { rows: AnaFinanceRow[] }) {
  if (!rows.length) return null

  return (
    <section className="mx-4 overflow-hidden rounded-2xl border border-border bg-card">
      <div className="px-4 pb-1 pt-3.5">
        <h2 className="text-sm font-semibold text-foreground">Kasa · Banka · Çekmece</h2>
      </div>
      <div className="flex flex-col gap-2 px-3 pb-3 pt-1">
        {rows.map((row) => {
          const inner = (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2.5">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{row.label}</p>
                <p className="text-[11px] text-muted-foreground">{row.detail}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="text-sm font-semibold tabular-nums text-foreground">{row.value}</span>
                {row.status === 'ok' ? (
                  <CheckCircle2 size={15} className="text-success" />
                ) : (
                  <AlertTriangle size={15} className="text-warning" />
                )}
              </div>
            </div>
          )
          if (!row.href) return <div key={row.key}>{inner}</div>
          return (
            <Link key={row.key} href={row.href} className="active:opacity-80">
              {inner}
            </Link>
          )
        })}
      </div>
    </section>
  )
}
