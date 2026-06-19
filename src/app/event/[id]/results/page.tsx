import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import { Event, Driver, Stint } from '@/types/database'
import { formatTime, formatMinSec } from '@/lib/utils/formatTime'
import StintHistoryCollapsible from './StintHistoryCollapsible'
import ExportButton from './ExportButton'
import ShareButton from '@/components/dashboard/ShareButton'
import AppNavBar from '@/components/AppNavBar'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ResultsPage({ params }: PageProps) {
  const { id } = await params

  const [eventRows, drivers, stints] = await Promise.all([
    db<Event[]>`SELECT * FROM boxboxbox.events WHERE id = ${id} LIMIT 1`,
    db<Driver[]>`SELECT * FROM boxboxbox.drivers WHERE event_id = ${id} ORDER BY sequence_order`,
    db<Stint[]>`SELECT * FROM boxboxbox.stints WHERE event_id = ${id} ORDER BY swap_number`,
  ])

  if (eventRows.length === 0) notFound()

  const event = eventRows[0]

  const driverMap = new Map(drivers.map((d) => [d.id, d]))
  const completedStints = stints.filter((s) => s.ended_at !== null)
  const swapCount = completedStints.length

  const totalTime = event.total_duration_minutes * 60

  const driverStats = drivers.map((driver) => {
    const driverStints = completedStints.filter((s) => s.driver_id === driver.id)
    const totalDriveTime = driverStints.reduce((acc, s) => {
      if (!s.ended_at) return acc
      return (
        acc +
        Math.floor(
          (new Date(s.ended_at).getTime() - new Date(s.started_at).getTime()) / 1000
        )
      )
    }, 0)
    return {
      driver,
      stintCount: driverStints.length,
      totalDriveTime,
    }
  })

  const raceDate = event.race_date
    ? new Date(event.race_date).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : ''

  return (
    <div className="min-h-dvh bg-brand-bg text-brand-txt flex flex-col">
      <AppNavBar />

      <div className="flex-1 overflow-y-auto flex flex-col">
        <div className="my-auto max-w-sm mx-auto w-full px-3 py-6">

          {/* Back link */}
          <a
            href={`/event/${id}`}
            className="btn btn-ghost btn-xs text-brand-txt3 hover:text-brand-txt mb-4 p-0 gap-1 normal-case font-mono text-[10px]"
          >
            ← Dashboard
          </a>

          {/* Event header */}
          <div className="flex items-start justify-between gap-2 mb-4">
            <div>
              <h1 className="font-display text-lg font-bold uppercase text-brand-txt leading-tight">
                {event.name}
              </h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {raceDate && (
                  <span className="font-mono text-[10px] text-brand-txt3 uppercase">{raceDate}</span>
                )}
                {event.location && raceDate && (
                  <span className="font-mono text-[10px] text-brand-txt3">·</span>
                )}
                {event.location && (
                  <span className="font-mono text-[10px] text-brand-txt3 uppercase">{event.location}</span>
                )}
              </div>
            </div>
            <ShareButton eventName={event.name} accessCode={event.access_code} />
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-1.5 mb-4">
            <div className="bg-brand-bg3 border border-brand-border rounded px-2 py-2 text-center">
              <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-brand-txt3 mb-1">
                Total time
              </p>
              <div className="font-mono text-base font-bold text-brand-txt dark:text-brand-green">
                {formatTime(totalTime)}
              </div>
            </div>
            <div className="bg-brand-bg3 border border-brand-border rounded px-2 py-2 text-center">
              <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-brand-txt3 mb-1">
                Swaps
              </p>
              <div className="flex items-baseline justify-center gap-0.5">
                <span className="font-mono text-xl font-bold text-brand-txt dark:text-brand-cyan">{swapCount}</span>
                {event.total_swaps_target && (
                  <span className="font-mono text-xs text-brand-txt3"> / {event.total_swaps_target}</span>
                )}
              </div>
            </div>
          </div>

          {/* Driver breakdown */}
          <p className="text-xs font-condensed font-bold uppercase tracking-widest text-brand-txt2 mb-2">
            Driver Breakdown
          </p>
          <table className="table table-sm w-full bg-brand-bg3 border border-brand-border rounded mb-4 overflow-hidden border-separate border-spacing-0">
            <thead>
              <tr className="bg-brand-bg4 border-b border-brand-border">
                <th className="text-[10px] font-mono font-bold uppercase tracking-widest text-brand-txt3 py-1.5 font-normal">Driver</th>
                <th className="text-[10px] font-mono font-bold uppercase tracking-widest text-brand-txt3 py-1.5 text-center font-normal whitespace-nowrap">Stints</th>
                <th className="text-[10px] font-mono font-bold uppercase tracking-widest text-brand-txt3 py-1.5 text-right font-normal whitespace-nowrap">Total Time</th>
              </tr>
            </thead>
            <tbody>
              {driverStats.map(({ driver, stintCount, totalDriveTime }, i) => (
                <tr key={driver.id} className={i < driverStats.length - 1 ? 'border-b border-brand-border' : ''}>
                  <td className="py-2.5">
                    <span className="text-xs font-semibold text-brand-txt">{driver.name}</span>
                  </td>
                  <td className="py-2.5 font-mono text-xs text-brand-txt text-center tabular-nums">{stintCount}</td>
                  <td className="py-2.5 font-mono text-xs font-bold text-brand-txt text-right tabular-nums">{formatMinSec(totalDriveTime)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <StintHistoryCollapsible stints={completedStints} drivers={drivers} />

          <ExportButton
            eventName={event.name}
            raceDate={raceDate}
            totalTime={totalTime}
            swapCount={swapCount}
            swapsTarget={event.total_swaps_target ?? null}
            driverStats={driverStats.map(({ driver, stintCount, totalDriveTime }) => ({
              name: driver.name,
              stintCount,
              totalDriveTime,
            }))}
            stintRows={completedStints.map((s) => {
              const dur = s.ended_at
                ? Math.floor((new Date(s.ended_at).getTime() - new Date(s.started_at).getTime()) / 1000)
                : 0
              return {
                swapNumber: s.swap_number,
                driverName: driverMap.get(s.driver_id)?.name ?? 'Unknown',
                durationSeconds: dur,
              }
            })}
          />
        </div>
      </div>
    </div>
  )
}
