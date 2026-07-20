import BossAppearanceRoot from '@/components/boss/BossAppearanceRoot'
import BossBridgeBootstrap from '@/components/boss/BossBridgeBootstrap'
import BossLicenseGate from '@/components/boss/BossLicenseGate'
import BossShellNav from '@/components/boss/BossShellNav'

export default function BossMLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative flex h-[100dvh] flex-col overflow-hidden bg-transparent">
      {/* Login ile aynı arka plan — çocuk sayfalar bg-background ile örtemez */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/boss-login-bg.png')" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-b from-[#070B14]/40 via-[#070B14]/62 to-[#04060C]/88"
      />

      <BossAppearanceRoot />
      <BossBridgeBootstrap />
      <BossLicenseGate>
        <BossShellNav />
        {/* Flutter alt nav boşluğu dışarıda; içerik h-full ile kabuğa sığar (h-svh taşması yok) */}
        <div className="boss-native-scroll relative z-10 flex min-h-0 flex-1 flex-col pb-[var(--boss-native-nav-inset)]">
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain touch-pan-y">
            {children}
          </div>
        </div>
      </BossLicenseGate>
    </div>
  )
}
