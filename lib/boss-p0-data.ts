import {
  CHANNEL_CARDS,
  type KpiMetric,
  type ChannelCard,
  type AlertRow,
  type PaymentSlice,
  type QuickTile,
  type Movement,
  type AuditAlert,
  type Account,
  type LedgerEntry,
} from '@/lib/boss-mock'
import {
  bossFetch,
  fetchSalesAnalysisTodayFull,
  formatMoneyTR,
  parseMoneyTR,
  todayYmd,
} from '@/lib/boss-api'
import { BOSS_TTL, withBossCache } from '@/lib/boss-page-cache'
import { bossBranchDisplayLabel } from '@/lib/boss-branch-display'
import { readNativeSession } from '@/lib/boss-bridge'
import {
  mapNotificationToAlertRow,
  mapNotificationToAuditAlert,
  type BossNotificationApiRow,
} from '@/lib/boss-notifications'

export type AnaDashboardData = {
  restaurantName: string
  branchLabel: string
  kpis: KpiMetric[]
  channels: ChannelCard[]
  alerts: AlertRow[]
  operasyonBadges: Record<string, number>
  source: 'api' | 'mock'
}

export type FinansDashboardData = {
  paymentMix: PaymentSlice[]
  totalLabel: string
  tiles: QuickTile[]
  movements: Movement[]
  source: 'api' | 'mock'
}

export type DenetimDashboardData = {
  alerts: AuditAlert[]
  /** Sunucu cursor'ı — varsa «Daha fazla» ile devamı çekilebilir */
  nextCursor: string | null
  source: 'api' | 'mock'
}

export type KasaDashboardData = {
  accounts: Account[]
  ledger: LedgerEntry[]
  source: 'api' | 'mock'
}

function num(v: unknown): number {
  return parseMoneyTR(v)
}

function asMap(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null
}

/**
 * Panel `serviceTypeBreakdown` — cloud `service-channel-registry` id’leri:
 * 1=Masa, 2=Paket, 3=Gel Al, 4=Self, 5=Oda, 6=QR Menü, 7+=Online platform.
 */
function serviceAmt(breakdown: unknown, id: number): number {
  if (!Array.isArray(breakdown)) return 0
  for (const e of breakdown) {
    const row = asMap(e)
    if (row && num(row.serviceTypeId) === id) return num(row.amount)
  }
  return 0
}

/** Online platform siparişleri — cloud sentetik kova(lar) `serviceTypeId >= 7`. */
function serviceAmtOnline(breakdown: unknown): number {
  if (!Array.isArray(breakdown)) return 0
  let sum = 0
  for (const e of breakdown) {
    const row = asMap(e)
    if (row && num(row.serviceTypeId) >= 7) sum += num(row.amount)
  }
  return sum
}

