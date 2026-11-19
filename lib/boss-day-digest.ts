/**
 * Ana sayfa «Gün özeti» — panel `/api/branches/sales-analysis` (part=full) cevabından türetilir.
 * Hesaplar cloud panel «Günün özeti» ekranıyla aynıdır (kapanan = alınan ödeme, net = kapanan + açık,
 * kişi başı = net / konuk, nakit akışı = nakit satış + nakit giriş − nakit çıkış) — iki ekranda
 * aynı rakam görünsün. Saf fonksiyon: oturum / ağ bağımlılığı yok.
 */
import { formatMoneyTR } from '@/lib/boss-money'
import { BOSS_WALL_TZ } from '@/lib/boss-wall-clock'

export type AnaDayTone = 'neutral' | 'good' | 'warn' | 'bad'

export type AnaDayStat = {
  key: string
  label: string
  value: string
  hint?: string
  tone?: AnaDayTone
}

export type AnaDayInsight = {
  key: string
  tone: 'bad' | 'warn' | 'info'
  title: string
  body: string
}

export type AnaHourPoint = { hour: string; sales: number; out: number }

export type AnaLossKind = 'cancel' | 'complimentary' | 'waste'

export type AnaLossEvent = {
  id: string
  title: string
  amount: string
  /** «14:32 · Ahmet · Masa 4» */
  meta: string
  note: string | null
}

export type AnaLossRow = {
  kind: AnaLossKind
  label: string
  amount: number
  amountLabel: string
  count: number
  /** Net satışa oranı (%). */
  sharePct: number | null
  tone: AnaDayTone
  events: AnaLossEvent[]
}

export type AnaShareRow = {
  key: string
  label: string
  amount: number
  amountLabel: string
  /** 0–100 */
  share: number
  sub?: string
}

export type AnaSellerRow = {
  key: string
  name: string
  role: 'Garson' | 'Kasiyer'
  amountLabel: string
  sub: string | null
}

export type AnaDayDigest = {
  dayLabel: string
  isToday: boolean
  /** Satış ya da hareket var mı — yoksa boş durum gösterilir. */
  hasActivity: boolean
  net: number
  netLabel: string
  /** Önceki güne göre % değişim; karşılaştırma yoksa null. */
  deltaPct: number | null
  closedLabel: string
  openLabel: string
  openAmount: number
  /** Alınan ödeme oranı 0–100; satış yoksa null. */
  collectPct: number | null
  /** Şu an açık sipariş (masa + online + QR); yalnız bugün, aksi halde null. */
  liveOrders: number | null
  stats: AnaDayStat[]
  insights: AnaDayInsight[]
  hourly: AnaHourPoint[]
  peakHour: string | null
  peakLabel: string | null
  losses: AnaLossRow[]
  lossTotalLabel: string
  payments: AnaShareRow[]
  paymentsTotalLabel: string
  topProducts: AnaShareRow[]
  expenses: AnaShareRow[]
  expenseTotalLabel: string
  sellers: AnaSellerRow[]
}

