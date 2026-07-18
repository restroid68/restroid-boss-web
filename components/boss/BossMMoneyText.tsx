import { cn } from '@/lib/utils'

type Props = {
  /** Formatlanmış tutar (₺ öneki olmadan) */
  amount: string
  currency?: string
  className?: string
  amountClassName?: string
  currencyClassName?: string
}

/** Gösterim: tutar sağa, para birimi sağda pasif yuva. */
export function BossMMoneyText({
  amount,
  currency = '₺',
  className,
  amountClassName,
  currencyClassName,
}: Props) {
  return (
    <span className={cn('inline-flex items-baseline justify-end gap-1 tabular-nums', className)}>
      <span className={cn('font-bold', amountClassName)}>{amount}</span>
      <span
        className={cn(
          'text-[0.85em] font-semibold text-muted-foreground',
          currencyClassName,
        )}
      >
        {currency}
      </span>
    </span>
  )
}
