'use client'

import { useEffect, useRef, useState, useCallback, type ReactNode } from 'react'
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
import { formatMoneyTR } from '@/lib/boss-api'
import type {
  BossAiAskApiAnalysis,
  BossAiAskApiChart,
  BossAiAskApiProductDraft,
  BossAiAskApiResult,
} from '@/lib/boss-p0-data'

function makeTime() {
  const now = new Date()
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}

let _idCounter = 100

function nextId() {
  return String(++_idCounter)
}

function pctLabel(v: number | null | undefined): string | undefined {
  if (v == null || !Number.isFinite(v)) return undefined
  const sign = v > 0 ? 'up' : v < 0 ? 'down' : 'flat'
  const prefix = v > 0 ? '+' : ''
  return `${prefix}%${Math.abs(v).toFixed(1)}`
}

function signFromPct(v: number | null | undefined): 'up' | 'down' | 'flat' {
  if (v == null || !Number.isFinite(v) || v === 0) return 'flat'
  return v > 0 ? 'up' : 'down'
}

function analysisCard(analysis: BossAiAskApiAnalysis) {
  const cur = analysis.current
  const prev = analysis.previous
  const d = analysis.deltas
  return (
    <AiKpiStrip
      rows={[
        {
          label: cur?.label ?? 'Bu dönem',
          value: `${formatMoneyTR(Number(cur?.netSales ?? 0))} TL`,
          delta: pctLabel(d?.netSalesPct),
          sign: signFromPct(d?.netSalesPct),
        },
        {
          label: prev?.label ?? 'Önceki',
          value: `${formatMoneyTR(Number(prev?.netSales ?? 0))} TL`,
          sign: 'flat',
        },
        ...(analysis.productName
          ? [
              {
                label: analysis.productName,
                value:
                  cur?.productRevenue != null
                    ? `${formatMoneyTR(Number(cur.productRevenue))} TL`
                    : '—',
                delta:
                  cur?.productQty != null ? `${cur.productQty} adet` : pctLabel(d?.productRevenuePct),
                sign: signFromPct(d?.productRevenuePct),
              },
            ]
          : []),
      ]}
    />
  )
}

function chartsCard(charts: BossAiAskApiChart[]) {
  const first = charts[0]
  if (!first?.series?.length) return null
  return (
    <AiRankedList
      title={first.title || 'Grafik'}
      accent="success"
      rows={first.series.slice(0, 8).map((s) => ({
        label: s.label,
        sub: first.seriesALabel || 'Değer',
        value: `${formatMoneyTR(Number(s.value))} TL`,
      }))}
    />
  )
}

function productDraftCard(
  draft: BossAiAskApiProductDraft,
  onConfirm: () => void,
  confirming: boolean,
) {
  const lines = [
    draft.name ? `Ürün: ${draft.name}` : null,
    draft.priceDisplay || draft.price != null
      ? `Fiyat: ${draft.priceDisplay ?? formatMoneyTR(Number(draft.price))} TL`
      : null,
    draft.category ? `Kategori: ${draft.category}` : null,
    draft.taxLabel ? `KDV: ${draft.taxLabel}` : null,
    draft.productionAreaNames?.length
      ? `Üretim: ${draft.productionAreaNames.join(', ')}`
      : null,
  ]
    .filter(Boolean)
    .join(' · ')

  if (draft.pendingClarification || draft.clarificationPrompt) {
    return (
      <AiAlertBanner
        message="Eksik bilgi"
        detail={String(draft.clarificationPrompt || 'Devam etmek için yanıtla.')}
      />
    )
  }

  return (
    <div className="space-y-2">
      <AiAlertBanner
        message={draft.mode === 'update' ? 'Ürün güncelleme taslağı' : 'Ürün ekleme taslağı'}
        detail={lines || 'Taslak hazır.'}
      />
      {draft.canConfirm ? (
        <button
          type="button"
          disabled={confirming}
          onClick={onConfirm}
          className="w-full h-10 rounded-xl border border-primary/40 bg-primary/15 text-sm font-medium text-primary disabled:opacity-50"
        >
          {confirming ? 'Kaydediliyor…' : 'Onayla ve kaydet'}
        </button>
      ) : null}
    </div>
  )
}

