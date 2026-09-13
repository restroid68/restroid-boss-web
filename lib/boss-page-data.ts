/**
 * Loaders for non-P0 Boss pages — API first, mock fallback.
 */
import {
  STOK_ITEMS,
  STOK_WAREHOUSES,
  STOK_KPI,
  PRODUCT_REPORT,
  SISTEM_CARDS,
  type MenuItem,
  type Product,
  type PersonelRow,
  type PersonelRole,
  type ServiceChannel,
  type StokItem,
  type StokWarehouse,
  type Sayim,
  type StokTransfer,
  type FireEntry,
  type FirePeriod,
  type Cari,
  type Lisans,
  type Account,
  type ReportPeriod,
  type ProductRow,
  type SistemCard,
  type SahipAylik,
  type ZReport,
} from '@/lib/boss-mock'
import {
  bossFetch,
  fetchSalesAnalysisTodayFull,
  todayYmd,
} from '@/lib/boss-api'
import { readNativeSession } from '@/lib/boss-bridge'
import {
  BOSS_TTL,
  CACHE_KEY_SISTEM_HUB,
  CACHE_KEY_STOK_HUB,
  invalidateBossCache,
  withBossCache,
} from '@/lib/boss-page-cache'
import { formatMoneyTR, parseMoneyTR } from '@/lib/boss-money'
import { formatBossDateTime } from '@/lib/boss-wall-clock'
import {
  bossOrderStatusKey,
  bossOrderStatusLabel,
  bossPlatformLabel,
  bossPlatformLogoSrc,
  normalizeBossPlatformCode,
} from '@/lib/boss-online-platform'