export async function loadAnaDashboard(): Promise<AnaDashboardData> {
  const session = readNativeSession()
  const fallback: AnaDashboardData = {
    restaurantName: session?.restaurantName || 'Restroid',
    branchLabel: bossBranchDisplayLabel(session?.branchCode),
    kpis: [
      { label: 'Günlük Ciro', value: '0', delta: 0, unit: '₺' },
      { label: 'Ödenen', value: '0', delta: 0, unit: '₺' },
      { label: 'Açık', value: '0', delta: 0, unit: '₺' },
      { label: 'Konuk', value: '0', delta: 0, unit: '' },
    ],
    channels: CHANNEL_CARDS.map((c) => ({ ...c, value: c.key === 'masa' ? '0' : '₺0' })),
    alerts: [],
    operasyonBadges: {},
    source: 'mock',
  }

  if (!session?.token) return fallback

  try {
  const [sales, onlinePending, qrPending, active, logs] = await Promise.all([
    fetchSalesAnalysisTodayFull(),
    withBossCache(
      'api:online-pending-count',
      BOSS_TTL.live,
      () => bossFetch<{ count?: number }>('/api/sales/online-orders/pending-count'),
      { isCacheable: (r) => r.ok },
    ),
    withBossCache(
      'api:qr-pending-count',
      BOSS_TTL.live,
      () => bossFetch<{ count?: number }>('/api/sales/qr-menu-orders/pending-count'),
      { isCacheable: (r) => r.ok },
    ),
    withBossCache(
      'api:active-orders',
      BOSS_TTL.live,
      () =>
        bossFetch<{ rows?: unknown[]; items?: unknown[]; orders?: unknown[]; count?: number }>(
          '/api/sales/active-orders',
        ),
      { isCacheable: (r) => r.ok },
    ),
    withBossCache(
      'api:boss-notifications:8',
      BOSS_TTL.live,
      () =>
        bossFetch<{ items?: BossNotificationApiRow[] }>('/api/boss/notifications', {
          query: { limit: '8' },
        }),
      { isCacheable: (r) => r.ok },
    ),
  ])

  if (!sales.ok || !sales.data) {
    return {
      restaurantName: session.restaurantName || fallback.restaurantName,
      branchLabel: bossBranchDisplayLabel(session.branchCode),
      kpis: [
        { label: 'Günlük Ciro', value: '0', delta: 0, unit: '₺' },
        { label: 'Ödenen', value: '0', delta: 0, unit: '₺' },
        { label: 'Açık', value: '0', delta: 0, unit: '₺' },
        { label: 'Konuk', value: '0', delta: 0, unit: '' },
      ],
      channels: CHANNEL_CARDS.map((c) => ({ ...c, value: c.key === 'masa' ? '0' : '₺0' })),
      alerts: [],
      operasyonBadges: {},
      source: 'api',
    }
  }

  const d = sales.data
  const summary = asMap(d.summary) ?? {}
  // Cloud SalesAnalysisForBranch.summary alanları
  const ciro = num(
    summary.netSales ?? summary.closedNetSales ?? summary.totalRevenue ?? summary.revenue,
  )
  const paid = num(summary.paymentsReceived ?? summary.paidAmount ?? summary.paid)
  const openAmt = num(
    summary.openAccount ?? summary.openOrdersTotal ?? summary.openAmount,
  )
  const guests = num(summary.guestCount ?? summary.guests)

  const kpis: KpiMetric[] = [
    { label: 'Günlük Ciro', value: formatMoneyTR(ciro), delta: 0, unit: '₺' },
    // Gerçek tahsil edilen tutar; API'de yoksa 0 — ciro ile doldurulmaz
    { label: 'Ödenen', value: formatMoneyTR(paid), delta: 0, unit: '₺' },
    { label: 'Açık', value: formatMoneyTR(openAmt), delta: 0, unit: '₺' },
    { label: 'Konuk', value: String(Math.max(0, Math.round(guests))), delta: 0, unit: '' },
  ]

  const st = d.serviceTypeBreakdown
  // Cloud yanıtı `{ rows }` döner (app/api/sales/active-orders/route.ts).
  const activeItems = Array.isArray(active.data?.rows)
    ? active.data!.rows!
    : Array.isArray(active.data?.items)
      ? active.data!.items!
      : Array.isArray(active.data?.orders)
        ? active.data!.orders!
        : []
  const openTables = active.data?.count ?? activeItems.length

  const channels: ChannelCard[] = [
    {
      key: 'masa',
      label: 'Açık Masalar',
      value: String(openTables),
      variant: 'success',
    },
    {
      key: 'online',
      label: 'Online',
      value: `₺${formatMoneyTR(serviceAmtOnline(st))}`,
      variant: 'neutral',
    },
    {
      key: 'paket',
      label: 'Paket',
      value: `₺${formatMoneyTR(serviceAmt(st, 2))}`,
      variant: 'neutral',
    },
    {
      key: 'gelal',
      label: 'Gel-al',
      value: `₺${formatMoneyTR(serviceAmt(st, 3))}`,
      variant: 'neutral',
    },
    {
      key: 'self',
      label: 'Self',
      value: `₺${formatMoneyTR(serviceAmt(st, 4))}`,
      variant: 'neutral',
    },
    {
      key: 'iptal',
      label: 'İptal',
      value: `₺${formatMoneyTR(num(summary.cancellations ?? summary.cancelAmount))}`,
      variant: 'danger',
    },
    {
      key: 'zayi',
      label: 'Zayi',
      value: `₺${formatMoneyTR(num(summary.waste ?? summary.wasteAmount))}`,
      variant: 'warning',
    },
    {
      // API'de yalnızca ikram (complimentaryTotal) alanı var; ayrı indirim alanı yok.
      // İndirim verisi gelmediği için indirim kartı gösterilmez.
      key: 'ikram',
      label: 'İkram',
      value: `₺${formatMoneyTR(num(summary.complimentaryTotal))}`,
      variant: 'warning',
    },
  ]

  const notifyItems = Array.isArray(logs.data?.items) ? logs.data!.items! : []
  const alerts: AlertRow[] = notifyItems
    .slice(0, 5)
    .map((raw, i) => mapNotificationToAlertRow(raw, i))

  return {
    restaurantName: session.restaurantName || fallback.restaurantName,
    branchLabel: bossBranchDisplayLabel(session.branchCode),
    kpis,
    channels,
    alerts,
    operasyonBadges: {
      online: num(onlinePending.data?.count),
      qr: num(qrPending.data?.count),
      hesaplar: Number(openTables) || 0,
      stok: 0,
    },
    source: 'api',
  }
  } catch {
    return {
      restaurantName: session.restaurantName || fallback.restaurantName,
      branchLabel: bossBranchDisplayLabel(session.branchCode),
      kpis: [
        { label: 'Günlük Ciro', value: '0', delta: 0, unit: '₺' },
        { label: 'Ödenen', value: '0', delta: 0, unit: '₺' },
        { label: 'Açık', value: '0', delta: 0, unit: '₺' },
        { label: 'Konuk', value: '0', delta: 0, unit: '' },
      ],
      channels: CHANNEL_CARDS.map((c) => ({ ...c, value: c.key === 'masa' ? '0' : '₺0' })),
      alerts: [],
      operasyonBadges: {},
      source: 'api',
    }
  }
}

