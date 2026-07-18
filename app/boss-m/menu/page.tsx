'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X, ChevronRight, Eye, EyeOff } from 'lucide-react'
import { BossMPageHeader } from '@/components/boss/BossMPageHeader'
import { BossMEmptyState } from '@/components/boss/BossMEmptyState'
import { MENU_ITEMS, MENU_CATEGORIES } from '@/lib/boss-mock'
import { useBossLoad } from '@/hooks/use-boss-load'
import { loadCatalogPage } from '@/lib/boss-page-data'
import { cn } from '@/lib/utils'

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
  const [query, setQuery]         = useState('')
  const [category, setCategory]   = useState('Tümü')
  const [searchOpen, setSearchOpen] = useState(false)

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchCat = category === 'Tümü' || item.category === category
      const matchQ   = !query || item.name.toLowerCase().includes(query.toLowerCase())
      return matchCat && matchQ
    })
  }, [query, category, items])

  const inactiveCount = items.filter((i) => !i.active).length
  const tukendiCount  = items.filter((i) => i.tukendi).length

  return (
    <main className="flex flex-col h-screen bg-background">
      <BossMPageHeader
        title="Menü & Fiyat"
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

      {/* Search bar */}
      {searchOpen && (
        <div className="px-4 pb-3">
          <div className="flex items-center gap-3 bg-surface-2 border border-border rounded-xl px-4 h-11">
            <Search size={15} className="text-muted-foreground shrink-0" />
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ürün adı..."
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

      {/* Summary pills */}
      {(inactiveCount > 0 || tukendiCount > 0) && (
        <div className="flex gap-2 px-4 pb-3">
          {tukendiCount > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-danger/10 border border-danger/20">
              <EyeOff size={11} className="text-danger" />
              <span className="text-[11px] font-semibold text-danger">{tukendiCount} tükendi</span>
            </div>
          )}
          {inactiveCount > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-muted/20 border border-border">
              <Eye size={11} className="text-muted-foreground" />
              <span className="text-[11px] font-semibold text-muted-foreground">{inactiveCount} pasif</span>
            </div>
          )}
        </div>
      )}

      {/* Category chips */}
      <div className="flex gap-2 px-4 pb-3 overflow-x-auto">
        {categories.map((cat) => (
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

      {/* List */}
      <div className="flex-1 overflow-y-auto overscroll-none px-4 pb-6">
        {loading ? (
          <div className="space-y-2 animate-pulse">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-14 bg-surface-2 rounded-2xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <BossMEmptyState icon={Search} title="Ürün bulunamadı" description="Arama veya filtre kriterlerinizi değiştirin." />
        ) : (
          <div className="bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border">
            {filtered.map((item) => (
              <button
                key={item.id}
                onClick={() => router.push(`/boss-m/menu/${item.id}`)}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-surface-2 transition-colors"
              >
                {/* Active indicator dot */}
                <div
                  className={cn(
                    'w-2 h-2 rounded-full shrink-0',
                    item.tukendi ? 'bg-danger' : item.active ? 'bg-success' : 'bg-muted-foreground/30'
                  )}
                />

                {/* Name + category */}
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    'text-sm font-medium leading-tight truncate',
                    !item.active ? 'text-muted-foreground line-through' : 'text-foreground'
                  )}>
                    {item.name}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-muted-foreground">{item.category}</span>
                    {item.tukendi && (
                      <span className="text-[10px] font-semibold text-danger">86&apos;landı</span>
                    )}
                    {!item.active && !item.tukendi && (
                      <span className="text-[10px] font-semibold text-muted-foreground">Pasif</span>
                    )}
                  </div>
                </div>

                {/* Price */}
                <span className="text-sm font-bold text-foreground tabular-nums shrink-0">
                  ₺{item.price}
                </span>

                <ChevronRight size={14} className="text-muted-foreground shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
