'use client'

import { useState, useMemo, useEffect } from 'react'
import { Search, X, PackageX } from 'lucide-react'
import { BossMPageHeader } from '@/components/boss/BossMPageHeader'
import { BossMEmptyState } from '@/components/boss/BossMEmptyState'
import { BossMSwitch } from '@/components/boss/BossMSwitch'
import type { Product, StockStatus } from '@/lib/boss-mock'
import { useBossLoad } from '@/hooks/use-boss-load'
import { loadCatalogPage, patchProductStockStatus } from '@/lib/boss-page-data'
import { cn } from '@/lib/utils'

// ── Status helpers ────────────────────────────────────────────────────────────
// Gerçek stok miktarı API'de yok — sayı yerine yalnızca tükendi/satışta durumu.

const STATUS_LABEL: Record<StockStatus, string> = {
  normal:  'Satışta',
  dusuk:   'Düşük',
  tukendi: 'Tükendi',
}

const STATUS_STYLE: Record<StockStatus, string> = {
  normal:  'bg-success/10 text-success',
  dusuk:   'bg-warning/10 text-warning',
  tukendi: 'bg-danger/10  text-danger',
}

const STATUS_DOT: Record<StockStatus, string> = {
  normal:  'bg-success',
  dusuk:   'bg-warning',
  tukendi: 'bg-danger',
}

// ── Product row ───────────────────────────────────────────────────────────────

function BossMProductRow({
  product,
  status,
  onToggleDepleted,
}: {
  product: Product
  status: StockStatus
  onToggleDepleted: (product: Product, depleted: boolean) => void
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      {/* Status dot */}
      <div className={cn('w-2 h-2 rounded-full shrink-0', STATUS_DOT[status])} />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium text-foreground leading-tight truncate">
            {product.name}
          </p>
          <span
            className={cn(
              'text-[10px] px-1.5 py-0.5 rounded-full font-semibold shrink-0',
              STATUS_STYLE[status]
            )}
          >
            {STATUS_LABEL[status]}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] text-muted-foreground">{product.category}</span>
          <span className="text-muted-foreground/30 text-[10px]">·</span>
          <span className="text-[10px] text-muted-foreground">{product.sku}</span>
          <span className="text-muted-foreground/30 text-[10px]">·</span>
          <span className="text-[10px] text-muted-foreground">{product.price}</span>
        </div>
      </div>

      {/* Satışta / Tükendi anahtarı */}
      <BossMSwitch
        checked={status !== 'tukendi'}
        onChange={(v) => onToggleDepleted(product, !v)}
        aria-label={status === 'tukendi' ? 'Satışa aç' : 'Tükendi işaretle'}
      />
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function BossMUrunlerPage() {
  const { data, loading } = useBossLoad(loadCatalogPage, {
    items: [],
    categories: ['Tümü'],
    products: [],
    productCategories: ['Tümü'],
    source: 'mock',
  })
  const products = data.products
  const productCategories = data.productCategories

  // Yerel geçersiz kılmalar — sunucu patch'i sonrası anlık görünüm
  const [statusOverrides, setStatusOverrides] = useState<Record<string, StockStatus>>({})
  useEffect(() => {
    setStatusOverrides({})
  }, [products])

  const [query,    setQuery]    = useState('')
  const [category, setCategory] = useState('Tümü')
  const [searchOpen, setSearchOpen] = useState(false)

  const statusOf = (p: Product): StockStatus => statusOverrides[p.id] ?? p.status

  function toggleDepleted(product: Product, depleted: boolean) {
    setStatusOverrides((prev) => ({
      ...prev,
      [product.id]: depleted ? 'tukendi' : 'normal',
    }))
    void patchProductStockStatus(product.id, product.sku, !depleted)
  }

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchCat = category === 'Tümü' || p.category === category
      const matchQ   = !query || p.name.toLowerCase().includes(query.toLowerCase())
      return matchCat && matchQ
    })
  }, [products, category, query])

  const emptyCount = products.filter((p) => statusOf(p) === 'tukendi').length

  return (
    <main className="flex min-h-0 flex-1 flex-col bg-transparent">
      {/* ── Header with inline search toggle ── */}
      <BossMPageHeader
        title="Ürün Stok"
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

      {/* ── Expandable search bar ── */}
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

      {/* ── Status summary pill ── */}
      {emptyCount > 0 && (
        <div className="flex gap-2 px-4 pb-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-danger/10 border border-danger/20">
            <PackageX size={12} className="text-danger" />
            <span className="text-[11px] font-semibold text-danger">{emptyCount} tükendi</span>
          </div>
        </div>
      )}

      {/* ── Category filter chips ── */}
      <div className="flex gap-2 px-4 pb-3 overflow-x-auto">
        {productCategories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={cn(
              'px-3 py-1.5 rounded-full border text-xs font-medium whitespace-nowrap transition-colors shrink-0',
              category === cat
                ? 'bg-primary/10 border-primary/40 text-primary'
                : 'bg-card border-border text-muted-foreground'
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* ── Product list ── */}
      <div className="flex-1 overflow-y-auto overscroll-none px-4 boss-nested-scroll">
        {loading ? (
          <div className="space-y-2 animate-pulse">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-14 bg-surface-2 rounded-2xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <BossMEmptyState
            icon={PackageX}
            title="Ürün bulunamadı"
            description={
              products.length === 0
                ? 'Ürün listesi alınamadı veya kayıt yok.'
                : 'Arama veya filtre kriterlerinizi değiştirin.'
            }
          />
        ) : (
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="flex flex-col divide-y divide-border">
              {filtered.map((product) => (
                <BossMProductRow
                  key={product.id}
                  product={product}
                  status={statusOf(product)}
                  onToggleDepleted={toggleDepleted}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