export async function loadFinansDashboard(): Promise<FinansDashboardData> {
  const session = readNativeSession()
  const emptyFinans: FinansDashboardData = {
    paymentMix: [],
    totalLabel: '₺0',
    tiles: [
      { label: 'Açık Hesaplar', value: '₺0', sub: 'bugün', variant: 'warning' },
      { label: 'Giderler', value: '₺0', sub: 'bugün', variant: 'danger' },
      { label: 'Tahsilatlar', value: '₺0', sub: 'bugün', variant: 'success' },
      { label: 'Zayi / İptal', value: '₺0', sub: 'bugün', variant: 'neutral' },
      { label: 'Kasa açığı', value: '₺0', sub: 'nakit vardiya', variant: 'danger', href: '/boss-m/raporlar/vardiya' },
      { label: 'Kasa fazlası', value: '₺0', sub: 'nakit vardiya', variant: 'success', href: '/boss-m/raporlar/vardiya' },
    ],
    movements: [],
    source: 'mock',
  }
  if (!session?.token) return emptyFinans

  try {
  const day = todayYmd()
  const [sales, tx, shifts] = await Promise.all([
    fetchSalesAnalysisTodayFull(),
    withBossCache(
      'api:accounting-tx:today:20',
      BOSS_TTL.kpi,
      () =>
        bossFetch<{ items?: unknown[]; transactions?: unknown[] }>(
          '/api/accounting/transactions',
          { query: { page: '1', pageSize: '20', from: day, to: day } },
        ),
      { isCacheable: (r) => r.ok },
    ),
    bossFetch<{ summary?: Record<string, unknown> }>('/api/finance/cash-shifts', {
      query: { page: '1', pageSize: '1', from: day, to: day },
    }),
  ])

  if (!sales.ok && !tx.ok && !shifts.ok) return { ...emptyFinans, source: 'api' }

  const summary = asMap(sales.data?.summary) ?? {}
  const ciro = num(summary.netSales ?? summary.closedNetSales ?? summary.totalRevenue)
  const paid = num(summary.paymentsReceived ?? summary.paidAmount)
  const pb = Array.isArray(sales.data?.paymentBreakdown)
    ? (sales.data!.paymentBreakdown as unknown[])
    : []

  const slices: PaymentSlice[] = []
  const colors = ['#10b981', '#38bdf8', '#f59e0b', '#f43f5e', '#a78bfa']
  const sumPay =
    pb.reduce((a: number, raw) => a + num(asMap(raw)?.amount), 0) || 1
  pb.slice(0, 5).forEach((raw, i) => {
    const row = asMap(raw) ?? {}
    const amount = num(row.amount)
    slices.push({
      label: String(row.name ?? row.label ?? `Ödeme ${i + 1}`),
      value: Math.round((amount / sumPay) * 100),
      amount: `₺${formatMoneyTR(amount)}`,
      color: colors[i % colors.length],
    })
  })

  const txItems = Array.isArray(tx.data?.items)
    ? tx.data!.items!
    : Array.isArray(tx.data?.transactions)
      ? tx.data!.transactions!
      : []
  const movements: Movement[] = txItems.slice(0, 15).map((raw, i) => {
    const row = asMap(raw) ?? {}
    const amount = num(row.amount ?? row.signedAmount)
    const positive = amount >= 0
    return {
      id: String(row.id ?? i),
      icon: 'wallet',
      title: String(row.title ?? row.typeLabel ?? row.type ?? 'Hareket'),
      sub: String(row.accountName ?? row.note ?? ''),
      time: String(row.createdAt ?? '').slice(11, 16) || '--:--',
      amount: `${positive ? '+' : '-'}₺${formatMoneyTR(Math.abs(amount))}`,
      sign: positive ? 'positive' : 'negative',
    }
  })

  return {
    paymentMix: slices,
    totalLabel: `₺${formatMoneyTR(ciro || paid)}`,
    tiles: [
      {
        label: 'Açık Hesaplar',
        value: `₺${formatMoneyTR(num(summary.openAccount ?? summary.openOrdersTotal))}`,
        sub: 'bugün',
        variant: 'warning',
      },
      {
        label: 'Giderler',
        value: `₺${formatMoneyTR(num(summary.expenses))}`,
        sub: 'bugün',
        variant: 'danger',
      },
      {
        label: 'Tahsilatlar',
        // Gerçek tahsilat; yoksa 0 — ciro ile doldurulmaz
        value: `₺${formatMoneyTR(paid)}`,
        sub: 'bugün',
        variant: 'success',
      },
      {
        label: 'Zayi / İptal',
        value: `₺${formatMoneyTR(num(summary.waste) + num(summary.cancellations))}`,
        sub: 'bugün',
        variant: 'neutral',
      },
      {
        label: 'Kasa açığı',
        value: `₺${formatMoneyTR(num(asMap(shifts.data?.summary)?.shortageAmount), 2)}`,
        sub: 'nakit vardiya',
        variant: 'danger',
        href: '/boss-m/raporlar/vardiya',
      },
      {
        label: 'Kasa fazlası',
        value: `₺${formatMoneyTR(num(asMap(shifts.data?.summary)?.surplusAmount), 2)}`,
        sub: 'nakit vardiya',
        variant: 'success',
        href: '/boss-m/raporlar/vardiya',
      },
    ],
    movements,
    source: sales.ok || tx.ok || shifts.ok ? 'api' : 'mock',
  }
  } catch {
    return { ...emptyFinans, source: 'api' }
  }
}

