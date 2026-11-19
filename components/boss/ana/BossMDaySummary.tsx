'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Ban,
  ChevronRight,
  Clock,
  Flame,
  Gift,
  Info,
  type LucideIcon,
} from 'lucide-react'
import { BossMBottomSheet } from '@/components/boss/BossMBottomSheet'
import { postToNative } from '@/lib/boss-bridge'
import type {
  AnaDayDigest,
  AnaDayInsight,
  AnaDayTone,
  AnaLossKind,
  AnaLossRow,
  AnaShareRow,
} from '@/lib/boss-day-digest'
import { formatMoneyTR } from '@/lib/boss-money'
import { cn } from '@/lib/utils'

/* ─── Yardımcılar ─── */

function toneText(tone: AnaDayTone | undefined): string {
  if (tone === 'bad') return 'text-danger'
  if (tone === 'warn') return 'text-warning'
  if (tone === 'good') return 'text-success'
  return 'text-foreground'
}

const INSIGHT_STYLE: Record<AnaDayInsight['tone'], { box: string; icon: string; Icon: LucideIcon }> = {
  bad: { box: 'border-danger/30 bg-danger/10', icon: 'text-danger', Icon: AlertTriangle },
  warn: { box: 'border-warning/30 bg-warning/10', icon: 'text-warning', Icon: Clock },
  info: { box: 'border-border bg-surface-2', icon: 'text-primary', Icon: Info },
}

const LOSS_ICON: Record<AnaLossKind, LucideIcon> = {
  cancel: Ban,
  complimentary: Gift,
  waste: Flame,
}

const LOSS_SHEET_TITLE: Record<AnaLossKind, string> = {
  cancel: 'İptaller',
  complimentary: 'İkramlar',
  waste: 'Zayi kayıtları',
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={cn('mx-4 overflow-hidden rounded-2xl border border-border bg-card', className)}>
      {children}
    </section>
  )
}

function CardHead({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 px-4 pb-1 pt-3.5">
      <h2 className="boss-card-title">{title}</h2>
      {right ? <div className="min-w-0 truncate text-[11px] text-muted-foreground">{right}</div> : null}
    </div>
  )
}

/* ─── Gün özeti (üst kart) ─── */

