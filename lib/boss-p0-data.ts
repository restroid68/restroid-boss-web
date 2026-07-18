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
import { bossFetch, formatMoneyTR, todayYmd } from '@/lib/boss-api'
import { readNativeSession } from '@/lib/boss-bridge'

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
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : 0
}

function asMap(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null
}

export async function loadAnaDashboard(): Promise<AnaDashboardData> {
  const session = readNativeSession()
  const fallback: AnaDashboardData = {
    restaurantName: session?.restaurantName || 'Restroid',
    branchLabel: session?.branchCode || 'HQ',
    kpis: ANA_KPIS,
    channels: CHANNEL_CARDS,
    alerts: DIKKAT_ALERTS,
    operasyonBadges: { stok: STOK_KPI.kritikAdet },
    source: 'mock',
  }

  if (!session?.token) return fallback

  const day = todayYmd()
  const [sales, onlinePending, qrPending, active, logs] = await Promise.all([
    bossFetch<Record<string, unknown>>('/api/branches/sales-analysis', {
      query: { from: day, to: day, part: 'full' },
    }),
    bossFetch<{ count?: number }>('/api/sales/online-orders/pending-count'),
    bossFetch<{ count?: number }>('/api/sales/qr-menu-orders/pending-count'),
    bossFetch<{ items?: unknown[]; orders?: unknown[]; count?: number }>(
      '/api/sales/active-orders',
    ),
    bossFetch<{ items?: unknown[]; logs?: unknown[] }>('/api/operation-logs', {
      query: { page: '1', pageSize: '8' },
    }),
  ])

  if (!sales.ok || !sales.data) return fallback

  const d = sales.data
  const summary = asMap(d.summary) ?? asMap(d.totals) ?? d
  const ciro = num(summary.totalRevenue ?? summary.revenue ?? summary.ciro ?? d.totalRevenue)
  const paid = num(summary.paidAmount ?? summary.paid ?? summary.tahsilat)
  const openAmt = num(summary.openAmount ?? summary.open ?? summary.acik)
  const guests = num(summary.guestCount ?? summary.guests ?? summary.konuk)

  const kpis: KpiMetric[] = [
    { label: 'Günlük Ciro', value: formatMoneyTR(ciro), delta: 0, unit: '₺' },
    { label: 'Ödenen', value: formatMoneyTR(paid || ciro), delta: 0, unit: '₺' },
    { label: 'Açık', value: formatMoneyTR(openAmt), delta: 0, unit: '₺' },
    { label: 'Konuk', value: formatMoneyTR(guests), delta: 0, unit: '' },
  ]

  const channelsRaw = asMap(d.channels) ?? asMap(d.byChannel) ?? {}
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
      value: `₺${formatMoneyTR(num(channelsRaw.online ?? channelsRaw.delivery))}`,
      variant: 'neutral',
    },
    {
      key: 'paket',
      label: 'Paket',
      value: `₺${formatMoneyTR(num(channelsRaw.paket ?? channelsRaw.package))}`,
      variant: 'neutral',
    },
    {
      key: 'gelal',
      label: 'Gel-al',
      value: `₺${formatMoneyTR(num(channelsRaw.takeaway ?? channelsRaw.gelal))}`,
      variant: 'neutral',
    },
    {
      key: 'self',
      label: 'Self',
      value: `₺${formatMoneyTR(num(channelsRaw.self))}`,
      variant: 'neutral',
    },
    {
      key: 'iptal',
      label: 'İptal',
      value: `₺${formatMoneyTR(num(summary.cancelAmount ?? summary.iptal))}`,
      variant: 'danger',
    },
    {
      key: 'zayi',
      label: 'Zayi',
      value: `₺${formatMoneyTR(num(summary.wasteAmount ?? summary.zayi))}`,
      variant: 'warning',
    },
    {
      key: 'indirim',
      label: 'İndirim',
      value: `₺${formatMoneyTR(num(summary.discountAmount ?? summary.indirim))}`,
      variant: 'warning',
    },
  ]

  const logItems = Array.isArray(logs.data?.items)
    ? logs.data!.items!
    : Array.isArray(logs.data?.logs)
      ? logs.data!.logs!
      : []
  const alerts: AlertRow[] = logItems.slice(0, 5).map((raw, i) => {
    const row = asMap(raw) ?? {}
    const msg = String(row.message ?? row.actionLabel ?? row.action ?? 'İşlem')
    const detail = String(row.detail ?? row.entityLabel ?? row.page ?? '')
    const timeRaw = String(row.createdAt ?? row.time ?? '')
    const time = timeRaw.includes('T')
      ? timeRaw.slice(11, 16)
      : timeRaw.slice(0, 5) || '--:--'
    return {
      id: String(row.id ?? `log-${i}`),
      type: String(row.severity ?? '').includes('critical') || String(row.action).includes('delete')
        ? 'kritik'
        : 'uyari',
      message: msg,
      detail,
      time,
    }
  })

  return {
    restaurantName: session.restaurantName || fallback.restaurantName,
    branchLabel: session.branchCode || 'HQ',
    kpis,
    channels,
    alerts: alerts.length ? alerts : DIKKAT_ALERTS,
    operasyonBadges: {
      online: num(onlinePending.data?.count),
      qr: num(qrPending.data?.count),
      hesaplar: Number(openTables) || 0,
      stok: STOK_KPI.kritikAdet,
    },
    source: 'api',
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

  const day = todayYmd()
  const [sales, tx] = await Promise.all([
    bossFetch<Record<string, unknown>>('/api/branches/sales-analysis', {
      query: { from: day, to: day, part: 'full' },
    }),
    bossFetch<{ items?: unknown[]; transactions?: unknown[] }>(
      '/api/accounting/transactions',
      { query: { page: '1', pageSize: '20', from: day, to: day } },
    ),
  ])

  if (!sales.ok && !tx.ok) return fallback

  const summary = asMap(sales.data?.summary) ?? asMap(sales.data) ?? {}
  const ciro = num(summary.totalRevenue ?? summary.revenue ?? 0)
  const payments = asMap(sales.data?.payments) ?? asMap(summary.payments) ?? {}

  const slices: PaymentSlice[] = []
  const entries = Object.entries(payments)
  const sumPay = entries.reduce((a, [, v]) => a + num(v), 0) || 1
  const colors = ['#10b981', '#38bdf8', '#f59e0b', '#f43f5e', '#a78bfa']
  entries.slice(0, 5).forEach(([label, v], i) => {
    const amount = num(v)
    slices.push({
      label,
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
    paymentMix: slices.length ? slices : PAYMENT_MIX,
    totalLabel: `₺${formatMoneyTR(ciro || sumPay)}`,
    tiles: [
      {
        label: 'Açık Hesaplar',
        value: `₺${formatMoneyTR(num(summary.openAmount))}`,
        sub: 'bugün',
        variant: 'warning',
      },
      {
        label: 'Giderler',
        value: `₺${formatMoneyTR(num(summary.expenseAmount ?? summary.gider))}`,
        sub: 'bugün',
        variant: 'danger',
      },
      {
        label: 'Tahsilatlar',
        value: `₺${formatMoneyTR(num(summary.paidAmount ?? ciro))}`,
        sub: 'bugün',
        variant: 'success',
      },
      {
        label: 'Ödemeler',
        value: `₺${formatMoneyTR(num(summary.payableAmount))}`,
        sub: 'bekleyen',
        variant: 'neutral',
      },
    ],
    movements: movements.length ? movements : RECENT_MOVEMENTS,
    source: sales.ok || tx.ok ? 'api' : 'mock',
  }
}

export async function loadDenetimDashboard(): Promise<DenetimDashboardData> {
  const session = readNativeSession()
  if (!session?.token) return { alerts: AUDIT_ALERTS, source: 'mock' }

  const logs = await bossFetch<{ items?: unknown[]; logs?: unknown[] }>(
    '/api/operation-logs',
    { query: { page: '1', pageSize: '40' } },
  )
  if (!logs.ok) return { alerts: AUDIT_ALERTS, source: 'mock' }

  const items = Array.isArray(logs.data?.items)
    ? logs.data!.items!
    : Array.isArray(logs.data?.logs)
      ? logs.data!.logs!
      : []

  const alerts: AuditAlert[] = items.map((raw, i) => {
    const row = asMap(raw) ?? {}
    const action = String(row.action ?? row.actionKey ?? '').toLowerCase()
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

    return {
      id: String(row.id ?? i),
      severity,
      category,
      title: String(row.actionLabel ?? row.message ?? row.action ?? 'İşlem'),
      who: String(row.userName ?? row.actorName ?? row.email ?? '—'),
      target: String(row.entityLabel ?? row.page ?? row.target ?? '—'),
      amount: row.amount != null ? `₺${formatMoneyTR(num(row.amount))}` : '—',
      time: String(row.createdAt ?? '').slice(11, 16) || '--:--',
    }
  })

  return { alerts: alerts.length ? alerts : AUDIT_ALERTS, source: 'api' }
}

export async function loadKasaDashboard(): Promise<KasaDashboardData> {
  const session = readNativeSession()
  if (!session?.token) {
    return { accounts: ACCOUNTS, ledger: LEDGER_ENTRIES, source: 'mock' }
  }

  const [meta, tx] = await Promise.all([
    bossFetch<Record<string, unknown>>('/api/accounting/meta'),
    bossFetch<{ items?: unknown[]; transactions?: unknown[] }>(
      '/api/accounting/transactions',
      { query: { page: '1', pageSize: '30', from: todayYmd(), to: todayYmd() } },
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
    return {
      id: String(row.id ?? i),
      name: String(row.name ?? row.label ?? `Hesap ${i + 1}`),
      type,
      balance: formatMoneyTR(num(row.balance ?? row.currentBalance)),
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

  return {
    accounts: accounts.length ? accounts : ACCOUNTS,
    ledger: ledger.length ? ledger : LEDGER_ENTRIES,
    source: meta.ok || tx.ok ? 'api' : 'mock',
  }
}

export async function askBossAiApi(
  question: string,
  history: Array<{ role: string; content: string }> = [],
): Promise<{ ok: boolean; answer: string }> {
  const session = readNativeSession()
  if (!session?.token) return { ok: false, answer: '' }

  const res = await bossFetch<{ answer?: string; text?: string; message?: string }>(
    '/api/boss/ai/ask',
    {
      method: 'POST',
      body: JSON.stringify({
        question,
        days: 7,
        history: history.map((h) => ({ role: h.role, content: h.content })),
      }),
    },
  )
  if (!res.ok || !res.data) return { ok: false, answer: '' }
  const answer = String(res.data.answer ?? res.data.text ?? res.data.message ?? '')
  return { ok: Boolean(answer), answer }
}