export async function loadDenetimDashboard(): Promise<DenetimDashboardData> {
  const session = readNativeSession()
  if (!session?.token) return { alerts: [], nextCursor: null, source: 'mock' }

  try {
    const inbox = await withBossCache(
      'api:boss-notifications:50',
      BOSS_TTL.live,
      () =>
        bossFetch<{ items?: BossNotificationApiRow[]; nextCursor?: string | null }>(
          '/api/boss/notifications',
          { query: { limit: '50' } },
        ),
      { isCacheable: (r) => r.ok },
    )
    if (!inbox.ok) return { alerts: [], nextCursor: null, source: 'api' }

    const items = Array.isArray(inbox.data?.items) ? inbox.data!.items! : []
    return {
      alerts: items.map((raw, i) => mapNotificationToAuditAlert(raw, i)),
      nextCursor: typeof inbox.data?.nextCursor === 'string' ? inbox.data.nextCursor : null,
      source: 'api',
    }
  } catch {
    return { alerts: [], nextCursor: null, source: 'api' }
  }
}

/** Cloud `accounting_transaction.type` enum → TR etiket (boss UI). */
function accountingTypeLabelTR(type: string): string {
  const map: Record<string, string> = {
    POS_SALE: 'POS Satış',
    CASH_IN: 'Para Girişi',
    CASH_OUT: 'Para Çıkışı',
    EXPENSE: 'Gider',
    TRANSFER_OUT: 'Transfer (Çıkan)',
    TRANSFER_IN: 'Transfer (Gelen)',
    CUSTOMER_PAYMENT: 'Müşteri Ödeme',
    CUSTOMER_COLLECTION: 'Müşteri Tahsilat',
    SUPPLIER_PAYMENT: 'Tedarikçi Ödeme',
    SUPPLIER_COLLECTION: 'Tedarikçi Tahsilat',
    PERSONNEL_COLLECTION: 'Personel Tahsilat',
    SALARY_PAYMENT: 'Maaş Ödemesi',
    SALARY_ACCRUAL: 'Maaş Tahakkuku',
    BONUS_PAYMENT: 'Prim Ödemesi',
    ADVANCE_PAYMENT: 'Avans',
  }
  return map[type] ?? (type || 'Hareket')
}

