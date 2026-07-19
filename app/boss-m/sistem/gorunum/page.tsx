'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/** Yazı boyutu drawer’a taşındı — eski rota yönlendirilir. */
export default function BossMGorunumPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/boss-m/sistem/tema')
  }, [router])
  return null
}
