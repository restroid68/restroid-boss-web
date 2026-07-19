'use client'

import { formatMoneyTR } from '@/lib/boss-api'
import type { BossAiAskApiChart } from '@/lib/boss-p0-data'

type Point = { label: string; value: number }

function maxOf(...series: Point[][]): number {
  let m = 0
  for (const s of series) {
    for (const p of s) {
      const v = Number(p.value)
      if (Number.isFinite(v) && v > m) m = v
    }
  }
  return m > 0 ? m : 1
}

function money(v: number) {
  return `${formatMoneyTR(Number(v) || 0)} TL`
}

export function AiBarCompareChart({
  title,
  series,
  seriesB,
  seriesALabel,
  seriesBLabel,
}: {
  title?: string
  series: Point[]
  seriesB?: Point[]
  seriesALabel?: string
  seriesBLabel?: string
}) {
  const a = series[0]
  const b = seriesB?.[0]
  const aVal = Number(a?.value ?? 0)
  const bVal = Number(b?.value ?? 0)
  const peak = maxOf([{ label: 'a', value: aVal }], [{ label: 'b', value: bVal }])
  const aH = Math.max(8, Math.round((aVal / peak) * 96))
  const bH = Math.max(8, Math.round((bVal / peak) * 96))

  return (
    <div className="rounded-xl border border-border bg-surface-3 overflow-hidden">
      <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border-b border-border">
        {title || 'Karşılaştırma'}
      </p>
      <div className="flex items-end justify-center gap-8 px-4 pt-4 pb-2 h-[132px]">
        <div className="flex flex-col items-center gap-1.5 min-w-[64px]">
          <span className="text-[10px] font-semibold tabular-nums text-foreground">{money(aVal)}</span>
          <div
            className="w-12 rounded-t-md bg-muted-foreground/35"
            style={{ height: aH }}
            title={seriesALabel || a?.label}
          />
          <span className="text-[10px] text-muted-foreground text-center max-w-[72px] truncate">
            {seriesALabel || a?.label || 'A'}
          </span>
        </div>
        <div className="flex flex-col items-center gap-1.5 min-w-[64px]">
          <span className="text-[10px] font-semibold tabular-nums text-foreground">{money(bVal)}</span>
          <div
            className="w-12 rounded-t-md bg-primary/80"
            style={{ height: bH }}
            title={seriesBLabel || b?.label}
          />
          <span className="text-[10px] text-muted-foreground text-center max-w-[72px] truncate">
            {seriesBLabel || b?.label || 'B'}
          </span>
        </div>
      </div>
    </div>
  )
}

export function AiBarSeriesChart({ title, series }: { title?: string; series: Point[] }) {
  const pts = series.slice(0, 14)
  const peak = maxOf(pts)
  return (
    <div className="rounded-xl border border-border bg-surface-3 overflow-hidden">
      <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border-b border-border">
        {title || 'Grafik'}
      </p>
      <div className="flex items-end gap-1 px-3 pt-3 pb-2 h-[120px] overflow-x-auto">
        {pts.map((p, i) => {
          const h = Math.max(4, Math.round((Number(p.value) / peak) * 88))
          return (
            <div key={`${p.label}-${i}`} className="flex flex-col items-center gap-1 min-w-[18px] flex-1">
              <div
                className="w-full max-w-[22px] rounded-t bg-primary/75"
                style={{ height: h }}
                title={`${p.label}: ${money(Number(p.value))}`}
              />
              <span className="text-[8px] text-muted-foreground truncate max-w-[28px]">{p.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function AiLineSeriesChart({ title, series }: { title?: string; series: Point[] }) {
  const pts = series.slice(0, 31)
  const peak = maxOf(pts)
  const w = 280
  const h = 100
  const padX = 8
  const padY = 10
  const innerW = w - padX * 2
  const innerH = h - padY * 2
  const coords = pts.map((p, i) => {
    const x = padX + (pts.length <= 1 ? innerW / 2 : (i / (pts.length - 1)) * innerW)
    const y = padY + innerH - (Number(p.value) / peak) * innerH
    return { x, y, ...p }
  })
  const path = coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ')
  const area =
    coords.length > 1
      ? `${path} L${coords[coords.length - 1]!.x.toFixed(1)},${(padY + innerH).toFixed(1)} L${coords[0]!.x.toFixed(1)},${(padY + innerH).toFixed(1)} Z`
      : ''

  return (
    <div className="rounded-xl border border-border bg-surface-3 overflow-hidden">
      <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border-b border-border">
        {title || 'Trend'}
      </p>
      <div className="px-2 pt-2 pb-1">
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-[110px]" role="img" aria-label={title || 'Trend'}>
          <defs>
            <linearGradient id="aiLineFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.28" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          <g className="text-primary">
            {area ? <path d={area} fill="url(#aiLineFill)" /> : null}
            {path ? <path d={path} fill="none" stroke="currentColor" strokeWidth="2" /> : null}
            {coords.map((c, i) => (
              <circle key={i} cx={c.x} cy={c.y} r="2.5" fill="currentColor">
                <title>{`${c.label}: ${money(Number(c.value))}`}</title>
              </circle>
            ))}
          </g>
        </svg>
        <div className="flex justify-between px-1 pb-2">
          <span className="text-[9px] text-muted-foreground truncate">{pts[0]?.label}</span>
          <span className="text-[9px] text-muted-foreground truncate">{pts[pts.length - 1]?.label}</span>
        </div>
      </div>
    </div>
  )
}

export function AiChartsBlock({ charts }: { charts: BossAiAskApiChart[] }) {
  if (!charts?.length) return null
  return (
    <div className="space-y-2">
      {charts.map((c, i) => {
        const series = (c.series ?? []).map((s) => ({
          label: String(s.label ?? ''),
          value: Number(s.value ?? 0),
        }))
        if (!series.length) return null
        const key = `${c.type ?? 'bar'}-${c.title ?? i}`
        if (c.type === 'compare' || c.seriesB?.length) {
          return (
            <AiBarCompareChart
              key={key}
              title={c.title}
              series={series}
              seriesB={(c.seriesB ?? []).map((s) => ({
                label: String(s.label ?? ''),
                value: Number(s.value ?? 0),
              }))}
              seriesALabel={c.seriesALabel}
              seriesBLabel={c.seriesBLabel}
            />
          )
        }
        if (c.type === 'line') {
          return <AiLineSeriesChart key={key} title={c.title} series={series} />
        }
        return <AiBarSeriesChart key={key} title={c.title} series={series} />
      })}
    </div>
  )
}
