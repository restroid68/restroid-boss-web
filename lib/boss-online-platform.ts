/** Panel `online-platform-brand` ile aynı kodlar — Boss’ta yerel rozet. */

export type BossOnlinePlatformCode =
  | 'restroid_app'
  | 'restroid_web'
  | 'getir'
  | 'yemeksepeti'
  | 'trendyol'
  | 'migros'
  | 'manual'
  | 'qr_menu'
  | 'whatsapp'

const PLATFORM_LABEL: Record<string, string> = {
  restroid_app: 'Restroid App',
  restroid_web: 'Restroid Web',
  getir: 'Getir',
  yemeksepeti: 'Yemek Sepeti',
  trendyol: 'Trendyol',
  migros: 'Migros Yemek',
  manual: 'Manuel',
  qr_menu: 'QR Menü',
  whatsapp: 'WhatsApp',
}

const PLATFORM_LOGO: Record<string, string> = {
  restroid_app: '/boss-assets/online-platforms/restroid-app.png',
  restroid_web: '/boss-assets/online-platforms/restroid-app.png',
  getir: '/boss-assets/online-platforms/getir.png',
  yemeksepeti: '/boss-assets/online-platforms/yemeksepeti.png',
  trendyol: '/boss-assets/online-platforms/trendyol.png',
  migros: '/boss-assets/online-platforms/migros.png',
  qr_menu: '/boss-assets/online-platforms/qr-menu.svg',
  whatsapp: '/boss-assets/online-platforms/whatsapp.svg',
}

/** Panel liste kartı durumları (received → Yeni). */
const STATUS_LABEL: Record<string, string> = {
  received: 'Yeni',
  pending: 'Beklemede',
  new: 'Yeni',
  accepted: 'Onaylandı',
  confirmed: 'Onaylandı',
  preparing: 'Hazırlanıyor',
  preparation: 'Hazırlanıyor',
  in_preparation: 'Hazırlanıyor',
  ready: 'Hazır',
  dispatched: 'Yola çıktı',
  out_for_delivery: 'Yola çıktı',
  delivering: 'Yola çıktı',
  on_the_way: 'Yola çıktı',
  delivered: 'Teslim edildi',
  completed: 'Tamamlandı',
  done: 'Tamamlandı',
  cancelled: 'İptal',
  canceled: 'İptal',
  rejected: 'Reddedildi',
  failed: 'Başarısız',
  refunded: 'İade',
  scheduled: 'Zamanlanmış',
  picked_up: 'Teslim alındı',
  pickup: 'Gel al',
}

export type BossOrderStatusTone = 'new' | 'prep' | 'ready' | 'ship' | 'done' | 'cancel' | 'muted'

export function normalizeBossPlatformCode(raw: unknown): string {
  const s = String(raw ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_')
  if (!s) return 'manual'
  if (s === 'ys' || s === 'yemek_sepeti' || s === 'yemeksepeti') return 'yemeksepeti'
  if (s === 'ty' || s === 'trendyol_go' || s === 'uber_eats' || s === 'ubereats') return 'trendyol'
  if (s === 'getir_yemek' || s === 'getiryemek') return 'getir'
  if (s === 'migros_yemek' || s === 'migrosyemek') return 'migros'
  if (s === 'qrmenu' || s === 'qr') return 'qr_menu'
  if (s === 'restroid' || s === 'app') return 'restroid_app'
  return s
}

export function bossPlatformLabel(code: string): string {
  return PLATFORM_LABEL[code] ?? (code ? code.replace(/_/g, ' ') : 'Online')
}

export function bossPlatformLogoSrc(code: string): string | null {
  return PLATFORM_LOGO[code] ?? null
}

export function bossOrderStatusKey(raw: unknown): string {
  const s = String(raw ?? '')
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .toLowerCase()
  return s
}

export function bossOrderStatusLabel(raw: unknown): string {
  const s = String(raw ?? '').trim()
  if (!s || s === '—') return '—'
  if (/[çğıöşüÇĞİÖŞÜ ]/.test(s) && !/^[a-zA-Z0-9_-]+$/.test(s)) return s
  const key = bossOrderStatusKey(s)
  return STATUS_LABEL[key] ?? 'Durum'
}

export function bossOrderStatusTone(raw: unknown): BossOrderStatusTone {
  const key = bossOrderStatusKey(raw)
  if (key === 'received' || key === 'new' || key === 'pending') return 'new'
  if (key === 'preparing' || key === 'preparation' || key === 'in_preparation') return 'prep'
  if (key === 'ready') return 'ready'
  if (key === 'dispatched' || key === 'out_for_delivery' || key === 'delivering' || key === 'on_the_way') {
    return 'ship'
  }
  if (key === 'delivered' || key === 'completed' || key === 'done' || key === 'picked_up') return 'done'
  if (key === 'cancelled' || key === 'canceled' || key === 'rejected' || key === 'failed') return 'cancel'
  return 'muted'
}

export function isOpenBossOrderStatus(raw: unknown): boolean {
  const tone = bossOrderStatusTone(raw)
  return tone !== 'done' && tone !== 'cancel'
}
