import Link from 'next/link'
import { AlertCircle, AlertTriangle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AnaOpsAlert } from '@/lib/boss-p0-data'

const SEVERITY = {
  critical: { icon: AlertCircle, className: 'text-danger' },
  warning: { icon: AlertTriangle, className: 'text-warning' },
  info: { icon: Info, className: 'text-muted-foreground' },
} as const

export function BossMOpsAlerts({ alerts }: { alerts: AnaOpsAlert[] }) {
  if (!alerts.length) return null

  return (
    <section className="mx-4 overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex items-center justify-between px-4 pb-1 pt-3.5">
        <h2 className="boss-card-title">Operasyon uyarıları</h2>
        <Link href="/boss-m/denetim" className="text-[11px] font-medium text-primary">
          Denetim
        </Link>
      </div>
      <div className="flex flex-col gap-2 px-3 pb-3 pt-1">
        {alerts.map((alert) => {
          const cfg = SEVERITY[alert.severity]
          const Icon = cfg.icon
          const body = (
            <div className="boss-inset-row flex items-start gap-3 rounded-xl border px-3 py-2.5">
              <Icon size={15} className={cn('mt-0.5 shrink-0', cfg.className)} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{alert.title}</span>
                  <span className="rounded-md bg-surface-2 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                    {alert.module}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">{alert.detail}</p>
              </div>
            </div>
          )
          if (!alert.href) return <div key={alert.id}>{body}</div>
          return (
            <Link key={alert.id} href={alert.href} className="active:opacity-80">
              {body}
            </Link>
          )
        })}
      </div>
    </section>
  )
}
