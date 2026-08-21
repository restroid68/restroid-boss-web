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
    default:
      return 'Tümü'
  }
}

function eventSeverity(eventType: string): AuditAlert['severity'] {
  if (
    eventType === 'cancel' ||
    eventType === 'waste' ||
    eventType === 'payment_cancel' ||
    eventType === 'z_report'
  ) {
    return 'kritik'
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

export function mapNotificationToAuditAlert(
  raw: BossNotificationApiRow,
  index: number,
): AuditAlert {
  const eventType = String(raw.eventType ?? '').trim()
  const table = String(raw.tableNumber ?? '').trim()
  const title = String(raw.title ?? '').trim() || 'Hareket'
  const summary = String(raw.summary ?? '').trim()
  return {
    id: String(raw.id ?? `n-${index}`),
    severity: eventSeverity(eventType),
    category: eventCategory(eventType),
    title,
    who: String(raw.actorName ?? '').trim() || 'Personel',
    target: table ? `Masa ${table}` : summary || '—',
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
