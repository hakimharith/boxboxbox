'use client'

import { Pause } from 'lucide-react'

interface PauseConfirmModalProps {
  isOpen: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function PauseConfirmModal({
  isOpen,
  onConfirm,
  onCancel,
}: PauseConfirmModalProps) {
  if (!isOpen) return null

  return (
    <div
      className="modal modal-open"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className="modal-box modal-enter">
        <h3 className="font-condensed text-base font-bold tracking-widest uppercase text-brand-txt mb-2">
          Pause Race?
        </h3>

        <p className="text-[11px] font-mono text-brand-txt2 leading-relaxed mb-4">
          All timers will freeze. Resume at any time to continue the race.
        </p>

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
            className="btn flex-1 bg-brand-bg4 border border-brand-border2 text-brand-txt hover:bg-brand-bg5"
          >
            <Pause size={13} />
            Pause
          </button>
        </div>
      </div>
    </div>
  )
}
