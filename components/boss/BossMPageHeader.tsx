'use client'

import { useEffect, useState } from 'react'
import { ChevronLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { postToNative } from '@/lib/boss-bridge'
import { cn } from '@/lib/utils'

interface BossMPageHeaderProps {
  title: string
  showBack?: boolean
  trailing?: React.ReactNode
  className?: string
  /** false: modal/sheet — Flutter app bar’a yazma (alt sayfa başlığını bozmasın) */
  syncNativeChrome?: boolean
}

function isNativeShell(): boolean {
  return typeof window !== 'undefined' && typeof window.RestroidBoss?.postMessage === 'function'
}

/**
 * Native WebView’de başlık + geri Flutter app bar’a taşınır; burada yalnızca trailing kalır.
 * Tarayıcı önizlemede tam header gösterilir.
 */
export function BossMPageHeader({
  title,
  showBack = false,
  trailing,
  className,
  syncNativeChrome = true,
}: BossMPageHeaderProps) {
  const router = useRouter()
  const [native, setNative] = useState(false)

  useEffect(() => {
    setNative(isNativeShell())
  }, [])

  useEffect(() => {
    if (!syncNativeChrome || !isNativeShell()) return
    postToNative({ type: 'chrome', title, showBack })
    return () => {
      postToNative({ type: 'chrome', title: null, showBack: null })
    }
  }, [title, showBack, syncNativeChrome])

  // Native: başlık Flutter’da. Header null olursa kart native bar’a yapışır.
  if (native && syncNativeChrome) {
    if (!trailing) {
      return <div className={cn('h-4 shrink-0', className)} aria-hidden />
    }
    return (
      <div
        className={cn(
          'flex items-center justify-end gap-2 bg-transparent px-4 pt-3 pb-2',
          className,
        )}
      >
        {trailing}
      </div>
    )
  }

  return (
    <header
      className={cn(
        'flex items-center gap-3 px-4 pt-4 pb-3 bg-transparent',
        className,
      )}
    >
      {showBack && (
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Geri"
          className="flex items-center justify-center w-11 h-11 -ml-2 rounded-xl text-muted-foreground active:bg-surface-2 transition-colors"
        >
          <ChevronLeft size={22} />
        </button>
      )}

      <h1 className="flex-1 text-lg font-semibold text-foreground tracking-tight">
        {title}
      </h1>

      {trailing && <div className="flex items-center">{trailing}</div>}
    </header>
  )
}
