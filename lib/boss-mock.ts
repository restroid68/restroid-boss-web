// ── RestroidBOSS Mock Data & Types ──────────────────────────────────────────

// ── Shared ──────────────────────────────────────────────────────────────────

export interface Branch {
  id: string
  name: string
}

export const BRANCHES: Branch[] = [
  { id: 'b1', name: 'Merkez' },
  { id: 'b2', name: 'Bağcılar' },
  { id: 'b3', name: 'Kadıköy' },
]

// ── Ana Sayfa (/boss-m/ana) ──────────────────────────────────────────────────

export interface KpiMetric {
  label: string
  value: string
  delta: number   // % change vs yesterday (positive = up)
  unit?: string
}

export const ANA_KPIS: KpiMetric[] = [
  { label: 'Günlük Ciro',  value: '24.860', delta: +8.2,  unit: '₺' },
  { label: 'Ödenen',       value: '19.340', delta: +5.7,  unit: '₺' },
  { label: 'Açık',         value: '5.520',  delta: -2.1,  unit: '₺' },
  { label: 'Konuk',        value: '187',    delta: +12.4, unit: '' },
]

export interface ChannelCard {
  key: string
  label: string
  value: string
  variant: 'neutral' | 'success' | 'warning' | 'danger'
}

export const CHANNEL_CARDS: ChannelCard[] = [
  { key: 'masa',    label: 'Açık Masalar', value: '12',       variant: 'success'  },
  { key: 'online',  label: 'Online',        value: '₺4.120',  variant: 'neutral'  },
  { key: 'paket',   label: 'Paket',         value: '₺2.840',  variant: 'neutral'  },
  { key: 'gelal',   label: 'Gel-al',        value: '₺1.650',  variant: 'neutral'  },
  { key: 'self',    label: 'Self',          value: '₺890',    variant: 'neutral'  },
  { key: 'iptal',   label: 'İptal',         value: '₺620',    variant: 'danger'   },
  { key: 'zayi',    label: 'Zayi',          value: '₺145',    variant: 'warning'  },
  { key: 'indirim', label: 'İndirim',       value: '₺310',    variant: 'warning'  },
]

export interface AlertRow {
  id: string
  type: 'kritik' | 'uyari'
  message: string
  detail: string
  time: string
}

export const DIKKAT_ALERTS: AlertRow[] = [
  { id: 'a1', type: 'kritik', message: 'Ödemesiz kapanış',  detail: 'Masa 7 — Ali K.',         time: '14:22' },
  { id: 'a2', type: 'kritik', message: 'Kritik iptal',      detail: '₺480 — Masa 3 — Zeynep T.', time: '13:55' },
  { id: 'a3', type: 'uyari',  message: 'Zayi kaydı',        detail: '₺145 — Depo — Can Y.',     time: '12:40' },
]

// ── Finans (/boss-m/finans) ──────────────────────────────────────────────────

export interface PaymentSlice {
  label: string
  value: number   // percentage
  amount: string
  color: string
}

export const PAYMENT_MIX: PaymentSlice[] = [
  { label: 'Kredi Kartı',  value: 52, amount: '₺12.927', color: '#10b981' },
  { label: 'Nakit',        value: 23, amount: '₺5.718',  color: '#38bdf8' },
  { label: 'Yemek Kartı',  value: 18, amount: '₺4.475',  color: '#f59e0b' },
  { label: 'Online',       value:  7, amount: '₺1.740',  color: '#f43f5e' },
]

export interface QuickTile {
  label: string
  value: string
  sub?: string
  variant: 'neutral' | 'success' | 'warning' | 'danger'
}

export const FINANS_TILES: QuickTile[] = [
  { label: 'Açık Hesaplar', value: '₺5.520',  sub: '6 masa', variant: 'warning' },
  { label: 'Giderler',      value: '₺2.140',  sub: 'bugün',  variant: 'danger'  },
  { label: 'Tahsilatlar',   value: '₺19.340', sub: 'bugün',  variant: 'success' },
  { label: 'Ödemeler',      value: '₺1.870',  sub: 'bekleyen',variant: 'neutral'},
]

export interface Movement {
  id: string
  icon: string
  title: string
  sub: string
  time: string
  amount: string   // signed: "+₺..." or "-₺..."
  sign: 'positive' | 'negative'
}

export const RECENT_MOVEMENTS: Movement[] = [
  { id: 'm1', icon: 'card',     title: 'Masa 4 kapandı',       sub: 'Kredi kartı',    time: '15:30', amount: '+₺340',   sign: 'positive' },
  { id: 'm2', icon: 'cash',     title: 'Masa 11 kapandı',      sub: 'Nakit',          time: '15:12', amount: '+₺210',   sign: 'positive' },
  { id: 'm3', icon: 'expense',  title: 'Market alışverişi',    sub: 'Gider',          time: '14:50', amount: '-₺430',   sign: 'negative' },
  { id: 'm4', icon: 'online',   title: 'Yemeksepeti siparişi', sub: 'Online',         time: '14:38', amount: '+₺185',   sign: 'positive' },
  { id: 'm5', icon: 'cancel',   title: 'İptal — Masa 3',       sub: 'Zeynep T.',      time: '13:55', amount: '-₺480',   sign: 'negative' },
  { id: 'm6', icon: 'card',     title: 'Masa 8 kapandı',       sub: 'Yemek kartı',    time: '13:40', amount: '+₺520',   sign: 'positive' },
]

// ── Kasa (/boss-m/kasa) ──────────────────────────────────────────────────────

export interface Account {
  id: string
  name: string
  type: 'cash' | 'bank' | 'pos'
  balance: string
  currency: string
}

