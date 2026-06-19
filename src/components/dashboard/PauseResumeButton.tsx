'use client'

import { Pause, Play } from 'lucide-react'

interface PauseResumeButtonProps {
  isHost: boolean
  isPaused: boolean
  onPause: () => void
  onResume: () => void
}

export default function PauseResumeButton({
  isHost,
  isPaused,
  onPause,
  onResume,
}: PauseResumeButtonProps) {
  if (!isHost) return null

  if (isPaused) {
    return (
      <button
        type="button"
        onClick={onResume}
        className="btn btn-primary flex-1 min-h-[52px] gap-1.5"
      >
        <Play size={14} />
        Resume race
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={onPause}
      className="btn btn-ghost border border-brand-border2 text-brand-txt flex-1 min-h-[52px] gap-1.5 hover:bg-brand-bg5"
    >
      <Pause size={14} />
      Pause
    </button>
  )
}
