'use client'

import { useEffect, useState } from 'react'
import { BossMPageHeader } from '@/components/boss/BossMPageHeader'
import { BossMEmptyState } from '@/components/boss/BossMEmptyState'
import { BossMSkeletonList } from '@/components/boss/BossMSkeleton'
import type { AlertFilter, AuditAlert } from '@/lib/boss-mock'
import { loadDenetimDashboard } from '@/lib/boss-p0-data'
import { onNativeSession } from '@/lib/boss-bridge'
import { cn } from '@/lib/utils'
import { AlertTriangle, AlertCircle, Radio, SearchX } from 'lucide-react'

const FILTERS: AlertFilter[] = ['Tümü', 'İptal', 'Silme', 'Ödemesiz']

function severityCount(alerts: AuditAlert[], severity: AuditAlert['severity']) {
  return alerts.filter((a) => a.severity === severity).length
}

export default function BossMDenetimPage() {
  const [activeFilter, setActiveFilter] = useState<AlertFilter>('Tümü')
  const [alerts, setAlerts] = useState<AuditAlert[] | null>(null)
  const [source, setSource] = useState<'api' | 'mock'>('mock')

  useEffect(() => {
    let cancelled = false
    const reload = () => {
      loadDenetimDashboard().then((d) => {
        if (!cancelled) {
          setAlerts(d.alerts)
          setSource(d.source)
        }
      })
    }
    reload()
    const off = onNativeSession(() => reload())
    return () => {
      cancelled = true
      off()
    }
  }, [])

  if (!alerts) {
    return (
      <main className="flex flex-col gap-4 pb-4">
        <BossMPageHeader title="Denetim" />
        <BossMSkeletonList rows={5} />
      </main>
    )
  }

  const filtered =
    activeFilter === 'Tümü' ? alerts : alerts.filter((a) => a.category === activeFilter)
  const kritikCount = severityCount(alerts, 'kritik')

  return (
    <main className="flex flex-col gap-4 pb-4">
      <BossMPageHeader
        title="Denetim"
        trailing={
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-danger/10 border border-danger/25 rounded-full">
            <Radio size={10} className="text-danger animate-pulse" />
            <span className="text-[10px] font-semibold text-danger">
              {source === 'api' ? 'Canlı' : 'Örnek'}
            </span>
          </div>
        }
      />

      <div className="flex gap-2 px-4">
        <div className="flex items-center gap-1.5 px-3 py-2 bg-danger/10 border border-danger/25 rounded-xl">
          <AlertCircle size={13} className="text-danger" />
          <span className="text-xs font-semibold text-danger">{kritikCount} Kritik</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-2 bg-warning/10 border border-warning/25 rounded-xl">
          <AlertTriangle size={13} className="text-warning" />
          <span className="text-xs font-semibold text-warning">
            {severityCount(alerts, 'uyari')} Uyarı
          </span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-2 bg-surface-2 border border-border rounded-xl ml-auto">
          <span className="text-xs text-muted-foreground tabular-nums">{alerts.length} toplam</span>
        </div>
      </div>

      <div className="flex gap-2 px-4 overflow-x-auto pb-0.5">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={cn(
              'px-3 py-2 rounded-xl border text-xs font-medium whitespace-nowrap transition-colors',
              activeFilter === f
                ? 'bg-primary/10 border-primary/40 text-primary'
                : 'bg-card border-border text-muted-foreground',
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <BossMEmptyState
          icon={SearchX}
          title="Uyarı bulunamadı"
          description="Bu filtreye göre kayıt yok."
        />
      ) : (
        <div className="flex flex-col gap-2 px-4">
          {filtered.map((alert) => (
            <div
              key={alert.id}
              className={cn(
                'bg-card border rounded-2xl px-4 py-4 flex flex-col gap-2',
                alert.severity === 'kritik' ? 'border-danger/30' : 'border-warning/25',
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide',
                      alert.severity === 'kritik'
                        ? 'bg-danger/15 text-danger'
                        : 'bg-warning/15 text-warning',
                    )}
                  >
                    {alert.severity === 'kritik' ? (
                      <AlertCircle size={9} />
                    ) : (
                      <AlertTriangle size={9} />
                    )}
                    {alert.severity}
                  </span>
                  <span className="text-sm font-semibold text-foreground">{alert.title}</span>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">{alert.time}</span>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    Personel
                  </span>
                  <span className="text-xs font-medium text-foreground">{alert.who}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    Hedef
                  </span>
                  <span className="text-xs font-medium text-foreground">{alert.target}</span>
                </div>
                <div className="flex flex-col gap-0.5 ml-auto items-end">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    Tutar
                  </span>
                  <span
                    className={cn(
                      'text-sm font-bold tabular-nums',
                      alert.severity === 'kritik' ? 'text-danger' : 'text-warning',
                    )}
                  >
                    {alert.amount}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
