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
        {/* Flutter alt nav boşluğu; klavye açıkken (data-keyboard) küçülür */}
        <div className="boss-native-scroll relative z-10 min-h-0 flex-1 overflow-y-auto overscroll-y-contain touch-pan-y pb-[var(--boss-native-nav-inset)]">
          {children}
        </div>
      </BossLicenseGate>
    </div>
  )
}
