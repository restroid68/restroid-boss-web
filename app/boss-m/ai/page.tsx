'use client'

import { useEffect, useRef, useState, useCallback, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, Volume2, VolumeX, X } from 'lucide-react'
import { BossMPageHeader } from '@/components/boss/BossMPageHeader'
import { BossMaiDailySummaryCard } from '@/components/boss/ai/BossMaiDailySummaryCard'
import { BossMaiChatBubble } from '@/components/boss/ai/BossMaiChatBubble'
import type { ChatMessage } from '@/components/boss/ai/BossMaiChatBubble'
import { BossMaiComposer } from '@/components/boss/ai/BossMaiComposer'
import { BossMaiCommandSheet } from '@/components/boss/ai/BossMaiCommandSheet'
import {
  AiKpiStrip,
  AiAlertBanner,
} from '@/components/boss/ai/BossMaiInlineCards'
import { AiChartsBlock } from '@/components/boss/ai/BossMaiAiCharts'
import { BossAiTokenChip } from '@/components/boss/ai/BossAiTokenChip'
import { useBossAiFavorites } from '@/hooks/use-boss-ai-favorites'
import { useBossKeyboard } from '@/hooks/use-boss-keyboard'
import type { BossAiCommand } from '@/lib/boss-ai-commands'
import { bossFetch, formatMoneyTR } from '@/lib/boss-api'
import { cn } from '@/lib/utils'
import type {
  BossAiAskApiAnalysis,
  BossAiAskApiBulkDraft,
  BossAiAskApiChart,
  BossAiAskApiProductDraft,
  BossAiAskApiResult,
} from '@/lib/boss-p0-data'

const TTS_PREF_KEY = 'restroid_boss_ai_tts'

