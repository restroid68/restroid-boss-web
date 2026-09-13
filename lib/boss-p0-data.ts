import {
  ANA_KPIS,
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
  fetchSalesAnalysisEndingAt,
  fetchSalesAnalysisForDay,
  fetchSalesAnalysisTodayFull,
  formatMoneyTR,
  parseMoneyTR,
  todayYmd,
} from '@/lib/boss-api'
import { BOSS_TTL, withBossCache } from '@/lib/boss-page-cache'
import { formatBossDateTime, formatBossDayChip, istanbulYmd, isBossYmd } from '@/lib/boss-wall-clock'
import { bossBranchDisplayLabel } from '@/lib/boss-branch-display'
import { readNativeSession, type BossNativeSession } from '@/lib/boss-bridge'
import {
  formatBossEventTime,
  mapNotificationToAlertRow,
  mapNotificationToAuditAlert,
  type BossNotificationApiRow,
} from '@/lib/boss-notifications'

export type AnaRevenuePoint = { day: string; ciro: number }

export type AnaChannelShare = {
  key: string
  label: string
  amount: number
  share: number
  active: boolean
}

export type AnaPlatformRow = {
  key: string
  name: string
  orders: number
  revenue: number
}

export type AnaFinanceSheetKind = 'kasa' | 'banka' | 'cekmece' | 'gider'

export type AnaFinanceRow = {
  key: AnaFinanceSheetKind
  label: string
  value: string
  detail: string
  status: 'ok' | 'warning'
  href?: string
}

export type AnaFinanceSheetLine = {
  id: string
  title: string
  sub: string
  amount: string
  sign: 'positive' | 'negative' | 'neutral'
  time: string
}

export type AnaFinanceSheetData = {
  kind: AnaFinanceSheetKind
  lines: AnaFinanceSheetLine[]
  source: 'api' | 'mock'
}

export type AnaStaffSummary = {
  onDuty: number
  total: number
  dutyLabel: string
  topPerformer: string | null
  topPerformerSales: string | null
  initials: string[]
}

export type AnaBranchShare = {
  id: string
  name: string
  revenue: number
  share: number
  trend: number
  warning: boolean
}

export type AnaOpsAlert = {
  id: string
  title: string
  detail: string
  severity: 'critical' | 'warning' | 'info'
  module: string
  href?: string
}

export type AnaDashboardData = {
  restaurantName: string
  branchLabel: string
  kpis: KpiMetric[]
  revenueTrend: AnaRevenuePoint[]
  channelShares: AnaChannelShare[]
  platforms: AnaPlatformRow[]
  finance: AnaFinanceRow[]
  staff: AnaStaffSummary
  branches: AnaBranchShare[]
  channels: ChannelCard[]
  alerts: AlertRow[]
  opsAlerts: AnaOpsAlert[]
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

const DOW_SHORT: Record<string, string> = {
  Pazartesi: 'Pzt',
  Salı: 'Sal',
  Çarşamba: 'Çar',
  Perşembe: 'Per',
  Cuma: 'Cum',
  Cumartesi: 'Cmt',
  Pazar: 'Paz',
}

function pctDelta(today: number, yesterday: number): number {
  if (!Number.isFinite(today) || !Number.isFinite(yesterday) || yesterday <= 0.0005) return 0
  return Math.round(((today - yesterday) / yesterday) * 1000) / 10
}

function nameInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  return `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}`.toUpperCase() || '?'
}

function channelEnabled(
  enabledByCode: Map<string, boolean>,
  codes: string[],
): boolean | null {
  if (enabledByCode.size === 0) return null
  for (const code of codes) {
    if (enabledByCode.has(code)) return enabledByCode.get(code) === true
  }
  return false
}

function mapWeeklyTrend(weekly: unknown): AnaRevenuePoint[] {
  if (!Array.isArray(weekly)) return []
  return weekly
    .map((raw) => {
      const row = asMap(raw)
      if (!row) return null
      const full = String(row.day ?? '').trim()
      const day = DOW_SHORT[full] ?? full.slice(0, 3) ?? '—'
      return { day, ciro: num(row.net ?? row.ciro ?? row.amount) }
    })
    .filter((x): x is AnaRevenuePoint => x != null)
}

