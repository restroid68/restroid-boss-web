'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Check,
  ChevronDown,
  ChevronUp,
  ImagePlus,
  Plus,
  Tag,
  Trash2,
} from 'lucide-react'
import { BossMPageHeader } from '@/components/boss/BossMPageHeader'
import { BossMEmptyState } from '@/components/boss/BossMEmptyState'
import { BossMMoneyInput } from '@/components/boss/BossMMoneyInput'
import { BossMSearchCreate } from '@/components/boss/BossMSearchCreate'
import { BossMSwitch } from '@/components/boss/BossMSwitch'
import { useBossLoad } from '@/hooks/use-boss-load'
import { useBossKeyboard } from '@/hooks/use-boss-keyboard'
import { BOSS_TTL } from '@/lib/boss-page-cache'
import { parseMoneyTR, sanitizeMoneyTyping } from '@/lib/boss-money'
import { cn } from '@/lib/utils'
import {
  CHANNEL_ORDER,
  deleteBossProductGalleryImage,
  describeBossPluError,
  isDisallowedSizeRatioOne,
  loadProductCatalogRow,
  loadProductEditorLookups,
  mapUnitToLabel,
  mapUnitToStorage,
  moneyForSave,
  moveId,
  parseAreasByService,
  parseBoolMap,
  parseDisplayTagLabels,
  parseGallery,
  parseServicePrices,
  parseSizeRows,
  parseStringList,
  previewImageUrl,
  productKindOf,
  sanitizeBossPlu,
  saveProductCatalogRow,
  toggleId,
  uploadBossProductGalleryImage,
  uploadBossProductMainImage,
  type BossProductEditorLookups,
  type BossProductKind,
  type BossProductRow,
  type BossSizeRow,
} from '@/lib/boss-product-editor'

const FIELD =
  'h-12 w-full rounded-2xl border border-border bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none'
const AREA =
  'min-h-[88px] w-full resize-none rounded-2xl border border-border bg-card px-3 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none'

const EMPTY_LOOKUPS: BossProductEditorLookups = {
  taxes: [],
  areas: [],
  categories: [],
  menuGroups: [],
  preferenceGroups: [],
  allergens: [],
  channelLabels: {},
  visibleChannelIds: [...CHANNEL_ORDER],
}

function digitsOnly(raw: string, maxLen = 8): string {
  return raw.replace(/\D/g, '').slice(0, maxLen)
}

function Chip({
  on,
  children,
  onClick,
}: {
  on: boolean
  children: React.ReactNode
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex !min-h-8 !min-w-0 shrink-0 items-center rounded-full border px-3 py-1.5 text-xs font-medium',
        on ? 'border-primary/50 bg-primary/15 text-primary' : 'border-border bg-card text-muted-foreground',
      )}
    >
      {children}
    </button>
  )
}

function Section({
  id,
  title,
  action,
  children,
}: {
  id: string
  title: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section id={id} className="mb-3 px-4 scroll-mt-14">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{title}</p>
        {action}
      </div>
      {children}
    </section>
  )
}

function ToggleRow({
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
      <p className={cn('min-w-0 flex-1 text-sm font-medium', danger && checked ? 'text-danger' : 'text-foreground')}>
        {label}
      </p>
      <BossMSwitch checked={checked} onChange={onChange} danger={danger} aria-label={label} />
    </div>
  )
}

function CompactMoney({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <BossMMoneyInput
      value={value}
      onChange={onChange}
      className="h-12"
      inputClassName="px-3 text-lg font-semibold"
    />
  )
}

