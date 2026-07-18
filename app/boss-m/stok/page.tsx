'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Package,
  AlertTriangle,
  Flame,
  ClipboardList,
  ArrowLeftRight,
  ChevronRight,
  PackageX,
} from 'lucide-react'
import { BossMPageHeader } from '@/components/boss/BossMPageHeader'
import { BossMEmptyState } from '@/components/boss/BossMEmptyState'
import {
  STOK_ITEMS,
  STOK_WAREHOUSES,
  STOK_KPI,
} from '@/lib/boss-mock'
import type { StokItem } from '@/lib/boss-mock'
import { useBossLoad } from '@/hooks/use-boss-load'
import { loadStokHub } from '@/lib/boss-page-data'
import { cn } from '@/lib/utils'

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_DOT: Record<StokItem['status'], string> = {
  normal:  'bg-success',
  kritik:  'bg-warning',
  tukendi: 'bg-danger',
}

const STATUS_BADGE: Record<StokItem['status'], string> = {
  normal:  'bg-success/10 text-success border-success/20',
  kritik:  'bg-warning/10 text-warning border-warning/20',
  tukendi: 'bg-danger/10  text-danger  border-danger/20',
}

const STATUS_LABEL: Record<StokItem['status'], string> = {
  normal:  'Normal',
  kritik:  'Kritik',
  tukendi: 'Tükendi',
}

function warehouseName(id: string, warehouses: { id: string; name: string }[]) {
  return warehouses.find((w) => w.id === id)?.name ?? id
}

// ── KPI Card ──────────────────────────────────────────────────────────────────

function StokKpiCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string
  value: string | number
  icon: React.ElementType
  accent: string
}) {
  return (
    <div className="flex flex-col gap-2 bg-card border border-border rounded-2xl p-4">
      <div className={cn('flex items-center justify-center w-9 h-9 rounded-xl', accent)}>
        <Icon size={16} strokeWidth={1.8} />
      </div>
      <p className="text-xl font-bold text-foreground tabular-nums leading-none">{value}</p>
      <p className="text-[11px] text-muted-foreground leading-tight">{label}</p>
    </div>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function StokSkeleton() {
  return (
    <div className="flex flex-col gap-4 px-4 animate-pulse">
      <div className="grid grid-cols-2 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-surface-2 rounded-2xl" />
        ))}
      </div>
      <div className="h-5 w-32 bg-surface-2 rounded-full" />
      <div className="flex flex-col gap-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 bg-surface-2 rounded-2xl" />
        ))}
      </div>
    </div>
  )
}

// ── Critical Row ──────────────────────────────────────────────────────────────

function KritikStokRow({
  item,
  warehouses,
}: {
  item: StokItem
  warehouses: { id: string; name: string }[]
}) {
  return (
    <Link
      href={`/boss-m/stok/kritik?id=${item.id}`}
      className="flex items-center gap-3 px-4 py-3.5 active:bg-surface-2 transition-colors"
    >
      <div className={cn('w-2 h-2 rounded-full shrink-0 mt-0.5', STATUS_DOT[item.status])} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          {warehouseName(item.warehouseId, warehouses)}
        </p>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <span className={cn('text-sm font-bold tabular-nums',
          item.status === 'tukendi' ? 'text-danger' : 'text-warning'
        )}>
          {item.stock} {item.unit}
        </span>
        <span className={cn(
          'text-[10px] font-semibold px-1.5 py-0.5 rounded-full border',
          STATUS_BADGE[item.status]
        )}>
          {STATUS_LABEL[item.status]}
        </span>
      </div>
      <ChevronRight size={14} className="text-muted-foreground shrink-0" />
    </Link>
  )
}

// ── Quick Nav Card ────────────────────────────────────────────────────────────

