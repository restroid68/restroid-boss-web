'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  AlertTriangle,
  Building2,
  ChevronRight,
  Receipt,
  Scale,
  Wallet,
} from 'lucide-react'
import { BossMBottomSheet } from '@/components/boss/BossMBottomSheet'
import { postToNative } from '@/lib/boss-bridge'
import {
  loadAnaFinanceSheet,
  type AnaFinanceRow,
  type AnaFinanceSheetKind,
  type AnaFinanceSheetLine,
} from '@/lib/boss-p0-data'
import { formatBossDayChip, istanbulYmd } from '@/lib/boss-wall-clock'
import { cn } from '@/lib/utils'

const CARD_ICON = {
  kasa: Wallet,
  banka: Building2,
  cekmece: Scale,
  gider: Receipt,
} as const

function emptyCopy(
  kind: AnaFinanceSheetKind,
  chip: string,
): { title: string; description: string } {
  if (kind === 'kasa') {
    return { title: `${chip} nakit hareketi yok`, description: 'Nakit giriş ve çıkış burada listelenir.' }
  }
  if (kind === 'banka') {
    return { title: `${chip} banka hareketi yok`, description: 'Kart ve banka tahsilatı burada listelenir.' }
  }
  if (kind === 'cekmece') {
    return { title: `${chip} vardiya yok`, description: 'Nakit teslim kayıtları burada listelenir.' }
  }
  return { title: `${chip} gider yok`, description: 'Kaydedilen giderler burada listelenir.' }
}

const FOOTER: Record<AnaFinanceSheetKind, { href: string; label: string }> = {
  kasa: { href: '/boss-m/kasa', label: 'Kasa defteri' },
  banka: { href: '/boss-m/kasa', label: 'Kasa & banka' },
  cekmece: { href: '/boss-m/raporlar/vardiya', label: 'Nakit vardiya' },
  gider: { href: '/boss-m/kasa/hareket?type=gider', label: 'Gider kaydet' },
}

function isSheetKind(key: string): key is AnaFinanceSheetKind {
  return key === 'kasa' || key === 'banka' || key === 'cekmece' || key === 'gider'
}

export function BossMFinanceSnapshot({
  rows,
  day,
}: {
  rows: AnaFinanceRow[]
  day?: string
}) {
  const selectedDay = day ?? istanbulYmd()
  const chip = formatBossDayChip(selectedDay)
  const [open, setOpen] = useState<AnaFinanceRow | null>(null)
  const [lines, setLines] = useState<AnaFinanceSheetLine[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open || !isSheetKind(open.key)) {
      setLines([])
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    void loadAnaFinanceSheet(open.key, selectedDay).then((data) => {
      if (cancelled) return
      setLines(data.lines)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [open, selectedDay])

  if (!rows.length) return null

  function openSheet(row: AnaFinanceRow) {
    postToNative({ type: 'haptic', style: 'selection' })
    setLines([])
    setLoading(true)
    setOpen(row)
  }

  const kind = open && isSheetKind(open.key) ? open.key : null
  const empty = kind ? emptyCopy(kind, chip) : null
  const footer = kind ? FOOTER[kind] : null

  return (
    <section className="mx-4 overflow-hidden rounded-2xl border border-border bg-card">
      <div className="px-4 pb-1 pt-3.5">
        <h2 className="boss-card-title">Kasa · Banka · Çekmece</h2>
      </div>
      <div className="grid grid-cols-2 gap-2 px-3 pb-3 pt-1">
        {rows.map((row) => {
          const Icon = isSheetKind(row.key) ? CARD_ICON[row.key] : Wallet
          return (
            <button
              key={row.key}
              type="button"
              onClick={() => openSheet(row)}
              className="boss-inset-row flex flex-col gap-2 rounded-xl border px-3 py-2.5 text-left active:scale-[0.98] transition-transform"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 min-w-0">
                  <Icon size={13} className="shrink-0 text-muted-foreground" />
                  <span className="truncate text-[11px] font-medium text-muted-foreground">
                    {row.label}
                  </span>
                </span>
                {row.status === 'warning' ? (
                  <AlertTriangle size={13} className="shrink-0 text-warning" />
                ) : (
                  <ChevronRight size={13} className="shrink-0 text-muted-foreground/70" />
                )}
              </div>
              <p className="text-sm font-semibold tabular-nums text-foreground">{row.value}</p>
              <p className="text-[11px] leading-tight text-muted-foreground">{row.detail}</p>
            </button>
          )
        })}
      </div>

      <BossMBottomSheet
        open={Boolean(open)}
        title={open?.label ?? ''}
        subtitle={open ? `${open.value} · ${open.detail}` : undefined}
        onClose={() => setOpen(null)}
        footer={
          footer ? (
            <Link
              href={footer.href}
              onClick={() => setOpen(null)}
              className="flex h-11 w-full items-center justify-center rounded-xl border border-border bg-card text-sm font-semibold text-foreground active:bg-surface-2"
            >
              {footer.label}
            </Link>
          ) : null
        }
      >
        {loading ? (
          <div className="flex flex-col gap-2 py-1">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-surface-2" />
            ))}
          </div>
        ) : lines.length === 0 ? (
          <div className="px-2 py-10 text-center">
            <p className="text-sm font-medium text-foreground">{empty?.title}</p>
            <p className="mt-1 text-xs text-muted-foreground">{empty?.description}</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-surface-2/80">
            <div className="flex flex-col divide-y divide-border">
              {lines.map((line) => (
                <div key={line.id} className="flex items-start gap-3 px-3.5 py-3">
                  <div
                    className={cn(
                      'mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full',
                      line.sign === 'positive'
                        ? 'bg-success'
                        : line.sign === 'negative'
                          ? 'bg-danger'
                          : 'bg-muted-foreground/50',
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-snug break-words text-foreground">
                      {line.title}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {line.time}
                      {line.sub ? ` · ${line.sub}` : ''}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'shrink-0 text-sm font-bold tabular-nums',
                      line.sign === 'positive'
                        ? 'text-success'
                        : line.sign === 'negative'
                          ? 'text-danger'
                          : 'text-foreground',
                    )}
                  >
                    {line.amount}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </BossMBottomSheet>
    </section>
  )
}
