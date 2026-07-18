'use client'

import type { PaymentSlice } from '@/lib/boss-mock'

interface BossMPaymentDonutProps {
  slices: PaymentSlice[]
  total: string
}

export function BossMPaymentDonut({ slices, total }: BossMPaymentDonutProps) {
  // Build SVG donut from arc segments
  const R = 54
  const r = 36
  const cx = 70
  const cy = 70
  const gap = 2.5  // degrees gap between segments

  let currentAngle = -90 // start at top

  function polarToCart(angle: number, radius: number) {
    const rad = (angle * Math.PI) / 180
    return {
      x: cx + radius * Math.cos(rad),
      y: cy + radius * Math.sin(rad),
    }
  }

  function makeArc(startAngle: number, sweepDeg: number, outerR: number, innerR: number) {
    const start1 = polarToCart(startAngle, outerR)
    const end1   = polarToCart(startAngle + sweepDeg, outerR)
    const start2 = polarToCart(startAngle + sweepDeg, innerR)
    const end2   = polarToCart(startAngle, innerR)
    const largeArc = sweepDeg > 180 ? 1 : 0
    return [
      `M ${start1.x} ${start1.y}`,
      `A ${outerR} ${outerR} 0 ${largeArc} 1 ${end1.x} ${end1.y}`,
      `L ${start2.x} ${start2.y}`,
      `A ${innerR} ${innerR} 0 ${largeArc} 0 ${end2.x} ${end2.y}`,
      'Z',
    ].join(' ')
  }

  const arcs = slices.map((s) => {
    const sweep = (s.value / 100) * 360 - gap
    const path = makeArc(currentAngle + gap / 2, sweep, R, r)
    currentAngle += (s.value / 100) * 360
    return { ...s, path }
  })

  return (
    <div className="mx-4 bg-card rounded-2xl border border-border p-4">
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Ödeme Dağılımı
      </span>

      <div className="flex items-center gap-5 mt-4">
        {/* Donut SVG */}
        <div className="shrink-0">
          <svg width={140} height={140} viewBox="0 0 140 140">
            {arcs.map((arc, i) => (
              <path key={i} d={arc.path} fill={arc.color} />
            ))}
            {/* Center label */}
            <text x={cx} y={cy - 6} textAnchor="middle" fontSize={9} fill="oklch(0.55 0.010 230)" fontFamily="Inter, sans-serif">
              Toplam
            </text>
            <text x={cx} y={cy + 9} textAnchor="middle" fontSize={13} fontWeight={700} fill="oklch(0.93 0.008 220)" fontFamily="Inter, sans-serif">
              {total}
            </text>
          </svg>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-2.5 flex-1">
          {slices.map((s) => (
            <div key={s.label} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: s.color }}
                />
                <span className="text-[11px] text-muted-foreground">{s.label}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold text-foreground tabular-nums">{s.amount}</span>
                <span className="text-[10px] text-muted-foreground tabular-nums">{s.value}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
