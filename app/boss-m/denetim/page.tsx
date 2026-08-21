'use client'

import { useEffect, useState } from 'react'
import { BossMPageHeader } from '@/components/boss/BossMPageHeader'
import { BossMEmptyState } from '@/components/boss/BossMEmptyState'
import { BossMSkeletonList } from '@/components/boss/BossMSkeleton'
import type { AlertFilter, AuditAlert } from '@/lib/boss-mock'
import { loadDenetimDashboard } from '@/lib/boss-p0-data'
import {
  DENETIM_FILTERS,
  mapNotificationToAuditAlert,
  type BossNotificationApiRow,
} from '@/lib/boss-notifications'
import { bossFetch } from '@/lib/boss-api'
import { invalidateBossCache } from '@/lib/boss-page-cache'
import { useBossLoad } from '@/hooks/use-boss-load'
import { cn } from '@/lib/utils'
import { AlertTriangle, AlertCircle, Radio, SearchX, CheckCheck } from 'lucide-react'

function severityCount(alerts: AuditAlert[], severity: AuditAlert['severity']) {
  return alerts.filter((a) => a.severity === severity).length
}

export default function BossMDenetimPage() {
  const [activeFilter, setActiveFilter] = useState<AlertFilter>('Tümü')
  const { data, setData, loading, reload, reloadSoft } = useBossLoad(
    loadDenetimDashboard,
    { alerts: [], nextCursor: null, source: 'mock' },
    { cacheKey: 'page:denetim', ttlMs: 20_000 },
  )
  const alerts = data.alerts
  const source = data.source
  const [loadingMore, setLoadingMore] = useState(false)

  // Sayfa öne gelince bayat veriyi arka planda yenile (poll yok — yalnızca görünürlük olayı)
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'visible') void reloadSoft()
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [reloadSoft])

  async function loadMore() {
    const cursor = data.nextCursor
    if (!cursor || loadingMore) return
    setLoadingMore(true)
    try {
      const res = await bossFetch<{
        items?: BossNotificationApiRow[]
        nextCursor?: string | null
      }>('/api/boss/notifications', { query: { limit: '50', cursor } })
      if (!res.ok) return
      const items = Array.isArray(res.data?.items) ? res.data!.items! : []
      const mapped = items.map((raw, i) => mapNotificationToAuditAlert(raw, alerts.length + i))
      setData({
        ...data,
        alerts: [...alerts, ...mapped],
        nextCursor: typeof res.data?.nextCursor === 'string' ? res.data.nextCursor : null,
      })
    } finally {
      setLoadingMore(false)
    }
  }

  async function markAllRead() {
    const unread = alerts.filter((a) => a.unread)
    if (!unread.length) return
    await bossFetch('/api/boss/notifications/read-all', { method: 'POST' })
    // Ana sayfa (api:boss-notifications:8) ve denetim (…:50) bildirim cache'leri
    invalidateBossCache('api:boss-notifications:')
    invalidateBossCache('page:denetim')
    setData({
      ...data,
      alerts: alerts.map((a) => ({ ...a, unread: false })),
    })
  }

  async function markOneRead(id: string) {
    const row = alerts.find((a) => a.id === id)
    if (!row?.unread) return
    await bossFetch(`/api/boss/notifications/${encodeURIComponent(id)}/read`, { method: 'POST' })
    // Ana sayfa (api:boss-notifications:8) ve denetim (…:50) bildirim cache'leri
    invalidateBossCache('api:boss-notifications:')
    invalidateBossCache('page:denetim')
    setData({
      ...data,
      alerts: alerts.map((a) => (a.id === id ? { ...a, unread: false } : a)),
    })
  }

  if (loading) {
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
  const unreadCount = alerts.filter((a) => a.unread).length

  return (
    <main className="flex flex-col gap-4 pb-4">
      <BossMPageHeader
        title="Denetim"
        trailing={
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => void markAllRead()}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-full border border-border bg-card text-[10px] font-semibold text-muted-foreground active:bg-surface-2"
              >
                <CheckCheck size={12} />
                Okundu
              </button>
            )}
            <button
              type="button"
              onClick={() => void reload()}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-danger/10 border border-danger/25 rounded-full"
            >
              <Radio size={10} className={cn('text-danger', source === 'api' && 'animate-pulse')} />
              <span className="text-[10px] font-semibold text-danger">
                {source === 'api' ? 'Canlı' : 'Bağlantı yok'}
              </span>
            </button>
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
        {DENETIM_FILTERS.map((f) => (
          <button
            key={f}
            type="button"
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
          title={alerts.length === 0 ? 'Henüz kritik hareket yok' : 'Uyarı bulunamadı'}
          description={
            alerts.length === 0
              ? 'İptal, zayi, masa birleştirme, ödeme iptali ve Z rapor burada görünür.'
              : 'Bu filtreye göre kayıt yok.'
          }
        />
      ) : (
        <div className="flex flex-col gap-2 px-4">
          {filtered.map((alert) => (
            <button
              key={alert.id}
              type="button"
              onClick={() => void markOneRead(alert.id)}
              className={cn(
                'bg-card border rounded-2xl px-4 py-4 flex flex-col gap-2 text-left',
                alert.severity === 'kritik' ? 'border-danger/30' : 'border-warning/25',
                alert.unread && 'ring-1 ring-primary/30',
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide shrink-0',
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
                  <span className="text-sm font-semibold text-foreground truncate">
                    {alert.title}
                  </span>
                  {alert.unread && (
                    <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  )}
                </div>
                <span className="text-xs text-muted-foreground shrink-0">{alert.time}</span>
              </div>

              {alert.summary ? (
                <p className="text-xs text-muted-foreground leading-relaxed">{alert.summary}</p>
              ) : null}

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
            </button>
          ))}

          {data.nextCursor && (
            <button
              type="button"
              onClick={() => void loadMore()}
              disabled={loadingMore}
              className="mt-1 px-4 py-3 rounded-2xl border border-border bg-card text-xs font-semibold text-muted-foreground active:bg-surface-2 disabled:opacity-60"
            >
              {loadingMore ? 'Yükleniyor…' : 'Daha fazla'}
            </button>
          )}
        </div>
      )}
    </main>
  )
}
