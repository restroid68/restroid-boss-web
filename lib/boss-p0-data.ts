import {
  ANA_KPIS,
  CHANNEL_CARDS,
  DIKKAT_ALERTS,
  PAYMENT_MIX,
  FINANS_TILES,
  RECENT_MOVEMENTS,
  AUDIT_ALERTS,
  ACCOUNTS,
  LEDGER_ENTRIES,
  STOK_KPI,
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
import { readNativeSession } from '@/lib/boss-bridge'
import {
  labelOpAction,
  labelOpEntity,
  labelOpPage,
  resolveBossUiLocale,
} from '@/lib/boss-operation-log-labels'

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

/** Panel `serviceTypeBreakdown` — Flutter BossDashboardData ile aynı id’ler */
function serviceAmt(breakdown: unknown, id: number): number {
  if (!Array.isArray(breakdown)) return 0
  for (const e of breakdown) {
    const row = asMap(e)
    if (row && num(row.serviceTypeId) === id) return num(row.amount)
  }
  return 0
}

/** Düz string; nesne/JSON asla UI’ye yazılmaz. */
function asPlainString(v: unknown, fallback = ''): string {
  if (v == null) return fallback
  if (typeof v === 'string') {
    const t = v.trim()
    if (!t || t.startsWith('{') || t.startsWith('[')) return fallback
    return t
  }
  if (typeof v === 'number' || typeof v === 'boolean') return String(v)
  return fallback
}

/** detail JSON’dan yalnızca insan okunur kısa ipucu (dil duyarlı) */
function friendlyDetailHint(detail: unknown, locale: 'tr' | 'en'): string {
  const m = asMap(detail)
  if (!m) return asPlainString(detail, '')
  const orderNo = asPlainString(m.orderNumber ?? m.order_number, '')
  if (orderNo) return locale === 'en' ? `Order ${orderNo}` : `Sipariş ${orderNo}`
  const name = asPlainString(m.name ?? m.productName ?? m.title ?? m.label, '')
  if (name) return name
  if (typeof m.lineCount === 'number' && Number.isFinite(m.lineCount)) {
    return locale === 'en' ? `${m.lineCount} lines` : `${m.lineCount} satır`
  }
  if (m.markAll === true) return locale === 'en' ? 'Bulk update' : 'Toplu işaretleme'
  if (typeof m.inserted === 'number') {
    return locale === 'en' ? `${m.inserted} records` : `${m.inserted} kayıt`
  }
  return ''
}

function formatOperationAlert(raw: unknown, index: number): AlertRow {
  const locale = resolveBossUiLocale()
  const row = asMap(raw) ?? {}
  const actionKey = asPlainString(row.action, '').toLowerCase()
  const actionLabel = labelOpAction(actionKey || 'other', locale)
  const entity = labelOpEntity(asPlainString(row.entityType, ''), locale)
  const actor = asPlainString(row.actorName, '')
  const page = labelOpPage(asPlainString(row.pageKey, ''), locale)
  const hint = friendlyDetailHint(row.detail, locale)

  const message = [actionLabel, entity].filter(Boolean).join(' · ') || actionLabel
  const detailParts = [actor, page && page !== entity ? page : '', hint].filter(Boolean)
  const detail = detailParts.join(' · ') || '—'

  const timeRaw = asPlainString(row.createdAt ?? row.time, '')
  const time = timeRaw.includes('T')
    ? timeRaw.slice(11, 16)
    : timeRaw.slice(0, 5) || '--:--'

  const critical =
    actionKey.includes('delete') ||
    actionKey.includes('cancel') ||
    actionKey.includes('iptal')

  return {
    id: asPlainString(row.id, `log-${index}`),
    type: critical ? 'kritik' : 'uyari',
    message,
    detail,
    time,
  }
}

export async function loadAnaDashboard(): Promise<AnaDashboardData> {
  const session = readNativeSession()
  const fallback: AnaDashboardData = {
    restaurantName: session?.restaurantName || 'Restroid',
    branchLabel: (() => {
      const c = String(session?.branchCode ?? '').trim()
      if (!c || c.toUpperCase() === 'HQ') return ''
      return c
    })(),
    kpis: ANA_KPIS,
    channels: CHANNEL_CARDS,
    alerts: DIKKAT_ALERTS,
    operasyonBadges: { stok: STOK_KPI.kritikAdet },
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
        bossFetch<{ items?: unknown[]; orders?: unknown[]; count?: number }>(
          '/api/sales/active-orders',
        ),
      { isCacheable: (r) => r.ok },
    ),
    withBossCache(
      'api:operation-logs:8',
      BOSS_TTL.kpi,
      () =>
        bossFetch<{ items?: unknown[]; logs?: unknown[] }>('/api/operation-logs', {
          query: { page: '1', pageSize: '8' },
        }),
      { isCacheable: (r) => r.ok },
    ),
  ])

  if (!sales.ok || !sales.data) return fallback

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
    { label: 'Ödenen', value: formatMoneyTR(paid || ciro), delta: 0, unit: '₺' },
    { label: 'Açık', value: formatMoneyTR(openAmt), delta: 0, unit: '₺' },
    { label: 'Konuk', value: formatMoneyTR(guests), delta: 0, unit: '' },
  ]

  const st = d.serviceTypeBreakdown
  const activeItems = Array.isArray(active.data?.items)
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
      value: `₺${formatMoneyTR(serviceAmt(st, 5) + serviceAmt(st, 7))}`,
      variant: 'neutral',
    },
    {
      key: 'paket',
      label: 'Paket',
      value: `₺${formatMoneyTR(serviceAmt(st, 1))}`,
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
      value: `₺${formatMoneyTR(serviceAmt(st, 2))}`,
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
      key: 'indirim',
      label: 'İkram',
      value: `₺${formatMoneyTR(num(summary.complimentaryTotal ?? summary.discountAmount))}`,
      variant: 'warning',
    },
  ]

  const logItems = Array.isArray(logs.data?.items)
    ? logs.data!.items!
    : Array.isArray(logs.data?.logs)
      ? logs.data!.logs!
      : []
  const alerts: AlertRow[] = logItems.slice(0, 5).map((raw, i) => formatOperationAlert(raw, i))

  return {
    restaurantName: session.restaurantName || fallback.restaurantName,
    branchLabel: (() => {
      const c = String(session.branchCode ?? '').trim()
      if (!c || c.toUpperCase() === 'HQ') return ''
      return c
    })(),
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
    return fallback
  }
}

