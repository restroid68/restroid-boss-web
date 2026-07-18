'use client'

import { ChevronLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface BossMPageHeaderProps {
  title: string
  showBack?: boolean
  trailing?: React.ReactNode
  className?: string
}

export function BossMPageHeader({
  title,
  showBack = false,
  trailing,
  className,
}: BossMPageHeaderProps) {
  const router = useRouter()

  return (
    <header
      className={cn(
        'flex items-center gap-3 px-4 pt-4 pb-3 bg-background',
        className
      )}
    >
      {showBack && (
        <button
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

      {trailing && (
        <div className="flex items-center">
          {trailing}
        </div>
      )}
    </header>
  )
}
