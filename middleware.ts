import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * /panel-api/* → cloud shard.
 * Cookie `restroid_boss_api_env=test` → cloud.restroid.dev (Flutter Test modu).
 * Aksi halde Canlı (NEXT_PUBLIC_BOSS_API_BASE / cloud.restroid.com).
 */
export function middleware(req: NextRequest) {
  const live = (
    process.env.NEXT_PUBLIC_BOSS_API_BASE || 'https://cloud.restroid.com'
  ).replace(/\/+$/, '')
  const test = (
    process.env.NEXT_PUBLIC_BOSS_API_BASE_TEST || 'https://cloud.restroid.dev'
  ).replace(/\/+$/, '')

  const env = req.cookies.get('restroid_boss_api_env')?.value?.trim().toLowerCase()
  const base = env === 'test' ? test : live

  const destPath = req.nextUrl.pathname.replace(/^\/panel-api/, '') || '/'
  const url = new URL(`${destPath}${req.nextUrl.search}`, `${base}/`)
  return NextResponse.rewrite(url)
}

export const config = {
  matcher: '/panel-api/:path*',
}