export const ACCOUNTS: Account[] = [
  { id: 'acc1', name: 'Merkez Kasa',       type: 'cash', balance: '8.420',  currency: '₺' },
  { id: 'acc2', name: 'İş Bankası — Vaad', type: 'bank', balance: '42.750', currency: '₺' },
  { id: 'acc3', name: 'POS Cihazı',        type: 'pos',  balance: '12.927', currency: '₺' },
]

export interface LedgerEntry {
  id: string
  datetime: string
  description: string
  amount: string
  sign: 'positive' | 'negative'
  category: string
}

export const LEDGER_ENTRIES: LedgerEntry[] = [
  { id: 'l1', datetime: '18 Tem 15:30', description: 'Masa 4 tahsilat',      amount: '+₺340',   sign: 'positive', category: 'Tahsilat' },
  { id: 'l2', datetime: '18 Tem 15:12', description: 'Masa 11 tahsilat',     amount: '+₺210',   sign: 'positive', category: 'Tahsilat' },
  { id: 'l3', datetime: '18 Tem 14:50', description: 'Market alışverişi',    amount: '-₺430',   sign: 'negative', category: 'Gider' },
  { id: 'l4', datetime: '18 Tem 14:38', description: 'Yemeksepeti geliri',   amount: '+₺185',   sign: 'positive', category: 'Online' },
  { id: 'l5', datetime: '18 Tem 13:30', description: 'Personel avans',       amount: '-₺500',   sign: 'negative', category: 'Gider' },
  { id: 'l6', datetime: '18 Tem 12:00', description: 'Açılış bakiyesi',      amount: '+₺7.615', sign: 'positive', category: 'Bakiye' },
]

// ── Denetim (/boss-m/denetim) ────────────────────────────────────────────────

export type AlertSeverity = 'kritik' | 'uyari'
export type AlertFilter   = 'Tümü' | 'İptal' | 'Silme' | 'Ödemesiz'

export interface AuditAlert {
  id: string
  severity: AlertSeverity
  title: string
  who: string
  target: string   // table or order ref
  amount: string
  time: string
  category: AlertFilter
}

export const AUDIT_ALERTS: AuditAlert[] = [
  { id: 'd1', severity: 'kritik', title: 'Ödemesiz kapanış',   who: 'Ali K.',    target: 'Masa 7',        amount: '₺560',  time: '14:22', category: 'Ödemesiz' },
  { id: 'd2', severity: 'kritik', title: 'Kritik sipariş iptali', who: 'Zeynep T.', target: 'Masa 3 / #4821', amount: '₺480', time: '13:55', category: 'İptal' },
  { id: 'd3', severity: 'uyari',  title: 'Ürün silme',          who: 'Can Y.',    target: '#4810',         amount: '₺145',  time: '12:40', category: 'Silme' },
  { id: 'd4', severity: 'uyari',  title: 'Fiyat değişikliği',   who: 'Selin A.',  target: 'Masa 9 / #4805',amount: '₺90',   time: '11:15', category: 'İptal' },
  { id: 'd5', severity: 'kritik', title: 'Ödemesiz kapanış',   who: 'Mert D.',   target: 'Masa 2',        amount: '₺320',  time: '10:05', category: 'Ödemesiz' },
  { id: 'd6', severity: 'uyari',  title: 'Sipariş silme',       who: 'Ayşe K.',   target: '#4799',         amount: '₺220',  time: '09:48', category: 'Silme' },
]

// ── Kasa / Hareket Form (/boss-m/kasa/hareket) ──────────────────────────────

export type HareketType = 'giris' | 'cikis' | 'gider' | 'transfer'

export interface HareketForm {
  type: HareketType
  accountId: string
  amount: string
  note: string
  targetAccountId?: string
}

export const HAREKET_TYPES: { key: HareketType; label: string; description: string }[] = [
  { key: 'giris',    label: 'Giriş',    description: 'Kasaya para girişi' },
  { key: 'cikis',    label: 'Çıkış',    description: 'Kasadan para çıkışı' },
  { key: 'gider',    label: 'Gider',    description: 'İşletme gideri kaydı' },
  { key: 'transfer', label: 'Transfer', description: 'Hesaplar arası transfer' },
]

// ── Sistem (/boss-m/sistem) ──────────────────────────────────────────────────

export interface SistemCard {
  id: string
  title: string
  description: string
  href: string
  icon: string
  badge?: string
}

export const SISTEM_CARDS: SistemCard[] = [
  {
    id: 'gorunum',
    title: 'Görünüm',
    description: 'Yazı boyutu: küçük, normal veya büyük',
    href: '/boss-m/sistem/gorunum',
    icon: 'type',
  },
  {
    id: 'tema',
    title: 'Tema rengi',
    description: 'Kart ve vurgu renklerini seç',
    href: '/boss-m/sistem/tema',
    icon: 'palette',
  },
  {
    id: 'kanallar',
    title: 'Servis Kanalları',
    description: 'Dine-in, paket, gel-al, self, online ve QR kanallarını yönet',
    href: '/boss-m/sistem/kanallar',
    icon: 'signal',
    badge: '6 aktif',
  },
  {
    id: 'odeme',
    title: 'Ödeme Türleri',
    description: 'Kabul edilen ödeme yöntemlerini yapılandır',
    href: '/boss-m/sistem/odeme',
    icon: 'credit-card',
    badge: '5 aktif',
  },
  {
    id: 'salon',
    title: 'Salon / Masa Özeti',
    description: 'Salon düzeni, masa kapasitesi ve bölüm ayarları',
    href: '/boss-m/sistem/salon',
    icon: 'layout',
    badge: '32 masa',
  },
  {
    id: 'uretim',
    title: 'Üretim Yerleri',
    description: 'Mutfak, bar ve diğer üretim noktaları',
    href: '/boss-m/sistem/uretim',
    icon: 'flame',
    badge: '3 birim',
  },
  {
    id: 'uzaktan',
    title: 'Uzaktan Kontrol',
    description: 'Açılış/kapanış, menü durdurma ve acil kilitler',
    href: '/boss-m/sistem/uzaktan',
    icon: 'remote',
  },
]

