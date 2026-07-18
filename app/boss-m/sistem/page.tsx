'use client'

import Link from 'next/link'
import {
  Signal,
  CreditCard,
  LayoutGrid,
  Flame,
  MonitorSmartphone,
  ChevronRight,
  Type,
  Palette,
} from 'lucide-react'
import { BossMPageHeader } from '@/components/boss/BossMPageHeader'
import { SISTEM_CARDS } from '@/lib/boss-mock'
import { useBossLoad } from '@/hooks/use-boss-load'
import { loadSistemHub } from '@/lib/boss-page-data'

const ICON_MAP: Record<string, React.ElementType> = {
  type: Type,
  palette: Palette,
  signal:       Signal,
  'credit-card': CreditCard,
  layout:       LayoutGrid,
  flame:        Flame,
  remote:       MonitorSmartphone,
}

const ACCENT_CYCLE = [
  'text-primary   bg-primary/10',
  'text-info      bg-info/10',
  'text-warning   bg-warning/10',
  'text-danger    bg-danger/10',
  'text-success   bg-success/10',
]

export default function BossMSistemPage() {
  const { data, loading } = useBossLoad(loadSistemHub, {
    cards: SISTEM_CARDS,
    source: 'mock',
  })

  return (
    <main className="flex flex-col gap-0 pb-4">
      <BossMPageHeader title="Sistem Ayarları" showBack />

      <p className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed">
        Restoranınızın operasyonel ayarlarını bu ekrandan yönetin.
        Değişiklikler anlık sisteme yansır.
      </p>

      <div className="flex flex-col gap-2 px-4">
        {loading ? (
          <div className="flex flex-col gap-2 animate-pulse">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="h-20 bg-surface-2 rounded-2xl" />
            ))}
          </div>
        ) : (
          data.cards.map((card, idx) => {
            const Icon   = ICON_MAP[card.icon] ?? Signal
            const accent = ACCENT_CYCLE[idx % ACCENT_CYCLE.length]

            return (
              <Link
                key={card.id}
                href={card.href}
                className="flex items-center gap-4 bg-card border border-border rounded-2xl px-4 py-4 active:scale-[0.98] transition-transform"
              >
                <div
                  className={`flex items-center justify-center w-12 h-12 rounded-xl shrink-0 ${accent}`}
                >
                  <Icon size={22} strokeWidth={1.6} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground leading-tight">
                      {card.title}
                    </p>
                    {card.badge && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-surface-2 text-muted-foreground font-medium shrink-0">
                        {card.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                    {card.description}
                  </p>
                </div>

                <ChevronRight size={16} className="text-muted-foreground shrink-0" />
              </Link>
            )
          })
        )}
      </div>

      <p className="text-center text-[11px] text-muted-foreground/40 mt-6 px-4">
        RestroidBOSS v2.4.1
      </p>
    </main>
  )
}
