'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Bell,
  Signal,
  CreditCard,
  LayoutGrid,
  Flame,
  MonitorSmartphone,
  ChevronRight,
  Type,
  Palette,
} from 'lucide-react'
import { BossMPageHeader } from '@/components/boss/BossMPageHeader'
import { BossMSwitch } from '@/components/boss/BossMSwitch'
import { SISTEM_CARDS } from '@/lib/boss-mock'
import { useBossLoad } from '@/hooks/use-boss-load'
import { loadSistemHub } from '@/lib/boss-page-data'
import { bossFetch } from '@/lib/boss-api'
import {
  onNativeNotifications,
  requestBossNotificationsEnabled,
  setBossNotificationsEnabled,
} from '@/lib/boss-bridge'

const ICON_MAP: Record<string, React.ElementType> = {
  type: Type,
  palette: Palette,
  signal: Signal,
  'credit-card': CreditCard,
  layout: LayoutGrid,
  flame: Flame,
  remote: MonitorSmartphone,
}

const ACCENT_CYCLE = [
  'text-primary   bg-primary/10',
  'text-info      bg-info/10',
  'text-warning   bg-warning/10',
  'text-danger    bg-danger/10',
  'text-success   bg-success/10',
]

export default function BossMSistemPage() {
  const { data, loading } = useBossLoad(
    loadSistemHub,
    {
      cards: SISTEM_CARDS,
      source: 'mock',
    },
    { cacheKey: 'page:sistem-shell', ttlMs: 600_000, persist: true },
  )

  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [notificationsBusy, setNotificationsBusy] = useState(false)

  const loadPrefs = useCallback(async () => {
    const res = await bossFetch<{ enabled?: boolean }>('/api/boss/devices/notification-prefs')
    if (res.ok && res.data && typeof res.data === 'object') {
      setNotificationsEnabled(Boolean((res.data as { enabled?: boolean }).enabled))
    }
  }, [])

  useEffect(() => {
    void loadPrefs()
    requestBossNotificationsEnabled()
    return onNativeNotifications((enabled) => {
      setNotificationsEnabled(enabled)
    })
  }, [loadPrefs])

  const onToggleNotifications = async (next: boolean) => {
    if (notificationsBusy) return
    setNotificationsBusy(true)
    setNotificationsEnabled(next)
    try {
      const res = await bossFetch<{ enabled?: boolean }>('/api/boss/devices/notification-prefs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: next }),
      })
      if (!res.ok) {
        setNotificationsEnabled(!next)
        return
      }
      setBossNotificationsEnabled(next)
    } catch {
      setNotificationsEnabled(!next)
    } finally {
      setNotificationsBusy(false)
    }
  }

  return (
    <main className="flex flex-col gap-0 pb-4">
      <BossMPageHeader title="Sistem Ayarları" showBack />

      <div className="mx-4 mb-3 flex items-center gap-4 rounded-2xl border border-border bg-card px-4 py-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Bell size={22} strokeWidth={1.6} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground leading-tight">Bildirimler</p>
        </div>
        <BossMSwitch
          checked={notificationsEnabled}
          onChange={(v) => void onToggleNotifications(v)}
          aria-label="Bildirimler"
          className={notificationsBusy ? 'opacity-60' : undefined}
        />
      </div>

      <div className="flex flex-col gap-2 px-4">
        {loading ? (
          <div className="flex flex-col gap-2 animate-pulse">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="h-20 bg-surface-2 rounded-2xl" />
            ))}
          </div>
        ) : (
          data.cards.map((card, idx) => {
            const Icon = ICON_MAP[card.icon] ?? Signal
            const accent = ACCENT_CYCLE[idx % ACCENT_CYCLE.length]

            return (
              <Link
                key={card.id}
                href={card.href}
                className="flex items-center gap-4 bg-card border border-border rounded-2xl px-4 py-4 active:scale-[0.98] transition-transform"
              >
                <div
                  className={`flex items-center justify-center w-12 h-12 rounded-xl shrink-0 ${accent}`}
                >
                  <Icon size={22} strokeWidth={1.6} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground leading-tight">
                      {card.title}
                    </p>
                    {card.badge && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-surface-2 text-muted-foreground font-medium shrink-0">
                        {card.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                    {card.description}
                  </p>
                </div>

                <ChevronRight size={16} className="text-muted-foreground shrink-0" />
              </Link>
            )
          })
        )}
      </div>

      <p className="text-center text-[11px] text-muted-foreground/40 mt-6 px-4">
        RestroidBOSS v2.4.1
      </p>
    </main>
  )
}
