import BossBridgeBootstrap from '@/components/boss/BossBridgeBootstrap'

// Shell layout for /boss-m — no bottom nav (Flutter owns it).
// Leaves 72px safe padding at bottom for native tab bar.
export default function BossMLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div
      className="relative flex flex-col min-h-screen bg-background overflow-hidden"
      style={{ paddingBottom: '72px' }}
    >
      <BossBridgeBootstrap />
      <div className="flex-1 overflow-y-auto overscroll-none">{children}</div>
    </div>
  )
}
