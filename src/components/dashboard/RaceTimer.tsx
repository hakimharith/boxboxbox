'use client'

import { formatTime, formatMinSec } from '@/lib/utils/formatTime'

interface RaceTimerProps {
  elapsed: number
  currentStintElapsed: number
  swapCount: number
  swapsTarget: number | null
  isTestMode: boolean
  isPaused: boolean
  isFlashing: boolean
}

export default function RaceTimer({
  elapsed,
  currentStintElapsed,
  swapCount,
  swapsTarget,
  isTestMode,
  isPaused,
  isFlashing,
}: RaceTimerProps) {
  return (
    <div className="grid grid-cols-3 gap-1.5 mb-2">
      {/* Elapsed */}
      <div className="bg-brand-bg3 border border-brand-border rounded px-2 py-3 flex flex-col">
        <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-brand-txt3 mb-1.5">
          {isTestMode ? 'Sim total' : 'Total'}
        </p>
        <div className={`font-mono text-xl font-bold leading-none tabular-nums ${
          isTestMode ? 'text-brand-txt dark:text-brand-purple' : 'text-brand-txt dark:text-brand-txt'
        }`}>
          {formatTime(elapsed)}
        </div>
      </div>

      {/* Current Stint */}
      <div className="bg-brand-bg3 border border-brand-border rounded px-2 py-3 flex flex-col">
        <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-brand-txt3 mb-1.5">
          Current
        </p>
        <div className={`font-mono text-xl font-bold leading-none tabular-nums ${
          isTestMode ? 'text-brand-txt dark:text-brand-purple'
          : isPaused ? 'text-brand-txt dark:text-brand-yellow'
          : isFlashing ? 'text-brand-txt dark:text-brand-red'
          : 'text-[#15803d] dark:text-brand-green'
        }`}>
          {formatMinSec(currentStintElapsed)}
        </div>
      </div>

      {/* Swaps */}
      <div className="bg-brand-bg3 border border-brand-border rounded px-2 py-3 flex flex-col">
        <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-brand-txt3 mb-1.5">
          Swaps
        </p>
        <div className="flex items-baseline gap-0.5">
          <span className={`font-mono text-2xl font-bold leading-none tabular-nums ${
            isTestMode ? 'text-brand-txt dark:text-brand-purple' : 'text-brand-txt dark:text-brand-txt'
          }`}>
            {swapCount}
          </span>
          {swapsTarget != null && (
            <span className="font-mono text-xs text-brand-txt3">
              &nbsp;/ {swapsTarget}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
