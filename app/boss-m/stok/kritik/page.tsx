'use client'

import { useState, useMemo, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Search,
  X,
  AlertTriangle,
  PackageX,
  ArrowUpAZ,
  ArrowDownWideNarrow,
  ChevronLeft,
  Package,
  Warehouse,
  CalendarDays,
  TrendingDown,
} from 'lucide-react'
import { BossMPageHeader } from '@/components/boss/BossMPageHeader'
import { BossMEmptyState } from '@/components/boss/BossMEmptyState'
import type { StokItem, StokWarehouse } from '@/lib/boss-mock'
import { useBossLoad } from '@/hooks/use-boss-load'
import { loadStokHub } from '@/lib/boss-page-data'
import { cn } from '@/lib/utils'

const STATUS_DOT: Record<StokItem['status'], string> = {
  normal: 'bg-success',
  kritik: 'bg-warning',
  tukendi: 'bg-danger',
}

const STATUS_BADGE: Record<StokItem['status'], string> = {
  normal: 'bg-success/10 text-success border-success/20',
  kritik: 'bg-warning/10 text-warning border-warning/20',
  tukendi: 'bg-danger/10 text-danger border-danger/20',
}

const STATUS_LABEL: Record<StokItem['status'], string> = {
  normal: 'Normal',
  kritik: 'Kritik',
  tukendi: 'Tükendi',
}

function warehouseName(id: string, warehouses: StokWarehouse[]) {
  const name = warehouses.find((w) => w.id === id)?.name ?? ''
  return name.trim()
}

function formatStockQty(n: number): string {
  if (!Number.isFinite(n)) return '0'
  return new Intl.NumberFormat('tr-TR', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(n)
}

function KritikSkeleton() {
  return (
    <div className="flex flex-col gap-3 px-4 animate-pulse">
      <div className="h-11 rounded-xl bg-surface-2" />
      <div className="flex gap-2">
        <div className="h-8 w-24 rounded-full bg-surface-2" />
        <div className="h-8 w-20 rounded-full bg-surface-2" />
      </div>
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-16 rounded-2xl bg-surface-2" />
      ))}
    </div>
  )
}

