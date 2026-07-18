'use client'

import Link from 'next/link'
import { MonitorSmartphone, Signal, EyeOff, ChevronRight } from 'lucide-react'
import { BossMPageHeader } from '@/components/boss/BossMPageHeader'
import { useBossLoad } from '@/hooks/use-boss-load'
import { loadUzaktanPage } from '@/lib/boss-page-data'
import { cn } from '@/lib/utils'

const SHORTCUTS = [
  { href: '/boss-m/sistem/kanallar', label: 'Servis kanalları', icon: Signal },
  { href: '/boss-m/menu', label: 'Menü / 86', icon: EyeOff },
]

export default function BossMUzaktanPage() {
  const { data, loading } = useBossLoad(loadUzaktanPage, {
    bridgeOnline: false,
    bridgeLabel: '…',
    detail: '',
    source: 'mock',
  })

  return (
    <main className="flex flex-col gap-4 pb-4">
      <BossMPageHeader title="Uzaktan Kontrol" showBack />

      <div
        className={cn(
          'mx-4 rounded-2xl border px-4 py-4 flex items-center gap-3',
          data.bridgeOnline
            ? 'bg-success/5 border-success/25'
            : 'bg-warning/5 border-warning/25',
        )}
      >
        <div
          className={cn(
            'w-11 h-11 rounded-xl flex items-center justify-center',
            data.bridgeOnline ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning',
          )}
        >
          <MonitorSmartphone size={20} strokeWidth={1.6} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">
            {loading ? 'Durum yükleniyor…' : data.bridgeLabel}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{data.detail}</p>
        </div>
        <div
          className={cn(
            'w-2.5 h-2.5 rounded-full shrink-0',
            data.bridgeOnline ? 'bg-success' : 'bg-warning',
          )}
        />
      </div>

      <div className="mx-4 bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border">
        {SHORTCUTS.map((s) => {
          const Icon = s.icon
          return (
            <Link
              key={s.href}
              href={s.href}
              className="flex items-center gap-3 px-4 py-3.5 active:bg-surface-2"
            >
              <Icon size={18} className="text-primary shrink-0" strokeWidth={1.6} />
              <span className="flex-1 text-sm font-medium text-foreground">{s.label}</span>
              <ChevronRight size={14} className="text-muted-foreground" />
            </Link>
          )
        })}
      </div>
    </main>
  )
}
