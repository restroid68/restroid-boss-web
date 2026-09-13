import BossAppearanceRoot from '@/components/boss/BossAppearanceRoot'
import BossBridgeBootstrap from '@/components/boss/BossBridgeBootstrap'
import BossLicenseGate from '@/components/boss/BossLicenseGate'
import BossOfflineBanner from '@/components/boss/BossOfflineBanner'
import BossRouteTransition from '@/components/boss/BossRouteTransition'
import BossScrollShell from '@/components/boss/BossScrollShell'
import BossShellNav from '@/components/boss/BossShellNav'

export default function BossMLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative flex h-[100dvh] flex-col overflow-hidden bg-transparent">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/boss-login-bg.png')" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-b from-[#05070D]/22 via-[#05070D]/48 to-[#05070D]/82"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 top-[-8%] z-0 h-72 w-72 rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--boss-glow)_28%,transparent),transparent_70%)] blur-2xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 top-[28%] z-0 h-64 w-64 rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--boss-glow-2)_22%,transparent),transparent_72%)] blur-2xl"
      />

      <BossAppearanceRoot />
      <BossBridgeBootstrap />
      <BossLicenseGate>
        <BossShellNav />
        <BossOfflineBanner />
        <BossScrollShell>
          <BossRouteTransition>{children}</BossRouteTransition>
        </BossScrollShell>
      </BossLicenseGate>
    </div>
  )
}