// ── Servis Kanalları (/boss-m/sistem/kanallar) ────────────────────────────────

export interface ServiceChannel {
  id: string
  label: string
  description: string
  enabled: boolean
}

export const SERVICE_CHANNELS: ServiceChannel[] = [
  { id: 'dinein',  label: 'Dine-in',  description: 'Restoran içi masa servisi',         enabled: true  },
  { id: 'paket',   label: 'Paket',    description: 'Kapıda teslimat siparişleri',        enabled: true  },
  { id: 'gelal',   label: 'Gel-al',   description: 'Müşterinin kendi teslim alması',     enabled: true  },
  { id: 'self',    label: 'Self',     description: 'Self-servis kiosk siparişleri',      enabled: false },
  { id: 'online',  label: 'Online',   description: 'Web ve uygulama üzerinden siparişler', enabled: true },
  { id: 'qr',      label: 'QR',       description: 'Masa QR kodu ile sipariş',           enabled: true  },
]

// ── Ürünler (/boss-m/urunler) ─────────────────────────────────────────────────

export type StockStatus = 'normal' | 'dusuk' | 'tukendi'

export interface Product {
  id: string
  name: string
  category: string
  sku: string
  stock: number
  unit: string
  minStock: number
  status: StockStatus
  price: string
}

export const PRODUCT_CATEGORIES = ['Tümü', 'Ana Yemek', 'Salata', 'İçecek', 'Tatlı', 'Yan Ürün']

export const PRODUCTS: Product[] = [
  { id: 'p01', name: 'Izgara Köfte',      category: 'Ana Yemek', sku: 'UM-001', stock: 48,  unit: 'adet', minStock: 10, status: 'normal',  price: '₺70' },
  { id: 'p02', name: 'Adana Kebap',       category: 'Ana Yemek', sku: 'UM-002', stock: 32,  unit: 'adet', minStock: 10, status: 'normal',  price: '₺85' },
  { id: 'p03', name: 'Tavuk Şiş',         category: 'Ana Yemek', sku: 'UM-003', stock: 7,   unit: 'adet', minStock: 10, status: 'dusuk',   price: '₺60' },
  { id: 'p04', name: 'Lahmacun',          category: 'Ana Yemek', sku: 'UM-004', stock: 0,   unit: 'adet', minStock: 5,  status: 'tukendi', price: '₺35' },
  { id: 'p05', name: 'Çoban Salata',      category: 'Salata',    sku: 'SL-001', stock: 65,  unit: 'adet', minStock: 15, status: 'normal',  price: '₺30' },
  { id: 'p06', name: 'Mevsim Salata',     category: 'Salata',    sku: 'SL-002', stock: 4,   unit: 'adet', minStock: 10, status: 'dusuk',   price: '₺28' },
  { id: 'p07', name: 'Ayran',             category: 'İçecek',    sku: 'IC-001', stock: 120, unit: 'adet', minStock: 30, status: 'normal',  price: '₺10' },
  { id: 'p08', name: 'Kola (0.33)',       category: 'İçecek',    sku: 'IC-002', stock: 84,  unit: 'adet', minStock: 24, status: 'normal',  price: '₺18' },
  { id: 'p09', name: 'Su (0.5L)',         category: 'İçecek',    sku: 'IC-003', stock: 9,   unit: 'adet', minStock: 24, status: 'dusuk',   price: '₺8'  },
  { id: 'p10', name: 'Künefe',            category: 'Tatlı',     sku: 'TT-001', stock: 22,  unit: 'adet', minStock: 6,  status: 'normal',  price: '₺55' },
  { id: 'p11', name: 'Sütlaç',            category: 'Tatlı',     sku: 'TT-002', stock: 0,   unit: 'adet', minStock: 5,  status: 'tukendi', price: '₺40' },
  { id: 'p12', name: 'Pilav (Porsiyon)',  category: 'Yan Ürün',  sku: 'YP-001', stock: 55,  unit: 'adet', minStock: 20, status: 'normal',  price: '₺15' },
  { id: 'p13', name: 'Lavaş',             category: 'Yan Ürün',  sku: 'YP-002', stock: 3,   unit: 'adet', minStock: 20, status: 'dusuk',   price: '₺5'  },
]

// ── Stok (/boss-m/stok and sub-routes) ───────────────────────────────────────

export type StokItemStatus = 'normal' | 'kritik' | 'tukendi'

export interface StokWarehouse {
  id: string
  name: string
}

export const STOK_WAREHOUSES: StokWarehouse[] = [
  { id: 'w1', name: 'Merkez Depo' },
  { id: 'w2', name: 'Soğuk Depo' },
  { id: 'w3', name: 'Bar Deposu' },
]

export interface StokItem {
  id: string
  name: string
  code: string
  warehouseId: string
  stock: number
  unit: string
  minStock: number
  status: StokItemStatus
  lastMovement: string
  value: string // unit cost × stock
}

