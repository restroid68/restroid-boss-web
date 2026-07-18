/**
 * Loaders for non-P0 Boss pages — API first, mock fallback.
 */
import {
  MENU_ITEMS,
  MENU_CATEGORIES,
  PRODUCTS,
  PRODUCT_CATEGORIES,
  PERSONEL_LIST,
  SERVICE_CHANNELS,
  STOK_ITEMS,
  STOK_WAREHOUSES,
  STOK_KPI,
  SAYIMLAR,
  STOK_TRANSFERS,
  FIRE_DATA,
  CARILER,
  LISANSLAR,
  ACCOUNTS,
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
  SAHIP_RAPORLAR,
  Z_REPORTS,
} from '@/lib/boss-mock'
import {
  bossFetch,
  fetchSalesAnalysisTodayFull,
  formatMoneyTR,
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

function num(v: unknown): number {
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : 0
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

function mapCatalogRow(row: CatalogRow): MenuItem & { sku: string; categoryId?: string } {
  const name = str(row.nameTr ?? row.name ?? row.title, 'Ürün')
  const price = num(row.price ?? row.salePrice ?? row.unitPrice)
  const stockStatus = row.stockStatus
  const depleted =
    stockStatus === false ||
    stockStatus === 0 ||
    stockStatus === 'depleted' ||
    row.depleted === true ||
    row.isDepleted === true
  const active =
    row.active !== false &&
    row.isActive !== false &&
    row.hidden !== true &&
    row.status !== 'passive'
  return {
    id: str(row.uuid ?? row.id),
    name,
    category: str(row.categoryName ?? row.category ?? 'Diğer', 'Diğer'),
    price: Math.round(price),
    active,
    tukendi: depleted,
    stock: depleted ? 0 : null,
    sku: str(row.code ?? row.plu ?? ''),
    categoryId: str(row.categoryId ?? row.category_id) || undefined,
  }
}

function toProduct(m: MenuItem & { sku: string }): Product {
  const stock = m.tukendi ? 0 : m.stock ?? 20
  const minStock = 5
  let status: Product['status'] = 'normal'
  if (stock === 0) status = 'tukendi'
  else if (stock < minStock) status = 'dusuk'
  return {
    id: m.id,
    name: m.name,
    category: m.category,
    sku: m.sku || m.id.slice(0, 8),
    stock,
    unit: 'adet',
    minStock,
    status,
    price: `₺${formatMoneyTR(m.price)}`,
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
      const fallback: CatalogPageData = {
        items: MENU_ITEMS,
        categories: MENU_CATEGORIES,
        products: PRODUCTS,
        productCategories: PRODUCT_CATEGORIES,
        source: 'mock',
      }
      const session = readNativeSession()
      if (!session?.token) return fallback

      const res = await bossFetch<{ rows?: CatalogRow[]; total?: number }>(
        '/api/products/catalog/page',
        { query: { offset: '0', limit: '200' } },
      )
      if (!res.ok || !res.data) return fallback
      const rows = asList(res.data.rows) as CatalogRow[]
      if (!rows.length) return fallback

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
  const res = await bossFetch('/api/products', {
    method: 'POST',
    body: JSON.stringify({
      bulkProductPatches: [{ row: { uuid, code, stockStatus } }],
    }),
  })
  if (res.ok) {
    invalidateBossCache('page:catalog')
    invalidateBossCache('fn:loadCatalogPage')
  }
  return res.ok
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
  if (!session?.token) return { list: PERSONEL_LIST, source: 'mock' }

  const res = await bossFetch<{ items?: unknown[]; personnel?: unknown[]; rows?: unknown[] }>(
    '/api/restaurant/personnel',
  )
  if (!res.ok || !res.data) return { list: PERSONEL_LIST, source: 'mock' }

  const raw = asList(res.data.items ?? res.data.personnel ?? res.data.rows)
  if (!raw.length) return { list: PERSONEL_LIST, source: 'mock' }

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
  dinein: { label: 'Dine-in', description: 'Restoran içi masa servisi' },
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

export type KanallarPageData = {
  channels: ServiceChannel[]
  source: 'api' | 'mock'
}

export async function loadKanallarPage(): Promise<KanallarPageData> {
  return withBossCache(
    'page:kanallar',
    BOSS_TTL.definitions,
    async () => {
      const session = readNativeSession()
      if (!session?.token) return { channels: SERVICE_CHANNELS, source: 'mock' as const }

      const res = await bossFetch<unknown>('/api/service-channels')
      if (!res.ok || res.data == null) return { channels: SERVICE_CHANNELS, source: 'mock' as const }

      const raw = Array.isArray(res.data)
        ? res.data
        : asList(asMap(res.data)?.channels ?? asMap(res.data)?.items ?? asMap(res.data)?.rows)

      if (!raw.length) return { channels: SERVICE_CHANNELS, source: 'mock' as const }

      const channels: ServiceChannel[] = raw.map((r) => {
        const row = asMap(r) ?? {}
        const code = str(row.code ?? row.id).toLowerCase()
        const meta = CHANNEL_META[code] ?? {
          label: str(row.nameTr ?? row.name ?? row.label, code),
          description: str(row.description, 'Servis kanalı'),
        }
        return {
          id: code || str(row.id),
          label: meta.label,
          description: meta.description,
          enabled:
            row.isActive === true ||
            row.enabled === true ||
            row.isEnabled === true ||
            row.active === true,
        }
      })

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

  const [whRes, defRes, balRes, countsRes] = await Promise.all([
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
  ])

  if (!whRes.ok && !defRes.ok) return fallback

  const whRaw = Array.isArray(whRes.data)
    ? whRes.data
    : asList(asMap(whRes.data)?.items ?? asMap(whRes.data)?.warehouses)
  const warehouses: StokWarehouse[] = whRaw.length
    ? whRaw.map((w, i) => {
        const row = asMap(w) ?? {}
        return { id: str(row.id ?? row.code ?? i), name: str(row.name ?? row.code, `Depo ${i + 1}`) }
      })
    : STOK_WAREHOUSES

  const defaultWh = warehouses[0]?.id ?? 'w1'
  const balances = balRes.data?.balances ?? {}

  const materials = asList(defRes.data?.materials)
  const semis = asList(defRes.data?.semiProducts)
  const finished = asList(defRes.data?.finishedProducts)
  const defs = [...materials, ...semis, ...finished]

  const items: StokItem[] = defs.length
    ? defs.map((raw, i) => {
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
          unit: str(row.unitId ?? row.unit ?? 'adet', 'adet'),
          minStock: minStock || 1,
          status,
          lastMovement: '—',
          value: `₺${formatMoneyTR(qty * unitCost)}`,
        }
      })
    : STOK_ITEMS

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

  return {
    warehouses,
    items,
    kpi: {
      toplamDeger: `₺${formatMoneyTR(totalValue)}`,
      kritikAdet: kritik,
      bugunFireTutar: STOK_KPI.bugunFireTutar,
      acikSayim: acikSayim || STOK_KPI.acikSayim,
    },
    source: defRes.ok || whRes.ok ? 'api' : 'mock',
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
    return { sayimlar: SAYIMLAR, warehouses: hub.warehouses, source: 'mock' }
  }

  const res = await bossFetch<{ items?: unknown[]; rows?: unknown[] }>('/api/stock/inventory-counts', {
    query: { page: '1', pageSize: '50' },
  })
  if (!res.ok) {
    return { sayimlar: SAYIMLAR, warehouses: hub.warehouses, source: hub.source }
  }

  const raw = asList(res.data?.items ?? res.data?.rows)
  if (!raw.length) {
    return { sayimlar: SAYIMLAR, warehouses: hub.warehouses, source: hub.source }
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
    return { transfers: STOK_TRANSFERS, warehouses: hub.warehouses, source: 'mock' }
  }

  const res = await bossFetch<{ items?: unknown[]; rows?: unknown[] }>('/api/stock/transfers', {
    query: { page: '1', pageSize: '50' },
  })
  if (!res.ok) {
    return { transfers: STOK_TRANSFERS, warehouses: hub.warehouses, source: hub.source }
  }

  const raw = asList(res.data?.items ?? res.data?.rows)
  if (!raw.length) {
    return { transfers: STOK_TRANSFERS, warehouses: hub.warehouses, source: hub.source }
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

export async function loadFirePage(): Promise<FirePageData> {
  const hub = await loadStokHub()
  const session = readNativeSession()
  if (!session?.token) {
    return { byPeriod: FIRE_DATA, warehouses: hub.warehouses, source: 'mock' }
  }

  const day = todayYmd()
  const res = await bossFetch<{ items?: unknown[]; rows?: unknown[] }>('/api/stock/movement-logs', {
    query: { page: '1', pageSize: '80', type: 'waste', from: day },
  })

  // Also try without type filter if empty
  let raw = asList(res.data?.items ?? res.data?.rows)
  if (!res.ok || !raw.length) {
    const alt = await bossFetch<{ items?: unknown[]; rows?: unknown[] }>('/api/stock/document-logs', {
      query: { page: '1', pageSize: '40' },
    })
    raw = asList(alt.data?.items ?? alt.data?.rows)
  }

  if (!raw.length) {
    return { byPeriod: FIRE_DATA, warehouses: hub.warehouses, source: hub.source }
  }

  const entries: FireEntry[] = raw
    .map((r, i) => {
      const row = asMap(r) ?? {}
      const type = str(row.type ?? row.docType ?? row.reason).toLowerCase()
      const looksWaste =
        type.includes('waste') ||
        type.includes('fire') ||
        type.includes('spoil') ||
        type.includes('loss')
      if (!looksWaste && raw.length > 10) return null
      return {
        id: str(row.id ?? i),
        name: str(row.itemName ?? row.name ?? row.title, 'Kalem'),
        qty: num(row.qty ?? row.quantity ?? Math.abs(num(row.signedQty))),
        unit: str(row.unit ?? 'adet', 'adet'),
        warehouseId: str(row.warehouseId ?? hub.warehouses[0]?.id),
        reason: str(row.reason ?? row.note ?? row.typeLabel, 'Fire'),
        amount: `₺${formatMoneyTR(Math.abs(num(row.amount ?? row.cost ?? 0)))}`,
        date: fmtDateTime(row.createdAt ?? row.date),
      } satisfies FireEntry
    })
    .filter(Boolean) as FireEntry[]

  if (!entries.length) {
    return { byPeriod: FIRE_DATA, warehouses: hub.warehouses, source: hub.source }
  }

  return {
    byPeriod: {
      Bugün: entries,
      '7 Gün': entries,
      '30 Gün': entries,
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
  status: string
  amount: string
  time: string
  customer: string
}

export type OrdersPageData = {
  orders: BossOrderRow[]
  source: 'api' | 'mock'
}

/** API status / statusLabel → Türkçe; ham enum UI’ya düşmez. */
const ORDER_STATUS_TR: Record<string, string> = {
  pending: 'Beklemede',
  new: 'Yeni',
  accepted: 'Onaylandı',
  confirmed: 'Onaylandı',
  preparing: 'Hazırlanıyor',
  preparation: 'Hazırlanıyor',
  in_preparation: 'Hazırlanıyor',
  ready: 'Hazır',
  out_for_delivery: 'Yolda',
  delivering: 'Yolda',
  on_the_way: 'Yolda',
  delivered: 'Teslim',
  completed: 'Tamamlandı',
  done: 'Tamamlandı',
  cancelled: 'İptal',
  canceled: 'İptal',
  rejected: 'Reddedildi',
  failed: 'Başarısız',
  refunded: 'İade',
  scheduled: 'Zamanlanmış',
  picked_up: 'Teslim alındı',
  pickup: 'Gel-al',
}

function labelOrderStatus(raw: unknown): string {
  const s = str(raw).trim()
  if (!s || s === '—') return '—'
  // Zaten Türkçe görünüyorsa (boşluk / Türkçe karakter) olduğu gibi bırak
  if (/[çğıöşüÇĞİÖŞÜ ]/.test(s) || !/^[a-zA-Z0-9_-]+$/.test(s)) return s
  const key = s
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .toLowerCase()
  return ORDER_STATUS_TR[key] ?? 'Durum'
}

function mapOrderRows(raw: unknown[]): BossOrderRow[] {
  return raw.map((r, i) => {
    const row = asMap(r) ?? {}
    const amount = num(row.totalAmount ?? row.grandTotal ?? row.amount ?? row.total)
    return {
      id: str(row.id ?? row.orderId ?? i),
      title: str(
        row.externalOrderId ?? row.orderNo ?? row.code ?? `#${i + 1}`,
        `Sipariş ${i + 1}`,
      ),
      platform: str(row.platformName ?? row.platform ?? row.source ?? 'Online'),
      status: labelOrderStatus(row.statusLabel ?? row.status ?? '—'),
      amount: `₺${formatMoneyTR(amount)}`,
      time: fmtDateTime(row.createdAt ?? row.orderedAt),
      customer: str(row.customerName ?? row.guestName ?? row.phone, '—'),
    }
  })
}

export async function loadOnlineOrdersPage(): Promise<OrdersPageData> {
  const session = readNativeSession()
  if (!session?.token) return { orders: [], source: 'mock' }

  const res = await bossFetch<{ rows?: unknown[]; items?: unknown[] }>('/api/sales/online-orders', {
    query: { page: '1', pageSize: '40' },
  })
  if (!res.ok) return { orders: [], source: 'mock' }
  const raw = asList(res.data?.rows ?? res.data?.items)
  return { orders: mapOrderRows(raw), source: 'api' }
}

export async function loadQrOrdersPage(): Promise<OrdersPageData> {
  const session = readNativeSession()
  if (!session?.token) return { orders: [], source: 'mock' }

  const res = await bossFetch<{ rows?: unknown[]; items?: unknown[] }>(
    '/api/sales/qr-menu-orders',
    { query: { page: '1', pageSize: '40' } },
  )
  if (!res.ok) return { orders: [], source: 'mock' }
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
      if (!session?.token) return { payments: mock, source: 'mock' as const }

      const res = await bossFetch<unknown>('/api/definitions/payment-types')
      if (!res.ok || res.data == null) return { payments: mock, source: 'mock' as const }

      const raw = Array.isArray(res.data)
        ? res.data
        : asList(asMap(res.data)?.items ?? asMap(res.data)?.rows ?? asMap(res.data)?.paymentTypes)

      if (!raw.length) return { payments: mock, source: 'mock' as const }

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
        return { salons: [], totalTables: 0, source: 'mock' as const }
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
      if (!session?.token) return { areas: mock, source: 'mock' as const }

      const res = await bossFetch<unknown>('/api/definitions/production-areas')
      if (!res.ok || res.data == null) return { areas: mock, source: 'mock' as const }

      const raw = Array.isArray(res.data)
        ? res.data
        : asList(asMap(res.data)?.items ?? asMap(res.data)?.areas ?? asMap(res.data)?.rows)

      if (!raw.length) return { areas: mock, source: 'mock' as const }

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
    return {
      bridgeOnline: false,
      bridgeLabel: 'Köprü yanıt vermedi',
      detail: res.error || 'Durum alınamadı',
      source: 'mock',
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

export async function loadCarilerPage(): Promise<CarilerPageData> {
  const session = readNativeSession()
  if (!session?.token) return { list: CARILER, source: 'mock' }

  const [cust, supp] = await Promise.all([
    bossFetch<{ items?: unknown[]; rows?: unknown[]; customers?: unknown[] }>('/api/customers', {
      query: { page: '1', pageSize: '50' },
    }),
    bossFetch<{ items?: unknown[]; rows?: unknown[]; suppliers?: unknown[] }>('/api/suppliers', {
      query: { page: '1', pageSize: '50' },
    }),
  ])

  const custRaw = asList(cust.data?.items ?? cust.data?.rows ?? cust.data?.customers)
  const suppRaw = asList(supp.data?.items ?? supp.data?.rows ?? supp.data?.suppliers)

  if (!custRaw.length && !suppRaw.length) return { list: CARILER, source: 'mock' }

  const list: Cari[] = [
    ...custRaw.map((r, i) => {
      const row = asMap(r) ?? {}
      const balance = num(row.balance ?? row.currentBalance ?? row.receivable)
      return {
        id: str(row.id ?? `c${i}`),
        name: str(row.name ?? row.title, `Müşteri ${i + 1}`),
        type: 'musteri' as const,
        balance,
        lastMovement: fmtDateShort(row.lastMovementAt ?? row.updatedAt),
        ledger: [],
      }
    }),
    ...suppRaw.map((r, i) => {
      const row = asMap(r) ?? {}
      const balance = num(row.balance ?? row.currentBalance ?? row.payable)
      return {
        id: str(row.id ?? `s${i}`),
        name: str(row.name ?? row.title, `Tedarikçi ${i + 1}`),
        type: 'tedarikci' as const,
        balance: balance > 0 ? -balance : balance,
        lastMovement: fmtDateShort(row.lastMovementAt ?? row.updatedAt),
        ledger: [],
      }
    }),
  ]

  return { list, source: 'api' }
}

// ── Lisanslar ────────────────────────────────────────────────────────────────

export type LisanslarPageData = {
  list: Lisans[]
  source: 'api' | 'mock'
}

export async function loadLisanslarPage(): Promise<LisanslarPageData> {
  const session = readNativeSession()
  if (!session?.token) return { list: LISANSLAR, source: 'mock' }

  const [stockLic, bridge] = await Promise.all([
    bossFetch<Record<string, unknown>>('/api/stock/license-status'),
    bossFetch<Record<string, unknown>>('/api/sales/hardware-bridge/status'),
  ])

  if (!stockLic.ok && !bridge.ok) return { list: LISANSLAR, source: 'mock' }

  const list: Lisans[] = LISANSLAR.map((base) => {
    const name = base.name.toLowerCase()
    if (name.includes('stok')) {
      const ok = stockLic.data?.licensed === true || stockLic.data?.active === true || stockLic.ok
      return {
        ...base,
        status: ok ? 'aktif' : 'yok',
        daysLeft: ok ? base.daysLeft : null,
      }
    }
    if (name.includes('online')) {
      const online = bridge.data?.online === true || bridge.data?.connected === true
      return {
        ...base,
        status: online ? 'aktif' : base.status,
      }
    }
    return base
  })

  return { list, source: 'api' }
}

// ── Kasa hesapları (hareket formu) ───────────────────────────────────────────

export type AccountsPageData = {
  accounts: Account[]
  source: 'api' | 'mock'
}

export async function loadAccountsPage(): Promise<AccountsPageData> {
  const session = readNativeSession()
  if (!session?.token) return { accounts: ACCOUNTS, source: 'mock' }

  const res = await bossFetch<{ items?: unknown[]; accounts?: unknown[] }>('/api/accounting/accounts')
  if (!res.ok || !res.data) return { accounts: ACCOUNTS, source: 'mock' }

  const raw = asList(res.data.items ?? res.data.accounts)
  if (!raw.length) return { accounts: ACCOUNTS, source: 'mock' }

  const accounts: Account[] = raw.map((r, i) => {
    const row = asMap(r) ?? {}
    const bal = num(row.balance ?? row.currentBalance)
    const kind = str(row.type ?? row.kind).toLowerCase()
    let type: Account['type'] = 'cash'
    if (kind.includes('bank')) type = 'bank'
    else if (kind.includes('pos')) type = 'pos'
    return {
      id: str(row.id ?? i),
      name: str(row.name ?? row.title, `Hesap ${i + 1}`),
      type,
      balance: formatMoneyTR(bal),
      currency: str(row.currency, 'TRY'),
    }
  })

  return { accounts, source: 'api' }
}

export async function postCashMovement(input: {
  type: string
  accountId: string
  amount: number
  note?: string
  targetAccountId?: string
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

  const res = await bossFetch('/api/accounting/transactions', {
    method: 'POST',
    body: JSON.stringify(body),
  })
  if (res.ok) {
    invalidateBossCache('api:accounting')
    invalidateBossCache('fn:loadKasaDashboard')
    invalidateBossCache('fn:loadFinansDashboard')
    invalidateBossCache('fn:loadAccountsPage')
  }
  return { ok: res.ok, error: res.error }
}

// ── Raporlar ─────────────────────────────────────────────────────────────────

export type RaporlarPageData = {
  productByPeriod: Record<ReportPeriod, ProductRow[]>
  source: 'api' | 'mock'
}

export async function loadRaporlarPage(): Promise<RaporlarPageData> {
  const session = readNativeSession()
  if (!session?.token) {
    return { productByPeriod: PRODUCT_REPORT, source: 'mock' }
  }

  const sales = await fetchSalesAnalysisTodayFull()

  if (!sales.ok || !sales.data) {
    return { productByPeriod: PRODUCT_REPORT, source: 'mock' }
  }

  const products = asList(
    sales.data.topProducts ?? sales.data.products ?? asMap(sales.data.summary)?.topProducts,
  )

  if (!products.length) {
    return { productByPeriod: PRODUCT_REPORT, source: 'mock' }
  }

  const rows: ProductRow[] = products.slice(0, 20).map((r, i) => {
    const row = asMap(r) ?? {}
    const qty = num(row.qty ?? row.quantity ?? row.count)
    const revenue = num(row.revenue ?? row.amount ?? row.total)
    return {
      rank: i + 1,
      name: str(row.name ?? row.productName ?? row.title, `Ürün ${i + 1}`),
      qty,
      revenue: `₺${formatMoneyTR(revenue)}`,
      trend: 'flat' as const,
    }
  })

  return {
    productByPeriod: {
      Bugün: rows,
      '7 Gün': rows,
      '30 Gün': rows,
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
  if (!session?.token) return { months: SAHIP_RAPORLAR, source: 'mock' }

  const res = await bossFetch<Record<string, unknown>>('/api/finance/owner-overview', {
    query: { days: '30' },
  })
  if (!res.ok || !res.data) return { months: SAHIP_RAPORLAR, source: 'mock' }

  const d = res.data
  const summary = asMap(d.summary) ?? asMap(d.totals) ?? d
  const ciro = num(summary.revenue ?? summary.totalRevenue ?? summary.ciro ?? d.revenue)
  const maliyet = num(summary.cost ?? summary.cogs ?? summary.maliyet)
  const personel = num(summary.payroll ?? summary.personnelCost ?? summary.personelGider)
  const kar = ciro - maliyet - personel
  const ratio = ciro > 0 ? `${((maliyet / ciro) * 100).toFixed(1)}%` : '—'

  const now = new Date()
  const monthLabel = now.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })
  const current: SahipAylik = {
    month: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
    ciro: `₺${formatMoneyTR(ciro)}`,
    maliyet: `₺${formatMoneyTR(maliyet)}`,
    karProxy: `₺${formatMoneyTR(kar)}`,
    personelGider: `₺${formatMoneyTR(personel)}`,
    ciroDelta: str(summary.revenueDelta ?? summary.ciroDelta, '—'),
    maliyetRatio: ratio,
  }

  // Prefer keeping mock history behind current month when API only returns one period
  return {
    months: [current, ...SAHIP_RAPORLAR.filter((m) => m.month !== current.month)],
    source: 'api',
  }
}

export type ZPageData = {
  reports: ZReport[]
  source: 'api' | 'mock'
}

export async function loadZReportsPage(): Promise<ZPageData> {
  const session = readNativeSession()
  if (!session?.token) return { reports: Z_REPORTS, source: 'mock' }

  const templates = await bossFetch<{ items?: unknown[]; templates?: unknown[]; rows?: unknown[] }>(
    '/api/finance/pos-order-report-templates',
  )
  const list = asList(templates.data?.items ?? templates.data?.templates ?? templates.data?.rows)
  const zTpl = list.find((t) => {
    const row = asMap(t) ?? {}
    const name = str(row.name ?? row.title ?? row.code).toLowerCase()
    return name.includes('z ') || name === 'z' || name.includes('z-rapor') || name.includes('z rapor')
  })

  if (!zTpl) {
    // Fallback: paylaşılan sales-analysis L1 cache
    const day = todayYmd()
    const sales = await fetchSalesAnalysisTodayFull()
    if (!sales.ok || !sales.data) return { reports: Z_REPORTS, source: 'mock' }
    const summary = asMap(sales.data.summary) ?? sales.data
    const total = num(
      summary.netSales ?? summary.closedNetSales ?? summary.totalRevenue ?? summary.revenue,
    )
    const payments = asMap(sales.data.payments) ?? {}
    const nakit = num(payments.Nakit ?? payments.cash ?? payments.nakit)
    const kart = num(payments.Kart ?? payments.card ?? payments.kredi)
    const today: ZReport = {
      id: 'today',
      zNo: `Z-${day.replace(/-/g, '').slice(4)}`,
      terminal: 'Günlük özet',
      total: `₺${formatMoneyTR(total)}`,
      nakit: `₺${formatMoneyTR(nakit)}`,
      kart: `₺${formatMoneyTR(kart)}`,
      time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      date: fmtDateShort(day),
      receiptCount: num(summary.orderCount ?? summary.receiptCount),
      cancelTotal: `₺${formatMoneyTR(num(summary.cancelAmount ?? summary.cancelTotal))}`,
    }
    return { reports: [today, ...Z_REPORTS], source: 'api' }
  }

  const tplId = str(asMap(zTpl)?.id ?? asMap(zTpl)?.templateId)
  const day = todayYmd()
  const run = await bossFetch<Record<string, unknown>>(
    `/api/finance/pos-order-report-templates/${encodeURIComponent(tplId)}/run`,
    { query: { from: day, to: day } },
  )
  if (!run.ok || !run.data) return { reports: Z_REPORTS, source: 'mock' }

  const rows = asList(run.data.rows ?? run.data.items ?? run.data.days)
  if (!rows.length) {
    const summary = asMap(run.data.summary) ?? run.data
    const total = num(summary.totalRevenue ?? summary.grandTotal ?? summary.total)
    return {
      reports: [
        {
          id: 'run-0',
          zNo: str(summary.zNo ?? `Z-${day.slice(5)}`),
          terminal: str(summary.terminal ?? 'Kasa'),
          total: `₺${formatMoneyTR(total)}`,
          nakit: `₺${formatMoneyTR(num(summary.cash ?? summary.nakit))}`,
          kart: `₺${formatMoneyTR(num(summary.card ?? summary.kart))}`,
          time: str(summary.closedAt ?? '').slice(11, 16) || '--:--',
          date: fmtDateShort(day),
          receiptCount: num(summary.receiptCount ?? summary.count),
          cancelTotal: `₺${formatMoneyTR(num(summary.cancelTotal))}`,
        },
        ...Z_REPORTS,
      ],
      source: 'api',
    }
  }

  const reports: ZReport[] = rows.slice(0, 30).map((r, i) => {
    const row = asMap(r) ?? {}
    return {
      id: str(row.id ?? i),
      zNo: str(row.zNo ?? row.code ?? `Z-${i + 1}`),
      terminal: str(row.terminal ?? row.deviceName ?? 'Kasa'),
      total: `₺${formatMoneyTR(num(row.total ?? row.grandTotal ?? row.revenue))}`,
      nakit: `₺${formatMoneyTR(num(row.cash ?? row.nakit))}`,
      kart: `₺${formatMoneyTR(num(row.card ?? row.kart))}`,
      time: str(row.time ?? row.closedAt ?? '').slice(11, 16) || '--:--',
      date: fmtDateShort(row.date ?? row.closedAt ?? row.day),
      receiptCount: num(row.receiptCount ?? row.count),
      cancelTotal: `₺${formatMoneyTR(num(row.cancelTotal ?? row.cancelAmount))}`,
    }
  })

  return { reports: reports.length ? reports : Z_REPORTS, source: 'api' }
}
