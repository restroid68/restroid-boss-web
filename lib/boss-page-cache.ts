/**
 * Boss SPA katmanlı sayfa cache’i.
 * L1: bellek (TTL + inflight dedupe)
 * L2: sessionStorage — yalnızca tanımlar (katalog, kanal, ödeme…)
 *
 * Redis Boss Vercel’de yok; ağır API’ler cloud server cache kullanır.
 */

import { readNativeSession } from '@/lib/boss-bridge'

export const BOSS_TTL = {
  /** pending count, active orders */
  live: 20_000,
  /** sales-analysis, op-logs, ana/finans KPI */
  kpi: 45_000,
  /** muhasebe meta / hesaplar */
  accounting: 180_000,
  /** katalog, kanallar, ödeme, salon, üretim, depo tanımları */
  definitions: 600_000,
} as const

type CacheEntry = {
  data: unknown
  fetchedAt: number
  expiresAt: number
}

const memory = new Map<string, CacheEntry>()
const inflight = new Map<string, Promise<unknown>>()
/** Aynı key iç içe withBossCache (SWR + shared loader) — deadlock önlemi */
const loadingStack = new Set<string>()

const L2_PREFIX = 'restroid_boss_pcache:'

export function bossCacheScope(): string {
  const s = readNativeSession()
  return `${s?.restaurantId ?? '_'}|${s?.branchCode ?? '_'}`
}

function fullKey(logicalKey: string): string {
  return `${bossCacheScope()}::${logicalKey}`
}

function readL2(key: string): CacheEntry | null {
  if (typeof sessionStorage === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(L2_PREFIX + key)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CacheEntry
    if (!parsed || typeof parsed.expiresAt !== 'number') return null
    return parsed
  } catch {
    return null
  }
}

function writeL2(key: string, entry: CacheEntry): void {
  if (typeof sessionStorage === 'undefined') return
  try {
    sessionStorage.setItem(L2_PREFIX + key, JSON.stringify(entry))
  } catch {
    /* quota */
  }
}

function removeL2ByPrefix(scopePrefix: string): void {
  if (typeof sessionStorage === 'undefined') return
  try {
    const keys: string[] = []
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i)
      if (k?.startsWith(L2_PREFIX + scopePrefix)) keys.push(k)
    }
    for (const k of keys) sessionStorage.removeItem(k)
  } catch {
    /* ignore */
  }
}

export type PeekResult<T> = {
  data: T
  fresh: boolean
  stale: boolean
}

/** Senkron L1 (+ isteğe bağlı L2) okuma — SWR için. */
export function peekBossCache<T>(logicalKey: string): PeekResult<T> | null {
  const key = fullKey(logicalKey)
  const now = Date.now()
  let entry = memory.get(key) ?? null
  if (!entry) {
    entry = readL2(key)
    if (entry) memory.set(key, entry)
  }
  if (!entry) return null
  const fresh = now < entry.expiresAt
  // Stale-while-revalidate: süresi dolmuş olsa da 10 dk’ya kadar göster
  const maxStale = entry.expiresAt + 10 * 60_000
  if (now > maxStale) {
    memory.delete(key)
    return null
  }
  return { data: entry.data as T, fresh, stale: !fresh }
}

export function setBossCache<T>(
  logicalKey: string,
  data: T,
  ttlMs: number,
  opts?: { persist?: boolean },
): void {
  const key = fullKey(logicalKey)
  const now = Date.now()
  const entry: CacheEntry = {
    data,
    fetchedAt: now,
    expiresAt: now + ttlMs,
  }
  memory.set(key, entry)
  if (opts?.persist) writeL2(key, entry)
}

export function invalidateBossCache(logicalKeyPrefix?: string): void {
  const scope = bossCacheScope()
  if (!logicalKeyPrefix) {
    for (const k of [...memory.keys()]) {
      if (k.startsWith(`${scope}::`)) memory.delete(k)
    }
    removeL2ByPrefix(`${scope}::`)
    return
  }
  const needle = `${scope}::${logicalKeyPrefix}`
  for (const k of [...memory.keys()]) {
    if (k.startsWith(needle) || k === `${scope}::${logicalKeyPrefix}`) {
      memory.delete(k)
    }
  }
  if (typeof sessionStorage !== 'undefined') {
    try {
      const keys: string[] = []
      for (let i = 0; i < sessionStorage.length; i++) {
        const k = sessionStorage.key(i)
        if (
          k?.startsWith(L2_PREFIX + needle) ||
          k === L2_PREFIX + `${scope}::${logicalKeyPrefix}`
        ) {
          keys.push(k)
        }
      }
      for (const k of keys) sessionStorage.removeItem(k)
    } catch {
      /* ignore */
    }
  }
}

/** Restoran / şube değişince veya logout. */
export function clearBossPageCache(all = false): void {
  if (all) {
    memory.clear()
    inflight.clear()
    if (typeof sessionStorage !== 'undefined') {
      try {
        const keys: string[] = []
        for (let i = 0; i < sessionStorage.length; i++) {
          const k = sessionStorage.key(i)
          if (k?.startsWith(L2_PREFIX)) keys.push(k)
        }
        for (const k of keys) sessionStorage.removeItem(k)
      } catch {
        /* ignore */
      }
    }
    return
  }
  invalidateBossCache()
  inflight.clear()
}

export type WithBossCacheOptions<T> = {
  persist?: boolean
  /** false dönerse cache’e yazma (ör. mock / hata) */
  isCacheable?: (data: T) => boolean
  /** true ise TTL dolmuş olsa bile network’e gitmeden stale dön (nadiren) */
  allowStaleOnly?: boolean
}

/**
 * Inflight dedupe + L1/L2.
 * Fresh hit → anında; miss/stale → loader; sonucu cache’e yazar.
 */
export async function withBossCache<T>(
  logicalKey: string,
  ttlMs: number,
  loader: () => Promise<T>,
  opts?: WithBossCacheOptions<T>,
): Promise<T> {
  const key = fullKey(logicalKey)
  const peeked = peekBossCache<T>(logicalKey)
  if (peeked?.fresh) return peeked.data
  if (opts?.allowStaleOnly && peeked) return peeked.data

  // İç içe aynı key — dış Promise’i bekleme (kilitlenmesin)
  if (loadingStack.has(key)) {
    return loader()
  }

  const existing = inflight.get(key)
  if (existing) return existing as Promise<T>

  loadingStack.add(key)
  const promise = (async () => {
    try {
      const data = await loader()
      const ok = opts?.isCacheable ? opts.isCacheable(data) : true
      if (ok) setBossCache(logicalKey, data, ttlMs, { persist: opts?.persist })
      return data
    } finally {
      loadingStack.delete(key)
      inflight.delete(key)
    }
  })()

  inflight.set(key, promise)
  return promise
}

/** Paylaşılan sales-analysis (bugün, full) anahtarı */
export const CACHE_KEY_SALES_TODAY = 'sales-analysis:today:full'
export const CACHE_KEY_STOK_HUB = 'page:stok-hub'
export const CACHE_KEY_SISTEM_HUB = 'page:sistem-hub'
