'use client'

import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  open: boolean
  title: string
  subtitle?: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
}

export function BossMBottomSheet({ open, title, subtitle, onClose, children, footer }: Props) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  if (typeof document === 'undefined') return null

  return createPortal(
    <div
      className="boss-over-native-nav flex flex-col justify-end bg-black/55"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="flex min-h-[52vh] max-h-[78vh] flex-col rounded-t-2xl border-t border-border bg-[var(--background)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 flex-col px-4 pt-2 pb-3">
          <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-border" aria-hidden />
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 pt-1">
              <p className="text-base font-semibold text-foreground">{title}</p>
              {subtitle ? (
                <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Kapat"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-muted-foreground active:bg-surface-2"
            >
              <X size={18} />
            </button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-3">
          {children}
        </div>
        {footer ? (
          <div className="shrink-0 border-t border-border px-4 py-3">{footer}</div>
        ) : null}
      </div>
    </div>,
    document.body,
  )
}
