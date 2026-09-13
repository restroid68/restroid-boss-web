'use client'

import { useMemo, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { BossMBottomSheet } from '@/components/boss/BossMBottomSheet'
import { useBossSelectedDay } from '@/hooks/use-boss-selected-day'
import { postToNative } from '@/lib/boss-bridge'
import {
  BOSS_DAY_LOOKBACK_DAYS,
  BOSS_WEEKDAYS,
  addDaysYmd,
  bossMonthGrid,
  clampBossDay,
  daysInMonth,
  formatBossMonthTitle,
  istanbulYmd,
  parseBossYmd,
  ymdFromParts,
} from '@/lib/boss-wall-clock'
import { cn } from '@/lib/utils'

export function BossMDayPicker({ className }: { className?: string }) {
  const { day, today, isToday, setDay, chipLabel, longLabel } = useBossSelectedDay()
  const [open, setOpen] = useState(false)
  const selected = parseBossYmd(day) ?? parseBossYmd(today)!
  const [viewYear, setViewYear] = useState(selected.year)
  const [viewMonth, setViewMonth] = useState(selected.month)

  const minDay = addDaysYmd(today, -BOSS_DAY_LOOKBACK_DAYS)
  const grid = useMemo(() => bossMonthGrid(viewYear, viewMonth), [viewYear, viewMonth])

  function openSheet() {
    postToNative({ type: 'haptic', style: 'selection' })
    const p = parseBossYmd(day)
    if (p) {
      setViewYear(p.year)
      setViewMonth(p.month)
    }
    setOpen(true)
  }

  function shiftMonth(delta: number) {
    let y = viewYear
    let m = viewMonth + delta
    if (m < 1) {
      y -= 1
      m = 12
    } else if (m > 12) {
      y += 1
      m = 1
    }
    setViewYear(y)
    setViewMonth(m)
  }

  function pickDay(d: number) {
    const next = clampBossDay(ymdFromParts(viewYear, viewMonth, d), today)
    setDay(next)
    postToNative({ type: 'haptic', style: 'selection' })
    setOpen(false)
  }

  function goToday() {
    setDay(today)
    postToNative({ type: 'haptic', style: 'selection' })
    setOpen(false)
  }

  const todayParts = parseBossYmd(today)
  const canPrev = ymdFromParts(viewYear, viewMonth, 1) > `${minDay.slice(0, 7)}-01`
  const canNext =
    todayParts != null &&
    (viewYear < todayParts.year || (viewYear === todayParts.year && viewMonth < todayParts.month))

  return (
    <>
      <button
        type="button"
        onClick={openSheet}
        aria-label={`Gün: ${longLabel}${isToday ? ' (bugün)' : ''}`}
        className={cn(
          'flex h-9 !min-h-9 !min-w-0 max-w-full items-center gap-1.5 rounded-full border border-border bg-card px-2.5 text-left active:bg-surface-2',
          className,
        )}
      >
        <CalendarDays size={14} className="shrink-0 text-primary" />
        <span className="min-w-0 truncate text-xs font-semibold capitalize text-foreground">
          {chipLabel}
        </span>
        {!isToday ? (
          <span className="hidden truncate text-[10px] text-muted-foreground sm:inline">
            {longLabel}
          </span>
        ) : null}
      </button>

      <BossMBottomSheet
        open={open}
        title="Gün seç"
        subtitle={isToday ? 'Aktif gün' : longLabel}
        onClose={() => setOpen(false)}
        footer={
          !isToday ? (
            <button
              type="button"
              onClick={goToday}
              className="flex h-11 w-full items-center justify-center rounded-xl border border-border bg-card text-sm font-semibold text-foreground active:bg-surface-2"
            >
              Bugüne dön
            </button>
          ) : null
        }
      >
        <div className="flex items-center justify-between gap-2 pb-3">
          <button
            type="button"
            aria-label="Önceki ay"
            disabled={!canPrev}
            onClick={() => shiftMonth(-1)}
            className="flex h-11 w-11 items-center justify-center rounded-xl text-muted-foreground active:bg-surface-2 disabled:opacity-30"
          >
            <ChevronLeft size={20} />
          </button>
          <p className="text-sm font-semibold capitalize text-foreground">
            {formatBossMonthTitle(viewYear, viewMonth)}
          </p>
          <button
            type="button"
            aria-label="Sonraki ay"
            disabled={!canNext}
            onClick={() => shiftMonth(1)}
            className="flex h-11 w-11 items-center justify-center rounded-xl text-muted-foreground active:bg-surface-2 disabled:opacity-30"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 pb-1">
          {BOSS_WEEKDAYS.map((w) => (
            <span
              key={w}
              className="py-1 text-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
            >
              {w}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {grid.map((d, i) => {
            if (d == null) {
              return <span key={`e-${i}`} className="h-10 !min-h-10 !min-w-0" />
            }
            const cell = ymdFromParts(viewYear, viewMonth, d)
            const dim = daysInMonth(viewYear, viewMonth)
            if (d > dim) return <span key={`e-${i}`} className="h-10 !min-h-10 !min-w-0" />
            const disabled = cell > today || cell < minDay
            const selectedDay = cell === day
            const isTodayCell = cell === istanbulYmd()
            return (
              <button
                key={cell}
                type="button"
                disabled={disabled}
                onClick={() => pickDay(d)}
                className={cn(
                  'flex h-10 !min-h-10 !min-w-0 w-full items-center justify-center rounded-xl text-sm font-semibold tabular-nums',
                  selectedDay
                    ? 'bg-primary text-primary-foreground'
                    : isTodayCell
                      ? 'border border-primary/40 text-primary'
                      : 'text-foreground active:bg-surface-2',
                  disabled && 'opacity-30',
                )}
              >
                {d}
              </button>
            )
          })}
        </div>
      </BossMBottomSheet>
    </>
  )
}