function QuickNavCard({
  href,
  label,
  sub,
  icon: Icon,
  accent,
}: {
  href: string
  label: string
  sub: string
  icon: React.ElementType
  accent: string
}) {
  return (
    <Link
      href={href}
      className="flex flex-col gap-2 bg-card border border-border rounded-2xl px-4 py-4 active:scale-[0.97] transition-transform"
    >
      <div className={cn('flex items-center justify-center w-10 h-10 rounded-xl', accent)}>
        <Icon size={18} strokeWidth={1.6} />
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">{sub}</p>
      </div>
    </Link>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

const ALL_WAREHOUSES = 'Tümü'

export default function BossMStokPage() {
  const { data, loading } = useBossLoad(
    loadStokHub,
    {
      warehouses: STOK_WAREHOUSES,
      items: STOK_ITEMS,
      kpi: STOK_KPI,
      source: 'mock',
    },
    { cacheKey: 'page:stok-shell', ttlMs: 45_000 },
  )
  const [warehouse, setWarehouse] = useState(ALL_WAREHOUSES)

  const warehouseChips = [ALL_WAREHOUSES, ...data.warehouses.map((w) => w.name)]
  const kpi = data.kpi

  const criticalItems = data.items
    .filter((i) => i.status === 'kritik' || i.status === 'tukendi')
    .filter(
      (i) =>
        warehouse === ALL_WAREHOUSES ||
        warehouseName(i.warehouseId, data.warehouses) === warehouse,
    )

  if (loading) {
    return (
      <main className="flex flex-col h-svh bg-background overflow-hidden">
        <BossMPageHeader title="Stok" showBack />
        <StokSkeleton />
      </main>
    )
  }

  return (
    <main className="flex flex-col h-svh bg-background overflow-hidden">
      {/* ── Header ── */}
      <BossMPageHeader
        title="Stok"
        showBack
        trailing={
          <Link
            href="/boss-m/stok/kritik"
            className="flex items-center justify-center h-11 px-3 rounded-xl text-xs font-medium text-primary active:bg-primary/10 transition-colors"
          >
            Tümünü gör
          </Link>
        }
      />

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto overscroll-none pb-[72px]">
        {/* ── Warehouse filter chips ── */}
        <div className="flex gap-2 px-4 pb-4 overflow-x-auto">
          {warehouseChips.map((w) => (
            <button
              key={w}
              onClick={() => setWarehouse(w)}
              className={cn(
                'px-3 py-1.5 rounded-full border text-xs font-medium whitespace-nowrap transition-colors shrink-0',
                warehouse === w
                  ? 'bg-primary/10 border-primary/40 text-primary'
                  : 'bg-card border-border text-muted-foreground'
              )}
            >
              {w}
            </button>
          ))}
        </div>

        {/* ── KPI 2×2 grid ── */}
        <div className="grid grid-cols-2 gap-3 px-4 pb-6">
          <StokKpiCard
            label="Toplam stok değeri"
            value={kpi.toplamDeger}
            icon={Package}
            accent="bg-primary/10 text-primary"
          />
          <StokKpiCard
            label="Kritik stok adedi"
            value={kpi.kritikAdet}
            icon={AlertTriangle}
            accent="bg-warning/10 text-warning"
          />
          <StokKpiCard
            label="Bugünkü fire tutarı"
            value={kpi.bugunFireTutar}
            icon={Flame}
            accent="bg-danger/10 text-danger"
          />
          <StokKpiCard
            label="Açık sayım"
            value={kpi.acikSayim}
            icon={ClipboardList}
            accent="bg-info/10 text-info"
          />
        </div>

        {/* ── Kritik stok section ── */}
        <div className="px-4 mb-3">
          <div className="flex items-center justify-between">
            <h2 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Kritik stok
            </h2>
            <Link
              href="/boss-m/stok/kritik"
              className="text-[11px] font-medium text-primary"
            >
              Tümü ({data.items.filter((i) => i.status !== 'normal').length})
            </Link>
          </div>
        </div>

        {criticalItems.length === 0 ? (
          <div className="px-4 mb-6">
            <BossMEmptyState
              icon={PackageX}
              title="Kritik stok yok"
              description="Bu depoda stok uyarısı bulunmuyor."
            />
          </div>
        ) : (
          <div className="mx-4 mb-6 bg-card border border-border rounded-2xl overflow-hidden">
            <div className="flex flex-col divide-y divide-border">
              {criticalItems.slice(0, 5).map((item) => (
                <KritikStokRow key={item.id} item={item} warehouses={data.warehouses} />
              ))}
              {criticalItems.length > 5 && (
                <Link
                  href="/boss-m/stok/kritik"
                  className="flex items-center justify-center gap-1.5 py-3.5 text-xs font-medium text-primary active:bg-surface-2 transition-colors"
                >
                  +{criticalItems.length - 5} daha
                  <ChevronRight size={13} />
                </Link>
              )}
            </div>
          </div>
        )}

        {/* ── Hızlı git ── */}
        <div className="px-4 mb-3">
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Hızlı git
          </h2>
        </div>
        <div className="grid grid-cols-3 gap-3 px-4">
          <QuickNavCard
            href="/boss-m/stok/sayimlar"
            label="Sayımlar"
            sub={`${kpi.acikSayim} açık`}
            icon={ClipboardList}
            accent="bg-info/10 text-info"
          />
          <QuickNavCard
            href="/boss-m/stok/transferler"
            label="Transferler"
            sub="Bekleyen / yolda"
            icon={ArrowLeftRight}
            accent="bg-primary/10 text-primary"
          />
          <QuickNavCard
            href="/boss-m/stok/fire"
            label="Fire"
            sub="Çıkış / zayi"
            icon={Flame}
            accent="bg-danger/10 text-danger"
          />
        </div>
      </div>
    </main>
  )
}
