'use client'

import { useState } from 'react'
import {
  Users, TrendingDown, TrendingUp, Minus, X, ShoppingBag, Clock,
  AlertCircle, ChevronRight,
} from 'lucide-react'
import { BossMPageHeader } from '@/components/boss/BossMPageHeader'
import { PERSONEL_LIST } from '@/lib/boss-mock'
import type { PersonelRow } from '@/lib/boss-mock'
import { useBossLoad } from '@/hooks/use-boss-load'
import { loadPersonelPage } from '@/lib/boss-page-data'
import { cn } from '@/lib/utils'

// ── Role badge ────────────────────────────────────────────────────────────────
const ROLE_COLOR: Record<string, string> = {
  Garson:    'bg-primary/10   text-primary',
  Kasiyer:   'bg-info/10      text-info',
  Şef:       'bg-warning/10   text-warning',
  Yardımcı:  'bg-surface-3    text-muted-foreground',
  Müdür:     'bg-success/10   text-success',
}

function RoleBadge({ role }: { role: string }) {
  return (
    <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-full', ROLE_COLOR[role] ?? 'bg-surface-3 text-muted-foreground')}>
      {role}
    </span>
  )
}

// ── Avatar initials ───────────────────────────────────────────────────────────
function Avatar({ name, size = 10 }: { name: string; size?: number }) {
  const initials = name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full bg-primary/15 text-primary font-bold text-xs shrink-0',
        size === 10 ? 'w-10 h-10' : 'w-12 h-12'
      )}
    >
      {initials}
    </div>
  )
}

// ── Cancel rate color ─────────────────────────────────────────────────────────
function cancelColor(rate: string) {
  if (rate === '—') return 'text-muted-foreground'
  const n = parseFloat(rate)
  if (n >= 4) return 'text-danger'
  if (n >= 2) return 'text-warning'
  return 'text-success'
}

// ── Performans row ────────────────────────────────────────────────────────────
function PerformansRow({ person, rank, onTap }: { person: PersonelRow; rank: number; onTap: () => void }) {
  const TrendIcon = person.cancelRate === '—' ? Minus
    : parseFloat(person.cancelRate) >= 4 ? TrendingDown : TrendingUp

  return (
    <button
      onClick={onTap}
      className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-surface-2 transition-colors"
    >
      {/* Rank */}
      <span className={cn(
        'w-5 text-center text-xs font-bold shrink-0',
        rank === 1 ? 'text-warning' : rank === 2 ? 'text-muted-foreground' : 'text-muted-foreground/50'
      )}>
        {rank}
      </span>

      <Avatar name={person.name} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-foreground truncate">{person.name}</p>
          <RoleBadge role={person.role} />
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="text-xs text-muted-foreground tabular-nums">{person.orderCount} sipariş</span>
          <span className={cn('flex items-center gap-0.5 text-xs font-medium', cancelColor(person.cancelRate))}>
            <TrendIcon size={10} strokeWidth={2.5} />
            {person.cancelRate} iptal
          </span>
        </div>
      </div>

      <span className="text-sm font-bold text-foreground tabular-nums shrink-0">{person.salesTotal}</span>
      <ChevronRight size={14} className="text-muted-foreground shrink-0" />
    </button>
  )
}

// ── Kadro row ─────────────────────────────────────────────────────────────────
function KadroRow({ person, onTap }: { person: PersonelRow; onTap: () => void }) {
  return (
    <button
      onClick={onTap}
      className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-surface-2 transition-colors"
    >
      <Avatar name={person.name} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-foreground truncate">{person.name}</p>
          <RoleBadge role={person.role} />
        </div>
        <p className="text-[10px] text-muted-foreground mt-0.5">{person.startDate}&apos;den beri</p>
      </div>

      <span className={cn(
        'text-[10px] font-semibold px-2 py-1 rounded-full',
        person.active ? 'bg-success/10 text-success' : 'bg-surface-3 text-muted-foreground'
      )}>
        {person.active ? 'Aktif' : 'Pasif'}
      </span>

      <ChevronRight size={14} className="text-muted-foreground shrink-0" />
    </button>
  )
}