function DetailPanel({
  item,
  warehouses,
  onClose,
}: {
  item: StokItem
  warehouses: StokWarehouse[]
  onClose: () => void
}) {
  const depo = warehouseName(item.warehouseId, warehouses)
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-transparent">
      <header className="flex items-center gap-3 px-4 pt-4 pb-3">
        <button
          type="button"
          onClick={onClose}
          aria-label="Geri"
          className="flex h-11 w-11 -ml-2 items-center justify-center rounded-xl text-muted-foreground transition-colors active:bg-surface-2"
        >
          <ChevronLeft size={22} />
        </button>
        <h1 className="min-w-0 flex-1 truncate text-lg font-semibold tracking-tight text-foreground">
          {item.name}
        </h1>
        <span
          className={cn(
            'shrink-0 rounded-full border px-2 py-1 text-[10px] font-semibold',
            STATUS_BADGE[item.status],
          )}
        >
          {STATUS_LABEL[item.status]}
        </span>
      </header>

      <div className="flex-1 overflow-y-auto overscroll-none px-4 boss-nested-scroll">
        <div className="mb-4 overflow-hidden rounded-2xl border border-border bg-card">
          <div className="flex flex-col divide-y divide-border">
            {[
              {
                icon: Package,
                label: 'Mevcut miktar',
                value: `${formatStockQty(item.stock)} ${item.unit}`,
              },
              ...(depo ? [{ icon: Warehouse, label: 'Depo', value: depo }] : []),
              {
                icon: TrendingDown,
                label: 'Kritik eşik',
                value: `${formatStockQty(item.minStock)} ${item.unit}`,
              },
              { icon: CalendarDays, label: 'Son hareket', value: item.lastMovement },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-4 px-4 py-3.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface-2">
                  <Icon size={15} className="text-muted-foreground" strokeWidth={1.7} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] text-muted-foreground">{label}</p>
                  <p className="mt-0.5 text-sm font-semibold text-foreground">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-4 flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Package size={15} className="text-primary" strokeWidth={1.7} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] text-muted-foreground">Stok değeri</p>
            <p className="mt-0.5 text-sm font-semibold text-foreground">{item.value}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function KritikRow({
  item,
  warehouses,
  onSelect,
}: {
  item: StokItem
  warehouses: StokWarehouse[]
  onSelect: (item: StokItem) => void
}) {
  const depo = warehouseName(item.warehouseId, warehouses)
  const subtitle =
    item.status === 'kritik'
      ? [depo, `eşik ${formatStockQty(item.minStock)} ${item.unit}`].filter(Boolean).join(' · ')
      : depo

  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors active:bg-surface-2"
    >
      <div className={cn('mt-1 h-2.5 w-2.5 shrink-0 rounded-full', STATUS_DOT[item.status])} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold leading-snug text-foreground">{item.name}</p>
        {subtitle ? (
          <p className="mt-0.5 truncate text-[12px] text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <span
          className={cn(
            'text-sm font-bold tabular-nums',
            item.status === 'tukendi' ? 'text-danger' : 'text-warning',
          )}
        >
          {formatStockQty(item.stock)} {item.unit}
        </span>
        <span
          className={cn(
            'rounded-full border px-1.5 py-0.5 text-[10px] font-semibold',
            STATUS_BADGE[item.status],
          )}
        >
          {STATUS_LABEL[item.status]}
        </span>
      </div>
    </button>
  )
}

type SortKey = 'En kritik' | 'Ada göre'

function KritikPageInner() {
  const searchParams = useSearchParams()
  const preselectedId = searchParams.get('id')

  const { data, loading } = useBossLoad(
    loadStokHub,
    {
      warehouses: [],
      items: [],
      kpi: { toplamDeger: '—', kritikAdet: 0, bugunFireTutar: '—', acikSayim: 0 },
      source: 'mock',
    },
    { cacheKey: 'page:stok-shell', ttlMs: 45_000 },
  )

  const nonNormalItems = data.items.filter((i) => i.status !== 'normal')

  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SortKey>('En kritik')
  const [selected, setSelected] = useState<StokItem | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('tr-TR')
    let items = nonNormalItems.filter((i) => !q || i.name.toLocaleLowerCase('tr-TR').includes(q))
    if (sort === 'En kritik') {
      const order: Record<StokItem['status'], number> = { tukendi: 0, kritik: 1, normal: 2 }
      items = [...items].sort((a, b) => order[a.status] - order[b.status] || a.name.localeCompare(b.name, 'tr'))
    } else {
      items = [...items].sort((a, b) => a.name.localeCompare(b.name, 'tr'))
    }
    return items
  }, [query, sort, nonNormalItems])

  const tukendiCount = nonNormalItems.filter((i) => i.status === 'tukendi').length
  const kritikCount = nonNormalItems.filter((i) => i.status === 'kritik').length

  useEffect(() => {
    if (loading || !preselectedId || selected) return
    const match = data.items.find((i) => i.id === preselectedId)
    if (match && match.status !== 'normal') setSelected(match)
  }, [loading, preselectedId, selected, data.items])

  if (selected) {
    return (
      <DetailPanel
        item={selected}
        warehouses={data.warehouses}
        onClose={() => setSelected(null)}
      />
    )
  }

  return (
    <main className="flex min-h-0 flex-1 flex-col overflow-hidden bg-transparent">
      <BossMPageHeader title="Kritik Stok" showBack />

      {loading ? (
        <KritikSkeleton />
      ) : (
        <>
          <div className="px-4 pb-3">
            <div className="flex h-11 items-center gap-3 rounded-xl border border-border bg-card/90 px-3">
              <Search size={16} className="shrink-0 text-muted-foreground" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ürün adı"
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

          <div className="flex min-w-0 items-center gap-2 px-4 pb-3">
            <div
              className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto"
              style={{ touchAction: 'pan-x' }}
            >
              <span className="inline-flex !min-h-8 !min-w-0 shrink-0 items-center gap-1.5 rounded-full border border-danger/25 bg-danger/10 px-2.5 py-1 text-[11px] font-semibold text-danger">
                <PackageX size={12} />
                {tukendiCount} tükendi
              </span>
              <span className="inline-flex !min-h-8 !min-w-0 shrink-0 items-center gap-1.5 rounded-full border border-warning/25 bg-warning/10 px-2.5 py-1 text-[11px] font-semibold text-warning">
                <AlertTriangle size={12} />
                {kritikCount} kritik
              </span>
            </div>
            <div className="flex shrink-0 rounded-xl border border-border bg-card p-0.5">
              {(['En kritik', 'Ada göre'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSort(s)}
                  className={cn(
                    'inline-flex !min-h-8 !min-w-0 items-center gap-1 rounded-lg px-2.5 text-[11px] font-medium',
                    sort === s ? 'bg-primary/15 text-primary' : 'text-muted-foreground',
                  )}
                >
                  {s === 'En kritik' ? <ArrowDownWideNarrow size={12} /> : <ArrowUpAZ size={12} />}
                  {s === 'En kritik' ? 'Kritik' : 'Ad'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto overscroll-none px-4 boss-nested-scroll">
            {filtered.length === 0 ? (
              <BossMEmptyState
                icon={PackageX}
                title="Ürün bulunamadı"
                description="Arama kriterini değiştirin."
              />
            ) : (
              <div className="overflow-hidden rounded-2xl border border-border bg-card">
                <div className="flex flex-col divide-y divide-border">
                  {filtered.map((item) => (
                    <KritikRow
                      key={item.id}
                      item={item}
                      warehouses={data.warehouses}
                      onSelect={setSelected}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </main>
  )
}

export default function BossMStokKritikPage() {
  return (
    <Suspense fallback={null}>
      <KritikPageInner />
    </Suspense>
  )
}
