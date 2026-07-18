'use client'

import { TrendingUp, TrendingDown, AlertTriangle, Star } from 'lucide-react'

// Hardcoded today's summary snapshot — in production this would come from the API
const SUMMARY = {
  ciro: '₺24.860',
  target: '₺28.000',
  progress: 89, // percent of daily target
  costAnomaly: { label: 'Market alışverişi', amount: '₺430', delta: '+38%' },
  topProduct: { name: 'Izgara Köfte', qty: 42, revenue: '₺2.940' },
}

export function BossMaiDailySummaryCard() {
  return (
    <div className="mx-4 mb-2 rounded-2xl border border-border bg-card overflow-hidden">
      {/* Header strip */}
      <div className="flex items-center gap-2 px-4 pt-3.5 pb-2.5 border-b border-border">
        <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-primary/15">
          {/* Sparkle icon via inline svg for the AI feel */}
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" className="text-primary">
            <path d="M8 1v3M8 12v3M1 8h3M12 8h3M3.05 3.05l2.12 2.12M10.83 10.83l2.12 2.12M3.05 12.95l2.12-2.12M10.83 5.17l2.12-2.12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
        </span>
        <span className="text-xs font-semibold text-foreground">Günlük Özet</span>
        <span className="ml-auto text-[11px] text-muted-foreground">Bugün · 18 Tem</span>
      </div>

      {/* Ciro vs target */}
      <div className="px-4 pt-3 pb-1">
        <div className="flex items-end justify-between mb-1.5">
          <div>
            <p className="text-[11px] text-muted-foreground mb-0.5">Günlük Ciro</p>
            <p className="text-xl font-bold text-foreground tracking-tight">{SUMMARY.ciro}</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-muted-foreground mb-0.5">Hedef</p>
            <p className="text-sm font-semibold text-muted-foreground">{SUMMARY.target}</p>
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-1.5 rounded-full bg-surface-3 overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${SUMMARY.progress}%` }}
          />
        </div>
        <p className="text-[11px] text-muted-foreground mt-1">
          Hedefe{' '}
          <span className="text-warning font-medium">%{100 - SUMMARY.progress}</span>{' '}
          kaldı
        </p>
      </div>

      {/* Two metric pills */}
      <div className="grid grid-cols-2 gap-2 px-4 py-3">
        {/* Cost anomaly */}
        <div className="flex items-start gap-2 bg-danger/8 border border-danger/20 rounded-xl px-3 py-2.5">
          <AlertTriangle size={13} className="text-danger mt-0.5 shrink-0" />
          <div className="min-w-0">
            <p className="text-[10px] font-medium text-danger leading-tight">Maliyet Uyarısı</p>
            <p className="text-xs font-semibold text-foreground mt-0.5 truncate">{SUMMARY.costAnomaly.label}</p>
            <p className="text-[11px] text-muted-foreground">
              {SUMMARY.costAnomaly.amount}{' '}
              <span className="text-danger">{SUMMARY.costAnomaly.delta}</span>
            </p>
          </div>
        </div>
        {/* Top product */}
        <div className="flex items-start gap-2 bg-success/8 border border-success/20 rounded-xl px-3 py-2.5">
          <Star size={13} className="text-success mt-0.5 shrink-0" />
          <div className="min-w-0">
            <p className="text-[10px] font-medium text-success leading-tight">En Çok Satan</p>
            <p className="text-xs font-semibold text-foreground mt-0.5 truncate">{SUMMARY.topProduct.name}</p>
            <p className="text-[11px] text-muted-foreground">
              {SUMMARY.topProduct.qty} adet · {SUMMARY.topProduct.revenue}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