export const STOK_ITEMS: StokItem[] = [
  { id: 's01', name: 'Dana Kuşbaşı',      code: 'HM-001', warehouseId: 'w1', stock: 4.2,  unit: 'kg',    minStock: 8,    status: 'kritik',  lastMovement: '17 Tem', value: '₺630'  },
  { id: 's02', name: 'Tavuk But',          code: 'HM-002', warehouseId: 'w2', stock: 6.5,  unit: 'kg',    minStock: 10,   status: 'kritik',  lastMovement: '17 Tem', value: '₺520'  },
  { id: 's03', name: 'Kıyma',              code: 'HM-003', warehouseId: 'w1', stock: 0,    unit: 'kg',    minStock: 5,    status: 'tukendi', lastMovement: '16 Tem', value: '₺0'    },
  { id: 's04', name: 'Pirinç',             code: 'KR-001', warehouseId: 'w1', stock: 18,   unit: 'kg',    minStock: 10,   status: 'normal',  lastMovement: '15 Tem', value: '₺720'  },
  { id: 's05', name: 'Un',                 code: 'KR-002', warehouseId: 'w1', stock: 22,   unit: 'kg',    minStock: 10,   status: 'normal',  lastMovement: '15 Tem', value: '₺440'  },
  { id: 's06', name: 'Zeytinyağı',         code: 'YG-001', warehouseId: 'w1', stock: 3,    unit: 'lt',    minStock: 5,    status: 'kritik',  lastMovement: '17 Tem', value: '₺810'  },
  { id: 's07', name: 'Domates',            code: 'SB-001', warehouseId: 'w2', stock: 8,    unit: 'kg',    minStock: 5,    status: 'normal',  lastMovement: '18 Tem', value: '₺160'  },
  { id: 's08', name: 'Soğan',              code: 'SB-002', warehouseId: 'w1', stock: 0,    unit: 'kg',    minStock: 5,    status: 'tukendi', lastMovement: '16 Tem', value: '₺0'    },
  { id: 's09', name: 'Sarımsak',           code: 'SB-003', warehouseId: 'w2', stock: 1.2,  unit: 'kg',    minStock: 2,    status: 'kritik',  lastMovement: '17 Tem', value: '₺144'  },
  { id: 's10', name: 'Kola (24lü koli)',   code: 'IC-001', warehouseId: 'w3', stock: 4,    unit: 'koli',  minStock: 3,    status: 'normal',  lastMovement: '16 Tem', value: '₺480'  },
  { id: 's11', name: 'Su (0.5L 24lü)',     code: 'IC-002', warehouseId: 'w3', stock: 2,    unit: 'koli',  minStock: 4,    status: 'kritik',  lastMovement: '17 Tem', value: '₺144'  },
  { id: 's12', name: 'Ayran (200ml)',      code: 'IC-003', warehouseId: 'w3', stock: 48,   unit: 'adet',  minStock: 24,   status: 'normal',  lastMovement: '15 Tem', value: '₺288'  },
  { id: 's13', name: 'Peçete',             code: 'SR-001', warehouseId: 'w1', stock: 500,  unit: 'adet',  minStock: 200,  status: 'normal',  lastMovement: '10 Tem', value: '₺100'  },
  { id: 's14', name: 'Plastik Ambalaj',    code: 'SR-002', warehouseId: 'w1', stock: 80,   unit: 'adet',  minStock: 100,  status: 'kritik',  lastMovement: '17 Tem', value: '₺120'  },
]

// Stok KPI helpers
export const STOK_KPI = {
  toplamDeger:   '₺18.640',
  kritikAdet:    STOK_ITEMS.filter((i) => i.status === 'kritik').length,
  bugunFireTutar: '₺320',
  acikSayim:     1,
}

// ── Stok / Sayımlar ──────────────────────────────────────────────────────────

export type SayimStatus = 'Sayımda' | 'Kapalı'

export interface Sayim {
  id: string
  warehouseId: string
  status: SayimStatus
  counted: number
  total: number
  createdBy: string
  date: string
}

export const SAYIMLAR: Sayim[] = [
  { id: 'sy01', warehouseId: 'w1', status: 'Sayımda', counted: 12, total: 46, createdBy: 'Ali K.',   date: '18 Tem 09:00' },
  { id: 'sy02', warehouseId: 'w2', status: 'Kapalı',  counted: 24, total: 24, createdBy: 'Zeynep T.',date: '16 Tem 14:30' },
  { id: 'sy03', warehouseId: 'w3', status: 'Kapalı',  counted: 18, total: 18, createdBy: 'Can Y.',   date: '15 Tem 11:00' },
  { id: 'sy04', warehouseId: 'w1', status: 'Kapalı',  counted: 46, total: 46, createdBy: 'Mert D.',  date: '14 Tem 16:00' },
]

// ── Stok / Transferler ───────────────────────────────────────────────────────

export type TransferStatus = 'Bekleyen' | 'Yolda' | 'Tamamlanan'

export interface StokTransfer {
  id: string
  fromWarehouseId: string
  toWarehouseId: string
  itemCount: number
  status: TransferStatus
  time: string
  note?: string
}

export const STOK_TRANSFERS: StokTransfer[] = [
  { id: 'tr01', fromWarehouseId: 'w1', toWarehouseId: 'w3', itemCount: 3,  status: 'Bekleyen',    time: '18 Tem 14:10', note: 'Bar eksiği acil' },
  { id: 'tr02', fromWarehouseId: 'w2', toWarehouseId: 'w1', itemCount: 5,  status: 'Yolda',       time: '18 Tem 12:45' },
  { id: 'tr03', fromWarehouseId: 'w1', toWarehouseId: 'w2', itemCount: 2,  status: 'Tamamlanan',  time: '17 Tem 16:30' },
  { id: 'tr04', fromWarehouseId: 'w3', toWarehouseId: 'w1', itemCount: 4,  status: 'Tamamlanan',  time: '17 Tem 11:00' },
  { id: 'tr05', fromWarehouseId: 'w2', toWarehouseId: 'w3', itemCount: 1,  status: 'Tamamlanan',  time: '16 Tem 09:20' },
]

