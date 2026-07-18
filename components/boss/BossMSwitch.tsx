'use client'

import { cn } from '@/lib/utils'

/** Panel `panel-switch` benzeri: emerald açık / rose kapalı, beyaz thumb. */
export function BossMSwitch({
  checked,
  onChange,
  danger,
  className,
  'aria-label': ariaLabel,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  /** Açıkken kırmızı (ör. tükendi) */
  danger?: boolean
  className?: string
  'aria-label'?: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors',
        checked
          ? danger
            ? 'border-danger/40 bg-danger'
            : 'border-primary/40 bg-primary'
          : 'border-rose-500/35 bg-rose-500/80',
        className,
      )}
    >
      <span
        className={cn(
          'pointer-events-none absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-white shadow transition-transform',
          checked ? 'left-[calc(100%-1.375rem)]' : 'left-1',
        )}
      />
    </button>
  )
}
