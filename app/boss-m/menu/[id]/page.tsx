'use client'

import { useState, use, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Tag, Box } from 'lucide-react'
import { BossMPageHeader } from '@/components/boss/BossMPageHeader'
import { BossMEmptyState } from '@/components/boss/BossMEmptyState'
import { BossMMoneyInput } from '@/components/boss/BossMMoneyInput'
import { MENU_ITEMS } from '@/lib/boss-mock'
import { useBossLoad } from '@/hooks/use-boss-load'
import { useBossKeyboard } from '@/hooks/use-boss-keyboard'
import {
  loadBossProductionAreas,
  loadBossTaxRates,
  loadCatalogPage,
  loadKanallarPage,
  patchProductCatalogRow,
  type BossProductionAreaOption,
  type BossTaxRateOption,
} from '@/lib/boss-page-data'
import { formatMoneyTR, parseMoneyTR, sanitizeMoneyTyping } from '@/lib/boss-money'
import { BossMSwitch } from '@/components/boss/BossMSwitch'
import { cn } from '@/lib/utils'

type CatalogMenuItem = (typeof MENU_ITEMS)[number] & {
  sku?: string
  code?: string
  priceByService?: boolean
  servicePrices?: Record<string, { sale: string; original: string }>
  taxRateId?: string
  taxLabel?: string
  productionByService?: boolean
  productionAreasByService?: Record<string, string[]>
}

const CHANNEL_ORDER = [
  'dinein',
  'delivery',
  'takeaway',
  'self',
  'room',
  'online',
  'qr_menu',
] as const