// ── Stok / Fire ──────────────────────────────────────────────────────────────

export type FirePeriod = 'Bugün' | '7 Gün' | '30 Gün'

export interface FireEntry {
  id: string
  name: string
  qty: number
  unit: string
  warehouseId: string
  reason: string
  amount: string
  date: string
}

const FIRE_TODAY: FireEntry[] = [
  { id: 'f01', name: 'Dana Kuşbaşı',  qty: 0.8, unit: 'kg',   warehouseId: 'w1', reason: 'Son kullanma',     amount: '₺120', date: '18 Tem 10:15' },
  { id: 'f02', name: 'Domates',       qty: 1.5, unit: 'kg',   warehouseId: 'w2', reason: 'Kısmen bozulma',   amount: '₺30',  date: '18 Tem 09:40' },
  { id: 'f03', name: 'Ekmek',         qty: 12,  unit: 'adet', warehouseId: 'w1', reason: 'Gün sonu fire',    amount: '₺60',  date: '18 Tem 08:00' },
  { id: 'f04', name: 'Kola (0.33)',   qty: 4,   unit: 'adet', warehouseId: 'w3', reason: 'Kırılma / zarar',  amount: '₺72',  date: '18 Tem 13:20' },
  { id: 'f05', name: 'Tavuk But',     qty: 0.4, unit: 'kg',   warehouseId: 'w2', reason: 'Son kullanma',     amount: '₺38',  date: '18 Tem 14:05' },
]

const FIRE_7GUN: FireEntry[] = [
  ...FIRE_TODAY,
  { id: 'f06', name: 'Zeytinyağı',    qty: 0.5, unit: 'lt',   warehouseId: 'w1', reason: 'Döküldü',          amount: '₺135', date: '17 Tem 11:00' },
  { id: 'f07', name: 'Peynir',        qty: 0.6, unit: 'kg',   warehouseId: 'w2', reason: 'Son kullanma',     amount: '₺90',  date: '17 Tem 09:30' },
  { id: 'f08', name: 'Makarna',       qty: 0.5, unit: 'kg',   warehouseId: 'w1', reason: 'Gün sonu fire',    amount: '₺20',  date: '16 Tem 08:00' },
  { id: 'f09', name: 'Salatalık',     qty: 1,   unit: 'kg',   warehouseId: 'w2', reason: 'Kısmen bozulma',   amount: '₺18',  date: '15 Tem 10:00' },
  { id: 'f10', name: 'Kıyma',        qty: 0.3,  unit: 'kg',   warehouseId: 'w1', reason: 'Son kullanma',     amount: '₺45',  date: '14 Tem 11:30' },
]

const FIRE_30GUN: FireEntry[] = [
  ...FIRE_7GUN,
  { id: 'f11', name: 'Un',            qty: 2,   unit: 'kg',   warehouseId: 'w1', reason: 'Nem aldı',         amount: '₺40',  date: '13 Tem 08:00' },
  { id: 'f12', name: 'Pilav',         qty: 1.5, unit: 'kg',   warehouseId: 'w1', reason: 'Gün sonu fire',    amount: '₺45',  date: '11 Tem 08:00' },
  { id: 'f13', name: 'Tavuk Göğüs',   qty: 0.6, unit: 'kg',   warehouseId: 'w2', reason: 'Son kullanma',     amount: '₺54',  date: '10 Tem 10:00' },
]

export const FIRE_DATA: Record<FirePeriod, FireEntry[]> = {
  'Bugün': FIRE_TODAY,
  '7 Gün': FIRE_7GUN,
  '30 Gün': FIRE_30GUN,
}

// ── Menü (/boss-m/menu) ──────────────────────────────────────────────────────

export interface MenuItem {
  id: string
  name: string
  category: string
  price: number
  active: boolean
  tukendi: boolean
  stock: number | null // null = no stock tracking
  sku?: string
  code?: string
  priceByService?: boolean
  servicePrices?: Record<string, { sale: string; original: string }>
  taxRateId?: string
  taxLabel?: string
  productionByService?: boolean
  productionAreasByService?: Record<string, string[]>
}

export const MENU_CATEGORIES = ['Tümü', 'Ana Yemek', 'Başlangıç', 'Salata', 'İçecek', 'Tatlı']

export const MENU_ITEMS: MenuItem[] = [
  { id: 'm01', name: 'Izgara Köfte',      category: 'Ana Yemek',  price: 70,  active: true,  tukendi: false, stock: 48  },
  { id: 'm02', name: 'Adana Kebap',       category: 'Ana Yemek',  price: 85,  active: true,  tukendi: false, stock: 32  },
  { id: 'm03', name: 'Tavuk Şiş',         category: 'Ana Yemek',  price: 60,  active: true,  tukendi: true,  stock: 0   },
  { id: 'm04', name: 'Lahmacun',          category: 'Ana Yemek',  price: 35,  active: false, tukendi: false, stock: null },
  { id: 'm05', name: 'Mercimek Çorbası',  category: 'Başlangıç',  price: 30,  active: true,  tukendi: false, stock: null },
  { id: 'm06', name: 'Ezogelin Çorbası',  category: 'Başlangıç',  price: 30,  active: true,  tukendi: false, stock: null },
  { id: 'm07', name: 'Çoban Salata',      category: 'Salata',     price: 30,  active: true,  tukendi: false, stock: 65  },
  { id: 'm08', name: 'Mevsim Salata',     category: 'Salata',     price: 28,  active: true,  tukendi: false, stock: 4   },
  { id: 'm09', name: 'Ayran',             category: 'İçecek',     price: 10,  active: true,  tukendi: false, stock: 120 },
  { id: 'm10', name: 'Kola (0.33)',       category: 'İçecek',     price: 18,  active: true,  tukendi: false, stock: 84  },
  { id: 'm11', name: 'Su (0.5L)',         category: 'İçecek',     price: 8,   active: true,  tukendi: false, stock: 9   },
  { id: 'm12', name: 'Künefe',            category: 'Tatlı',      price: 55,  active: true,  tukendi: false, stock: 22  },
  { id: 'm13', name: 'Sütlaç',            category: 'Tatlı',      price: 40,  active: true,  tukendi: true,  stock: 0   },
  { id: 'm14', name: 'Baklava (porsiyon)',category: 'Tatlı',      price: 65,  active: false, tukendi: false, stock: null },
]

