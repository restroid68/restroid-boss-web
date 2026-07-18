import BossAppearanceRoot from '@/components/boss/BossAppearanceRoot'
import BossBridgeBootstrap from '@/components/boss/BossBridgeBootstrap'
import BossShellNav from '@/components/boss/BossShellNav'

/**
 * Flutter alt nav ~78px + gesture bar. Scroll alanı buna göre kısaltılır;
 * içerikte ekstra alt boşluk — son kartlar barın altında kalmasın.
 */
const NATIVE_BOTTOM_CLEARANCE = 'pb-[7.5rem]' // 120px

export default function BossMLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative flex h-[100dvh] flex-col overflow-hidden bg-background">
      {/* Login ile aynı arka plan */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/boss-login-bg.png')" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/55 via-background/78 to-[#04060C]/94"
      />

      <BossAppearanceRoot />
      <BossBridgeBootstrap />
      <BossShellNav />
      <div
        className={`relative z-10 min-h-0 flex-1 overflow-y-auto overscroll-y-contain touch-pan-y ${NATIVE_BOTTOM_CLEARANCE}`}
      >
        {children}
      </div>
    </div>
  )
}