/** Hoparlör durumu — her oturum kapalı başlar; açarken ses türü seçilir. */
type BossTtsMode = 'off' | 'free' | 'premium'

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
  const prevLabel = prev?.label
  const showPrev = prevLabel && prevLabel !== '—' && Number(prev?.netSales ?? 0) > 0
  return (
    <AiKpiStrip
      hero
      rows={[
        {
          label: cur?.label ?? 'Bu dönem',
          value: `${formatMoneyTR(Number(cur?.netSales ?? 0))} TL`,
          delta: pctLabel(d?.netSalesPct),
          sign: signFromPct(d?.netSalesPct),
        },
        ...(showPrev
          ? [
              {
                label: prevLabel,
                value: `${formatMoneyTR(Number(prev?.netSales ?? 0))} TL`,
                sign: 'flat' as const,
              },
            ]
          : []),
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
  return <AiChartsBlock charts={charts} />
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

function bulkDraftCard(
  draft: BossAiAskApiBulkDraft,
  onConfirm: () => void,
  onUndo: () => void,
  confirming: boolean,
  showUndo: boolean,
  onPickOption?: (label: string) => void,
) {
  if (draft.queryOnly) return null
  const lines = (draft.summaryLines ?? []).join(' · ')
  const opts = draft.optionItems ?? []
  const detailText =
    lines ||
    (draft.sampleNames?.length
      ? `Örnek: ${draft.sampleNames.join(', ')}`
      : draft.scopeLabel || '')
  return (
    <div className="space-y-2">
      <AiAlertBanner
        message={
          draft.canConfirm
            ? `${draft.targetCount ?? 0} ürün — onay bekliyor`
            : draft.clarificationPrompt || 'Toplu güncelleme'
        }
        detail={detailText || '—'}
      />
      {opts.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {opts.slice(0, 12).map((o) => (
            <button
              key={o.id}
              type="button"
              disabled={confirming}
              onClick={() => onPickOption?.(o.label)}
              className="rounded-lg border border-border bg-surface-2 px-2 py-1 text-[11px] text-foreground active:bg-primary/15"
            >
              {o.label}
            </button>
          ))}
        </div>
      ) : null}
      {draft.canConfirm ? (
        <button
          type="button"
          disabled={confirming}
          onClick={onConfirm}
          className="h-10 w-full rounded-xl border border-primary/40 bg-primary/15 text-sm font-medium text-primary disabled:opacity-50"
        >
          {confirming ? 'Uygulanıyor…' : 'Onayla ve uygula'}
        </button>
      ) : null}
      {showUndo ? (
        <button
          type="button"
          disabled={confirming}
          onClick={onUndo}
          className="h-10 w-full rounded-xl border border-warning/40 bg-warning/10 text-sm font-medium text-warning disabled:opacity-50"
        >
          Son işlemi geri al
        </button>
      ) : null}
    </div>
  )
}

function buildAssistantCard(
  api: BossAiAskApiResult,
  onConfirmProduct: () => void,
  onConfirmBulk: () => void,
  onUndoBulk: () => void,
  confirming: boolean,
  showUndo: boolean,
  onPickOption?: (label: string) => void,
): ReactNode | undefined {
  if (api.bulkDraft) {
    return bulkDraftCard(
      api.bulkDraft,
      onConfirmBulk,
      onUndoBulk,
      confirming,
      showUndo,
      onPickOption,
    )
  }
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
  text: 'Merhaba. Satış, gider, stok, kurye ve cari hesaplar hakkında soru sorabilirsin. Alttan Komutlar ile hazır analiz seçebilir veya sık kullandıklarını yıldızlayabilirsin.',
}

export default function BossMaiPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME])
  const [thinking, setThinking] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [pendingDraft, setPendingDraft] = useState<BossAiAskApiProductDraft | null>(null)
  const [pendingBulk, setPendingBulk] = useState<BossAiAskApiBulkDraft | null>(null)
  const [canUndoBulk, setCanUndoBulk] = useState(false)
  const [commandsOpen, setCommandsOpen] = useState(false)
  /** Son yanıttan gelen takip soruları — chip olarak gösterilir */
  const [suggestions, setSuggestions] = useState<string[]>([])
  /** Sesli okuma — her zaman kapalı başlar; açarken ücretsiz / gelişmiş ses seçilir */
  const [ttsMode, setTtsMode] = useState<BossTtsMode>('off')
  const ttsModeRef = useRef<BossTtsMode>('off')
  const [voiceSheetOpen, setVoiceSheetOpen] = useState(false)
  const [voiceSheetBusy, setVoiceSheetBusy] = useState(false)
  /** Son seçilen ses türü — sheet'te vurgulanır */
  const [preferredVoice, setPreferredVoice] = useState<'free' | 'premium'>('free')
  const router = useRouter()
  const bottomRef = useRef<HTMLDivElement>(null)
  const messagesRef = useRef(messages)
  messagesRef.current = messages
  ttsModeRef.current = ttsMode

  const { favorites, isFavorite, toggleFavorite, removeFavorite } = useBossAiFavorites()
  const { keyboardOpen, keyboardInset } = useBossKeyboard()

  useEffect(() => {
    // Hoparlör her oturumda kapalı başlar; yalnızca son ses tercihi hatırlanır.
    try {
      const stored = window.localStorage.getItem(TTS_PREF_KEY)
      if (stored === 'premium' || stored === '1') setPreferredVoice('premium')
      else setPreferredVoice('free')
    } catch {
      /* ignore */
    }
  }, [])

  const toggleTts = useCallback(async () => {
    if (ttsModeRef.current !== 'off') {
      setTtsMode('off')
      const { postToNative } = await import('@/lib/boss-bridge')
      postToNative({ type: 'speakStop' })
      return
    }
    setVoiceSheetOpen(true)
  }, [])

  const chooseVoice = useCallback(
    async (mode: 'free' | 'premium') => {
      if (mode === 'premium') {
        // Gelişmiş ses token bakiyesinden düşer — bakiye yoksa önce yükleme sayfası.
        setVoiceSheetBusy(true)
        try {
          const res = await bossFetch<{ balanceTokens?: number }>('/api/ai-tokens/summary')
          if (res.ok && typeof res.data?.balanceTokens === 'number' && res.data.balanceTokens <= 0) {
            setVoiceSheetOpen(false)
            router.push('/boss-m/ai/tokenlar')
            return
          }
        } finally {
          setVoiceSheetBusy(false)
        }
      }
      setTtsMode(mode)
      setPreferredVoice(mode)
      try {
        window.localStorage.setItem(TTS_PREF_KEY, mode)
      } catch {
        /* ignore */
      }
      setVoiceSheetOpen(false)
    },
    [router],
  )

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, thinking, suggestions])

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

  const handleUndoBulk = useCallback(async () => {
    if (confirming) return
    setConfirming(true)
    try {
      const { undoBossAiBulkApi } = await import('@/lib/boss-p0-data')
      const res = await undoBossAiBulkApi()
      appendAssistant(res.message)
      if (res.ok) setCanUndoBulk(false)
    } finally {
      setConfirming(false)
    }
  }, [confirming, appendAssistant])

  const handleConfirmBulk = useCallback(
    async (draft: BossAiAskApiBulkDraft) => {
      if (confirming) return
      setConfirming(true)
      try {
        const { confirmBossAiBulkApi } = await import('@/lib/boss-p0-data')
        const res = await confirmBossAiBulkApi(draft)
        appendAssistant(
          res.message,
          res.ok && res.canUndo
            ? bulkDraftCard(
                { ...draft, canConfirm: false, summaryLines: [] },
                () => {},
                () => void handleUndoBulk(),
                false,
                true,
              )
            : undefined,
        )
        if (res.ok) {
          setPendingBulk(null)
          setCanUndoBulk(Boolean(res.canUndo))
        }
      } finally {
        setConfirming(false)
      }
    },
    [confirming, appendAssistant, handleUndoBulk],
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
      setSuggestions([])
      setThinking(true)

      try {
        const { askBossAiApi } = await import('@/lib/boss-p0-data')
        const history = [...messagesRef.current, userMsg]
          .filter((m) => m.role === 'user' || m.role === 'assistant')
          .slice(-8)
          .map((m) => ({ role: m.role, content: m.text }))

        const api = await askBossAiApi(text, history, {
          pendingProductDraft: pendingDraft,
          pendingBulkDraft: pendingBulk,
        })

        if (api.ok && api.answer) {
          const draft = api.productDraft ?? null
          const bulk = api.bulkDraft ?? null
          if (draft) setPendingDraft(draft)
          else {
            // Yeni niyet (chat/bulk/analiz) veya boş taslak → ürün clarification tuzağını bırak
            setPendingDraft(null)
          }
          if (bulk) setPendingBulk(bulk)
          else if (api.intent && api.intent !== 'product_bulk') setPendingBulk(null)
          if (api.intent === 'product_bulk_undo') setCanUndoBulk(false)

          const card = buildAssistantCard(
            api,
            () => {
              if (draft) void handleConfirmProduct(draft)
            },
            () => {
              if (bulk) void handleConfirmBulk(bulk)
            },
            () => void handleUndoBulk(),
            confirming,
            canUndoBulk && api.intent === 'product_bulk_undo' ? false : canUndoBulk,
            (label) => void handleSend(label),
          )
          appendAssistant(api.answer, card)
          // Taslak onayı beklenirken öneri chip'i gösterme (onay/seçenek butonlarıyla çakışır)
          if (!draft && !bulk && api.suggestions?.length) {
            setSuggestions(api.suggestions.slice(0, 3))
          }
          if (ttsModeRef.current !== 'off') {
            const { postToNative } = await import('@/lib/boss-bridge')
            postToNative({
              type: 'speak',
              text: api.answer,
              voice: ttsModeRef.current === 'free' ? 'device' : 'cloud',
            })
          }
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
    [
      thinking,
      pendingDraft,
      pendingBulk,
      confirming,
      canUndoBulk,
      appendAssistant,
      handleConfirmProduct,
      handleConfirmBulk,
      handleUndoBulk,
    ],
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
    <div
      className="flex h-full flex-col overflow-hidden bg-transparent"
      style={
        keyboardOpen && keyboardInset > 0
          ? { paddingBottom: Math.max(0, keyboardInset - 8) }
          : undefined
      }
    >
      <BossMPageHeader
        title="Restroid AI"
        showBack
        trailing={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void toggleTts()}
              aria-label={ttsMode !== 'off' ? 'Sesli okumayı kapat' : 'Sesli okumayı aç'}
              aria-pressed={ttsMode !== 'off'}
              title={
                ttsMode === 'off'
                  ? 'Ses kapalı'
                  : ttsMode === 'free'
                    ? 'Ücretsiz ses açık'
                    : 'Gelişmiş ses açık'
              }
              className={cn(
                'flex h-11 w-11 items-center justify-center rounded-xl border transition-colors',
                ttsMode !== 'off'
                  ? 'border-primary/40 bg-primary/15 text-primary'
                  : 'border-border bg-card/80 text-muted-foreground',
              )}
            >
              {ttsMode !== 'off' ? (
                <Volume2 size={20} strokeWidth={1.8} />
              ) : (
                <VolumeX size={20} strokeWidth={1.8} />
              )}
            </button>
            <BossAiTokenChip />
            <span className="flex h-7 items-center gap-1.5 rounded-full border border-success/25 bg-success/15 px-2.5">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
              <span className="text-[11px] font-medium text-success">Aktif</span>
            </span>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto px-0 py-2 space-y-1">
        <BossMaiDailySummaryCard />

        <div className="flex flex-col gap-4 px-4 pt-1 pb-2">
          {messages.map((msg) => (
            <BossMaiChatBubble key={msg.id} message={msg} />
          ))}

          {!thinking && suggestions.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pl-9">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => void handleSend(s)}
                  className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-[12px] font-medium text-primary active:bg-primary/20"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

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
              <div className="flex flex-col gap-1 bg-surface-2 border border-border/60 rounded-2xl rounded-bl-sm px-3.5 py-2.5 min-w-[140px]">
                <span className="text-[11px] font-medium text-muted-foreground">Hesaplanıyor…</span>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      <BossMaiComposer
        onSend={(t) => void handleSend(t)}
        disabled={thinking}
        favorites={favorites}
        onOpenCommands={() => setCommandsOpen(true)}
        onRemoveFavorite={removeFavorite}
      />

      <BossMaiCommandSheet
        open={commandsOpen}
        onClose={() => setCommandsOpen(false)}
        isFavorite={isFavorite}
        onToggleFavorite={toggleFavorite}
        onSelect={(cmd: BossAiCommand) => {
          setCommandsOpen(false)
          void handleSend(cmd.prompt)
        }}
      />

      {voiceSheetOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end bg-black/50"
          onClick={() => setVoiceSheetOpen(false)}
        >
          <div
            role="dialog"
            aria-label="Sesli okuma türü"
            className="rounded-t-2xl border-t border-border bg-background px-4 pt-4 pb-6 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">Sesli okuma</p>
              <button
                type="button"
                onClick={() => setVoiceSheetOpen(false)}
                aria-label="Kapat"
                className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground active:bg-surface-2"
              >
                <X size={18} />
              </button>
            </div>

            <button
              type="button"
              onClick={() => void chooseVoice('free')}
              className={cn(
                'flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors',
                preferredVoice === 'free'
                  ? 'border-primary/40 bg-primary/10'
                  : 'border-border bg-card/80 active:bg-surface-2',
              )}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-success/15 text-success">
                <Volume2 size={18} strokeWidth={1.8} />
              </span>
              <span className="flex flex-col">
                <span className="text-sm font-semibold text-foreground">Ücretsiz ses</span>
                <span className="text-[12px] text-muted-foreground">
                  Cihaz sesi, token harcamaz.
                </span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => void chooseVoice('premium')}
              disabled={voiceSheetBusy}
              className={cn(
                'flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors',
                preferredVoice === 'premium'
                  ? 'border-primary/40 bg-primary/10'
                  : 'border-border bg-card/80 active:bg-surface-2',
                voiceSheetBusy && 'opacity-60',
              )}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Sparkles size={18} strokeWidth={1.8} />
              </span>
              <span className="flex flex-col">
                <span className="text-sm font-semibold text-foreground">Gelişmiş ses</span>
                <span className="text-[12px] text-muted-foreground">
                  Doğal ses, token bakiyenden düşer.
                </span>
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
