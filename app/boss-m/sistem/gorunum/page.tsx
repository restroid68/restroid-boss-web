'use client'

import { useEffect, useState } from 'react'
import { Check, Type } from 'lucide-react'
import { BossMPageHeader } from '@/components/boss/BossMPageHeader'
import {
  applyAppearance,
  FONT_SCALE_OPTIONS,
  loadAppearance,
  saveAppearance,
  type BossAppearance,
  type FontScale,
} from '@/lib/boss-appearance'
import { postToNative } from '@/lib/boss-bridge'
import { cn } from '@/lib/utils'

export default function BossMGorunumPage() {
  const [prefs, setPrefs] = useState<BossAppearance | null>(null)

  useEffect(() => {
    setPrefs(loadAppearance())
  }, [])

  const setScale = (fontScale: FontScale) => {
    const next: BossAppearance = {
      ...(prefs ?? loadAppearance()),
      fontScale,
    }
    setPrefs(next)
    applyAppearance(next)
    saveAppearance(next)
    postToNative({ type: 'appearance', ...next })
  }

  const current = prefs?.fontScale ?? 'md'

  return (
    <main className="flex flex-col gap-0 pb-4">
      <BossMPageHeader title="Görünüm" showBack />

      <section className="mx-4 mt-1 rounded-2xl border border-border bg-card overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Type size={20} strokeWidth={1.7} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">Yazı boyutu</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Tüm ekranlara uygulanır
            </p>
          </div>
        </div>

        <div className="flex flex-col divide-y divide-border">
          {FONT_SCALE_OPTIONS.map((opt) => {
            const selected = current === opt.id
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setScale(opt.id)}
                className={cn(
                  'flex w-full items-center gap-3 px-4 py-3.5 text-left active:bg-surface-2',
                  selected && 'bg-primary/8',
                )}
              >
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      'font-semibold text-foreground',
                      opt.id === 'sm' && 'text-[0.875rem]',
                      opt.id === 'md' && 'text-base',
                      opt.id === 'lg' && 'text-lg',
                    )}
                  >
                    {opt.labelTr}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{opt.hintTr}</p>
                </div>
                {selected ? (
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check size={14} strokeWidth={2.4} />
                  </span>
                ) : (
                  <span className="h-7 w-7 rounded-full border border-border" />
                )}
              </button>
            )
          })}
        </div>
      </section>

      <p className="mx-4 mt-4 text-sm text-muted-foreground leading-relaxed">
        Örnek: Günlük ciro · Açık masalar · Dikkat
      </p>
    </main>
  )
}