export async function loadFinansDashboard(): Promise<FinansDashboardData> {
  const session = readNativeSession()
  const fallback: FinansDashboardData = {
    paymentMix: PAYMENT_MIX,
    totalLabel: '₺24.860',
    tiles: FINANS_TILES,
    movements: RECENT_MOVEMENTS,
    source: 'mock',
  }
  if (!session?.token) return fallback

  try {
  const day = todayYmd()
  const [sales, tx] = await Promise.all([
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
  ])

  if (!sales.ok && !tx.ok) return fallback

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
        value: `₺${formatMoneyTR(paid || ciro)}`,
        sub: 'bugün',
        variant: 'success',
      },
      {
        label: 'Zayi / İptal',
        value: `₺${formatMoneyTR(num(summary.waste) + num(summary.cancellations))}`,
        sub: 'bugün',
        variant: 'neutral',
      },
    ],
    movements,
    source: sales.ok || tx.ok ? 'api' : 'mock',
  }
  } catch {
    return fallback
  }
}

export async function loadDenetimDashboard(): Promise<DenetimDashboardData> {
  const session = readNativeSession()
  const fallback: DenetimDashboardData = { alerts: AUDIT_ALERTS, source: 'mock' }
  if (!session?.token) return fallback

  try {
  const logs = await withBossCache(
    'api:operation-logs:40',
    BOSS_TTL.kpi,
    () =>
      bossFetch<{ items?: unknown[]; logs?: unknown[] }>('/api/operation-logs', {
        query: { page: '1', pageSize: '40' },
      }),
    { isCacheable: (r) => r.ok },
  )
  if (!logs.ok) return fallback

  const items = Array.isArray(logs.data?.items)
    ? logs.data!.items!
    : Array.isArray(logs.data?.logs)
      ? logs.data!.logs!
      : []

  const locale = resolveBossUiLocale()
  const alerts: AuditAlert[] = items.map((raw, i) => {
    const row = asMap(raw) ?? {}
    const action = asPlainString(row.action ?? row.actionKey, '').toLowerCase()
    let category: AuditAlert['category'] = 'Tümü'
    if (action.includes('cancel') || action.includes('iptal')) category = 'İptal'
    else if (action.includes('delete') || action.includes('sil')) category = 'Silme'
    else if (action.includes('unpaid') || action.includes('ödemesiz') || action.includes('odemesiz')) {
      category = 'Ödemesiz'
    }

    const severity: AuditAlert['severity'] =
      category === 'İptal' || category === 'Silme' || category === 'Ödemesiz'
        ? 'kritik'
        : 'uyari'

    const actionLabel = labelOpAction(action || 'other', locale)
    const entity = labelOpEntity(asPlainString(row.entityType, ''), locale)
    const detailAmt = asMap(row.detail)?.amount
    const target =
      labelOpPage(asPlainString(row.pageKey ?? row.page ?? row.target, ''), locale) ||
      friendlyDetailHint(row.detail, locale) ||
      '—'

    return {
      id: asPlainString(row.id, String(i)),
      severity,
      category,
      title: entity ? `${actionLabel} · ${entity}` : actionLabel,
      who: asPlainString(row.userName ?? row.actorName ?? row.email, '—'),
      target,
      amount:
        detailAmt != null || row.amount != null
          ? `₺${formatMoneyTR(num(detailAmt ?? row.amount))}`
          : '—',
      time: asPlainString(row.createdAt, '').slice(11, 16) || '--:--',
    }
  })

  return { alerts: alerts.length ? alerts : AUDIT_ALERTS, source: 'api' }
  } catch {
    return fallback
  }
}

