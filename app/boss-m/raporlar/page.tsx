'use client'

import { useState } from 'react'
import Link from 'next/link'
import { BossMPageHeader } from '@/components/boss/BossMPageHeader'
import { REPORT_CARDS, PRODUCT_REPORT } from '@/lib/boss-mock'
import type { ReportPeriod } from '@/lib/boss-mock'
import { useBossLoad } from '@/hooks/use-boss-load'
import { loadRaporlarPage } from '@/lib/boss-page-data'
import { cn } from '@/lib/utils'
import {
  BarChart2,
  Users,
  GitBranch,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Minus,
  X,
} from 'lucide-react'

const iconMap: Record<string, React.ElementType> = {
  bar:    BarChart2,
  users:  Users,
  branch: GitBranch,
}

const PERIODS: ReportPeriod[] = ['Bugün', '7 Gün', '30 Gün']

function ProductReportList({ rows }: { rows: typeof PRODUCT_REPORT['Bugün'] }) {
  return (
    <div className="flex flex-col divide-y divide-border">
      {rows.map((row) => {
        const TIcon =
          row.trend === 'up'   ? TrendingUp   :
          row.trend === 'down' ? TrendingDown  : Minus

        const trendColor =
          row.trend === 'up'   ? 'text-success' :
          row.trend === 'down' ? 'text-danger'  : 'text-muted-foreground'

        return (
          <div key={row.rank} className="flex items-center gap-3 px-4 py-3.5">
            <span className="text-xs font-bold text-muted-foreground w-4 tabular-nums shrink-0">
              {row.rank}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{row.name}</p>
              <p className="text-xs text-muted-foreground">{row.qty} adet</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-sm font-bold text-foreground tabular-nums">{row.revenue}</span>
              <TIcon size={13} className={trendColor} strokeWidth={2} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function BossMRaporlarPage() {
  const { data, loading } = useBossLoad(loadRaporlarPage, {
    productByPeriod: PRODUCT_REPORT,
    source: 'mock',
  })
  const [openReport, setOpenReport] = useState<string | null>(null)
  const [period, setPeriod] = useState<ReportPeriod>('Bugün')

  const rows = data.productByPeriod[period]
  const hasApiData = data.source === 'api' && rows.length > 0

  return (
    <main className="flex flex-col gap-4 pb-4">
      <BossMPageHeader title="Raporlar" />

      <div className="flex flex-col gap-2 px-4">
        {REPORT_CARDS.map((card) => {
          const Icon = iconMap[card.icon] ?? BarChart2
          return (
            <button
              key={card.id}
              onClick={() => setOpenReport(card.id)}
              className="bg-card border border-border rounded-2xl px-4 py-4 flex items-center gap-4 text-left active:scale-[0.98] transition-transform"
            >
              <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-primary/10 text-primary shrink-0">
                <Icon size={20} strokeWidth={1.6} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{card.title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{card.purpose}</p>
              </div>
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-surface-2 text-muted-foreground shrink-0">
                <ChevronRight size={16} />
              </div>
            </button>
          )
        })}
      </div>

      {openReport === 'urun' && (
        <div className="mx-4 bg-card border border-border rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-border">
            <span className="text-sm font-semibold text-foreground">Ürün Satış Raporu</span>
            <button
              onClick={() => setOpenReport(null)}
              className="flex items-center justify-center w-9 h-9 rounded-xl text-muted-foreground bg-surface-2 active:bg-surface-3 transition-colors"
              aria-label="Kapat"
            >
              <X size={15} />
            </button>
          </div>

          <div className="flex gap-2 px-4 py-3">
            {PERIODS.map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  'flex-1 py-2 rounded-xl border text-xs font-medium transition-colors',
                  period === p
                    ? 'bg-primary/10 border-primary/40 text-primary'
                    : 'bg-surface-2 border-border text-muted-foreground'
                )}
              >
                {p}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="px-4 pb-4 space-y-3 animate-pulse">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-surface-2 rounded-xl" />
              ))}
            </div>
          ) : (
            <ProductReportList rows={rows} />
          )}
        </div>
      )}

      {openReport === 'personel' && (
        <div className="mx-4 bg-card border border-border rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-border">
            <span className="text-sm font-semibold text-foreground">Personel Performans</span>
            <button
              onClick={() => setOpenReport(null)}
              className="flex items-center justify-center w-9 h-9 rounded-xl text-muted-foreground bg-surface-2 active:bg-surface-3 transition-colors"
              aria-label="Kapat"
            >
              <X size={15} />
            </button>
          </div>
          {hasApiData ? (
            <div className="px-4 py-4 flex flex-col gap-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Detaylı personel performansı için personel ekranına gidin.
              </p>
              <Link
                href="/boss-m/personel"
                className="flex items-center justify-center gap-2 h-11 rounded-xl bg-primary/10 border border-primary/30 text-sm font-semibold text-primary active:bg-primary/20 transition-colors"
              >
                <Users size={16} />
                Personel listesini aç
              </Link>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 py-12 px-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-surface-2 flex items-center justify-center text-muted-foreground">
                <BarChart2 size={22} strokeWidth={1.5} />
              </div>
              <p className="text-sm font-medium text-foreground">Yakında</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Bu rapor şu an geliştirme aşamasındadır.
              </p>
            </div>
          )}
        </div>
      )}

      {openReport === 'sube' && (
        <div className="mx-4 bg-card border border-border rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-border">
            <span className="text-sm font-semibold text-foreground">Şube Karşılaştırma</span>
            <button
              onClick={() => setOpenReport(null)}
              className="flex items-center justify-center w-9 h-9 rounded-xl text-muted-foreground bg-surface-2 active:bg-surface-3 transition-colors"
              aria-label="Kapat"
            >
              <X size={15} />
            </button>
          </div>
          {hasApiData ? (
            <>
              <div className="px-4 py-3">
                <p className="text-[11px] text-muted-foreground">
                  Bugünkü satış verisi (ürün bazlı özet)
                </p>
              </div>
              <ProductReportList rows={data.productByPeriod['Bugün']} />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 py-12 px-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-surface-2 flex items-center justify-center text-muted-foreground">
                <BarChart2 size={22} strokeWidth={1.5} />
              </div>
              <p className="text-sm font-medium text-foreground">Yakında</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Bu rapor şu an geliştirme aşamasındadır.
              </p>
            </div>
          )}
        </div>
      )}
    </main>
  )
}
