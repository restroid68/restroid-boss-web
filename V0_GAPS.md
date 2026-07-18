# RestroidBOSS — entegrasyon durumu

Tüm `/boss-m/*` sayfaları v0 UI ile entegre; veri `lib/boss-page-data.ts` + `lib/boss-p0-data.ts` üzerinden panel API’den gelir, oturum/API yoksa mock fallback.

| Route | Durum |
|-------|--------|
| `/boss-m/ana` … `/kasa` (P0) | API |
| `/boss-m/menu`, `/menu/[id]`, `/urunler` | Katalog API |
| `/boss-m/personel`, `/cariler`, `/lisanslar` | API |
| `/boss-m/stok` + kritik/sayım/transfer/fire | Stok API |
| `/boss-m/sistem/*` | Kanallar/ödeme/salon/üretim/uzaktan API |
| `/boss-m/siparisler/online`, `/qr` | Sipariş listesi API |
| `/boss-m/raporlar`, `/sahip`, `/z` | Satış / sahip / Z API |
| `/boss-m/kasa/hareket` | Hesaplar + POST hareket |

**Not:** Menü detayda fiyat/aktif kaydı UI; 86 (tükendi) `patchProductStockStatus` ile gider. Cari ledger satırları API’de boş gelebilir.
