'use client'

import { useMemo, useRef, useState } from 'react'
import { Check, Plus, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

export type BossSearchItem = { id: string; label: string }

type Props = {
  label?: string
  items: BossSearchItem[]
  valueId: string
  valueLabel?: string
  placeholder: string
  disabled?: boolean
  onSelect: (item: BossSearchItem) => void
  /** Listede yoksa «Yeni ekle» — id dönmezse geçici `new:` id kullanılır */
  onCreate?: (name: string) => BossSearchItem | null | Promise<BossSearchItem | null>
  createLabel?: string
  emptyHint?: string
  className?: string
}

function norm(s: string) {
  return s.trim().toLocaleLowerCase('tr-TR')
}

/** Panel LocalSearchCreateCombobox mobil karşılığı — input + liste + Yeni Ekle. */
export function BossMSearchCreate({
  label,
  items,
  valueId,
  valueLabel,
  placeholder,
  disabled,
  onSelect,
  onCreate,
  createLabel = 'Yeni ekle',
  emptyHint = 'Kayıt bulunamadı',
  className,
}: Props) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  const selectedLabel =
    valueLabel || items.find((i) => i.id === valueId)?.label || ''

  const filtered = useMemo(() => {
    const q = norm(query)
    if (!q) return items
    return items.filter((i) => norm(i.label).includes(q))
  }, [items, query])

  const exact = useMemo(
    () => items.find((i) => norm(i.label) === norm(query)),
    [items, query],
  )
  const canCreate = Boolean(onCreate && query.trim() && !exact)

  async function handleCreate() {
    if (!onCreate || !query.trim() || creating) return
    setCreating(true)
    try {
      const created = await onCreate(query.trim())
      if (created) {
        onSelect(created)
        setQuery('')
        setOpen(false)
      }
    } finally {
      setCreating(false)
    }
  }

  return (
    <div ref={wrapRef} className={cn('relative', className)}>
      {label ? (
        <label className="mb-2 block px-0.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          {label}
        </label>
      ) : null}
      <div
        className={cn(
          'flex h-12 items-center gap-2 rounded-xl border bg-card/90 px-3 transition-all',
          open ? 'border-primary/45 ring-2 ring-primary/25' : 'border-border',
          disabled && 'opacity-50',
        )}
      >
        <Search size={15} className="shrink-0 text-muted-foreground" />
        <input
          type="text"
          disabled={disabled}
          value={open ? query : selectedLabel}
          placeholder={placeholder}
          onFocus={() => {
            setOpen(true)
            setQuery('')
          }}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onBlur={() => {
            // Liste tıklaması için kısa gecikme
            window.setTimeout(() => setOpen(false), 160)
          }}
          className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/50"
        />
        {selectedLabel && !open ? (
          <Check size={14} className="shrink-0 text-primary" />
        ) : null}
      </div>

      {open && !disabled ? (
        <div className="absolute left-0 right-0 z-40 mt-1 max-h-52 overflow-y-auto rounded-xl border border-border bg-[#0f1623] shadow-xl">
          {filtered.map((item) => (
            <button
              key={item.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onSelect(item)
                setQuery('')
                setOpen(false)
              }}
              className={cn(
                'flex w-full items-center justify-between px-3 py-2.5 text-left text-sm transition-colors',
                item.id === valueId
                  ? 'bg-primary/15 text-primary'
                  : 'text-foreground active:bg-surface-2',
              )}
            >
              <span className="truncate">{item.label}</span>
              {item.id === valueId ? <Check size={14} /> : null}
            </button>
          ))}

          {canCreate ? (
            <button
              type="button"
              disabled={creating}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => void handleCreate()}
              className="flex w-full items-center gap-2 border-t border-border px-3 py-3 text-left text-sm font-medium text-emerald-300 active:bg-emerald-500/10"
            >
              <Plus size={16} />
              {creating ? 'Ekleniyor…' : `${createLabel}: ${query.trim()}`}
            </button>
          ) : null}

          {!filtered.length && !canCreate ? (
            <p className="px-3 py-3 text-sm text-muted-foreground">{emptyHint}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