// ── Personel (/boss-m/personel) ───────────────────────────────────────────────

export type PersonelRole = 'Garson' | 'Kasiyer' | 'Şef' | 'Yardımcı' | 'Müdür'

export interface PersonelRow {
  id: string
  name: string
  role: PersonelRole
  active: boolean
  // Performans
  salesTotal: string
  cancelRate: string   // e.g. "3.2%"
  orderCount: number
  // Kadro
  startDate: string
  phone: string
  // Detail
  auditEvents: { time: string; desc: string }[]
}

export const PERSONEL_LIST: PersonelRow[] = [
  {
    id: 'pr01', name: 'Ali Koçak',    role: 'Garson',  active: true,
    salesTotal: '₺12.480', cancelRate: '1.8%', orderCount: 148,
    startDate: '01 Mar 2023', phone: '0532 111 22 33',
    auditEvents: [
      { time: '18 Tem 13:42', desc: 'Sipariş #4821 iptal — Müşteri vazgeçti' },
      { time: '18 Tem 11:15', desc: 'Masa 7 açıldı' },
      { time: '17 Tem 20:05', desc: 'Kapanış kasası onaylandı' },
    ],
  },
  {
    id: 'pr02', name: 'Zeynep Taş',   role: 'Kasiyer', active: true,
    salesTotal: '₺9.750',  cancelRate: '0.9%', orderCount: 112,
    startDate: '15 Haz 2022', phone: '0541 222 33 44',
    auditEvents: [
      { time: '18 Tem 14:00', desc: 'Ödeme düzeltmesi — Masa 3' },
      { time: '18 Tem 09:30', desc: 'Açılış kasası onaylandı' },
    ],
  },
  {
    id: 'pr03', name: 'Can Yılmaz',   role: 'Garson',  active: true,
    salesTotal: '₺8.320',  cancelRate: '4.5%', orderCount: 98,
    startDate: '10 Oca 2024', phone: '0555 333 44 55',
    auditEvents: [
      { time: '18 Tem 12:30', desc: 'Sipariş #4830 iptal — Ürün yok' },
      { time: '18 Tem 12:30', desc: 'Sipariş #4829 iptal — Ürün yok' },
      { time: '18 Tem 10:00', desc: 'Masa 12 açıldı' },
    ],
  },
  {
    id: 'pr04', name: 'Mert Demir',   role: 'Şef',     active: true,
    salesTotal: '₺0',      cancelRate: '—',    orderCount: 0,
    startDate: '20 Şub 2021', phone: '0533 444 55 66',
    auditEvents: [
      { time: '18 Tem 08:00', desc: 'Üretim başlangıç kaydı' },
    ],
  },
  {
    id: 'pr05', name: 'Selin Arslan', role: 'Garson',  active: false,
    salesTotal: '₺2.100',  cancelRate: '2.1%', orderCount: 25,
    startDate: '01 May 2024', phone: '0544 555 66 77',
    auditEvents: [],
  },
  {
    id: 'pr06', name: 'Hakan Öz',     role: 'Müdür',   active: true,
    salesTotal: '₺0',      cancelRate: '—',    orderCount: 0,
    startDate: '01 Oca 2020', phone: '0530 666 77 88',
    auditEvents: [
      { time: '18 Tem 09:00', desc: 'Günlük brifing kaydedildi' },
      { time: '17 Tem 23:00', desc: 'Gece kapanışı onaylandı' },
    ],
  },
]

// ── Raporlar / Sahip (/boss-m/raporlar/sahip) ─────────────────────────────────

export interface SahipAylik {
  month: string    // e.g. "Temmuz 2025"
  ciro: string
  maliyet: string
  karProxy: string
  personelGider: string
  ciroDelta: string
  maliyetRatio: string
}

export const SAHIP_RAPORLAR: SahipAylik[] = [
  { month: 'Temmuz 2025',  ciro: '₺186.400', maliyet: '₺78.200',  karProxy: '₺108.200', personelGider: '₺28.400', ciroDelta: '+12%', maliyetRatio: '41.9%' },
  { month: 'Haziran 2025', ciro: '₺166.200', maliyet: '₺71.400',  karProxy: '₺94.800',  personelGider: '₺27.600', ciroDelta: '+8%',  maliyetRatio: '42.9%' },
  { month: 'Mayıs 2025',   ciro: '₺153.800', maliyet: '₺68.900',  karProxy: '₺84.900',  personelGider: '₺26.800', ciroDelta: '+5%',  maliyetRatio: '44.8%' },
  { month: 'Nisan 2025',   ciro: '₺146.500', maliyet: '₺65.200',  karProxy: '₺81.300',  personelGider: '₺26.200', ciroDelta: '+3%',  maliyetRatio: '44.5%' },
  { month: 'Mart 2025',    ciro: '₺142.200', maliyet: '₺64.800',  karProxy: '₺77.400',  personelGider: '₺25.400', ciroDelta: '-2%',  maliyetRatio: '45.6%' },
]

