'use client'

import { Flag, Trophy } from 'lucide-react'
import { Event, Stint, Driver } from '@/types/database'
import { formatTime, formatMinSec } from '@/lib/utils/formatTime'

interface ChequeredFlagModalProps {
  isOpen: boolean
  event: Event
  stints: Stint[]
  drivers: Driver[]
  totalTime: number
  onViewResults: () => void
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

export default function ChequeredFlagModal({
  isOpen,
  event,
  stints,
  drivers,
  totalTime,
  onViewResults,
}: ChequeredFlagModalProps) {
  if (!isOpen) return null

  const driverMap = new Map(drivers.map((d) => [d.id, d]))
  const completedStints = stints.filter((s) => s.ended_at !== null)
  const swapCount = completedStints.length

  let topStint: Stint | null = null
  let topDuration = 0
  for (const stint of completedStints) {
    if (!stint.ended_at) continue
    const dur = Math.floor(
      (new Date(stint.ended_at).getTime() - new Date(stint.started_at).getTime()) / 1000
    )
    if (dur > topDuration) {
      topDuration = dur
      topStint = stint
    }
  }
  const topDriver = topStint ? driverMap.get(topStint.driver_id) : null

  const raceDate = event.race_date
    ? new Date(event.race_date).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).toUpperCase()
    : ''

  return (
    <div className="modal modal-open">
      <div className="modal-box modal-enter">
        {/* Header */}
        <div className="text-center pb-3 pt-2">
          <div className="flex justify-center mb-3">
            <div className="w-12 h-12 rounded-full bg-brand-bg4 border border-brand-border flex items-center justify-center">
              <Flag size={22} className="text-brand-txt" aria-hidden="true" />
            </div>
          </div>
          <h2 className="font-display text-xl font-bold tracking-widest text-brand-txt uppercase">
            Chequered Flag!
          </h2>
          <p className="font-mono text-[10px] text-brand-txt3 mt-1.5 uppercase tracking-wider">
            {event.name} · {raceDate}
          </p>
        </div>

        <hr className="border-brand-border my-0" />

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-2 my-3">
          <div className="text-center bg-brand-bg4 rounded px-2 py-2">
            <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-brand-txt3 mb-1">
              Total time
            </p>
            <div className="font-mono text-lg font-bold text-brand-txt dark:text-brand-green tabular-nums">
              {formatTime(totalTime)}
            </div>
          </div>
          <div className="text-center bg-brand-bg4 rounded px-2 py-2">
            <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-brand-txt3 mb-1">
              Swaps done
            </p>
            <div className="font-mono text-lg font-bold text-brand-txt dark:text-brand-cyan tabular-nums">
              {swapCount}
              {event.total_swaps_target ? (
                <span className="text-brand-txt3 text-xs"> / {event.total_swaps_target}</span>
              ) : null}
            </div>
          </div>
        </div>

        {/* Top stint */}
        {topDriver && topStint && (
          <div className="bg-brand-bg4 border border-brand-border rounded px-3 py-2.5 mb-4">
            <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-brand-txt3 mb-2">
              Top stint
            </p>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded flex items-center justify-center font-mono text-[9px] font-bold flex-shrink-0 bg-brand-bg3 border border-brand-border2 text-brand-txt">
                {getInitials(topDriver.name)}
              </div>
              <div className="flex-1">
                <div className="text-sm font-condensed font-bold uppercase text-brand-txt">{topDriver.name}</div>
                <div className="font-mono text-[10px] text-brand-txt3 uppercase">
                  Longest stint: {formatMinSec(topDuration)}
                </div>
              </div>
              <span className="flex items-center gap-1 text-[9px] font-bold bg-brand-bg3 border border-brand-border2 text-brand-txt2 rounded px-1.5 py-0.5 uppercase tracking-wide">
                <Trophy size={10} aria-hidden="true" /> MVP
              </span>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={onViewResults}
          className="btn btn-primary w-full"
        >
          View full results →
        </button>
      </div>
    </div>
  )
}
