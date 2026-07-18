'use client'

import { useState, use, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Tag, Box } from 'lucide-react'
import { BossMPageHeader } from '@/components/boss/BossMPageHeader'
import { BossMEmptyState } from '@/components/boss/BossMEmptyState'
import { MENU_ITEMS } from '@/lib/boss-mock'
import { useBossLoad } from '@/hooks/use-boss-load'
import { loadCatalogPage, patchProductStockStatus } from '@/lib/boss-page-data'
import { BossMSwitch } from '@/components/boss/BossMSwitch'
import { cn } from '@/lib/utils'

type CatalogMenuItem = (typeof MENU_ITEMS)[number] & { sku?: string }

function BossMToggleRow({
  label,
  checked,
  onChange,
  danger,
}: {
  label: string
  description?: string
  checked: boolean
  onChange: (v: boolean) => void
  danger?: boolean
}) {
  return (
    <div className="flex items-center gap-4 px-4 py-4">
      <div className="min-w-0 flex-1">
        <p className={cn('text-sm font-medium', danger && checked ? 'text-danger' : 'text-foreground')}>
          {label}
        </p>
      </div>
      <BossMSwitch checked={checked} onChange={onChange} danger={danger} aria-label={label} />
    </div>
  )
}

export default function BossMMenuDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router  = useRouter()

  const { data, loading } = useBossLoad(loadCatalogPage, {
    items: MENU_ITEMS,
    categories: ['Tümü'],
    products: [],
    productCategories: ['Tümü'],
    source: 'mock',
  })

  const base = useMemo(
    () => (data.items as CatalogMenuItem[]).find((i) => i.id === id) ?? null,
    [data.items, id],
  )

  const [price, setPrice]       = useState('')
  const [active, setActive]     = useState(true)
  const [tukendi, setTukendi]   = useState(false)
  const [saved, setSaved]       = useState(false)
  const [saving, setSaving]     = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    if (!base) return
    setPrice(String(base.price))
    setActive(base.active)
    setTukendi(base.tukendi)
  }, [base])

  if (loading) {
    return (
      <main className="flex h-screen flex-col bg-transparent">
        <BossMPageHeader title="Ürün" showBack />
        <div className="flex-1 space-y-4 px-4 py-4 animate-pulse">
          <div className="h-8 w-24 rounded-full bg-surface-2" />
          <div className="h-28 rounded-2xl bg-surface-2" />
          <div className="h-32 rounded-2xl bg-surface-2" />
        </div>
      </main>
    )
  }

  if (!base) {
    return (
      <main className="flex h-screen flex-col bg-transparent">
        <BossMPageHeader title="Ürün" showBack />
        <div className="flex flex-1 items-center justify-center px-4">
          <BossMEmptyState icon={Tag} title="Ürün bulunamadı" description="Bu ürün mevcut değil." />
        </div>
      </main>
    )
  }

  async function handleSave() {
    setSaving(true)
    setSaveError(null)
    const code = base!.sku || base!.id.slice(0, 8)
    const ok = await patchProductStockStatus(base!.id, code, !tukendi)
    setSaving(false)
    if (!ok) {
      setSaveError('Kayıt başarısız')
      return
    }
    setSaved(true)
    setTimeout(() => { setSaved(false); router.back() }, 900)
  }

  const rawPrice = parseInt(price.replace(/\D/g, ''), 10)
  const valid    = !isNaN(rawPrice) && rawPrice > 0

  return (
    <main className="flex h-screen flex-col bg-transparent">
      <BossMPageHeader title={base.name} showBack />

      <div className="flex-1 overflow-y-auto overscroll-none pb-28">
        <div className="px-4 pb-4 pt-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/90 px-2.5 py-1 text-xs text-muted-foreground">
            <Tag size={10} />
            {base.category}
          </span>
        </div>

        <section className="mb-3 px-4">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Fiyat
          </p>
          <div className="rounded-2xl border border-border bg-card/90 px-4 py-3.5">
            <label className="mb-2 block text-xs text-muted-foreground">Satış fiyatı</label>
            <div className="flex h-12 items-center gap-2 rounded-xl border border-border bg-surface-2 px-4">
              <span className="text-lg font-bold text-muted-foreground">₺</span>
              <input
                type="text"
                inputMode="decimal"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                onFocus={(e) => {
                  requestAnimationFrame(() => {
                    e.currentTarget.scrollIntoView({ block: 'center', behavior: 'smooth' })
                  })
                }}
                placeholder="0"
                className="flex-1 bg-transparent text-right text-2xl font-bold tabular-nums text-foreground outline-none placeholder:text-muted-foreground/30"
              />
            </div>
          </div>
        </section>

        {base.stock !== null && (
          <section className="px-4 mb-3">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
              Anlık Stok
            </p>
            <div className="bg-card border border-border rounded-2xl px-4 py-3.5 flex items-center gap-3">
              <Box size={16} className="text-muted-foreground shrink-0" />
              <span className="text-sm text-muted-foreground">Mevcut stok:</span>
              <span className={cn(
                'text-sm font-bold tabular-nums',
                base.stock === 0 ? 'text-danger' : base.stock < 10 ? 'text-warning' : 'text-success'
              )}>
                {base.stock} adet
              </span>
              <span className="text-xs text-muted-foreground ml-auto">(Stok → Ürünler&apos;den düzenlenir)</span>
            </div>
          </section>
        )}

        <section className="px-4 mb-3">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
            Durum
          </p>
          <div className="bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border">
            <BossMToggleRow
              label="Ürün aktif"
              description="Menüde görünür ve sipariş alınabilir"
              checked={active}
              onChange={setActive}
            />
            <BossMToggleRow
              label="Tükendi (86)"
              description="Müşterilere gösterilir ama sipariş alınamaz"
              checked={tukendi}
              onChange={(v) => { setTukendi(v); if (v) setActive(false) }}
              danger
            />
          </div>
        </section>

        {saveError && (
          <p className="px-4 text-sm text-danger" role="alert">{saveError}</p>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-background/90 backdrop-blur-sm border-t border-border px-4 pt-3 pb-8">
        <button
          onClick={handleSave}
          disabled={!valid || saved || saving}
          className={cn(
            'w-full h-13 flex items-center justify-center gap-2 rounded-2xl text-sm font-bold transition-all',
            saved
              ? 'bg-success text-white'
              : valid && !saving
                ? 'bg-primary text-white active:scale-[0.98]'
                : 'bg-surface-2 text-muted-foreground'
          )}
        >
          {saved ? (
            <>
              <Check size={16} strokeWidth={2.5} />
              Kaydedildi
            </>
          ) : saving ? (
            'Kaydediliyor…'
          ) : (
            'Kaydet'
          )}
        </button>
      </div>
    </main>
  )
}
