'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { BossMPageHeader } from '@/components/boss/BossMPageHeader'
import { BossMaiDailySummaryCard } from '@/components/boss/ai/BossMaiDailySummaryCard'
import { BossMaiChatBubble } from '@/components/boss/ai/BossMaiChatBubble'
import type { ChatMessage } from '@/components/boss/ai/BossMaiChatBubble'
import { BossMaiComposer } from '@/components/boss/ai/BossMaiComposer'
import {
  AiKpiStrip,
  AiRankedList,
  AiAlertBanner,
} from '@/components/boss/ai/BossMaiInlineCards'

// ─────────────────────────────────────────────────────────────────────────────
// Mock reply factory — maps trigger phrases to structured answers
// ─────────────────────────────────────────────────────────────────────────────

function makeTime() {
  const now = new Date()
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}

let _idCounter = 100

function nextId() {
  return String(++_idCounter)
}

function getAssistantReply(question: string): Omit<ChatMessage, 'id' | 'time'> {
  const q = question.toLowerCase()

  if (q.includes('bugünü özetle') || q.includes('ozet') || q.includes('özet')) {
    return {
      role: 'assistant',
      text: 'Bugün hedefin %89\'una ulaştın. Ciro güçlü seyretse de market gideri normalin %38 üzerinde. Personel verimi dünden yüksek.',
      card: (
        <AiKpiStrip
          rows={[
            { label: 'Ciro',           value: '₺24.860', delta: '+8.2%',  sign: 'up'   },
            { label: 'Hedef doluluk',  value: '%89',     delta: '−%11',   sign: 'down' },
            { label: 'Açık hesaplar',  value: '₺5.520',  delta: '6 masa', sign: 'flat' },
            { label: 'Toplam iptal',   value: '₺620',    delta: '3 adet', sign: 'down' },
          ]}
        />
      ),
    }
  }

  if (q.includes('iptal') || q.includes('iptalleri')) {
    return {
      role: 'assistant',
      text: 'Bugün 3 kritik iptal kaydedildi. Toplam tutar ₺620. Zeynep T. ve Ali K. yüksek riskli işlemler; denetim ekranından onay isteyebilirsin.',
      card: (
        <AiRankedList
          title="Bugünkü İptaller"
          accent="danger"
          rows={[
            { label: 'Masa 3 — Zeynep T.',   sub: '#4821 · 13:55',  value: '₺480' },
            { label: 'Masa 7 — Ali K.',       sub: 'Ödemesiz · 14:22', value: '₺560' },
            { label: 'Masa 9 — Selin A.',     sub: '#4805 · 11:15',  value: '₺90'  },
          ]}
        />
      ),
    }
  }

  if (q.includes('maliyet') || q.includes('gider')) {
    return {
      role: 'assistant',
      text: 'Market alışverişi bugün ₺430 tuttu; geçen haftanın günlük ortalamasına göre %38 yüksek. Sebep olarak mevsimsel hammadde fiyatı veya fazla alım olabilir.',
      card: (
        <AiAlertBanner
          message="Anormal Gider Tespit Edildi"
          detail="Market alışverişi ₺430 → haftalık ort. ₺312. Tedarikçi fiyat listesini veya sipariş miktarını kontrol et."
        />
      ),
    }
  }

  if (q.includes('en çok') || q.includes('satan') || q.includes('urun') || q.includes('ürün')) {
    return {
      role: 'assistant',
      text: 'Bugün en çok satan ürün Izgara Köfte — 42 adet, ₺2.940 ciro. İkinci sırada Adana Kebap geliyor.',
      card: (
        <AiRankedList
          title="Bugün En Çok Satanlar"
          accent="success"
          rows={[
            { label: 'Izgara Köfte',  sub: '42 adet', value: '₺2.940' },
            { label: 'Adana Kebap',   sub: '35 adet', value: '₺2.450' },
            { label: 'Tavuk Şiş',    sub: '28 adet', value: '₺1.680' },
          ]}
        />
      ),
    }
  }

  if (q.includes('açık hesap') || q.includes('acik hesap') || q.includes('masa')) {
    return {
      role: 'assistant',
      text: '6 masada toplam ₺5.520 açık hesap var. En uzun süredir açık olan Masa 2 — 2 saat 14 dakika. Hızlı tahsilat için kasa ekranından işlem başlatabilirsin.',
      card: (
        <AiKpiStrip
          rows={[
            { label: 'Toplam açık',   value: '₺5.520', delta: '6 masa',    sign: 'flat' },
            { label: 'En uzun açık',  value: 'Masa 2',  delta: '2s 14d',   sign: 'down' },
            { label: 'Ort. hesap',    value: '₺920',    delta: 'masa başı', sign: 'flat' },
          ]}
        />
      ),
    }
  }

  // Generic fallback
  return {
    role: 'assistant',
    text: 'Soruyu anladım; şu an bu konuda detaylı veri çekemiyorum. Denetim veya Raporlar ekranından daha fazla bilgiye ulaşabilirsin.',
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Initial transcript shown when page opens (feels lived-in)
// ─────────────────────────────────────────────────────────────────────────────

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: '1',
    role: 'assistant',
    time: '09:02',
    text: 'Günaydın. Bugünün verilerine göre işletmen iyi bir açılış yaptı. Sormak istediğin bir şey var mı?',
  },
  {
    id: '2',
    role: 'user',
    time: '09:04',
    text: 'Dün akşamki kapanış nasıldı?',
  },
  {
    id: '3',
    role: 'assistant',
    time: '09:04',
    text: 'Dün 22:45\'te kapandı. Toplam ciro ₺31.240 — hedefin %11 üzerinde. Yalnızca 1 ödemesiz kapanış vardı, tutarı ₺320.',
    card: (
      <AiKpiStrip
        rows={[
          { label: 'Dün ciro',        value: '₺31.240', delta: '+%11',  sign: 'up'   },
          { label: 'Ödemesiz kapanış',value: '1 adet',   delta: '₺320', sign: 'down' },
          { label: 'Son sipariş',     value: '22:41',    sign: 'flat' },
        ]}
      />
    ),
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function BossMaiPage() {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES)
  const [thinking, setThinking] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, thinking])

  const handleSend = useCallback(
    async (text: string) => {
      if (thinking) return

      const userMsg: ChatMessage = {
        id: nextId(),
        role: 'user',
        time: makeTime(),
        text,
      }
      setMessages((prev) => [...prev, userMsg])
      setThinking(true)

      const { askBossAiApi } = await import('@/lib/boss-p0-data')
      const history = [...messages, userMsg]
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .slice(-8)
        .map((m) => ({ role: m.role, content: m.text }))

      const api = await askBossAiApi(text, history)
      if (api.ok && api.answer) {
        setMessages((prev) => [
          ...prev,
          {
            id: nextId(),
            role: 'assistant',
            time: makeTime(),
            text: api.answer,
          },
        ])
        const { postToNative } = await import('@/lib/boss-bridge')
        postToNative({ type: 'speak', text: api.answer })
        setThinking(false)
        return
      }

      const delay = 700 + Math.random() * 500
      setTimeout(() => {
        const reply = getAssistantReply(text)
        const assistantMsg: ChatMessage = {
          id: nextId(),
          time: makeTime(),
          ...reply,
        }
        setMessages((prev) => [...prev, assistantMsg])
        setThinking(false)
      }, delay)
    },
    [thinking, messages],
  )

  useEffect(() => {
    let offTranscript: (() => void) | undefined
    let offSession: (() => void) | undefined
    void import('@/lib/boss-bridge').then(({ onNativeTranscript, onNativeSession }) => {
      offTranscript = onNativeTranscript((t) => {
        if (t.trim()) void handleSend(t.trim())
      })
      offSession = onNativeSession(() => {})
    })
    return () => {
      offTranscript?.()
      offSession?.()
    }
  }, [handleSend])

  return (
    // Full-height flex column, no overflow on the outer shell
    <div className="flex flex-col h-svh bg-background overflow-hidden">
      {/* ── Header ── */}
      <BossMPageHeader
        title="Restroid AI"
        showBack
        trailing={
          <span className="flex items-center gap-1.5 h-7 px-2.5 rounded-full bg-success/15 border border-success/25">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            <span className="text-[11px] font-medium text-success">Aktif</span>
          </span>
        }
      />

      {/* ── Scrollable message area ── */}
      <div className="flex-1 overflow-y-auto px-0 py-2 space-y-1">
        {/* Daily summary card — always pinned at top of the feed */}
        <BossMaiDailySummaryCard />

        {/* Chat messages */}
        <div className="flex flex-col gap-4 px-4 pt-1 pb-2">
          {messages.map((msg) => (
            <BossMaiChatBubble key={msg.id} message={msg} />
          ))}

          {/* Thinking indicator */}
          {thinking && (
            <div className="flex items-center gap-2.5">
              <span className="flex items-center justify-center w-7 h-7 rounded-xl bg-primary/15 shrink-0">
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none" className="text-primary">
                  <path d="M8 1v3M8 12v3M1 8h3M12 8h3M3.05 3.05l2.12 2.12M10.83 10.83l2.12 2.12M3.05 12.95l2.12-2.12M10.83 5.17l2.12-2.12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                </svg>
              </span>
              <div className="flex items-center gap-1 bg-surface-2 border border-border/60 rounded-2xl rounded-bl-sm px-3.5 py-3">
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          )}

          {/* Scroll anchor */}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* ── Composer ── sticky at bottom ── */}
      <BossMaiComposer onSend={handleSend} disabled={thinking} />
    </div>
  )
}
