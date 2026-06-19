'use client'

import { useEffect, useState } from 'react'
import { formatCountdown } from '@/lib/utils/formatTime'

interface RaceStatusBannerProps {
  status: 'pending' | 'active' | 'paused' | 'finished' | 'test'
  startTime: string | null
  eventName?: string
  location?: string
}

function getSecondsUntil(startTime: string): number {
  return Math.max(0, Math.floor((new Date(startTime).getTime() - Date.now()) / 1000))
}

export default function RaceStatusBanner({ status, startTime, eventName, location }: RaceStatusBannerProps) {
  const [countdown, setCountdown] = useState<number>(
    startTime && status === 'pending' ? getSecondsUntil(startTime) : 0
  )

  useEffect(() => {
    if (status !== 'pending' || !startTime) return
    const initial = getSecondsUntil(startTime)
    if (initial <= 0) return
    setCountdown(initial)
    const id = setInterval(() => {
      setCountdown(getSecondsUntil(startTime))
    }, 1000)
    return () => clearInterval(id)
  }, [status, startTime])

  if (status === 'paused') {
    return <div className="pause-stripe mb-1" />
  }

  if (status === 'test') {
    return <div className="test-stripe mb-1" />
  }

  if (status === 'pending') {
    const isFuture = startTime && getSecondsUntil(startTime) > 0
    if (isFuture) {
      return (
        <div className="bg-brand-bg3 border border-[rgba(255,230,0,0.2)] rounded px-3 py-3 text-center mb-2">
          {eventName && (
            <p className="font-condensed text-base font-bold uppercase tracking-wider text-brand-txt leading-tight">
              {eventName}
            </p>
          )}
          {location && (
            <p className="font-mono text-[10px] text-brand-txt3 uppercase tracking-widest mb-1">
              {location}
            </p>
          )}
          <p className="text-[10px] font-mono font-bold uppercase text-brand-txt2 dark:text-brand-txt3 mb-1 tracking-widest mt-2">
            Race starts in
          </p>
          <div className="font-mono text-3xl font-bold text-brand-txt dark:text-brand-yellow tracking-tight tabular-nums">
            {formatCountdown(countdown)}
          </div>
          <p className="text-[9px] font-mono text-brand-txt3 mt-0.5 tracking-wider">DD : HH : MM : SS</p>
          {startTime && (
            <p className="text-xs text-brand-txt2 dark:text-brand-txt3 font-mono mt-1">
              {new Date(startTime).toLocaleString('en-GB', {
                hour: '2-digit',
                minute: '2-digit',
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              }).toUpperCase()}
            </p>
          )}
        </div>
      )
    }
    return null
  }

  return null
}
