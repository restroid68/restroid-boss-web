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
import {
  loadAccountsPage,
  loadExpenseCategories,
  postCashMovement,
  type ExpenseCategoryOption,
} from '@/lib/boss-page-data'
import {
  formatMoneyTypingDisplay,
  parseMoneyTR,
  sanitizeMoneyTyping,
} from '@/lib/boss-money'
import { cn } from '@/lib/utils'

const TYPE_META: Record<
  HareketType,
  { icon: React.ElementType; accent: string; ring: string; bg: string }
> = {
  giris: { icon: ArrowDownCircle, accent: 'text-success', ring: 'ring-success/40', bg: 'bg-success/10' },
  cikis: { icon: ArrowUpCircle, accent: 'text-danger', ring: 'ring-danger/40', bg: 'bg-danger/10' },
  gider: { icon: Receipt, accent: 'text-warning', ring: 'ring-warning/40', bg: 'bg-warning/10' },
  transfer: { icon: ArrowLeftRight, accent: 'text-info', ring: 'ring-info/40', bg: 'bg-info/10' },
}

function readTypeFromUrl(): HareketType {
  if (typeof window === 'undefined') return 'giris'
  const t = new URLSearchParams(window.location.search).get('type') as HareketType | null
  return HAREKET_TYPES.some((x) => x.key === t) ? (t as HareketType) : 'giris'
}