function DayHero({ digest }: { digest: AnaDayDigest }) {
  const collect = digest.collectPct
  const delta = digest.deltaPct
  const showDelta = delta != null && Math.abs(delta) >= 0.05
  return (
    <section className="mx-4 rounded-3xl border border-border bg-card p-4" aria-label="Gün özeti">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-foreground">Gün özeti</h2>
        <div className="flex items-center gap-1.5">
          {digest.liveOrders != null && digest.liveOrders > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-success">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" aria-hidden />
              {digest.liveOrders} canlı sipariş
            </span>
          ) : null}
        </div>
      </div>

      <p className="mt-3 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Net satış</p>
      <div className="mt-0.5 flex flex-wrap items-end justify-between gap-x-3 gap-y-1">
        <p className="text-3xl font-bold tabular-nums tracking-tight text-foreground">{digest.netLabel}</p>
        {showDelta ? (
          <span
            className={cn(
              'mb-1 inline-flex shrink-0 items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[11px] font-semibold tabular-nums',
              delta! >= 0 ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger',
            )}
          >
            {delta! >= 0 ? <ArrowUp size={11} strokeWidth={2.4} /> : <ArrowDown size={11} strokeWidth={2.4} />}
            %{formatMoneyTR(Math.abs(delta!), Math.abs(delta!) >= 10 ? 0 : 1)}
            <span className="ml-0.5 font-medium opacity-80">önceki güne göre</span>
          </span>
        ) : null}
      </div>

      {/* Kapanan / açık — tahsilat oranı */}
      <div
        className="mt-3 h-2 overflow-hidden rounded-full bg-surface-2"
        role="img"
        aria-label={collect != null ? `Alınan ödeme oranı yüzde ${collect}` : 'Satış yok'}
      >
        <div
          className={cn('h-full rounded-full', collect != null && collect < 50 ? 'bg-warning' : 'bg-success')}
          style={{ width: `${collect == null ? 0 : Math.max(2, Math.min(100, collect))}%` }}
        />
      </div>
      <div className="mt-2 flex items-start justify-between gap-3 text-[11px]">
        <p className="text-muted-foreground">
          Kapanan <span className="font-semibold tabular-nums text-foreground">{digest.closedLabel}</span>
          <span className="mx-1.5 opacity-50">·</span>
          Açık{' '}
          <span className={cn('font-semibold tabular-nums', digest.openAmount > 0.009 ? 'text-warning' : 'text-foreground')}>
            {digest.openLabel}
          </span>
        </p>
        <p className="shrink-0 text-muted-foreground">
          Tahsilat{' '}
          <span className="font-semibold tabular-nums text-foreground">
            {collect != null ? `%${formatMoneyTR(collect, collect >= 99.95 || collect < 0.05 ? 0 : 1)}` : '—'}
          </span>
        </p>
      </div>

      {digest.stats.length > 0 ? (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {digest.stats.map((stat) => (
            <div key={stat.key} className="min-w-0 rounded-2xl bg-surface-2 px-3 py-2.5">
              <p className="text-[11px] font-medium text-muted-foreground">{stat.label}</p>
              <p className={cn('mt-0.5 truncate text-base font-bold tabular-nums', toneText(stat.tone))}>
                {stat.value}
              </p>
              {stat.hint ? (
                <p className="mt-0.5 truncate text-[10px] text-muted-foreground">{stat.hint}</p>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      {digest.insights.length > 0 ? (
        <ul className="mt-3 flex flex-col gap-1.5">
          {digest.insights.map((insight) => {
            const style = INSIGHT_STYLE[insight.tone]
            const Icon = style.Icon
            return (
              <li key={insight.key} className={cn('flex items-start gap-2 rounded-2xl border px-3 py-2', style.box)}>
                <Icon size={14} className={cn('mt-0.5 shrink-0', style.icon)} aria-hidden />
                <p className="text-xs leading-relaxed text-foreground">
                  <span className="font-semibold">{insight.title}: </span>
                  {insight.body}
                </p>
              </li>
            )
          })}
        </ul>
      ) : !digest.hasActivity ? (
        <p className="mt-3 rounded-2xl bg-surface-2 px-3 py-2 text-xs text-muted-foreground">
          {digest.isToday ? 'Bugün henüz satış veya hareket yok.' : 'Bu günde satış veya hareket yok.'}
        </p>
      ) : null}
    </section>
  )
}

/* ─── Saatlik satış ─── */

function HourlyCard({ digest }: { digest: AnaDayDigest }) {
  const points = digest.hourly
  if (points.length < 2) return null
  const max = Math.max(...points.map((p) => p.sales), 1)
  const labelEvery = points.length > 12 ? 3 : points.length > 6 ? 2 : 1
  return (
    <Card>
      <CardHead
        title="Saatlik satış"
        right={
          digest.peakHour ? (
            <>
              En yoğun <span className="font-semibold text-foreground">{digest.peakHour}</span> · {digest.peakLabel}
            </>
          ) : null
        }
      />
      <div className="px-4 pb-3.5 pt-2">
        <div className="flex h-24 items-end gap-1" role="img" aria-label="Saatlere göre satış">
          {points.map((p) => {
            const isPeak = p.hour === digest.peakHour
            const pct = p.sales > 0.0005 ? Math.max(4, (p.sales / max) * 100) : 0
            return (
              <div
                key={p.hour}
                className="flex h-full min-w-0 flex-1 items-end"
                title={`${p.hour} · ₺${formatMoneyTR(p.sales)}`}
              >
                <div
                  className={cn('w-full rounded-t-[4px]', isPeak ? 'bg-primary' : 'bg-primary/35')}
                  style={{ height: pct > 0 ? `${pct}%` : '2px', opacity: pct > 0 ? 1 : 0.35 }}
                />
              </div>
            )
          })}
        </div>
        <div className="mt-1.5 flex gap-1">
          {points.map((p, i) => (
            <span
              key={p.hour}
              className={cn(
                'min-w-0 flex-1 text-center text-[9px] tabular-nums',
                p.hour === digest.peakHour ? 'font-semibold text-foreground' : 'text-muted-foreground',
              )}
            >
              {i % labelEvery === 0 || p.hour === digest.peakHour ? p.hour.slice(0, 2) : ''}
            </span>
          ))}
        </div>
      </div>
    </Card>
  )
}

/* ─── İptal · İkram · Zayi ─── */

function LossCard({ digest }: { digest: AnaDayDigest }) {
  const [open, setOpen] = useState<AnaLossRow | null>(null)
  const any = digest.losses.some((row) => row.amount > 0.009 || row.count > 0)

  return (
    <Card>
      <CardHead title="İptal · İkram · Zayi" right={any ? `Toplam ${digest.lossTotalLabel}` : null} />
      {any ? (
        <div className="flex flex-col divide-y divide-border px-2 pb-1.5">
          {digest.losses.map((row) => {
            const Icon = LOSS_ICON[row.kind]
            const hasDetail = row.events.length > 0
            const active = row.amount > 0.009 || row.count > 0
            return (
              <button
                key={row.kind}
                type="button"
                disabled={!hasDetail}
                onClick={() => {
                  postToNative({ type: 'haptic', style: 'selection' })
                  setOpen(row)
                }}
                className="flex items-center gap-3 rounded-xl px-2 py-2.5 text-left enabled:active:bg-surface-2"
              >
                <span
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border',
                    row.tone === 'bad'
                      ? 'border-danger/30 bg-danger/10 text-danger'
                      : row.tone === 'warn'
                        ? 'border-warning/30 bg-warning/10 text-warning'
                        : 'border-border bg-surface-2 text-muted-foreground',
                  )}
                >
                  <Icon size={15} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-foreground">{row.label}</span>
                  <span className="block text-[11px] text-muted-foreground">
                    {active
                      ? [
                          row.count > 0 ? `${row.count} kayıt` : '',
                          row.sharePct != null ? `satışa oranı %${formatMoneyTR(row.sharePct, row.sharePct >= 10 ? 0 : 1)}` : '',
                        ]
                          .filter(Boolean)
                          .join(' · ') || 'Kayıt var'
                      : 'Yok'}
                  </span>
                </span>
                <span className={cn('shrink-0 text-sm font-bold tabular-nums', active ? toneText(row.tone) : 'text-muted-foreground')}>
                  {row.amountLabel}
                </span>
                <ChevronRight
                  size={14}
                  className={cn('shrink-0', hasDetail ? 'text-muted-foreground/70' : 'opacity-0')}
                  aria-hidden
                />
              </button>
            )
          })}
        </div>
      ) : (
        <p className="px-4 pb-3.5 pt-1 text-xs text-muted-foreground">
          {digest.isToday ? 'Bugün iptal, ikram veya zayi yok.' : 'Bu günde iptal, ikram veya zayi yok.'}
        </p>
      )}

      <BossMBottomSheet
        open={Boolean(open)}
        title={open ? LOSS_SHEET_TITLE[open.kind] : ''}
        subtitle={open ? `${digest.dayLabel} · ${open.amountLabel}` : undefined}
        onClose={() => setOpen(null)}
        footer={
          open?.kind === 'waste' ? (
            <Link
              href="/boss-m/stok/fire"
              onClick={() => setOpen(null)}
              className="flex h-11 w-full items-center justify-center rounded-xl border border-border bg-card text-sm font-semibold text-foreground active:bg-surface-2"
            >
              Zayi kayıtları
            </Link>
          ) : null
        }
      >
        <div className="overflow-hidden rounded-2xl border border-border bg-surface-2/80">
          <div className="flex flex-col divide-y divide-border">
            {(open?.events ?? []).map((event) => (
              <div key={event.id} className="flex items-start gap-3 px-3.5 py-3">
                <div className="min-w-0 flex-1">
                  <p className="break-words text-sm font-medium leading-snug text-foreground">{event.title}</p>
                  {event.meta ? <p className="mt-0.5 text-[11px] text-muted-foreground">{event.meta}</p> : null}
                  {event.note ? (
                    <p className="mt-1 break-words text-[11px] italic text-muted-foreground">“{event.note}”</p>
                  ) : null}
                </div>
                <span className="shrink-0 text-sm font-bold tabular-nums text-foreground">{event.amount}</span>
              </div>
            ))}
          </div>
        </div>
      </BossMBottomSheet>
    </Card>
  )
}

/* ─── Pay listesi (ödeme, ürün, gider) ─── */

function ShareCard({
  title,
  right,
  rows,
  barClass,
  href,
  hrefLabel,
}: {
  title: string
  right?: string
  rows: AnaShareRow[]
  barClass: string
  href?: string
  hrefLabel?: string
}) {
  if (rows.length === 0) return null
  return (
    <Card>
      <CardHead title={title} right={right} />
      <ul className="flex flex-col gap-2.5 px-4 pb-3.5 pt-2">
        {rows.map((row) => (
          <li key={row.key}>
            <div className="flex items-baseline justify-between gap-3">
              <p className="flex min-w-0 items-baseline gap-1.5 text-sm text-foreground">
                <span className="min-w-0 truncate">{row.label}</span>
                {row.sub ? <span className="shrink-0 text-[11px] text-muted-foreground">{row.sub}</span> : null}
              </p>
              <p className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                {row.amountLabel}
                <span className="ml-1.5 inline-block w-8 text-right text-[11px] font-medium text-muted-foreground">
                  %{row.share}
                </span>
              </p>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-2">
              <div className={cn('h-full rounded-full', barClass)} style={{ width: `${Math.max(2, row.share)}%` }} />
            </div>
          </li>
        ))}
      </ul>
      {href && hrefLabel ? (
        <Link
          href={href}
          className="flex items-center justify-between border-t border-border px-4 py-2.5 text-xs font-medium text-primary active:bg-surface-2"
        >
          {hrefLabel}
          <ChevronRight size={14} aria-hidden />
        </Link>
      ) : null}
    </Card>
  )
}

/**
 * Ana sayfa gün bölümü: panel «Günün özeti» ile aynı rakamlar; mobilde tek bakışta
 * net satış → tahsilat → kayıplar → ödeme ve ürün dağılımı.
 */
export function BossMDaySummary({ digest }: { digest: AnaDayDigest }) {
  return (
    <>
      <DayHero digest={digest} />
      <HourlyCard digest={digest} />
      <LossCard digest={digest} />
      <ShareCard
        title="Ödeme dağılımı"
        right={`Tahsilat ${digest.paymentsTotalLabel}`}
        rows={digest.payments}
        barClass="bg-success"
        href="/boss-m/finans"
        hrefLabel="Finans"
      />
      <ShareCard title="En çok satanlar" rows={digest.topProducts} barClass="bg-primary" />
      <ShareCard
        title="Giderler"
        right={`Toplam ${digest.expenseTotalLabel}`}
        // Tek kalem varsa üst karttaki «Gider» ile aynı bilgi — kart yalnız kırılım varken gösterilir.
        rows={digest.expenses.length > 1 ? digest.expenses : []}
        barClass="bg-warning"
        href="/boss-m/kasa/hareket?type=gider"
        hrefLabel="Gider kaydet"
      />
    </>
  )
}
