import { cn } from '@/lib/utils'
import type { QuickTile } from '@/lib/boss-mock'

const variantStyles = {
  neutral: 'text-foreground border-border',
  success: 'text-success border-success/25',
  warning: 'text-warning border-warning/25',
  danger:  'text-danger  border-danger/25',
}

interface BossMQuickTilesProps {
  tiles: QuickTile[]
}

export function BossMQuickTiles({ tiles }: BossMQuickTilesProps) {
  return (
    <div className="grid grid-cols-2 gap-2 px-4">
      {tiles.map((t) => (
        <button
          key={t.label}
          className={cn(
            'bg-card border rounded-xl p-3.5 flex flex-col gap-0.5 text-left active:scale-[0.97] transition-transform',
            variantStyles[t.variant]
          )}
        >
          <span className="text-xs text-muted-foreground font-medium">{t.label}</span>
          <span className={cn('text-xl font-bold tabular-nums leading-tight', variantStyles[t.variant].split(' ')[0])}>
            {t.value}
          </span>
          {t.sub && (
            <span className="text-[10px] text-muted-foreground">{t.sub}</span>
          )}
        </button>
      ))}
    </div>
  )
}