// ── Detail panel ──────────────────────────────────────────────────────────────
function DetailPanel({ person, onClose }: { person: PersonelRow; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-background z-40 flex flex-col">
      <BossMPageHeader
        title={person.name}
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

        {/* Identity */}
        <div className="flex items-center gap-4 py-4">
          <Avatar name={person.name} size={12} />
          <div>
            <div className="flex items-center gap-2">
              <RoleBadge role={person.role} />
              <span className={cn(
                'text-[10px] font-semibold px-2 py-0.5 rounded-full',
                person.active ? 'bg-success/10 text-success' : 'bg-surface-3 text-muted-foreground'
              )}>
                {person.active ? 'Aktif' : 'Pasif'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{person.startDate}&apos;den beri</p>
          </div>
        </div>

        {/* Today stats */}
        {person.orderCount > 0 && (
          <section className="mb-4">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
              Bugün
            </p>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-card border border-border rounded-xl p-3 flex flex-col gap-0.5">
                <ShoppingBag size={14} className="text-muted-foreground" />
                <span className="text-lg font-bold text-foreground tabular-nums">{person.orderCount}</span>
                <span className="text-[10px] text-muted-foreground">Sipariş</span>
              </div>
              <div className="bg-card border border-border rounded-xl p-3 flex flex-col gap-0.5">
                <TrendingUp size={14} className="text-success" />
                <span className="text-base font-bold text-foreground tabular-nums leading-tight">{person.salesTotal}</span>
                <span className="text-[10px] text-muted-foreground">Ciro</span>
              </div>
              <div className="bg-card border border-border rounded-xl p-3 flex flex-col gap-0.5">
                <AlertCircle size={14} className={cancelColor(person.cancelRate)} />
                <span className={cn('text-lg font-bold tabular-nums', cancelColor(person.cancelRate))}>{person.cancelRate}</span>
                <span className="text-[10px] text-muted-foreground">İptal oranı</span>
              </div>
            </div>
          </section>
        )}

        {/* Audit events */}
        <section>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
            Son Denetim Olayları
          </p>
          {person.auditEvents.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl px-4 py-6 text-center">
              <Clock size={20} className="mx-auto text-muted-foreground mb-2" />
              <p className="text-xs text-muted-foreground">Kayıt yok</p>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border">
              {person.auditEvents.map((ev, i) => (
                <div key={i} className="flex items-start gap-3 px-4 py-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground leading-relaxed">{ev.desc}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{ev.time}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function BossMPersonelPage() {
  const { data, loading } = useBossLoad(loadPersonelPage, {
    list: PERSONEL_LIST,
    source: 'mock',
  })
  const list = data.list
  const [tab, setTab]               = useState<'performans' | 'kadro'>('performans')
  const [selected, setSelected]     = useState<PersonelRow | null>(null)

  // Performans: sort by sales (only for service roles)
  const performansRows = [...list]
    .filter((p) => p.orderCount > 0 || p.salesTotal !== '—')
    .sort((a, b) => parseInt(b.salesTotal.replace(/\D/g, '') || '0') - parseInt(a.salesTotal.replace(/\D/g, '') || '0'))

  const kadroRows = [...list].sort((a, b) => Number(b.active) - Number(a.active))
  const performansDisplay = performansRows.length ? performansRows : kadroRows

  return (
    <main className="flex flex-col h-screen bg-transparent">
      {selected && (
        <DetailPanel person={selected} onClose={() => setSelected(null)} />
      )}

      <BossMPageHeader title="Personel" showBack />

      {/* Tabs */}
      <div className="flex gap-1 mx-4 mb-3 p-1 bg-surface-2 rounded-xl border border-border">
        {(['performans', 'kadro'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'flex-1 h-9 rounded-lg text-xs font-semibold transition-colors capitalize',
              tab === t
                ? 'bg-card text-foreground shadow-sm border border-border'
                : 'text-muted-foreground'
            )}
          >
            {t === 'performans' ? 'Performans' : 'Kadro'}
          </button>
        ))}
      </div>

      {/* Summary strip — Performans */}
      {tab === 'performans' && (
        <div className="flex gap-2 px-4 mb-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-primary/10 border border-primary/20">
            <Users size={11} className="text-primary" />
            <span className="text-[11px] font-semibold text-primary">{performansDisplay.length} personel</span>
          </div>
          {performansDisplay.filter((p) => parseFloat(p.cancelRate) >= 4).length > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-danger/10 border border-danger/20">
              <TrendingDown size={11} className="text-danger" />
              <span className="text-[11px] font-semibold text-danger">
                {performansDisplay.filter((p) => parseFloat(p.cancelRate) >= 4).length} yüksek iptal
              </span>
            </div>
          )}
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto overscroll-none px-4 pb-6">
        {loading ? (
          <div className="space-y-2 animate-pulse">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-14 bg-surface-2 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border">
            {tab === 'performans'
              ? performansDisplay.map((p, i) => (
                  <PerformansRow key={p.id} person={p} rank={i + 1} onTap={() => setSelected(p)} />
                ))
              : kadroRows.map((p) => (
                  <KadroRow key={p.id} person={p} onTap={() => setSelected(p)} />
                ))
            }
          </div>
        )}
      </div>
    </main>
  )
}
