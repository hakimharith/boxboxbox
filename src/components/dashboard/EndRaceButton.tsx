'use client'

import { Flag } from 'lucide-react'

interface EndRaceButtonProps {
  isHost: boolean
  onEnd: () => void
}

export default function EndRaceButton({ isHost, onEnd }: EndRaceButtonProps) {
  if (!isHost) return null

  return (
    <button
      type="button"
      onClick={onEnd}
      className="btn btn-error flex-1 min-h-[52px] gap-1.5 tracking-wider"
    >
      <Flag size={13} />
      End race
    </button>
  )
}
