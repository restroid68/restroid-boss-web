'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  BOSS_AI_DEFAULT_FAVORITE_IDS,
  BOSS_AI_FAVORITES_STORAGE_KEY,
  findBossAiCommand,
  type BossAiCommand,
} from '@/lib/boss-ai-commands'

function readStoredIds(): string[] | null {
  try {
    const raw = window.localStorage.getItem(BOSS_AI_FAVORITES_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return null
    return parsed.map((x) => String(x)).filter(Boolean)
  } catch {
    return null
  }
}

function writeStoredIds(ids: string[]) {
  try {
    window.localStorage.setItem(BOSS_AI_FAVORITES_STORAGE_KEY, JSON.stringify(ids))
  } catch {
    /* ignore */
  }
}

export function useBossAiFavorites() {
  const [ids, setIds] = useState<string[]>([...BOSS_AI_DEFAULT_FAVORITE_IDS])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const stored = readStoredIds()
    if (stored && stored.length > 0) {
      setIds(stored)
    } else {
      setIds([...BOSS_AI_DEFAULT_FAVORITE_IDS])
    }
    setReady(true)
  }, [])

  const persist = useCallback((next: string[]) => {
    setIds(next)
    writeStoredIds(next)
  }, [])

  const favorites = useMemo(() => {
    const out: BossAiCommand[] = []
    for (const id of ids) {
      const cmd = findBossAiCommand(id)
      if (cmd) out.push(cmd)
    }
    return out
  }, [ids])

  const isFavorite = useCallback((id: string) => ids.includes(id), [ids])

  const toggleFavorite = useCallback(
    (id: string) => {
      if (!findBossAiCommand(id)) return
      if (ids.includes(id)) {
        persist(ids.filter((x) => x !== id))
      } else {
        persist([...ids, id])
      }
    },
    [ids, persist],
  )

  const addFavorite = useCallback(
    (id: string) => {
      if (!findBossAiCommand(id) || ids.includes(id)) return
      persist([...ids, id])
    },
    [ids, persist],
  )

  const removeFavorite = useCallback(
    (id: string) => {
      if (!ids.includes(id)) return
      persist(ids.filter((x) => x !== id))
    },
    [ids, persist],
  )

  const resetFavorites = useCallback(() => {
    persist([...BOSS_AI_DEFAULT_FAVORITE_IDS])
  }, [persist])

  return {
    ready,
    favoriteIds: ids,
    favorites,
    isFavorite,
    toggleFavorite,
    addFavorite,
    removeFavorite,
    resetFavorites,
  }
}
