'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Coins, RefreshCw, ShoppingCart, Sparkles, Wallet } from 'lucide-react'
import { BossMPageHeader } from '@/components/boss/BossMPageHeader'
import { bossFetch, formatMoneyTR } from '@/lib/boss-api'
import { postToNative, readNativeSession } from '@/lib/boss-bridge'
import { cn } from '@/lib/utils'

type TokenPackage = { millions: number; tokens: number; priceTry: number }

type SummaryData = {
  balanceTokens: number
  purchaseAvailable: boolean
  pricePerMillionTokensTry: number
  packages: TokenPackage[]
  recentOrders: Array<{
    id: string
    status: string
    tokenAmount: number | null
    chargeAmountTry: number
    source: string | null
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

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  fulfilled: { label: 'Tamamlandı', cls: 'bg-success/10 text-success border-success/20' },
  paid: { label: 'Ödendi', cls: 'bg-primary/10 text-primary border-primary/20' },
  failed: { label: 'Başarısız', cls: 'bg-destructive/10 text-destructive border-destructive/20' },
  pending: { label: 'Bekliyor', cls: 'bg-warning/10 text-warning border-warning/30' },
}

export default function BossMaiTokenlarPage() {
  const [data, setData] = useState<SummaryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)
  const [busyPackage, setBusyPackage] = useState<number | null>(null)
  const lastFetchAt = useRef(0)

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

  async function buyPackage(pkg: TokenPackage) {
    setBusyPackage(pkg.millions)
    setFlash(null)
    setError(null)
    try {
      const res = await bossFetch<{ payUrl?: string }>('/api/ai-tokens/purchase', {
        method: 'POST',
        body: JSON.stringify({ packageMillions: pkg.millions, source: 'boss_app' }),
      })
      const payUrl = res.data?.payUrl
      if (!res.ok || !payUrl) {
        setError(res.error || 'Ödeme başlatılamadı.')
        return
      }
      if (readNativeSession()) {
        postToNative({ type: 'openExternal', url: payUrl })
      } else {
        window.open(payUrl, '_blank', 'noopener')
      }
      setFlash('Ödeme sayfası açıldı. Ödeme sonrası bakiyeniz otomatik güncellenir.')
    } finally {
      setBusyPackage(null)
    }
  }

  const depleted = (data?.balanceTokens ?? 1) <= 0

  return (
    <main className="flex flex-col h-full bg-transparent overflow-hidden">
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

      <div className="flex-1 overflow-y-auto overscroll-none px-4 pb-8">
        {loading ? (
          <div className="flex flex-col gap-3 animate-pulse">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-28 bg-surface-2 rounded-2xl" />
            ))}
          </div>
        ) : (
          <>
            {flash ? (
              <p className="mb-3 rounded-xl border border-success/20 bg-success/10 px-3 py-2 text-xs text-success" role="status">
                {flash}
              </p>
            ) : null}
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
              {depleted ? (
                <p className="mt-3 pt-3 border-t border-destructive/20 text-[11px] text-destructive leading-relaxed">
                  Token bakiyeniz tükendi. AI özelliklerini kullanmaya devam etmek için token yükleyin.
                </p>
              ) : null}
            </div>

            {/* Paketler */}
            <div className="flex items-center gap-2 mb-2">
              <Coins size={14} className="text-primary" />
              <p className="text-sm font-semibold text-foreground">Token paketleri</p>
            </div>
            {!data?.purchaseAvailable ? (
              <p className="text-xs text-muted-foreground mb-4">Token satın alma şu anda kapalı.</p>
            ) : (
              <div className="flex flex-col gap-2 mb-6">
                {data.packages.map((pkg) => (
                  <div
                    key={pkg.millions}
                    className="bg-card border border-border rounded-2xl px-4 py-3 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Sparkles size={14} className="text-primary shrink-0" />
                      <span className="text-sm font-medium text-foreground tabular-nums truncate">
                        {formatTokens(pkg.tokens)} token
                      </span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-sm font-semibold text-foreground tabular-nums">
                        {formatMoneyTR(pkg.priceTry)} TL
                      </span>
                      <button
                        type="button"
                        disabled={busyPackage != null}
                        onClick={() => void buyPackage(pkg)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary/10 border border-primary/30 text-xs font-semibold text-primary active:bg-primary/20 transition-colors disabled:opacity-50"
                      >
                        <ShoppingCart size={13} />
                        {busyPackage === pkg.millions ? '…' : 'Satın al'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Geçmiş */}
            <p className="text-sm font-semibold text-foreground mb-2">Satın alma geçmişi</p>
            {!data || data.recentOrders.length === 0 ? (
              <p className="text-xs text-muted-foreground">Henüz token yüklemesi yok.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {data.recentOrders.map((o) => {
                  const st = STATUS_LABEL[o.status] ?? STATUS_LABEL.pending
                  return (
                    <div
                      key={o.id}
                      className="bg-card border border-border rounded-2xl px-4 py-3 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground tabular-nums">
                          {o.tokenAmount != null ? `${formatTokens(o.tokenAmount)} token` : '—'}
                        </p>
                        <p className="text-[11px] text-muted-foreground">{formatDate(o.paidAt ?? o.createdAt)}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-sm font-semibold text-foreground tabular-nums">
                          {formatMoneyTR(o.chargeAmountTry)} TL
                        </span>
                        <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full border', st.cls)}>
                          {st.label}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}
