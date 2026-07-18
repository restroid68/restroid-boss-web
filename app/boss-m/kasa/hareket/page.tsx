'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Receipt,
  ArrowLeftRight,
  CheckCircle2,
  Wallet,
  Building2,
  CreditCard,
  Plus,
} from 'lucide-react'
import { BossMPageHeader } from '@/components/boss/BossMPageHeader'
import { BossMMoneyInput } from '@/components/boss/BossMMoneyInput'
import { BossMMoneyText } from '@/components/boss/BossMMoneyText'
import { BossMSearchCreate } from '@/components/boss/BossMSearchCreate'
import { HAREKET_TYPES } from '@/lib/boss-mock'
import type { HareketType } from '@/lib/boss-mock'
import { useBossLoad } from '@/hooks/use-boss-load'
import { useBossKeyboard } from '@/hooks/use-boss-keyboard'
import {
  loadAccountsPage,
  loadExpenseCategories,
  postCashMovement,
  createExpenseCategoryLookup,
  createExpenseSubcategoryLookup,
  createFinanceAccount,
  type ExpenseCategoryOption,
} from '@/lib/boss-page-data'
import { parseMoneyTR } from '@/lib/boss-money'
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

const ACC_ICON = {
  cash: Wallet,
  bank: Building2,
  pos: CreditCard,
} as const

function readTypeFromUrl(): HareketType {
  if (typeof window === 'undefined') return 'giris'
  const t = new URLSearchParams(window.location.search).get('type') as HareketType | null
  return HAREKET_TYPES.some((x) => x.key === t) ? (t as HareketType) : 'giris'
}

