import Link from 'next/link'
import { Building2, ChevronRight } from 'lucide-react'
import type { Branch } from '@/lib/boss-mock'

interface BossMSubelerTeaserProps {
  branches: Branch[]
  /** Revenue strings keyed by branch id — optional, shown when provided */
  revenue?: Record<string, string>
}

export function BossMSubelerTeaser({ branches, revenue }: BossMSubelerTeaserProps) {
  return (
    <Link
      href="/boss-m/raporlar/sahip"
      className="mx-4 flex items-center gap-3 bg-card border border-border rounded-2xl px-4 py-3 active:scale-[0.98] transition-transform"
    >
      {/* Icon */}
      <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary/10 shrink-0">
        <Building2 size={17} strokeWidth={1.8} className="text-primary" />
      </div>

      {/* Branch avatars + label */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">Şubeler</p>
        <div className="flex items-center gap-1 mt-0.5">
          {branches.slice(0, 4).map((b) => (
            <span
              key={b.id}
              className="inline-flex items-center px-2 py-0.5 bg-surface-2 border border-border rounded-full text-[10px] font-medium text-muted-foreground"
            >
              {b.name}
              {revenue?.[b.id] && (
                <span className="ml-1 text-foreground font-semibold">{revenue[b.id]}</span>
              )}
            </span>
          ))}
          {branches.length > 4 && (
            <span className="text-[10px] text-muted-foreground">+{branches.length - 4}</span>
          )}
        </div>
      </div>

      <ChevronRight size={15} className="text-muted-foreground shrink-0" />
    </Link>
  )
}
