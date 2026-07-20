'use client'

import { useMemo, useState } from 'react'
import { Search, Star, X } from 'lucide-react'
import { BossMPageHeader } from '@/components/boss/BossMPageHeader'
import {
  BOSS_AI_COMMAND_CATEGORIES,
  type BossAiCommand,
  type BossAiCommandCategoryId,
} from '@/lib/boss-ai-commands'
import { cn } from '@/lib/utils'

type Props = {
  open: boolean
  onClose: () => void
  onSelect: (command: BossAiCommand) => void
  isFavorite: (id: string) => boolean
  onToggleFavorite: (id: string) => void
}

export function BossMaiCommandSheet({
  open,
  onClose,
  onSelect,
  isFavorite,
  onToggleFavorite,
}: Props) {
  const [query, setQuery] = useState('')
  const [activeCat, setActiveCat] = useState<BossAiCommandCategoryId | 'all'>('all')

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('tr')
    return BOSS_AI_COMMAND_CATEGORIES.map((cat) => {
      const commands = cat.commands.filter((c) => {
        if (activeCat !== 'all' && cat.id !== activeCat) return false
        if (!q) return true
        const hay = `${c.label} ${c.prompt} ${c.hint ?? ''} ${cat.title}`.toLocaleLowerCase('tr')
        return hay.includes(q)
      })
      return { ...cat, commands }
    }).filter((c) => c.commands.length > 0)
  }, [query, activeCat])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <BossMPageHeader
        title="Komut listesi"
        showBack={false}
        syncNativeChrome={false}
        trailing={
          <button
            type="button"
            onClick={onClose}
            aria-label="Kapat"
            className="flex h-11 w-11 items-center justify-center rounded-xl text-muted-foreground active:bg-surface-2"
          >
            <X size={18} />
          </button>
        }
      />

      <div className="border-b border-border px-4 pb-3 space-y-3">
        <div className="flex items-center gap-2 rounded-xl border border-border bg-surface-2 px-3 h-11">
          <Search size={16} className="text-muted-foreground shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Komut ara…"
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-0.5">
          <CatChip
            label="Tümü"
            active={activeCat === 'all'}
            onClick={() => setActiveCat('all')}
          />
          {BOSS_AI_COMMAND_CATEGORIES.map((c) => (
            <CatChip
              key={c.id}
              label={c.title}
              active={activeCat === c.id}
              onClick={() => setActiveCat(c.id)}
            />
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-none px-4 py-4 pb-safe space-y-5">
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Yıldız ile ana ekrandaki sık kullanılanlara ekle veya çıkar. Satıra dokununca komut gönderilir.
        </p>

        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Komut bulunamadı.</p>
        ) : (
          filtered.map((cat) => (
            <section key={cat.id} className="space-y-2">
              <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-0.5">
                {cat.title}
              </h2>
              <ul className="rounded-2xl border border-border bg-surface-2 overflow-hidden divide-y divide-border">
                {cat.commands.map((cmd) => {
                  const fav = isFavorite(cmd.id)
                  return (
                    <li key={cmd.id} className="flex items-stretch">
                      <button
                        type="button"
                        onClick={() => onSelect(cmd)}
                        className="flex-1 min-w-0 text-left px-3.5 py-3 active:bg-surface-3"
                      >
                        <p className="text-sm font-medium text-foreground">{cmd.label}</p>
                        {cmd.hint ? (
                          <p className="text-[11px] text-muted-foreground mt-0.5">{cmd.hint}</p>
                        ) : (
                          <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                            {cmd.prompt}
                          </p>
                        )}
                      </button>
                      <button
                        type="button"
                        aria-label={fav ? 'Sık kullanılanlardan çıkar' : 'Sık kullanılanlara ekle'}
                        aria-pressed={fav}
                        onClick={() => onToggleFavorite(cmd.id)}
                        className={cn(
                          'w-12 shrink-0 flex items-center justify-center border-l border-border',
                          fav ? 'text-warning' : 'text-muted-foreground',
                          'active:bg-surface-3',
                        )}
                      >
                        <Star size={18} fill={fav ? 'currentColor' : 'none'} />
                      </button>
                    </li>
                  )
                })}
              </ul>
            </section>
          ))
        )}
      </div>
    </div>
  )
}

function CatChip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'shrink-0 h-8 px-3 rounded-full border text-xs font-medium whitespace-nowrap transition-colors',
        active
          ? 'border-primary/40 bg-primary/15 text-primary'
          : 'border-border bg-surface-2 text-muted-foreground active:bg-surface-3 active:text-foreground',
      )}
    >
      {label}
    </button>
  )
}
