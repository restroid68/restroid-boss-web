'use client'

import { useState } from 'react'
import {
  ChevronLeft, ChevronRight, TrendingUp, TrendingDown,
  ShoppingBag, Package, Users, BarChart2, Clock,
} from 'lucide-react'
import { BossMPageHeader } from '@/components/boss/BossMPageHeader'
import { SAHIP_RAPORLAR } from '@/lib/boss-mock'
import { useBossLoad } from '@/hooks/use-boss-load'
import { loadSahipPage } from '@/lib/boss-page-data'
import { cn } from '@/lib/utils'

// ── KPI card ──────────────────────────────────────────────────────────────────
function KpiCard({
  label, value, sub, accent, delta,
}: {
  label: string
  value: string
  sub?: string
  accent: string
  delta?: string
}) {
  const isPos = delta?.startsWith('+')
  const isNeg = delta?.startsWith('-')
  return (
    <div className="bg-card border border-border rounded-2xl p-4">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">{label}</p>
      <p className={cn('text-2xl font-bold tabular-nums', accent)}>{value}</p>
      {delta && (
        <div className={cn(
          'flex items-center gap-1 mt-1 text-xs font-semibold',
          isPos ? 'text-success' : isNeg ? 'text-danger' : 'text-muted-foreground'
        )}>
          {isPos ? <TrendingUp size={12} strokeWidth={2.5} /> : isNeg ? <TrendingDown size={12} strokeWidth={2.5} /> : null}
          {delta} geçen aya göre
        </div>
      )}
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  )
}

// ── Mini bar chart (SVG, pure decoration) ────────────────────────────────────
function MiniBarChart({ values, color }: { values: number[]; color: string }) {
  const max = Math.max(...values)
  const W = 280; const H = 44; const BAR_W = 32; const GAP = 8
  const totalW = values.length * BAR_W + (values.length - 1) * GAP
  const offsetX = (W - totalW) / 2
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="overflow-visible">
      {values.map((v, i) => {
        const barH = max > 0 ? Math.round((v / max) * (H - 4)) : 2
        const x = offsetX + i * (BAR_W + GAP)
        const y = H - barH
        return (
          <rect
            key={i}
            x={x} y={y} width={BAR_W} height={barH}
            rx={5}
            fill={color}
            opacity={i === values.length - 1 ? 1 : 0.35}
          />
        )
      })}
    </svg>
  )
}

// ── Section stub card ─────────────────────────────────────────────────────────
function SectionCard({
  icon: Icon, title, detail, comingSoon,
}: {
  icon: React.ElementType
  title: string
  detail: string
  comingSoon?: boolean
}) {
  return (
    <div className="bg-card border border-border rounded-2xl px-4 py-4 flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
        <Icon size={18} className="text-primary" strokeWidth={1.6} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{detail}</p>
      </div>
      {comingSoon && (
        <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-surface-2 border border-border text-muted-foreground shrink-0">
          Yakında
        </span>
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function BossMSahipRaporPage() {
  const { data: page, loading } = useBossLoad(loadSahipPage, {
    months: SAHIP_RAPORLAR,
    source: 'mock',
  })
  const months = page.months.length ? page.months : SAHIP_RAPORLAR
  const [monthIdx, setMonthIdx] = useState(0)
  const data = months[Math.min(monthIdx, months.length - 1)] ?? months[0]

  // Derive int values for sparkline (ciro across months, newest last)
  const ciroValues = [...months]
    .reverse()
    .map((r) => parseInt(r.ciro.replace(/\D/g, ''), 10))

  const karValues = [...months]
    .reverse()
    .map((r) => parseInt(r.karProxy.replace(/\D/g, ''), 10))

  return (
    <main className="flex flex-col h-screen bg-background">
      <BossMPageHeader title="Sahip Raporu" showBack />

      <div className="flex-1 overflow-y-auto overscroll-none px-4 pb-8">
        {loading && (
          <div className="mb-4 h-10 bg-surface-2 rounded-xl animate-pulse" />
        )}

        {/* Month picker */}
        <div className="flex items-center gap-3 mb-5 mt-1">
          <button
            onClick={() => setMonthIdx((v) => Math.min(v + 1, months.length - 1))}
            disabled={monthIdx >= months.length - 1}
            className="w-11 h-11 flex items-center justify-center rounded-xl bg-card border border-border text-muted-foreground disabled:opacity-30 active:bg-surface-2 transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <p className="flex-1 text-center text-base font-bold text-foreground">{data.month}</p>
          <button
            onClick={() => setMonthIdx((v) => Math.max(v - 1, 0))}
            disabled={monthIdx <= 0}
            className="w-11 h-11 flex items-center justify-center rounded-xl bg-card border border-border text-muted-foreground disabled:opacity-30 active:bg-surface-2 transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* KPI stack */}
        <section className="flex flex-col gap-3 mb-6">
          <KpiCard
            label="Aylık Ciro"
            value={data.ciro}
            delta={data.ciroDelta}
            accent="text-foreground"
          />
          <div className="grid grid-cols-2 gap-3">
            <KpiCard
              label="Maliyet"
              value={data.maliyet}
              sub={`Oran: ${data.maliyetRatio}`}
              accent="text-warning"
            />
            <KpiCard
              label="Kâr (tahmini)"
              value={data.karProxy}
              accent="text-success"
            />
          </div>
          <KpiCard
            label="Personel Gideri"
            value={data.personelGider}
            sub="Brüt maaş tahmini"
            accent="text-info"
          />
        </section>

        {/* Trend charts */}
        <section className="mb-6">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            Trend ({SAHIP_RAPORLAR.length} ay)
          </p>
          <div className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-5">
            <div>
              <p className="text-xs text-muted-foreground mb-2">Ciro</p>
              <MiniBarChart values={ciroValues} color="hsl(var(--primary))" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2">Kâr Tahmini</p>
              <MiniBarChart values={karValues} color="hsl(var(--success))" />
            </div>
          </div>
        </section>

        {/* Section list */}
        <section>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            Detay Bölümler
          </p>
          <div className="flex flex-col gap-2">
            <SectionCard icon={ShoppingBag} title="Satış Analizi"   detail="Kanal ve kategori bazlı satış dağılımı" comingSoon />
            <SectionCard icon={Package}     title="Stok Özeti"      detail="Fire, devir ve kritik ürün raporu"     comingSoon />
            <SectionCard icon={Users}       title="Personel Özeti"  detail="Ciro katkısı ve iptal karşılaştırması" comingSoon />
          </div>
        </section>

      </div>
    </main>
  )
}