export async function loadKasaDashboard(): Promise<KasaDashboardData> {
  const session = readNativeSession()
  // Oturum yokken örnek hesap/hareket gösterme — boş liste ('mock' = önizleme,
  // cache'lenmez; gerçek veri değildir)
  if (!session?.token) return { accounts: [], ledger: [], source: 'mock' }

  try {
  const [meta, tx] = await Promise.all([
    withBossCache(
      'api:accounting-meta',
      BOSS_TTL.accounting,
      () => bossFetch<Record<string, unknown>>('/api/accounting/meta'),
      { persist: true, isCacheable: (r) => r.ok },
    ),
    withBossCache(
      'api:accounting-tx:recent:30',
      BOSS_TTL.kpi,
      () =>
        // Son 30 hareket (gün filtresi yok) — gece yarısı sonrası boş ekran olmasın
        bossFetch<{ items?: unknown[]; transactions?: unknown[] }>(
          '/api/accounting/transactions',
          { query: { page: '1', pageSize: '30' } },
        ),
      { isCacheable: (r) => r.ok },
    ),
  ])

  const accountsRaw =
    (Array.isArray(meta.data?.accounts) && meta.data!.accounts) ||
    (Array.isArray(asMap(meta.data)?.cashAccounts) &&
      (asMap(meta.data)!.cashAccounts as unknown[])) ||
    []

  const accounts: Account[] = (accountsRaw as unknown[]).map((raw, i) => {
    const row = asMap(raw) ?? {}
    const typeRaw = String(row.type ?? row.kind ?? 'cash').toLowerCase()
    const type: Account['type'] = typeRaw.includes('bank')
      ? 'bank'
      : typeRaw.includes('pos') || typeRaw.includes('card')
        ? 'pos'
        : 'cash'
    const bal = num(row.balance ?? row.currentBalance ?? row.computed_balance)
    return {
      id: String(row.id ?? i),
      name: String(row.name ?? row.label ?? `Hesap ${i + 1}`),
      type,
      balance: formatMoneyTR(bal, bal % 1 === 0 ? 0 : 2),
      currency: '₺',
    }
  })

  const txItems = Array.isArray(tx.data?.items)
    ? tx.data!.items!
    : Array.isArray(tx.data?.transactions)
      ? tx.data!.transactions!
      : []

  const ledger: LedgerEntry[] = txItems.map((raw, i) => {
    const row = asMap(raw) ?? {}
    const amount = num(row.amount ?? row.signedAmount)
    const positive = amount >= 0
    // Cloud accounting_transaction satırı: occurredAt + description + type (enum)
    const when = String(row.occurredAt ?? row.createdAt ?? '')
    const typeLabel = accountingTypeLabelTR(String(row.type ?? ''))
    const account = asMap(row.account)
    const accountName = account ? String(account.name ?? '') : ''
    const descr = String(row.description ?? '').trim() || typeLabel
    return {
      id: String(row.id ?? i),
      datetime: when ? when.slice(0, 16).replace('T', ' ') : '—',
      description: accountName ? `${descr} — ${accountName}` : descr,
      amount: `${positive ? '+' : '-'}₺${formatMoneyTR(Math.abs(amount))}`,
      sign: positive ? 'positive' : 'negative',
      category: typeLabel,
    }
  })

  // Oturum varken örnek (mock) hesap/hareket gösterme — boş liste doğru durum.
  // API hatasında da veri boş ama source 'api' kalır (mock veri dönmüyoruz).
  return {
    accounts,
    ledger: meta.ok || tx.ok ? ledger : [],
    source: 'api',
  }
  } catch {
    return { accounts: [], ledger: [], source: 'api' }
  }
}

