'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { getEvent, getDrivers, getStints } from '@/actions/data'
import { Event, Driver, Stint } from '@/types/database'
import DashboardView from '@/components/dashboard/DashboardView'
import { useRaceTimer } from '@/hooks/useRaceTimer'
import { useStintTimer } from '@/hooks/useStintTimer'

const NOOP = () => {}

export default function ReadOnlyViewPage() {
  const params = useParams<{ id: string }>()
  const eventId = params.id

  const [initialEvent, setInitialEvent] = useState<Event | null>(null)
  const [initialDrivers, setInitialDrivers] = useState<Driver[]>([])
  const [initialStints, setInitialStints] = useState<Stint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pollProgress, setPollProgress] = useState(0)
  const lastFetchTimeRef = useRef<number>(Date.now())

  const POLL_INTERVAL = 30_000

  const fetchData = useCallback(async () => {
    if (!eventId) return
    try {
      const [latestEvent, latestDrivers, latestStints] = await Promise.all([
        getEvent(eventId),
        getDrivers(eventId),
        getStints(eventId),
      ])
      if (!latestEvent) throw new Error('Event not found')
      setInitialEvent(latestEvent)
      setInitialDrivers(latestDrivers)
      setInitialStints(latestStints)
      lastFetchTimeRef.current = Date.now()
      setPollProgress(0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load event')
    } finally {
      setLoading(false)
    }
  }, [eventId])

  useEffect(() => { fetchData() }, [fetchData])

  // Poll every 30s for live updates
  useEffect(() => {
    const interval = setInterval(fetchData, POLL_INTERVAL)
    return () => clearInterval(interval)
  }, [fetchData])

  // Animate progress bar between polls
  useEffect(() => {
    const id = setInterval(() => {
      const elapsed = Date.now() - lastFetchTimeRef.current
      setPollProgress(Math.min(100, (elapsed / POLL_INTERVAL) * 100))
    }, 250)
    return () => clearInterval(id)
  }, [])

  const event = initialEvent
  const drivers = initialDrivers
  const stints = initialStints

  const { elapsed, remaining } = useRaceTimer({
    startTime: event?.start_time ?? null,
    totalDurationMinutes: event?.total_duration_minutes ?? 0,
    totalPausedSeconds: event?.total_paused_seconds ?? 0,
    status: event?.status ?? 'pending',
  })

  const currentStint = stints.find((s) => s.ended_at === null) ?? null

  const { stintElapsed } = useStintTimer({
    startedAt: currentStint?.started_at ?? null,
    status: event?.status ?? 'pending',
  })

  if (loading) {
    return (
      <div className="min-h-dvh bg-brand-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-brand-cyan border-t-transparent rounded-full animate-spin" />
          <p className="font-mono text-xs text-brand-txt3 uppercase tracking-widest">Loading race…</p>
        </div>
      </div>
    )
  }

  if (error || !event || !initialEvent) {
    return (
      <div className="min-h-dvh bg-brand-bg flex items-center justify-center px-4">
        <div className="bg-brand-bg3 border border-brand-border2 rounded-lg px-4 py-4 text-center max-w-xs w-full">
          <p className="font-mono text-xs text-brand-red uppercase tracking-wide mb-1">Event not found</p>
          <p className="text-xs text-brand-txt3">{error ?? 'This event does not exist or has been removed.'}</p>
        </div>
      </div>
    )
  }

  return (
    <DashboardView
      event={event}
      drivers={drivers}
      stints={stints}
      isHost={false}
      isReadOnly={true}
      pollProgress={pollProgress}
      elapsed={elapsed}
      remaining={remaining}
      currentStintElapsed={stintElapsed}
      isFlashing={false}
      isPaused={event.status === 'paused'}
      isTestMode={false}
      testModeElapsed={0}
      testModeRemaining={0}
      showSwapModal={false}
      showEndModal={false}
      showMaxStintAlert={false}
      showChequeredFlag={false}
      minutesUntilMaxStint={0}
      onSwap={NOOP}
      onConfirmSwap={NOOP}
      onCancelSwap={NOOP}
      onPause={NOOP}
      onResume={NOOP}
      onStartRace={NOOP}
      onEndRace={NOOP}
      onConfirmEnd={NOOP}
      onCancelEnd={NOOP}
      onAcknowledgeAlert={NOOP}
      onAddDriverToQueue={NOOP}
      onExitTestMode={NOOP}
      onStartTestMode={NOOP}
    />
  )
}
