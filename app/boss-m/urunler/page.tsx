'use client'

import { useState, useMemo, useEffect } from 'react'
import {
  Search,
  X,
  Plus,
  Minus,
  PackageX,
  PackageOpen,
} from 'lucide-react'
import { BossMPageHeader } from '@/components/boss/BossMPageHeader'
import { BossMEmptyState } from '@/components/boss/BossMEmptyState'
import { PRODUCTS, PRODUCT_CATEGORIES } from '@/lib/boss-mock'
import type { Product, StockStatus } from '@/lib/boss-mock'
import { useBossLoad } from '@/hooks/use-boss-load'
import { loadCatalogPage, patchProductStockStatus } from '@/lib/boss-page-data'
import { cn } from '@/lib/utils'

// ── Status helpers ────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<StockStatus, string> = {
  normal:  'Normal',
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

function deriveStatus(p: Product): StockStatus {
  if (p.stock === 0) return 'tukendi'
  if (p.stock < p.minStock) return 'dusuk'
  return 'normal'
}

// ── Product row ───────────────────────────────────────────────────────────────

function BossMProductRow({
  product,
  onAdjust,
}: {
  product: Product & { _stock: number }
  onAdjust: (id: string, delta: number) => void
}) {
  const status = deriveStatus({ ...product, stock: product._stock })

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

      {/* Quick stock adjuster */}
      <div className="flex items-center gap-0 bg-surface-2 rounded-xl overflow-hidden shrink-0">
        <button
          onClick={() => onAdjust(product.id, -1)}
          disabled={product._stock === 0}
          aria-label="Stok azalt"
          className="flex items-center justify-center w-9 h-9 text-muted-foreground active:bg-surface-3 disabled:opacity-30 transition-colors"
        >
          <Minus size={13} strokeWidth={2.5} />
        </button>

        <span
          className={cn(
            'w-10 text-center text-sm font-bold tabular-nums',
            status === 'tukendi' ? 'text-danger' : status === 'dusuk' ? 'text-warning' : 'text-foreground'
          )}
        >
          {product._stock}
        </span>

        <button
          onClick={() => onAdjust(product.id, +1)}
          aria-label="Stok artır"
          className="flex items-center justify-center w-9 h-9 text-muted-foreground active:bg-surface-3 transition-colors"
        >
          <Plus size={13} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function BossMUrunlerPage() {
  const { data, loading } = useBossLoad(loadCatalogPage, {
    items: [],
    categories: PRODUCT_CATEGORIES,
    products: PRODUCTS,
    productCategories: PRODUCT_CATEGORIES,
    source: 'mock',
  })
  const products = data.products
  const productCategories = data.productCategories

  const [stocks, setStocks] = useState<Record<string, number>>({})
  useEffect(() => {
    setStocks(Object.fromEntries(products.map((p) => [p.id, p.stock])))
  }, [products])

  const [query,    setQuery]    = useState('')
  const [category, setCategory] = useState('Tümü')
  const [searchOpen, setSearchOpen] = useState(false)

  function adjustStock(id: string, delta: number) {
    setStocks((prev) => {
      const next = Math.max(0, (prev[id] ?? 0) + delta)
      const product = products.find((p) => p.id === id)
      if (product) {
        const wasEmpty = (prev[id] ?? 0) === 0
        const nowEmpty = next === 0
        if (wasEmpty !== nowEmpty) {
          void patchProductStockStatus(id, product.sku, !nowEmpty)
        }
      }
      return { ...prev, [id]: next }
    })
  }

  const augmented = useMemo(
    () => products.map((p) => ({ ...p, _stock: stocks[p.id] ?? p.stock })),
    [stocks, products]
  )

  const filtered = useMemo(() => {
    return augmented.filter((p) => {
      const matchCat = category === 'Tümü' || p.category === category
      const matchQ   = !query || p.name.toLowerCase().includes(query.toLowerCase())
      return matchCat && matchQ
    })
  }, [augmented, category, query])

  // Summary counts
  const lowCount     = augmented.filter((p) => deriveStatus({ ...p, stock: p._stock }) === 'dusuk').length
  const emptyCount   = augmented.filter((p) => p._stock === 0).length

  return (
    <main className="flex flex-col h-screen bg-background">
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

      {/* ── Status summary pills ── */}
      {(lowCount > 0 || emptyCount > 0) && (
        <div className="flex gap-2 px-4 pb-3">
          {emptyCount > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-danger/10 border border-danger/20">
              <PackageX size={12} className="text-danger" />
              <span className="text-[11px] font-semibold text-danger">{emptyCount} tükendi</span>
            </div>
          )}
          {lowCount > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-warning/10 border border-warning/20">
              <PackageOpen size={12} className="text-warning" />
              <span className="text-[11px] font-semibold text-warning">{lowCount} düşük stok</span>
            </div>
          )}
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
      <div className="flex-1 overflow-y-auto overscroll-none px-4 pb-4">
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
            description="Arama veya filtre kriterlerinizi değiştirin."
          />
        ) : (
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="flex flex-col divide-y divide-border">
              {filtered.map((product) => (
                <BossMProductRow
                  key={product.id}
                  product={product}
                  onAdjust={adjustStock}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