function num(v: unknown): number {
  return parseMoneyTR(v)
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

/** `u-kg` / unitId → okunur birim (kg). UUID benzeri id gösterme. */
export function formatStockUnit(raw: unknown): string {
  const s = str(raw)
  if (!s) return 'adet'
  if (/^u[-_]/i.test(s)) {
    const label = s.replace(/^u[-_]/i, '').trim()
    return label || 'adet'
  }
  if (/^[0-9a-f]{8}-/i.test(s) || s.length > 24) return 'adet'
  return s
}

function fmtDateShort(iso: unknown): string {
  const s = str(iso)
  if (!s) return '—'
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return s.slice(0, 10)
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
}

function fmtDateTime(iso: unknown): string {
  const s = str(iso)
  if (!s) return '—'
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return s.slice(0, 16)
  return d.toLocaleString('tr-TR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// ── Catalog → menu / urunler ─────────────────────────────────────────────────

type CatalogRow = Record<string, unknown>

function catalogRowPrice(row: CatalogRow): number {
  const direct = parseMoneyTR(row.price ?? row.salePrice ?? row.unitPrice)
  if (direct > 0) return direct
  const sp = row.servicePrices
  if (sp && typeof sp === 'object' && !Array.isArray(sp)) {
    const map = sp as Record<string, unknown>
    for (const key of ['dinein', 'dine_in', 'takeaway', 'delivery', 'self', 'room', 'online', 'qr_menu']) {
      const block = map[key]
      if (block && typeof block === 'object') {
        const sale = parseMoneyTR((block as { sale?: unknown }).sale)
        if (sale > 0) return sale
      }
    }
    for (const block of Object.values(map)) {
      if (block && typeof block === 'object') {
        const sale = parseMoneyTR((block as { sale?: unknown }).sale)
        if (sale > 0) return sale
      }
    }
  }
  const prices = row.prices
  if (prices && typeof prices === 'object' && !Array.isArray(prices)) {
    const p = prices as Record<string, unknown>
    const fromMap = parseMoneyTR(p.dinein ?? p.dine_in ?? p.default ?? Object.values(p)[0])
    if (fromMap > 0) return fromMap
  }
  return parseMoneyTR(row.singleOriginalPrice)
}

function mapCatalogRow(row: CatalogRow): MenuItem & { sku: string; categoryId?: string } {
  const name = str(row.nameTr ?? row.name ?? row.title, 'Ürün')
  const price = catalogRowPrice(row)
  const stockStatus = row.stockStatus
  const depleted =
    stockStatus === false ||
    stockStatus === 0 ||
    stockStatus === 'depleted' ||
    row.depleted === true ||
    row.isDepleted === true
  const statusKey = str(row.status).toLocaleLowerCase('tr-TR')
  const active =
    row.active !== false &&
    row.isActive !== false &&
    row.hidden !== true &&
    row.isHidden !== true &&
    statusKey !== 'passive' &&
    statusKey !== 'pasif'
  const servicePricesRaw = row.servicePrices
  const servicePrices =
    servicePricesRaw && typeof servicePricesRaw === 'object' && !Array.isArray(servicePricesRaw)
      ? (servicePricesRaw as Record<string, { sale: string; original: string }>)
      : undefined
  const prodRaw = row.productionAreasByService
  const productionAreasByService =
    prodRaw && typeof prodRaw === 'object' && !Array.isArray(prodRaw)
      ? (prodRaw as Record<string, string[]>)
      : undefined

  return {
    id: str(row.uuid ?? row.id),
    name,
    category: str(row.categoryName ?? row.category ?? 'Diğer', 'Diğer'),
    price: Math.round(price * 100) / 100,
    active,
    tukendi: depleted,
    stock: depleted ? 0 : null,
    sku: str(row.code ?? row.plu ?? ''),
    code: str(row.code ?? row.plu ?? ''),
    categoryId: str(row.categoryId ?? row.category_id) || undefined,
    priceByService: row.priceByService === true,
    servicePrices,
    taxRateId: str(row.taxRateId) || undefined,
    taxLabel: str(row.taxLabel) || undefined,
    productionByService: row.productionByService === true,
    productionAreasByService,
  }
}

function toProduct(m: MenuItem & { sku: string }): Product {
  // Gerçek stok miktarı API'de yok — sayı uydurma; yalnızca tükendi/satışta durumu
  return {
    id: m.id,
    name: m.name,
    category: m.category,
    sku: m.sku || m.id.slice(0, 8),
    stock: null,
    unit: 'adet',
    minStock: null,
    status: m.tukendi ? 'tukendi' : 'normal',
    price: `₺${formatMoneyTR(m.price, m.price % 1 === 0 ? 0 : 2)}`,
  }
}

export type CatalogPageData = {
  items: MenuItem[]
  categories: string[]
  products: Product[]
  productCategories: string[]
  source: 'api' | 'mock'
}

export async function loadCatalogPage(): Promise<CatalogPageData> {
  return withBossCache(
    'page:catalog',
    BOSS_TTL.definitions,
    async () => {
      // Oturum yokken de mock menü gösterilmez — boş katalog
      const empty: CatalogPageData = {
        items: [],
        categories: ['Tümü'],
        products: [],
        productCategories: ['Tümü'],
        source: 'mock',
      }
      const session = readNativeSession()
      if (!session?.token) return empty

      const res = await bossFetch<{ rows?: CatalogRow[]; total?: number }>(
        '/api/products/catalog/page',
        { query: { offset: '0', limit: '200' } },
      )
      if (!res.ok || !res.data) {
        return { items: [], categories: ['Tümü'], products: [], productCategories: ['Tümü'], source: 'api' }
      }
      const rows = asList(res.data.rows) as CatalogRow[]
      if (!rows.length) {
        return { items: [], categories: ['Tümü'], products: [], productCategories: ['Tümü'], source: 'api' }
      }

      const items = rows.map(mapCatalogRow)
      const cats = Array.from(new Set(items.map((i) => i.category))).sort()
      const products = items.map(toProduct)
      return {
        items,
        categories: ['Tümü', ...cats],
        products,
        productCategories: ['Tümü', ...cats],
        source: 'api' as const,
      }
    },
    { persist: true, isCacheable: (d) => d.source === 'api' },
  )
}

export async function patchProductStockStatus(
  uuid: string,
  code: string,
  stockStatus: boolean,
): Promise<boolean> {
  return (await saveProductCatalogRow({ uuid, code, stockStatus })).ok
}

function invalidateCatalogCaches(uuid?: string) {
  invalidateBossCache('page:catalog')
  invalidateBossCache('fn:loadCatalogPage')
  if (uuid) invalidateBossCache(`page:product-row:${uuid}`)
}

/** Katalog satırı kaydı — tam satır gönderilmeli (kısmi patch ad/kategori siler). */
export async function saveProductCatalogRow(
  row: Record<string, unknown>,
  opts?: { replaceProductCode?: string },
): Promise<{ ok: boolean; error?: string }> {
  const uuid = str(row.uuid)
  const code = str(row.code)
  if (!uuid && !code) return { ok: false, error: 'Ürün kimliği yok.' }
  const patch: { row: Record<string, unknown>; replaceProductCode?: string } = { row }
  const replace = str(opts?.replaceProductCode)
  if (replace) patch.replaceProductCode = replace
  const res = await bossFetch('/api/products', {
    method: 'POST',
    body: JSON.stringify({ bulkProductPatches: [patch] }),
    timeoutMs: 60_000,
  })
  if (res.ok) {
    invalidateCatalogCaches(uuid)
    return { ok: true }
  }
  return { ok: false, error: res.error || 'Kayıt başarısız' }
}

/** Yeni ürün — tek satır POST (toplu patch oluşturmaz). */
export async function createProductCatalogRow(
  row: Record<string, unknown>,
): Promise<{ ok: boolean; error?: string; uuid?: string }> {
  const code = str(row.code)
  if (!code) return { ok: false, error: 'PLU zorunludur.' }
  const body = { ...row }
  delete body.uuid
  const res = await bossFetch<unknown>('/api/products', {
    method: 'POST',
    body: JSON.stringify(body),
    timeoutMs: 60_000,
  })
  if (!res.ok) return { ok: false, error: res.error || 'Ürün eklenemedi.' }
  const map = asMap(res.data)
  const item = asMap(map?.item) ?? map
  const uuid = str(item?.uuid)
  invalidateCatalogCaches(uuid)
  return { ok: true, uuid: uuid || undefined }
}

export async function deleteProductCatalogRow(
  uuid: string,
): Promise<{ ok: boolean; error?: string; outcome?: 'deleted' | 'deactivated' }> {
  const id = str(uuid)
  if (!id) return { ok: false, error: 'Ürün kimliği yok.' }
  const res = await bossFetch<{ ok?: boolean; outcome?: string }>('/api/products/by-uuid/' + encodeURIComponent(id), {
    method: 'DELETE',
    timeoutMs: 30_000,
  })
  if (!res.ok) return { ok: false, error: res.error || 'Ürün silinemedi.' }
  invalidateCatalogCaches(id)
  const outcome = str(res.data?.outcome)
  return {
    ok: true,
    outcome: outcome === 'deactivated' ? 'deactivated' : 'deleted',
  }
}

/** Menü yönetimi — ürün satırı kısmi güncelleme (fiyat / KDV / üretim yeri vb.). */
export async function patchProductCatalogRow(
  row: Record<string, unknown>,
): Promise<boolean> {
  return (await saveProductCatalogRow(row)).ok
}

export type BossTaxRateOption = { id: string; label: string; rate: number }
export type BossProductionAreaOption = { id: string; name: string }

export async function loadBossTaxRates(): Promise<BossTaxRateOption[]> {
  const res = await bossFetch<unknown>('/api/definitions/finance')
  if (!res.ok || res.data == null) return []
  const map = asMap(res.data)
  const list = asList(map?.taxRates ?? map?.tax_rates ?? map?.items)
  return list
    .map((raw) => {
      const row = asMap(raw) ?? {}
      const id = str(row.id ?? row.taxRateId)
      if (!id) return null
      const rate = num(row.rate ?? row.percent)
      const name = str(row.name ?? row.label, `%${rate}`)
      const label = name.includes('%') ? name : `${name} (%${rate})`
      return { id, label, rate }
    })
    .filter((x): x is BossTaxRateOption => x != null)
}

export async function loadBossProductionAreas(): Promise<BossProductionAreaOption[]> {
  const res = await bossFetch<unknown>('/api/definitions/production-areas')
  if (!res.ok || res.data == null) return []
  const map = asMap(res.data)
  const list = asList(map?.areas ?? map?.items ?? map?.rows ?? res.data)
  return list
    .map((raw) => {
      const row = asMap(raw) ?? {}
      const id = str(row.id ?? row.uuid)
      if (!id) return null
      return { id, name: str(row.name ?? row.title, 'Üretim yeri') }
    })
    .filter((x): x is BossProductionAreaOption => x != null)
}

// ── Personel ─────────────────────────────────────────────────────────────────

function mapRole(raw: unknown): PersonelRole {
  const s = str(raw).toLowerCase()
  if (s.includes('kasiyer') || s.includes('cashier')) return 'Kasiyer'
  if (s.includes('şef') || s.includes('sef') || s.includes('chef')) return 'Şef'
  if (s.includes('müdür') || s.includes('mudur') || s.includes('manager')) return 'Müdür'
  if (s.includes('yardım') || s.includes('yardim') || s.includes('helper')) return 'Yardımcı'
  return 'Garson'
}

export type PersonelPageData = {
  list: PersonelRow[]
  source: 'api' | 'mock'
}

export async function loadPersonelPage(): Promise<PersonelPageData> {
  const session = readNativeSession()
  if (!session?.token) return { list: [], source: 'mock' }

  const res = await bossFetch<{ items?: unknown[]; personnel?: unknown[]; rows?: unknown[] }>(
    '/api/restaurant/personnel',
  )
  if (!res.ok || !res.data) return { list: [], source: 'api' }

  const raw = asList(res.data.items ?? res.data.personnel ?? res.data.rows)
  if (!raw.length) return { list: [], source: 'api' }

  const list: PersonelRow[] = raw.map((r, i) => {
    const row = asMap(r) ?? {}
    const name = str(
      row.fullName ?? row.name ?? `${str(row.firstName)} ${str(row.lastName)}`.trim(),
      `Personel ${i + 1}`,
    )
    return {
      id: str(row.id ?? row.uuid ?? i),
      name,
      role: mapRole(row.roleName ?? row.role ?? row.title),
      active: row.active !== false && row.isActive !== false && row.status !== 'passive',
      salesTotal: '—',
      cancelRate: '—',
      orderCount: num(row.orderCount ?? 0),
      startDate: fmtDateShort(row.startDate ?? row.hiredAt ?? row.createdAt),
      phone: str(row.phone ?? row.mobile ?? '—', '—'),
      auditEvents: [],
    }
  })

  return { list, source: 'api' }
}

// ── Servis kanalları ─────────────────────────────────────────────────────────

const CHANNEL_META: Record<string, { label: string; description: string }> = {
  dinein: { label: 'Masa', description: 'Restoran içi masa servisi' },
  dine_in: { label: 'Masa', description: 'Restoran içi masa servisi' },
  delivery: { label: 'Paket', description: 'Kapıda teslimat siparişleri' },
  paket: { label: 'Paket', description: 'Kapıda teslimat siparişleri' },
  takeaway: { label: 'Gel-al', description: 'Müşterinin kendi teslim alması' },
  gelal: { label: 'Gel-al', description: 'Müşterinin kendi teslim alması' },
  self: { label: 'Self', description: 'Self-servis kiosk siparişleri' },
  online: { label: 'Online', description: 'Web ve uygulama üzerinden siparişler' },
  qr_menu: { label: 'QR', description: 'Masa QR kodu ile sipariş' },
  qr: { label: 'QR', description: 'Masa QR kodu ile sipariş' },
  room: { label: 'Oda', description: 'Oda servisi siparişleri' },
}

/** Boss’ta gösterilmez: perakende tezgâh satışı restoran servis türü değildir. */
const BOSS_HIDDEN_CHANNEL_CODES = new Set(['retail'])

const CHANNEL_SORT_INDEX: Record<string, number> = {
  dinein: 0,
  dine_in: 0,
  delivery: 1,
  paket: 1,
  takeaway: 2,
  gelal: 2,
  online: 3,
  qr_menu: 4,
  qr: 4,
  self: 5,
  room: 6,
}

export type KanallarPageData = {
  channels: ServiceChannel[]
  source: 'api' | 'mock'
}

export async function loadKanallarPage(): Promise<KanallarPageData> {
  return withBossCache(
    'page:kanallar:v3',
    BOSS_TTL.definitions,
    async () => {
      const session = readNativeSession()
      if (!session?.token) return { channels: [], source: 'mock' as const }

      const res = await bossFetch<unknown>('/api/service-channels')
      if (!res.ok || res.data == null) return { channels: [], source: 'api' as const }

      const raw = Array.isArray(res.data)
        ? res.data
        : asList(asMap(res.data)?.channels ?? asMap(res.data)?.items ?? asMap(res.data)?.rows)

      if (!raw.length) return { channels: [], source: 'api' as const }

      const channels: ServiceChannel[] = raw
        .map((r) => {
          const row = asMap(r) ?? {}
          const code = str(row.code ?? row.id).toLowerCase()
          if (!code || BOSS_HIDDEN_CHANNEL_CODES.has(code)) return null
          const meta = CHANNEL_META[code]
          if (!meta) return null
          const enabled =
            row.isActive === true ||
            row.enabled === true ||
            row.isEnabled === true ||
            row.active === true
          // Restoranda kapalı tür (Self / Oda vb.) Boss listesinde yok
          if (!enabled) return null
          const label =
            /^dine[\s_-]*in$/i.test(code) || /^dine[\s_-]*in$/i.test(meta.label) ? 'Masa' : meta.label
          return {
            id: code,
            label,
            description: meta.description,
            enabled: true,
          }
        })
        .filter((c): c is ServiceChannel => c != null)
        .sort(
          (a, b) => (CHANNEL_SORT_INDEX[a.id] ?? 99) - (CHANNEL_SORT_INDEX[b.id] ?? 99),
        )

      return { channels, source: 'api' as const }
    },
    { persist: true, isCacheable: (d) => d.source === 'api' },
  )
}

export async function patchServiceChannelEnabled(code: string, enabled: boolean): Promise<boolean> {
  const res = await bossFetch(`/api/service-channels/${encodeURIComponent(code)}`, {
    method: 'PATCH',
    // cloud: tenantPatchServiceChannelActive → body.isActive
    body: JSON.stringify({ isActive: enabled }),
  })
  if (res.ok) {
    invalidateBossCache('page:kanallar')
    invalidateBossCache(CACHE_KEY_SISTEM_HUB)
    invalidateBossCache('fn:loadKanallarPage')
    invalidateBossCache('fn:loadSistemHub')
  }
  return res.ok
}

// ── Stok hub ─────────────────────────────────────────────────────────────────

export type StokHubData = {
  warehouses: StokWarehouse[]
  items: StokItem[]
  kpi: typeof STOK_KPI
  source: 'api' | 'mock'
}

async function loadStokHubUncached(): Promise<StokHubData> {
  const fallback: StokHubData = {
    warehouses: STOK_WAREHOUSES,
    items: STOK_ITEMS,
    kpi: STOK_KPI,
    source: 'mock',
  }
  const session = readNativeSession()
  if (!session?.token) return fallback

  const [whRes, defRes, balRes, countsRes, salesRes] = await Promise.all([
    bossFetch<unknown>('/api/stock/warehouses'),
    bossFetch<{
      materials?: unknown[]
      semiProducts?: unknown[]
      finishedProducts?: unknown[]
    }>('/api/stock/definitions'),
    bossFetch<{ balances?: Record<string, string> }>('/api/stock/balances'),
    bossFetch<{ items?: unknown[]; rows?: unknown[] }>('/api/stock/inventory-counts', {
      query: { page: '1', pageSize: '20' },
    }),
    // Bugünkü fire (zayi) tutarı — satış analizi özetindeki gerçek waste alanı
    fetchSalesAnalysisTodayFull(),
  ])

  // Oturum varken API hatasında mock STOK_* gösterilmez — boş + hata durumu
  if (!whRes.ok && !defRes.ok) {
    return {
      warehouses: [],
      items: [],
      kpi: { toplamDeger: '₺0', kritikAdet: 0, bugunFireTutar: '₺0', acikSayim: 0 },
      source: 'api',
    }
  }

  const whRaw = Array.isArray(whRes.data)
    ? whRes.data
    : asList(asMap(whRes.data)?.items ?? asMap(whRes.data)?.warehouses)
  const warehouses: StokWarehouse[] = whRaw.map((w, i) => {
    const row = asMap(w) ?? {}
    return { id: str(row.id ?? row.code ?? i), name: str(row.name ?? row.code, `Depo ${i + 1}`) }
  })

  const defaultWh = warehouses[0]?.id ?? 'w1'
  const balances = balRes.data?.balances ?? {}

  const materials = asList(defRes.data?.materials)
  const semis = asList(defRes.data?.semiProducts)
  const finished = asList(defRes.data?.finishedProducts)
  const defs = [...materials, ...semis, ...finished]

  const items: StokItem[] = defs.map((raw, i) => {
    const row = asMap(raw) ?? {}
    const id = str(row.id ?? row.code ?? i)
    const code = str(row.code ?? row.id, id)
    const qty = num(balances[code] ?? balances[id] ?? 0)
    const minStock = num(row.minStock ?? row.minQty ?? 0)
    let status: StokItem['status'] = 'normal'
    if (qty <= 0) status = 'tukendi'
    else if (minStock > 0 && qty < minStock) status = 'kritik'
    const unitCost = num(row.unitCost ?? 0)
    return {
      id,
      name: str(row.name, code),
      code,
      warehouseId: defaultWh,
      stock: qty,
      unit: formatStockUnit(row.unitName ?? row.unitSymbol ?? row.unit ?? row.unitId),
      minStock: minStock || 1,
      status,
      lastMovement: '—',
      value: `₺${formatMoneyTR(qty * unitCost)}`,
    }
  })

  const kritik = items.filter((i) => i.status === 'kritik' || i.status === 'tukendi').length
  const totalValue = items.reduce((a, i) => {
    const n = Number(String(i.value).replace(/[^\d.,-]/g, '').replace(/\./g, '').replace(',', '.'))
    return a + (Number.isFinite(n) ? n : 0)
  }, 0)

  const countItems = asList(countsRes.data?.items ?? countsRes.data?.rows)
  const acikSayim = countItems.filter((c) => {
    const st = str(asMap(c)?.status).toLowerCase()
    return st.includes('open') || st.includes('sayım') || st.includes('sayim') || st === 'in_progress'
  }).length

  // Bugünkü fire: satış analizi özetindeki waste; hesaplanamıyorsa 0
  const salesSummary = asMap(asMap(salesRes.data)?.summary) ?? {}
  const bugunFire =
    salesRes.ok ? num(salesSummary.waste ?? salesSummary.wasteAmount) : 0

  return {
    warehouses,
    items,
    kpi: {
      toplamDeger: `₺${formatMoneyTR(totalValue)}`,
      kritikAdet: kritik,
      bugunFireTutar: `₺${formatMoneyTR(bugunFire)}`,
      acikSayim,
    },
    source: 'api',
  }
}

/** Sayım / transfer / fire aynı L1 kaydını paylaşır — hub yeniden çekilmez. */
export async function loadStokHub(): Promise<StokHubData> {
  return withBossCache(CACHE_KEY_STOK_HUB, BOSS_TTL.kpi, loadStokHubUncached, {
    isCacheable: (d) => d.source === 'api',
  })
}

export type SayimlarPageData = {
  sayimlar: Sayim[]
  warehouses: StokWarehouse[]
  source: 'api' | 'mock'
}

export async function loadSayimlarPage(): Promise<SayimlarPageData> {
  const hub = await loadStokHub()
  const session = readNativeSession()
  if (!session?.token) {
    return { sayimlar: [], warehouses: hub.warehouses, source: 'mock' }
  }

  const res = await bossFetch<{ items?: unknown[]; rows?: unknown[] }>('/api/stock/inventory-counts', {
    query: { page: '1', pageSize: '50' },
  })
  if (!res.ok) {
    return { sayimlar: [], warehouses: hub.warehouses, source: 'api' }
  }

  const raw = asList(res.data?.items ?? res.data?.rows)
  if (!raw.length) {
    return { sayimlar: [], warehouses: hub.warehouses, source: 'api' }
  }

  const sayimlar: Sayim[] = raw.map((r, i) => {
    const row = asMap(r) ?? {}
    const st = str(row.status).toLowerCase()
    const open = st.includes('open') || st.includes('progress') || st.includes('sayım') || st === 'draft'
    return {
      id: str(row.id ?? i),
      warehouseId: str(row.warehouseId ?? row.warehouse_id ?? hub.warehouses[0]?.id),
      status: open ? 'Sayımda' : 'Kapalı',
      counted: num(row.countedLines ?? row.counted ?? row.lineCount),
      total: num(row.totalLines ?? row.total ?? row.expectedCount ?? 0),
      createdBy: str(row.createdByName ?? row.createdBy ?? row.userName, '—'),
      date: fmtDateTime(row.createdAt ?? row.startedAt ?? row.date),
    }
  })

  return { sayimlar, warehouses: hub.warehouses, source: 'api' }
}

export type TransfersPageData = {
  transfers: StokTransfer[]
  warehouses: StokWarehouse[]
  source: 'api' | 'mock'
}

export async function loadTransfersPage(): Promise<TransfersPageData> {
  const hub = await loadStokHub()
  const session = readNativeSession()
  if (!session?.token) {
    return { transfers: [], warehouses: hub.warehouses, source: 'mock' }
  }

  const res = await bossFetch<{ items?: unknown[]; rows?: unknown[] }>('/api/stock/transfers', {
    query: { page: '1', pageSize: '50' },
  })
  if (!res.ok) {
    return { transfers: [], warehouses: hub.warehouses, source: 'api' }
  }

  const raw = asList(res.data?.items ?? res.data?.rows)
  if (!raw.length) {
    return { transfers: [], warehouses: hub.warehouses, source: 'api' }
  }

  const transfers: StokTransfer[] = raw.map((r, i) => {
    const row = asMap(r) ?? {}
    const st = str(row.status).toLowerCase()
    let status: StokTransfer['status'] = 'Bekleyen'
    if (st.includes('complete') || st.includes('done') || st.includes('tamam')) status = 'Tamamlanan'
    else if (st.includes('transit') || st.includes('ship') || st.includes('yolda')) status = 'Yolda'
    return {
      id: str(row.id ?? i),
      fromWarehouseId: str(row.fromWarehouseId ?? row.from_warehouse_id ?? row.sourceWarehouseId),
      toWarehouseId: str(row.toWarehouseId ?? row.to_warehouse_id ?? row.targetWarehouseId),
      itemCount: num(
        row.itemCount ?? row.lineCount ?? (Array.isArray(row.lines) ? row.lines.length : 1),
      ),
      status,
      time: fmtDateTime(row.createdAt ?? row.updatedAt),
      note: str(row.note ?? row.memo) || undefined,
    }
  })

  return { transfers, warehouses: hub.warehouses, source: 'api' }
}

export type FirePageData = {
  byPeriod: Record<FirePeriod, FireEntry[]>
  warehouses: StokWarehouse[]
  source: 'api' | 'mock'
}

function ymdDaysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export async function loadFirePage(): Promise<FirePageData> {
  const hub = await loadStokHub()
  const session = readNativeSession()
  const emptyByPeriod: Record<FirePeriod, FireEntry[]> = {
    'Bugün': [],
    '7 Gün': [],
    '30 Gün': [],
  }
  if (!session?.token) {
    return { byPeriod: emptyByPeriod, warehouses: hub.warehouses, source: 'mock' }
  }

  // Fire / stok çıkış fişleri — cloud stock/document-logs (kind=outbound, createdAt aralığı)
  const res = await bossFetch<{ items?: unknown[]; rows?: unknown[] }>(
    '/api/stock/document-logs',
    {
      query: {
        kind: 'outbound',
        from: ymdDaysAgo(29),
        to: todayYmd(),
        page: '1',
        pageSize: '100',
      },
    },
  )
  const raw = asList(res.data?.items ?? res.data?.rows)
  if (!res.ok || !raw.length) {
    return { byPeriod: emptyByPeriod, warehouses: hub.warehouses, source: 'api' }
  }

  const dayMs = 24 * 60 * 60 * 1000
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const start7 = startOfToday - 6 * dayMs
  const start30 = startOfToday - 29 * dayMs

  const mapped = raw.map((r, i) => {
    const row = asMap(r) ?? {}
    const detail = asMap(row.detail) ?? {}
    const createdAt = str(row.createdAt ?? row.date)
    const ts = Date.parse(createdAt)
    const entry: FireEntry = {
      id: str(row.id ?? i),
      name: str(detail.exitTypeName ?? detail.documentNo ?? row.entityId, 'Stok çıkışı'),
      qty: num(detail.rowCount ?? 1) || 1,
      unit: 'kalem',
      warehouseId: str(detail.warehouseId ?? hub.warehouses[0]?.id),
      reason: str(detail.note ?? detail.exitTypeName, 'Stok çıkışı'),
      amount: `₺${formatMoneyTR(Math.abs(num(detail.grandTotal ?? 0)))}`,
      date: fmtDateTime(createdAt),
    }
    return { ts, entry }
  })

  const within = (fromTs: number) =>
    mapped
      .filter((m) => Number.isFinite(m.ts) && m.ts >= fromTs)
      .map((m) => m.entry)

  // Her dönem gerçek tarihe göre filtrelenir; boşsa boş kalır (mock yok)
  return {
    byPeriod: {
      'Bugün': within(startOfToday),
      '7 Gün': within(start7),
      '30 Gün': within(start30),
    },
    warehouses: hub.warehouses,
    source: 'api',
  }
}

// ── Siparişler ───────────────────────────────────────────────────────────────

export type BossOrderRow = {
  id: string
  title: string
  platform: string
  platformCode: string
  logoSrc: string | null
  status: string
  statusKey: string
  amount: number
  time: string
  customer: string
  serviceLabel: string
}

export type OrdersPageData = {
  orders: BossOrderRow[]
  source: 'api' | 'mock'
}

function orderServiceLabel(row: Record<string, unknown>, platformCode: string): string {
  if (platformCode === 'qr_menu') return 'QR Menü'
  if (platformCode === 'whatsapp') return 'Teslimat'
  const payload = asMap(row.payload) ?? {}
  const dt = str(payload.deliveryType ?? payload.delivery_type).toLowerCase()
  if (dt === 'takeaway' || dt === 'pickup') return 'Gel al'
  if (dt === 'dinein' || dt === 'dine_in') return 'Yerinde'
  if (dt === 'delivery') return 'Teslimat'
  const nested = [payload, asMap(payload.order), asMap(payload.parsedOrder)]
  for (const src of nested) {
    if (!src) continue
    const sid = num(src.service_type_id ?? src.serviceTypeId)
    if (sid === 3) return 'Gel al'
    if (sid === 1) return 'Yerinde'
    if (sid === 6) return 'QR Menü'
    if (sid === 2) return 'Teslimat'
  }
  return str(row.deliveryAddress) ? 'Teslimat' : 'Gel al'
}

function qrTableTitle(row: Record<string, unknown>): string {
  const payload = asMap(row.payload) ?? {}
  const sources = [payload, asMap(payload.order), asMap(payload.table)]
  for (const src of sources) {
    if (!src) continue
    const tableName = str(src.tableName ?? src.table_name)
    const tableNo = num(src.tableNumber ?? src.table_number)
    const salon = str(src.salonName ?? src.salon_name)
    const table = tableName || (tableNo > 0 ? `Masa ${tableNo}` : '')
    if (!table) continue
    return salon ? `${salon} · ${table}` : table
  }
  return ''
}

function orderCustomerName(row: Record<string, unknown>): string {
  const name = str(row.customerName ?? row.guestName)
  if (name && !isPhoneLikeName(name, row.customerPhone ?? row.phone)) return name
  const phone = formatTrMobile(row.customerPhone ?? row.phone)
  return phone || '—'
}

function mapOrderRows(raw: unknown[]): BossOrderRow[] {
  return raw.map((r, i) => {
    const row = asMap(r) ?? {}
    const platformCode = normalizeBossPlatformCode(row.platform ?? row.platformName ?? row.source)
    const orderNo = str(row.orderNumber ?? row.platformOrderId)
    const qrTitle = platformCode === 'qr_menu' ? qrTableTitle(row) : ''
    const title = qrTitle || (orderNo ? `#${orderNo}` : 'Sipariş')
    return {
      id: str(row.id ?? row.orderId ?? `${platformCode}-${i}`),
      title,
      platform: bossPlatformLabel(platformCode),
      platformCode,
      logoSrc: bossPlatformLogoSrc(platformCode),
      status: bossOrderStatusLabel(row.status ?? row.statusLabel),
      statusKey: bossOrderStatusKey(row.status ?? row.statusLabel),
      amount: num(row.totalAmount ?? row.grandTotal ?? row.amount ?? row.total),
      time: formatBossDateTime(row.createdAt ?? row.orderedAt),
      customer: orderCustomerName(row),
      serviceLabel: orderServiceLabel(row, platformCode),
    }
  })
}

export async function loadOnlineOrdersPage(): Promise<OrdersPageData> {
  const session = readNativeSession()
  if (!session?.token) return { orders: [], source: 'mock' }

  const res = await bossFetch<{ rows?: unknown[]; items?: unknown[] }>('/api/sales/online-orders', {
    query: { page: '1', pageSize: '40', sortDir: 'desc' },
  })
  if (!res.ok) return { orders: [], source: 'api' }
  const raw = asList(res.data?.rows ?? res.data?.items)
  return { orders: mapOrderRows(raw), source: 'api' }
}

export async function loadQrOrdersPage(): Promise<OrdersPageData> {
  const session = readNativeSession()
  if (!session?.token) return { orders: [], source: 'mock' }

  const res = await bossFetch<{ rows?: unknown[]; items?: unknown[] }>(
    '/api/sales/qr-menu-orders',
    { query: { page: '1', pageSize: '40', sortDir: 'desc' } },
  )
  if (!res.ok) return { orders: [], source: 'api' }
  const raw = asList(res.data?.rows ?? res.data?.items)
  return { orders: mapOrderRows(raw), source: 'api' }
}

// ── Sistem: ödeme / salon / üretim / uzaktan ─────────────────────────────────

export type PaymentTypeRow = {
  id: string
  name: string
  active: boolean
  code?: string
}

export type SistemOdemeData = {
  payments: PaymentTypeRow[]
  source: 'api' | 'mock'
}

export async function loadOdemePage(): Promise<SistemOdemeData> {
  return withBossCache(
    'page:odeme',
    BOSS_TTL.definitions,
    async () => {
      const session = readNativeSession()
      const mock: PaymentTypeRow[] = [
        { id: '1', name: 'Nakit', active: true },
        { id: '2', name: 'Kredi Kartı', active: true },
        { id: '3', name: 'Yemek Kartı', active: true },
        { id: '4', name: 'Havale', active: false },
        { id: '5', name: 'Cari', active: true },
      ]
      if (!session?.token) return { payments: [], source: 'mock' as const }

      const res = await bossFetch<unknown>('/api/definitions/payment-types')
      if (!res.ok || res.data == null) return { payments: [], source: 'api' as const }

      const raw = Array.isArray(res.data)
        ? res.data
        : asList(asMap(res.data)?.items ?? asMap(res.data)?.rows ?? asMap(res.data)?.paymentTypes)

      if (!raw.length) return { payments: [], source: 'api' as const }

      const payments = raw.map((r, i) => {
        const row = asMap(r) ?? {}
        return {
          id: str(row.id ?? row.uuid ?? i),
          name: str(row.nameTr ?? row.name ?? row.label, `Ödeme ${i + 1}`),
          active: row.active !== false && row.isActive !== false,
          code: str(row.code) || undefined,
        }
      })

      return { payments, source: 'api' as const }
    },
    { persist: true, isCacheable: (d) => d.source === 'api' },
  )
}

export type SalonRow = {
  id: string
  name: string
  tableCount: number
  capacity?: number
}

export type SistemSalonData = {
  salons: SalonRow[]
  totalTables: number
  source: 'api' | 'mock'
}

export async function loadSalonPage(): Promise<SistemSalonData> {
  return withBossCache(
    'page:salon',
    BOSS_TTL.definitions,
    async () => {
      const session = readNativeSession()
      if (!session?.token) {
        return {
          salons: [
            { id: '1', name: 'Ana Salon', tableCount: 20, capacity: 80 },
            { id: '2', name: 'Teras', tableCount: 12, capacity: 40 },
          ],
          totalTables: 32,
          source: 'mock' as const,
        }
      }

      const res = await bossFetch<unknown>('/api/salons')
      if (!res.ok || res.data == null) {
        // API hatası mock değildir — boş + 'api'
        return { salons: [], totalTables: 0, source: 'api' as const }
      }

      const raw = Array.isArray(res.data)
        ? res.data
        : asList(asMap(res.data)?.items ?? asMap(res.data)?.salons ?? asMap(res.data)?.rows)

      const salons: SalonRow[] = raw.map((r, i) => {
        const row = asMap(r) ?? {}
        const tables = asList(row.tables ?? row.tableList)
        const tableCount = num(row.tableCount ?? row.tablesCount ?? tables.length)
        return {
          id: str(row.id ?? row.uuid ?? i),
          name: str(row.nameTr ?? row.name, `Salon ${i + 1}`),
          tableCount,
          capacity: num(row.capacity ?? row.guestCapacity) || undefined,
        }
      })

      const totalTables = salons.reduce((a, s) => a + s.tableCount, 0)
      return { salons, totalTables, source: 'api' as const }
    },
    { persist: true, isCacheable: (d) => d.source === 'api' },
  )
}

export type ProductionAreaRow = {
  id: string
  name: string
  active: boolean
}

export type SistemUretimData = {
  areas: ProductionAreaRow[]
  source: 'api' | 'mock'
}

export async function loadUretimPage(): Promise<SistemUretimData> {
  return withBossCache(
    'page:uretim',
    BOSS_TTL.definitions,
    async () => {
      const session = readNativeSession()
      const mock: ProductionAreaRow[] = [
        { id: '1', name: 'Mutfak', active: true },
        { id: '2', name: 'Bar', active: true },
        { id: '3', name: 'Tatlı', active: false },
      ]
      if (!session?.token) return { areas: [], source: 'mock' as const }

      const res = await bossFetch<unknown>('/api/definitions/production-areas')
      if (!res.ok || res.data == null) return { areas: [], source: 'api' as const }

      const raw = Array.isArray(res.data)
        ? res.data
        : asList(asMap(res.data)?.items ?? asMap(res.data)?.areas ?? asMap(res.data)?.rows)

      if (!raw.length) return { areas: [], source: 'api' as const }

      const areas = raw.map((r, i) => {
        const row = asMap(r) ?? {}
        return {
          id: str(row.id ?? row.uuid ?? i),
          name: str(row.nameTr ?? row.name, `Alan ${i + 1}`),
          active: row.active !== false && row.isActive !== false,
        }
      })

      return { areas, source: 'api' as const }
    },
    { persist: true, isCacheable: (d) => d.source === 'api' },
  )
}

export type UzaktanPageData = {
  bridgeOnline: boolean
  bridgeLabel: string
  detail: string
  source: 'api' | 'mock'
}

export async function loadUzaktanPage(): Promise<UzaktanPageData> {
  const session = readNativeSession()
  if (!session?.token) {
    return {
      bridgeOnline: false,
      bridgeLabel: 'Köprü durumu bilinmiyor',
      detail: 'Oturum yok — örnek veri',
      source: 'mock',
    }
  }

  const res = await bossFetch<Record<string, unknown>>('/api/sales/hardware-bridge/status')
  if (!res.ok || !res.data) {
    // API hatası mock değildir — hata durumu detayıyla 'api'
    return {
      bridgeOnline: false,
      bridgeLabel: 'Köprü yanıt vermedi',
      detail: res.error || 'Durum alınamadı',
      source: 'api',
    }
  }

  const d = res.data
  const online =
    d.online === true ||
    d.connected === true ||
    d.isOnline === true ||
    str(d.status).toLowerCase() === 'online'

  return {
    bridgeOnline: online,
    bridgeLabel: online ? 'Köprü çevrimiçi' : 'Köprü çevrimdışı',
    detail: str(
      d.branchCode ?? d.lastSeenAt ?? d.message,
      online ? 'Şube motoru bağlı' : 'Bağlantı bekleniyor',
    ),
    source: 'api',
  }
}

export type SistemHubData = {
  cards: SistemCard[]
  source: 'api' | 'mock'
}

export async function loadSistemHub(): Promise<SistemHubData> {
  return withBossCache(
    CACHE_KEY_SISTEM_HUB,
    BOSS_TTL.definitions,
    async () => {
      const [kanallar, odeme, salon, uretim] = await Promise.all([
        loadKanallarPage(),
        loadOdemePage(),
        loadSalonPage(),
        loadUretimPage(),
      ])

      const cards = SISTEM_CARDS.map((c) => {
        if (c.id === 'kanallar') {
          const n = kanallar.channels.filter((x) => x.enabled).length
          return { ...c, badge: `${n} aktif` }
        }
        if (c.id === 'odeme') {
          const n = odeme.payments.filter((x) => x.active).length
          return { ...c, badge: `${n} aktif` }
        }
        if (c.id === 'salon') {
          return { ...c, badge: `${salon.totalTables} masa` }
        }
        if (c.id === 'uretim') {
          return { ...c, badge: `${uretim.areas.length} birim` }
        }
        return c
      })

      const source =
        kanallar.source === 'api' ||
        odeme.source === 'api' ||
        salon.source === 'api' ||
        uretim.source === 'api'
          ? ('api' as const)
          : ('mock' as const)

      return { cards, source }
    },
    { persist: true, isCacheable: (d) => d.source === 'api' },
  )
}

// ── Cariler ──────────────────────────────────────────────────────────────────

export type CarilerPageData = {
  list: Cari[]
  source: 'api' | 'mock'
}

function phoneDigits10(raw: unknown): string {
  const d = str(raw).replace(/\D/g, '')
  return d.length >= 10 ? d.slice(-10) : d
}

function formatTrMobile(raw: unknown): string {
  const d = phoneDigits10(raw)
  if (d.length !== 10) return ''
  if (d === d[0]!.repeat(10)) return ''
  return `0${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 8)} ${d.slice(8)}`
}

function isPhoneLikeName(name: string, phoneRaw: unknown): boolean {
  const trimmed = name.trim()
  if (!trimmed) return true
  const want = phoneDigits10(phoneRaw)
  if (want.length < 10) return false
  const got = phoneDigits10(trimmed)
  return got.length >= 10 && got === want
}

function groupNameOf(row: Record<string, unknown>): string {
  const g = asMap(row.customerGroup ?? row.supplierGroup ?? row.group)
  return str(g?.name ?? row.groupName)
}

function cariPartyName(row: Record<string, unknown>, kind: 'musteri' | 'tedarikci'): string {
  const phoneRaw = str(row.phone)
  const phone = formatTrMobile(phoneRaw)
  const candidates = [
    row.crmDisplayName,
    row.officialName,
    row.linkedCustomerName,
    row.fullName,
    row.name,
    row.title,
  ]
  for (const c of candidates) {
    const s = str(c)
    if (s && !isPhoneLikeName(s, phoneRaw)) return s
  }
  return phone || (kind === 'musteri' ? 'Adsız müşteri' : 'Adsız tedarikçi')
}

function cariBalanceOf(row: Record<string, unknown>): number {
  const ledger = row.accountingBalance
  if (ledger != null && str(ledger) !== '') return num(ledger)
  return num(row.openingBalance)
}

function mapCariRow(raw: unknown, i: number, type: Cari['type']): Cari {
  const row = asMap(raw) ?? {}
  const name = cariPartyName(row, type)
  const phone = formatTrMobile(row.phone)
  const group = groupNameOf(row)
  const subtitle = phone && phone !== name ? phone : group && group !== name ? group : ''
  const hasAccount = type === 'tedarikci' || row.hasCurrentAccount === true
  return {
    id: str(row.id ?? `${type}-${i}`),
    name,
    type,
    balance: hasAccount ? cariBalanceOf(row) : 0,
    lastMovement: subtitle || '—',
    subtitle,
    hasCurrentAccount: hasAccount,
    ledger: [],
  }
}

export async function loadCarilerPage(): Promise<CarilerPageData> {
  const session = readNativeSession()
  if (!session?.token) return { list: [], source: 'mock' }

  const listQuery = { page: '1', take: '80', sortBy: 'fullName', sortDir: 'asc' }
  const [cust, supp] = await Promise.all([
    bossFetch<{ items?: unknown[]; rows?: unknown[]; customers?: unknown[] }>('/api/customers', {
      query: listQuery,
    }),
    bossFetch<{ items?: unknown[]; rows?: unknown[]; suppliers?: unknown[] }>('/api/suppliers', {
      query: listQuery,
    }),
  ])

  const custRaw = asList(cust.data?.items ?? cust.data?.rows ?? cust.data?.customers)
  const suppRaw = asList(supp.data?.items ?? supp.data?.rows ?? supp.data?.suppliers)

  if (!custRaw.length && !suppRaw.length) return { list: [], source: 'api' }

  const list: Cari[] = [
    ...custRaw.map((r, i) => mapCariRow(r, i, 'musteri')),
    ...suppRaw.map((r, i) => mapCariRow(r, i, 'tedarikci')),
  ]

  return { list, source: 'api' }
}

// ── Lisanslar ────────────────────────────────────────────────────────────────

export type LisanslarPageData = {
  list: Lisans[]
  source: 'api' | 'mock'
}

/** Cloud license-status yanıtı (stock + boss aynı şekil). */
type LicenseStatusApi = {
  ok?: boolean
  productNameTr?: string | null
  productNameEn?: string | null
  validUntil?: string | null
}

function lisansFromStatus(
  id: string,
  fallbackName: string,
  description: string,
  d: LicenseStatusApi,
): Lisans {
  const licensed = d.ok === true
  const until = str(d.validUntil) ? new Date(str(d.validUntil)) : null
  const validTime = until && !Number.isNaN(until.getTime()) ? until.getTime() : null
  const daysLeft =
    licensed && validTime != null
      ? Math.max(0, Math.ceil((validTime - Date.now()) / 86_400_000))
      : null
  const status: Lisans['status'] = !licensed
    ? 'yok'
    : daysLeft != null && daysLeft <= 30
      ? 'yaklasıyor'
      : 'aktif'
  return {
    id,
    name: str(d.productNameTr ?? d.productNameEn, fallbackName),
    description,
    status,
    // Sahte bitiş tarihi yazılmaz — yalnızca API'den gelen validUntil
    expiresAt:
      licensed && validTime != null
        ? new Date(validTime).toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })
        : null,
    daysLeft,
  }
}

export async function loadLisanslarPage(): Promise<LisanslarPageData> {
  const session = readNativeSession()
  if (!session?.token) return { list: [], source: 'mock' }

  // Yalnızca gerçek lisans API'lerinden satır üretilir; API'de olmayan ürün için satır yok
  const [stockLic, bossLic] = await Promise.all([
    bossFetch<LicenseStatusApi>('/api/stock/license-status'),
    bossFetch<LicenseStatusApi>('/api/boss/license-status'),
  ])

  const list: Lisans[] = []
  if (stockLic.ok && stockLic.data) {
    list.push(
      lisansFromStatus('stok', 'Stok Takip', 'Gelişmiş depo ve fire yönetimi', stockLic.data),
    )
  }
  if (bossLic.ok && bossLic.data) {
    list.push(
      lisansFromStatus('boss', 'Restroid Boss', 'Patron uygulaması lisansı', bossLic.data),
    )
  }

  return { list, source: 'api' }
}

// ── Kasa hesapları (hareket formu) ───────────────────────────────────────────

export type AccountsPageData = {
  accounts: Account[]
  source: 'api' | 'mock'
}

function mapFinanceAccount(raw: unknown, i: number): Account {
  const row = asMap(raw) ?? {}
  const bal = parseMoneyTR(row.balance ?? row.currentBalance ?? row.computed_balance)
  const kind = str(row.type ?? row.kind).toLowerCase()
  let type: Account['type'] = 'cash'
  if (kind.includes('bank')) type = 'bank'
  else if (kind.includes('pos') || kind.includes('card')) type = 'pos'
  return {
    id: str(row.id ?? i),
    name: str(row.name ?? row.title ?? row.label, `Hesap ${i + 1}`),
    type,
    balance: formatMoneyTR(bal, bal % 1 === 0 ? 0 : 2),
    currency: '₺',
  }
}

export async function loadAccountsPage(): Promise<AccountsPageData> {
  const session = readNativeSession()
  if (!session?.token) return { accounts: [], source: 'mock' }

  // GET /api/accounting/accounts yok — hesap listesi meta’da
  const res = await bossFetch<{ accounts?: unknown[]; cashAccounts?: unknown[] }>(
    '/api/accounting/meta',
  )
  if (!res.ok || !res.data) return { accounts: [], source: 'api' }

  const raw = asList(res.data.accounts ?? res.data.cashAccounts)
  const accounts = raw.map(mapFinanceAccount)
  return { accounts, source: 'api' }
}

export type ExpenseCategoryOption = {
  id: string
  name: string
  parentId?: string | null
  children: ExpenseCategoryOption[]
  subcategories: { id: string; name: string }[]
}

function mapExpenseCategoryNode(raw: unknown): ExpenseCategoryOption | null {
  const row = asMap(raw) ?? {}
  const id = str(row.id)
  if (!id) return null
  const nestedSrc = Array.isArray(row.children) && row.children.length > 0 ? row.children : row.subcategories
  const children = asList(nestedSrc)
    .map(mapExpenseCategoryNode)
    .filter((x): x is ExpenseCategoryOption => Boolean(x))
  return {
    id,
    name: str(row.name, 'Kategori'),
    parentId: row.parentId == null || row.parentId === '' ? null : str(row.parentId),
    children,
    subcategories: children.map((c) => ({ id: c.id, name: c.name })),
  }
}

export function flattenExpenseCategoryOptions(
  cats: ExpenseCategoryOption[],
  prefix = '',
): Array<{ id: string; label: string }> {
  const out: Array<{ id: string; label: string }> = []
  for (const c of cats) {
    const label = prefix ? `${prefix} → ${c.name}` : c.name
    out.push({ id: c.id, label })
    out.push(...flattenExpenseCategoryOptions(c.children, label))
  }
  return out
}

export function insertExpenseCategoryChild(
  cats: ExpenseCategoryOption[],
  parentId: string,
  child: ExpenseCategoryOption,
): ExpenseCategoryOption[] {
  return cats.map((n) => {
    if (n.id === parentId) {
      const children = [...n.children, child]
      return { ...n, children, subcategories: children.map((c) => ({ id: c.id, name: c.name })) }
    }
    if (n.children.length === 0) return n
    return { ...n, children: insertExpenseCategoryChild(n.children, parentId, child) }
  })
}

export async function loadExpenseCategories(): Promise<ExpenseCategoryOption[]> {
  const res = await bossFetch<{ categories?: unknown[] }>('/api/accounting/meta')
  if (!res.ok || !res.data) return []
  return asList(res.data.categories)
    .map(mapExpenseCategoryNode)
    .filter((x): x is ExpenseCategoryOption => Boolean(x))
}

export async function createExpenseCategoryLookup(
  name: string,
  parentId?: string,
): Promise<{ id: string; label: string } | null> {
  const res = await bossFetch<{ id?: string; label?: string }>('/api/accounting/lookups', {
    method: 'POST',
    body: JSON.stringify({
      entity: 'expenseCategory',
      name: name.trim(),
      ...(parentId ? { parentId } : {}),
    }),
  })
  if (!res.ok || !res.data?.id) return null
  invalidateBossCache('api:accounting')
  return { id: String(res.data.id), label: String(res.data.label ?? name) }
}

export async function createExpenseSubcategoryLookup(
  name: string,
  parentId: string,
): Promise<{ id: string; label: string } | null> {
  return createExpenseCategoryLookup(name, parentId)
}

export async function createFinanceAccount(input: {
  name: string
  type?: 'cash' | 'bank' | 'card'
}): Promise<{ ok: boolean; account?: Account; error?: string }> {
  const res = await bossFetch<Record<string, unknown>>('/api/accounting/accounts', {
    method: 'POST',
    body: JSON.stringify({
      name: input.name.trim(),
      type: input.type ?? 'cash',
      currencyCode: 'TRY',
      balance: 0,
    }),
  })
  if (!res.ok || !res.data) {
    return { ok: false, error: String(res.error ?? 'Hesap eklenemedi') }
  }
  invalidateBossCache('api:accounting')
  invalidateBossCache('fn:loadAccountsPage')
  invalidateBossCache('fn:loadKasaDashboard')
  invalidateBossCache('page:kasa')
  return { ok: true, account: mapFinanceAccount(res.data, 0) }
}

export async function postCashMovement(input: {
  type: string
  accountId: string
  amount: number
  note?: string
  targetAccountId?: string
  expenseCategoryId?: string
  expenseSubcategoryId?: string
  expenseCategoryName?: string
  expenseSubcategoryName?: string
}): Promise<{ ok: boolean; error?: string }> {
  // cloud CreateBody: action (AccountingAction), description — not type/note
  let action = 'CASH_IN'
  if (input.type === 'cikis') action = 'CASH_OUT'
  else if (input.type === 'gider') action = 'EXPENSE'
  else if (input.type === 'transfer') action = 'TRANSFER_OUT'

  const body: Record<string, unknown> = {
    accountId: input.accountId,
    amount: input.amount,
    action,
    description: input.note || undefined,
  }
  if (action === 'TRANSFER_OUT') {
    body.targetAccountId = input.targetAccountId
  }
  if (action === 'EXPENSE') {
    if (input.expenseCategoryId) body.expenseCategoryId = input.expenseCategoryId
    if (input.expenseSubcategoryId) body.expenseSubcategoryId = input.expenseSubcategoryId
    if (input.expenseCategoryName) body.expenseCategoryName = input.expenseCategoryName
    if (input.expenseSubcategoryName) {
      body.expenseSubcategoryName = input.expenseSubcategoryName
    }
  }

  const res = await bossFetch('/api/accounting/transactions', {
    method: 'POST',
    body: JSON.stringify(body),
  })
  if (res.ok) {
    invalidateBossCache('api:accounting')
    invalidateBossCache('fn:loadKasaDashboard')
    invalidateBossCache('fn:loadFinansDashboard')
    invalidateBossCache('fn:loadAccountsPage')
    invalidateBossCache('page:finans')
    invalidateBossCache('page:kasa')
    invalidateBossCache('page:kasa-ledger:')
  }
  return { ok: res.ok, error: res.error }
}

// ── Raporlar ─────────────────────────────────────────────────────────────────

export type RaporlarPageData = {
  productByPeriod: Record<ReportPeriod, ProductRow[]>
  source: 'api' | 'mock'
}

function mapTopProductRows(list: unknown[]): ProductRow[] {
  return list.slice(0, 20).map((r, i) => {
    const row = asMap(r) ?? {}
    const qty = num(row.qty ?? row.quantity ?? row.count)
    const revenue = num(row.amount ?? row.revenue ?? row.total)
    return {
      rank: i + 1,
      name: str(row.name ?? row.productName ?? row.title, `Ürün ${i + 1}`),
      qty,
      revenue: `₺${formatMoneyTR(revenue)}`,
      trend: 'flat' as const,
    }
  })
}

export async function loadRaporlarPage(): Promise<RaporlarPageData> {
  const session = readNativeSession()
  if (!session?.token) {
    return { productByPeriod: PRODUCT_REPORT, source: 'mock' }
  }

  const fetchWindow = (days: number) =>
    withBossCache(
      `api:sales-analysis:full:${days}g`,
      BOSS_TTL.kpi,
      () =>
        bossFetch<Record<string, unknown>>('/api/branches/sales-analysis', {
          query: { days: String(days), part: 'full' },
        }),
      { isCacheable: (r) => Boolean(r.ok && r.data) },
    )

  const [today, week, month] = await Promise.all([
    fetchSalesAnalysisTodayFull(),
    fetchWindow(7),
    fetchWindow(30),
  ])

  if (!today.ok && !week.ok && !month.ok) {
    // API hatasında örnek rapor gösterilmez — boş + hata durumu
    return {
      productByPeriod: { 'Bugün': [], '7 Gün': [], '30 Gün': [] },
      source: 'api',
    }
  }

  // Oturum + API varken örnek ürün raporu gösterme — boş liste doğru durum.
  const rowsFor = (res: { data: Record<string, unknown> | null }) =>
    mapTopProductRows(asList(asMap(res.data)?.topProducts))

  return {
    productByPeriod: {
      Bugün: rowsFor(today),
      '7 Gün': rowsFor(week),
      '30 Gün': rowsFor(month),
    },
    source: 'api',
  }
}

// ── Sahip / Z raporları ──────────────────────────────────────────────────────

export type SahipPageData = {
  months: SahipAylik[]
  source: 'api' | 'mock'
}

export async function loadSahipPage(): Promise<SahipPageData> {
  const session = readNativeSession()
  if (!session?.token) return { months: [], source: 'mock' }

  const res = await bossFetch<Record<string, unknown>>('/api/finance/owner-overview', {
    query: { days: '30' },
  })
  if (!res.ok || !res.data) return { months: [], source: 'api' }

  // Cloud FinanceOwnerOverview: sales.summary + periodInsight + payrollByType
  const d = res.data
  const sales = asMap(d.sales) ?? {}
  const summary = asMap(sales.summary) ?? {}
  const insight = asMap(d.periodInsight) ?? {}
  const ciro = num(summary.netSales ?? summary.closedNetSales)
  const maliyet = num(insight.approxStockIssueCost)
  let personel = 0
  for (const raw of asList(d.payrollByType)) {
    personel += Math.abs(num(asMap(raw)?.amount))
  }
  const karRaw = insight.simplifiedNetAfterLoad
  const kar =
    karRaw != null && Number.isFinite(Number(karRaw))
      ? Number(karRaw)
      : ciro - Math.abs(num(summary.expenses)) - Math.abs(num(summary.waste)) - personel
  const foodPct = insight.foodCostProxyPct
  const ratio =
    foodPct != null && Number.isFinite(Number(foodPct))
      ? `${Number(foodPct).toFixed(1)}%`
      : ciro > 0 && maliyet > 0
        ? `${((maliyet / ciro) * 100).toFixed(1)}%`
        : '—'

  const now = new Date()
  const monthLabel = now.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })
  const current: SahipAylik = {
    month: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
    ciro: `₺${formatMoneyTR(ciro)}`,
    maliyet: `₺${formatMoneyTR(maliyet)}`,
    karProxy: `₺${formatMoneyTR(kar)}`,
    personelGider: `₺${formatMoneyTR(personel)}`,
    ciroDelta: '—',
    maliyetRatio: ratio,
    kasaShortage: `₺${formatMoneyTR(num(asMap(d.cashShiftVariance)?.shortageAmount), 2)}`,
    kasaSurplus: `₺${formatMoneyTR(num(asMap(d.cashShiftVariance)?.surplusAmount), 2)}`,
    closedShifts: Math.max(0, Math.floor(num(asMap(d.cashShiftVariance)?.closedCount))),
  }

  // API varken örnek geçmiş aylar gösterilmez — yalnızca gerçek dönem.
  return { months: [current], source: 'api' }
}

