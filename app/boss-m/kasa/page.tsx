'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BossMPageHeader } from '@/components/boss/BossMPageHeader'
import { BossMEmptyState } from '@/components/boss/BossMEmptyState'
import { BossMSkeletonList } from '@/components/boss/BossMSkeleton'
import type { Account, LedgerEntry } from '@/lib/boss-mock'
import { loadKasaDashboard } from '@/lib/boss-p0-data'
import { onNativeSession } from '@/lib/boss-bridge'
import { cn } from '@/lib/utils'
import {
  Wallet,
  Building2,
  CreditCard,
  ArrowDownCircle,
  ArrowUpCircle,
  Receipt,
  ArrowLeftRight,
  Inbox,
} from 'lucide-react'

const accountIcons: Record<Account['type'], React.ElementType> = {
  cash: Wallet,
  bank: Building2,
  pos: CreditCard,
}

const ACTIONS = [
  { key: 'giris', label: 'Para Girişi', icon: ArrowDownCircle, color: 'text-success bg-success/10' },
  { key: 'cikis', label: 'Para Çıkışı', icon: ArrowUpCircle, color: 'text-danger  bg-danger/10' },
  { key: 'gider', label: 'Gider', icon: Receipt, color: 'text-warning bg-warning/10' },
  { key: 'transfer', label: 'Transfer', icon: ArrowLeftRight, color: 'text-info    bg-info/10' },
]

export default function BossMCashPage() {
  const router = useRouter()
  const [accounts, setAccounts] = useState<Account[] | null>(null)
  const [ledger, setLedger] = useState<LedgerEntry[]>([])
  const [selectedId, setSelectedId] = useState<string>('')
  const [source, setSource] = useState<'api' | 'mock'>('mock')

  useEffect(() => {
    let cancelled = false
    const reload = () => {
      loadKasaDashboard().then((d) => {
        if (cancelled) return
        setAccounts(d.accounts)
        setLedger(d.ledger)
        setSource(d.source)
        setSelectedId((prev) => prev || d.accounts[0]?.id || '')
      })
    }
    reload()
    const off = onNativeSession(() => reload())
    return () => {
      cancelled = true
      off()
    }
  }, [])

  if (!accounts) {
    return (
      <main className="flex flex-col gap-4 pb-4">
        <BossMPageHeader title="Kasa & Banka" />
        <BossMSkeletonList rows={4} />
      </main>
    )
  }

  const account = accounts.find((a) => a.id === selectedId) ?? accounts[0]
  const Icon = accountIcons[account.type]

  return (
    <main className="flex flex-col gap-4 pb-4">
      <BossMPageHeader
        title="Kasa & Banka"
        trailing={
          source === 'mock' ? (
            <span className="text-[10px] text-muted-foreground">örnek</span>
          ) : null
        }
      />

      <div className="flex gap-2 px-4 overflow-x-auto pb-0.5">
        {accounts.map((acc) => {
          const AccIcon = accountIcons[acc.type]
          return (
            <button
              key={acc.id}
              onClick={() => setSelectedId(acc.id)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-xl border whitespace-nowrap transition-colors text-sm font-medium',
                selectedId === acc.id
                  ? 'bg-primary/10 border-primary/40 text-primary'
                  : 'bg-card border-border text-muted-foreground',
              )}
            >
              <AccIcon size={14} strokeWidth={1.8} />
              {acc.name}
            </button>
          )
        })}
      </div>

      <div className="mx-4 bg-card border border-border rounded-2xl px-5 py-5">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-muted-foreground">Güncel Bakiye</span>
            <span className="text-3xl font-bold text-foreground tabular-nums leading-tight">
              {account.currency}
              {account.balance}
            </span>
            <span className="text-xs text-muted-foreground mt-1">{account.name}</span>
          </div>
          <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-surface-2 text-primary">
            <Icon size={22} strokeWidth={1.6} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 px-4">
        {ACTIONS.map((a) => {
          const AIcon = a.icon
          return (
            <button
              key={a.key}
              onClick={() => router.push('/boss-m/kasa/hareket')}
              className="flex flex-col items-center gap-1.5 py-3 bg-card border border-border rounded-xl active:scale-[0.96] transition-transform"
            >
              <div className={cn('flex items-center justify-center w-9 h-9 rounded-lg', a.color)}>
                <AIcon size={16} strokeWidth={1.8} />
              </div>
              <span className="text-[10px] font-medium text-muted-foreground text-center leading-tight px-1">
                {a.label}
              </span>
            </button>
          )
        })}
      </div>

      <div className="px-4 flex items-center gap-2">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Hareketler
        </span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {ledger.length === 0 ? (
        <BossMEmptyState
          icon={Inbox}
          title="Hareket bulunamadı"
          description="Bu hesap için henüz kayıt yok."
        />
      ) : (
        <div className="mx-4 bg-card border border-border rounded-2xl overflow-hidden">
          <div className="flex flex-col divide-y divide-border">
            {ledger.map((entry) => (
              <div key={entry.id} className="flex items-center gap-3 px-4 py-3.5">
                <div
                  className={cn(
                    'w-1.5 h-1.5 rounded-full shrink-0 mt-0.5',
                    entry.sign === 'positive' ? 'bg-success' : 'bg-danger',
                  )}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground leading-tight truncate">
                    {entry.description}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-muted-foreground">{entry.datetime}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-surface-2 text-muted-foreground">
                      {entry.category}
                    </span>
                  </div>
                </div>
                <span
                  className={cn(
                    'text-sm font-bold tabular-nums shrink-0',
                    entry.sign === 'positive' ? 'text-success' : 'text-danger',
                  )}
                >
                  {entry.amount}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  )
}
