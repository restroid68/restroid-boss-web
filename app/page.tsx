import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Store,
  TrendingUp,
  Wallet,
  ShieldAlert,
  BarChart2,
  ArrowLeftRight,
  Settings2,
  Package,
  Sparkles,
  Boxes,
  AlertTriangle,
  ClipboardList,
  Truck,
  Flame,
  UtensilsCrossed,
  Users,
  FileBarChart2,
  Receipt,
  BookUser,
  ShieldCheck,
  ChevronRight,
  ShoppingBag,
  QrCode,
} from 'lucide-react'

const ROUTE_GROUPS = [
  {
    group: 'Ana Ekranlar',
    routes: [
      { href: '/boss-m/ana', label: 'Ana Sayfa', sub: 'Günlük KPI, kanallar, uyarılar', icon: Store, color: 'text-primary  bg-primary/10' },
      { href: '/boss-m/finans', label: 'Finans', sub: 'Ödeme dağılımı, hareketler', icon: TrendingUp, color: 'text-success bg-success/10' },
      { href: '/boss-m/kasa', label: 'Kasa & Banka', sub: 'Bakiye, giriş/çıkış, defteri', icon: Wallet, color: 'text-info    bg-info/10' },
      { href: '/boss-m/denetim', label: 'Denetim', sub: 'Canlı uyarılar, filtreler', icon: ShieldAlert, color: 'text-danger  bg-danger/10' },
      { href: '/boss-m/raporlar', label: 'Raporlar', sub: 'Ürün, personel, şube raporları', icon: BarChart2, color: 'text-warning bg-warning/10' },
    ],
  },
  {
    group: 'Siparişler',
    routes: [
      { href: '/boss-m/siparisler/online', label: 'Online siparişler', sub: 'Platform sipariş listesi', icon: ShoppingBag, color: 'text-warning bg-warning/10' },
      { href: '/boss-m/siparisler/qr', label: 'QR menü siparişleri', sub: 'QR sipariş listesi', icon: QrCode, color: 'text-info bg-info/10' },
    ],
  },
  {
    group: 'AI Asistan',
    routes: [
      { href: '/boss-m/ai', label: 'Restroid AI', sub: 'Günlük özet, iptal analizi, maliyet uyarısı', icon: Sparkles, color: 'text-primary bg-primary/10' },
    ],
  },
  {
    group: 'Stok',
    routes: [
      { href: '/boss-m/stok', label: 'Stok Genel', sub: 'KPI, kritik ürünler, hızlı git', icon: Boxes, color: 'text-primary bg-primary/10' },
      { href: '/boss-m/stok/kritik', label: 'Kritik Stok', sub: 'Arama, sıralama, detay', icon: AlertTriangle, color: 'text-warning bg-warning/10' },
      { href: '/boss-m/stok/sayimlar', label: 'Sayımlar', sub: 'Açık / kapalı, ilerleme, yeni sayım', icon: ClipboardList, color: 'text-info    bg-info/10' },
      { href: '/boss-m/stok/transferler', label: 'Transferler', sub: 'Bekleyen / yolda / tamamlanan, onayla', icon: Truck, color: 'text-success bg-success/10' },
      { href: '/boss-m/stok/fire', label: 'Fire / Çıkış', sub: 'Bugün / 7 gün / 30 gün, tutar, kayıtlar', icon: Flame, color: 'text-danger  bg-danger/10' },
    ],
  },
  {
    group: 'Menü & Personel',
    routes: [
      { href: '/boss-m/menu', label: 'Menü & Fiyat', sub: 'Ürün listesi, fiyat düzenle, 86 toggle', icon: UtensilsCrossed, color: 'text-primary  bg-primary/10' },
      { href: '/boss-m/personel', label: 'Personel', sub: 'Performans sıralaması, kadro, denetim', icon: Users, color: 'text-info    bg-info/10' },
    ],
  },
  {
    group: 'Raporlar',
    routes: [
      { href: '/boss-m/raporlar/sahip', label: 'Sahip Raporu', sub: 'Aylık ciro, maliyet, kâr tahmini', icon: FileBarChart2, color: 'text-success bg-success/10' },
      { href: '/boss-m/raporlar/z', label: 'Z Raporları', sub: 'Günlük kapanış, terminal, fiş sayısı', icon: Receipt, color: 'text-warning bg-warning/10' },
    ],
  },
  {
    group: 'Finans & Sistem',
    routes: [
      { href: '/boss-m/cariler', label: 'Cariler', sub: 'Müşteri & tedarikçi, bakiye, hareketler', icon: BookUser, color: 'text-primary bg-primary/10' },
      { href: '/boss-m/lisanslar', label: 'Lisanslar', sub: 'POS, QR Menü, Stok, Online — sağlık', icon: ShieldCheck, color: 'text-success bg-success/10' },
      { href: '/boss-m/kasa/hareket', label: 'Nakit Hareket', sub: 'Giriş / çıkış / gider / transfer formu', icon: ArrowLeftRight, color: 'text-info    bg-info/10' },
      { href: '/boss-m/sistem', label: 'Sistem Ayarları', sub: 'Kanallar, ödeme, salon, üretim', icon: Settings2, color: 'text-primary bg-primary/10' },
      { href: '/boss-m/urunler', label: 'Ürün Stok', sub: 'Arama, filtre, hızlı stok düzenleme', icon: Package, color: 'text-warning bg-warning/10' },
    ],
  },
]

export default function Home() {
  if (process.env.NODE_ENV === 'production') {
    redirect('/boss-m/ana')
  }

  return (
    <main className="min-h-screen bg-background flex flex-col">
      <div className="px-5 pt-12 pb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center">
            <Store size={18} className="text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">RestroidBOSS</h1>
            <p className="text-xs text-muted-foreground">Dev önizleme — prod → /boss-m/ana</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6 px-4 pb-10">
        {ROUTE_GROUPS.map((group) => (
          <section key={group.group}>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2.5 px-0.5">
              {group.group}
            </p>
            <div className="flex flex-col gap-2">
              {group.routes.map((r) => {
                const Icon = r.icon
                return (
                  <Link
                    key={r.href}
                    href={r.href}
                    className="flex items-center gap-4 bg-card border border-border rounded-2xl px-4 py-4 active:scale-[0.98] transition-transform"
                  >
                    <div className={`flex items-center justify-center w-11 h-11 rounded-xl shrink-0 ${r.color}`}>
                      <Icon size={20} strokeWidth={1.6} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{r.label}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{r.sub}</p>
                    </div>
                    <ChevronRight size={15} className="text-muted-foreground shrink-0" />
                  </Link>
                )
              })}
            </div>
          </section>
        ))}
      </div>
    </main>
  )
}
