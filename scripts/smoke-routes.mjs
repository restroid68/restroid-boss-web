/**
 * Smoke: start expects `pnpm dev` or `next start` already running on :3010.
 * Hits every /boss-m route and asserts HTTP 200 + non-empty HTML.
 *
 * Usage: node scripts/smoke-routes.mjs [baseUrl]
 */
const base = (process.argv[2] || 'http://127.0.0.1:3010').replace(/\/+$/, '')

const routes = [
  '/boss-m/ana',
  '/boss-m/finans',
  '/boss-m/ai',
  '/boss-m/denetim',
  '/boss-m/kasa',
  '/boss-m/kasa/hareket',
  '/boss-m/menu',
  '/boss-m/urunler',
  '/boss-m/personel',
  '/boss-m/cariler',
  '/boss-m/lisanslar',
  '/boss-m/raporlar',
  '/boss-m/raporlar/sahip',
  '/boss-m/raporlar/z',
  '/boss-m/siparisler/online',
  '/boss-m/siparisler/qr',
  '/boss-m/sistem',
  '/boss-m/sistem/kanallar',
  '/boss-m/sistem/odeme',
  '/boss-m/sistem/salon',
  '/boss-m/sistem/uretim',
  '/boss-m/sistem/uzaktan',
  '/boss-m/stok',
  '/boss-m/stok/kritik',
  '/boss-m/stok/sayimlar',
  '/boss-m/stok/transferler',
  '/boss-m/stok/fire',
]

let failed = 0
for (const path of routes) {
  const url = `${base}${path}`
  try {
    const res = await fetch(url, { redirect: 'follow' })
    const text = await res.text()
    const ok = res.status === 200 && text.length > 200 && !text.includes('Application error')
    if (!ok) {
      failed++
      console.error(`FAIL ${path} status=${res.status} len=${text.length}`)
    } else {
      console.log(`OK   ${path}`)
    }
  } catch (e) {
    failed++
    console.error(`FAIL ${path} ${e instanceof Error ? e.message : e}`)
  }
}

console.log(failed === 0 ? `\nAll ${routes.length} routes OK` : `\n${failed}/${routes.length} failed`)
process.exit(failed === 0 ? 0 : 1)
