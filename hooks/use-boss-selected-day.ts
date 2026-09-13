'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  clampBossDay,
  formatBossDayChip,
  formatBossDayLong,
  istanbulYmd,
  isBossYmd,
} from '@/lib/boss-wall-clock'

const STORAGE_KEY = 'boss-selected-day'
const listeners = new Set<() => void>()

function readStoredDay(): string {
  const today = istanbulYmd()
  if (typeof sessionStorage === 'undefined') return today
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw || !isBossYmd(raw)) return today
    return clampBossDay(raw, today)
  } catch {
    return today
  }
}

function writeStoredDay(ymd: string): void {
  if (typeof sessionStorage === 'undefined') return
  try {
    const today = istanbulYmd()
    const next = clampBossDay(ymd, today)
    if (next === today) sessionStorage.removeItem(STORAGE_KEY)
    else sessionStorage.setItem(STORAGE_KEY, next)
  } catch {
    /* ignore */
  }
}

export function getBossSelectedDay(): string {
  return readStoredDay()
}

export function setBossSelectedDay(ymd: string): void {
  writeStoredDay(ymd)
  for (const fn of listeners) fn()
}

export function useBossSelectedDay() {
  const today = istanbulYmd()
  const [day, setDayState] = useState(today)

  useEffect(() => {
    const sync = () => setDayState(readStoredDay())
    listeners.add(sync)
    sync()
    return () => {
      listeners.delete(sync)
    }
  }, [])

  const setDay = useCallback((next: string) => {
    setBossSelectedDay(next)
  }, [])

  const isToday = day === today

  return {
    day,
    today,
    isToday,
    setDay,
    chipLabel: formatBossDayChip(day, today),
    longLabel: formatBossDayLong(day),
  }
}
