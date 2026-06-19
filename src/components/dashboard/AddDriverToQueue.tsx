'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Driver, Stint } from '@/types/database'

interface AddDriverToQueueProps {
  isHost: boolean
  drivers: Driver[]
  stints: Stint[]
  onAdd: (driverId: string) => void
}

export default function AddDriverToQueue({
  isHost,
  drivers,
  stints,
  onAdd,
}: AddDriverToQueueProps) {
  const [selected, setSelected] = useState('')

  if (!isHost) return null

  const stintCounts: Record<string, number> = {}
  for (const stint of stints) {
    if (stint.ended_at) {
      stintCounts[stint.driver_id] = (stintCounts[stint.driver_id] || 0) + 1
    }
  }

  function handleAdd() {
    if (!selected) return
    onAdd(selected)
    setSelected('')
  }

  return (
    <div className="flex gap-1.5 mb-2 items-center">
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="select select-bordered select-sm flex-1 text-[10px]"
      >
        <option value="">+ Add driver to queue</option>
        {drivers.map((d) => {
          const count = stintCounts[d.id] || 0
          return (
            <option key={d.id} value={d.id}>
              {d.name} (stint {count + 1})
            </option>
          )
        })}
      </select>
      <button
        type="button"
        onClick={handleAdd}
        disabled={!selected}
        className="btn btn-ghost btn-sm border border-brand-cyan/25 text-brand-cyan flex-shrink-0 hover:border-brand-cyan/50 disabled:opacity-40"
      >
        <Plus size={13} />
      </button>
    </div>
  )
}
