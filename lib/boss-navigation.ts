/** Flutter alt sekme kök yolları — BossWebConfig.tabPaths ile aynı. */
export const BOSS_TAB_PATHS = [
  '/boss-m/ana',
  '/boss-m/finans',
  '/boss-m/ai',
  '/boss-m/denetim',
  '/boss-m/kasa',
] as const

export type BossTabPath = (typeof BOSS_TAB_PATHS)[number]

const TAB_SET = new Set<string>(BOSS_TAB_PATHS)

export function normalizeBossPath(path: string): string {
  const raw = (path || '').trim().split('?')[0] ?? ''
  if (!raw) return '/boss-m/ana'
  const p = raw.startsWith('/') ? raw : `/${raw}`
  if (p.length > 1 && p.endsWith('/')) return p.slice(0, -1)
  return p
}

export function isBossTabPath(path: string): path is BossTabPath {
  return TAB_SET.has(normalizeBossPath(path))
}

export function isBossStackPath(path: string): boolean {
  const p = normalizeBossPath(path)
  if (isBossTabPath(p)) return false
  return p.startsWith('/boss-m/')
}