function buildAssistantCard(
  api: BossAiAskApiResult,
  onConfirmProduct: () => void,
  confirming: boolean,
): ReactNode | undefined {
  if (api.productDraft) {
    return productDraftCard(api.productDraft, onConfirmProduct, confirming)
  }
  if (api.analysis) {
    return (
      <div className="space-y-2">
        {analysisCard(api.analysis)}
        {api.charts?.length ? chartsCard(api.charts) : null}
      </div>
    )
  }
  if (api.charts?.length) {
    return chartsCard(api.charts)
  }
  return undefined
}

const WELCOME: ChatMessage = {
  id: '1',
  role: 'assistant',
  time: makeTime(),
  text: 'Merhaba. Ciro, stok, açık hesap veya ürün ekleme hakkında sorabilirsin.',
}

export default function BossMaiPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME])
  const [thinking, setThinking] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [pendingDraft, setPendingDraft] = useState<BossAiAskApiProductDraft | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const messagesRef = useRef(messages)
  messagesRef.current = messages

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, thinking])

  const appendAssistant = useCallback((text: string, card?: ReactNode) => {
    setMessages((prev) => [
      ...prev,
      {
        id: nextId(),
        role: 'assistant',
        time: makeTime(),
        text,
        card,
      },
    ])
  }, [])

  const handleConfirmProduct = useCallback(
    async (draft: BossAiAskApiProductDraft) => {
      if (confirming) return
      setConfirming(true)
      try {
        const { confirmBossAiProductApi } = await import('@/lib/boss-p0-data')
        const res = await confirmBossAiProductApi(draft)
        appendAssistant(res.message || (res.ok ? 'Ürün kaydedildi.' : 'Kayıt başarısız.'))
        if (res.ok) setPendingDraft(null)
      } finally {
        setConfirming(false)
      }
    },
    [confirming, appendAssistant],
  )

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

      try {
        const { askBossAiApi } = await import('@/lib/boss-p0-data')
        const history = [...messagesRef.current, userMsg]
          .filter((m) => m.role === 'user' || m.role === 'assistant')
          .slice(-8)
          .map((m) => ({ role: m.role, content: m.text }))

        const api = await askBossAiApi(text, history, {
          pendingProductDraft: pendingDraft,
        })

        if (api.ok && api.answer) {
          const draft = api.productDraft ?? null
          if (draft) setPendingDraft(draft)
          else if (api.intent && api.intent !== 'product_create' && api.intent !== 'product_update') {
            setPendingDraft(null)
          }

          const card = buildAssistantCard(
            api,
            () => {
              if (draft) void handleConfirmProduct(draft)
            },
            confirming,
          )
          appendAssistant(api.answer, card)
          const { postToNative } = await import('@/lib/boss-bridge')
          postToNative({ type: 'speak', text: api.answer })
          return
        }

        appendAssistant(
          api.error?.trim()
            ? api.error
            : 'Yanıt alınamadı. Bağlantıyı kontrol edip tekrar dene.',
        )
      } catch {
        appendAssistant('AI isteği başarısız oldu. Biraz sonra tekrar dene.')
      } finally {
        setThinking(false)
      }
    },
    [thinking, pendingDraft, confirming, appendAssistant, handleConfirmProduct],
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
    <div className="flex h-svh flex-col overflow-hidden bg-transparent">
      <BossMPageHeader
        title="Restroid AI"
        showBack
        trailing={
          <span className="flex h-7 items-center gap-1.5 rounded-full border border-success/25 bg-success/15 px-2.5">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
            <span className="text-[11px] font-medium text-success">Aktif</span>
          </span>
        }
      />

      <div className="flex-1 overflow-y-auto px-0 py-2 space-y-1">
        <BossMaiDailySummaryCard />

        <div className="flex flex-col gap-4 px-4 pt-1 pb-2">
          {messages.map((msg) => (
            <BossMaiChatBubble key={msg.id} message={msg} />
          ))}

          {thinking && (
            <div className="flex items-center gap-2.5">
              <span className="flex items-center justify-center w-7 h-7 rounded-xl bg-primary/15 shrink-0">
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none" className="text-primary">
                  <path
                    d="M8 1v3M8 12v3M1 8h3M12 8h3M3.05 3.05l2.12 2.12M10.83 10.83l2.12 2.12M3.05 12.95l2.12-2.12M10.83 5.17l2.12-2.12"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              <div className="flex items-center gap-1 bg-surface-2 border border-border/60 rounded-2xl rounded-bl-sm px-3.5 py-3">
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      <BossMaiComposer onSend={(t) => void handleSend(t)} disabled={thinking} />
    </div>
  )
}
