'use client'

import type { PaymentSlice } from '@/lib/boss-mock'

interface BossMPaymentDonutProps {
  slices: PaymentSlice[]
  total: string
}

export function BossMPaymentDonut({ slices, total }: BossMPaymentDonutProps) {
  const R = 54
  const r = 36
  const cx = 70
  const cy = 70
  const gap = 2.5

  let currentAngle = -90

  function polarToCart(angle: number, radius: number) {
    const rad = (angle * Math.PI) / 180
    return {
      x: cx + radius * Math.cos(rad),
      y: cy + radius * Math.sin(rad),
    }
  }

  function makeArc(startAngle: number, sweepDeg: number, outerR: number, innerR: number) {
    const start1 = polarToCart(startAngle, outerR)
    const end1 = polarToCart(startAngle + sweepDeg, outerR)
    const start2 = polarToCart(startAngle + sweepDeg, innerR)
    const end2 = polarToCart(startAngle, innerR)
    const largeArc = sweepDeg > 180 ? 1 : 0
    return [
      `M ${start1.x} ${start1.y}`,
      `A ${outerR} ${outerR} 0 ${largeArc} 1 ${end1.x} ${end1.y}`,
      `L ${start2.x} ${start2.y}`,
      `A ${innerR} ${innerR} 0 ${largeArc} 0 ${end2.x} ${end2.y}`,
      'Z',
    ].join(' ')
  }

  const usable = slices.filter((s) => Number.isFinite(s.value) && s.value > 0)
  const arcs =
    usable.length === 0
      ? []
      : usable.map((s) => {
          const portion = (s.value / 100) * 360
          const sweep = Math.max(portion - gap, 0.5)
          const path = makeArc(currentAngle + gap / 2, sweep, R, r)
          currentAngle += portion
          return { ...s, path }
        })

  return (
    <div className="mx-4 rounded-2xl border border-border bg-card/90 p-4 backdrop-blur-[2px]">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Ödeme Dağılımı
      </span>

      <div className="mt-4 flex items-center gap-5">
        <div className="shrink-0">
          <svg width={140} height={140} viewBox="0 0 140 140">
            {arcs.length === 0 ? (
              <circle
                cx={cx}
                cy={cy}
                r={(R + r) / 2}
                fill="none"
                stroke="var(--border)"
                strokeWidth={R - r}
              />
            ) : (
              arcs.map((arc, i) => <path key={i} d={arc.path} fill={arc.color} />)
            )}
            <text
              x={cx}
              y={cy - 6}
              textAnchor="middle"
              fontSize={9}
              fill="var(--muted-foreground)"
              fontFamily="inherit"
            >
              Toplam
            </text>
            <text
              x={cx}
              y={cy + 10}
              textAnchor="middle"
              fontSize={13}
              fontWeight={700}
              fill="var(--foreground)"
              fontFamily="inherit"
            >
              {total}
            </text>
          </svg>
        </div>

        <div className="flex flex-1 flex-col gap-2.5">
          {usable.length === 0 ? (
            <p className="text-xs text-muted-foreground">Bugün için ödeme kırılımı yok.</p>
          ) : (
            usable.map((s) => (
              <div key={s.label} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: s.color }}
                  />
                  <span className="text-[11px] text-muted-foreground">{s.label}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-semibold tabular-nums text-foreground">
                    {s.amount}
                  </span>
                  <span className="text-[10px] tabular-nums text-muted-foreground">{s.value}%</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
