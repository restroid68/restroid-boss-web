import { postToNative } from '@/lib/boss-bridge'

export type BossHapticStyle = 'light' | 'medium' | 'heavy' | 'selection'

/** WebView içinde native titreşim; tarayıcıda sessiz no-op. */
export function bossHaptic(style: BossHapticStyle = 'light'): void {
  if (typeof window === 'undefined') return
  postToNative({ type: 'haptic', style })
}