export async function loadKasaDashboard(): Promise<KasaDashboardData> {
  const session = readNativeSession()
  const fallback: KasaDashboardData = {
    accounts: ACCOUNTS,
    ledger: LEDGER_ENTRIES,
    source: 'mock',
  }
  if (!session?.token) return fallback

  try {
  const day = todayYmd()
  const [meta, tx] = await Promise.all([
    withBossCache(
      'api:accounting-meta',
      BOSS_TTL.accounting,
      () => bossFetch<Record<string, unknown>>('/api/accounting/meta'),
      { persist: true, isCacheable: (r) => r.ok },
    ),
    withBossCache(
      'api:accounting-tx:today:30',
      BOSS_TTL.kpi,
      () =>
        bossFetch<{ items?: unknown[]; transactions?: unknown[] }>(
          '/api/accounting/transactions',
          { query: { page: '1', pageSize: '30', from: day, to: day } },
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
    const created = String(row.createdAt ?? '')
    return {
      id: String(row.id ?? i),
      datetime: created ? created.slice(0, 16).replace('T', ' ') : '—',
      description: String(row.title ?? row.typeLabel ?? row.type ?? 'Hareket'),
      amount: `${positive ? '+' : '-'}₺${formatMoneyTR(Math.abs(amount))}`,
      sign: positive ? 'positive' : 'negative',
      category: String(row.typeLabel ?? row.type ?? 'Hareket'),
    }
  })

  // Oturum varken örnek (mock) hesap/hareket gösterme — boş liste doğru durum
  return {
    accounts,
    ledger: meta.ok || tx.ok ? ledger : [],
    source: meta.ok || tx.ok ? 'api' : 'mock',
  }
  } catch {
    return { accounts: [], ledger: [], source: 'mock' }
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
  type?: 'bar' | 'compare' | 'line'
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