function num(v: unknown): number {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

function asMap(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null
}

function asList(v: unknown): Record<string, unknown>[] {
  if (!Array.isArray(v)) return []
  const out: Record<string, unknown>[] = []
  for (const item of v) {
    const row = asMap(item)
    if (row) out.push(row)
  }
  return out
}

function text(v: unknown): string {
  return v == null ? '' : String(v).trim()
}

export function bossMoneyLabel(n: number): string {
  return `₺${formatMoneyTR(n)}`
}

function pctLabel(n: number): string {
  return `%${formatMoneyTR(n, n >= 10 || Number.isInteger(n) ? 0 : 1)}`
}

function timeLabel(iso: unknown): string {
  const s = text(iso)
  if (!s) return ''
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleTimeString('tr-TR', { timeZone: BOSS_WALL_TZ, hour: '2-digit', minute: '2-digit' })
}

const LOSS_META: Array<{ kind: AnaLossKind; rowKey: string; label: string; summaryKeys: string[] }> = [
  { kind: 'cancel', rowKey: 'cancellations', label: 'İptal', summaryKeys: ['cancellations'] },
  { kind: 'complimentary', rowKey: 'complimentary', label: 'İkram', summaryKeys: ['complimentaryTotal'] },
  { kind: 'waste', rowKey: 'waste', label: 'Zayi', summaryKeys: ['waste'] },
]

function shareRows(
  rows: Array<{ key: string; label: string; amount: number; sub?: string }>,
  limit: number,
): AnaShareRow[] {
  const visible = rows.filter((r) => r.label && Math.abs(r.amount) > 0.0005)
  visible.sort((a, b) => b.amount - a.amount)
  const total = visible.reduce((sum, r) => sum + Math.abs(r.amount), 0)
  return visible.slice(0, limit).map((r) => ({
    key: r.key,
    label: r.label,
    amount: r.amount,
    amountLabel: bossMoneyLabel(r.amount),
    share: total > 0.0005 ? Math.round((Math.abs(r.amount) / total) * 100) : 0,
    ...(r.sub ? { sub: r.sub } : {}),
  }))
}

export function emptyAnaDayDigest(dayLabel = 'Bugün', isToday = true): AnaDayDigest {
  const zero = bossMoneyLabel(0)
  return {
    dayLabel,
    isToday,
    hasActivity: false,
    net: 0,
    netLabel: zero,
    deltaPct: null,
    closedLabel: zero,
    openLabel: zero,
    openAmount: 0,
    collectPct: null,
    liveOrders: null,
    stats: [],
    insights: [],
    hourly: [],
    peakHour: null,
    peakLabel: null,
    losses: LOSS_META.map((m) => ({
      kind: m.kind,
      label: m.label,
      amount: 0,
      amountLabel: zero,
      count: 0,
      sharePct: null,
      tone: 'neutral',
      events: [],
    })),
    lossTotalLabel: zero,
    payments: [],
    paymentsTotalLabel: zero,
    topProducts: [],
    expenses: [],
    expenseTotalLabel: zero,
    sellers: [],
  }
}

export function buildAnaDayDigest(
  data: Record<string, unknown> | null,
  opts: {
    dayLabel: string
    isToday: boolean
    /** Önceki günün net satışı (haftalık seriden); yoksa karşılaştırma gösterilmez. */
    previousNet?: number | null
    /** Şu an açık adisyon sayısı (yalnız bugün; canlı sayaç). */
    liveOpenTickets?: number | null
    /** Şu an açık sipariş sayısı (yalnız bugün). */
    liveOrders?: number | null
  },
): AnaDayDigest {
  const base = emptyAnaDayDigest(opts.dayLabel, opts.isToday)
  if (!data) return base

  const summary = asMap(data.summary) ?? {}
  const ds = asMap(data.daySummary) ?? {}

  /* Panel ile aynı: kapanan = max(alınan ödeme, kapanan net); net = kapanan + açık. */
  const openAmount = Math.max(0, num(summary.openOrdersTotal))
  const closedFromSummary = summary.closedNetSales != null ? num(summary.closedNetSales) : num(summary.netSales) - openAmount
  const closed = Math.max(0, num(summary.paymentsReceived), closedFromSummary)
  const net = closed + openAmount
  const collectPct = net > 0.0005 ? Math.round((closed / net) * 1000) / 10 : null
  const guests = Math.max(0, Math.round(num(summary.guestCount)))
  const perGuest = guests > 0 ? net / guests : 0
  const expenses = Math.abs(num(summary.expenses))
  const expensePct = net > 0.0005 ? (expenses / net) * 100 : null

  const serviceRows = asList(ds.serviceTypes)
  const closedTickets = Math.round(serviceRows.reduce((sum, r) => sum + num(r.orderCount), 0))
  const openTicketsFromApi = asList(data.openAccountDetailRows).length
  const openTickets =
    opts.isToday && opts.liveOpenTickets != null && opts.liveOpenTickets > 0
      ? Math.round(opts.liveOpenTickets)
      : openTicketsFromApi

  const registers = asList(ds.cashRegisters)
  const flows = asMap(ds.accountingFlows) ?? {}
  const cashFromSales = registers.reduce((sum, r) => sum + num(r.cashIn), 0)
  const cashIn = Math.max(0, num(flows.cashCollectionIn))
  const cashOut = Math.max(0, num(flows.cashPaymentOut))
  const cashNet = cashFromSales + cashIn - cashOut
  const hasCashMovement = cashFromSales > 0.0005 || cashIn > 0.0005 || cashOut > 0.0005

  /* İptal / ikram / zayi */
  const lossRowsRaw = asMap(ds.lossRows) ?? {}
  const eventLines = asList(data.lossEventLines)
  const losses: AnaLossRow[] = LOSS_META.map((meta) => {
    const row = asMap(lossRowsRaw[meta.rowKey])
    let amount = Math.abs(num(row?.amount))
    if (amount <= 0.0005) {
      for (const key of meta.summaryKeys) {
        const v = Math.abs(num(summary[key]))
        if (v > 0.0005) {
          amount = v
          break
        }
      }
    }
    const events: AnaLossEvent[] = eventLines
      .filter((line) => text(line.kind) === meta.kind)
      .map((line, i) => {
        const qty = num(line.qty)
        const label = text(line.label) || meta.label
        const bits = [timeLabel(line.at), text(line.who), text(line.place)].filter(Boolean)
        return {
          id: `${meta.kind}-${i}`,
          title: qty > 1 ? `${formatMoneyTR(qty, Number.isInteger(qty) ? 0 : 2)} × ${label}` : label,
          amount: bossMoneyLabel(Math.abs(num(line.amount))),
          meta: bits.join(' · '),
          note: text(line.note) || null,
        }
      })
    const count = Math.max(Math.round(num(row?.count)), events.length)
    const sharePct = net > 0.0005 && amount > 0.0005 ? (amount / net) * 100 : null
    const tone: AnaDayTone =
      amount <= 0.009 ? 'neutral' : closed > 0.009 && amount > closed ? 'bad' : sharePct != null && sharePct >= 5 ? 'warn' : 'neutral'
    return { kind: meta.kind, label: meta.label, amount, amountLabel: bossMoneyLabel(amount), count, sharePct, tone, events }
  })
  const lossTotal = losses.reduce((sum, r) => sum + r.amount, 0)
  const cancelAmount = losses[0]!.amount

  /* Saatlik akış: ilk hareketten son harekete. */
  const hourlyAll: AnaHourPoint[] = asList(ds.hourly).map((h) => ({
    hour: text(h.hour).slice(0, 5),
    sales: Math.max(0, num(h.salesIn ?? h.net)),
    out: Math.abs(num(h.expenses)),
  }))
  const firstIdx = hourlyAll.findIndex((h) => h.sales > 0.0005 || h.out > 0.0005)
  let lastIdx = -1
  for (let i = hourlyAll.length - 1; i >= 0; i--) {
    if (hourlyAll[i]!.sales > 0.0005 || hourlyAll[i]!.out > 0.0005) {
      lastIdx = i
      break
    }
  }
  const hourly = firstIdx >= 0 ? hourlyAll.slice(firstIdx, lastIdx + 1) : []
  const peak = hourly.reduce<AnaHourPoint | null>(
    (best, h) => (h.sales > 0.0005 && (!best || h.sales > best.sales) ? h : best),
    null,
  )

  /* Ödeme dağılımı */
  const payments = shareRows(
    asList(data.paymentBreakdown).map((r, i) => ({
      key: `pay-${i}`,
      label: text(r.name),
      amount: num(r.amount),
    })),
    6,
  )
  const paymentsTotal = asList(data.paymentBreakdown).reduce((sum, r) => sum + Math.max(0, num(r.amount)), 0)
  const topPay = payments[0] ?? null

  const topProducts = shareRows(
    asList(data.topProducts).map((r, i) => {
      const qty = num(r.qty)
      return {
        key: `prod-${i}`,
        label: text(r.name),
        amount: num(r.amount),
        sub: qty > 0 ? `${formatMoneyTR(qty, Number.isInteger(qty) ? 0 : 2)} adet` : undefined,
      }
    }),
    5,
  )

  const expenseRows = shareRows(
    asList(data.expenseDetailsByCategory).map((r, i) => ({
      key: `exp-${i}`,
      label: text(r.label),
      amount: Math.abs(num(r.amount)),
    })),
    5,
  )

  const sellers: AnaSellerRow[] = [
    ...asList(ds.waiterSales).map((r, i) => ({
      key: `w-${i}`,
      name: text(r.label ?? r.name),
      role: 'Garson' as const,
      amount: num(r.amount),
      sub: num(r.orderCount) > 0 ? `${Math.round(num(r.orderCount))} adisyon` : null,
    })),
    ...asList(ds.cashierSales).map((r, i) => ({
      key: `c-${i}`,
      name: text(r.label ?? r.name),
      role: 'Kasiyer' as const,
      amount: num(r.amount),
      sub: 'tahsilat',
    })),
  ]
    .filter((r) => r.name && r.amount > 0.0005)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 4)
    .map((r) => ({ key: r.key, name: r.name, role: r.role, amountLabel: bossMoneyLabel(r.amount), sub: r.sub }))

  /* Mini istatistikler */
  const stats: AnaDayStat[] = [
    {
      key: 'perGuest',
      label: 'Kişi başı',
      value: perGuest > 0 ? bossMoneyLabel(perGuest) : '—',
      hint: guests > 0 ? `${formatMoneyTR(guests)} konuk` : 'Konuk girilmedi',
    },
    {
      key: 'tickets',
      label: 'Adisyon',
      value: formatMoneyTR(closedTickets + openTickets),
      hint: openTickets > 0 ? `${formatMoneyTR(openTickets)} açık · ${formatMoneyTR(closedTickets)} kapalı` : 'Hepsi kapandı',
      tone: openTickets > 0 ? 'warn' : 'neutral',
    },
    {
      key: 'expense',
      label: 'Gider',
      value: bossMoneyLabel(expenses),
      hint: expensePct != null && expenses > 0.0005 ? `Satışa oranı ${pctLabel(expensePct)}` : 'Gider kaydı yok',
      tone: expensePct != null && expensePct >= 50 ? 'warn' : 'neutral',
    },
    {
      key: 'cash',
      label: 'Nakit akışı',
      value: hasCashMovement ? `${cashNet < 0 ? '−' : ''}${bossMoneyLabel(Math.abs(cashNet))}` : '—',
      hint: hasCashMovement
        ? `+${bossMoneyLabel(cashFromSales + cashIn)} · −${bossMoneyLabel(cashOut)}`
        : 'Nakit hareketi yok',
      tone: hasCashMovement ? (cashNet < 0 ? 'bad' : 'good') : 'neutral',
    },
  ]

  /* Öne çıkanlar — panel «Günün özeti» uyarılarıyla aynı kurallar. */
  const insights: AnaDayInsight[] = []
  if (cancelAmount > closed + 0.0005 && cancelAmount > 0.009) {
    insights.push({
      key: 'anomaly',
      tone: 'bad',
      title: 'Kontrol edin',
      body: `İptaller (${bossMoneyLabel(cancelAmount)}) kapanan hesaplardan (${bossMoneyLabel(closed)}) yüksek.`,
    })
  }
  if (openAmount > 0.009) {
    insights.push({
      key: 'open',
      tone: 'warn',
      title: 'Bekleyen tahsilat',
      body: opts.isToday
        ? `Açık hesaplarda ${bossMoneyLabel(openAmount)} bekliyor. Gün sonundan önce tahsil edin.`
        : `Açık hesaplarda ${bossMoneyLabel(openAmount)} tahsil edilmeden kaldı.`,
    })
  }
  if (peak || topPay) {
    const peakBit = peak ? `En yoğun saat ${peak.hour}` : ''
    const payBit = topPay
      ? topPay.share >= 99.5
        ? `tahsilatın tamamı ${topPay.label}`
        : topPay.share >= 50
          ? `tahsilatın çoğu ${topPay.label} (${pctLabel(topPay.share)})`
          : `en çok kullanılan ödeme ${topPay.label} (${pctLabel(topPay.share)})`
      : ''
    const body = [peakBit, payBit].filter(Boolean).join(', ')
    insights.push({
      key: 'perf',
      tone: 'info',
      title: 'Performans',
      body: `${body.charAt(0).toLocaleUpperCase('tr')}${body.slice(1)}.`,
    })
  }

  const prev = opts.previousNet
  const deltaPct =
    prev != null && prev > 0.0005 ? Math.round(((net - prev) / prev) * 1000) / 10 : null

  return {
    dayLabel: opts.dayLabel,
    isToday: opts.isToday,
    hasActivity: net > 0.0005 || expenses > 0.0005 || lossTotal > 0.0005 || hasCashMovement,
    net,
    netLabel: bossMoneyLabel(net),
    deltaPct,
    closedLabel: bossMoneyLabel(closed),
    openLabel: bossMoneyLabel(openAmount),
    openAmount,
    collectPct,
    liveOrders: opts.isToday && opts.liveOrders != null ? Math.max(0, Math.round(opts.liveOrders)) : null,
    stats,
    insights,
    hourly,
    peakHour: peak?.hour ?? null,
    peakLabel: peak ? bossMoneyLabel(peak.sales) : null,
    losses,
    lossTotalLabel: bossMoneyLabel(lossTotal),
    payments,
    paymentsTotalLabel: bossMoneyLabel(paymentsTotal),
    topProducts,
    expenses: expenseRows,
    expenseTotalLabel: bossMoneyLabel(expenses),
    sellers,
  }
}
