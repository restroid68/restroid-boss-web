'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BossMPageHeader } from '@/components/boss/BossMPageHeader'
import { BossMEmptyState } from '@/components/boss/BossMEmptyState'
import { BossMSkeletonList } from '@/components/boss/BossMSkeleton'
import { BossMMoneyText } from '@/components/boss/BossMMoneyText'
import { BossMSearchCreate } from '@/components/boss/BossMSearchCreate'
import { ACCOUNTS, LEDGER_ENTRIES, type Account } from '@/lib/boss-mock'
import { loadKasaDashboard } from '@/lib/boss-p0-data'
import { createFinanceAccount } from '@/lib/boss-page-data'
import { useBossLoad } from '@/hooks/use-boss-load'
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
  Plus,
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
  const { data, loading, setData, reload } = useBossLoad(loadKasaDashboard, {
    accounts: ACCOUNTS,
    ledger: LEDGER_ENTRIES,
    source: 'mock',
  })
  const accounts = data.accounts
  const ledger = data.ledger
  const source = data.source
  const [selectedId, setSelectedId] = useState<string>('')
  const [showNewAccount, setShowNewAccount] = useState(false)
  const [addingAccount, setAddingAccount] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)

  useEffect(() => {
    setSelectedId((prev) => {
      if (prev && accounts.some((a) => a.id === prev)) return prev
      return accounts[0]?.id || ''
    })
  }, [accounts])

  async function handleAddAccount(name: string) {
    setAddingAccount(true)
    setAddError(null)
    const res = await createFinanceAccount({ name, type: 'cash' })
    setAddingAccount(false)
    if (!res.ok || !res.account) {
      setAddError(res.error || 'Hesap eklenemedi')
      return null
    }
    setData({
      accounts: [...accounts, res.account],
      ledger,
      source: 'api',
    })
    setSelectedId(res.account.id)
    setShowNewAccount(false)
    void reload()
    return { id: res.account.id, label: res.account.name }
  }

  if (loading) {
    return (
      <main className="flex flex-col gap-4 bg-transparent pb-4">
        <BossMPageHeader title="Kasa & Banka" />
        <BossMSkeletonList rows={4} />
      </main>
    )
  }

  const account = accounts.find((a) => a.id === selectedId) ?? accounts[0]
  if (!account) {
    return (
      <main className="flex flex-col gap-4 bg-transparent pb-4">
        <BossMPageHeader title="Kasa & Banka" />
        <BossMEmptyState
          icon={Inbox}
          title="Hesap bulunamadı"
          description="Kasa veya banka hesabı tanımlı değil."
        />
        <div className="space-y-2 px-4">
          <BossMSearchCreate
            items={[]}
            valueId=""
            placeholder={addingAccount ? 'Ekleniyor…' : 'Yeni hesap adı'}
            onSelect={() => {}}
            onCreate={handleAddAccount}
            createLabel="Hesap ekle"
            emptyHint="Ad yazıp Yeni ekle"
          />
          {addError ? (
            <p className="text-sm text-danger" role="alert">
              {addError}
            </p>
          ) : null}
        </div>
      </main>
    )
  }

  const Icon = account ? accountIcons[account.type] : Wallet

  return (
    <main className="flex flex-col gap-4 bg-transparent pb-4">
      <BossMPageHeader
        title="Kasa & Banka"
        trailing={
          source === 'mock' ? (
            <span className="text-[10px] text-muted-foreground">örnek</span>
          ) : null
        }
      />

      <div className="flex gap-2 overflow-x-auto px-4 pb-0.5">
        {accounts.map((acc) => {
          const AccIcon = accountIcons[acc.type]
          const active = selectedId === acc.id
          return (
            <button
              key={acc.id}
              type="button"
              onClick={() => setSelectedId(acc.id)}
              className={cn(
                'flex min-w-[8.5rem] shrink-0 flex-col gap-1 rounded-xl border px-3 py-2.5 text-left transition-colors',
                active
                  ? 'border-primary/40 bg-primary/10 text-primary'
                  : 'border-border bg-card text-muted-foreground',
              )}
            >
              <div className="flex items-center gap-1.5">
                <AccIcon size={14} strokeWidth={1.8} />
                <span className="truncate text-xs font-semibold">{acc.name}</span>
              </div>
              <BossMMoneyText
                amount={acc.balance}
                currency={acc.currency || '₺'}
                className="w-full justify-end text-[11px]"
                amountClassName={cn(
                  'font-medium',
                  active ? 'text-primary' : 'text-muted-foreground',
                )}
              />
            </button>
          )
        })}
        <button
          type="button"
          onClick={() => setShowNewAccount((v) => !v)}
          className="flex min-w-[5.5rem] shrink-0 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-primary/35 bg-primary/5 px-3 py-2.5 text-primary"
        >
          <Plus size={18} />
          <span className="text-[11px] font-semibold">Ekle</span>
        </button>
      </div>

      {showNewAccount ? (
        <div className="px-4">
          <BossMSearchCreate
            items={accounts.map((a) => ({ id: a.id, label: a.name }))}
            valueId=""
            placeholder={addingAccount ? 'Ekleniyor…' : 'Yeni hesap adı'}
            onSelect={(item) => {
              setSelectedId(item.id)
              setShowNewAccount(false)
            }}
            onCreate={handleAddAccount}
            createLabel="Hesap ekle"
            emptyHint="Ad yazıp Yeni ekle"
          />
          {addError ? (
            <p className="mt-2 text-sm text-danger" role="alert">
              {addError}
            </p>
          ) : null}
        </div>
      ) : null}

      {account ? (
        <div className="mx-4 rounded-2xl border border-border bg-card px-5 py-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">Güncel Bakiye</span>
              <BossMMoneyText
                amount={account.balance}
                currency={account.currency || '₺'}
                className="text-3xl leading-tight"
                amountClassName="text-foreground"
                currencyClassName="text-xl text-muted-foreground"
              />
              <span className="mt-1 text-xs text-muted-foreground">{account.name}</span>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-2 text-primary">
              <Icon size={22} strokeWidth={1.6} />
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-4 gap-2 px-4">
        {ACTIONS.map((a) => {
          const AIcon = a.icon
          return (
            <button
              key={a.key}
              type="button"
              onClick={() => router.push(`/boss-m/kasa/hareket?type=${a.key}`)}
              className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-card/90 py-3 transition-transform active:scale-[0.96]"
            >
              <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', a.color)}>
                <AIcon size={16} strokeWidth={1.8} />
              </div>
              <span className="px-1 text-center text-[10px] font-medium leading-tight text-muted-foreground">
                {a.label}
              </span>
            </button>
          )
        })}
      </div>

      <div className="flex items-center gap-2 px-4">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Hareketler
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>

      {ledger.length === 0 ? (
        <BossMEmptyState
          icon={Inbox}
          title="Hareket bulunamadı"
          description="Bu hesap için henüz kayıt yok."
        />
      ) : (
        <div className="mx-4 overflow-hidden rounded-2xl border border-border bg-card">
          <div className="flex flex-col divide-y divide-border">
            {ledger.map((entry) => (
              <div key={entry.id} className="flex items-center gap-3 px-4 py-3.5">
                <div
                  className={cn(
                    'mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full',
                    entry.sign === 'positive' ? 'bg-success' : 'bg-danger',
                  )}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium leading-tight text-foreground">
                    {entry.description}
                  </p>
                  <div className="mt-0.5 flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground">{entry.datetime}</span>
                    <span className="rounded-full bg-surface-2 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                      {entry.category}
                    </span>
                  </div>
                </div>
                <span
                  className={cn(
                    'shrink-0 text-right text-sm font-bold tabular-nums',
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
