/**
 * Boss AI hazır komut kataloğu — kategorili prompt listesi.
 * `prompt` modele giden metin; `label` kullanıcıya gösterilen kısa ad.
 */

export type BossAiCommandCategoryId =
  | 'summary'
  | 'sales'
  | 'channel'
  | 'loss'
  | 'expense'
  | 'cash'
  | 'ledger'
  | 'ops'
  | 'product'

export type BossAiCommand = {
  id: string
  label: string
  prompt: string
  /** Kısa alt satır (isteğe bağlı) */
  hint?: string
}

export type BossAiCommandCategory = {
  id: BossAiCommandCategoryId
  title: string
  commands: BossAiCommand[]
}

export const BOSS_AI_COMMAND_CATEGORIES: BossAiCommandCategory[] = [
  {
    id: 'summary',
    title: 'Günün özeti',
    commands: [
      {
        id: 'day-summary',
        label: 'Bugünü özetle',
        prompt: 'Bugünkü satış, ciro, misafir, iptal ve açık hesap özetini ver.',
        hint: 'Ciro + operasyon',
      },
      {
        id: 'week-summary',
        label: 'Bu haftayı özetle',
        prompt: 'Bu haftanın satış ve ciro özetini ver; geçen haftaya göre kısa karşılaştır.',
      },
      {
        id: 'month-summary',
        label: 'Bu ayı özetle',
        prompt: 'Bu ayın net satış ve ciro özetini ver; geçen aya göre değişimi söyle.',
      },
      {
        id: 'yesterday-summary',
        label: 'Dünü özetle',
        prompt: 'Dünün satış, ciro ve iptal özetini ver.',
      },
    ],
  },
  {
    id: 'sales',
    title: 'Satış analizleri',
    commands: [
      {
        id: 'sales-today',
        label: 'Bugünkü ciro',
        prompt: 'Bugünkü net satış ve tahsilat ne kadar?',
      },
      {
        id: 'sales-wow',
        label: 'Haftalık karşılaştır',
        prompt: 'Bu hafta ile geçen haftayı satış ve ciro olarak karşılaştır, grafik ver.',
        hint: 'Trend',
      },
      {
        id: 'sales-mom',
        label: 'Aylık karşılaştır',
        prompt: 'Bu ay ile geçen ayı net satış olarak karşılaştır, grafik ver.',
      },
      {
        id: 'sales-daily-trend',
        label: 'Günlük satış trendi',
        prompt: 'Son 7 günün günlük net satış trendini grafik ile göster.',
      },
      {
        id: 'top-products',
        label: 'En çok satan ürünler',
        prompt: 'Bu hafta en çok satan ürünleri ciro ve adet olarak listele.',
      },
      {
        id: 'guest-avg',
        label: 'Misafir ve ortalama',
        prompt: 'Bugünkü misafir sayısı ve kişi başı ortalama ciroyu söyle.',
      },
      {
        id: 'open-checks',
        label: 'Açık hesaplar',
        prompt: 'Açık adisyon / masa özetini ver: adet, toplam tutar ve en yüksekler.',
      },
    ],
  },
  {
    id: 'channel',
    title: 'Kanal ve servis türü',
    commands: [
      {
        id: 'by-service',
        label: 'Servis türüne göre',
        prompt:
          'Bu haftanın satışlarını servis türüne göre kır (masa, paket, gel al, online vb.) ve karşılaştır.',
      },
      {
        id: 'by-channel',
        label: 'Satış kanalına göre',
        prompt: 'Bu haftanın cirosunu satış kanalına göre analiz et; güçlü ve zayıf kanalları söyle.',
      },
      {
        id: 'delivery-vs-dinein',
        label: 'Paket vs yerinde',
        prompt: 'Bu hafta paket/online ile yerinde (masa) satışını karşılaştır.',
      },
      {
        id: 'platform-pending',
        label: 'Bekleyen online sipariş',
        prompt: 'Bekleyen online / platform siparişlerini listele.',
      },
    ],
  },
  {
    id: 'loss',
    title: 'İkram, zayi, iptal',
    commands: [
      {
        id: 'cancellations',
        label: 'İptalleri açıkla',
        prompt: 'Bugünkü iptal tutarını ve nedenlerini özetle; dikkat edilmesi gerekenleri söyle.',
      },
      {
        id: 'complimentary',
        label: 'İkramlar',
        prompt: 'Bugünkü ikram (complimentary) tutarını ve özetini ver.',
      },
      {
        id: 'waste',
        label: 'Zayi / fire',
        prompt: 'Bugünkü zayi veya fire tutarını özetle.',
      },
      {
        id: 'loss-week',
        label: 'Haftalık kayıplar',
        prompt: 'Bu haftanın iptal, ikram ve zayi tutarlarını karşılaştırarak özetle.',
      },
    ],
  },
  {
    id: 'expense',
    title: 'Giderler',
    commands: [
      {
        id: 'expenses-today',
        label: 'Bugünkü giderler',
        prompt: 'Bugünkü gider tutarını ve varsa ana kalemleri özetle.',
      },
      {
        id: 'expenses-week',
        label: 'Haftalık giderler',
        prompt: 'Bu haftanın giderlerini kategori bazında özetle.',
      },
      {
        id: 'cost-alert',
        label: 'Maliyet uyarısı',
        prompt: 'Maliyet veya food cost açısından dikkat edilmesi gereken noktaları söyle.',
      },
      {
        id: 'expense-vs-sales',
        label: 'Gider / ciro oranı',
        prompt: 'Bu hafta giderlerin ciroya oranını değerlendir.',
      },
    ],
  },
  {
    id: 'cash',
    title: 'Kasa',
    commands: [
      {
        id: 'cash-status',
        label: 'Kasa durumu',
        prompt: 'Kasa ve nakit tahsilat özetini ver; bugünkü nakit akışını kısaca anlat.',
      },
      {
        id: 'payments-breakdown',
        label: 'Ödeme türleri',
        prompt: 'Bu haftanın tahsilatını ödeme türlerine göre kır (nakit, kart vb.).',
      },
      {
        id: 'cash-vs-card',
        label: 'Nakit vs kart',
        prompt: 'Bugün veya bu hafta nakit ve kart tahsilatını karşılaştır.',
      },
      {
        id: 'open-account-receivable',
        label: 'Açık cari alacak',
        prompt: 'Açık hesap / cari alacak tutarını ve riskli noktaları özetle.',
      },
    ],
  },
  {
    id: 'ledger',
    title: 'Müşteri ve tedarikçi',
    commands: [
      {
        id: 'customer-receivables',
        label: 'Müşteri alacakları',
        prompt: 'Müşteri borç-alacak durumunu özetle; en yüksek alacakları söyle.',
      },
      {
        id: 'supplier-payables',
        label: 'Tedarikçi borçları',
        prompt: 'Tedarikçi borç durumunu özetle; ödeme bekleyen önemli kalemleri söyle.',
      },
      {
        id: 'overdue-customers',
        label: 'Geciken müşteri',
        prompt: 'Gecikmiş veya riskli müşteri alacaklarını listele.',
      },
      {
        id: 'supplier-balance',
        label: 'Tedarikçi bakiyeleri',
        prompt: 'Tedarikçi bakiyelerini ve net borç/alacak özetini ver.',
      },
    ],
  },
  {
    id: 'ops',
    title: 'Operasyon ve stok',
    commands: [
      {
        id: 'stock-critical',
        label: 'Kritik stok',
        prompt: 'Kritik veya bitmek üzere olan stok kalemlerini listele.',
      },
      {
        id: 'pending-orders',
        label: 'Bekleyen siparişler',
        prompt: 'Bekleyen online siparişleri durumlarıyla listele.',
      },
      {
        id: 'busy-hours',
        label: 'Yoğun saatler',
        prompt: 'Bu hafta en yoğun satış saatlerini veya günlerini özetle.',
      },
    ],
  },
  {
    id: 'product',
    title: 'Ürün',
    commands: [
      {
        id: 'product-add-help',
        label: 'Ürün nasıl eklerim?',
        prompt: 'Menüye yeni ürün eklemek için ne söylemeliyim? Kısa örnek ver.',
      },
      {
        id: 'product-price-update',
        label: 'Fiyat güncelleme',
        prompt: 'Bir ürünün fiyatını nasıl güncellerim? Kısa örnek komut ver.',
      },
    ],
  },
]

/** Tüm komutlar düz liste */
export function listBossAiCommands(): BossAiCommand[] {
  return BOSS_AI_COMMAND_CATEGORIES.flatMap((c) => c.commands)
}

export function findBossAiCommand(id: string): BossAiCommand | undefined {
  return listBossAiCommands().find((c) => c.id === id)
}

/** Varsayılan sık kullanılanlar (ilk açılış) */
export const BOSS_AI_DEFAULT_FAVORITE_IDS = [
  'day-summary',
  'sales-today',
  'sales-wow',
  'cancellations',
  'open-checks',
  'cash-status',
] as const

export const BOSS_AI_FAVORITES_STORAGE_KEY = 'restroid_boss_ai_favorite_commands'
