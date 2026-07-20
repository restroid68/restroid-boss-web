'use client'

import { useState } from 'react'
import {
  ArrowRight,
  Truck,
  Clock,
  CheckCircle2,
  ArrowLeftRight,
  Package,
  CalendarDays,
  StickyNote,
} from 'lucide-react'
import { BossMPageHeader } from '@/components/boss/BossMPageHeader'
import { BossMEmptyState } from '@/components/boss/BossMEmptyState'
import { STOK_TRANSFERS, STOK_WAREHOUSES } from '@/lib/boss-mock'
import type { TransferStatus, StokTransfer, StokWarehouse } from '@/lib/boss-mock'
import { useBossLoad } from '@/hooks/use-boss-load'
import { loadTransfersPage } from '@/lib/boss-page-data'
import { cn } from '@/lib/utils'

function warehouseName(id: string, warehouses: StokWarehouse[]) {
  return warehouses.find((w) => w.id === id)?.name ?? id
}

const TAB_OPTIONS: TransferStatus[] = ['Bekleyen', 'Yolda', 'Tamamlanan']

const STATUS_CONFIG: Record<TransferStatus, {
  icon: React.ElementType
  badge: string
  cardBorder: string
  iconBg: string
  iconColor: string
}> = {
  Bekleyen: {
    icon: Clock,
    badge:      'bg-warning/10 text-warning border-warning/20',
    cardBorder: 'border-warning/30',
    iconBg:     'bg-warning/10',
    iconColor:  'text-warning',
  },
  Yolda: {
    icon: Truck,
    badge:      'bg-info/10 text-info border-info/20',
    cardBorder: 'border-info/30',
    iconBg:     'bg-info/10',
    iconColor:  'text-info',
  },
  Tamamlanan: {
    icon: CheckCircle2,
    badge:      'bg-success/10 text-success border-success/20',
    cardBorder: 'border-border',
    iconBg:     'bg-success/10',
    iconColor:  'text-success',
  },
}

function TransferCard({
  transfer,
  warehouses,
  onApprove,
  onDetail,
}: {
  transfer: StokTransfer
  warehouses: StokWarehouse[]
  onApprove?: (id: string) => void
  onDetail?: (id: string) => void
}) {
  const cfg = STATUS_CONFIG[transfer.status]
  const StatusIcon = cfg.icon
  const isPending = transfer.status === 'Bekleyen'
  const isInTransit = transfer.status === 'Yolda'

  return (
    <div className={cn('bg-card border rounded-2xl px-4 py-4 flex flex-col gap-3', cfg.cardBorder)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className={cn('flex items-center justify-center w-9 h-9 rounded-xl shrink-0', cfg.iconBg)}>
            <StatusIcon size={16} className={cfg.iconColor} strokeWidth={1.7} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-sm font-semibold text-foreground truncate">
                {warehouseName(transfer.fromWarehouseId, warehouses)}
              </span>
              <ArrowRight size={12} className="text-muted-foreground shrink-0" />
              <span className="text-sm font-semibold text-foreground truncate">
                {warehouseName(transfer.toWarehouseId, warehouses)}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">#{transfer.id}</p>
          </div>
        </div>
        <span className={cn(
          'text-[10px] font-semibold px-2 py-1 rounded-full border shrink-0',
          cfg.badge
        )}>
          {transfer.status}
        </span>
      </div>

      <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Package size={11} />
          <span className="tabular-nums">{transfer.itemCount} kalem</span>
        </div>
        <div className="flex items-center gap-1.5">
          <CalendarDays size={11} />
          <span>{transfer.time}</span>
        </div>
        {transfer.note && (
          <div className="flex items-center gap-1.5 ml-auto">
            <StickyNote size={11} />
            <span className="truncate max-w-[100px]">{transfer.note}</span>
          </div>
        )}
      </div>

      {(isPending || isInTransit) && (
        <div className="flex items-center gap-2 pt-3 border-t border-border">
          <button
            onClick={() => onDetail?.(transfer.id)}
            className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-xl border border-border text-xs font-medium text-muted-foreground active:bg-surface-2 transition-colors"
          >
            Detay
          </button>
          {isPending && (
            <button
              onClick={() => onApprove?.(transfer.id)}
              className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-xl bg-primary/10 border border-primary/30 text-xs font-semibold text-primary active:bg-primary/20 transition-colors"
            >
              Onayla
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default function BossMStokTransferlerPage() {
  const { data, loading } = useBossLoad(loadTransfersPage, {
    transfers: STOK_TRANSFERS,
    warehouses: STOK_WAREHOUSES,
    source: 'mock',
  })
  const [activeTab, setActiveTab] = useState<TransferStatus>('Bekleyen')
  const [approvedIds, setApprovedIds] = useState<Set<string>>(new Set())

  function handleApprove(id: string) {
    setApprovedIds((prev) => new Set(prev).add(id))
  }

  const counts: Record<TransferStatus, number> = {
    Bekleyen:   data.transfers.filter((t) => t.status === 'Bekleyen'   && !approvedIds.has(t.id)).length,
    Yolda:      data.transfers.filter((t) => t.status === 'Yolda'      || approvedIds.has(t.id)).length,
    Tamamlanan: data.transfers.filter((t) => t.status === 'Tamamlanan' && !approvedIds.has(t.id)).length,
  }

  const filtered = data.transfers.filter((t) => {
    if (activeTab === 'Bekleyen')   return t.status === 'Bekleyen'   && !approvedIds.has(t.id)
    if (activeTab === 'Yolda')      return t.status === 'Yolda'      || approvedIds.has(t.id)
    return t.status === 'Tamamlanan' && !approvedIds.has(t.id)
  })

  const tabColor: Record<TransferStatus, string> = {
    Bekleyen:   'bg-warning/10 border-warning/40 text-warning',
    Yolda:      'bg-info/10    border-info/40    text-info',
    Tamamlanan: 'bg-success/10 border-success/40 text-success',
  }
  const badgeColor: Record<TransferStatus, string> = {
    Bekleyen:   'bg-warning/20 text-warning',
    Yolda:      'bg-info/20    text-info',
    Tamamlanan: 'bg-success/20 text-success',
  }

  return (
    <main className="flex flex-col h-full bg-transparent overflow-hidden">
      <BossMPageHeader title="Transferler" showBack />

      <div className="flex gap-2 px-4 pb-4 overflow-x-auto">
        {TAB_OPTIONS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium whitespace-nowrap transition-colors',
              activeTab === tab ? tabColor[tab] : 'bg-card border-border text-muted-foreground'
            )}
          >
            {tab}
            <span className={cn(
              'text-[10px] font-bold px-1.5 py-0.5 rounded-full',
              activeTab === tab ? badgeColor[tab] : 'bg-surface-3 text-muted-foreground'
            )}>
              {counts[tab]}
            </span>
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto overscroll-none pb-[72px] px-4">
        {loading ? (
          <div className="flex flex-col gap-3 animate-pulse">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-surface-2 rounded-2xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <BossMEmptyState
            icon={ArrowLeftRight}
            title="Transfer bulunamadı"
            description="Bu durumda kayıt yok."
          />
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((transfer) => (
              <TransferCard
                key={transfer.id}
                transfer={
                  approvedIds.has(transfer.id)
                    ? { ...transfer, status: 'Yolda' as TransferStatus }
                    : transfer
                }
                warehouses={data.warehouses}
                onApprove={handleApprove}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