// ── Raporlar / Z (/boss-m/raporlar/z) ────────────────────────────────────────

export interface ZReport {
  id: string
  zNo: string
  terminal: string
  total: string
  nakit: string
  kart: string
  time: string
  date: string
  receiptCount: number
  cancelTotal: string
}

export const Z_REPORTS: ZReport[] = [
  { id: 'z01', zNo: 'Z-0842', terminal: 'Kasa 1',   total: '₺8.420', nakit: '₺3.180', kart: '₺5.240', time: '23:58', date: '17 Tem 2025', receiptCount: 94,  cancelTotal: '₺320' },
  { id: 'z02', zNo: 'Z-0841', terminal: 'Kasa 1',   total: '₺7.860', nakit: '₺2.940', kart: '₺4.920', time: '23:55', date: '16 Tem 2025', receiptCount: 88,  cancelTotal: '₺140' },
  { id: 'z03', zNo: 'Z-0318', terminal: 'Kasa 2',   total: '₺5.240', nakit: '₺1.820', kart: '₺3.420', time: '23:52', date: '17 Tem 2025', receiptCount: 61,  cancelTotal: '₺210' },
  { id: 'z04', zNo: 'Z-0840', terminal: 'Kasa 1',   total: '₺9.120', nakit: '₺3.640', kart: '₺5.480', time: '23:59', date: '15 Tem 2025', receiptCount: 102, cancelTotal: '₺480' },
  { id: 'z05', zNo: 'Z-0317', terminal: 'Kasa 2',   total: '₺4.980', nakit: '₺1.680', kart: '₺3.300', time: '23:51', date: '16 Tem 2025', receiptCount: 58,  cancelTotal: '₺90'  },
  { id: 'z06', zNo: 'Z-0839', terminal: 'Kasa 1',   total: '₺8.760', nakit: '₺3.200', kart: '₺5.560', time: '23:57', date: '14 Tem 2025', receiptCount: 97,  cancelTotal: '₺260' },
]

// ── Cariler (/boss-m/cariler) ─────────────────────────────────────────────────

export type CariType = 'musteri' | 'tedarikci'

export interface Cari {
  id: string
  type: CariType
  name: string
  balance: number    // positive = borçlu (owes us), negative = alacaklı
  lastMovement: string
  ledger: { date: string; desc: string; amount: string; sign: '+' | '-' }[]
}

export const CARILER: Cari[] = [
  {
    id: 'c01', type: 'musteri', name: 'Otel Marmara A.Ş.', balance: 4200,
    lastMovement: '17 Tem',
    ledger: [
      { date: '17 Tem', desc: 'Fatura #1042', amount: '₺1.400', sign: '+' },
      { date: '15 Tem', desc: 'Fatura #1038', amount: '₺2.800', sign: '+' },
      { date: '10 Tem', desc: 'Ödeme alındı',  amount: '₺5.000', sign: '-' },
      { date: '05 Tem', desc: 'Fatura #1030', amount: '₺3.200', sign: '+' },
      { date: '01 Tem', desc: 'Fatura #1024', amount: '₺1.800', sign: '+' },
    ],
  },
  {
    id: 'c02', type: 'musteri', name: 'Kurumsal Yemek Ltd.', balance: -500,
    lastMovement: '16 Tem',
    ledger: [
      { date: '16 Tem', desc: 'Ödeme alındı',   amount: '₺3.500', sign: '-' },
      { date: '14 Tem', desc: 'Fatura #1040',   amount: '₺3.000', sign: '+' },
      { date: '08 Tem', desc: 'Avans ödeme',    amount: '₺500',   sign: '-' },
      { date: '03 Tem', desc: 'Fatura #1025',   amount: '₺2.500', sign: '+' },
      { date: '01 Tem', desc: 'Ödeme alındı',   amount: '₺2.000', sign: '-' },
    ],
  },
  {
    id: 'c03', type: 'musteri', name: 'Merkez Plaza', balance: 0,
    lastMovement: '12 Tem',
    ledger: [
      { date: '12 Tem', desc: 'Ödeme alındı',  amount: '₺2.200', sign: '-' },
      { date: '10 Tem', desc: 'Fatura #1034',  amount: '₺2.200', sign: '+' },
      { date: '01 Tem', desc: 'Ödeme alındı',  amount: '₺1.800', sign: '-' },
      { date: '28 Haz', desc: 'Fatura #1018',  amount: '₺1.800', sign: '+' },
      { date: '20 Haz', desc: 'Fatura #1010',  amount: '₺1.400', sign: '+' },
    ],
  },
  {
    id: 'c04', type: 'tedarikci', name: 'Ege Et Gıda', balance: -3800,
    lastMovement: '18 Tem',
    ledger: [
      { date: '18 Tem', desc: 'Alım faturası',  amount: '₺1.800', sign: '+' },
      { date: '15 Tem', desc: 'Ödeme yapıldı',  amount: '₺4.000', sign: '-' },
      { date: '10 Tem', desc: 'Alım faturası',  amount: '₺2.200', sign: '+' },
      { date: '05 Tem', desc: 'Alım faturası',  amount: '₺3.600', sign: '+' },
      { date: '01 Tem', desc: 'Ödeme yapıldı',  amount: '₺5.000', sign: '-' },
    ],
  },
  {
    id: 'c05', type: 'tedarikci', name: 'Sürat İçecek', balance: -1200,
    lastMovement: '16 Tem',
    ledger: [
      { date: '16 Tem', desc: 'Alım faturası',  amount: '₺1.200', sign: '+' },
      { date: '10 Tem', desc: 'Ödeme yapıldı',  amount: '₺2.000', sign: '-' },
      { date: '05 Tem', desc: 'Alım faturası',  amount: '₺2.000', sign: '+' },
      { date: '01 Tem', desc: 'Alım faturası',  amount: '₺1.800', sign: '+' },
      { date: '28 Haz', desc: 'Ödeme yapıldı',  amount: '₺2.400', sign: '-' },
    ],
  },
  {
    id: 'c06', type: 'tedarikci', name: 'Marmara Taze Sebze', balance: 600,
    lastMovement: '17 Tem',
    ledger: [
      { date: '17 Tem', desc: 'Fazla ödeme iade',amount: '₺600',  sign: '+' },
      { date: '14 Tem', desc: 'Ödeme yapıldı',   amount: '₺3.600',sign: '-' },
      { date: '10 Tem', desc: 'Alım faturası',   amount: '₺3.000',sign: '+' },
      { date: '05 Tem', desc: 'Alım faturası',   amount: '₺2.400',sign: '+' },
      { date: '01 Tem', desc: 'Ödeme yapıldı',   amount: '₺2.400',sign: '-' },
    ],
  },
]