export type ZPageData = {
  reports: ZReport[]
  source: 'api' | 'mock'
}

export async function loadZReportsPage(): Promise<ZPageData> {
  const session = readNativeSession()
  if (!session?.token) return { reports: [], source: 'mock' }

  // Gerçek Z arşivi: köprünün fiscal.z_report olayları (TenantFiscalZReportReadModel).
  const res = await bossFetch<{ items?: unknown[] }>('/api/finance/z-reports', {
    query: { page: '1', pageSize: '30' },
  })
  if (!res.ok || !res.data) return { reports: [], source: 'api' }

  const rows = asList(res.data.items)
  const reports: ZReport[] = rows.map((r, i) => {
    const row = asMap(r) ?? {}
    const reportAt = str(row.reportAt ?? row.occurredAt)
    const zNo = num(row.localZReportId)
    return {
      id: str(row.id ?? i),
      zNo: zNo > 0 ? `Z-${zNo}` : str(row.sourceEventId, `Z-${i + 1}`).slice(0, 12),
      terminal: str(row.cashRegisterLabels, 'Kasa'),
      total: `₺${formatMoneyTR(num(row.totalSales ?? row.productAmount))}`,
      // Liste API'sinde ödeme kırılımı yok — örnek rakam basma.
      nakit: '—',
      kart: '—',
      time: reportAt.slice(11, 16) || '--:--',
      date: fmtDateShort(reportAt),
      receiptCount: 0,
      cancelTotal: `₺${formatMoneyTR(num(row.productCanceledAmount))}`,
      cashCountDifference: num(row.cashCountDifference),
      cashShiftVariance: num(row.cashShiftVariance),
    }
  })

  // Oturum + API varken örnek Z listesi gösterme — boş liste doğru durum.
  return { reports, source: 'api' }
}

