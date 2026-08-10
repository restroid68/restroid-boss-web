'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import { bossFetch } from '@/lib/boss-api'
import { cn } from '@/lib/utils'

/** Kompakt token gösterimi: 1.250.000 → 1,25M */
export function formatBossAiTokenCompact(tokens: number): string {
  const abs = Math.abs(tokens)
  if (abs >= 1_000_000) {
    return `${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 }).format(tokens / 1_000_000)}M`
  }
  if (abs >= 1_000) {
    return `${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 1 }).format(tokens / 1_000)}K`
  }
  return new Intl.NumberFormat('tr-TR').format(Math.trunc(tokens))
}

const MIN_REFRESH_MS = 30_000

/** AI sayfası app bar token bakiye çipi — tıklanınca token yükleme sayfası. */
export function BossAiTokenChip({ className }: { className?: string }) {
  const [balance, setBalance] = useState<number | null>(null)
  const lastFetchAt = useRef(0)

  const load = useCallback(() => {
    const now = Date.now()
    if (now - lastFetchAt.current < MIN_REFRESH_MS) return
    lastFetchAt.current = now
    void bossFetch<{ balanceTokens?: number }>('/api/ai-tokens/summary').then((res) => {
      if (res.ok && typeof res.data?.balanceTokens === 'number') {
        setBalance(res.data.balanceTokens)
      }
    })
  }, [])

  useEffect(() => {
    load()
    const onVisible = () => {
      if (document.visibilityState === 'visible') load()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [load])

  if (balance == null) return null

  const depleted = balance <= 0

  return (
    <Link
      href="/boss-m/ai/tokenlar"
      aria-label="AI token bakiyesi"
      className={cn(
        'flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-[11px] font-semibold tabular-nums transition-colors',
        depleted
          ? 'border-destructive/25 bg-destructive/15 text-destructive'
          : 'border-primary/25 bg-primary/15 text-primary active:bg-primary/25',
        className,
      )}
    >
      <Sparkles size={12} strokeWidth={1.8} />
      {formatBossAiTokenCompact(balance)}
    </Link>
  )
}
