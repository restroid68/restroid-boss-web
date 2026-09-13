/** İşletme saati = Europe/Istanbul (UTC+3). */

export const BOSS_WALL_TZ = 'Europe/Istanbul'
export const BOSS_YMD_RE = /^\d{4}-\d{2}-\d{2}$/
export const BOSS_DAY_LOOKBACK_DAYS = 365
export const BOSS_WEEKDAYS = ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz'] as const

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

export function isBossYmd(value: unknown): boolean {
  return typeof value === 'string' && BOSS_YMD_RE.test(value)
}

export function istanbulYmd(d = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: BOSS_WALL_TZ }).format(d)
}

export function parseBossYmd(ymd: string): { year: number; month: number; day: number } | null {
  if (!isBossYmd(ymd)) return null
  const [year, month, day] = ymd.split('-').map(Number)
  if (!year || !month || !day) return null
  return { year, month, day }
}

export function addDaysYmd(ymd: string, delta: number): string {
  const p = parseBossYmd(ymd)
  if (!p) return istanbulYmd()
  const dt = new Date(Date.UTC(p.year, p.month - 1, p.day + delta, 12, 0, 0))
  return `${dt.getUTCFullYear()}-${pad2(dt.getUTCMonth() + 1)}-${pad2(dt.getUTCDate())}`
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

/** Pazartesi başlar. Ayın dışındaki hücreler `null`. */
export function bossMonthGrid(year: number, month: number): Array<number | null> {
  const first = new Date(Date.UTC(year, month - 1, 1, 12, 0, 0))
  const mondayOffset = (first.getUTCDay() + 6) % 7
  const dim = daysInMonth(year, month)
  const cells: Array<number | null> = []
  for (let i = 0; i < mondayOffset; i++) cells.push(null)
  for (let d = 1; d <= dim; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

export function clampBossDay(ymd: string, today = istanbulYmd()): string {
  if (!isBossYmd(ymd)) return today
  const min = addDaysYmd(today, -BOSS_DAY_LOOKBACK_DAYS)
  if (ymd > today) return today
  if (ymd < min) return min
  return ymd
}

export function formatBossDayChip(ymd: string, today = istanbulYmd()): string {
  const day = clampBossDay(ymd, today)
  if (day === today) return 'Bugün'
  if (day === addDaysYmd(today, -1)) return 'Dün'
  const p = parseBossYmd(day)
  if (!p) return 'Bugün'
  const dt = new Date(Date.UTC(p.year, p.month - 1, p.day, 12, 0, 0))
  const sameYear = day.slice(0, 4) === today.slice(0, 4)
  return dt.toLocaleDateString('tr-TR', {
    timeZone: 'UTC',
    day: 'numeric',
    month: 'short',
    ...(sameYear ? {} : { year: 'numeric' }),
  })
}

export function formatBossDayLong(ymd: string): string {
  const p = parseBossYmd(ymd)
  if (!p) return ''
  const dt = new Date(Date.UTC(p.year, p.month - 1, p.day, 12, 0, 0))
  return dt.toLocaleDateString('tr-TR', {
    timeZone: 'UTC',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

export function formatBossMonthTitle(year: number, month: number): string {
  const dt = new Date(Date.UTC(year, month - 1, 1, 12, 0, 0))
  return dt.toLocaleDateString('tr-TR', { timeZone: 'UTC', month: 'long', year: 'numeric' })
}

export function ymdFromParts(year: number, month: number, day: number): string {
  return `${year}-${pad2(month)}-${pad2(day)}`
}

/** Sipariş listesi: aynı gün yalnız saat, değilse `17 Ağu 17:12` (İstanbul). */
export function formatBossDateTime(iso: unknown): string {
  const s = String(iso ?? '').trim()
  if (!s) return '—'
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return s.slice(0, 16)
  const ymd = d.toLocaleDateString('en-CA', { timeZone: BOSS_WALL_TZ })
  const time = d.toLocaleTimeString('tr-TR', {
    timeZone: BOSS_WALL_TZ,
    hour: '2-digit',
    minute: '2-digit',
  })
  if (ymd === istanbulYmd()) return time
  const date = d.toLocaleDateString('tr-TR', {
    timeZone: BOSS_WALL_TZ,
    day: 'numeric',
    month: 'short',
  })
  return `${date} ${time}`
}