export type BossAiAskApiProductDraft = {
  mode?: 'create' | 'update'
  name?: string
  price?: number | null
  priceDisplay?: string
  category?: string
  taxLabel?: string
  plu?: string
  canConfirm?: boolean
  pendingClarification?: string | null
  clarificationPrompt?: string
  warnings?: string[]
  productionAreaNames?: string[]
  [key: string]: unknown
}

export type BossAiAskApiBulkDraft = {
  kind: 'product_bulk'
  scopeLabel?: string
  targetCount?: number
  sampleNames?: string[]
  canConfirm?: boolean
  queryOnly?: boolean
  pendingClarification?: string | null
  clarificationPrompt?: string
  optionItems?: Array<{ id: string; label: string }>
  summaryLines?: string[]
  warnings?: string[]
  [key: string]: unknown
}

export type BossAiAskApiAnalysis = {
  compare?: string
  productName?: string | null
  current?: {
    label?: string
    from?: string
    to?: string
    netSales?: number
    productQty?: number | null
    productRevenue?: number | null
  }
  previous?: {
    label?: string
    from?: string
    to?: string
    netSales?: number
    productQty?: number | null
    productRevenue?: number | null
  }
  deltas?: {
    netSalesPct?: number | null
    productRevenuePct?: number | null
    productQtyPct?: number | null
  }
}

export type BossAiAskApiChart = {
  /** rows: yatay etiket+tutar kırılım listesi */
  type?: 'bar' | 'compare' | 'line' | 'rows'
  title?: string
  series?: Array<{ label: string; value: number }>
  seriesB?: Array<{ label: string; value: number }>
  seriesALabel?: string
  seriesBLabel?: string
}

export type BossAiAskApiResult = {
  ok: boolean
  answer: string
  intent?: string
  productDraft?: BossAiAskApiProductDraft | null
  bulkDraft?: BossAiAskApiBulkDraft | null
  analysis?: BossAiAskApiAnalysis | null
  charts?: BossAiAskApiChart[]
  period?: { from?: string; to?: string; days?: number } | null
  /** Yanıt sonrası önerilen takip soruları (chip olarak gösterilir). */
  suggestions?: string[]
  error?: string
}

