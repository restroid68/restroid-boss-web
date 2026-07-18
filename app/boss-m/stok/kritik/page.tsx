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
import { STOK_ITEMS, STOK_WAREHOUSES } from '@/lib/boss-mock'
import type { StokItem, StokWarehouse } from '@/lib/boss-mock'
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

function warehouseName(id: string, warehouses: StokWarehouse[]) {
  return warehouses.find((w) => w.id === id)?.name ?? id
}

function KritikSkeleton() {
  return (
    <div className="flex flex-col gap-3 px-4 animate-pulse">
      <div className="flex gap-2">
        <div className="h-7 w-24 bg-surface-2 rounded-full" />
        <div className="h-7 w-24 bg-surface-2 rounded-full" />
      </div>
      <div className="h-8 w-40 bg-surface-2 rounded-xl" />
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-16 bg-surface-2 rounded-2xl" />
      ))}
    </div>
  )
}

// ── Detail Panel ──────────────────────────────────────────────────────────────

function DetailPanel({
  item,
  warehouses,
  onClose,
}: {
  item: StokItem
  warehouses: StokWarehouse[]
  onClose: () => void
}) {
  return (
    <div className="flex flex-col h-svh bg-background">
      <header className="flex items-center gap-3 px-4 pt-4 pb-3">
        <button
          onClick={onClose}
          aria-label="Geri"
          className="flex items-center justify-center w-11 h-11 -ml-2 rounded-xl text-muted-foreground active:bg-surface-2 transition-colors"
        >
          <ChevronLeft size={22} />
        </button>
        <h1 className="flex-1 text-lg font-semibold text-foreground tracking-tight truncate">
          {item.name}
        </h1>
        <span className={cn(
          'text-[10px] font-semibold px-2 py-1 rounded-full border',
          STATUS_BADGE[item.status]
        )}>
          {STATUS_LABEL[item.status]}
        </span>
      </header>

      <div className="flex-1 overflow-y-auto overscroll-none pb-[72px] px-4">
        <div className="bg-card border border-border rounded-2xl overflow-hidden mb-4">
          <div className="flex flex-col divide-y divide-border">
            {[
              { icon: Package,      label: 'Stok Miktarı',   value: `${item.stock} ${item.unit}` },
              { icon: Warehouse,    label: 'Depo',            value: warehouseName(item.warehouseId, warehouses) },
              { icon: TrendingDown, label: 'Min. Eşik',       value: `${item.minStock} ${item.unit}` },
              { icon: CalendarDays, label: 'Son hareket',     value: item.lastMovement },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-4 px-4 py-3.5">
                <div className="flex items-center justify-center w-9 h-9 bg-surface-2 rounded-xl shrink-0">
                  <Icon size={15} className="text-muted-foreground" strokeWidth={1.7} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-muted-foreground">{label}</p>
                  <p className="text-sm font-semibold text-foreground mt-0.5">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl px-4 py-4 mb-4 flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 bg-primary/10 rounded-xl shrink-0">
            <Package size={15} className="text-primary" strokeWidth={1.7} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-muted-foreground">Stok değeri</p>
            <p className="text-sm font-semibold text-foreground mt-0.5">{item.value}</p>
          </div>
          <span className="text-[10px] text-muted-foreground">({item.code})</span>
        </div>

        <div className="bg-surface-2 border border-border rounded-2xl px-4 py-5 flex flex-col items-center gap-2 text-center">
          <CalendarDays size={24} className="text-muted-foreground/40" strokeWidth={1.3} />
          <p className="text-sm font-medium text-muted-foreground">Hareket geçmişi</p>
          <p className="text-[11px] text-muted-foreground/60 max-w-[220px] leading-relaxed">
            Detaylı stok hareketleri Depo uygulamasında veya API entegrasyonuyla görüntülenecek.
          </p>
        </div>
      </div>
    </div>
  )
}

// ── List Row ──────────────────────────────────────────────────────────────────

function KritikRow({
  item,
  warehouses,
  onSelect,
}: {
  item: StokItem
  warehouses: StokWarehouse[]
  onSelect: (item: StokItem) => void
}) {
  return (
    <button
      onClick={() => onSelect(item)}
      className="flex items-center gap-3 px-4 py-3.5 w-full text-left active:bg-surface-2 transition-colors"
    >
      <div className={cn('w-2 h-2 rounded-full shrink-0 mt-0.5', STATUS_DOT[item.status])} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          {item.code}
          <span className="mx-1 opacity-40">·</span>
          {warehouseName(item.warehouseId, warehouses)}
        </p>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <span className={cn(
          'text-sm font-bold tabular-nums',
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
    </button>
  )
}

type SortKey = 'En kritik' | 'Ada göre'

function KritikPageInner() {
  const searchParams = useSearchParams()
  const preselectedId = searchParams.get('id')

  const { data, loading } = useBossLoad(loadStokHub, {
    warehouses: STOK_WAREHOUSES,
    items: STOK_ITEMS,
    kpi: { toplamDeger: '—', kritikAdet: 0, bugunFireTutar: '—', acikSayim: 0 },
    source: 'mock',
  })

  const nonNormalItems = data.items.filter((i) => i.status !== 'normal')

  const [query,      setQuery]      = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [sort,       setSort]       = useState<SortKey>('En kritik')
  const [selected,   setSelected]   = useState<StokItem | null>(null)

  const SORTS: SortKey[] = ['En kritik', 'Ada göre']

  const filtered = useMemo(() => {
    let items = nonNormalItems.filter((i) =>
      !query || i.name.toLowerCase().includes(query.toLowerCase())
    )
    if (sort === 'En kritik') {
      const order: Record<StokItem['status'], number> = { tukendi: 0, kritik: 1, normal: 2 }
      items = [...items].sort((a, b) => order[a.status] - order[b.status])
    } else {
      items = [...items].sort((a, b) => a.name.localeCompare(b.name, 'tr'))
    }
    return items
  }, [query, sort, nonNormalItems])

  const tukendiCount = nonNormalItems.filter((i) => i.status === 'tukendi').length
  const kritikCount  = nonNormalItems.filter((i) => i.status === 'kritik').length

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
    <main className="flex flex-col h-svh bg-background overflow-hidden">
      <BossMPageHeader
        title="Kritik Stok"
        showBack
        trailing={
          <button
            onClick={() => { setSearchOpen((v) => !v); if (searchOpen) setQuery('') }}
            aria-label={searchOpen ? 'Aramayı kapat' : 'Ara'}
            className="flex items-center justify-center w-11 h-11 rounded-xl text-muted-foreground active:bg-surface-2 transition-colors"
          >
            {searchOpen ? <X size={18} /> : <Search size={18} />}
          </button>
        }
      />

      {searchOpen && (
        <div className="px-4 pb-3">
          <div className="flex items-center gap-3 bg-surface-2 border border-border rounded-xl px-4 h-11">
            <Search size={15} className="text-muted-foreground shrink-0" />
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ürün adı veya kod..."
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 outline-none"
            />
            {query && (
              <button onClick={() => setQuery('')} className="text-muted-foreground">
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <KritikSkeleton />
      ) : (
        <>
          <div className="flex gap-2 px-4 pb-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-danger/10 border border-danger/20">
              <PackageX size={12} className="text-danger" />
              <span className="text-[11px] font-semibold text-danger">{tukendiCount} tükendi</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-warning/10 border border-warning/20">
              <AlertTriangle size={12} className="text-warning" />
              <span className="text-[11px] font-semibold text-warning">{kritikCount} kritik</span>
            </div>
          </div>

          <div className="flex gap-2 px-4 pb-3">
            {SORTS.map((s) => (
              <button
                key={s}
                onClick={() => setSort(s)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors',
                  sort === s
                    ? 'bg-primary/10 border-primary/40 text-primary'
                    : 'bg-card border-border text-muted-foreground'
                )}
              >
                {s === 'En kritik'
                  ? <ArrowDownWideNarrow size={12} />
                  : <ArrowUpAZ size={12} />
                }
                {s}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto overscroll-none pb-[72px] px-4">
            {filtered.length === 0 ? (
              <BossMEmptyState
                icon={PackageX}
                title="Ürün bulunamadı"
                description="Arama kriterini değiştirin."
              />
            ) : (
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
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
