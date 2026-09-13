/**
 * Menü ürün düzenleyici — panel ProductRow (stok ilişkilendirme hariç).
 */
import { bossFetch } from '@/lib/boss-api'
import { formatMoneyTR } from '@/lib/boss-money'
import {
  loadBossProductionAreas,
  loadBossTaxRates,
  loadKanallarPage,
  saveProductCatalogRow,
  type BossProductionAreaOption,
  type BossTaxRateOption,
} from '@/lib/boss-page-data'

export const CHANNEL_ORDER = [
  'dinein',
  'delivery',
  'takeaway',
  'self',
  'room',
  'online',
  'qr_menu',
] as const

export type ChannelCode = (typeof CHANNEL_ORDER)[number]

export const CHANNEL_FALLBACK_LABELS: Record<ChannelCode, string> = {
  dinein: 'Masa',
  delivery: 'Paket',
  takeaway: 'Gel-al',
  self: 'Self',
  room: 'Oda',
  online: 'Online',
  qr_menu: 'QR menü',
}

const PRODUCT_PLU_MAX_LEN = 12

export type BossProductRow = Record<string, unknown>
export type BossProductKind = 'item' | 'menu'
export type BossUnitKind = 'piece' | 'mass'

export type BossCategoryOption = { id: string; name: string; label: string }
export type BossNamedOption = { id: string; name: string }
export type BossMenuGroupOption = { id: string; name: string }
export type BossAllergenOption = { id: string; name: string }
export type BossGalleryItem = { id: string; thumb: string; large: string }

export type BossProductEditorLookups = {
  taxes: BossTaxRateOption[]
  areas: BossProductionAreaOption[]
  categories: BossCategoryOption[]
  menuGroups: BossMenuGroupOption[]
  preferenceGroups: BossNamedOption[]
  allergens: BossAllergenOption[]
  channelLabels: Record<string, string>
  visibleChannelIds: ChannelCode[]
}

export type BossSizeRow = {
  key: string
  name: string
  plu: string
  ratio: string
  price: string
  status: 'Göster' | 'Gizle'
  servicePrices: Record<string, string>
}

function asMap(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null
}

function asList(v: unknown): unknown[] {
  return Array.isArray(v) ? v : []
}

function str(v: unknown, fallback = ''): string {
  if (v == null) return fallback
  const s = String(v).trim()
  return s || fallback
}

export function sanitizeBossPlu(raw: string): string {
  return String(raw ?? '').replace(/\D/g, '').slice(0, PRODUCT_PLU_MAX_LEN)
}

export function mapUnitToStorage(unit: string): BossUnitKind {
  const n = String(unit ?? '').trim().toLowerCase()
  if (
    n === 'mass' ||
    n === 'ağırlık' ||
    n === 'agirlik' ||
    n === 'kg' ||
    n === 'kilo'
  ) {
    return 'mass'
  }
  return 'piece'
}

export function mapUnitToLabel(unit: string | null | undefined): 'Adet' | 'Ağırlık' {
  return mapUnitToStorage(String(unit ?? '')) === 'mass' ? 'Ağırlık' : 'Adet'
}

export function productKindOf(row: BossProductRow | null | undefined): BossProductKind {
  return str(row?.productType) === 'menu' ? 'menu' : 'item'
}

export function moneyForSave(n: number): string {
  return `₺${formatMoneyTR(n, 2)}`
}

export function describeBossPluError(plu: string): string | null {
  const s = sanitizeBossPlu(plu)
  if (!s) return 'PLU zorunludur.'
  return null
}

export function sizeRowStatusOf(raw: unknown): 'Göster' | 'Gizle' {
  const t = str(raw).toLocaleLowerCase('tr-TR')
  if (
    t === 'gizle' ||
    t === 'gizli' ||
    t === 'pasif' ||
    t === 'hide' ||
    t === 'hidden' ||
    t === 'inactive'
  ) {
    return 'Gizle'
  }
  return 'Göster'
}

export function isDisallowedSizeRatioOne(ratio: string): boolean {
  const n = Number(String(ratio).replace(',', '.').trim())
  return Number.isFinite(n) && Math.abs(n - 1) < 1e-9
}