export default function BossMHareketPage() {
  const router = useRouter()
  const { keyboardOpen, keyboardInset } = useBossKeyboard()

  const { data, loading, setData, reload } = useBossLoad(loadAccountsPage, {
    accounts: [],
    source: 'mock',
  })
  const accounts = data.accounts

  const [type, setType] = useState<HareketType>('giris')
  const [accountId, setAccountId] = useState('')
  const [rawAmount, setRawAmount] = useState('')
  const [note, setNote] = useState('')
  const [targetId, setTargetId] = useState('')
  const [categories, setCategories] = useState<ExpenseCategoryOption[]>([])
  const [catId, setCatId] = useState('')
  const [catLabel, setCatLabel] = useState('')
  const [subId, setSubId] = useState('')
  const [subLabel, setSubLabel] = useState('')
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [addingAccount, setAddingAccount] = useState(false)
  const [showNewAccount, setShowNewAccount] = useState(false)

  const meta = TYPE_META[type]
  const TypeIcon = meta.icon
  const isTransfer = type === 'transfer'
  const isExpense = type === 'gider'

  const catItems = useMemo(
    () => categories.map((c) => ({ id: c.id, label: c.name })),
    [categories],
  )
  const subItems = useMemo(() => {
    const cat = categories.find((c) => c.id === catId)
    return (cat?.subcategories ?? []).map((s) => ({ id: s.id, label: s.name }))
  }, [categories, catId])

  const canSave =
    parseMoneyTR(rawAmount) > 0 &&
    !!accountId &&
    !saving &&
    (!isExpense || (!!catId && !!subId)) &&
    (!isTransfer || (!!targetId && targetId !== accountId))

  useEffect(() => {
    setType(readTypeFromUrl())
  }, [])

  useEffect(() => {
    if (!accounts.length) return
    if (!accounts.some((a) => a.id === accountId)) setAccountId(accounts[0]!.id)
    const alt = accounts.find((a) => a.id !== (accountId || accounts[0]!.id))
    if (alt && (!targetId || targetId === accountId)) setTargetId(alt.id)
  }, [accounts, accountId, targetId])

  useEffect(() => {
    if (!isExpense) return
    let cancelled = false
    void loadExpenseCategories().then((cats) => {
      if (!cancelled) setCategories(cats)
    })
    return () => {
      cancelled = true
    }
  }, [isExpense])

  async function handleSave() {
    if (!canSave) return
    setSaving(true)
    setSaveError(null)
    const amount = parseMoneyTR(rawAmount)
    const result = await postCashMovement({
      type,
      accountId,
      amount,
      note: note || undefined,
      targetAccountId: type === 'transfer' ? targetId : undefined,
      expenseCategoryId: isExpense ? catId : undefined,
      expenseSubcategoryId: isExpense ? subId : undefined,
      expenseCategoryName: isExpense ? catLabel || undefined : undefined,
      expenseSubcategoryName: isExpense ? subLabel || undefined : undefined,
    })
    setSaving(false)
    if (!result.ok) {
      setSaveError(result.error || 'Kayıt başarısız')
      return
    }
    setSaved(true)
    setTimeout(() => router.back(), 1000)
  }

  async function handleAddAccount(name: string) {
    setAddingAccount(true)
    const res = await createFinanceAccount({ name, type: 'cash' })
    setAddingAccount(false)
    if (!res.ok || !res.account) {
      setSaveError(res.error || 'Hesap eklenemedi')
      return null
    }
    setData({
      accounts: [...accounts, res.account],
      source: 'api',
    })
    setAccountId(res.account.id)
    void reload()
    return { id: res.account.id, label: res.account.name }
  }

  return (
    <main
      className="flex min-h-0 flex-col bg-transparent"
      style={{ paddingBottom: keyboardOpen ? Math.max(keyboardInset - 24, 8) : 0 }}
    >
      <BossMPageHeader title="Nakit Hareket" showBack />

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-none px-4 pb-4 pt-1">
        {/* İşlem türü — klavye açıkken gizli */}
        {!keyboardOpen && (
          <section>
            <label className="mb-2 block px-0.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
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
                      'flex flex-col items-center gap-1.5 rounded-xl border py-3 transition-all',
                      active
                        ? `${m.bg} border-transparent ring-2 ${m.ring}`
                        : 'border-border bg-card/90',
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
        )}

        {/* Hesap — yatay kartlar; klavye açıkken gizli */}
        {!keyboardOpen && (
          <section>
            <div className="mb-2 flex items-center justify-between px-0.5">
              <label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Hesap
              </label>
            </div>
            {loading ? (
              <div className="flex gap-2 overflow-x-auto">
                {[0, 1].map((i) => (
                  <div key={i} className="h-16 w-36 shrink-0 animate-pulse rounded-xl bg-surface-2" />
                ))}
              </div>
            ) : (
              <div className="flex gap-2 overflow-x-auto pb-0.5">
                {accounts.map((acc) => {
                  const active = accountId === acc.id
                  const AccIcon = ACC_ICON[acc.type] ?? Wallet
                  return (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => setAccountId(acc.id)}
                      className={cn(
                        'flex min-w-[8.5rem] shrink-0 flex-col gap-1 rounded-xl border px-3 py-2.5 text-left transition-all',
                        active
                          ? 'border-primary/40 bg-primary/12 ring-1 ring-primary/30'
                          : 'border-border bg-card/90',
                      )}
                    >
                      <div className="flex items-center gap-1.5">
                        <AccIcon
                          size={14}
                          className={active ? 'text-primary' : 'text-muted-foreground'}
                        />
                        <span
                          className={cn(
                            'truncate text-xs font-semibold',
                            active ? 'text-primary' : 'text-foreground',
                          )}
                        >
                          {acc.name}
                        </span>
                      </div>
                      <BossMMoneyText
                        amount={acc.balance}
                        currency={acc.currency || '₺'}
                        className="w-full justify-end text-[11px]"
                        amountClassName="font-medium text-muted-foreground"
                      />
                    </button>
                  )
                })}
                <button
                  type="button"
                  onClick={() => setShowNewAccount((v) => !v)}
                  className="flex min-w-[5.5rem] shrink-0 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-primary/35 bg-primary/5 px-3 py-2.5 text-primary"
                >
                  <Plus size={18} />
                  <span className="text-[11px] font-semibold">Ekle</span>
                </button>
              </div>
            )}
            {showNewAccount ? (
              <div className="mt-2">
                <BossMSearchCreate
                  items={accounts.map((a) => ({ id: a.id, label: a.name }))}
                  valueId=""
                  placeholder={addingAccount ? 'Ekleniyor…' : 'Yeni hesap adı'}
                  onSelect={(item) => {
                    setAccountId(item.id)
                    setShowNewAccount(false)
                  }}
                  onCreate={async (name) => {
                    const created = await handleAddAccount(name)
                    if (created) setShowNewAccount(false)
                    return created
                  }}
                  createLabel="Hesap ekle"
                  emptyHint="Ad yazıp Yeni ekle"
                />
              </div>
            ) : null}
          </section>
        )}

        {isTransfer && !keyboardOpen && !loading && (
          <section>
            <label className="mb-2 block px-0.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Hedef Hesap
            </label>
            <div className="flex gap-2 overflow-x-auto pb-0.5">
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
                        'min-w-[8.5rem] shrink-0 rounded-xl border px-3 py-2.5 text-left text-xs font-semibold transition-all',
                        active
                          ? 'border-info/40 bg-info/12 text-info ring-1 ring-info/30'
                          : 'border-border bg-card/90 text-foreground',
                      )}
                    >
                      {acc.name}
                    </button>
                  )
                })}
            </div>
          </section>
        )}

        {isExpense && !keyboardOpen && (
          <section className="space-y-3">
            <BossMSearchCreate
              label="Gider kategorisi"
              items={catItems}
              valueId={catId}
              valueLabel={catLabel}
              placeholder="Kategori ara veya ekle"
              onSelect={(item) => {
                setCatId(item.id)
                setCatLabel(item.label)
                setSubId('')
                setSubLabel('')
              }}
              onCreate={async (name) => {
                const created = await createExpenseCategoryLookup(name)
                if (!created) {
                  setSaveError('Kategori eklenemedi')
                  return null
                }
                setCategories((prev) => [
                  ...prev,
                  { id: created.id, name: created.label, subcategories: [] },
                ])
                return created
              }}
            />
            <BossMSearchCreate
              label="Gider alt kategorisi"
              items={subItems}
              valueId={subId}
              valueLabel={subLabel}
              placeholder={catId ? 'Alt kategori ara veya ekle' : 'Önce kategori seçin'}
              disabled={!catId}
              onSelect={(item) => {
                setSubId(item.id)
                setSubLabel(item.label)
              }}
              onCreate={async (name) => {
                if (!catId) return null
                const created = await createExpenseSubcategoryLookup(name, catId)
                if (!created) {
                  setSaveError('Alt kategori eklenemedi')
                  return null
                }
                setCategories((prev) =>
                  prev.map((c) =>
                    c.id === catId
                      ? {
                          ...c,
                          subcategories: [
                            ...c.subcategories,
                            { id: created.id, name: created.label },
                          ],
                        }
                      : c,
                  ),
                )
                return created
              }}
            />
          </section>
        )}

        <section className={cn(keyboardOpen && 'sticky top-0 z-10 -mx-1 bg-background/95 px-1 py-2 backdrop-blur-sm')}>
          <label className="mb-2 block px-0.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Tutar
          </label>
          <BossMMoneyInput
            value={rawAmount}
            onChange={setRawAmount}
            accentClassName={rawAmount ? meta.accent : undefined}
          />
        </section>

        {!keyboardOpen && (
          <section>
            <label className="mb-2 block px-0.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Not
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Açıklama"
              rows={2}
              className="w-full resize-none rounded-xl border border-border bg-card/90 px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-primary/40"
            />
          </section>
        )}

        {saveError && (
          <p className="text-sm text-danger" role="alert">
            {saveError}
          </p>
        )}
      </div>

      <div
        className={cn(
          'border-t border-border bg-background/85 px-4 pt-3 backdrop-blur-sm',
          keyboardOpen ? 'pb-3' : 'pb-6',
        )}
      >
        <button
          type="button"
          onClick={() => void handleSave()}
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
              <CheckCircle2 size={20} />
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
