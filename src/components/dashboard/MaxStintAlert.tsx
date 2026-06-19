'use client'

import { AlertTriangle } from 'lucide-react'

interface MaxStintAlertProps {
  isVisible: boolean
  driverName: string
  minutesLeft: number
  onAcknowledge: () => void
}

export default function MaxStintAlert({
  isVisible,
  driverName,
  minutesLeft,
  onAcknowledge,
}: MaxStintAlertProps) {
  if (!isVisible) return null

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="alert alert-error rounded-lg flex-col items-start gap-3 mb-2"
    >
      <div className="flex gap-2">
        <AlertTriangle size={18} className="text-error-content flex-shrink-0 mt-0.5" aria-hidden="true" />
        <div>
          <p className="font-condensed text-base font-bold tracking-wider uppercase">
            Stint Time Warning
          </p>
          <p className="text-sm opacity-80 mt-1 leading-relaxed">
            <strong>{driverName}</strong> has{' '}
            <strong>{minutesLeft} min{minutesLeft !== 1 ? 's' : ''}</strong>{' '}
            left in their max stint. Prepare for a driver swap.
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onAcknowledge}
        className="btn btn-sm bg-white text-brand-red border-0 w-full hover:bg-white/90 font-condensed uppercase tracking-wider"
      >
        Acknowledge
      </button>
    </div>
  )
}
