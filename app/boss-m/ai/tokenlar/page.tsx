'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { RefreshCw, Wallet } from 'lucide-react'
import { BossMPageHeader } from '@/components/boss/BossMPageHeader'
import { bossFetch } from '@/lib/boss-api'
import { useNativeIos } from '@/hooks/use-native-ios'
import { cn } from '@/lib/utils'

/**
 * AI token bakiyesi — yalnız görüntüleme.
 * Boss uygulamasında token SATILMAZ (App Store 3.1.1): paket, fiyat, satın alma düğmesi yok.
 * Yükleme işletme panelinden (cloud) yapılır; iOS uygulamasında buna yönlendiren metin de gösterilmez
 * (3.1.3: uygulama dışı satın almaya çağrı yasak).
 */
type SummaryData = {
  balanceTokens: number
  recentOrders: Array<{
    id: string
    status: string
    tokenAmount: number | null
    paidAt: string | null
    createdAt: string
  }>
}

function formatTokens(n: number): string {
  return new Intl.NumberFormat('tr-TR').format(Math.trunc(n))
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  const pad = (x: number) => String(x).padStart(2, '0')
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function BossMaiTokenlarPage() {
  const [data, setData] = useState<SummaryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const lastFetchAt = useRef(0)
  const ios = useNativeIos()

  const load = useCallback(async (force = false) => {
    const now = Date.now()
    if (!force && now - lastFetchAt.current < 10_000) return
    lastFetchAt.current = now
    const res = await bossFetch<SummaryData>('/api/ai-tokens/summary')
    if (res.ok && res.data) {
      setData(res.data)
      setError(null)
    } else if (!res.ok && res.error) {
      setError(res.error)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    void load(true)
    const onVisible = () => {
      if (document.visibilityState === 'visible') void load()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [load])

  const depleted = (data?.balanceTokens ?? 1) <= 0
  // Yalnız tamamlanan yüklemeler: yarım kalmış ödeme denemeleri ve tutarlar burada gösterilmez.
  const loads = (data?.recentOrders ?? []).filter((o) => o.status === 'fulfilled' || o.status === 'paid')

  return (
    <main className="flex min-h-0 flex-1 flex-col overflow-hidden bg-transparent">
      <BossMPageHeader
        title="AI Token"
        showBack
        trailing={
          <button
            type="button"
            onClick={() => void load(true)}
            className="flex items-center justify-center h-11 w-11 rounded-xl text-primary active:bg-primary/10 transition-colors"
            aria-label="Yenile"
          >
            <RefreshCw size={16} strokeWidth={1.8} />
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto overscroll-none px-4 boss-nested-scroll">
        {loading ? (
          <div className="flex flex-col gap-3 animate-pulse">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-28 bg-surface-2 rounded-2xl" />
            ))}
          </div>
        ) : (
          <>
            {error ? (
              <p className="mb-3 rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs text-destructive" role="alert">
                {error}
              </p>
            ) : null}

            {/* Bakiye kartı */}
            <div className="bg-card border border-border rounded-2xl px-4 py-4 mb-4">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                    depleted ? 'bg-destructive/10' : 'bg-primary/10',
                  )}
                >
                  <Wallet size={18} className={depleted ? 'text-destructive' : 'text-primary'} strokeWidth={1.6} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">Token bakiyesi</p>
                  <p
                    className={cn(
                      'text-2xl font-semibold tabular-nums',
                      depleted ? 'text-destructive' : 'text-foreground',
                    )}
                  >
                    {data ? formatTokens(data.balanceTokens) : '—'}{' '}
                    <span className="text-xs font-medium text-muted-foreground">token</span>
                  </p>
                </div>
              </div>
              <p className="mt-3 pt-3 border-t border-border text-[11px] text-muted-foreground leading-relaxed">
                {depleted ? 'Token bakiyeniz tükendi. ' : ''}
                Cihaz sesi token harcamaz.
                {ios ? '' : ' Token yükleme işletme panelinden yapılır.'}
              </p>
            </div>

            {/* Geçmiş */}
            <p className="text-sm font-semibold text-foreground mb-2">Yükleme geçmişi</p>
            {loads.length === 0 ? (
              <p className="text-xs text-muted-foreground">Henüz token yüklemesi yok.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {loads.map((o) => (
                  <div
                    key={o.id}
                    className="bg-card border border-border rounded-2xl px-4 py-3 flex items-center justify-between gap-3"
                  >
                    <p className="text-sm font-medium text-foreground tabular-nums">
                      {o.tokenAmount != null ? `${formatTokens(o.tokenAmount)} token` : '—'}
                    </p>
                    <p className="text-[11px] text-muted-foreground shrink-0">{formatDate(o.paidAt ?? o.createdAt)}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}
