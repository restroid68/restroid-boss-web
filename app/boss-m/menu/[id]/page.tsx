'use client'

import { use } from 'react'
import { BossMProductEditor } from '@/components/boss/menu/BossMProductEditor'

export default function BossMMenuDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return <BossMProductEditor uuid={id} />
}
