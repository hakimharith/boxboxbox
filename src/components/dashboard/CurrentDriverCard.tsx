'use client'

import { Driver } from '@/types/database'
import { formatTime, formatMinSec } from '@/lib/utils/formatTime'

interface CurrentDriverCardProps {
  driver: Driver | null
  stintElapsed: number
  maxStintMinutes: number | null
  isFlashing: boolean
  isPaused?: boolean
  isTestMode?: boolean
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

export default function CurrentDriverCard({
  driver,
  stintElapsed,
  maxStintMinutes,
  isFlashing,
  isPaused = false,
  isTestMode = false,
}: CurrentDriverCardProps) {
  const maxStintSeconds = maxStintMinutes ? maxStintMinutes * 60 : null
  const timeLeftSeconds = maxStintSeconds ? Math.max(0, maxStintSeconds - stintElapsed) : null

  const isNearMax = isFlashing

  // Color scheme based on state
  const borderColor = isTestMode
    ? 'border-[rgba(181,128,255,0.3)]'
    : isPaused
    ? 'border-[rgba(255,230,0,0.3)]'
    : isNearMax
    ? 'border-[rgba(255,61,61,0.4)]'
    : 'border-[rgba(0,230,118,0.28)]'

  const avatarBg = isTestMode
    ? 'bg-[rgba(181,128,255,0.1)] border-[rgba(181,128,255,0.25)] text-brand-purple'
    : isPaused
    ? 'bg-[rgba(255,230,0,0.1)] border-[rgba(255,230,0,0.28)] text-brand-yellow'
    : isNearMax
    ? 'bg-[rgba(255,61,61,0.1)] border-[rgba(255,61,61,0.3)] text-brand-red'
    : 'bg-[rgba(0,230,118,0.12)] border-[rgba(0,230,118,0.28)] text-brand-green'

  const timerColor = isTestMode
    ? 'text-brand-txt dark:text-brand-purple'
    : isPaused
    ? 'text-brand-txt dark:text-brand-yellow'
    : isNearMax
    ? 'text-brand-txt dark:text-brand-red'
    : 'text-brand-txt dark:text-brand-green'

  const labelColor = isTestMode
    ? 'text-brand-purple'
    : isPaused
    ? 'text-brand-yellow'
    : isNearMax
    ? 'text-brand-red'
    : ''

  // Left border per state
  const leftAccent = isTestMode
    ? 'border-l-[3px] border-l-brand-purple'
    : isPaused
    ? 'border-l-[3px] border-l-brand-yellow'
    : isNearMax
    ? 'border-l-[3px] border-l-brand-red'
    : 'border-l-[3px] border-l-brand-cyan'

  const avatarGlow = ''

  const cardClass = [
    'bg-brand-bg3 border rounded px-3 py-2.5 mb-2 transition-all duration-200',
    borderColor,
    leftAccent,
    isNearMax && !isTestMode && !isPaused ? 'card-flash' : '',
  ]
    .filter(Boolean)
    .join(' ')

  if (!driver) {
    return (
      <div className="bg-brand-bg3 border border-brand-border border-l-[3px] border-l-brand-border2 rounded px-3 py-2.5 mb-2">
        <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-brand-txt3 mb-2">
          {isPaused ? 'Last on track' : isTestMode ? 'Simulating on track' : 'On track'}
        </p>
        <p className="text-sm text-brand-txt3 font-mono">No active driver</p>
      </div>
    )
  }

  const initials = getInitials(driver.name)

  return (
    <div className={cardClass}>
      <div className="flex items-start justify-between mb-2">
        <p className={`text-[10px] font-mono font-bold uppercase tracking-widest ${labelColor || 'text-brand-txt3'}`}>
          {isPaused ? 'Last on track' : isTestMode ? 'Simulating on track' : 'On track'}
        </p>
        <div className="flex items-center gap-1.5">
          {isNearMax && timeLeftSeconds != null && !isPaused && (
            <span className="text-[9px] font-mono font-bold bg-[rgba(255,61,61,0.08)] border border-brand-red/30 text-brand-red rounded px-1.5 py-0.5 uppercase tracking-wide">
              ⚠ {formatMinSec(timeLeftSeconds)} LEFT
            </span>
          )}
          {maxStintMinutes && (
            <span className="text-[9px] font-mono text-brand-txt3 uppercase">
              MAX {String(maxStintMinutes).padStart(2, '0')}:00
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded flex items-center justify-center font-mono text-xs font-bold flex-shrink-0 border ${avatarBg} ${avatarGlow}`}
        >
          {initials}
        </div>
        <div className="min-w-0">
          <div className="font-condensed text-2xl font-bold uppercase tracking-wide leading-none truncate">
            {driver.name}
          </div>
          <div className={`font-mono text-3xl font-bold leading-tight tabular-nums ${timerColor}`}>
            {formatTime(stintElapsed)}
          </div>
        </div>
      </div>
    </div>
  )
}