function BossMToggleRow({
  label,
  checked,
  onChange,
  danger,
}: {
  label: string
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
  const router = useRouter()
  const { keyboardOpen } = useBossKeyboard()

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

  const [priceByService, setPriceByService] = useState(false)
  const [singlePrice, setSinglePrice] = useState('')
  const [channelPrices, setChannelPrices] = useState<Record<string, string>>({})
  const [active, setActive] = useState(true)
  const [tukendi, setTukendi] = useState(false)
  const [taxRateId, setTaxRateId] = useState('')
  const [productionAreaId, setProductionAreaId] = useState('')
  const [taxOptions, setTaxOptions] = useState<BossTaxRateOption[]>([])
  const [areaOptions, setAreaOptions] = useState<BossProductionAreaOption[]>([])
  const [channelLabels, setChannelLabels] = useState<Record<string, string>>({})
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const [taxes, areas, channels] = await Promise.all([
        loadBossTaxRates(),
        loadBossProductionAreas(),
        loadKanallarPage(),
      ])
      if (cancelled) return
      setTaxOptions(taxes)
      setAreaOptions(areas)
      const labels: Record<string, string> = {}
      for (const ch of channels.channels) {
        if (ch.enabled || CHANNEL_ORDER.includes(ch.id as (typeof CHANNEL_ORDER)[number])) {
          labels[ch.id] = ch.label
        }
      }
      // Varsayılan etiketler
      for (const code of CHANNEL_ORDER) {
        if (!labels[code]) {
          labels[code] =
            code === 'dinein'
              ? 'Masa'
              : code === 'delivery'
                ? 'Paket'
                : code === 'takeaway'
                  ? 'Gel-al'
                  : code === 'qr_menu'
                    ? 'QR menü'
                    : code
        }
      }
      setChannelLabels(labels)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!base) return
    setPriceByService(base.priceByService === true)
    setSinglePrice(sanitizeMoneyTyping(String(base.price)))
    const nextPrices: Record<string, string> = {}
    for (const code of CHANNEL_ORDER) {
      const sale = base.servicePrices?.[code]?.sale
      nextPrices[code] = sale
        ? sanitizeMoneyTyping(String(sale))
        : sanitizeMoneyTyping(String(base.price))
    }
    setChannelPrices(nextPrices)
    setActive(base.active)
    setTukendi(base.tukendi)
    setTaxRateId(base.taxRateId ?? '')
    const allAreas = base.productionAreasByService?.all
    const firstArea =
      (Array.isArray(allAreas) && allAreas[0]) ||
      Object.values(base.productionAreasByService ?? {}).flat()[0] ||
      ''
    setProductionAreaId(String(firstArea || ''))
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
    const code = base!.code || base!.sku || base!.id.slice(0, 8)
    const uuid = base!.id

    const servicePrices: Record<string, { sale: string; original: string }> = {}
    if (priceByService) {
      for (const ch of CHANNEL_ORDER) {
        const raw = parseMoneyTR(channelPrices[ch] ?? '')
        if (raw > 0) {
          const sale = formatMoneyTR(raw)
          servicePrices[ch] = { sale, original: sale }
        }
      }
    }

    const single = parseMoneyTR(singlePrice)
    const firstServiceSale = parseMoneyTR(Object.values(servicePrices)[0]?.sale)
    const primaryPrice = priceByService ? firstServiceSale || single : single
    const tax = taxOptions.find((t) => t.id === taxRateId)

    const ok = await patchProductCatalogRow({
      uuid,
      code,
      stockStatus: !tukendi,
      status: active ? 'Aktif' : 'Pasif',
      isHidden: !active,
      priceByService,
      price: formatMoneyTR(primaryPrice),
      singleOriginalPrice: formatMoneyTR(single || primaryPrice),
      ...(priceByService ? { servicePrices } : {}),
      ...(taxRateId
        ? { taxRateId, taxLabel: tax?.label ?? base!.taxLabel ?? '' }
        : {}),
      productionByService: false,
      productionAreasByService: productionAreaId
        ? { all: [productionAreaId] }
        : { all: [] },
    })

    setSaving(false)
    if (!ok) {
      setSaveError('Kayıt başarısız')
      return
    }
    setSaved(true)
    setTimeout(() => {
      setSaved(false)
      router.back()
    }, 900)
  }

  const rawSingle = parseMoneyTR(singlePrice)
  const channelOk = priceByService
    ? CHANNEL_ORDER.some((c) => parseMoneyTR(channelPrices[c] ?? '') > 0)
    : rawSingle > 0
  const valid = channelOk

  return (
    <main className="flex h-screen flex-col bg-transparent">
      <BossMPageHeader title={base.name} showBack />

      <div className="flex-1 overflow-y-auto overscroll-none pb-36">
        {!keyboardOpen && (
          <div className="px-4 pb-4 pt-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/90 px-2.5 py-1 text-xs text-muted-foreground">
              <Tag size={10} />
              {base.category}
            </span>
          </div>
        )}

        <section className="mb-3 px-4">
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Fiyat
            </p>
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <BossMSwitch
                checked={priceByService}
                onChange={setPriceByService}
                aria-label="Servise göre fiyat"
              />
              Servise göre
            </label>
          </div>

          {!priceByService ? (
            <BossMMoneyInput value={singlePrice} onChange={setSinglePrice} />
          ) : (
            <div className="space-y-2 rounded-2xl border border-border bg-card/90 p-3">
              {CHANNEL_ORDER.map((code) => (
                <div key={code} className="flex items-center gap-3">
                  <span className="w-24 shrink-0 text-xs font-medium text-muted-foreground">
                    {channelLabels[code] ?? code}
                  </span>
                  <div className="min-w-0 flex-1">
                    <BossMMoneyInput
                      value={channelPrices[code] ?? ''}
                      onChange={(v) =>
                        setChannelPrices((prev) => ({ ...prev, [code]: v }))
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {!keyboardOpen && (
          <>
            <section className="mb-3 px-4">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                KDV
              </p>
              <select
                value={taxRateId}
                onChange={(e) => setTaxRateId(e.target.value)}
                className="h-12 w-full rounded-2xl border border-border bg-card px-3 text-sm text-foreground"
              >
                <option value="">Seçin</option>
                {taxOptions.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </section>

            <section className="mb-3 px-4">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Üretim yeri
              </p>
              <select
                value={productionAreaId}
                onChange={(e) => setProductionAreaId(e.target.value)}
                className="h-12 w-full rounded-2xl border border-border bg-card px-3 text-sm text-foreground"
              >
                <option value="">Seçin</option>
                {areaOptions.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </section>
          </>
        )}

        {!keyboardOpen && base.stock !== null && (
          <section className="mb-3 px-4">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Anlık Stok
            </p>
            <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3.5">
              <Box size={16} className="shrink-0 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Mevcut stok:</span>
              <span
                className={cn(
                  'text-sm font-bold tabular-nums',
                  base.stock === 0
                    ? 'text-danger'
                    : base.stock < 10
                      ? 'text-warning'
                      : 'text-success',
                )}
              >
                {base.stock} adet
              </span>
            </div>
          </section>
        )}

        {!keyboardOpen && (
          <section className="mb-3 px-4">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Durum
            </p>
            <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
              <BossMToggleRow label="Ürün aktif" checked={active} onChange={setActive} />
              <BossMToggleRow
                label="Tükendi (86)"
                checked={tukendi}
                onChange={(v) => {
                  setTukendi(v)
                  if (v) setActive(false)
                }}
                danger
              />
            </div>
          </section>
        )}

        {saveError && (
          <p className="px-4 text-sm text-danger" role="alert">
            {saveError}
          </p>
        )}
      </div>

      <div className="boss-fixed-action-bar border-t border-border bg-background/90 px-4 pt-3 pb-3 backdrop-blur-sm">
        <button
          type="button"
          onClick={handleSave}
          disabled={!valid || saved || saving}
          className={cn(
            'flex h-13 w-full items-center justify-center gap-2 rounded-2xl text-sm font-bold transition-all',
            saved
              ? 'bg-success text-white'
              : valid && !saving
                ? 'bg-primary text-white active:scale-[0.98]'
                : 'bg-surface-2 text-muted-foreground',
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
