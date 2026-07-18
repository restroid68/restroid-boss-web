import { readNativeSession } from '@/lib/boss-bridge'
import {
  BOSS_ENTITY_LABELS_TR,
  BOSS_PAGE_LABELS_EN,
  BOSS_PAGE_LABELS_TR,
} from '@/lib/boss-op-log-label-data'

export type BossUiLocale = 'tr' | 'en'

const ACTION_TR: Record<string, string> = {
  create: 'Oluşturma',
  update: 'Güncelleme',
  delete: 'Silme',
  login: 'Giriş',
  logout: 'Çıkış',
  view: 'Görüntüleme',
  export: 'Dışa aktarma',
  undo: 'Geri alma',
  other: 'Diğer',
}

const ACTION_EN: Record<string, string> = {
  create: 'Create',
  update: 'Update',
  delete: 'Delete',
  login: 'Login',
  logout: 'Logout',
  view: 'View',
  export: 'Export',
  undo: 'Undo',
  other: 'Other',
}

/** Entity EN — kısa; TR map’te yoksa Title Case yerine okunur İngilizce. */
const ENTITY_EN: Record<string, string> = {
  accounting_transaction: 'Accounting entry',
  finance_account: 'Finance account',
  supplier: 'Supplier',
  customer: 'Customer',
  inventory_count: 'Inventory count',
  saas_platform_product: 'Platform product',
  sales_pos_personnel_unlock: 'POS personnel unlock',
  marketplace_integration: 'Marketplace integration',
  system_error_log_clear_all: 'Clear system error logs',
  super_admin_issued_license: 'Issued license',
  license: 'License',
  product: 'Product',
  online_order: 'Online order',
}

/** Ek teknik anahtarlar (Title Case / özel entityType değerleri). */
const EXTRA_ENTITY_TR: Record<string, string> = {
  marketplace_integration: 'Pazaryeri entegrasyonu',
  system_error_log_clear_all: 'Sistem hata loglarını temizleme',
  system_error_logs: 'Sistem hata logları',
  sales_pos_personnel_unlock: 'Satış paneli personel PIN girişi',
  saas_platform_product: 'Kontrol CRM ürünü',
  super_admin_issued_license: 'Lisans',
  license: 'Lisans',
  product: 'Ürün',
  product_catalog: 'Ürün kataloğu',
  online_order: 'Online sipariş',
  qr_menu_order: 'QR sipariş',
  branch: 'Şube',
  stock: 'Stok',
  settings: 'Ayarlar',
}

export function resolveBossUiLocale(explicit?: string | null): BossUiLocale {
  const fromSession = readNativeSession()?.locale?.trim().toLowerCase()
  const raw = (explicit || fromSession || '').trim().toLowerCase()
  if (raw.startsWith('en')) return 'en'
  if (raw.startsWith('tr')) return 'tr'
  if (typeof navigator !== 'undefined') {
    const nav = (navigator.language || '').toLowerCase()
    if (nav.startsWith('en')) return 'en'
  }
  return 'tr'
}

/** "Marketplace Integration" / "sales_pos_personnel_unlock" → snake_case key */
export function normalizeOpLogKey(raw: string): string {
  return raw
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[\s\-./]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .toLowerCase()
}

function lookup(
  map: Record<string, string>,
  key: string,
): string | undefined {
  if (!key) return undefined
  if (map[key]) return map[key]
  // son segment: foo_bar_baz → baz dene
  const parts = key.split('_')
  for (let n = parts.length; n >= 2; n--) {
    const sub = parts.slice(-n).join('_')
    if (map[sub]) return map[sub]
  }
  return undefined
}

export function labelOpAction(raw: string, locale?: BossUiLocale): string {
  const loc = locale ?? resolveBossUiLocale()
  const key = normalizeOpLogKey(raw)
  const map = loc === 'en' ? ACTION_EN : ACTION_TR
  return map[key] ?? (loc === 'en' ? 'Action' : 'İşlem')
}

export function labelOpEntity(raw: string, locale?: BossUiLocale): string {
  const loc = locale ?? resolveBossUiLocale()
  const key = normalizeOpLogKey(raw)
  if (!key) return ''
  if (loc === 'en') {
    return (
      lookup(ENTITY_EN, key) ||
      lookup(BOSS_PAGE_LABELS_EN, key) ||
      key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    )
  }
  return (
    lookup(EXTRA_ENTITY_TR, key) ||
    lookup(BOSS_ENTITY_LABELS_TR, key) ||
    lookup(BOSS_PAGE_LABELS_TR, key) ||
    // Bilinmeyen teknik anahtarı İngilizce Title Case bırakma
    'Kayıt'
  )
}

export function labelOpPage(raw: string, locale?: BossUiLocale): string {
  const loc = locale ?? resolveBossUiLocale()
  const key = normalizeOpLogKey(raw)
  if (!key) return ''
  if (loc === 'en') {
    return lookup(BOSS_PAGE_LABELS_EN, key) || labelOpEntity(raw, 'en')
  }
  return lookup(BOSS_PAGE_LABELS_TR, key) || labelOpEntity(raw, 'tr')
}