// ── Lisanslar (/boss-m/lisanslar) ─────────────────────────────────────────────

export type LisansStatus = 'aktif' | 'yaklasıyor' | 'yok'

export interface Lisans {
  id: string
  name: string
  description: string
  status: LisansStatus
  expiresAt: string | null   // null = indefinite / not licensed
  daysLeft: number | null
}

export const LISANSLAR: Lisans[] = [
  { id: 'l01', name: 'POS Yazarkasa',    description: 'Yazar kasa entegrasyon lisansı',      status: 'aktif',       expiresAt: '31 Ara 2025', daysLeft: 166  },
  { id: 'l02', name: 'QR Menü',          description: 'Masa QR kod ve online menü modülü',   status: 'yaklasıyor',  expiresAt: '15 Ağu 2025', daysLeft: 28   },
  { id: 'l03', name: 'Stok Takip',       description: 'Gelişmiş depo ve fire yönetimi',       status: 'aktif',       expiresAt: '01 Mar 2026', daysLeft: 225  },
  { id: 'l04', name: 'Online Sipariş',   description: 'Web ve uygulama sipariş entegrasyonu', status: 'yok',         expiresAt: null,           daysLeft: null },
  { id: 'l05', name: 'Personel Takip',   description: 'Mesai ve performans modülü',           status: 'aktif',       expiresAt: '31 Ara 2025', daysLeft: 166  },
  { id: 'l06', name: 'Restroid AI',      description: 'AI asistan ve analiz motoru',          status: 'yaklasıyor',  expiresAt: '10 Ağu 2025', daysLeft: 23   },
]

// ── Raporlar (/boss-m/raporlar) ──────────────────────────────────────────────

export interface ReportCard {
  id: string
  title: string
  purpose: string
  icon: string
}

export const REPORT_CARDS: ReportCard[] = [
  { id: 'urun',     title: 'Ürün Satış',           purpose: 'En çok satan ürünler ve kategori bazlı satış hacmi', icon: 'bar' },
  { id: 'personel', title: 'Personel Performans',   purpose: 'Garson bazlı ciro, sipariş ve iptal karşılaştırması', icon: 'users' },
  { id: 'sube',     title: 'Şube Karşılaştırma',   purpose: 'Şubeler arası ciro, konuk ve kapasite kıyası', icon: 'branch' },
]

export type ReportPeriod = 'Bugün' | '7 Gün' | '30 Gün'

export interface ProductRow {
  rank: number
  name: string
  qty: number
  revenue: string
  trend: 'up' | 'down' | 'flat'
}

export const PRODUCT_REPORT: Record<ReportPeriod, ProductRow[]> = {
  'Bugün': [
    { rank: 1, name: 'Izgara Köfte',      qty: 42, revenue: '₺2.940', trend: 'up'   },
    { rank: 2, name: 'Adana Kebap',       qty: 35, revenue: '₺2.450', trend: 'up'   },
    { rank: 3, name: 'Tavuk Şiş',         qty: 28, revenue: '₺1.680', trend: 'flat' },
    { rank: 4, name: 'Çoban Salata',      qty: 60, revenue: '₺900',   trend: 'down' },
    { rank: 5, name: 'Ayran',             qty: 95, revenue: '₺570',   trend: 'flat' },
  ],
  '7 Gün': [
    { rank: 1, name: 'Izgara Köfte',      qty: 290, revenue: '₺20.300', trend: 'up'   },
    { rank: 2, name: 'Adana Kebap',       qty: 210, revenue: '₺14.700', trend: 'up'   },
    { rank: 3, name: 'Tavuk Şiş',         qty: 185, revenue: '₺11.100', trend: 'up'   },
    { rank: 4, name: 'Çoban Salata',      qty: 380, revenue: '₺5.700',  trend: 'flat' },
    { rank: 5, name: 'Ayran',             qty: 620, revenue: '₺3.720',  trend: 'down' },
  ],
  '30 Gün': [
    { rank: 1, name: 'Izgara Köfte',      qty: 1240, revenue: '₺86.800', trend: 'up'   },
    { rank: 2, name: 'Adana Kebap',       qty: 890,  revenue: '₺62.300', trend: 'flat' },
    { rank: 3, name: 'Tavuk Şiş',         qty: 780,  revenue: '₺46.800', trend: 'up'   },
    { rank: 4, name: 'Çoban Salata',      qty: 1560, revenue: '₺23.400', trend: 'down' },
    { rank: 5, name: 'Ayran',             qty: 2480, revenue: '₺14.880', trend: 'flat' },
  ],
}