function ticketCountFromDaySummary(daySummary: Record<string, unknown> | null, guests: number): number {
  const types = Array.isArray(daySummary?.serviceTypes) ? daySummary!.serviceTypes : []
  let fromTypes = 0
  for (const raw of types) {
    const row = asMap(raw)
    if (row) fromTypes += num(row.orderCount ?? row.orders ?? row.count)
  }
  if (fromTypes > 0) return Math.round(fromTypes)
  return Math.max(0, Math.round(guests))
}

function mapChannelShares(
  breakdown: unknown,
  enabledByCode: Map<string, boolean>,
): AnaChannelShare[] {
  const defs: Array<{
    key: string
    label: string
    codes: string[]
    amount: number
  }> = [
    { key: 'dinein', label: 'Masa Servisi', codes: ['dinein'], amount: serviceAmt(breakdown, 1) },
    {
      key: 'online',
      label: 'Sipariş Platformları',
      codes: ['online'],
      amount: serviceAmtOnline(breakdown),
    },
    { key: 'delivery', label: 'Paket Servis', codes: ['delivery', 'paket'], amount: serviceAmt(breakdown, 2) },
    { key: 'takeaway', label: 'Gel-Al', codes: ['takeaway', 'gelal'], amount: serviceAmt(breakdown, 3) },
    { key: 'qr', label: 'QR Menü', codes: ['qr_menu', 'qr'], amount: serviceAmt(breakdown, 6) },
    { key: 'room', label: 'Oda Servisi', codes: ['room'], amount: serviceAmt(breakdown, 5) },
    { key: 'self', label: 'Self Servis', codes: ['self'], amount: serviceAmt(breakdown, 4) },
  ]
  const total = defs.reduce((a, d) => a + d.amount, 0)
  return defs
    .map((d) => {
      const licensed = channelEnabled(enabledByCode, d.codes)
      const active =
        licensed === null
          ? d.amount > 0 || ['dinein', 'online', 'delivery', 'takeaway'].includes(d.key)
          : licensed || d.amount > 0.0005
      const share = total > 0.0005 ? Math.round((d.amount / total) * 100) : 0
      return { key: d.key, label: d.label, amount: d.amount, share, active }
    })
    .filter((d) => d.active)
}

function isFoodPlatform(key: string, label: string): boolean {
  const s = `${key} ${label}`.toLowerCase()
  return /yemeksepeti|getir|trendyol|migros|ys[_-]|bring|fuudy|justeat/.test(s)
}

function mapPlatforms(daySummary: Record<string, unknown> | null, onlineAmount: number): AnaPlatformRow[] {
  const raw = Array.isArray(daySummary?.orderPlatforms) ? daySummary!.orderPlatforms : []
  const rows: AnaPlatformRow[] = []
  for (const item of raw) {
    const row = asMap(item)
    if (!row) continue
    const key = String(row.key ?? row.code ?? '')
    const name = String(row.label ?? row.name ?? key).trim()
    if (!name || !isFoodPlatform(key, name)) continue
    rows.push({
      key: key || name,
      name,
      orders: Math.max(0, Math.round(num(row.orderCount ?? row.orders))),
      revenue: num(row.amount ?? row.revenue),
    })
  }
  rows.sort((a, b) => b.revenue - a.revenue)
  if (rows.length) return rows.slice(0, 6)
  if (onlineAmount > 0.0005) {
    return [{ key: 'online', name: 'Online platformlar', orders: 0, revenue: onlineAmount }]
  }
  return []
}

