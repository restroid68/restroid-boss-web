'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Receipt,
  ArrowLeftRight,
  CheckCircle2,
} from 'lucide-react'
import { BossMPageHeader } from '@/components/boss/BossMPageHeader'
import { ACCOUNTS, HAREKET_TYPES } from '@/lib/boss-mock'
import type { HareketType } from '@/lib/boss-mock'
import { useBossLoad } from '@/hooks/use-boss-load'
import { loadAccountsPage, postCashMovement } from '@/lib/boss-page-data'
import { cn } from '@/lib/utils'

const TYPE_META: Record<
  HareketType,
  { icon: React.ElementType; accent: string; ring: string; bg: string }
> = {
  giris:    { icon: ArrowDownCircle, accent: 'text-success',  ring: 'ring-success/40',  bg: 'bg-success/10'  },
  cikis:    { icon: ArrowUpCircle,   accent: 'text-danger',   ring: 'ring-danger/40',   bg: 'bg-danger/10'   },
  gider:    { icon: Receipt,         accent: 'text-warning',  ring: 'ring-warning/40',  bg: 'bg-warning/10'  },
  transfer: { icon: ArrowLeftRight,  accent: 'text-info',     ring: 'ring-info/40',     bg: 'bg-info/10'     },
}

function formatTRY(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (!digits) return ''
  const n = parseInt(digits, 10)
  return n.toLocaleString('tr-TR')
}

