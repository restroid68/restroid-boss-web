'use client'

import { CheckCircle2, AlertTriangle, XCircle, Phone } from 'lucide-react'
import { BossMPageHeader } from '@/components/boss/BossMPageHeader'
import { LISANSLAR } from '@/lib/boss-mock'
import type { LisansStatus, Lisans } from '@/lib/boss-mock'
import { useBossLoad } from '@/hooks/use-boss-load'
import { loadLisanslarPage } from '@/lib/boss-page-data'
import { cn } from '@/lib/utils'

const STATUS_CONFIG: Record<LisansStatus, {
  label: string
  icon: React.ElementType
  iconColor: string
  badgeStyle: string
  cardBorder: string
}> = {
  aktif: {
    label:      'Aktif',
    icon:       CheckCircle2,
    iconColor:  'text-success',
    badgeStyle: 'bg-success/10 text-success border-success/20',
    cardBorder: 'border-border',
  },
  yaklasıyor: {
    label:      'Yaklaşıyor',
    icon:       AlertTriangle,
    iconColor:  'text-warning',
    badgeStyle: 'bg-warning/10 text-warning border-warning/30',
    cardBorder: 'border-warning/30',
  },
  yok: {
    label:      'Lisans Yok',
    icon:       XCircle,
    iconColor:  'text-muted-foreground',
    badgeStyle: 'bg-surface-2 text-muted-foreground border-border',
    cardBorder: 'border-border',
  },
}

function DaysLeft({ days, status }: { days: number | null; status: LisansStatus }) {
  if (days === null) return null
  const color = status === 'yaklasıyor' ? 'text-warning' : status === 'aktif' ? 'text-success' : 'text-muted-foreground'
  return (
    <span className={cn('text-[11px] font-semibold tabular-nums', color)}>
      {days} gün kaldı
    </span>
  )
}

function LisansCard({ lisans }: { lisans: Lisans }) {
  const cfg   = STATUS_CONFIG[lisans.status]
  const Icon  = cfg.icon

  return (
    <div className={cn('bg-card border rounded-2xl px-4 py-4', cfg.cardBorder)}>
      <div className="flex items-start gap-3">
        <div className={cn(
          'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
          lisans.status === 'aktif'      ? 'bg-success/10' :
          lisans.status === 'yaklasıyor' ? 'bg-warning/10' : 'bg-surface-2'
        )}>
          <Icon size={18} className={cfg.iconColor} strokeWidth={1.6} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-foreground">{lisans.name}</p>
            <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full border', cfg.badgeStyle)}>
              {cfg.label}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{lisans.description}</p>

          <div className="flex items-center gap-3 mt-2">
            {lisans.expiresAt ? (
              <span className="text-[11px] text-muted-foreground">
                Bitiş: <span className="text-foreground font-medium">{lisans.expiresAt}</span>
              </span>
            ) : (
              <span className="text-[11px] text-muted-foreground">Lisans aktif değil</span>
            )}
            <DaysLeft days={lisans.daysLeft} status={lisans.status} />
          </div>
        </div>
      </div>

      {lisans.status === 'yaklasıyor' && (
        <div className="mt-3 pt-3 border-t border-warning/20 flex items-center gap-2">
          <AlertTriangle size={12} className="text-warning shrink-0" />
          <p className="text-[11px] text-warning leading-relaxed">
            Lisans yakında sona eriyor. Yenileme için Restroid destek ekibini arayın.
          </p>
        </div>
      )}

      {lisans.status === 'yok' && (
        <div className="mt-3 pt-3 border-t border-border flex items-center gap-2">
          <Phone size={12} className="text-muted-foreground shrink-0" />
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Bu modül aktif değil. Lisans edinmek için Restroid ile iletişime geçin.
          </p>
        </div>
      )}
    </div>
  )
}

export default function BossMListanslarPage() {
  const { data, loading } = useBossLoad(loadLisanslarPage, {
    list: LISANSLAR,
    source: 'mock',
  })

  const sorted = [
    ...data.list.filter((l) => l.status === 'yaklasıyor'),
    ...data.list.filter((l) => l.status === 'aktif'),
    ...data.list.filter((l) => l.status === 'yok'),
  ]

  const expiring = data.list.filter((l) => l.status === 'yaklasıyor').length
  const missing  = data.list.filter((l) => l.status === 'yok').length

  return (
    <main className="flex flex-col min-h-0 bg-transparent">
      <BossMPageHeader title="Lisanslar" showBack />

      <div className="flex-1 overflow-y-auto overscroll-none px-4 pb-8">
        {loading ? (
          <div className="flex flex-col gap-3 animate-pulse">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 bg-surface-2 rounded-2xl" />
            ))}
          </div>
        ) : (
          <>
            {(expiring > 0 || missing > 0) && (
              <div className="flex gap-2 mb-4">
                {expiring > 0 && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-warning/10 border border-warning/30">
                    <AlertTriangle size={11} className="text-warning" />
                    <span className="text-[11px] font-semibold text-warning">{expiring} yaklaşıyor</span>
                  </div>
                )}
                {missing > 0 && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-surface-2 border border-border">
                    <XCircle size={11} className="text-muted-foreground" />
                    <span className="text-[11px] font-semibold text-muted-foreground">{missing} lisanssız</span>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col gap-3">
              {sorted.map((l) => (
                <LisansCard key={l.id} lisans={l} />
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  )
}
