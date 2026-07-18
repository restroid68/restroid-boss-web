'use client'

import { useEffect, useRef, useState } from 'react'
import {
  formatMoneyTypingDisplay,
  parseMoneyTR,
  sanitizeMoneyTyping,
} from '@/lib/boss-money'
import { cn } from '@/lib/utils'

type Props = {
  value: string
  onChange: (raw: string) => void
  /** Blur’da formatlanmış gösterim */
  onBlurAmount?: (n: number) => void
  currency?: string
  placeholder?: string
  disabled?: boolean
  className?: string
  inputClassName?: string
  accentClassName?: string
  autoFocus?: boolean
  id?: string
}

/**
 * Sağa hizalı tutar + sağda pasif para birimi yuvası (₺).
 * Yazarken ham string; blur’da parse.
 */
export function BossMMoneyInput({
  value,
  onChange,
  onBlurAmount,
  currency = '₺',
  placeholder = '0',
  disabled,
  className,
  inputClassName,
  accentClassName,
  autoFocus,
  id,
}: Props) {
  const ref = useRef<HTMLInputElement>(null)
  const [focused, setFocused] = useState(false)
  const display = formatMoneyTypingDisplay(value)

  useEffect(() => {
    if (autoFocus) ref.current?.focus()
  }, [autoFocus])

  return (
    <div
      className={cn(
        'flex h-14 items-stretch overflow-hidden rounded-xl border bg-card/90 transition-all',
        focused ? 'border-primary/50 ring-2 ring-primary/30' : 'border-border',
        className,
      )}
    >
      <input
        ref={ref}
        id={id}
        type="text"
        inputMode="decimal"
        disabled={disabled}
        placeholder={placeholder}
        value={display}
        onChange={(e) => onChange(sanitizeMoneyTyping(e.target.value))}
        onFocus={(e) => {
          setFocused(true)
          requestAnimationFrame(() => {
            e.currentTarget.scrollIntoView({ block: 'center', behavior: 'smooth' })
            e.currentTarget.select()
          })
        }}
        onBlur={() => {
          setFocused(false)
          onBlurAmount?.(parseMoneyTR(value))
        }}
        className={cn(
          'min-w-0 flex-1 bg-transparent px-4 text-right text-2xl font-bold tabular-nums text-foreground outline-none placeholder:text-muted-foreground/40',
          accentClassName,
          inputClassName,
        )}
      />
      <div
        aria-hidden
        className="flex w-14 shrink-0 items-center justify-center border-l border-border bg-surface-2/80 text-sm font-semibold text-muted-foreground"
      >
        {currency}
      </div>
    </div>
  )
}
