import BossBridgeBootstrap from '@/components/boss/BossBridgeBootstrap'

// Shell layout for /boss-m — no bottom nav (Flutter owns it).
// h-dvh + min-h-0: WebView’de dikey kaydırma için flex çocuğunun boyutu kısıtlanmalı.
export default function BossMLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative flex h-[100dvh] flex-col overflow-hidden bg-background pb-[72px]">
      <BossBridgeBootstrap />
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain touch-pan-y">
        {children}
      </div>
    </div>
  )
}
