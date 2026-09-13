import { formatMoneyTR, parseMoneyTR } from '@/lib/boss-money'
import type { AlertRow, AuditAlert, AlertFilter } from '@/lib/boss-mock'

export type BossNotificationApiRow = {
  id?: string
  eventType?: string
  title?: string
  summary?: string
  actorName?: string | null
  tableNumber?: string | null
  createdAt?: string
  readAt?: string | null
  detailJson?: {
    lines?: Array<{ productName?: string; quantity?: number; amount?: number | null }>
    amount?: number | null
    action?: string
    partyName?: string | null
    [key: string]: unknown
  }
}

export const DENETIM_FILTERS: AlertFilter[] = [
  'Tümü',
  'İptal',
  'Zayi',
  'İkram',
  'Masa',
  'Ödeme',
  'Z Rapor',
  'İndirim',
  'Gider',
  'Kasa',
  'Müşteri',
  'Tedarikçi',
  'Personel',
]

export function formatBossEventTime(iso: unknown): string {
  const s = String(iso ?? '').trim()
  if (!s) return '--:--'
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) {
    return s.includes('T') ? s.slice(11, 16) : s.slice(0, 5) || '--:--'
  }
  const now = new Date()
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  if (sameDay) {
    return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
  }
  return d.toLocaleString('tr-TR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function eventCategory(eventType: string): AlertFilter {
  switch (eventType) {
    case 'cancel':
      return 'İptal'
    case 'waste':
      return 'Zayi'
    case 'complimentary':
      return 'İkram'
    case 'table_merge':
    case 'table_move':
    case 'table_split':
      return 'Masa'
    case 'payment':
    case 'payment_cancel':
      return 'Ödeme'
    case 'z_report':
      return 'Z Rapor'
    case 'discount':
      return 'İndirim'
    case 'expense':
      return 'Gider'
    case 'cash_book':
      return 'Kasa'
    case 'customer':
      return 'Müşteri'
    case 'supplier':
      return 'Tedarikçi'
    case 'personnel':
      return 'Personel'
    default:
      return 'Tümü'
  }
}

function eventSeverity(eventType: string, action?: string): AuditAlert['severity'] {
  if (
    eventType === 'cancel' ||
    eventType === 'waste' ||
    eventType === 'payment_cancel' ||
    eventType === 'z_report'
  ) {
    return 'kritik'
  }
  if (
    eventType === 'expense' ||
    eventType === 'cash_book' ||
    eventType === 'customer' ||
    eventType === 'supplier' ||
    eventType === 'personnel'
  ) {
    return action === 'delete' || action === 'update' ? 'kritik' : 'uyari'
  }
  return 'uyari'
}

function notificationAmount(row: BossNotificationApiRow): string {
  const detail = row.detailJson
  const direct = parseMoneyTR(detail?.amount)
  if (direct > 0) return `₺${formatMoneyTR(direct, direct % 1 === 0 ? 0 : 2)}`
  const lines = Array.isArray(detail?.lines) ? detail!.lines! : []
  const sum = lines.reduce((a, l) => a + parseMoneyTR(l?.amount), 0)
  if (sum > 0) return `₺${formatMoneyTR(sum, sum % 1 === 0 ? 0 : 2)}`
  return '—'
}

function pickProductName(o: Record<string, unknown>): string {
  for (const k of ['nameTr', 'name', 'product_name', 'productName', 'aciklama']) {
    const s = String(o[k] ?? '').trim()
    if (s) return s
  }
  return ''
}

const UID_RE = /\buid=\d+\b/i
const TITLE_ONLY_RE =
  /^(İptal|İkram|Zayi|Hesap ayırma|Masa taşıma|Masalar birleştirildi|Masa birleştirme|İndirim|Ödeme|Ödeme iptal)\s*:?\s*$/i
const MASA_ARROW_RE = /Masa\s+(\d+)\s*(?:→|->)\s*(\d+)/i

