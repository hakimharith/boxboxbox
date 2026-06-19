'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Stint, Driver } from '@/types/database'
import { formatMinSec } from '@/lib/utils/formatTime'

interface StintHistoryProps {
  stints: Stint[]
  drivers: Driver[]
}

const VISIBLE_COUNT = 5

export default function StintHistory({ stints, drivers }: StintHistoryProps) {
  const [expanded, setExpanded] = useState(false)
  const [showAll, setShowAll] = useState(false)

  const driverMap = new Map(drivers.map((d) => [d.id, d]))

  const completed = stints
    .filter((s) => s.ended_at !== null)
    .sort((a, b) => a.swap_number - b.swap_number)

  const visible = showAll ? completed : completed.slice(0, VISIBLE_COUNT)
  const hiddenCount = completed.length - VISIBLE_COUNT

  return (
    <div className="mb-2">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="btn btn-ghost btn-xs gap-1 mb-1 w-full justify-start text-brand-txt3 hover:text-brand-txt p-0"
      >
        <span className="text-[8px] font-mono font-bold uppercase tracking-widest">
          Stint log
        </span>
        {expanded ? (
          <ChevronUp size={10} />
        ) : (
          <ChevronDown size={10} />
        )}
      </button>

      {expanded && (
        <div className="bg-brand-bg4 rounded px-2 py-1.5">
          {completed.length === 0 && (
            <p className="font-mono text-[8px] text-brand-txt3">No completed stints yet.</p>
          )}
          {visible.map((stint) => {
            const driver = driverMap.get(stint.driver_id)
            const driverName = driver
              ? driver.name.toUpperCase().padEnd(6, ' ').slice(0, 6)
              : 'UNKNWN'
            const num = String(stint.swap_number).padStart(2, '0')

            let duration = 0
            if (stint.ended_at) {
              duration = Math.floor(
                (new Date(stint.ended_at).getTime() - new Date(stint.started_at).getTime()) / 1000
              )
            }

            return (
              <div
                key={stint.id}
                className="flex justify-between items-center py-0.5 border-b border-brand-border last:border-b-0 font-mono text-[8px] text-brand-txt3"
              >
                <span>{num} · {driverName}</span>
                <span>{formatMinSec(duration)}</span>
              </div>
            )
          })}

          {!showAll && hiddenCount > 0 && (
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="btn btn-ghost btn-xs w-full justify-between font-mono text-[8px] text-brand-border2 hover:text-brand-txt3 p-0 py-0.5"
            >
              <span>+ {hiddenCount} MORE STINTS</span>
              <span>↓</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}
