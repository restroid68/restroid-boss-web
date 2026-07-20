'use client'

import { useRef, useState } from 'react'
import { Send, Mic, LayoutList, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { postToNative } from '@/lib/boss-bridge'
import type { BossAiCommand } from '@/lib/boss-ai-commands'

interface BossMaiComposerProps {
  onSend: (text: string) => void
  disabled?: boolean
  favorites?: BossAiCommand[]
  onOpenCommands?: () => void
  onRemoveFavorite?: (id: string) => void
}

export function BossMaiComposer({
  onSend,
  disabled,
  favorites = [],
  onOpenCommands,
  onRemoveFavorite,
}: BossMaiComposerProps) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function handleSend() {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setValue('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleChip(cmd: BossAiCommand) {
    if (disabled) return
    onSend(cmd.prompt)
  }

  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setValue(e.target.value)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
  }

  const canSend = value.trim().length > 0 && !disabled

  return (
    <div className="bg-background border-t border-border pb-2">
      {/* Sık kullanılanlar + komut listesi */}
      <div className="flex gap-2 px-4 pt-3 pb-2 overflow-x-auto items-center">
        <button
          type="button"
          onClick={onOpenCommands}
          disabled={disabled || !onOpenCommands}
          className={cn(
            'shrink-0 h-8 px-3 rounded-full border text-xs font-medium transition-colors whitespace-nowrap inline-flex items-center gap-1.5',
            'border-primary/35 bg-primary/12 text-primary',
            'active:bg-primary/20',
            (disabled || !onOpenCommands) && 'opacity-40',
          )}
        >
          <LayoutList size={14} />
          Komutlar
        </button>

        {favorites.map((cmd) => (
          <div
            key={cmd.id}
            className={cn(
              'shrink-0 h-8 inline-flex items-center rounded-full border border-border bg-surface-2 overflow-hidden',
              disabled && 'opacity-40',
            )}
          >
            <button
              type="button"
              onClick={() => handleChip(cmd)}
              disabled={disabled}
              className="h-full px-3 text-xs font-medium text-muted-foreground active:bg-surface-3 active:text-foreground whitespace-nowrap"
            >
              {cmd.label}
            </button>
            {onRemoveFavorite ? (
              <button
                type="button"
                aria-label={`${cmd.label} sık kullanılanlardan çıkar`}
                disabled={disabled}
                onClick={() => onRemoveFavorite(cmd.id)}
                className="h-full px-1.5 border-l border-border text-muted-foreground/70 active:bg-surface-3 active:text-foreground"
              >
                <X size={12} />
              </button>
            ) : null}
          </div>
        ))}
      </div>

      <div className="flex items-end gap-2.5 px-4 pb-4">
        <div className="flex-1 flex items-end bg-surface-2 border border-border rounded-2xl px-4 py-2.5 min-h-[44px]">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Bir şey sor veya Komutlar’dan seç…"
            rows={1}
            disabled={disabled}
            className={cn(
              'w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground',
              'resize-none outline-none leading-relaxed',
              'select-text [-webkit-user-select:text]',
              disabled && 'opacity-50',
            )}
          />
        </div>

        <button
          type="button"
          aria-label="Sesli giriş"
          disabled={disabled}
          onClick={() => postToNative({ type: 'openMic' })}
          className="flex items-center justify-center w-11 h-11 rounded-2xl bg-surface-2 border border-border text-muted-foreground shrink-0 active:bg-surface-3 disabled:opacity-40"
        >
          <Mic size={18} />
        </button>

        <button
          type="button"
          onClick={handleSend}
          disabled={!canSend}
          aria-label="Gönder"
          className={cn(
            'flex items-center justify-center w-11 h-11 rounded-2xl shrink-0 transition-colors',
            canSend
              ? 'bg-primary text-primary-foreground active:opacity-80'
              : 'bg-surface-2 border border-border text-muted-foreground/40',
          )}
        >
          <Send size={17} />
        </button>
      </div>
    </div>
  )
}
