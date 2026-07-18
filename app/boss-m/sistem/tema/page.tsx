'use client'

import { useEffect, useState } from 'react'
import { Check, Palette } from 'lucide-react'
import { BossMPageHeader } from '@/components/boss/BossMPageHeader'
import {
  applyAppearance,
  loadAppearance,
  saveAppearance,
  THEME_PRESETS,
  type BossAppearance,
  type ThemeAccent,
} from '@/lib/boss-appearance'
import { postToNative } from '@/lib/boss-bridge'
import { cn } from '@/lib/utils'

export default function BossMTemaPage() {
  const [prefs, setPrefs] = useState<BossAppearance | null>(null)

  useEffect(() => {
    setPrefs(loadAppearance())
  }, [])

  const setTheme = (themeAccent: ThemeAccent) => {
    const next: BossAppearance = {
      ...(prefs ?? loadAppearance()),
      themeAccent,
    }
    setPrefs(next)
    applyAppearance(next)
    saveAppearance(next)
    postToNative({ type: 'appearance', ...next })
  }

  const current = prefs?.themeAccent ?? 'blue'

  return (
    <main className="flex flex-col gap-0 pb-4">
      <BossMPageHeader title="Tema rengi" showBack />

      <section className="mx-4 mt-1 rounded-2xl border border-border bg-card overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Palette size={20} strokeWidth={1.7} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">Kart ve vurgu</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Sol menü mavisi varsayılandır
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 p-4">
          {THEME_PRESETS.map((preset) => {
            const selected = current === preset.id
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => setTheme(preset.id)}
                className={cn(
                  'relative flex flex-col items-start gap-3 rounded-2xl border p-3.5 text-left transition-transform active:scale-[0.98]',
                  selected
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-surface-2',
                )}
              >
                <span
                  className="h-10 w-10 rounded-xl shadow-inner ring-1 ring-white/10"
                  style={{ backgroundColor: preset.swatch }}
                />
                <p className="text-sm font-semibold text-foreground">{preset.labelTr}</p>
                {selected && (
                  <span className="absolute right-2.5 top-2.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check size={12} strokeWidth={2.4} />
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </section>

      <div className="mx-4 mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-2xl border border-border bg-card px-3 py-3">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wide">
            Günlük ciro
          </p>
          <p className="mt-1 text-lg font-semibold tabular-nums text-foreground">₺0</p>
        </div>
        <div className="rounded-2xl border border-border bg-card px-3 py-3">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wide">
            Açık masalar
          </p>
          <p className="mt-1 text-lg font-semibold tabular-nums text-primary">0</p>
        </div>
      </div>
    </main>
  )
}
