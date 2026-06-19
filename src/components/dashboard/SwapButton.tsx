'use client'

import { RefreshCw } from 'lucide-react'

interface SwapButtonProps {
  isHost: boolean
  nextDriverName: string | null
  onSwap: () => void
  isTestMode?: boolean
}

export default function SwapButton({
  isHost,
  nextDriverName,
  onSwap,
  isTestMode = false,
}: SwapButtonProps) {
  void nextDriverName
  if (!isHost) return null

  return (
    <button
      type="button"
      onClick={onSwap}
      className={`btn flex-1 min-h-[52px] gap-1.5 ${
        isTestMode
          ? 'btn-accent'
          : 'btn-primary'
      }`}
    >
      <RefreshCw size={14} />
      Swap Driver
    </button>
  )
}