export default function BossMHareketPage() {
  const router = useRouter()

  const { data, loading } = useBossLoad(loadAccountsPage, {
    accounts: [],
    source: 'mock',
  })

  const accounts = data.accounts

  const [type, setType] = useState<HareketType>('giris')

  useEffect(() => {
    setType(readTypeFromUrl())
  }, [])
  const [accountId, setAccountId] = useState('')
  const [rawAmount, setRawAmount] = useState('')
  const [note, setNote] = useState('')
  const [targetId, setTargetId] = useState('')
  const [categories, setCategories] = useState<ExpenseCategoryOption[]>([])
  const [catId, setCatId] = useState('')
  const [subId, setSubId] = useState('')
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [kbPad, setKbPad] = useState(0)

  const amountRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const meta = TYPE_META[type]
  const TypeIcon = meta.icon
  const displayAmount = formatMoneyTypingDisplay(rawAmount)
  const selectedCat = categories.find((c) => c.id === catId)
  const isTransfer = type === 'transfer'
  const isExpense = type === 'gider'
  const canSave =
    rawAmount.length > 0 &&
    !!accountId &&
    !saving &&
    (!isExpense || !!catId) &&
    (!isTransfer || (!!targetId && targetId !== accountId))

  useEffect(() => {
    if (!accounts.length) return
    if (!accounts.some((a) => a.id === accountId)) {
      setAccountId(accounts[0]!.id)
    }
    const alt = accounts.find((a) => a.id !== (accountId || accounts[0]!.id))
    if (alt && (!targetId || targetId === accountId)) {
      setTargetId(alt.id)
    }
  }, [accounts, accountId, targetId])

  useEffect(() => {
    if (!isExpense) return
    let cancelled = false
    void loadExpenseCategories().then((cats) => {
      if (cancelled) return
      setCategories(cats)
      if (cats[0] && !catId) {
        setCatId(cats[0].id)
        setSubId(cats[0].subcategories[0]?.id ?? '')
      }
    })
    return () => {
      cancelled = true
    }
  }, [isExpense, catId])

  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const sync = () => {
      const overflow = Math.max(0, window.innerHeight - vv.height - vv.offsetTop)
      setKbPad(overflow > 40 ? overflow : 0)
    }
    vv.addEventListener('resize', sync)
    vv.addEventListener('scroll', sync)
    sync()
    return () => {
      vv.removeEventListener('resize', sync)
      vv.removeEventListener('scroll', sync)
    }
  }, [])

  function handleAmountInput(e: React.ChangeEvent<HTMLInputElement>) {
    setRawAmount(sanitizeMoneyTyping(e.target.value))
  }

  function focusAmount() {
    amountRef.current?.focus()
    requestAnimationFrame(() => {
      amountRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    })
  }

  async function handleSave() {
    if (!canSave) {
      focusAmount()
      return
    }
    setSaving(true)
    setSaveError(null)
    const amount = parseMoneyTR(rawAmount)
    if (!(amount > 0)) {
      setSaving(false)
      setSaveError('Geçerli tutar girin')
      focusAmount()
      return
    }
    const result = await postCashMovement({
      type,
      accountId,
      amount,
      note: note || undefined,
      targetAccountId: type === 'transfer' ? targetId : undefined,
      expenseCategoryId: isExpense ? catId : undefined,
      expenseSubcategoryId: isExpense ? subId || undefined : undefined,
      expenseCategoryName: isExpense ? selectedCat?.name : undefined,
      expenseSubcategoryName: isExpense
        ? selectedCat?.subcategories.find((s) => s.id === subId)?.name
        : undefined,
    })
    setSaving(false)
    if (!result.ok) {
      setSaveError(result.error || 'Kayıt başarısız')
      return
    }
    setSaved(true)
    setTimeout(() => router.back(), 1200)
  }

  return (
    <main className="flex min-h-0 flex-col bg-transparent" style={{ paddingBottom: kbPad }}>
      <BossMPageHeader title="Nakit Hareket" showBack />

      <div
        ref={scrollRef}
        className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto overscroll-none px-4 pb-4 pt-2"
      >
        <section>
          <label className="mb-2.5 block px-0.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            İşlem Türü
          </label>
          <div className="grid grid-cols-4 gap-2">
            {HAREKET_TYPES.map((t) => {
              const m = TYPE_META[t.key]
              const Ico = m.icon
              const active = type === t.key
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setType(t.key)}
                  className={cn(
                    'flex flex-col items-center gap-1.5 rounded-xl border py-3.5 transition-all',
                    active ? `${m.bg} border-transparent ring-2 ${m.ring}` : 'border-border bg-card/90',
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
                      active ? m.accent : 'text-muted-foreground',
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
          <label className="mb-2.5 block px-0.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Hesap
          </label>
          {loading ? (
            <div className="space-y-2 animate-pulse">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="h-16 rounded-xl bg-surface-2" />
              ))}
            </div>
          ) : accounts.length === 0 ? (
            <p className="rounded-xl border border-border bg-card/90 px-4 py-3 text-sm text-muted-foreground" role="alert">
              Tanımlı kasa/banka hesabı yok.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {accounts.map((acc) => {
                const active = accountId === acc.id
                return (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => setAccountId(acc.id)}
                    className={cn(
                      'flex items-center justify-between rounded-xl border px-4 py-3.5 transition-all',
                      active
                        ? 'border-primary/40 bg-primary/10 ring-1 ring-primary/30'
                        : 'border-border bg-card/90',
                    )}
                  >
                    <div className="flex flex-col items-start gap-0.5">
                      <span className={cn('text-sm font-medium', active ? 'text-primary' : 'text-foreground')}>
                        {acc.name}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        Bakiye: {acc.currency}
                        {acc.balance}
                      </span>
                    </div>
                    <div
                      className={cn(
                        'h-5 w-5 shrink-0 rounded-full border-2',
                        active ? 'border-primary bg-primary' : 'border-border bg-transparent',
                      )}
                    />
                  </button>
                )
              })}
            </div>
          )}
        </section>

        {isExpense && (
          <section className="space-y-3">
            <div>
              <label className="mb-2 block px-0.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Gider kategorisi
              </label>
              <select
                value={catId}
                onChange={(e) => {
                  setCatId(e.target.value)
                  const cat = categories.find((c) => c.id === e.target.value)
                  setSubId(cat?.subcategories[0]?.id ?? '')
                }}
                className="h-12 w-full rounded-xl border border-border bg-card/90 px-3 text-sm text-foreground"
              >
                {categories.length === 0 ? (
                  <option value="">Kategori yükleniyor…</option>
                ) : (
                  categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))
                )}
              </select>
            </div>
            {(selectedCat?.subcategories.length ?? 0) > 0 && (
              <div>
                <label className="mb-2 block px-0.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Alt kategori
                </label>
                <select
                  value={subId}
                  onChange={(e) => setSubId(e.target.value)}
                  className="h-12 w-full rounded-xl border border-border bg-card/90 px-3 text-sm text-foreground"
                >
                  {selectedCat!.subcategories.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </section>
        )}

        {isTransfer && !loading && (
          <section>
            <label className="mb-2.5 block px-0.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Hedef Hesap
            </label>
            <div className="flex flex-col gap-2">
              {accounts
                .filter((a) => a.id !== accountId)
                .map((acc) => {
                  const active = targetId === acc.id
                  return (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => setTargetId(acc.id)}
                      className={cn(
                        'flex items-center justify-between rounded-xl border px-4 py-3.5 transition-all',
                        active
                          ? 'border-info/40 bg-info/10 ring-1 ring-info/30'
                          : 'border-border bg-card/90',
                      )}
                    >
                      <div className="flex flex-col items-start gap-0.5">
                        <span className={cn('text-sm font-medium', active ? 'text-info' : 'text-foreground')}>
                          {acc.name}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          Bakiye: {acc.currency}
                          {acc.balance}
                        </span>
                      </div>
                    </button>
                  )
                })}
            </div>
          </section>
        )}

        <section>
          <label className="mb-2.5 block px-0.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Tutar
          </label>
          <div
            className={cn(
              'flex items-center rounded-xl border bg-card/90 px-4 transition-all',
              rawAmount ? `border-transparent ring-2 ${meta.ring}` : 'border-border',
            )}
          >
            <span className={cn('mr-2 shrink-0 text-2xl font-bold tabular-nums', meta.accent)}>₺</span>
            <input
              ref={amountRef}
              type="text"
              inputMode="decimal"
              placeholder="0"
              value={displayAmount}
              onChange={handleAmountInput}
              onFocus={() => {
                requestAnimationFrame(() => {
                  amountRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
                })
              }}
              className={cn(
                'w-full bg-transparent py-4 text-right text-2xl font-bold tabular-nums outline-none placeholder:text-muted-foreground/40',
                rawAmount ? meta.accent : 'text-foreground',
              )}
            />
          </div>
        </section>

        <section>
          <label className="mb-2.5 block px-0.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Not <span className="normal-case font-normal text-muted-foreground/50">(isteğe bağlı)</span>
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Açıklama"
            rows={3}
            onFocus={(e) => {
              requestAnimationFrame(() => {
                e.currentTarget.scrollIntoView({ block: 'center', behavior: 'smooth' })
              })
            }}
            className="w-full resize-none rounded-xl border border-border bg-card/90 px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground/50 focus:border-transparent focus:ring-2 focus:ring-primary/40"
          />
        </section>

        {saveError && (
          <p className="px-1 text-sm text-danger" role="alert">
            {saveError}
          </p>
        )}
      </div>

      <div className="border-t border-border bg-background/80 px-4 pb-6 pt-3 backdrop-blur-sm">
        <button
          type="button"
          onClick={handleSave}
          disabled={!canSave}
          className={cn(
            'flex h-14 w-full items-center justify-center gap-2.5 rounded-2xl text-[15px] font-semibold transition-all',
            saved
              ? 'bg-success text-success-foreground'
              : canSave
                ? `${meta.bg} ${meta.accent} ring-2 ${meta.ring} active:scale-[0.98]`
                : 'cursor-not-allowed bg-surface-2 text-muted-foreground',
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