export function displayBossNotificationSummary(raw: BossNotificationApiRow): string {
  const eventType = String(raw.eventType ?? '').trim()
  const summary = String(raw.summary ?? '').trim()
  const actor = String(raw.actorName ?? '').trim() || 'Personel'
  const table = String(raw.tableNumber ?? '').trim()
  const detail = (raw.detailJson ?? {}) as Record<string, unknown>
  const before =
    detail.before && typeof detail.before === 'object' && !Array.isArray(detail.before)
      ? (detail.before as Record<string, unknown>)
      : null
  const debug =
    !summary ||
    UID_RE.test(summary) ||
    TITLE_ONLY_RE.test(summary) ||
    (() => {
      const after = summary.includes(':') ? summary.slice(summary.indexOf(':') + 1).trim() : ''
      return Boolean(after && (UID_RE.test(after) || TITLE_ONLY_RE.test(after)))
    })()
  const rewriteMove =
    eventType === 'table_move' && MASA_ARROW_RE.test(summary) && !summary.includes('numaralı masayı')
  const rewriteSplit =
    eventType === 'table_split' && /Hesap ayırma/i.test(summary) && !summary.includes('hesabı ayırdı')
  if (!debug && !rewriteMove && !rewriteSplit) return summary

  const arrow = MASA_ARROW_RE.exec(summary)
  if (eventType === 'table_move') {
    const from = String(detail.fromTableNo ?? arrow?.[1] ?? '').trim()
    const to = String(detail.toTableNo ?? arrow?.[2] ?? table).trim()
    if (from && to) return `${actor} ${from} numaralı masayı ${to} numaralı masaya taşıdı`
    if (to) return `${actor} hesabı ${to} numaralı masaya taşıdı`
  }
  if (eventType === 'table_split') {
    return table ? `${actor} ${table} numaralı masada hesabı ayırdı` : `${actor} hesabı ayırdı`
  }
  const name = (before ? pickProductName(before) : '') || pickProductName(detail)
  const qtyRaw = Number(detail.amount ?? before?.amount ?? before?.quantity ?? 0)
  const qty = Number.isFinite(qtyRaw) && qtyRaw > 0 ? qtyRaw : 1
  if (eventType === 'complimentary') {
    if (name && table) return `${actor} ${table} numaralı masada ${qty} adet ${name} ikram etti`
    if (name) return `${actor} ${qty} adet ${name} ikram etti`
    return table ? `${actor} ${table} numaralı masada ikram yaptı` : `${actor} ikram yaptı`
  }
  if (eventType === 'cancel' || eventType === 'waste') {
    const verb = eventType === 'waste' ? 'zayi etti' : 'iptal etti'
    const short = eventType === 'waste' ? 'zayi yaptı' : 'iptal yaptı'
    if (name && table) return `${actor} ${table} numaralı masadan ${qty} adet ${name} ${verb}`
    if (name) return `${actor} ${qty} adet ${name} ${verb}`
    return table ? `${actor} ${table} numaralı masada ${short}` : `${actor} ${short}`
  }
  return summary.replace(UID_RE, '').replace(/\s{2,}/g, ' ').trim()
}

export function mapNotificationToAuditAlert(
  raw: BossNotificationApiRow,
  index: number,
): AuditAlert {
  const eventType = String(raw.eventType ?? '').trim()
  const table = String(raw.tableNumber ?? '').trim()
  const title = String(raw.title ?? '').trim() || 'Hareket'
  const summary = displayBossNotificationSummary(raw)
  const party = String(raw.detailJson?.partyName ?? '').trim()
  const action = String(raw.detailJson?.action ?? '').trim()
  return {
    id: String(raw.id ?? `n-${index}`),
    severity: eventSeverity(eventType, action),
    category: eventCategory(eventType),
    title,
    who: String(raw.actorName ?? '').trim() || 'Personel',
    target: table ? `Masa ${table}` : party || summary || '—',
    amount: notificationAmount(raw),
    time: formatBossEventTime(raw.createdAt),
    unread: !raw.readAt,
    summary,
  }
}

export function mapNotificationToAlertRow(raw: BossNotificationApiRow, index: number): AlertRow {
  const mapped = mapNotificationToAuditAlert(raw, index)
  return {
    id: mapped.id,
    type: mapped.severity === 'kritik' ? 'kritik' : 'uyari',
    message: mapped.title,
    detail: [mapped.who, mapped.target, mapped.amount !== '—' ? mapped.amount : '']
      .filter(Boolean)
      .join(' · '),
    time: mapped.time,
  }
}
