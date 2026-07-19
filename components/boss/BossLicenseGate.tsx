'use client'

import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Lock, RefreshCw } from 'lucide-react'
import { bossFetch } from '@/lib/boss-api'
import { onNativeSession, readNativeSession } from '@/lib/boss-bridge'

type LicenseStatus = {
  ok: boolean
  reason?: string
  message?: string
  licenseUnitCode?: string | null
  validUntil?: string | null
  superAdminBypass?: boolean
}

/**
 * Satış paneli lisansı (`RTK_MKT_MOD_SATIS`) yoksa Boss SPA'yı kilitler.
 */
export default function BossLicenseGate({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<LicenseStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasSession, setHasSession] = useState(() => Boolean(readNativeSession()?.token))

  const load = useCallback(async () => {
    const session = readNativeSession()
    if (!session?.token) {
      setHasSession(false)
      setStatus(null)
      setError(null)
      setLoading(true)
      return
    }
    setHasSession(true)
    setLoading(true)
    setError(null)
    const res = await bossFetch<LicenseStatus>('/api/boss/license-status')
    if (!res.ok || !res.data) {
      setStatus(null)
      setError(res.error || 'Lisans durumu okunamadı.')
      setLoading(false)
      return
    }
    setStatus(res.data)
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
    return onNativeSession(() => {
      void load()
    })
  }, [load])

  if (!hasSession || loading) {
    return (
      <div className="relative z-10 flex min-h-[50vh] flex-col items-center justify-center gap-3 px-6 text-sm text-slate-300">
        <RefreshCw className="h-6 w-6 animate-spin opacity-70" aria-hidden />
        <p>Lisans kontrol ediliyor…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="relative z-10 mx-auto flex max-w-md flex-col items-center gap-4 px-6 py-16 text-center">
        <Lock className="h-10 w-10 text-amber-400" aria-hidden />
        <h1 className="text-lg font-semibold text-amber-100">Lisans kontrolü başarısız</h1>
        <p className="text-sm text-slate-400">{error}</p>
        <button
          type="button"
          className="rounded-lg border border-slate-600 bg-slate-800/80 px-4 py-2 text-sm text-slate-100"
          onClick={() => void load()}
        >
          Tekrar dene
        </button>
      </div>
    )
  }

  if (status && !status.ok && !status.superAdminBypass) {
    return (
      <div className="relative z-10 mx-auto flex max-w-md flex-col items-center gap-4 px-6 py-16 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-xl border border-amber-500/35 bg-amber-500/[0.12] text-amber-200">
          <Lock className="h-7 w-7" strokeWidth={1.75} aria-hidden />
        </span>
        <h1 className="text-lg font-semibold text-amber-100">Lisans gerekli</h1>
        <p className="text-sm text-slate-400">
          {status.message ||
            'Bu restoran için geçerli bir satış paneli lisansı bulunamadı. Restroid Boss kullanılamaz.'}
        </p>
        <button
          type="button"
          className="rounded-lg border border-slate-600 bg-slate-800/80 px-4 py-2 text-sm text-slate-100"
          onClick={() => void load()}
        >
          Tekrar dene
        </button>
      </div>
    )
  }

  return <>{children}</>
}
