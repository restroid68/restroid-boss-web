'use client'

import { TrendingUp, TrendingDown, AlertTriangle, Minus } from 'lucide-react'

/** Mini KPI strip embedded inside an assistant bubble */
export function AiKpiStrip({
  rows,
  hero = false,
}: {
  rows: { label: string; value: string; delta?: string; sign?: 'up' | 'down' | 'flat' }[]
  /** İlk satırı büyük rakam olarak vurgula (patron özeti) */
  hero?: boolean
}) {
  if (!rows.length) return null
  const [first, ...rest] = rows
  const deltaClass = (sign?: 'up' | 'down' | 'flat') =>
    sign === 'up'
      ? 'text-[10px] font-medium text-success'
      : sign === 'down'
        ? 'text-[10px] font-medium text-danger'
        : 'text-[10px] font-medium text-muted-foreground'

  return (
    <div className="rounded-xl border border-border bg-surface-3 overflow-hidden">
      {hero && first ? (
        <div className="px-3 py-3 border-b border-border bg-gradient-to-br from-primary/10 via-surface-3 to-surface-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {first.label}
          </p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl font-semibold tabular-nums tracking-tight text-foreground">
              {first.value}
            </span>
            {first.delta ? (
              <span className={deltaClass(first.sign)}>
                {first.sign === 'up' ? (
                  <TrendingUp className="inline h-3 w-3" />
                ) : first.sign === 'down' ? (
                  <TrendingDown className="inline h-3 w-3" />
                ) : (
                  <Minus className="inline h-3 w-3" />
                )}{' '}
                {first.delta}
              </span>
            ) : null}
          </div>
        </div>
      ) : null}
      <div className="divide-y divide-border">
        {(hero ? rest : rows).map((r, i) => (
          <div key={i} className="flex items-center justify-between px-3 py-2.5">
            <span className="text-xs text-muted-foreground">{r.label}</span>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold tabular-nums text-foreground">{r.value}</span>
              {r.delta ? <span className={deltaClass(r.sign)}>{r.delta}</span> : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/** Mini ranked list for cancellations or top-products */
export function AiRankedList({
  title,
  rows,
  accent,
}: {
  title: string
  rows: { label: string; sub: string; value: string }[]
  accent: 'danger' | 'warning' | 'success'
}) {
  const accentClass = {
    danger: 'text-danger bg-danger/10',
    warning: 'text-warning bg-warning/10',
    success: 'text-success bg-success/10',
  }[accent]

  return (
    <div className="rounded-xl border border-border bg-surface-3 overflow-hidden">
      <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border-b border-border">
        {title}
      </p>
      {rows.map((r, i) => (
        <div key={i} className="flex items-center gap-3 px-3 py-2.5 border-b border-border last:border-0">
          <span className={`flex items-center justify-center w-5 h-5 rounded-md text-[10px] font-bold shrink-0 ${accentClass}`}>
            {i + 1}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground truncate">{r.label}</p>
            <p className="text-[10px] text-muted-foreground">{r.sub}</p>
          </div>
          <span className="text-xs font-semibold text-foreground shrink-0">{r.value}</span>
        </div>
      ))}
    </div>
  )
}

/** Warning banner card */
export function AiAlertBanner({
  message,
  detail,
}: {
  message: string
  detail: string
}) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl bg-warning/10 border border-warning/25 px-3 py-2.5">
      <AlertTriangle size={14} className="text-warning mt-0.5 shrink-0" />
      <div>
        <p className="text-xs font-semibold text-foreground">{message}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{detail}</p>
      </div>
    </div>
  )
}
