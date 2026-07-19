'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, Signal } from 'lucide-react'
import { BossMPageHeader } from '@/components/boss/BossMPageHeader'
import { SERVICE_CHANNELS } from '@/lib/boss-mock'
import type { ServiceChannel } from '@/lib/boss-mock'
import { useBossLoad } from '@/hooks/use-boss-load'
import { loadKanallarPage, patchServiceChannelEnabled } from '@/lib/boss-page-data'
import { BossMSwitch } from '@/components/boss/BossMSwitch'
import { cn } from '@/lib/utils'

// ── Channel row ────────────────────────────────────────────────────────────────

function ChannelRow({
  channel,
  onToggle,
}: {
  channel: ServiceChannel
  onToggle: (id: string, v: boolean) => void
}) {
  return (
    <div className="flex items-center gap-4 px-4 py-4">
      {/* Status dot */}
      <div
        className={cn(
          'w-2 h-2 rounded-full shrink-0',
          channel.enabled ? 'bg-success' : 'bg-muted-foreground/30'
        )}
      />

      {/* Label */}
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-semibold leading-tight', channel.enabled ? 'text-foreground' : 'text-muted-foreground')}>
          {channel.label}
        </p>
        <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
          {channel.description}
        </p>
      </div>

      {/* Toggle */}
      <BossMToggle
        enabled={channel.enabled}
        onChange={(v) => onToggle(channel.id, v)}
        accent={channel.enabled ? 'bg-primary' : 'bg-surface-3'}
      />
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function BossMKanallarPage() {
  const { data } = useBossLoad(loadKanallarPage, {
    channels: SERVICE_CHANNELS,
    source: 'mock',
  })
  const [channels, setChannels] = useState<ServiceChannel[]>(SERVICE_CHANNELS)
  const [baseline, setBaseline] = useState<ServiceChannel[]>(SERVICE_CHANNELS)
  const [changed, setChanged]   = useState<Set<string>>(new Set())

  useEffect(() => {
    setChannels(data.channels)
    setBaseline(data.channels)
    setChanged(new Set())
  }, [data.channels])

  function handleToggle(id: string, value: boolean) {
    setChannels((prev) =>
      prev.map((c) => (c.id === id ? { ...c, enabled: value } : c))
    )
    void patchServiceChannelEnabled(id, value)
    setChanged((prev) => {
      const next = new Set(prev)
      const original = baseline.find((c) => c.id === id)
      if (original && original.enabled !== value) {
        next.add(id)
      } else {
        next.delete(id)
      }
      return next
    })
  }

  const activeCount = channels.filter((c) => c.enabled).length

  return (
    <main className="flex flex-col pb-4">
      <BossMPageHeader title="Servis Kanalları" showBack />

      {/* ── Summary strip ── */}
      <div className="mx-4 mb-4 bg-card border border-border rounded-2xl px-4 py-3 flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary/10">
          <Signal size={18} strokeWidth={1.6} className="text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">
            {activeCount} kanal aktif
          </p>
          <p className="text-[11px] text-muted-foreground">
            {channels.length - activeCount} kanal pasif
          </p>
        </div>
        {changed.size > 0 && (
          <span className="text-[10px] px-2 py-1 rounded-full bg-warning/15 text-warning font-semibold">
            {changed.size} değişiklik
          </span>
        )}
      </div>

      {/* ── Warning banner ── */}
      <div className="mx-4 mb-4 flex items-start gap-3 bg-warning/8 border border-warning/25 rounded-xl px-4 py-3">
        <AlertTriangle size={16} strokeWidth={1.8} className="text-warning shrink-0 mt-0.5" />
        <p className="text-xs text-warning leading-relaxed">
          Değişiklik anlık yansır — aktif siparişler etkilenmez.
        </p>
      </div>

      {/* ── Channel list ── */}
      <div className="mx-4 bg-card border border-border rounded-2xl overflow-hidden">
        <div className="flex flex-col divide-y divide-border">
          {channels.map((ch) => (
            <ChannelRow key={ch.id} channel={ch} onToggle={handleToggle} />
          ))}
        </div>
      </div>

      {/* ── Footer note ── */}
      <p className="text-center text-[11px] text-muted-foreground/40 mt-5 px-4">
        Kanal değişiklikleri tüm terminallere eş zamanlı iletilir.
      </p>
    </main>
  )
}
