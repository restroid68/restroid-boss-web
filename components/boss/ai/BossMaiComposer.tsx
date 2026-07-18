'use client'

import { useRef, useState } from 'react'
import { Send, Mic } from 'lucide-react'
import { cn } from '@/lib/utils'
import { postToNative } from '@/lib/boss-bridge'

const SUGGESTION_CHIPS = [
  'Bugünü özetle',
  'İptalleri açıkla',
  'Maliyet uyarısı',
  'En çok satan ürün',
  'Açık hesaplar',
]

interface BossMaiComposerProps {
  onSend: (text: string) => void
  disabled?: boolean
}

export function BossMaiComposer({ onSend, disabled }: BossMaiComposerProps) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function handleSend() {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setValue('')
    // Reset textarea height
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleChip(chip: string) {
    if (disabled) return
    onSend(chip)
  }

  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setValue(e.target.value)
    // Auto-grow textarea up to ~120px
    const el = e.target
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
  }

  const canSend = value.trim().length > 0 && !disabled

  return (
    <div className="bg-background border-t border-border pb-safe">
      {/* Suggestion chips */}
      <div className="flex gap-2 px-4 pt-3 pb-2 overflow-x-auto">
        {SUGGESTION_CHIPS.map((chip) => (
          <button
            key={chip}
            onClick={() => handleChip(chip)}
            disabled={disabled}
            className={cn(
              'shrink-0 h-8 px-3.5 rounded-full border text-xs font-medium transition-colors whitespace-nowrap',
              'border-border bg-surface-2 text-muted-foreground',
              'active:bg-surface-3 active:text-foreground',
              disabled && 'opacity-40'
            )}
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Input row */}
      <div className="flex items-end gap-2.5 px-4 pb-4">
        {/* Text input */}
        <div className="flex-1 flex items-end bg-surface-2 border border-border rounded-2xl px-4 py-2.5 min-h-[44px]">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Bir şey sor…"
            rows={1}
            disabled={disabled}
            className={cn(
              'w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground',
              'resize-none outline-none leading-relaxed',
              // Allow user selection inside the textarea so the user can select & edit their own text
              'select-text [-webkit-user-select:text]',
              disabled && 'opacity-50'
            )}
          />
        </div>

        {/* Mic — Flutter WebView owns STT; transcript comes back via bridge */}
        <button
          type="button"
          aria-label="Sesli giriş"
          disabled={disabled}
          onClick={() => postToNative({ type: 'openMic' })}
          className="flex items-center justify-center w-11 h-11 rounded-2xl bg-surface-2 border border-border text-muted-foreground shrink-0 active:bg-surface-3 disabled:opacity-40"
        >
          <Mic size={18} />
        </button>

        {/* Send */}
        <button
          onClick={handleSend}
          disabled={!canSend}
          aria-label="Gönder"
          className={cn(
            'flex items-center justify-center w-11 h-11 rounded-2xl shrink-0 transition-colors',
            canSend
              ? 'bg-primary text-primary-foreground active:opacity-80'
              : 'bg-surface-2 border border-border text-muted-foreground/40'
          )}
        >
          <Send size={17} />
        </button>
      </div>
    </div>
  )
}
