/** RestroidBOSS web — API / env */

export function getBossApiBase(): string {
  const raw = process.env.NEXT_PUBLIC_BOSS_API_BASE?.trim()
  if (!raw) return 'https://cloud.restroid.com'
  return raw.replace(/\/+$/, '')
}

/** Browser'da same-origin proxy; sunucu tarafında doğrudan cloud. */
export function getBossApiPrefix(): string {
  if (typeof window !== 'undefined') return '/panel-api'
  return getBossApiBase()
}