export default function BossMHareketPage() {
  const router = useRouter()
  const { data, loading } = useBossLoad(loadAccountsPage, {
    accounts: ACCOUNTS,
    source: 'mock',
  })

  const accounts = data.accounts

  const [type, setType]           = useState<HareketType>('giris')
  const [accountId, setAccountId] = useState(ACCOUNTS[0].id)
  const [rawAmount, setRawAmount] = useState('')
  const [note, setNote]           = useState('')
  const [targetId, setTargetId]   = useState(ACCOUNTS[1]?.id ?? '')
  const [saved, setSaved]         = useState(false)
  const [saving, setSaving]       = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    if (!accounts.length) return
    if (!accounts.some((a) => a.id === accountId)) {
      setAccountId(accounts[0].id)
    }
    const alt = accounts.find((a) => a.id !== accounts[0].id)
    if (alt && !accounts.some((a) => a.id === targetId && a.id !== accountId)) {
      setTargetId(alt.id)
    }
  }, [accounts, accountId, targetId])

  const amountRef = useRef<HTMLInputElement>(null)
  const meta      = TYPE_META[type]
  const TypeIcon  = meta.icon
  const displayAmount = formatTRY(rawAmount)

  function handleAmountInput(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, '')
    setRawAmount(digits)
  }

  async function handleSave() {
    if (!rawAmount) {
      amountRef.current?.focus()
      return
    }
    setSaving(true)
    setSaveError(null)
    const amount = parseInt(rawAmount, 10)
    const result = await postCashMovement({
      type,
      accountId,
      amount,
      note: note || undefined,
      targetAccountId: type === 'transfer' ? targetId : undefined,
    })
    setSaving(false)
    if (!result.ok) {
      setSaveError(result.error || 'Kayıt başarısız')
      return
    }
    setSaved(true)
    setTimeout(() => router.back(), 1200)
  }

  const isTransfer = type === 'transfer'
  const canSave    = rawAmount.length > 0 && !saving

  return (
    <main className="flex flex-col h-screen bg-background">
      <BossMPageHeader title="Nakit Hareket" showBack />

      <div className="flex-1 overflow-y-auto overscroll-none px-4 pt-2 pb-4 flex flex-col gap-5">
        <section>
          <label className="block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2.5 px-0.5">
            İşlem Türü
          </label>
          <div className="grid grid-cols-4 gap-2">
            {HAREKET_TYPES.map((t) => {
              const m   = TYPE_META[t.key]
              const Ico = m.icon
              const active = type === t.key
              return (
                <button
                  key={t.key}
                  onClick={() => setType(t.key)}
                  className={cn(
                    'flex flex-col items-center gap-1.5 py-3.5 rounded-xl border transition-all',
                    active
                      ? `${m.bg} border-transparent ring-2 ${m.ring}`
                      : 'bg-card border-border'
                  )}
                >
                  <Ico
                    size={20}
                    strokeWidth={1.8}
                    className={active ? m.accent : 'text-muted-foreground'}
                  />
                  <span
                    className={cn(
                      'text-[11px] font-semibold leading-none',
                      active ? m.accent : 'text-muted-foreground'
                    )}
                  >
                    {t.label}
                  </span>
                </button>
              )
            })}
          </div>
        </section>

        <section>
          <label className="block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2.5 px-0.5">
            Hesap
          </label>
          {loading ? (
            <div className="space-y-2 animate-pulse">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="h-16 bg-surface-2 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {accounts.map((acc) => {
                const active = accountId === acc.id
                return (
                  <button
                    key={acc.id}
                    onClick={() => setAccountId(acc.id)}
                    className={cn(
                      'flex items-center justify-between px-4 py-3.5 rounded-xl border transition-all',
                      active
                        ? 'bg-primary/8 border-primary/40 ring-1 ring-primary/30'
                        : 'bg-card border-border'
                    )}
                  >
                    <div className="flex flex-col items-start gap-0.5">
                      <span className={cn('text-sm font-medium', active ? 'text-primary' : 'text-foreground')}>
                        {acc.name}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        Bakiye: {acc.currency}{acc.balance}
                      </span>
                    </div>
                    <div
                      className={cn(
                        'w-5 h-5 rounded-full border-2 transition-all shrink-0',
                        active ? 'border-primary bg-primary' : 'border-border bg-transparent'
                      )}
                    >
                      {active && (
                        <div className="w-full h-full rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                        </div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </section>

        {isTransfer && !loading && (
          <section>
            <label className="block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2.5 px-0.5">
              Hedef Hesap
            </label>
            <div className="flex flex-col gap-2">
              {accounts.filter((a) => a.id !== accountId).map((acc) => {
                const active = targetId === acc.id
                return (
                  <button
                    key={acc.id}
                    onClick={() => setTargetId(acc.id)}
                    className={cn(
                      'flex items-center justify-between px-4 py-3.5 rounded-xl border transition-all',
                      active
                        ? 'bg-info/8 border-info/40 ring-1 ring-info/30'
                        : 'bg-card border-border'
                    )}
                  >
                    <div className="flex flex-col items-start gap-0.5">
                      <span className={cn('text-sm font-medium', active ? 'text-info' : 'text-foreground')}>
                        {acc.name}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        Bakiye: {acc.currency}{acc.balance}
                      </span>
                    </div>
                    <div
                      className={cn(
                        'w-5 h-5 rounded-full border-2 transition-all shrink-0',
                        active ? 'border-info bg-info' : 'border-border bg-transparent'
                      )}
                    >
                      {active && (
                        <div className="w-full h-full rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-info-foreground" />
                        </div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </section>
        )}

        <section>
          <label className="block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2.5 px-0.5">
            Tutar
          </label>
          <div
            className={cn(
              'flex items-center bg-card border rounded-xl px-4 py-0 transition-all',
              rawAmount ? `border-transparent ring-2 ${meta.ring}` : 'border-border'
            )}
          >
            <span className={cn('text-2xl font-bold tabular-nums shrink-0 mr-1', meta.accent)}>
              ₺
            </span>
            <input
              ref={amountRef}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="0"
              value={displayAmount}
              onChange={handleAmountInput}
              className={cn(
                'flex-1 bg-transparent text-2xl font-bold tabular-nums outline-none py-4 placeholder:text-muted-foreground/40',
                rawAmount ? meta.accent : 'text-foreground'
              )}
            />
          </div>
        </section>

        <section>
          <label className="block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2.5 px-0.5">
            Not <span className="normal-case font-normal text-muted-foreground/50">(isteğe bağlı)</span>
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Açıklama ekle..."
            rows={3}
            className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none resize-none focus:ring-2 focus:ring-primary/40 focus:border-transparent transition-all leading-relaxed"
          />
        </section>

        {saveError && (
          <p className="text-sm text-danger px-1" role="alert">{saveError}</p>
        )}
      </div>

      <div className="px-4 pt-3 pb-6 bg-background border-t border-border">
        <button
          onClick={handleSave}
          disabled={!canSave}
          className={cn(
            'w-full h-14 rounded-2xl flex items-center justify-center gap-2.5 transition-all font-semibold text-[15px]',
            saved
              ? 'bg-success text-success-foreground'
              : canSave
                ? `${meta.bg} ${meta.accent} ring-2 ${meta.ring} active:scale-[0.98]`
                : 'bg-surface-2 text-muted-foreground cursor-not-allowed'
          )}
        >
          {saved ? (
            <>
              <CheckCircle2 size={20} strokeWidth={2} />
              Kaydedildi
            </>
          ) : saving ? (
            'Kaydediliyor…'
          ) : (
            <>
              <TypeIcon size={20} strokeWidth={1.8} />
              {HAREKET_TYPES.find((t) => t.key === type)?.label} Kaydet
            </>
          )}
        </button>
      </div>
    </main>
  )
}
