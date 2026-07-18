'use client'

import { useState } from 'react'
import { X, Building2, User, ArrowUpRight, ArrowDownLeft, Minus } from 'lucide-react'
import { BossMPageHeader } from '@/components/boss/BossMPageHeader'
import { BossMEmptyState } from '@/components/boss/BossMEmptyState'
import { CARILER } from '@/lib/boss-mock'
import type { Cari } from '@/lib/boss-mock'
import { useBossLoad } from '@/hooks/use-boss-load'
import { loadCarilerPage } from '@/lib/boss-page-data'
import { cn } from '@/lib/utils'

function balanceLabel(balance: number, type: Cari['type']): string {
  if (balance === 0) return 'Hesap kapalı'
  if (type === 'musteri') {
    return balance > 0 ? `${fmtTL(balance)} alacak` : `${fmtTL(-balance)} borç`
  }
  return balance < 0 ? `${fmtTL(-balance)} borçlu` : `${fmtTL(balance)} alacak`
}

function balanceColor(balance: number, type: Cari['type']): string {
  if (balance === 0) return 'text-muted-foreground'
  if (type === 'musteri') return balance > 0 ? 'text-success' : 'text-danger'
  return balance < 0 ? 'text-warning' : 'text-success'
}

function fmtTL(n: number): string {
  return `${n.toLocaleString('tr-TR')} ₺`
}

function CariDetailPanel({ cari, onClose }: { cari: Cari; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-background z-40 flex flex-col">
      <BossMPageHeader
        title={cari.name}
        showBack={false}
        trailing={
          <button
            onClick={onClose}
            className="flex items-center justify-center w-11 h-11 rounded-xl text-muted-foreground active:bg-surface-2"
          >
            <X size={18} />
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto overscroll-none px-4 pb-8">
        <div className={cn(
          'rounded-2xl border px-4 py-4 flex items-center gap-4 mt-1 mb-5',
          cari.balance === 0
            ? 'bg-card border-border'
            : cari.balance > 0
              ? 'bg-success/5 border-success/20'
              : 'bg-warning/5 border-warning/20'
        )}>
          <div className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
            cari.type === 'musteri' ? 'bg-primary/10' : 'bg-warning/10'
          )}>
            {cari.type === 'musteri'
              ? <User size={18} className="text-primary" strokeWidth={1.6} />
              : <Building2 size={18} className="text-warning" strokeWidth={1.6} />
            }
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{cari.type === 'musteri' ? 'Müşteri' : 'Tedarikçi'}</p>
            <p className={cn('text-xl font-bold tabular-nums', balanceColor(cari.balance, cari.type))}>
              {balanceLabel(cari.balance, cari.type)}
            </p>
          </div>
        </div>

        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
          Son 5 Hareket
        </p>
        {cari.ledger.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl px-4 py-8 text-center">
            <p className="text-sm text-muted-foreground">Hareket kaydı yok</p>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border">
            {cari.ledger.map((row, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3.5">
                <div className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center shrink-0',
                  row.sign === '+' ? 'bg-success/10' : 'bg-primary/10'
                )}>
                  {row.sign === '+' ? (
                    <ArrowUpRight size={13} className="text-success" strokeWidth={2.5} />
                  ) : (
                    <ArrowDownLeft size={13} className="text-primary" strokeWidth={2.5} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">{row.desc}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{row.date}</p>
                </div>
                <span className={cn(
                  'text-sm font-bold tabular-nums shrink-0',
                  row.sign === '+' ? 'text-success' : 'text-foreground'
                )}>
                  {row.sign === '+' ? '+' : '−'}{row.amount}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function CariRow({ cari, onTap }: { cari: Cari; onTap: () => void }) {
  return (
    <button
      onClick={onTap}
      className="w-full flex items-center gap-3 px-4 py-4 text-left active:bg-surface-2 transition-colors"
    >
      <div className={cn(
        'w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
        cari.type === 'musteri' ? 'bg-primary/10' : 'bg-warning/10'
      )}>
        {cari.type === 'musteri'
          ? <User size={16} className="text-primary" strokeWidth={1.6} />
          : <Building2 size={16} className="text-warning" strokeWidth={1.6} />
        }
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{cari.name}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">Son: {cari.lastMovement}</p>
      </div>

      <div className="text-right shrink-0">
        <p className={cn('text-sm font-bold tabular-nums', balanceColor(cari.balance, cari.type))}>
          {cari.balance === 0 ? (
            <span className="flex items-center gap-0.5 justify-end text-muted-foreground">
              <Minus size={12} strokeWidth={2.5} /> Sıfır
            </span>
          ) : balanceLabel(cari.balance, cari.type)}
        </p>
      </div>
    </button>
  )
}

export default function BossMCarilerPage() {
  const { data, loading } = useBossLoad(loadCarilerPage, {
    list: CARILER,
    source: 'mock',
  })
  const [segment, setSegment]   = useState<'musteri' | 'tedarikci'>('musteri')
  const [selected, setSelected] = useState<Cari | null>(null)

  const rows = data.list.filter((c) => c.type === segment)
    .sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance))

  const totalBalance = rows.reduce((s, c) => s + c.balance, 0)

  return (
    <main className="flex flex-col min-h-0 bg-transparent">
      {selected && <CariDetailPanel cari={selected} onClose={() => setSelected(null)} />}

      <BossMPageHeader title="Cariler" showBack />

      <div className="flex gap-1 mx-4 mb-3 p-1 bg-surface-2 rounded-xl border border-border">
        {(['musteri', 'tedarikci'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSegment(s)}
            className={cn(
              'flex-1 h-9 rounded-lg text-xs font-semibold transition-colors',
              segment === s
                ? 'bg-card text-foreground shadow-sm border border-border'
                : 'text-muted-foreground'
            )}
          >
            {s === 'musteri' ? 'Müşteri' : 'Tedarikçi'}
          </button>
        ))}
      </div>

      <div className="mx-4 mb-3 px-4 py-3 bg-card border border-border rounded-2xl flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {segment === 'musteri' ? 'Toplam açık alacak' : 'Toplam açık borç'}
        </span>
        <span className={cn(
          'text-sm font-bold tabular-nums',
          totalBalance > 0 ? 'text-success' : totalBalance < 0 ? 'text-warning' : 'text-muted-foreground'
        )}>
          {totalBalance === 0 ? '0 ₺' : fmtTL(Math.abs(totalBalance))}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-none px-4 pb-6">
        {loading ? (
          <div className="space-y-2 animate-pulse">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-surface-2 rounded-2xl" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <BossMEmptyState
            icon={User}
            title="Kayıt bulunamadı"
            description={segment === 'musteri' ? 'Müşteri kaydı yok.' : 'Tedarikçi kaydı yok.'}
          />
        ) : (
          <div className="bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border">
            {rows.map((c) => (
              <CariRow key={c.id} cari={c} onTap={() => setSelected(c)} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
