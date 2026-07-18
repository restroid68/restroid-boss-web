'use client'

import { AlertTriangle, Star } from 'lucide-react'
import { useBossLoad } from '@/hooks/use-boss-load'
import { loadAnaDashboard, type AnaDashboardData } from '@/lib/boss-p0-data'
import { BOSS_TTL } from '@/lib/boss-page-cache'
import { cn } from '@/lib/utils'

const EMPTY: AnaDashboardData = {
  restaurantName: '',
  branchLabel: '',
  kpis: [],
  channels: [],
  alerts: [],
  operasyonBadges: {},
  source: 'mock',
}

function kpiValue(data: AnaDashboardData, labelPart: string): string {
  const row = data.kpis.find((k) =>
    k.label.toLowerCase().includes(labelPart.toLowerCase()),
  )
  if (!row) return '—'
  const unit = row.unit === '₺' ? '₺' : ''
  return `${unit}${row.value}`
}

export function BossMaiDailySummaryCard() {
  const { data, loading } = useBossLoad(loadAnaDashboard, EMPTY, {
    cacheKey: 'page:ana',
    ttlMs: BOSS_TTL.kpi,
  })

  const today = new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric',
    month: 'short',
  }).format(new Date())

  const ciro = kpiValue(data, 'ciro')
  const openAmt = kpiValue(data, 'açık')
  const critical = data.alerts.find((a) => a.type === 'kritik') ?? data.alerts[0]
  const topChannel = data.channels.find(
    (c) => c.key !== 'masa' && c.key !== 'iptal' && c.key !== 'zayi' && c.value !== '0',
  )

  if (loading && data.source === 'mock' && !data.kpis.length) {
    return (
      <div className="mx-4 mb-2 h-40 animate-pulse rounded-2xl border border-border bg-card/80" />
    )
  }

  const isMock = data.source === 'mock'

  return (
    <div className="mx-4 mb-2 overflow-hidden rounded-2xl border border-border bg-card/90">
      <div className="flex items-center gap-2 border-b border-border px-4 pb-2.5 pt-3.5">
        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/15">
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" className="text-primary">
            <path
              d="M8 1v3M8 12v3M1 8h3M12 8h3M3.05 3.05l2.12 2.12M10.83 10.83l2.12 2.12M3.05 12.95l2.12-2.12M10.83 5.17l2.12-2.12"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </span>
        <span className="text-xs font-semibold text-foreground">Günlük Özet</span>
        <span className="ml-auto text-[11px] text-muted-foreground">
          Bugün · {today}
          {isMock ? ' · örnek' : ''}
        </span>
      </div>

      <div className="px-4 pb-1 pt-3">
        <div className="mb-1.5 flex items-end justify-between">
          <div>
            <p className="mb-0.5 text-[11px] text-muted-foreground">Günlük Ciro</p>
            <p className="text-xl font-bold tracking-tight text-foreground tabular-nums">
              {ciro}
            </p>
          </div>
          <div className="text-right">
            <p className="mb-0.5 text-[11px] text-muted-foreground">Açık hesap</p>
            <p className="text-sm font-semibold tabular-nums text-muted-foreground">
              {openAmt}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 px-4 py-3">
        <div className="flex items-start gap-2 rounded-xl border border-danger/20 bg-danger/8 px-3 py-2.5">
          <AlertTriangle size={13} className="mt-0.5 shrink-0 text-danger" />
          <div className="min-w-0">
            <p className="text-[10px] font-medium leading-tight text-danger">Dikkat</p>
            <p className="mt-0.5 truncate text-xs font-semibold text-foreground">
              {critical?.message ?? 'Uyarı yok'}
            </p>
            <p className={cn('truncate text-[11px] text-muted-foreground')}>
              {critical?.detail ?? 'Bugün kritik kayıt yok'}
            </p>
          </div>
        </div>
        <div className="flex items-start gap-2 rounded-xl border border-success/20 bg-success/8 px-3 py-2.5">
          <Star size={13} className="mt-0.5 shrink-0 text-success" />
          <div className="min-w-0">
            <p className="text-[10px] font-medium leading-tight text-success">Kanal</p>
            <p className="mt-0.5 truncate text-xs font-semibold text-foreground">
              {topChannel?.label ?? '—'}
            </p>
            <p className="text-[11px] text-muted-foreground tabular-nums">
              {topChannel?.value ?? '—'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