function newSizeRow(): BossSizeRow {
  return {
    key: `sz-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: '',
    plu: '',
    ratio: '0.5',
    price: '',
    status: 'Göster',
    servicePrices: {},
  }
}

type NavKey =
  | 'genel'
  | 'fiyat'
  | 'kdv'
  | 'uretim'
  | 'medya'
  | 'detay'
  | 'boyut'
  | 'alerjen'
  | 'menu'
  | 'tercih'
  | 'durum'

export function BossMProductEditor({ uuid }: { uuid: string }) {
  const router = useRouter()
  const { keyboardOpen } = useBossKeyboard()
  const mainFileRef = useRef<HTMLInputElement>(null)
  const galleryFileRef = useRef<HTMLInputElement>(null)
  const hydratedUuid = useRef<string | null>(null)

  const { data: row, loading: rowLoading } = useBossLoad(
    () => loadProductCatalogRow(uuid),
    null,
    { cacheKey: `page:product-row:${uuid}` },
  )
  const { data: lookups, loading: lookupLoading } = useBossLoad(
    loadProductEditorLookups,
    EMPTY_LOOKUPS,
    { cacheKey: 'page:product-editor-lookups', persist: true, ttlMs: BOSS_TTL.definitions },
  )

  const [original, setOriginal] = useState<BossProductRow | null>(null)
  const [kind, setKind] = useState<BossProductKind>('item')
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [barcode, setBarcode] = useState('')
  const [sortOrder, setSortOrder] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [unitLabel, setUnitLabel] = useState<'Adet' | 'Ağırlık'>('Adet')
  const [priceByService, setPriceByService] = useState(false)
  const [singlePrice, setSinglePrice] = useState('')
  const [singleOriginal, setSingleOriginal] = useState('')
  const [channelSale, setChannelSale] = useState<Record<string, string>>({})
  const [channelOriginal, setChannelOriginal] = useState<Record<string, string>>({})
  const [openPriced, setOpenPriced] = useState(false)
  const [openMin, setOpenMin] = useState('')
  const [openMax, setOpenMax] = useState('')
  const [taxRateId, setTaxRateId] = useState('')
  const [productionByService, setProductionByService] = useState(false)
  const [areasAll, setAreasAll] = useState<string[]>([])
  const [areasByChannel, setAreasByChannel] = useState<Record<string, string[]>>({})
  const [salesOn, setSalesOn] = useState(true)
  const [hidden, setHidden] = useState(false)
  const [tukendi, setTukendi] = useState(false)
  const [salesModeByService, setSalesModeByService] = useState(false)
  const [salesEnabled, setSalesEnabled] = useState<Record<string, boolean>>({})
  const [timeRestricted, setTimeRestricted] = useState(false)
  const [timeStart, setTimeStart] = useState('')
  const [timeEnd, setTimeEnd] = useState('')
  const [timeServices, setTimeServices] = useState<Record<string, boolean>>({})
  const [prepMinutes, setPrepMinutes] = useState('')
  const [calorie, setCalorie] = useState('')
  const [shortDescription, setShortDescription] = useState('')
  const [longDescription, setLongDescription] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [tagLabels, setTagLabels] = useState<string[]>([])
  const [tagDraft, setTagDraft] = useState('')
  const [menuGroupIds, setMenuGroupIds] = useState<string[]>([])
  const [preferenceIds, setPreferenceIds] = useState<string[]>([])
  const [allergenIds, setAllergenIds] = useState<string[]>([])
  const [noAllergens, setNoAllergens] = useState(false)
  const [sizeRows, setSizeRows] = useState<BossSizeRow[]>([])
  const [customSizeEnabled, setCustomSizeEnabled] = useState(false)
  const [standardSizeName, setStandardSizeName] = useState('')
  const [weightMin, setWeightMin] = useState('')
  const [weightMax, setWeightMax] = useState('')
  const [weightStep, setWeightStep] = useState('')
  const [preview, setPreview] = useState('')
  const [gallery, setGallery] = useState<{ id: string; thumb: string; large: string }[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [mediaBusy, setMediaBusy] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    if (!row) return
    if (hydratedUuid.current === uuid) return
    hydratedUuid.current = uuid
    setOriginal(row)
    const k = productKindOf(row)
    setKind(k)
    setName(String(row.name ?? ''))
    setCode(sanitizeBossPlu(String(row.code ?? '')))
    setBarcode(String(row.barcode ?? ''))
    setSortOrder(row.sortOrder != null && String(row.sortOrder).trim() !== '' ? String(row.sortOrder) : '')
    setCategoryId(String(row.categoryId ?? ''))
    setUnitLabel(k === 'menu' ? 'Adet' : mapUnitToLabel(String(row.type ?? '')))
    const bySvc = row.priceByService === true
    setPriceByService(bySvc)
    setSinglePrice(sanitizeMoneyTyping(String(row.price ?? '')))
    setSingleOriginal(sanitizeMoneyTyping(String(row.singleOriginalPrice ?? '')))
    const sp = parseServicePrices(row.servicePrices)
    const sale: Record<string, string> = {}
    const orig: Record<string, string> = {}
    const base = sanitizeMoneyTyping(String(row.price ?? ''))
    for (const ch of CHANNEL_ORDER) {
      sale[ch] = sanitizeMoneyTyping(sp[ch]?.sale || base)
      orig[ch] = sanitizeMoneyTyping(sp[ch]?.original || sp[ch]?.sale || '')
    }
    setChannelSale(sale)
    setChannelOriginal(orig)
    setOpenPriced(row.openPriced === true)
    setOpenMin(sanitizeMoneyTyping(String(row.openPriceMin ?? '')))
    setOpenMax(sanitizeMoneyTyping(String(row.openPriceMax ?? '')))
    setTaxRateId(String(row.taxRateId ?? ''))
    setProductionByService(row.productionByService === true)
    const areas = parseAreasByService(row.productionAreasByService)
    setAreasAll(areas.all ?? [])
    setAreasByChannel(areas)
    setSalesOn(String(row.status ?? 'Aktif') !== 'Pasif')
    setHidden(row.isHidden === true)
    setTukendi(row.stockStatus === false)
    setSalesModeByService(row.salesModeByService === true)
    const se = parseBoolMap(row.salesEnabledByService)
    const seNext: Record<string, boolean> = {}
    for (const ch of CHANNEL_ORDER) seNext[ch] = se[ch] !== false
    setSalesEnabled(seNext)
    setTimeRestricted(row.timeRestricted === true)
    setTimeStart(String(row.timeStart ?? ''))
    setTimeEnd(String(row.timeEnd ?? ''))
    const ts = parseBoolMap(row.timeRestrictServices)
    const tsNext: Record<string, boolean> = {}
    for (const ch of CHANNEL_ORDER) tsNext[ch] = ts[ch] !== false
    setTimeServices(tsNext)
    setPrepMinutes(row.preparationMinutes != null ? String(row.preparationMinutes) : '')
    setCalorie(row.calorie != null ? String(row.calorie) : '')
    setShortDescription(String(row.shortDescription ?? ''))
    setLongDescription(String(row.longDescription ?? ''))
    setVideoUrl(String(row.videoUrl ?? ''))
    setTagLabels(parseDisplayTagLabels(row.displayTags))
    setMenuGroupIds(parseStringList(row.menuOptionUuids))
    const prefs = parseStringList(row.preferenceGroupUuids)
    setPreferenceIds(prefs.length ? prefs : parseStringList(row.modifierUuids))
    const algs = parseStringList(row.allergenDefinitionIds)
    setAllergenIds(algs)
    setNoAllergens(algs.length === 0)
    setSizeRows(parseSizeRows(row.sizeRows))
    setCustomSizeEnabled(row.customSizeEnabled === true)
    setStandardSizeName(String(row.standardSizeName ?? ''))
    setWeightMin(row.weightSaleMinGrams != null ? String(row.weightSaleMinGrams) : '')
    setWeightMax(row.weightSaleMaxGrams != null ? String(row.weightSaleMaxGrams) : '')
    setWeightStep(row.weightSaleStepGrams != null ? String(row.weightSaleStepGrams) : '')
    setPreview(previewImageUrl(row))
    setGallery(parseGallery(row))
  }, [row])

  const loading = rowLoading || lookupLoading
  const isMenu = kind === 'menu'
  const isMass = !isMenu && mapUnitToStorage(unitLabel) === 'mass'
  const channels = lookups.visibleChannelIds
  const categoryLabel =
    lookups.categories.find((c) => c.id === categoryId)?.label || String(original?.category ?? '')

  const nav: { key: NavKey; label: string; show: boolean }[] = [
    { key: 'genel', label: 'Genel', show: true },
    { key: 'fiyat', label: 'Fiyat', show: true },
    { key: 'kdv', label: 'KDV', show: true },
    { key: 'uretim', label: 'Üretim', show: !isMenu },
    { key: 'medya', label: 'Medya', show: true },
    { key: 'detay', label: 'Detay', show: true },
    { key: 'boyut', label: 'Boyut', show: !isMenu && !isMass },
    { key: 'alerjen', label: 'Alerjen', show: !isMenu },
    { key: 'menu', label: 'Menü seçim', show: isMenu },
    { key: 'tercih', label: 'Tercih', show: !isMenu },
    { key: 'durum', label: 'Durum', show: true },
  ]

  const mediaCount = (preview ? 1 : 0) + gallery.length
  const canAddMedia = mediaCount < 5 && Boolean(sanitizeBossPlu(code))

  const rawSingle = parseMoneyTR(singlePrice)
  const channelOk = priceByService
    ? channels.some((c) => parseMoneyTR(channelSale[c] ?? '') > 0)
    : rawSingle > 0 || openPriced
  const valid = Boolean(name.trim()) && Boolean(categoryLabel) && Boolean(sanitizeBossPlu(code)) && channelOk

  const stockText = useMemo(() => {
    const s = String(original?.stock ?? '').trim()
    if (!s || s === '—' || s === '-') return null
    return s
  }, [original])

  async function refreshMediaFromServer() {
    const fresh = await loadProductCatalogRow(uuid)
    if (!fresh) return
    setOriginal(fresh)
    setPreview(previewImageUrl(fresh))
    setGallery(parseGallery(fresh))
  }

  async function handleMainFile(file: File | undefined) {
    if (!file || !original) return
    setMediaBusy(true)
    setSaveError(null)
    const res = await uploadBossProductMainImage({ uuid, code: sanitizeBossPlu(code), file })
    if (!res.ok) {
      setMediaBusy(false)
      setSaveError(res.error)
      return
    }
    await refreshMediaFromServer()
    setMediaBusy(false)
  }

  async function handleGalleryFile(file: File | undefined) {
    if (!file || !original) return
    setMediaBusy(true)
    setSaveError(null)
    const res = await uploadBossProductGalleryImage({ uuid, code: sanitizeBossPlu(code), file })
    if (!res.ok) {
      setMediaBusy(false)
      setSaveError(res.error)
      return
    }
    await refreshMediaFromServer()
    setMediaBusy(false)
  }

  async function handleDeleteGallery(galleryId: string) {
    if (!original) return
    setMediaBusy(true)
    setSaveError(null)
    const res = await deleteBossProductGalleryImage({
      uuid,
      code: sanitizeBossPlu(code),
      galleryId,
    })
    if (!res.ok) {
      setMediaBusy(false)
      setSaveError(res.error)
      return
    }
    await refreshMediaFromServer()
    setMediaBusy(false)
  }

  function toggleArea(list: string[], id: string, setter: (next: string[]) => void) {
    setter(toggleId(list, id))
  }

  async function handleSave() {
    if (!original) return
    const pluErr = describeBossPluError(code)
    if (pluErr) {
      setSaveError(pluErr)
      return
    }
    if (!name.trim()) {
      setSaveError('Ürün adı zorunlu.')
      return
    }
    const cat = lookups.categories.find((c) => c.id === categoryId)
    const categoryName = cat?.name || String(original.category ?? '').trim()
    if (!categoryName) {
      setSaveError('Kategori zorunlu.')
      return
    }
    const tax = lookups.taxes.find((t) => t.id === taxRateId) ?? lookups.taxes[0]
    if (!tax) {
      setSaveError('Vergi oranı zorunlu.')
      return
    }

    const sized = isMenu || isMass ? [] : sizeRows.filter((s) => s.name.trim())
    if (!isMenu && !isMass) {
      if (sized.some((s) => !s.name.trim())) {
        setSaveError('Boyut adı zorunludur.')
        return
      }
      if (sized.some((s) => isDisallowedSizeRatioOne(s.ratio))) {
        setSaveError('Boyut çarpanı 1 olamaz.')
        return
      }
      const main = sanitizeBossPlu(code)
      if (sized.some((s) => sanitizeBossPlu(s.plu) && sanitizeBossPlu(s.plu) === main)) {
        setSaveError('Boyut PLU, ana ürün PLU ile aynı olamaz.')
        return
      }
    }

    setSaving(true)
    setSaveError(null)

    const servicePrices: Record<string, { sale: string; original: string }> = {}
    if (priceByService) {
      for (const ch of channels) {
        const saleN = parseMoneyTR(channelSale[ch] ?? '')
        if (saleN <= 0) continue
        const origN = parseMoneyTR(channelOriginal[ch] ?? '')
        const sale = moneyForSave(saleN)
        servicePrices[ch] = { sale, original: origN > 0 ? moneyForSave(origN) : sale }
      }
    }

    const single = parseMoneyTR(singlePrice)
    const firstServiceSale = parseMoneyTR(Object.values(servicePrices)[0]?.sale)
    const primaryPrice = priceByService ? firstServiceSale || single : single
    const origN = parseMoneyTR(singleOriginal)

    const productionAreasByService = isMenu
      ? {}
      : productionByService
        ? Object.fromEntries(channels.map((ch) => [ch, areasByChannel[ch] ?? []]))
        : { all: areasAll }

    const salesEnabledByService = salesModeByService
      ? Object.fromEntries(channels.map((ch) => [ch, salesEnabled[ch] !== false]))
      : undefined

    const prefs = isMenu ? [] : preferenceIds
    const payload: BossProductRow = {
      ...original,
      uuid,
      name: name.trim(),
      code: sanitizeBossPlu(code),
      barcode: barcode.trim() || undefined,
      categoryId: categoryId || undefined,
      category: categoryName,
      type: isMenu ? 'piece' : mapUnitToStorage(unitLabel),
      sortOrder: sortOrder.trim() ? Number(sortOrder) : null,
      productType: kind,
      status: salesOn ? 'Aktif' : 'Pasif',
      stockStatus: !tukendi,
      isHidden: hidden,
      priceByService,
      price: moneyForSave(primaryPrice),
      singleOriginalPrice: priceByService ? undefined : origN > 0 ? moneyForSave(origN) : undefined,
      ...(priceByService ? { servicePrices } : { servicePrices: undefined }),
      openPriced,
      openPriceMin: openPriced && parseMoneyTR(openMin) > 0 ? moneyForSave(parseMoneyTR(openMin)) : undefined,
      openPriceMax: openPriced && parseMoneyTR(openMax) > 0 ? moneyForSave(parseMoneyTR(openMax)) : undefined,
      taxRateId: tax.id,
      taxLabel: tax.label,
      productionByService: isMenu ? false : productionByService,
      productionAreasByService,
      salesModeByService,
      salesEnabledByService,
      timeRestricted,
      timeStart: timeRestricted ? timeStart : '',
      timeEnd: timeRestricted ? timeEnd : '',
      timeRestrictServices: timeRestricted ? timeServices : undefined,
      shortDescription: shortDescription.trim() || undefined,
      longDescription: longDescription.trim() || undefined,
      videoUrl: videoUrl.trim() || undefined,
      displayTags: tagLabels.filter(Boolean).map((label) => ({ label })),
      menuOptionUuids: isMenu ? menuGroupIds : [],
      preferenceGroupUuids: prefs,
      modifierUuids: prefs,
      preparationMinutes: isMenu ? null : prepMinutes ? Number(prepMinutes) : null,
      calorie: isMenu ? null : calorie ? Number(calorie) : null,
      allergenDefinitionIds: isMenu ? [] : noAllergens ? [] : allergenIds,
      customSizeEnabled: isMenu || isMass ? false : customSizeEnabled,
      standardSizeName: isMenu || isMass ? undefined : standardSizeName.trim() || undefined,
      sizeRows: sized.map((s) => {
        const sizeServicePrices: Record<string, { sale: string }> = {}
        if (priceByService) {
          for (const ch of channels) {
            const n = parseMoneyTR(s.servicePrices[ch] ?? '')
            if (n > 0) sizeServicePrices[ch] = { sale: moneyForSave(n) }
          }
        }
        return {
          name: s.name.trim(),
          plu: sanitizeBossPlu(s.plu),
          ratio: s.ratio.trim() || '0.5',
          price: parseMoneyTR(s.price) > 0 ? moneyForSave(parseMoneyTR(s.price)) : s.price,
          status: s.status,
          ...(Object.keys(sizeServicePrices).length > 0 ? { servicePrices: sizeServicePrices } : {}),
        }
      }),
      ...(isMass
        ? {
            weightSaleMinGrams: weightMin ? Number(weightMin) : null,
            weightSaleMaxGrams: weightMax ? Number(weightMax) : null,
            weightSaleStepGrams: weightStep ? Number(weightStep) : null,
          }
        : {}),
      stockLinkMode: original.stockLinkMode,
      stockLinkWarehouse: original.stockLinkWarehouse,
      productionFinishedProductId: original.productionFinishedProductId,
      recipeDefinitionId: original.recipeDefinitionId,
      recipeRows: original.recipeRows,
    }

    const previousPlu = sanitizeBossPlu(String(original.code ?? ''))
    const nextPlu = sanitizeBossPlu(code)
    const res = await saveProductCatalogRow(payload, {
      replaceProductCode: previousPlu && previousPlu !== nextPlu ? previousPlu : undefined,
    })
    setSaving(false)
    if (!res.ok) {
      setSaveError(res.error || 'Kayıt başarısız')
      return
    }
    setSaved(true)
    window.setTimeout(() => {
      setSaved(false)
      router.back()
    }, 900)
  }

  if (loading) {
    return (
      <main className="flex min-h-0 flex-1 flex-col bg-transparent">
        <BossMPageHeader title="Ürün" showBack />
        <div className="flex-1 space-y-4 px-4 py-4 animate-pulse">
          <div className="h-8 w-24 rounded-full bg-surface-2" />
          <div className="h-28 rounded-2xl bg-surface-2" />
          <div className="h-32 rounded-2xl bg-surface-2" />
        </div>
      </main>
    )
  }

  if (!original) {
    return (
      <main className="flex min-h-0 flex-1 flex-col bg-transparent">
        <BossMPageHeader title="Ürün" showBack />
        <div className="flex flex-1 items-center justify-center px-4">
          <BossMEmptyState icon={Tag} title="Ürün bulunamadı" description="Bu ürün mevcut değil." />
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-0 flex-1 flex-col bg-transparent">
      <BossMPageHeader title={name.trim() || 'Ürün'} showBack />

      <div className="flex-1 overflow-y-auto overscroll-none pb-36">
        {!keyboardOpen && (
          <div className="sticky top-0 z-20 bg-background/90 px-4 py-2 backdrop-blur-sm">
            <div
              className="flex min-w-0 max-w-full gap-2 overflow-x-auto"
              style={{ touchAction: 'pan-x' }}
            >
              {nav
                .filter((n) => n.show)
                .map((n) => (
                  <button
                    key={n.key}
                    type="button"
                    onClick={() =>
                      document.getElementById(`sec-${n.key}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    }
                    className="flex !min-h-8 !min-w-0 shrink-0 items-center rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground"
                  >
                    {n.label}
                  </button>
                ))}
            </div>
          </div>
        )}

        <Section
          id="sec-genel"
          title="Genel"
          action={
            <span className="rounded-full border border-border bg-card px-2.5 py-1 text-[11px] text-muted-foreground">
              {isMenu ? 'Menü' : 'Tek ürün'}
            </span>
          }
        >
          <div className="space-y-3">
            <input
              className={FIELD}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ürün adı"
            />
            <BossMSearchCreate
              items={lookups.categories.map((c) => ({ id: c.id, label: c.label }))}
              valueId={categoryId}
              valueLabel={categoryLabel}
              placeholder="Kategori"
              onSelect={(item) => setCategoryId(item.id)}
            />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Birim
                </p>
                <select
                  value={unitLabel}
                  disabled
                  onChange={(e) => setUnitLabel(e.target.value === 'Ağırlık' ? 'Ağırlık' : 'Adet')}
                  className={FIELD}
                >
                  <option value="Adet">Adet</option>
                  <option value="Ağırlık">Ağırlık</option>
                </select>
              </div>
              <div>
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Sıra
                </p>
                <input
                  className={cn(FIELD, 'text-right tabular-nums')}
                  inputMode="numeric"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(digitsOnly(e.target.value, 6))}
                  placeholder="0"
                />
              </div>
            </div>
          </div>
        </Section>

        <Section
          id="sec-fiyat"
          title="Fiyat"
          action={
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <BossMSwitch
                checked={priceByService}
                onChange={setPriceByService}
                aria-label="Servise göre fiyat"
              />
              Servise göre
            </label>
          }
        >
          {!priceByService ? (
            <div className="space-y-2">
              <BossMMoneyInput value={singlePrice} onChange={setSinglePrice} />
              <div>
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  İndirimsiz
                </p>
                <CompactMoney value={singleOriginal} onChange={setSingleOriginal} />
              </div>
            </div>
          ) : (
            <div className="space-y-2 rounded-2xl border border-border bg-card/90 p-3">
              {channels.map((ch) => (
                <div key={ch} className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">
                    {lookups.channelLabels[ch] ?? ch}
                  </p>
                  <CompactMoney
                    value={channelSale[ch] ?? ''}
                    onChange={(v) => setChannelSale((p) => ({ ...p, [ch]: v }))}
                  />
                  <p className="text-[11px] text-muted-foreground">İndirimsiz</p>
                  <CompactMoney
                    value={channelOriginal[ch] ?? ''}
                    onChange={(v) => setChannelOriginal((p) => ({ ...p, [ch]: v }))}
                  />
                </div>
              ))}
            </div>
          )}
          <div className="mt-3 overflow-hidden rounded-2xl border border-border bg-card">
            <ToggleRow label="Açık fiyat" checked={openPriced} onChange={setOpenPriced} />
            {openPriced && (
              <div className="grid grid-cols-2 gap-2 border-t border-border p-3">
                <div>
                  <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Min
                  </p>
                  <CompactMoney value={openMin} onChange={setOpenMin} />
                </div>
                <div>
                  <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Max
                  </p>
                  <CompactMoney value={openMax} onChange={setOpenMax} />
                </div>
              </div>
            )}
          </div>
          {isMass && (
            <div className="mt-3 grid grid-cols-3 gap-2">
              <div>
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Min g
                </p>
                <input
                  className={cn(FIELD, 'text-right tabular-nums')}
                  inputMode="numeric"
                  value={weightMin}
                  onChange={(e) => setWeightMin(digitsOnly(e.target.value, 6))}
                />
              </div>
              <div>
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Max g
                </p>
                <input
                  className={cn(FIELD, 'text-right tabular-nums')}
                  inputMode="numeric"
                  value={weightMax}
                  onChange={(e) => setWeightMax(digitsOnly(e.target.value, 6))}
                />
              </div>
              <div>
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Adım g
                </p>
                <input
                  className={cn(FIELD, 'text-right tabular-nums')}
                  inputMode="numeric"
                  value={weightStep}
                  onChange={(e) => setWeightStep(digitsOnly(e.target.value, 6))}
                />
              </div>
            </div>
          )}
        </Section>

        <Section id="sec-kdv" title="KDV">
          <select
            value={taxRateId}
            onChange={(e) => setTaxRateId(e.target.value)}
            className={FIELD}
          >
            <option value="">Seçin</option>
            {lookups.taxes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </Section>

        {!isMenu && (
          <Section
            id="sec-uretim"
            title="Üretim yeri"
            action={
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <BossMSwitch
                  checked={productionByService}
                  onChange={setProductionByService}
                  aria-label="Servise göre üretim yeri"
                />
                Servise göre
              </label>
            }
          >
            {!productionByService ? (
              <div className="flex flex-wrap gap-2">
                {lookups.areas.map((a) => (
                  <Chip
                    key={a.id}
                    on={areasAll.includes(a.id)}
                    onClick={() => toggleArea(areasAll, a.id, setAreasAll)}
                  >
                    {a.name}
                  </Chip>
                ))}
              </div>
            ) : (
              <div className="space-y-3 rounded-2xl border border-border bg-card/90 p-3">
                {channels.map((ch) => (
                  <div key={ch}>
                    <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                      {lookups.channelLabels[ch] ?? ch}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {lookups.areas.map((a) => (
                        <Chip
                          key={a.id}
                          on={(areasByChannel[ch] ?? []).includes(a.id)}
                          onClick={() =>
                            setAreasByChannel((p) => ({
                              ...p,
                              [ch]: toggleId(p[ch] ?? [], a.id),
                            }))
                          }
                        >
                          {a.name}
                        </Chip>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>
        )}

        <Section id="sec-medya" title="Medya">
          <input
            ref={mainFileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              e.target.value = ''
              void handleMainFile(f)
            }}
          />
          <input
            ref={galleryFileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              e.target.value = ''
              void handleGalleryFile(f)
            }}
          />
          <div className="flex gap-3">
            <button
              type="button"
              disabled={mediaBusy}
              onClick={() => mainFileRef.current?.click()}
              className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border bg-card"
            >
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="" className="h-full w-full object-cover" />
              ) : (
                <ImagePlus size={22} className="text-muted-foreground" />
              )}
            </button>
            <div className="min-w-0 flex-1 space-y-2">
              <button
                type="button"
                disabled={mediaBusy}
                onClick={() => mainFileRef.current?.click()}
                className="flex h-11 w-full items-center justify-center rounded-2xl border border-border bg-card text-sm text-foreground"
              >
                {mediaBusy ? 'Yükleniyor…' : 'Ana görsel'}
              </button>
              <button
                type="button"
                disabled={mediaBusy || !canAddMedia}
                onClick={() => galleryFileRef.current?.click()}
                className="flex h-11 w-full items-center justify-center rounded-2xl border border-border bg-card text-sm text-foreground disabled:text-muted-foreground"
              >
                Galeri ekle
              </button>
            </div>
          </div>
          {gallery.length > 0 && (
            <div className="mt-3 flex gap-2 overflow-x-auto" style={{ touchAction: 'pan-x' }}>
              {gallery.map((g) => (
                <div key={g.id} className="relative h-16 w-16 shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={g.thumb || g.large} alt="" className="h-16 w-16 rounded-xl object-cover" />
                  <button
                    type="button"
                    disabled={mediaBusy}
                    onClick={() => void handleDeleteGallery(g.id)}
                    className="absolute -right-1 -top-1 flex !h-7 !w-7 !min-h-0 !min-w-0 items-center justify-center rounded-full border border-border bg-background text-danger"
                    aria-label="Görseli sil"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <input
            className={cn(FIELD, 'mt-3')}
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="Video bağlantısı"
          />
        </Section>

        <Section id="sec-detay" title="Detay">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  PLU
                </p>
                <input
                  className={cn(FIELD, 'tabular-nums')}
                  inputMode="numeric"
                  value={code}
                  onChange={(e) => setCode(sanitizeBossPlu(e.target.value))}
                />
              </div>
              <div>
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Barkod
                </p>
                <input
                  className={FIELD}
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                />
              </div>
            </div>
            <input
              className={FIELD}
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="Kısa açıklama"
            />
            <textarea
              className={AREA}
              value={longDescription}
              onChange={(e) => setLongDescription(e.target.value)}
              placeholder="Uzun açıklama"
            />
            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Etiketler
              </p>
              <div className="flex flex-wrap gap-2">
                {tagLabels.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTagLabels((p) => p.filter((x) => x !== t))}
                    className="flex !min-h-8 !min-w-0 items-center rounded-full border border-primary/40 bg-primary/15 px-3 py-1.5 text-xs text-primary"
                  >
                    {t}
                  </button>
                ))}
              </div>
              {tagLabels.length < 3 && (
                <input
                  className={cn(FIELD, 'mt-2')}
                  value={tagDraft}
                  onChange={(e) => setTagDraft(e.target.value.slice(0, 40))}
                  onKeyDown={(e) => {
                    if (e.key !== 'Enter') return
                    e.preventDefault()
                    const t = tagDraft.trim()
                    if (!t || tagLabels.includes(t)) return
                    setTagLabels((p) => [...p, t].slice(0, 3))
                    setTagDraft('')
                  }}
                  placeholder="Etiket yaz, Enter"
                />
              )}
            </div>
          </div>
        </Section>

        {!isMenu && !isMass && (
          <Section
            id="sec-boyut"
            title="Boyutlar"
            action={
              <button
                type="button"
                onClick={() => setSizeRows((p) => [...p, newSizeRow()])}
                className="flex !min-h-8 !min-w-0 items-center gap-1 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-foreground"
              >
                <Plus size={12} />
                Ekle
              </button>
            }
          >
            <div className="mb-3 overflow-hidden rounded-2xl border border-border bg-card">
              <ToggleRow
                label="Özel boyut"
                checked={customSizeEnabled}
                onChange={setCustomSizeEnabled}
              />
            </div>
            <input
              className={cn(FIELD, 'mb-3')}
              value={standardSizeName}
              onChange={(e) => setStandardSizeName(e.target.value)}
              placeholder="Standart porsiyon adı"
            />
            {sizeRows.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
                Henüz boyut yok.
              </p>
            ) : (
              <div className="space-y-3">
                {sizeRows.map((s, idx) => (
                  <div key={s.key} className="space-y-2 rounded-2xl border border-border bg-card/90 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-medium text-muted-foreground">Boyut {idx + 1}</p>
                      <button
                        type="button"
                        onClick={() => setSizeRows((p) => p.filter((x) => x.key !== s.key))}
                        className="flex !h-9 !w-9 !min-h-0 !min-w-0 items-center justify-center rounded-xl border border-danger/40 text-danger"
                        aria-label="Boyutu sil"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <input
                      className={FIELD}
                      value={s.name}
                      onChange={(e) =>
                        setSizeRows((p) => p.map((x) => (x.key === s.key ? { ...x, name: e.target.value } : x)))
                      }
                      placeholder="Boyut adı"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        className={cn(FIELD, 'tabular-nums')}
                        inputMode="numeric"
                        value={s.plu}
                        onChange={(e) =>
                          setSizeRows((p) =>
                            p.map((x) => (x.key === s.key ? { ...x, plu: sanitizeBossPlu(e.target.value) } : x)),
                          )
                        }
                        placeholder="PLU"
                      />
                      <input
                        className={cn(FIELD, 'text-right tabular-nums')}
                        value={s.ratio}
                        onChange={(e) =>
                          setSizeRows((p) => p.map((x) => (x.key === s.key ? { ...x, ratio: e.target.value } : x)))
                        }
                        placeholder="Çarpan"
                      />
                    </div>
                    <CompactMoney
                      value={sanitizeMoneyTyping(s.price)}
                      onChange={(v) =>
                        setSizeRows((p) => p.map((x) => (x.key === s.key ? { ...x, price: v } : x)))
                      }
                    />
                    {priceByService && (
                      <div className="space-y-2">
                        {channels.map((ch) => (
                          <div key={ch}>
                            <p className="mb-1 text-[11px] text-muted-foreground">
                              {lookups.channelLabels[ch] ?? ch}
                            </p>
                            <CompactMoney
                              value={sanitizeMoneyTyping(s.servicePrices[ch] ?? '')}
                              onChange={(v) =>
                                setSizeRows((p) =>
                                  p.map((x) =>
                                    x.key === s.key
                                      ? { ...x, servicePrices: { ...x.servicePrices, [ch]: v } }
                                      : x,
                                  ),
                                )
                              }
                            />
                          </div>
                        ))}
                      </div>
                    )}
                    <ToggleRow
                      label="Göster"
                      checked={s.status === 'Göster'}
                      onChange={(v) =>
                        setSizeRows((p) =>
                          p.map((x) => (x.key === s.key ? { ...x, status: v ? 'Göster' : 'Gizle' } : x)),
                        )
                      }
                    />
                  </div>
                ))}
              </div>
            )}
          </Section>
        )}

        {!isMenu && (
          <Section id="sec-alerjen" title="Alerjenler">
            <div className="mb-3 overflow-hidden rounded-2xl border border-border bg-card">
              <ToggleRow
                label="Alerjen yok"
                checked={noAllergens}
                onChange={(v) => {
                  setNoAllergens(v)
                  if (v) setAllergenIds([])
                }}
              />
            </div>
            {!noAllergens && (
              <div className="flex flex-wrap gap-2">
                {lookups.allergens.map((a) => (
                  <Chip
                    key={a.id}
                    on={allergenIds.includes(a.id)}
                    onClick={() => {
                      setNoAllergens(false)
                      setAllergenIds((p) => toggleId(p, a.id))
                    }}
                  >
                    {a.name}
                  </Chip>
                ))}
              </div>
            )}
            <div className="mt-3">
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Kalori
              </p>
              <input
                className={cn(FIELD, 'text-right tabular-nums')}
                inputMode="numeric"
                value={calorie}
                onChange={(e) => setCalorie(digitsOnly(e.target.value, 6))}
              />
            </div>
          </Section>
        )}

        {isMenu && (
          <Section id="sec-menu" title="Menü seçim">
            {lookups.menuGroups.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
                Henüz menü seçim grubu yok.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {lookups.menuGroups.map((g) => (
                  <Chip
                    key={g.id}
                    on={menuGroupIds.includes(g.id)}
                    onClick={() => setMenuGroupIds((p) => toggleId(p, g.id))}
                  >
                    {g.name}
                  </Chip>
                ))}
              </div>
            )}
          </Section>
        )}

        {!isMenu && (
          <Section id="sec-tercih" title="Tercihler">
            {lookups.preferenceGroups.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
                Henüz tercih grubu yok.
              </p>
            ) : (
              <>
                <div className="flex flex-wrap gap-2">
                  {lookups.preferenceGroups.map((g) => (
                    <Chip
                      key={g.id}
                      on={preferenceIds.includes(g.id)}
                      onClick={() => setPreferenceIds((p) => toggleId(p, g.id))}
                    >
                      {g.name}
                    </Chip>
                  ))}
                </div>
                {preferenceIds.length > 1 && (
                  <div className="mt-3 space-y-1">
                    {preferenceIds.map((id) => {
                      const g = lookups.preferenceGroups.find((x) => x.id === id)
                      if (!g) return null
                      return (
                        <div
                          key={id}
                          className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2"
                        >
                          <p className="min-w-0 flex-1 truncate text-sm">{g.name}</p>
                          <button
                            type="button"
                            onClick={() => setPreferenceIds((p) => moveId(p, id, -1))}
                            className="flex !h-9 !w-9 !min-h-0 !min-w-0 items-center justify-center rounded-lg text-muted-foreground"
                            aria-label="Yukarı"
                          >
                            <ChevronUp size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setPreferenceIds((p) => moveId(p, id, 1))}
                            className="flex !h-9 !w-9 !min-h-0 !min-w-0 items-center justify-center rounded-lg text-muted-foreground"
                            aria-label="Aşağı"
                          >
                            <ChevronDown size={16} />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </>
            )}
          </Section>
        )}

        <Section id="sec-durum" title="Durum">
          <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
            <ToggleRow label="Ürün aktif" checked={salesOn} onChange={setSalesOn} />
            <ToggleRow label="Müşteriye gizle" checked={hidden} onChange={setHidden} />
            <ToggleRow label="Tükendi (86)" checked={tukendi} onChange={setTukendi} danger />
            {!isMenu && (
              <div className="flex items-center gap-4 px-4 py-4">
                <p className="min-w-0 flex-1 text-sm font-medium">Hazırlık (dk)</p>
                <input
                  className="h-11 w-20 rounded-xl border border-border bg-background px-2 text-right text-sm tabular-nums"
                  inputMode="numeric"
                  value={prepMinutes}
                  onChange={(e) => setPrepMinutes(digitsOnly(e.target.value, 3))}
                />
              </div>
            )}
          </div>

          {stockText && (
            <p className="mt-2 px-1 text-xs text-muted-foreground">Stok: {stockText}</p>
          )}

          <div className="mt-3 overflow-hidden rounded-2xl border border-border bg-card">
            <ToggleRow
              label="Satış servise göre"
              checked={salesModeByService}
              onChange={setSalesModeByService}
            />
            {salesModeByService && (
              <div className="space-y-1 border-t border-border px-2 pb-2">
                {channels.map((ch) => (
                  <ToggleRow
                    key={ch}
                    label={lookups.channelLabels[ch] ?? ch}
                    checked={salesEnabled[ch] !== false}
                    onChange={(v) => setSalesEnabled((p) => ({ ...p, [ch]: v }))}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="mt-3 overflow-hidden rounded-2xl border border-border bg-card">
            <ToggleRow
              label="Saat kısıtı"
              checked={timeRestricted}
              onChange={setTimeRestricted}
            />
            {timeRestricted && (
              <div className="space-y-3 border-t border-border p-3">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="time"
                    className={FIELD}
                    value={timeStart}
                    onChange={(e) => setTimeStart(e.target.value)}
                  />
                  <input
                    type="time"
                    className={FIELD}
                    value={timeEnd}
                    onChange={(e) => setTimeEnd(e.target.value)}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {channels.map((ch) => (
                    <Chip
                      key={ch}
                      on={timeServices[ch] !== false}
                      onClick={() => setTimeServices((p) => ({ ...p, [ch]: p[ch] === false }))}
                    >
                      {lookups.channelLabels[ch] ?? ch}
                    </Chip>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Section>

        {saveError && (
          <p className="px-4 pb-2 text-sm text-danger" role="alert">
            {saveError}
          </p>
        )}
      </div>

      <div className="boss-fixed-action-bar border-t border-border bg-background/90 px-4 pt-3 pb-3 backdrop-blur-sm">
        <button
          type="button"
          onClick={() => void handleSave()}
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
