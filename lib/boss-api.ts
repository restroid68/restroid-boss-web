import { getBossApiPrefix } from '@/lib/boss-config'
import { readNativeSession } from '@/lib/boss-bridge'
import {
  BOSS_TTL,
  CACHE_KEY_SALES_TODAY,
  withBossCache,
} from '@/lib/boss-page-cache'

export type BossApiResult<T = unknown> = {
  ok: boolean
  status: number
  data: T | null
  error?: string
}

function authHeaders(): HeadersInit {
  const session = readNativeSession()
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'x-restroid-native-client': '1',
    'x-restroid-boss': '1',
  }
  if (session?.token) {
    headers.Authorization = `Bearer ${session.token}`
  }
  if (session?.branchCode) {
    headers['x-restroid-branch-code'] = session.branchCode
  }
  return headers
}

export type BossFetchInit = RequestInit & {
  query?: Record<string, string | undefined>
  /** Varsayılan 12s; AI / uzun işler için yükselt (ör. 90000). */
  timeoutMs?: number
}

function defaultTimeoutMs(path: string, override?: number): number {
  if (typeof override === 'number' && override > 0) return override
  // LLM + tool/SQL — cloud maxDuration 60s; istemci biraz pay bırakır
  if (path.includes('/boss/ai/')) return 90_000
  return 12_000
}

function errorFromCatch(e: unknown): string {
  if (e instanceof DOMException && e.name === 'AbortError') {
    return 'İstek zaman aşımına uğradı. Tekrar dene.'
  }
  if (e instanceof Error) {
    const m = e.message || ''
    if (/abort/i.test(m) || /aborted/i.test(m)) {
      return 'İstek zaman aşımına uğradı. Tekrar dene.'
    }
    return m
  }
  return 'Network error'
}

export async function bossFetch<T = unknown>(
  path: string,
  init?: BossFetchInit,
): Promise<BossApiResult<T>> {
  const prefix = getBossApiPrefix()
  const normalized = path.startsWith('/') ? path : `/${path}`
  const url = new URL(
    `${prefix}${normalized.startsWith('/api') ? normalized : `/api${normalized}`}`,
    typeof window !== 'undefined' ? window.location.origin : 'http://localhost',
  )
  if (init?.query) {
    for (const [k, v] of Object.entries(init.query)) {
      if (v != null && v !== '') url.searchParams.set(k, v)
    }
  }

  const { query: _q, timeoutMs: timeoutOverride, ...fetchInit } = init ?? {}
  void _q
  const timeoutMs = defaultTimeoutMs(normalized, timeoutOverride)

  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    if (fetchInit.signal) {
      fetchInit.signal.addEventListener('abort', () => controller.abort(), { once: true })
    }
    let res: Response
    try {
      res = await fetch(url.toString(), {
        ...fetchInit,
        headers: { ...authHeaders(), ...(fetchInit.headers ?? {}) },
        cache: 'no-store',
        signal: controller.signal,
      })
    } finally {
      clearTimeout(timer)
    }
    const text = await res.text()
    let data: unknown = null
    if (text) {
      try {
        data = JSON.parse(text)
      } catch {
        data = text
      }
    }
    if (!res.ok) {
      const errMsg =
        typeof data === 'object' && data && 'error' in data
          ? String((data as { error: unknown }).error)
          : `HTTP ${res.status}`
      return { ok: false, status: res.status, data: null, error: errMsg }
    }
    return { ok: true, status: res.status, data: data as T }
  } catch (e) {
    return {
      ok: false,
      status: 0,
      data: null,
      error: errorFromCatch(e),
    }
  }
}

export function todayYmd(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Ana / Finans / Z fallback — paylaşılan L1 cache. */
export async function fetchSalesAnalysisTodayFull(): Promise<
  BossApiResult<Record<string, unknown>>
> {
  const day = todayYmd()
  return withBossCache(
    CACHE_KEY_SALES_TODAY,
    BOSS_TTL.kpi,
    () =>
      bossFetch<Record<string, unknown>>('/api/branches/sales-analysis', {
        query: { fromDay: day, toDay: day, part: 'full' },
      }),
    { isCacheable: (r) => Boolean(r.ok && r.data) },
  )
}

export { formatMoneyTR, parseMoneyTR } from '@/lib/boss-money'