export function rowStr(row: BossProductRow, key: string, fallback = ''): string {
  return str(row[key], fallback)
}

export function rowBool(row: BossProductRow, key: string, fallback = false): boolean {
  const v = row[key]
  if (v === true) return true
  if (v === false) return false
  return fallback
}

export function unwrapPayload(data: unknown): unknown {
  const map = asMap(data)
  if (!map) return data
  if ('item' in map && map.item != null) return map.item
  if ('data' in map && map.data != null) return unwrapPayload(map.data)
  return data
}

export async function loadProductCatalogRow(uuid: string): Promise<BossProductRow | null> {
  const id = str(uuid)
  if (!id) return null
  const byUuid = await bossFetch<unknown>('/api/products/catalog/row', {
    query: { uuid: id },
  })
  if (byUuid.ok && byUuid.data != null) {
    const item = asMap(unwrapPayload(byUuid.data)) ?? asMap(byUuid.data)
    if (item && str(item.uuid ?? item.id) === id) return item
    if (item && (item.name != null || item.code != null)) return item
  }
  const all = await bossFetch<unknown>('/api/products', { timeoutMs: 30_000 })
  if (!all.ok || all.data == null) return null
  const list = Array.isArray(all.data)
    ? all.data
    : asList(asMap(all.data)?.rows ?? asMap(all.data)?.items)
  const found = list.map((r) => asMap(r)).find((r) => r && str(r.uuid ?? r.id) === id)
  return found ?? null
}

function flattenCategories(raw: unknown[]): BossCategoryOption[] {
  const rows = raw
    .map((r) => {
      const m = asMap(r) ?? {}
      const id = str(m.id ?? m.uuid)
      const name = str(m.name ?? m.nameTr ?? m.title)
      if (!id || !name) return null
      return {
        id,
        name,
        parentId: str(m.parentId ?? m.parent_id) || null,
        isActive: m.isActive !== false && m.active !== false,
      }
    })
    .filter((x): x is { id: string; name: string; parentId: string | null; isActive: boolean } => x != null)
  const byId = new Map(rows.map((r) => [r.id, r]))
  function labelOf(id: string): string {
    const seen = new Set<string>()
    const parts: string[] = []
    let cur = byId.get(id)
    while (cur && !seen.has(cur.id)) {
      seen.add(cur.id)
      parts.unshift(cur.name)
      cur = cur.parentId ? byId.get(cur.parentId) : undefined
    }
    return parts.join(' › ')
  }
  return rows
    .filter((r) => r.isActive)
    .map((r) => ({ id: r.id, name: r.name, label: labelOf(r.id) }))
    .sort((a, b) => a.label.localeCompare(b.label, 'tr'))
}

function namedOptions(raw: unknown[]): BossNamedOption[] {
  return raw
    .map((r) => {
      const m = asMap(r) ?? {}
      const id = str(m.id ?? m.uuid)
      if (!id) return null
      if (m.isActive === false || m.active === false) return null
      const name = str(m.displayName ?? m.name ?? m.nameTr ?? m.title, 'Grup')
      return { id, name }
    })
    .filter((x): x is BossNamedOption => x != null)
}

