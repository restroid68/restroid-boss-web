'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X, ChevronRight, Eye, EyeOff, Filter, FilterX } from 'lucide-react'
import { BossMPageHeader } from '@/components/boss/BossMPageHeader'
import { BossMEmptyState } from '@/components/boss/BossMEmptyState'
import { MENU_ITEMS, MENU_CATEGORIES } from '@/lib/boss-mock'
import { useBossLoad } from '@/hooks/use-boss-load'
import { loadCatalogPage } from '@/lib/boss-page-data'
import { BossMMoneyText } from '@/components/boss/BossMMoneyText'
import { formatMoneyTR } from '@/lib/boss-money'
import { cn } from '@/lib/utils'

type StatusFilter = 'all' | 'active' | 'passive' | 'depleted'

export default function BossMMenuPage() {
  const router = useRouter()
  const { data, loading } = useBossLoad(loadCatalogPage, {
    items: MENU_ITEMS,
    categories: MENU_CATEGORIES,
    products: [],
    productCategories: MENU_CATEGORIES,
    source: 'mock',
  })
  const items = data.items
  const categories = data.categories
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('Tümü')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [searchOpen, setSearchOpen] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchCat = category === 'Tümü' || item.category === category
      const matchQ = !query || item.name.toLowerCase().includes(query.toLowerCase())
      let matchStatus = true
      if (status === 'active') matchStatus = item.active && !item.tukendi
      else if (status === 'passive') matchStatus = !item.active
      else if (status === 'depleted') matchStatus = item.tukendi
      return matchCat && matchQ && matchStatus
    })
  }, [query, category, status, items])

  const inactiveCount = items.filter((i) => !i.active).length
  const tukendiCount = items.filter((i) => i.tukendi).length
  const filtersActive = status !== 'all' || (category !== 'Tümü' && category !== '')

  function resetFilters() {
    setStatus('all')
    setCategory('Tümü')
  }

  return (
    <main className="flex min-h-0 flex-col bg-transparent">
      <BossMPageHeader
        title="Menü & Fiyat"
        showBack
        trailing={
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setFilterOpen((v) => !v)}
              aria-label="Filtrele"
              className={cn(
                'relative flex h-11 w-11 items-center justify-center rounded-xl transition-colors',
                filtersActive || filterOpen
                  ? 'bg-primary/15 text-primary'
                  : 'text-muted-foreground active:bg-surface-2',
              )}
            >
              <Filter size={18} />
              {filtersActive && (
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary" />
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setSearchOpen((v) => !v)
                if (searchOpen) setQuery('')
              }}
              aria-label={searchOpen ? 'Aramayı kapat' : 'Ara'}
              className="flex h-11 w-11 items-center justify-center rounded-xl text-muted-foreground transition-colors active:bg-surface-2"
            >
              {searchOpen ? <X size={18} /> : <Search size={18} />}
            </button>
          </div>
        }
      />

      {filterOpen && (
        <div className="mx-4 mb-3 overflow-hidden rounded-2xl border border-border bg-card/95">
          <div className="flex items-center justify-between gap-2 border-b border-sky-500/20 bg-gradient-to-r from-sky-500/15 via-card to-card px-3 py-2.5">
            <div className="flex items-center gap-2 text-sm font-semibold text-sky-100">
              <Filter size={16} />
              Filtreler
            </div>
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 px-2.5 py-1.5 text-xs font-medium text-amber-100"
            >
              <FilterX size={14} />
              Sıfırla
            </button>
          </div>
          <div className="space-y-3 p-3">
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Durum
              </p>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ['all', 'Tümü'],
                    ['active', 'Aktif'],
                    ['passive', 'Pasif'],
                    ['depleted', 'Tükendi'],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setStatus(id)}
                    className={cn(
                      'rounded-full border px-3 py-1.5 text-xs font-medium',
                      status === id
                        ? 'border-primary/40 bg-primary/15 text-primary'
                        : 'border-border bg-surface-2 text-muted-foreground',
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Kategori
              </p>
              <div className="flex max-h-28 flex-wrap gap-2 overflow-y-auto">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={cn(
                      'rounded-full border px-3 py-1.5 text-xs font-medium',
                      category === cat
                        ? 'border-primary/40 bg-primary/15 text-primary'
                        : 'border-border bg-surface-2 text-muted-foreground',
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {searchOpen && (
        <div className="px-4 pb-3">
          <div className="flex h-11 items-center gap-3 rounded-xl border border-border bg-card/90 px-4">
            <Search size={15} className="shrink-0 text-muted-foreground" />
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ürün adı..."
              className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/50"
            />
            {query && (
              <button type="button" onClick={() => setQuery('')} className="text-muted-foreground">
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      )}

      {(inactiveCount > 0 || tukendiCount > 0) && (
        <div className="flex gap-2 px-4 pb-3">
          {tukendiCount > 0 && (
            <div className="flex items-center gap-1.5 rounded-full border border-danger/20 bg-danger/10 px-2.5 py-1.5">
              <EyeOff size={11} className="text-danger" />
              <span className="text-[11px] font-semibold text-danger">{tukendiCount} tükendi</span>
            </div>
          )}
          {inactiveCount > 0 && (
            <div className="flex items-center gap-1.5 rounded-full border border-border bg-muted/20 px-2.5 py-1.5">
              <Eye size={11} className="text-muted-foreground" />
              <span className="text-[11px] font-semibold text-muted-foreground">
                {inactiveCount} pasif
              </span>
            </div>
          )}
        </div>
      )}

      {!filterOpen && (
        <div className="flex gap-2 overflow-x-auto px-4 pb-3">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={cn(
                'shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                category === cat
                  ? 'border-primary/40 bg-primary/10 text-primary'
                  : 'border-border bg-card/90 text-muted-foreground',
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto overscroll-none px-4 pb-6">
        {loading ? (
          <div className="space-y-2 animate-pulse">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-14 rounded-2xl bg-surface-2" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <BossMEmptyState
            icon={Search}
            title="Ürün bulunamadı"
            description="Arama veya filtre kriterlerinizi değiştirin."
          />
        ) : (
          <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card/90">
            {filtered.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => router.push(`/boss-m/menu/${item.id}`)}
                className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors active:bg-surface-2"
              >
                <div
                  className={cn(
                    'h-2 w-2 shrink-0 rounded-full',
                    item.tukendi
                      ? 'bg-danger'
                      : item.active
                        ? 'bg-success'
                        : 'bg-muted-foreground/30',
                  )}
                />
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      'truncate text-sm font-medium leading-tight',
                      !item.active ? 'text-muted-foreground line-through' : 'text-foreground',
                    )}
                  >
                    {item.name}
                  </p>
                  <div className="mt-0.5 flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground">{item.category}</span>
                    {item.tukendi && (
                      <span className="text-[10px] font-semibold text-danger">86&apos;landı</span>
                    )}
                    {!item.active && !item.tukendi && (
                      <span className="text-[10px] font-semibold text-muted-foreground">Pasif</span>
                    )}
                  </div>
                </div>
                <BossMMoneyText
                  amount={formatMoneyTR(item.price, item.price % 1 === 0 ? 0 : 2)}
                  className="shrink-0 text-sm"
                  amountClassName="text-foreground"
                />
                <ChevronRight size={14} className="shrink-0 text-muted-foreground" />
              </button>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
