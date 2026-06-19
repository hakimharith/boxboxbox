'use client'

import { FlaskConical, X } from 'lucide-react'

interface TestModeBarProps {
  isHost: boolean
  isTestMode: boolean
  onExit: () => void
}

export default function TestModeBar({ isHost, isTestMode, onExit }: TestModeBarProps) {
  if (!isTestMode) return null

  return (
    <div className="mb-2">
      <div className="test-stripe mb-1.5" />
      <div role="alert" className="alert bg-brand-purple/10 border border-brand-purple/25 text-brand-purple rounded gap-2 mb-2">
        <FlaskConical size={14} className="flex-shrink-0" />
        <div>
          <p className="font-condensed text-xs font-bold tracking-wide uppercase">
            Test mode active
          </p>
          <p className="text-[9px] text-brand-purple/80 mt-0.5 font-sans normal-case">
            Timers run at 60× speed. No data is saved. Use this to rehearse the race flow before the start.
          </p>
        </div>
      </div>
      {isHost && (
        <button
          type="button"
          onClick={onExit}
          className="btn btn-ghost border border-brand-purple/25 text-brand-purple w-full btn-sm gap-1 hover:border-brand-purple/50"
        >
          <X size={11} />
          Exit test — no data saved
        </button>
      )}
    </div>
  )
}