export async function loadProductEditorLookups(): Promise<BossProductEditorLookups> {
  const [taxes, areas, channels, catsRes, menuRes, prefRes, algRes] = await Promise.all([
    loadBossTaxRates(),
    loadBossProductionAreas(),
    loadKanallarPage(),
    bossFetch<unknown>('/api/product-categories'),
    bossFetch<unknown>('/api/menu-selection-groups'),
    bossFetch<unknown>('/api/product-preferences'),
    bossFetch<unknown>('/api/definitions/allergens'),
  ])

  const catMap = asMap(catsRes.data)
  const categories = flattenCategories(
    asList(catMap?.categories ?? catMap?.items ?? catMap?.rows ?? catsRes.data),
  )

  const menuRaw = asList(
    asMap(menuRes.data)?.groups ??
      asMap(menuRes.data)?.items ??
      asMap(menuRes.data)?.rows ??
      menuRes.data,
  )
  const menuGroups: BossMenuGroupOption[] = namedOptions(menuRaw)

  const prefRaw = asList(
    asMap(prefRes.data)?.groups ??
      asMap(prefRes.data)?.items ??
      asMap(prefRes.data)?.rows ??
      prefRes.data,
  )
  const preferenceGroups = namedOptions(prefRaw)

  const algMap = asMap(algRes.data)
  const allergens: BossAllergenOption[] = asList(
    algMap?.items ?? algMap?.allergens ?? algRes.data,
  )
    .map((r) => {
      const m = asMap(r) ?? {}
      const id = str(m.id)
      if (!id) return null
      if (m.isActive === false) return null
      return { id, name: str(m.nameTr ?? m.name ?? m.columnLabel, 'Alerjen') }
    })
    .filter((x): x is BossAllergenOption => x != null)

  const channelLabels: Record<string, string> = { ...CHANNEL_FALLBACK_LABELS }
  const enabled = new Set<string>()
  for (const ch of channels.channels) {
    const id = str(ch.id).toLowerCase()
    if (!id) continue
    channelLabels[id] = ch.label || channelLabels[id as ChannelCode] || ch.label
    if (ch.enabled) enabled.add(id)
  }
  for (const code of CHANNEL_ORDER) {
    if (!channelLabels[code]) channelLabels[code] = CHANNEL_FALLBACK_LABELS[code]
  }
  const visibleChannelIds = CHANNEL_ORDER.filter((c) => enabled.has(c))

  return {
    taxes,
    areas,
    categories,
    menuGroups,
    preferenceGroups,
    allergens,
    channelLabels,
    visibleChannelIds,
  }
}

export function parseServicePrices(
  raw: unknown,
): Record<string, { sale: string; original: string }> {
  const map = asMap(raw)
  if (!map) return {}
  const out: Record<string, { sale: string; original: string }> = {}
  for (const [k, v] of Object.entries(map)) {
    const block = asMap(v)
    if (!block) continue
    out[k] = {
      sale: str(block.sale),
      original: str(block.original ?? block.sale),
    }
  }
  return out
}

export function parseStringList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  return raw.map((x) => str(x)).filter(Boolean)
}

export function parseBoolMap(raw: unknown): Record<string, boolean> {
  const map = asMap(raw)
  if (!map) return {}
  const out: Record<string, boolean> = {}
  for (const [k, v] of Object.entries(map)) {
    out[k] = v !== false
  }
  return out
}

export function parseAreasByService(raw: unknown): Record<string, string[]> {
  const map = asMap(raw)
  if (!map) return {}
  const out: Record<string, string[]> = {}
  for (const [k, v] of Object.entries(map)) {
    out[k] = parseStringList(v)
  }
  return out
}

export function parseGallery(row: BossProductRow): BossGalleryItem[] {
  const raw = row.qrMenuImageGallery
  if (!Array.isArray(raw)) return []
  return raw
    .map((g) => {
      const m = asMap(g) ?? {}
      const id = str(m.id ?? m.mediaAssetId)
      const thumb = str(m.thumb ?? m.imageThumb ?? m.large)
      const large = str(m.large ?? m.image ?? thumb)
      if (!id) return null
      return { id, thumb, large }
    })
    .filter((x): x is BossGalleryItem => x != null)
}

export function parseDisplayTagLabels(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  const out: string[] = []
  for (const item of raw) {
    if (out.length >= 3) break
    if (typeof item === 'string') {
      const t = item.trim()
      if (t) out.push(t.slice(0, 40))
      continue
    }
    const m = asMap(item)
    const label = str(m?.label ?? m?.name ?? m?.text)
    if (label) out.push(label.slice(0, 40))
  }
  return out
}

