'use client'

import { Driver } from '@/types/database'
import { formatTime } from '@/lib/utils/formatTime'

interface SwapConfirmModalProps {
  isOpen: boolean
  currentDriver: Driver | null
  nextDriver: Driver | null
  currentStintElapsed: number
  swapNumber: number
  onConfirm: () => void
  onCancel: () => void
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

export default function SwapConfirmModal({
  isOpen,
  currentDriver,
  nextDriver,
  currentStintElapsed,
  swapNumber,
  onConfirm,
  onCancel,
}: SwapConfirmModalProps) {
  if (!isOpen) return null

  return (
    <div
      className="modal modal-open"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className="modal-box modal-enter">
        <h3 className="font-condensed text-base font-bold tracking-widest uppercase text-brand-txt mb-3">
          Swap #{swapNumber}
        </h3>

        {/* Ending stint */}
        <div className="bg-brand-bg4 border border-brand-border rounded px-3 py-2.5 mb-1">
          <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-brand-txt3 mb-2">
            Ending stint
          </p>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded flex items-center justify-center font-mono text-[9px] font-bold flex-shrink-0 bg-brand-bg3 border border-brand-border2 text-brand-txt2">
              {currentDriver ? getInitials(currentDriver.name) : '?'}
            </div>
            <div>
              <div className="text-sm font-condensed font-bold uppercase text-brand-txt">{currentDriver?.name ?? '—'}</div>
              <div className="font-mono text-[10px] text-brand-txt3 uppercase">
                Stint: {formatTime(currentStintElapsed)}
              </div>
            </div>
          </div>
        </div>

        {/* Arrow divider */}
        <div className="text-center text-brand-txt3 text-base my-1">↓</div>

        {/* Starting stint */}
        <div className="bg-brand-bg4 border border-brand-border rounded px-3 py-2.5 mb-4">
          <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-brand-txt3 mb-2">
            Starting stint
          </p>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded flex items-center justify-center font-mono text-[9px] font-bold flex-shrink-0 bg-brand-bg3 border border-brand-border2 text-brand-txt2">
              {nextDriver ? getInitials(nextDriver.name) : '?'}
            </div>
            <div>
              <div className="text-sm font-condensed font-bold uppercase text-brand-txt">{nextDriver?.name ?? '—'}</div>
            </div>
          </div>
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
            className="btn btn-primary flex-1"
          >
            Confirm swap
          </button>
        </div>
      </div>
    </div>
  )
}
