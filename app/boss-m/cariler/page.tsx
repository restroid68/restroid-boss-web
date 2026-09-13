'use client'

import { useMemo, useState } from 'react'
import { X, Building2, User, ArrowUpRight, ArrowDownLeft, Search } from 'lucide-react'
import { BossMPageHeader } from '@/components/boss/BossMPageHeader'
import { BossMEmptyState } from '@/components/boss/BossMEmptyState'
import { BossMMoneyText } from '@/components/boss/BossMMoneyText'
import { CARILER } from '@/lib/boss-mock'
import type { Cari } from '@/lib/boss-mock'
import { useBossLoad } from '@/hooks/use-boss-load'
import { loadCarilerPage } from '@/lib/boss-page-data'
import { formatMoneyTR } from '@/lib/boss-money'
import { cn } from '@/lib/utils'

function moneyLabel(n: number): string {
  return formatMoneyTR(Math.abs(n), 2)
}

function balanceWords(balance: number): string {
  return balance > 0 ? 'alacak' : 'borç'
}

function balanceColor(balance: number): string {
  if (Math.abs(balance) < 0.009) return 'text-muted-foreground'
  return balance > 0 ? 'text-success' : 'text-danger'
}

function CariDetailPanel({ cari, onClose }: { cari: Cari; onClose: () => void }) {
  const hasBook = cari.hasCurrentAccount !== false
  return (
    <div className="boss-over-native-nav flex flex-col bg-background">
      <BossMPageHeader
        title={cari.name}
        showBack={false}
        trailing={
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-xl text-muted-foreground active:bg-surface-2"
          >
            <X size={18} />
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto overscroll-none px-4 boss-nested-scroll">
        <div
          className={cn(
            'mt-1 mb-5 flex items-center gap-4 rounded-2xl border px-4 py-4',
            !hasBook || Math.abs(cari.balance) < 0.009
              ? 'border-border bg-card'
              : cari.balance > 0
                ? 'border-success/20 bg-success/5'
                : 'border-danger/20 bg-danger/5',
          )}
        >
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
              cari.type === 'musteri' ? 'bg-primary/10' : 'bg-warning/10',
            )}
          >
            {cari.type === 'musteri' ? (
              <User size={18} className="text-primary" strokeWidth={1.6} />
            ) : (
              <Building2 size={18} className="text-warning" strokeWidth={1.6} />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">
              {cari.type === 'musteri' ? 'Müşteri' : 'Tedarikçi'}
            </p>
            {hasBook ? (
              <p className={cn('text-xl font-bold tabular-nums', balanceColor(cari.balance))}>
                {Math.abs(cari.balance) < 0.009
                  ? 'Bakiye yok'
                  : `${moneyLabel(cari.balance)} ${balanceWords(cari.balance)}`}
              </p>
            ) : (
              <p className="text-base font-semibold text-muted-foreground">Cari hesap yok</p>
            )}
            {cari.subtitle ? (
              <p className="mt-1 text-[12px] text-muted-foreground">{cari.subtitle}</p>
            ) : null}
          </div>
        </div>

        {cari.ledger.length > 0 && (
          <>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Son 5 Hareket
            </p>
            <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
              {cari.ledger.map((row, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3.5">
                  <div
                    className={cn(
                      'flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
                      row.sign === '+' ? 'bg-success/10' : 'bg-primary/10',
                    )}
                  >
                    {row.sign === '+' ? (
                      <ArrowUpRight size={13} className="text-success" strokeWidth={2.5} />
                    ) : (
                      <ArrowDownLeft size={13} className="text-primary" strokeWidth={2.5} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-foreground">{row.desc}</p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">{row.date}</p>
                  </div>
                  <span
                    className={cn(
                      'shrink-0 text-sm font-bold tabular-nums',
                      row.sign === '+' ? 'text-success' : 'text-foreground',
                    )}
                  >
                    {row.sign === '+' ? '+' : '−'}
                    {row.amount}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function CariRow({ cari, onTap }: { cari: Cari; onTap: () => void }) {
  const hasBook = cari.hasCurrentAccount !== false
  const subtitle = (cari.subtitle ?? '').trim()
  return (
    <button
      type="button"
      onClick={onTap}
      className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors active:bg-surface-2"
    >
      <div
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
          cari.type === 'musteri' ? 'bg-primary/10' : 'bg-warning/10',
        )}
      >
        {cari.type === 'musteri' ? (
          <User size={16} className="text-primary" strokeWidth={1.6} />
        ) : (
          <Building2 size={16} className="text-warning" strokeWidth={1.6} />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">{cari.name}</p>
        {subtitle ? <p className="mt-0.5 truncate text-[12px] text-muted-foreground">{subtitle}</p> : null}
      </div>

      <div className="shrink-0 text-right">
        {!hasBook ? (
          <p className="text-xs font-medium text-muted-foreground">Cari yok</p>
        ) : Math.abs(cari.balance) < 0.009 ? (
          <BossMMoneyText amount={moneyLabel(0)} amountClassName="text-sm text-muted-foreground" />
        ) : (
          <div>
            <BossMMoneyText
              amount={moneyLabel(cari.balance)}
              amountClassName={cn('text-sm', balanceColor(cari.balance))}
            />
            <p className={cn('mt-0.5 text-[10px] font-semibold', balanceColor(cari.balance))}>
              {balanceWords(cari.balance)}
            </p>
          </div>
        )}
      </div>
    </button>
  )
}

export default function BossMCarilerPage() {
  const { data, loading } = useBossLoad(
    loadCarilerPage,
    {
      list: CARILER,
      source: 'mock',
    },
    { cacheKey: 'page:cariler:v2', ttlMs: 30_000 },
  )
  const [segment, setSegment] = useState<'musteri' | 'tedarikci'>('musteri')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Cari | null>(null)

  const rows = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('tr-TR')
    return data.list
      .filter((c) => c.type === segment)
      .filter((c) => {
        if (!q) return true
        const hay = `${c.name} ${c.subtitle ?? ''}`.toLocaleLowerCase('tr-TR')
        return hay.includes(q)
      })
      .sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance) || a.name.localeCompare(b.name, 'tr'))
  }, [data.list, segment, query])

  const booked = rows.filter((c) => c.hasCurrentAccount !== false)
  const totalOpen =
    segment === 'musteri'
      ? booked.reduce((s, c) => s + Math.max(0, c.balance), 0)
      : booked.reduce((s, c) => s + Math.abs(Math.min(0, c.balance)), 0)

  if (selected) {
    return <CariDetailPanel cari={selected} onClose={() => setSelected(null)} />
  }

  return (
    <main className="flex min-h-0 flex-1 flex-col bg-transparent">
      <BossMPageHeader title="Cariler" showBack />

      <div className="mx-4 mb-3 flex gap-1 rounded-xl border border-border bg-surface-2 p-1">
        {(['musteri', 'tedarikci'] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSegment(s)}
            className={cn(
              'h-9 !min-h-0 flex-1 rounded-lg text-xs font-semibold transition-colors',
              segment === s
                ? 'border border-border bg-card text-foreground shadow-sm'
                : 'text-muted-foreground',
            )}
          >
            {s === 'musteri' ? 'Müşteri' : 'Tedarikçi'}
          </button>
        ))}
      </div>

      <div className="px-4 pb-3">
        <div className="flex h-11 items-center gap-3 rounded-xl border border-border bg-card/90 px-3">
          <Search size={16} className="shrink-0 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={segment === 'musteri' ? 'Müşteri adı' : 'Tedarikçi adı'}
            className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/50"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Aramayı temizle"
              className="flex !h-8 !w-8 !min-h-0 !min-w-0 items-center justify-center text-muted-foreground"
            >
              <X size={14} />
            </button>
          ) : null}
        </div>
      </div>

      <div className="mx-4 mb-3 flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3">
        <span className="text-xs text-muted-foreground">
          {segment === 'musteri' ? 'Toplam açık alacak' : 'Toplam açık borç'}
        </span>
        <BossMMoneyText
          amount={moneyLabel(totalOpen)}
          amountClassName={cn(
            'text-sm',
            totalOpen < 0.009 ? 'text-muted-foreground' : segment === 'musteri' ? 'text-success' : 'text-danger',
          )}
        />
      </div>

      <div className="flex-1 overflow-y-auto overscroll-none px-4 boss-nested-scroll">
        {loading ? (
          <div className="space-y-2 animate-pulse">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 rounded-2xl bg-surface-2" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <BossMEmptyState
            icon={User}
            title="Kayıt bulunamadı"
            description={segment === 'musteri' ? 'Müşteri kaydı yok.' : 'Tedarikçi kaydı yok.'}
          />
        ) : (
          <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
            {rows.map((c) => (
              <CariRow key={c.id} cari={c} onTap={() => setSelected(c)} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
