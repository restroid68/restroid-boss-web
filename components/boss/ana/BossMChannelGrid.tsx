import { cn } from '@/lib/utils'
import type { ChannelCard } from '@/lib/boss-mock'

const variantMap = {
  neutral: 'text-foreground',
  success: 'text-success',
  warning: 'text-warning',
  danger:  'text-danger',
}

const bgMap = {
  neutral: '',
  success: 'border-success/20',
  warning: 'border-warning/20',
  danger:  'border-danger/20 bg-danger/5',
}

interface BossMChannelGridProps {
  channels: ChannelCard[]
}

export function BossMChannelGrid({ channels }: BossMChannelGridProps) {
  return (
    <div className="grid grid-cols-2 gap-2 px-4">
      {channels.map((c) => (
        <button
          key={c.key}
          className={cn(
            'bg-card border border-border rounded-xl p-3.5 flex flex-col gap-1 text-left active:scale-[0.97] transition-transform',
            bgMap[c.variant]
          )}
        >
          <span className="text-xs text-muted-foreground font-medium">
            {c.label}
          </span>
          <span
            className={cn(
              'text-xl font-bold tabular-nums leading-tight',
              variantMap[c.variant]
            )}
          >
            {c.value}
          </span>
        </button>
      ))}
    </div>
  )
}
