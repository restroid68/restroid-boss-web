import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface BossMEmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function BossMEmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: BossMEmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 py-14 px-8 text-center',
        className
      )}
    >
      <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-surface-2 text-muted-foreground">
        <Icon size={26} strokeWidth={1.5} />
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        {description && (
          <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
        )}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  )
}
