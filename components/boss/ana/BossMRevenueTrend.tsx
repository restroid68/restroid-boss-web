'use client'

import { formatMoneyTR } from '@/lib/boss-api'
import type { AnaRevenuePoint } from '@/lib/boss-p0-data'

export function BossMRevenueTrend({ points }: { points: AnaRevenuePoint[] }) {
  if (points.length < 2) return null

  const peak = Math.max(...points.map((p) => p.ciro), 1)
  const w = 320
  const h = 112
  const padX = 8
  const padY = 12
  const innerW = w - padX * 2
  const innerH = h - padY * 2
  const coords = points.map((p, i) => {
    const x = padX + (points.length <= 1 ? innerW / 2 : (i / (points.length - 1)) * innerW)
    const y = padY + innerH - (p.ciro / peak) * innerH
    return { x, y, ...p }
  })
  const path = coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ')
  const area =
    coords.length > 1
      ? `${path} L${coords[coords.length - 1]!.x.toFixed(1)},${(padY + innerH).toFixed(1)} L${coords[0]!.x.toFixed(1)},${(padY + innerH).toFixed(1)} Z`
      : ''

  return (
    <section className="mx-4 overflow-hidden rounded-2xl border border-border bg-card">
      <div className="px-4 pb-1 pt-3.5">
        <h2 className="boss-card-title">Haftalık ciro</h2>
      </div>
      <div className="px-2 pb-2 pt-1">
        <svg
          viewBox={`0 0 ${w} ${h}`}
          className="h-[112px] w-full"
          style={{ color: 'var(--boss-glow)' }}
          role="img"
          aria-label="Haftalık ciro"
        >
          <defs>
            <linearGradient id="anaCiroFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.32" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          {area ? <path d={area} fill="url(#anaCiroFill)" /> : null}
          {path ? <path d={path} fill="none" stroke="currentColor" strokeWidth="2" /> : null}
          {coords.map((c, i) => (
            <circle key={i} cx={c.x} cy={c.y} r="2.4" fill="currentColor">
              <title>{`${c.day}: ₺${formatMoneyTR(c.ciro)}`}</title>
            </circle>
          ))}
        </svg>
        <div className="flex justify-between px-2 pb-3">
          {points.map((p) => (
            <span key={p.day} className="w-7 text-center text-[9px] text-muted-foreground">
              {p.day}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