export type BossCashShiftRow = {
  id: string
  seq: number
  mode: 'pool' | 'wallet'
  personnelName: string
  startedAt: string
  closedAt: string | null
  countedAmount: number
  dropAmount: number
  floatLeft: number
  varianceAmount: number
}

export type BossCashShiftSummary = {
  closedCount: number
  shortageAmount: number
  surplusAmount: number
  netVariance: number
}

export type CashShiftsPageData = {
  items: BossCashShiftRow[]
  summary: BossCashShiftSummary
  from: string
  to: string
  source: 'api' | 'mock'
}

export async function loadCashShiftsPage(): Promise<CashShiftsPageData> {
  const session = readNativeSession()
  const to = todayYmd()
  const from = ymdDaysAgo(29)
  const empty: CashShiftsPageData = {
    items: [],
    summary: { closedCount: 0, shortageAmount: 0, surplusAmount: 0, netVariance: 0 },
    from,
    to,
    source: 'mock',
  }
  if (!session?.token) return empty

  const res = await bossFetch<{
    items?: unknown[]
    summary?: Record<string, unknown>
  }>('/api/finance/cash-shifts', {
    query: { page: '1', pageSize: '40', from, to },
  })
  if (!res.ok || !res.data) return { ...empty, source: 'api' }

  const summaryMap = asMap(res.data.summary) ?? {}
  const items: BossCashShiftRow[] = asList(res.data.items).map((raw, i) => {
    const row = asMap(raw) ?? {}
    const mode = str(row.mode) === 'wallet' ? 'wallet' : 'pool'
    return {
      id: str(row.id ?? i),
      seq: Math.max(0, Math.floor(num(row.seq))),
      mode,
      personnelName: str(row.personnelName, '—'),
      startedAt: str(row.startedAt),
      closedAt: str(row.closedAt) || null,
      countedAmount: num(row.countedAmount),
      dropAmount: num(row.dropAmount),
      floatLeft: num(row.floatLeft),
      varianceAmount: num(row.varianceAmount),
    }
  })
  return {
    items,
    summary: {
      closedCount: Math.max(0, Math.floor(num(summaryMap.closedCount))),
      shortageAmount: num(summaryMap.shortageAmount),
      surplusAmount: num(summaryMap.surplusAmount),
      netVariance: num(summaryMap.netVariance),
    },
    from,
    to,
    source: 'api',
  }
}