function mapFinanceRows(
  accountsRaw: unknown[],
  shiftSummary: Record<string, unknown> | null,
  openShiftCount: number,
  closedShiftCount: number,
  expenseTotal: number,
  expenseDetail = 'Bugün',
  isToday = true,
): AnaFinanceRow[] {
  let cash = 0
  let bank = 0
  let pos = 0
  let cashNameCount = 0
  let bankNameCount = 0
  for (const raw of accountsRaw) {
    const row = asMap(raw)
    if (!row) continue
    const typeRaw = String(row.type ?? row.kind ?? 'cash').toLowerCase()
    const bal = num(row.balance ?? row.currentBalance ?? row.computed_balance)
    if (typeRaw.includes('bank')) {
      bank += bal
      bankNameCount += 1
    } else if (typeRaw.includes('pos') || typeRaw.includes('card')) {
      pos += bal
    } else {
      cash += bal
      cashNameCount += 1
    }
  }
  const shortage = num(shiftSummary?.shortageAmount)
  const drawerStatus: AnaFinanceRow['status'] = shortage > 0.009 ? 'warning' : 'ok'
  const drawerValue =
    openShiftCount > 0
      ? `${openShiftCount} açık`
      : closedShiftCount > 0
        ? `${closedShiftCount} kapalı`
        : '—'
  const drawerDetail =
    shortage > 0.009
      ? `₺${formatMoneyTR(shortage, 2)} kasa açığı`
      : openShiftCount > 0
        ? 'Nakit teslim bekliyor'
        : 'Nakit vardiya'
  return [
    {
      key: 'kasa',
      label: 'Kasa',
      value: `₺${formatMoneyTR(cash, cash % 1 === 0 ? 0 : 2)}`,
      detail: isToday
        ? cashNameCount > 1
          ? `${cashNameCount} nakit hesap`
          : 'Nakit'
        : 'Güncel bakiye',
      status: 'ok',
      href: '/boss-m/kasa',
    },
    {
      key: 'banka',
      label: 'Banka / POS',
      value: `₺${formatMoneyTR(bank + pos, (bank + pos) % 1 === 0 ? 0 : 2)}`,
      detail: isToday
        ? bankNameCount + (pos > 0 ? 1 : 0) > 1
          ? 'Kart ve banka'
          : 'Kart tahsilatı'
        : 'Güncel bakiye',
      status: 'ok',
      href: '/boss-m/kasa',
    },
    {
      key: 'cekmece',
      label: 'Çekmece',
      value: drawerValue,
      detail: drawerDetail,
      status: drawerStatus,
      href: '/boss-m/raporlar/vardiya',
    },
    {
      key: 'gider',
      label: 'Giderler',
      value: `₺${formatMoneyTR(expenseTotal, expenseTotal % 1 === 0 ? 0 : 2)}`,
      detail: expenseDetail,
      status: 'ok',
      href: '/boss-m/kasa/hareket?type=gider',
    },
  ]
}

function emptyStaff(): AnaStaffSummary {
  return {
    onDuty: 0,
    total: 0,
    dutyLabel: 'aktif kadro',
    topPerformer: null,
    topPerformerSales: null,
    initials: [],
  }
}

function emptyAna(session: BossNativeSession | null, source: 'api' | 'mock'): AnaDashboardData {
  const channelShares = mapChannelShares([], new Map())
  return {
    restaurantName: session?.restaurantName || 'Restroid',
    branchLabel: bossBranchDisplayLabel(session?.branchCode),
    kpis: ANA_KPIS.map((k) => ({ ...k })),
    revenueTrend: [],
    channelShares,
    platforms: [],
    finance: [
      {
        key: 'kasa',
        label: 'Kasa',
        value: '₺0',
        detail: 'Nakit',
        status: 'ok',
        href: '/boss-m/kasa',
      },
      {
        key: 'banka',
        label: 'Banka / POS',
        value: '₺0',
        detail: 'Kart tahsilatı',
        status: 'ok',
        href: '/boss-m/kasa',
      },
      {
        key: 'cekmece',
        label: 'Çekmece',
        value: '—',
        detail: 'Nakit vardiya',
        status: 'ok',
        href: '/boss-m/raporlar/vardiya',
      },
      {
        key: 'gider',
        label: 'Giderler',
        value: '₺0',
        detail: 'Bugün',
        status: 'ok',
        href: '/boss-m/kasa/hareket?type=gider',
      },
    ],
    staff: emptyStaff(),
    branches: [],
    channels: channelsFromShares(channelShares),
    alerts: [],
    opsAlerts: [],
    operasyonBadges: {},
    source,
  }
}

