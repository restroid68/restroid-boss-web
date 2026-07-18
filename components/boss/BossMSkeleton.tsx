import { cn } from '@/lib/utils'

function Bone({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-lg bg-surface-2 animate-pulse',
        className
      )}
    />
  )
}

export function BossMSkeletonKpiRow() {
  return (
    <div className="grid grid-cols-4 gap-2 px-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-card rounded-xl p-3 flex flex-col gap-2">
          <Bone className="h-3 w-10" />
          <Bone className="h-5 w-12" />
          <Bone className="h-2.5 w-8" />
        </div>
      ))}
    </div>
  )
}

export function BossMSkeletonList({ rows = 4 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-px px-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="bg-card rounded-xl p-4 flex items-center gap-3">
          <Bone className="h-9 w-9 rounded-lg shrink-0" />
          <div className="flex-1 flex flex-col gap-2">
            <Bone className="h-3.5 w-32" />
            <Bone className="h-2.5 w-20" />
          </div>
          <Bone className="h-4 w-14" />
        </div>
      ))}
    </div>
  )
}

export function BossMSkeletonCard() {
  return (
    <div className="mx-4 bg-card rounded-2xl p-4 flex flex-col gap-3">
      <Bone className="h-4 w-24" />
      <Bone className="h-32 w-full rounded-xl" />
      <div className="grid grid-cols-2 gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Bone key={i} className="h-10 rounded-lg" />
        ))}
      </div>
    </div>
  )
}
