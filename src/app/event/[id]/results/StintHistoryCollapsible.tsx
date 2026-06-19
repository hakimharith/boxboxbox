'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Stint, Driver } from '@/types/database'
import { formatMinSec } from '@/lib/utils/formatTime'

interface Props {
  stints: Stint[]
  drivers: Driver[]
}

const VISIBLE_COUNT = 5

export default function StintHistoryCollapsible({ stints, drivers }: Props) {
  const [expanded, setExpanded] = useState(true)
  const [showAll, setShowAll] = useState(false)

  const driverMap = new Map(drivers.map((d) => [d.id, d]))
  const sorted = [...stints].sort((a, b) => a.swap_number - b.swap_number)
  const visible = showAll ? sorted : sorted.slice(0, VISIBLE_COUNT)
  const hiddenCount = sorted.length - VISIBLE_COUNT

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="btn btn-ghost btn-xs gap-1.5 mb-2 w-full justify-start text-brand-txt2 hover:text-brand-txt p-0"
      >
        <span className="text-xs font-condensed font-bold uppercase tracking-widest">
          Stint Log
        </span>
        {expanded ? (
          <ChevronUp size={12} className="text-brand-txt3" />
        ) : (
          <ChevronDown size={12} className="text-brand-txt3" />
        )}
      </button>

      {expanded && (
        <div className="mb-4">
          <table className="table table-sm w-full bg-brand-bg3 border border-brand-border rounded overflow-hidden border-separate border-spacing-0">
            <thead>
              <tr className="bg-brand-bg4">
                <th className="text-[10px] font-mono font-bold uppercase tracking-widest text-brand-txt3 py-1.5 font-normal whitespace-nowrap">Stint</th>
                <th className="text-[10px] font-mono font-bold uppercase tracking-widest text-brand-txt3 py-1.5 font-normal">Driver</th>
                <th className="text-[10px] font-mono font-bold uppercase tracking-widest text-brand-txt3 py-1.5 text-right font-normal">Time</th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-3 text-xs font-mono text-brand-txt3">No stints recorded.</td>
                </tr>
              )}
              {visible.map((stint) => {
                const driver = driverMap.get(stint.driver_id)
                const name = driver ? driver.name : 'Unknown'
                let dur = 0
                if (stint.ended_at) {
                  dur = Math.floor(
                    (new Date(stint.ended_at).getTime() - new Date(stint.started_at).getTime()) / 1000
                  )
                }
                return (
                  <tr key={stint.id} className="border-t border-brand-border">
                    <td className="py-2 font-mono text-xs text-brand-txt2 tabular-nums">{stint.swap_number}</td>
                    <td className="py-2 text-xs text-brand-txt">{name}</td>
                    <td className="py-2 font-mono text-xs font-bold text-brand-txt text-right tabular-nums">{formatMinSec(dur)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {!showAll && hiddenCount > 0 && (
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="btn btn-ghost btn-xs w-full mt-1 font-mono text-brand-txt3 hover:text-brand-txt"
            >
              + {hiddenCount} more stints
            </button>
          )}
        </div>
      )}
    </div>
  )
}
