'use client'

import { Download } from 'lucide-react'
import { formatTime, formatMinSec } from '@/lib/utils/formatTime'

interface DriverStat {
  name: string
  stintCount: number
  totalDriveTime: number
}

interface StintRow {
  swapNumber: number
  driverName: string
  durationSeconds: number
}

interface ExportButtonProps {
  eventName: string
  raceDate: string
  totalTime: number
  swapCount: number
  swapsTarget: number | null
  driverStats: DriverStat[]
  stintRows: StintRow[]
}

export default function ExportButton({
  eventName,
  raceDate,
  totalTime,
  swapCount,
  swapsTarget,
  driverStats,
  stintRows,
}: ExportButtonProps) {
  function handleExport() {
    const lines: string[] = []

    lines.push('RACE SUMMARY')
    lines.push(`Event,${eventName}`)
    if (raceDate) lines.push(`Date,${raceDate}`)
    lines.push(`Total Time,${formatTime(totalTime)}`)
    lines.push(`Swaps,${swapCount}${swapsTarget ? ` / ${swapsTarget}` : ''}`)
    lines.push('')

    lines.push('DRIVER BREAKDOWN')
    lines.push('Driver,Stints,Total Time')
    for (const d of driverStats) {
      lines.push(`${d.name},${d.stintCount},${formatMinSec(d.totalDriveTime)}`)
    }
    lines.push('')

    lines.push('STINT LOG')
    lines.push('Stint,Driver,Time')
    for (const s of stintRows) {
      lines.push(`${s.swapNumber},${s.driverName},${formatMinSec(s.durationSeconds)}`)
    }

    const csv = lines.join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${eventName.replace(/\s+/g, '_')}_results.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      className="btn btn-ghost border border-brand-border2 text-brand-txt2 w-full btn-sm gap-1.5 mt-3 hover:border-brand-border hover:text-brand-txt"
    >
      <Download size={12} />
      Export summary
    </button>
  )
}
