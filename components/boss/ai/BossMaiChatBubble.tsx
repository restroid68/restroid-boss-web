'use client'

import { useEffect, useState } from 'react'
import { Pause, Play, Square } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  pauseBossSpeech,
  resumeBossSpeech,
  speakBossAnswer,
  stopBossSpeech,
  subscribeBossSpeech,
  type BossSpeechState,
} from '@/lib/boss-speak'

export type BubbleRole = 'user' | 'assistant'

export interface ChatMessage {
  id: string
  role: BubbleRole
  text: string
  time: string
  /** Optional structured data card rendered beneath assistant text */
  card?: React.ReactNode
}

interface BossMaiChatBubbleProps {
  message: ChatMessage
  ttsVoice?: 'device' | 'cloud'
}

function SpeechControls({
  messageId,
  text,
  voice,
}: {
  messageId: string
  text: string
  voice: 'device' | 'cloud'
}) {
  const [speech, setSpeech] = useState<BossSpeechState>({ status: 'idle', messageId: null })

  useEffect(() => subscribeBossSpeech(setSpeech), [])

  const mine = speech.messageId === messageId
  const playing = mine && (speech.status === 'playing' || speech.status === 'loading')
  const paused = mine && speech.status === 'paused'
  const playActive = playing || paused

  return (
    <div className="mt-1.5 flex items-center gap-1">
      <button
        type="button"
        aria-label="Seslendirmeyi başlat"
        onClick={() => {
          if (paused) {
            resumeBossSpeech()
            return
          }
          speakBossAnswer(text, voice, { messageId })
        }}
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-lg border transition-colors',
          playActive
            ? 'border-primary/40 bg-primary/15 text-primary'
            : 'border-border bg-card/80 text-muted-foreground active:bg-surface-2',
        )}
      >
        <Play size={14} strokeWidth={2} fill="currentColor" />
      </button>
      <button
        type="button"
        aria-label="Seslendirmeyi beklet"
        disabled={!playing}
        onClick={() => pauseBossSpeech()}
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-lg border transition-colors disabled:opacity-35',
          paused
            ? 'border-primary/40 bg-primary/15 text-primary'
            : 'border-border bg-card/80 text-muted-foreground active:bg-surface-2',
        )}
      >
        <Pause size={14} strokeWidth={2} />
      </button>
      <button
        type="button"
        aria-label="Seslendirmeyi durdur"
        disabled={!playing && !paused}
        onClick={() => stopBossSpeech()}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card/80 text-muted-foreground transition-colors active:bg-surface-2 disabled:opacity-35"
      >
        <Square size={12} strokeWidth={2} fill="currentColor" />
      </button>
    </div>
  )
}

export function BossMaiChatBubble({ message, ttsVoice = 'device' }: BossMaiChatBubbleProps) {
  const isUser = message.role === 'user'

  return (
    <div className={cn('flex w-full', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
        <div className="flex flex-col items-center mr-2.5 pt-0.5">
          <span className="flex items-center justify-center w-7 h-7 rounded-xl bg-primary/15 shrink-0">
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" className="text-primary">
              <path d="M8 1v3M8 12v3M1 8h3M12 8h3M3.05 3.05l2.12 2.12M10.83 10.83l2.12 2.12M3.05 12.95l2.12-2.12M10.83 5.17l2.12-2.12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
          </span>
        </div>
      )}

      <div className={cn('flex flex-col max-w-[78%]', isUser ? 'items-end' : 'items-start')}>
        <div
          className={cn(
            'rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap',
            isUser
              ? 'bg-primary text-primary-foreground rounded-br-sm'
              : 'bg-surface-2 text-foreground rounded-bl-sm border border-border/60',
          )}
        >
          {message.text}
        </div>

        {!isUser && message.text.trim() ? (
          <SpeechControls messageId={message.id} text={message.text} voice={ttsVoice} />
        ) : null}

        {!isUser && message.card && (
          <div className="mt-2 w-full">{message.card}</div>
        )}

        <span className="text-[10px] text-muted-foreground mt-1 px-0.5">{message.time}</span>
      </div>
    </div>
  )
}