export async function askBossAiApi(
  question: string,
  history: Array<{ role: string; content: string }> = [],
  opts?: {
    days?: number
    pendingProductDraft?: BossAiAskApiProductDraft | null
    pendingBulkDraft?: BossAiAskApiBulkDraft | null
  },
): Promise<BossAiAskApiResult> {
  const session = readNativeSession()
  if (!session?.token) return { ok: false, answer: '', error: 'Oturum yok' }

  const res = await bossFetch<{
    answer?: string
    text?: string
    message?: string
    intent?: string
    productDraft?: BossAiAskApiProductDraft | null
    bulkDraft?: BossAiAskApiBulkDraft | null
    analysis?: BossAiAskApiAnalysis | null
    charts?: BossAiAskApiChart[]
    period?: { from?: string; to?: string; days?: number } | null
    suggestions?: string[]
    error?: string
  }>('/api/boss/ai/ask', {
    method: 'POST',
    timeoutMs: 90_000,
    body: JSON.stringify({
      question,
      days: opts?.days ?? 7,
      history: history.map((h) => ({ role: h.role, content: h.content })),
      ...(opts?.pendingProductDraft
        ? { pendingProductDraft: opts.pendingProductDraft }
        : {}),
      ...(opts?.pendingBulkDraft ? { pendingBulkDraft: opts.pendingBulkDraft } : {}),
    }),
  })
  if (!res.ok || !res.data) {
    return {
      ok: false,
      answer: '',
      error: String(res.error ?? 'AI yanıtı alınamadı'),
    }
  }
  const answer = String(res.data.answer ?? res.data.text ?? res.data.message ?? '')
  return {
    ok: Boolean(answer),
    answer,
    intent: res.data.intent,
    productDraft: res.data.productDraft ?? null,
    bulkDraft: res.data.bulkDraft ?? null,
    analysis: res.data.analysis ?? null,
    charts: Array.isArray(res.data.charts) ? res.data.charts : [],
    period: res.data.period ?? null,
    suggestions: Array.isArray(res.data.suggestions)
      ? res.data.suggestions.filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
      : [],
    error: res.data.error,
  }
}

export async function confirmBossAiProductApi(
  draft: BossAiAskApiProductDraft,
): Promise<{ ok: boolean; message: string }> {
  const session = readNativeSession()
  if (!session?.token) return { ok: false, message: 'Oturum yok' }
  const res = await bossFetch<{ ok?: boolean; message?: string; error?: string }>(
    '/api/boss/ai/confirm-product',
    {
      method: 'POST',
      timeoutMs: 60_000,
      body: JSON.stringify({ draft }),
    },
  )
  if (!res.ok) {
    return {
      ok: false,
      message: String(res.error ?? 'Ürün kaydı başarısız'),
    }
  }
  return {
    ok: true,
    message: String(res.data?.message ?? 'Ürün kaydedildi.'),
  }
}

export async function confirmBossAiBulkApi(
  draft: BossAiAskApiBulkDraft,
): Promise<{ ok: boolean; message: string; canUndo?: boolean }> {
  const session = readNativeSession()
  if (!session?.token) return { ok: false, message: 'Oturum yok' }
  const res = await bossFetch<{
    ok?: boolean
    message?: string
    answer?: string
    error?: string
    undoId?: string
  }>('/api/boss/ai/confirm-bulk', {
    method: 'POST',
    timeoutMs: 90_000,
    body: JSON.stringify({ draft }),
  })
  if (!res.ok) {
    return {
      ok: false,
      message: String(res.error ?? 'Toplu güncelleme başarısız'),
    }
  }
  return {
    ok: true,
    message: String(res.data?.message ?? res.data?.answer ?? 'Güncellendi.'),
    canUndo: Boolean(res.data?.undoId),
  }
}

export async function undoBossAiBulkApi(): Promise<{ ok: boolean; message: string }> {
  const session = readNativeSession()
  if (!session?.token) return { ok: false, message: 'Oturum yok' }
  const res = await bossFetch<{ ok?: boolean; message?: string; error?: string }>(
    '/api/boss/ai/confirm-bulk',
    {
      method: 'POST',
      timeoutMs: 60_000,
      body: JSON.stringify({ undo: true }),
    },
  )
  if (!res.ok) {
    return { ok: false, message: String(res.error ?? 'Geri alma başarısız') }
  }
  return {
    ok: Boolean(res.data?.ok ?? true),
    message: String(res.data?.message ?? 'Geri alındı.'),
  }
}
