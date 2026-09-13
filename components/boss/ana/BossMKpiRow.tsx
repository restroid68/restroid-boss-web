import { cn } from '@/lib/utils'
import type { KpiMetric } from '@/lib/boss-mock'
import {
  Activity,
  ArrowDown,
  ArrowUp,
  Banknote,
  Minus,
  Receipt,
  ShoppingBag,
  type LucideIcon,
} from 'lucide-react'

interface BossMKpiRowProps {
  metrics: KpiMetric[]
}

type KpiTone = {
  Icon: LucideIcon
  bar: string
  orb: string
  iconBox: string
}

const FALLBACK_TONES: KpiTone[] = [
  {
    Icon: Banknote,
    bar: 'bg-[#F5B400]',
    orb: 'bg-[#F5B400]/30',
    iconBox: 'border-[#F5B400]/35 bg-[#F5B400]/15 text-[#F5B400]',
  },
  {
    Icon: Receipt,
    bar: 'bg-sky-400',
    orb: 'bg-sky-400/30',
    iconBox: 'border-sky-400/35 bg-sky-400/15 text-sky-200',
  },
  {
    Icon: ShoppingBag,
    bar: 'bg-violet-400',
    orb: 'bg-violet-400/30',
    iconBox: 'border-violet-400/35 bg-violet-400/15 text-violet-200',
  },
  {
    Icon: Activity,
    bar: 'bg-emerald-400',
    orb: 'bg-emerald-400/30',
    iconBox: 'border-emerald-400/35 bg-emerald-400/15 text-emerald-200',
  },
]

function toneFor(label: string, index: number): KpiTone {
  const l = label.toLowerCase()
  if (l.includes('ciro')) return FALLBACK_TONES[0]!
  if (l.includes('canlı')) return FALLBACK_TONES[3]!
  if (l.includes('sepet')) return FALLBACK_TONES[2]!
  if (l.includes('sipariş') || l.includes('fiş')) return FALLBACK_TONES[1]!
  return FALLBACK_TONES[index % FALLBACK_TONES.length]!
}

export function BossMKpiRow({ metrics }: BossMKpiRowProps) {
  return (
    <div className="grid grid-cols-2 gap-2.5 px-4">
      {metrics.map((m, i) => {
        const showTrend = !m.neutral && Math.abs(m.delta) >= 0.05
        const tone = toneFor(m.label, i)
        const Icon = tone.Icon
        return (
          <div
            key={m.label}
            className="relative flex flex-col gap-2 overflow-hidden rounded-2xl border border-border bg-card px-3.5 py-3"
          >
            <span
              className={cn('pointer-events-none absolute inset-x-0 top-0 h-0.5', tone.bar)}
              aria-hidden
            />
            <span
              className={cn(
                'pointer-events-none absolute -bottom-10 -left-8 h-24 w-24 rounded-full blur-2xl',
                tone.orb,
              )}
              aria-hidden
            />
            <div className="relative flex items-start justify-between gap-2">
              <span className="text-[11px] font-medium tracking-wide text-muted-foreground">
                {m.label}
              </span>
              <span
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border',
                  tone.iconBox,
                )}
              >
                <Icon size={14} strokeWidth={2} />
              </span>
            </div>
            <div className="relative flex items-end justify-between gap-2">
              <div className="min-w-0">
                <p className="whitespace-nowrap text-xl font-bold leading-tight tabular-nums text-foreground">
                  {m.value}
                  {m.unit ? (
                    <span className="ml-0.5 text-[0.7em] font-semibold text-muted-foreground">
                      {m.unit}
                    </span>
                  ) : null}
                </p>
                {m.description ? (
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{m.description}</p>
                ) : null}
              </div>
              {m.neutral ? (
                <span className="inline-flex shrink-0 items-center gap-0.5 rounded-md border border-emerald-400/25 bg-emerald-400/12 px-1.5 py-0.5 text-[10px] font-medium text-emerald-200">
                  <Minus size={10} strokeWidth={2.4} />
                  canlı
                </span>
              ) : showTrend ? (
                <span
                  className={cn(
                    'inline-flex shrink-0 items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-semibold tabular-nums',
                    m.delta >= 0 ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger',
                  )}
                >
                  {m.delta >= 0 ? (
                    <ArrowUp size={10} strokeWidth={2.4} />
                  ) : (
                    <ArrowDown size={10} strokeWidth={2.4} />
                  )}
                  {Math.abs(m.delta)}%
                </span>
              ) : null}
            </div>
          </div>
        )
      })}
    </div>
  )
}