function channelsFromShares(shares: AnaChannelShare[]): ChannelCard[] {
  return shares
    .filter((c) => c.active)
    .map((c) => ({
      key: c.key,
      label: c.label,
      value: `₺${formatMoneyTR(c.amount)}`,
      variant: 'neutral' as const,
    }))
}

export async function loadAnaDashboard(day = todayYmd()): Promise<AnaDashboardData> {
  const session = readNativeSession()
  const fallback = emptyAna(session, 'mock')
  if (!session?.token) return fallback

  try {
    const today = istanbulYmd()
    const selectedDay = isBossYmd(day) ? day : today
    const isToday = selectedDay === today
    const dayChip = formatBossDayChip(selectedDay, today)
    const liveEmpty = Promise.resolve({
      ok: true as const,
      status: 200,
      data: { count: 0, rows: [] as unknown[], items: [] as unknown[], orders: [] as unknown[] },
    })
    const [
      sales,
      week,
      onlinePending,
      qrPending,
      active,
      logs,
      meta,
      shifts,
      personel,
      kanallar,
    ] = await Promise.all([
      fetchSalesAnalysisForDay(selectedDay),
      fetchSalesAnalysisEndingAt(selectedDay, 7),
      isToday
        ? withBossCache(
            'api:online-pending-count',
            BOSS_TTL.live,
            () => bossFetch<{ count?: number }>('/api/sales/online-orders/pending-count'),
            { isCacheable: (r) => r.ok },
          )
        : liveEmpty,
      isToday
        ? withBossCache(
            'api:qr-pending-count',
            BOSS_TTL.live,
            () => bossFetch<{ count?: number }>('/api/sales/qr-menu-orders/pending-count'),
            { isCacheable: (r) => r.ok },
          )
        : liveEmpty,
      isToday
        ? withBossCache(
            'api:active-orders',
            BOSS_TTL.live,
            () =>
              bossFetch<{ rows?: unknown[]; items?: unknown[]; orders?: unknown[]; count?: number }>(
                '/api/sales/active-orders',
              ),
            { isCacheable: (r) => r.ok },
          )
        : liveEmpty,
      withBossCache(
        `api:boss-notifications:8:${selectedDay}`,
        BOSS_TTL.live,
        () =>
          bossFetch<{ items?: BossNotificationApiRow[] }>('/api/boss/notifications', {
            query: { limit: '8', day: selectedDay },
          }),
        { isCacheable: (r) => r.ok },
      ),
      withBossCache(
        'api:accounting-meta',
        BOSS_TTL.accounting,
        () => bossFetch<Record<string, unknown>>('/api/accounting/meta'),
        { persist: true, isCacheable: (r) => r.ok },
      ),
      withBossCache(
        `api:cash-shifts:${selectedDay}`,
        BOSS_TTL.kpi,
        () =>
          bossFetch<{ items?: unknown[]; summary?: Record<string, unknown> }>(
            '/api/finance/cash-shifts',
            { query: { page: '1', pageSize: '20', from: selectedDay, to: selectedDay } },
          ),
        { isCacheable: (r) => r.ok },
      ),
      withBossCache(
        'api:personnel-list',
        BOSS_TTL.kpi,
        () =>
          bossFetch<{ items?: unknown[]; personnel?: unknown[]; rows?: unknown[] }>(
            '/api/restaurant/personnel',
          ),
        { isCacheable: (r) => r.ok },
      ),
      withBossCache(
        'api:service-channels',
        BOSS_TTL.definitions,
        () => bossFetch<unknown>('/api/service-channels'),
        { persist: true, isCacheable: (r) => r.ok },
      ),
    ])

    const base = emptyAna(session, 'api')
    const d = sales.ok ? sales.data : null
    const summary = asMap(d?.summary) ?? {}
    const daySummary = asMap(d?.daySummary)
    const ciro = num(
      summary.netSales ?? summary.closedNetSales ?? summary.totalRevenue ?? summary.revenue,
    )
    const closed = num(summary.closedNetSales)
    const openAmt = num(summary.openAccount ?? summary.openOrdersTotal ?? summary.openAmount)
    const guests = num(summary.guestCount ?? summary.guests)
    const tickets = ticketCountFromDaySummary(daySummary, guests)
    const basketBase = closed > 0.0005 ? closed : Math.max(0, ciro - openAmt)
    const basket = tickets > 0 ? basketBase / tickets : 0

    const trend = mapWeeklyTrend(asMap(week.data)?.weekly)
    const todayNet = trend.length ? trend[trend.length - 1]!.ciro : ciro
    const yesterdayNet = trend.length >= 2 ? trend[trend.length - 2]!.ciro : 0
    const ciroDelta = pctDelta(todayNet || ciro, yesterdayNet)

    const activeItems = Array.isArray(active.data?.rows)
      ? active.data!.rows!
      : Array.isArray(active.data?.items)
        ? active.data!.items!
        : Array.isArray(active.data?.orders)
          ? active.data!.orders!
          : []
    const openTables = Number(active.data?.count ?? activeItems.length) || 0
    const onlineCount = num(onlinePending.data?.count)
    const qrCount = num(qrPending.data?.count)
    const liveOrders = openTables + onlineCount + qrCount

    const personelRaw = Array.isArray(personel.data?.items)
      ? personel.data!.items!
      : Array.isArray(personel.data?.personnel)
        ? personel.data!.personnel!
        : Array.isArray(personel.data?.rows)
          ? personel.data!.rows!
          : []
    const activeStaffNames: string[] = []
    for (const raw of personelRaw) {
      const row = asMap(raw)
      if (!row) continue
      const active = row.active !== false && row.isActive !== false && row.status !== 'passive'
      if (!active) continue
      const name = String(
        row.fullName ?? row.name ?? `${String(row.firstName ?? '')} ${String(row.lastName ?? '')}`.trim(),
      ).trim()
      if (name) activeStaffNames.push(name)
    }

    const kanallarRaw = Array.isArray(kanallar.data)
      ? kanallar.data
      : Array.isArray(asMap(kanallar.data)?.channels)
        ? (asMap(kanallar.data)!.channels as unknown[])
        : Array.isArray(asMap(kanallar.data)?.items)
          ? (asMap(kanallar.data)!.items as unknown[])
          : Array.isArray(asMap(kanallar.data)?.rows)
            ? (asMap(kanallar.data)!.rows as unknown[])
            : []
    const enabledByCode = new Map<string, boolean>()
    for (const raw of kanallarRaw) {
      const row = asMap(raw)
      if (!row) continue
      const code = String(row.code ?? row.id ?? '').toLowerCase()
      if (!code) continue
      enabledByCode.set(
        code,
        row.isActive === true ||
          row.enabled === true ||
          row.isEnabled === true ||
          row.active === true,
      )
    }
    const channelShares = mapChannelShares(d?.serviceTypeBreakdown, enabledByCode)
    const platforms = mapPlatforms(daySummary, serviceAmtOnline(d?.serviceTypeBreakdown))

    const accountsRaw =
      (Array.isArray(meta.data?.accounts) && meta.data!.accounts) ||
      (Array.isArray(asMap(meta.data)?.cashAccounts) &&
        (asMap(meta.data)!.cashAccounts as unknown[])) ||
      (Array.isArray(daySummary?.financeAccounts) ? (daySummary!.financeAccounts as unknown[]) : []) ||
      []
    const shiftItems = Array.isArray(shifts.data?.items) ? shifts.data!.items! : []
    let openShiftCount = 0
    let closedShiftCount = 0
    for (const raw of shiftItems) {
      const row = asMap(raw)
      if (!row) continue
      if (row.closedAt) closedShiftCount += 1
      else openShiftCount += 1
    }
    const expenseTotal = Math.abs(num(summary.expenses))
    const finance = mapFinanceRows(
      accountsRaw as unknown[],
      asMap(shifts.data?.summary),
      openShiftCount,
      closedShiftCount,
      expenseTotal,
      dayChip,
      isToday,
    )

    const waiterRaw = Array.isArray(daySummary?.waiterSales) ? daySummary!.waiterSales : []
    const cashierRaw = Array.isArray(daySummary?.cashierSales) ? daySummary!.cashierSales : []
    const sellerNames: string[] = []
    let topName: string | null = null
    let topAmt = 0
    for (const raw of [...waiterRaw, ...cashierRaw]) {
      const row = asMap(raw)
      if (!row) continue
      const name = String(row.name ?? row.personnelName ?? row.fullName ?? '').trim()
      if (!name) continue
      if (!sellerNames.includes(name)) sellerNames.push(name)
      const amt = num(row.amount ?? row.total ?? row.sales)
      if (amt > topAmt) {
        topAmt = amt
        topName = name
      }
    }
    const staff: AnaStaffSummary = {
      onDuty: sellerNames.length,
      total: Math.max(activeStaffNames.length, sellerNames.length),
      dutyLabel: sellerNames.length ? (isToday ? 'bugün satış' : 'o gün satış') : 'aktif kadro',
      topPerformer: topName,
      topPerformerSales: topName ? `₺${formatMoneyTR(topAmt)}` : null,
      initials: (sellerNames.length ? sellerNames : activeStaffNames)
        .slice(0, 5)
        .map(nameInitials),
    }

    const wasteAmt = num(summary.waste ?? summary.wasteAmount)
    const cancelAmt = num(summary.cancellations)
    const kpis: KpiMetric[] = [
      {
        label: 'Günlük Ciro',
        value: formatMoneyTR(ciro),
        delta: ciroDelta,
        unit: '₺',
        description: dayChip,
      },
      {
        label: 'Sipariş / Fiş',
        value: formatMoneyTR(tickets),
        delta: 0,
        unit: '',
        description: isToday ? 'Bugün kapanan' : `${dayChip} kapanan`,
      },
      {
        label: 'Ortalama Sepet',
        value: formatMoneyTR(basket),
        delta: 0,
        unit: '₺',
        description: 'Fiş başına',
      },
      isToday
        ? {
            label: 'Canlı Sipariş',
            value: String(Math.max(0, Math.round(liveOrders))),
            delta: 0,
            unit: '',
            description: 'Şu an açık',
            neutral: true,
          }
        : {
            label: 'Zayi / İptal',
            value: formatMoneyTR(wasteAmt + cancelAmt),
            delta: 0,
            unit: '₺',
            description: dayChip,
          },
    ]

    const notifyItems = Array.isArray(logs.data?.items) ? logs.data!.items! : []
    const alerts: AlertRow[] = notifyItems.slice(0, 5).map((raw, i) => mapNotificationToAlertRow(raw, i))

    const opsAlerts: AnaOpsAlert[] = []
    if (onlineCount > 0) {
      opsAlerts.push({
        id: 'ops-online',
        title: 'Online sipariş bekliyor',
        detail: `${Math.round(onlineCount)} sipariş onay bekliyor`,
        severity: 'warning',
        module: 'Online',
        href: '/boss-m/siparisler/online',
      })
    }
    if (qrCount > 0) {
      opsAlerts.push({
        id: 'ops-qr',
        title: 'QR sipariş bekliyor',
        detail: `${Math.round(qrCount)} sipariş onay bekliyor`,
        severity: 'info',
        module: 'QR',
        href: '/boss-m/siparisler/qr',
      })
    }
    const shortage = num(asMap(shifts.data?.summary)?.shortageAmount)
    if (shortage > 0.009) {
      opsAlerts.push({
        id: 'ops-drawer',
        title: 'Kasa açığı',
        detail: `Nakit vardiyada ₺${formatMoneyTR(shortage, 2)} fark`,
        severity: 'warning',
        module: 'Sayım',
        href: '/boss-m/raporlar/vardiya',
      })
    }
    const waste = wasteAmt
    if (waste > 0.009) {
      opsAlerts.push({
        id: 'ops-waste',
        title: isToday ? 'Bugün zayi' : `${dayChip} zayi`,
        detail: `₺${formatMoneyTR(waste)} zayi kaydı`,
        severity: 'info',
        module: 'Stok',
        href: '/boss-m/stok/fire',
      })
    }

    return {
      ...base,
      kpis,
      revenueTrend: trend,
      channelShares,
      platforms,
      finance,
      staff,
      channels: channelsFromShares(channelShares),
      alerts,
      opsAlerts,
      operasyonBadges: {
        online: onlineCount,
        qr: qrCount,
        hesaplar: openTables,
        stok: 0,
      },
      source: 'api',
    }
  } catch {
    return emptyAna(session, 'api')
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

export async function loadDenetimDashboard(day = todayYmd()): Promise<DenetimDashboardData> {
  const session = readNativeSession()
  if (!session?.token) return { alerts: [], nextCursor: null, source: 'mock' }

  try {
    const selectedDay = isBossYmd(day) ? day : todayYmd()
    const inbox = await withBossCache(
      `api:boss-notifications:50:${selectedDay}`,
      BOSS_TTL.live,
      () =>
        bossFetch<{ items?: BossNotificationApiRow[]; nextCursor?: string | null }>(
          '/api/boss/notifications',
          { query: { limit: '50', day: selectedDay } },
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

function financeAccountKind(typeRaw: unknown): 'cash' | 'bank' | 'pos' {
  const t = String(typeRaw ?? '').toLowerCase()
  if (t.includes('bank')) return 'bank'
  if (t.includes('pos') || t.includes('card')) return 'pos'
  return 'cash'
}

function txList(raw: { items?: unknown[]; transactions?: unknown[] } | null | undefined): unknown[] {
  if (Array.isArray(raw?.items)) return raw.items!
  if (Array.isArray(raw?.transactions)) return raw.transactions!
  return []
}

function mapTxToSheetLine(raw: unknown, i: number): AnaFinanceSheetLine {
  const row = asMap(raw) ?? {}
  const amount = num(row.amount ?? row.signedAmount)
  const positive = amount >= 0
  const when = String(row.occurredAt ?? row.createdAt ?? '')
  const typeLabel = accountingTypeLabelTR(String(row.type ?? ''))
  const account = asMap(row.account)
  const accountName = account ? String(account.name ?? '').trim() : ''
  const descr = String(row.description ?? '').trim() || typeLabel
  return {
    id: String(row.id ?? i),
    title: descr,
    sub: accountName || typeLabel,
    amount: `${positive ? '+' : '-'}₺${formatMoneyTR(Math.abs(amount), Math.abs(amount) % 1 === 0 ? 0 : 2)}`,
    sign: amount === 0 ? 'neutral' : positive ? 'positive' : 'negative',
    time: formatBossEventTime(when),
  }
}

export async function loadAnaFinanceSheet(
  kind: AnaFinanceSheetKind,
  day = todayYmd(),
): Promise<AnaFinanceSheetData> {
  const session = readNativeSession()
  if (!session?.token) return { kind, lines: [], source: 'mock' }

  const selectedDay = isBossYmd(day) ? day : todayYmd()

  try {
    if (kind === 'cekmece') {
      const shifts = await withBossCache(
        `api:cash-shifts:${selectedDay}`,
        BOSS_TTL.kpi,
        () =>
          bossFetch<{ items?: unknown[]; summary?: Record<string, unknown> }>(
            '/api/finance/cash-shifts',
            { query: { page: '1', pageSize: '20', from: selectedDay, to: selectedDay } },
          ),
        { isCacheable: (r) => r.ok },
      )
      const items = Array.isArray(shifts.data?.items) ? shifts.data!.items! : []
      const lines: AnaFinanceSheetLine[] = items.map((raw, i) => {
        const row = asMap(raw) ?? {}
        const variance = num(row.varianceAmount)
        const seq = Math.max(0, Math.floor(num(row.seq)))
        const name = String(row.personnelName ?? '—').trim() || '—'
        const mode = String(row.mode ?? '') === 'wallet' ? 'Cüzdan' : 'Havuz kasa'
        const closed = Boolean(row.closedAt)
        return {
          id: String(row.id ?? i),
          title: seq ? `#${seq} · ${name}` : name,
          sub: `${mode} · ${closed ? 'kapalı' : 'açık'}`,
          amount: `${variance < 0 ? '-' : variance > 0 ? '+' : ''}₺${formatMoneyTR(Math.abs(variance), 2)}`,
          sign: variance < -0.009 ? 'negative' : variance > 0.009 ? 'positive' : 'neutral',
          time: formatBossEventTime(row.closedAt ?? row.startedAt),
        }
      })
      return { kind, lines, source: shifts.ok ? 'api' : 'mock' }
    }

    const tx = await withBossCache(
      `api:accounting-tx:${selectedDay}:50`,
      BOSS_TTL.kpi,
      () =>
        bossFetch<{ items?: unknown[]; transactions?: unknown[] }>(
          '/api/accounting/transactions',
          { query: { page: '1', pageSize: '50', from: selectedDay, to: selectedDay } },
        ),
      { isCacheable: (r) => r.ok },
    )
    const items = txList(tx.data)
    const filtered = items.filter((raw) => {
      const row = asMap(raw) ?? {}
      const type = String(row.type ?? '').toUpperCase()
      const accKind = financeAccountKind(asMap(row.account)?.type)
      if (kind === 'gider') return type === 'EXPENSE'
      if (kind === 'kasa') return accKind === 'cash'
      return accKind === 'bank' || accKind === 'pos'
    })
    return {
      kind,
      lines: filtered.map(mapTxToSheetLine),
      source: tx.ok ? 'api' : 'mock',
    }
  } catch {
    return { kind, lines: [], source: 'api' }
  }
}

function mapAccountingTxToLedger(raw: unknown, i: number): LedgerEntry {
  const row = asMap(raw) ?? {}
  const amount = num(row.amount ?? row.signedAmount)
  const positive = amount >= 0
  const typeLabel = accountingTypeLabelTR(String(row.type ?? ''))
  const descr = String(row.description ?? '').trim() || typeLabel
  return {
    id: String(row.id ?? i),
    datetime: formatBossDateTime(row.occurredAt ?? row.createdAt),
    description: descr,
    amount: `${positive ? '+' : '-'}₺${formatMoneyTR(Math.abs(amount))}`,
    sign: positive ? 'positive' : 'negative',
    category: typeLabel,
  }
}

function txRowAccountId(raw: unknown): string {
  const row = asMap(raw) ?? {}
  const nested = asMap(row.account)
  return String(row.accountId ?? nested?.id ?? '').trim()
}

export async function loadKasaLedger(accountId: string): Promise<LedgerEntry[]> {
  const id = accountId.trim()
  if (!id) return []
  const session = readNativeSession()
  if (!session?.token) return []
  try {
    const tx = await withBossCache(
      `api:accounting-tx:account:${id}:v2`,
      BOSS_TTL.kpi,
      () =>
        bossFetch<{ items?: unknown[]; transactions?: unknown[] }>(
          '/api/accounting/transactions',
          { query: { page: '1', take: '40', pageSize: '40', accountId: id } },
        ),
      { isCacheable: (r) => r.ok },
    )
    if (!tx.ok) return []
    return txList(tx.data)
      .filter((raw) => txRowAccountId(raw) === id)
      .map((raw, i) => mapAccountingTxToLedger(raw, i))
  } catch {
    return []
  }
}

export async function loadKasaDashboard(): Promise<KasaDashboardData> {
  const session = readNativeSession()
  // Oturum yokken örnek hesap gösterme — boş liste ('mock' = önizleme)
  if (!session?.token) return { accounts: [], source: 'mock' }

  try {
    const meta = await withBossCache(
      'api:accounting-meta',
      BOSS_TTL.accounting,
      () => bossFetch<Record<string, unknown>>('/api/accounting/meta'),
      { persist: true, isCacheable: (r) => r.ok },
    )

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

    return { accounts, source: 'api' }
  } catch {
    return { accounts: [], source: 'api' }
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
