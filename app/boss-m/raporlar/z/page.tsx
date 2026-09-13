'use client'

import { useState } from 'react'
import Link from 'next/link'
import { X, Printer, CreditCard, Banknote, Receipt, AlertTriangle } from 'lucide-react'
import { BossMPageHeader } from '@/components/boss/BossMPageHeader'
import type { ZReport } from '@/lib/boss-mock'
import { useBossLoad } from '@/hooks/use-boss-load'
import { loadZReportsPage } from '@/lib/boss-page-data'
import { formatMoneyTR } from '@/lib/boss-money'
import { cn } from '@/lib/utils'

// ── Detail panel ──────────────────────────────────────────────────────────────
function ZDetailPanel({ report, onClose }: { report: ZReport; onClose: () => void }) {
  const rows: { label: string; value: string; icon: React.ElementType; accent?: string }[] = [
    { label: 'Z Raporu No',     value: report.zNo,            icon: Receipt },
    { label: 'Terminal',        value: report.terminal,       icon: Printer },
    { label: 'Toplam Ciro',     value: report.total,          icon: Receipt,    accent: 'text-success' },
    { label: 'Nakit',           value: report.nakit,          icon: Banknote },
    { label: 'Kart',            value: report.kart,           icon: CreditCard },
    { label: 'Fiş Sayısı',      value: `${report.receiptCount} adet`, icon: Receipt },
    { label: 'İptal Tutarı',    value: report.cancelTotal,    icon: AlertTriangle, accent: 'text-danger' },
    { label: 'Kasa sayım farkı', value: `₺${formatMoneyTR(report.cashCountDifference, 2)}`, icon: AlertTriangle, accent: Math.abs(report.cashCountDifference) > 0.009 ? 'text-warning' : undefined },
    { label: 'Nakit vardiya farkı', value: `₺${formatMoneyTR(report.cashShiftVariance, 2)}`, icon: Banknote, accent: Math.abs(report.cashShiftVariance) > 0.009 ? 'text-warning' : undefined },
    { label: 'Kapanış Saati',   value: `${report.date} ${report.time}`, icon: Receipt },
  ]

  return (
    <div className="boss-over-native-nav flex flex-col bg-background">
      <BossMPageHeader
        title={report.zNo}
        showBack={false}
        trailing={
          <button
            onClick={onClose}
            className="flex items-center justify-center w-11 h-11 rounded-xl text-muted-foreground active:bg-surface-2"
          >
            <X size={18} />
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto overscroll-none px-4 boss-nested-scroll">
        {/* Terminal + date badge */}
        <div className="flex items-center gap-2 py-3 mb-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-2 border border-border text-xs text-muted-foreground">
            <Printer size={10} />
            {report.terminal}
          </span>
          <span className="text-xs text-muted-foreground">{report.date} • {report.time}</span>
        </div>

        {/* Detail rows */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border mb-4">
          {rows.map(({ label, value, icon: Icon, accent }) => (
            <div key={label} className="flex items-center gap-3 px-4 py-3.5">
              <Icon size={15} className="text-muted-foreground shrink-0" strokeWidth={1.6} />
              <span className="flex-1 text-sm text-muted-foreground">{label}</span>
              <span className={cn('text-sm font-semibold tabular-nums', accent ?? 'text-foreground')}>
                {value}
              </span>
            </div>
          ))}
        </div>

        {/* Read-only notice */}
        <div className="flex items-start gap-3 px-4 py-3.5 bg-surface-2 border border-border rounded-2xl">
          <AlertTriangle size={14} className="text-warning mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            Z raporu gün sonu kasa fişidir; salt okunur. Nakit teslimi ayrıdır (nakit vardiya). Puantaj işe giriş saatidir.
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function BossMZRaporlarPage() {
  const { data, loading } = useBossLoad(loadZReportsPage, {
    reports: [],
    source: 'mock',
  })
  const [selected, setSelected] = useState<ZReport | null>(null)
  const list = data.reports

  // Group by date
  const grouped = list.reduce<Record<string, ZReport[]>>((acc, r) => {
    if (!acc[r.date]) acc[r.date] = []
    acc[r.date].push(r)
    return acc
  }, {})

  return (
    <main className="flex min-h-0 flex-1 flex-col bg-transparent">
      {selected && <ZDetailPanel report={selected} onClose={() => setSelected(null)} />}

      <BossMPageHeader title="Z Raporları" showBack />

      <div className="flex-1 overflow-y-auto overscroll-none px-4 boss-nested-scroll">
        <p className="text-xs text-muted-foreground leading-relaxed mb-4">
          Gün sonu kasa fişi. Nakit teslimi için{' '}
          <Link href="/boss-m/raporlar/vardiya" className="text-foreground font-medium underline underline-offset-2">
            Nakit vardiya
          </Link>
          ; işe giriş saati için{' '}
          <Link href="/boss-m/personel/puantaj" className="text-foreground font-medium underline underline-offset-2">
            Puantaj
          </Link>
          .
        </p>
        {loading && (
          <div className="space-y-2 animate-pulse mb-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-surface-2 rounded-2xl" />
            ))}
          </div>
        )}
        {!loading && list.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-10">Henüz Z raporu yok.</p>
        )}
        {Object.entries(grouped).map(([date, reports]) => (
          <section key={date} className="mb-5">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2 px-0.5">
              {date}
            </p>
            <div className="bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border">
              {reports.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setSelected(r)}
                  className="w-full flex items-center gap-3 px-4 py-4 text-left active:bg-surface-2 transition-colors"
                >
                  {/* Z badge */}
                  <div className="w-10 h-10 rounded-xl bg-surface-2 border border-border flex items-center justify-center shrink-0">
                    <span className="text-[11px] font-black text-primary">Z</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">{r.zNo}</p>
                      <span className="text-[10px] text-muted-foreground border border-border px-1.5 py-0.5 rounded-full">
                        {r.terminal}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-[10px] text-muted-foreground">{r.receiptCount} fiş</span>
                      {parseInt(r.cancelTotal.replace(/\D/g, ''), 10) > 0 && (
                        <span className="text-[10px] text-danger font-medium">{r.cancelTotal} iptal</span>
                      )}
                      {Math.abs(r.cashShiftVariance) > 0.009 && (
                        <span className="text-[10px] text-warning font-medium">
                          Vardiya {r.cashShiftVariance < 0 ? 'açığı' : 'fazlası'}
                        </span>
                      )}
                      <span className="text-[10px] text-muted-foreground">{r.time}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-foreground tabular-nums">{r.total}</p>
                  </div>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  )
}