export function parseSizeRows(raw: unknown): BossSizeRow[] {
  if (!Array.isArray(raw)) return []
  return raw.map((s, i) => {
    const m = asMap(s) ?? {}
    const sp = asMap(m.servicePrices)
    const servicePrices: Record<string, string> = {}
    if (sp) {
      for (const [k, v] of Object.entries(sp)) {
        const block = asMap(v)
        servicePrices[k] = str(block?.sale ?? v)
      }
    }
    return {
      key: `sz-${i}-${str(m.plu)}-${str(m.name)}`,
      name: str(m.name),
      plu: sanitizeBossPlu(str(m.plu)),
      ratio: str(m.ratio, '0.5'),
      price: str(m.price),
      status: sizeRowStatusOf(m.status),
      servicePrices,
    }
  })
}

export function previewImageUrl(row: BossProductRow): string {
  const thumb = str(row.imageThumb)
  const image = str(row.image)
  for (const u of [thumb, image]) {
    if (!u) continue
    if (u.startsWith('data:')) continue
    if (u.includes('placeholder')) continue
    return u
  }
  return ''
}

export function toggleId(list: string[], id: string): string[] {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id]
}

export function moveId(list: string[], id: string, dir: -1 | 1): string[] {
  const i = list.indexOf(id)
  if (i < 0) return list
  const j = i + dir
  if (j < 0 || j >= list.length) return list
  const next = [...list]
  const tmp = next[i]!
  next[i] = next[j]!
  next[j] = tmp
  return next
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result ?? ''))
    r.onerror = () => reject(new Error('Dosya okunamadı'))
    r.readAsDataURL(file)
  })
}

function looksLikeProductRow(m: Record<string, unknown> | null): m is BossProductRow {
  if (!m) return false
  return Boolean(str(m.uuid) || str(m.code) || str(m.name))
}

function extractSavedItem(data: unknown): BossProductRow | null {
  const map = asMap(data)
  if (!map) return null
  const fromList = asMap(asList(map.items)[0])
  if (looksLikeProductRow(fromList)) return fromList
  const item = asMap(map.item)
  if (looksLikeProductRow(item)) return item
  return null
}

export async function uploadBossProductMainImage(opts: {
  uuid: string
  code: string
  file: File
}): Promise<{ ok: true; item: BossProductRow | null } | { ok: false; error: string }> {
  try {
    const imageDataUrl = await readFileAsDataUrl(opts.file)
    const res = await bossFetch<unknown>('/api/products/image', {
      method: 'POST',
      body: JSON.stringify({
        uuid: opts.uuid,
        code: sanitizeBossPlu(opts.code),
        imageDataUrl,
      }),
      timeoutMs: 90_000,
    })
    if (!res.ok) return { ok: false, error: res.error || 'Görsel yüklenemedi.' }
    return { ok: true, item: extractSavedItem(res.data) }
  } catch {
    return { ok: false, error: 'Görsel yüklenemedi.' }
  }
}

export async function uploadBossProductGalleryImage(opts: {
  uuid: string
  code: string
  file: File
}): Promise<{ ok: true; item: BossProductRow | null } | { ok: false; error: string }> {
  try {
    const imageDataUrl = await readFileAsDataUrl(opts.file)
    const res = await bossFetch<unknown>('/api/products/image/gallery', {
      method: 'POST',
      body: JSON.stringify({
        uuid: opts.uuid,
        code: sanitizeBossPlu(opts.code),
        imageDataUrl,
      }),
      timeoutMs: 90_000,
    })
    if (!res.ok) return { ok: false, error: res.error || 'Görsel yüklenemedi.' }
    return { ok: true, item: extractSavedItem(res.data) }
  } catch {
    return { ok: false, error: 'Görsel yüklenemedi.' }
  }
}

export async function deleteBossProductGalleryImage(opts: {
  uuid: string
  code: string
  galleryId: string
}): Promise<{ ok: true; item: BossProductRow | null } | { ok: false; error: string }> {
  const res = await bossFetch<unknown>('/api/products/image/gallery', {
    method: 'DELETE',
    body: JSON.stringify({
      uuid: opts.uuid,
      code: sanitizeBossPlu(opts.code),
      galleryId: opts.galleryId,
    }),
    timeoutMs: 30_000,
  })
  if (!res.ok) return { ok: false, error: res.error || 'Görsel silinemedi.' }
  return { ok: true, item: extractSavedItem(res.data) }
}

export { saveProductCatalogRow }
