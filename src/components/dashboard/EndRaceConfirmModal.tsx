'use client'

import { AlertTriangle } from 'lucide-react'
import { Event, Driver } from '@/types/database'
import { formatTime } from '@/lib/utils/formatTime'

interface EndRaceConfirmModalProps {
  isOpen: boolean
  event: Event
  currentDriver: Driver | null
  elapsed: number
  swapCount: number
  currentStintElapsed: number
  onConfirm: () => void
  onCancel: () => void
}

export default function EndRaceConfirmModal({
  isOpen,
  event,
  currentDriver,
  elapsed,
  swapCount,
  currentStintElapsed,
  onConfirm,
  onCancel,
}: EndRaceConfirmModalProps) {
  if (!isOpen) return null

  const totalDurationSeconds = event.total_duration_minutes * 60

  return (
    <div
      className="modal modal-open"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className="modal-box modal-enter">
        <h3 className="font-condensed text-base font-bold tracking-widest uppercase text-brand-red mb-3">
          End Race?
        </h3>

        {/* Warning */}
        <div className="bg-[rgba(255,61,61,0.08)] border border-brand-red/40 rounded px-3 py-2.5 mb-3">
          <p className="text-xs text-brand-txt leading-relaxed">
            <AlertTriangle size={11} className="inline text-brand-red mr-1 align-text-bottom" />
            This ends the race for all participants and cannot be undone.
          </p>
        </div>

        {/* Race snapshot */}
        <div className="bg-brand-bg4 border border-brand-border rounded px-3 py-2.5 mb-4">
          <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-brand-txt3 mb-2">
            Race snapshot
          </p>
          <p className="text-[10px] font-mono text-brand-txt2">
            {formatTime(elapsed)} elapsed of {formatTime(totalDurationSeconds)}
          </p>
          <p className="text-[10px] font-mono text-brand-txt2 mt-1">
            {swapCount}{event.total_swaps_target ? ` / ${event.total_swaps_target}` : ''} swaps completed
          </p>
          {currentDriver && (
            <p className="text-[10px] font-mono text-brand-txt2 mt-1">
              On track: {currentDriver.name} · {formatTime(currentStintElapsed)}
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-ghost border border-brand-border2 text-brand-txt2 flex-1 hover:border-brand-border hover:text-brand-txt"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="btn btn-error flex-1"
          >
            End race
          </button>
        </div>
      </div>
    </div>
  )
}