export type BossTimesheetRow = {
  id: string
  personnelName: string
  startedAt: string
  endedAt: string | null
  hours: number | null
  source: string
}

export type BossTimesheetHours = {
  personnelId: string
  fullName: string
  workedHours: number
}

export type TimesheetPageData = {
  yearMonth: string
  rows: BossTimesheetRow[]
  hoursByPersonnel: BossTimesheetHours[]
  source: 'api' | 'mock'
}

export async function loadTimesheetPage(): Promise<TimesheetPageData> {
  const session = readNativeSession()
  const now = new Date()
  const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  if (!session?.token) return { yearMonth, rows: [], hoursByPersonnel: [], source: 'mock' }

  const res = await bossFetch<{
    yearMonth?: string
    rows?: unknown[]
    hoursByPersonnel?: unknown[]
  }>('/api/restaurant/personnel/attendance', {
    query: { yearMonth },
  })
  if (!res.ok || !res.data) {
    return { yearMonth, rows: [], hoursByPersonnel: [], source: 'api' }
  }

  const sourceLabel = (raw: string): string => {
    if (raw === 'shift_close') return 'Vardiya kapanışı'
    if (raw === 'z') return 'Gün sonu'
    if (raw === 'manual') return 'Elle'
    return 'PIN'
  }

  const rows: BossTimesheetRow[] = asList(res.data.rows).map((raw, i) => {
    const row = asMap(raw) ?? {}
    const hoursRaw = row.hours
    const hours =
      hoursRaw == null || hoursRaw === '' ? null : num(hoursRaw)
    return {
      id: str(row.id ?? i),
      personnelName: str(row.personnelName, '—'),
      startedAt: str(row.startedAt),
      endedAt: str(row.endedAt) || null,
      hours: hoursRaw == null || hoursRaw === '' ? null : hours,
      source: sourceLabel(str(row.source)),
    }
  })
  const hoursByPersonnel: BossTimesheetHours[] = asList(res.data.hoursByPersonnel).map((raw, i) => {
    const row = asMap(raw) ?? {}
    return {
      personnelId: str(row.personnelId ?? i),
      fullName: str(row.fullName, '—'),
      workedHours: num(row.workedHours),
    }
  })
  return {
    yearMonth: str(res.data.yearMonth, yearMonth),
    rows,
    hoursByPersonnel,
    source: 'api',
  }
}

