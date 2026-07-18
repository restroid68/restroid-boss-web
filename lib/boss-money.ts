/**
 * Tutar parse / format — panel CurrencyInput ile aynı fikir:
 * yazarken ham metin, blur/kayıtta sayı.
 */

/** "₺1.611,16" / "1611.16" / 1611 → number */
export function parseMoneyTR(v: unknown): number {
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0
  if (v == null) return 0
  let s = String(v).trim()
  if (!s) return 0
  s = s.replace(/[^\d.,\-]/g, '')
  if (!s || s === '-' || s === '.' || s === ',') return 0
  const neg = s.startsWith('-')
  s = s.replace(/-/g, '')
  if (s.includes(',') && s.includes('.')) {
    // 1.234,56
    s = s.replace(/\./g, '').replace(',', '.')
  } else if (s.includes(',')) {
    s = s.replace(',', '.')
  }
  const n = Number(s)
  if (!Number.isFinite(n)) return 0
  return neg ? -n : n
}

/** Gösterim — tam sayı veya 2 ondalık (gerektiğinde) */
export function formatMoneyTR(n: number, fractionDigits = 0): string {
  const safe = Number.isFinite(n) ? n : 0
  return new Intl.NumberFormat('tr-TR', {
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: fractionDigits,
  }).format(fractionDigits > 0 ? Math.round(safe * 100) / 100 : Math.round(safe))
}

/** Input yazımı: yalnızca rakam + en fazla bir ayırıcı, max 2 ondalık */
export function sanitizeMoneyTyping(raw: string): string {
  let s = raw.replace(/[^\d.,]/g, '')
  const comma = s.indexOf(',')
  const dot = s.indexOf('.')
  let sep = -1
  if (comma >= 0 && dot >= 0) sep = Math.min(comma, dot)
  else if (comma >= 0) sep = comma
  else if (dot >= 0) sep = dot
  if (sep >= 0) {
    const intPart = s.slice(0, sep).replace(/[.,]/g, '')
    let frac = s.slice(sep + 1).replace(/[.,]/g, '').slice(0, 2)
    s = frac.length ? `${intPart},${frac}` : `${intPart},`
  } else {
    s = s.replace(/[.,]/g, '')
  }
  return s
}

/** Yazım metnini binlik ayraçlı gösterim (sağdan) */
export function formatMoneyTypingDisplay(raw: string): string {
  if (!raw) return ''
  const [intRaw, frac] = raw.split(',')
  const digits = (intRaw ?? '').replace(/\D/g, '')
  if (!digits && frac == null) return ''
  const intFmt = digits
    ? Number(digits).toLocaleString('tr-TR', { maximumFractionDigits: 0 })
    : '0'
  if (raw.includes(',')) return `${intFmt},${frac ?? ''}`
  return intFmt
}
