'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import { ShoppingBag, QrCode, BookOpen, AlertTriangle } from 'lucide-react'

export interface OperasyonChip {
  key: string
  label: string
  badge?: number
  href: string
  icon: React.ElementType
  /** danger → rose ring; warning → amber; default → muted border */
  variant?: 'default' | 'warning' | 'danger'
}

interface BossMOperasyonChipsProps {
  chips: OperasyonChip[]
}

const borderVariant = {
  default: 'border-border',
  warning: 'border-warning/40',
  danger:  'border-danger/40',
}

const iconVariant = {
  default: 'text-muted-foreground',
  warning: 'text-warning',
  danger:  'text-danger',
}

const badgeBg = {
  default: 'bg-primary    text-primary-foreground',
  warning: 'bg-warning    text-black',
  danger:  'bg-danger     text-white',
}

export function BossMOperasyonChips({ chips }: BossMOperasyonChipsProps) {
  return (
    /* horizontal scroll row — scrollbar hidden via globals */
    <div className="flex gap-2.5 px-4 overflow-x-auto no-scrollbar">
      {chips.map((chip) => {
        const Icon = chip.icon
        const v = chip.variant ?? 'default'
        return (
          <Link
            key={chip.key}
            href={chip.href}
            className={cn(
              'relative flex items-center gap-2 shrink-0',
              'bg-card border rounded-2xl px-3.5 h-11',
              'active:scale-[0.96] transition-transform',
              borderVariant[v],
            )}
          >
            <Icon
              size={15}
              strokeWidth={1.8}
              className={cn('shrink-0', iconVariant[v])}
            />
            <span className="text-sm font-medium text-foreground whitespace-nowrap">
              {chip.label}
            </span>
            {chip.badge != null && chip.badge > 0 && (
              <span
                className={cn(
                  'flex items-center justify-center',
                  'min-w-[18px] h-[18px] px-1 rounded-full',
                  'text-[10px] font-bold leading-none tabular-nums',
                  badgeBg[v],
                )}
              >
                {chip.badge > 99 ? '99+' : chip.badge}
              </span>
            )}
          </Link>
        )
      })}
    </div>
  )
}

// ── Pre-wired defaults (used inside this client module only) ─────────────────

const DEFAULT_CHIPS: OperasyonChip[] = [
  { key: 'online',   label: 'Online bekleyen', badge: 4,  href: '/boss-m/siparisler/online', icon: ShoppingBag,   variant: 'warning' },
  { key: 'qr',       label: 'QR bekleyen',     badge: 7,  href: '/boss-m/siparisler/qr',     icon: QrCode,        variant: 'default' },
  { key: 'hesaplar', label: 'Açık hesaplar',   badge: 12, href: '/boss-m/kasa',              icon: BookOpen,      variant: 'default' },
  { key: 'stok',     label: 'Kritik stok',     badge: 0,  href: '/boss-m/stok/kritik',       icon: AlertTriangle, variant: 'danger'  },
]

/**
 * Self-contained operasyon chip row.
 * Accepts optional badge overrides per chip key so server components can
 * inject live counts without importing the client-only icon objects.
 */
export function BossMOperasyonChipsRow({
  badgeOverrides = {},
}: {
  badgeOverrides?: Record<string, number>
}) {
  const chips = DEFAULT_CHIPS.map((c) =>
    c.key in badgeOverrides ? { ...c, badge: badgeOverrides[c.key] } : c,
  )
  return <BossMOperasyonChips chips={chips} />
}
