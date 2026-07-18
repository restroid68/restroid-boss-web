'use client'

import { cn } from '@/lib/utils'

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
}

export function BossMaiChatBubble({ message }: BossMaiChatBubbleProps) {
  const isUser = message.role === 'user'

  return (
    <div className={cn('flex w-full', isUser ? 'justify-end' : 'justify-start')}>
      {/* Assistant avatar dot */}
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
            'rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
            isUser
              ? 'bg-primary text-primary-foreground rounded-br-sm'
              : 'bg-surface-2 text-foreground rounded-bl-sm border border-border/60'
          )}
        >
          {message.text}
        </div>

        {/* Inline data card for assistant messages */}
        {!isUser && message.card && (
          <div className="mt-2 w-full">{message.card}</div>
        )}

        <span className="text-[10px] text-muted-foreground mt-1 px-0.5">{message.time}</span>
      </div>
    </div>
  )
}
