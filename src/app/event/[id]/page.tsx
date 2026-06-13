'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getHostSession } from '@/types/app'
import { Event, Driver, Stint } from '@/types/database'
import DashboardView from '@/components/dashboard/DashboardView'

import { useRealtimeSync } from '@/hooks/useRealtimeSync'
import { useRaceTimer } from '@/hooks/useRaceTimer'
import { useStintTimer } from '@/hooks/useStintTimer'
import { useMaxStintAlert } from '@/hooks/useMaxStintAlert'
import { useTestMode } from '@/hooks/useTestMode'

import {
  startRace,
  swapDriver,
  pauseRace,
  resumeRace,
  endRace,
  reorderDrivers,
  addDriverToQueue,
} from '@/actions/race'

export default function EventDashboardPage() {
  const params = useParams<{ id: string }>()
  const eventId = params.id
  const router = useRouter()

  // ── Initial data ──────────────────────────────────────────────
  const [initialEvent, setInitialEvent] = useState<Event | null>(null)
  const [initialDrivers, setInitialDrivers] = useState<Driver[]>([])
  const [initialStints, setInitialStints] = useState<Stint[]>([])
  const [isHost, setIsHost] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ── Modal state ───────────────────────────────────────────────
  const [showSwapModal, setShowSwapModal] = useState(false)
  const [showEndModal, setShowEndModal] = useState(false)
  const [showChequeredFlag, setShowChequeredFlag] = useState(false)

  // ── Race condition guards ─────────────────────────────────────
  const autoStartFiredRef = useRef(false)
  const autoEndFiredRef = useRef(false)

  // ── Host detection ────────────────────────────────────────────
  useEffect(() => {
    if (!eventId) return
    const session = getHostSession(eventId)
    setIsHost(session?.isHost === true)
  }, [eventId])

  // ── Initial data fetch ────────────────────────────────────────
  useEffect(() => {
    if (!eventId) return
    const supabase = createClient()

    async function fetchData() {
      try {
        const [eventRes, driversRes, stintsRes] = await Promise.all([
          supabase.from('events').select('*').eq('id', eventId).single(),
          supabase.from('drivers').select('*').eq('event_id', eventId).order('sequence_order'),
          supabase.from('stints').select('*').eq('event_id', eventId).order('swap_number'),
        ])

        if (eventRes.error) throw new Error(eventRes.error.message)
        if (driversRes.error) throw new Error(driversRes.error.message)
        if (stintsRes.error) throw new Error(stintsRes.error.message)

        setInitialEvent(eventRes.data as Event)
        setInitialDrivers(driversRes.data as Driver[])
        setInitialStints(stintsRes.data as Stint[])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load event')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [eventId])

  // ── Realtime sync ─────────────────────────────────────────────
  const { event, drivers, stints } = useRealtimeSync({
    eventId: eventId ?? '',
    initialEvent: initialEvent ?? ({} as Event),
    initialDrivers,
    initialStints,
  })

  // ── Race timer ────────────────────────────────────────────────
  const { elapsed, remaining, isFinished } = useRaceTimer({
    startTime: event?.start_time ?? null,
    totalDurationMinutes: event?.total_duration_minutes ?? 0,
    totalPausedSeconds: event?.total_paused_seconds ?? 0,
    status: event?.status ?? 'pending',
  })

  // ── Current stint & driver ────────────────────────────────────
  const currentStint = stints.find((s) => s.ended_at === null) ?? null
  const currentDriver = drivers.find((d) => d.id === currentStint?.driver_id) ?? null

  // ── Stint timer ───────────────────────────────────────────────
  const { stintElapsed } = useStintTimer({
    startedAt: currentStint?.started_at ?? null,
    status: event?.status ?? 'pending',
  })

  // ── Max stint alert ───────────────────────────────────────────
  const { isFlashing, showAlertModal, minutesLeft, acknowledgeAlert } = useMaxStintAlert({
    stintElapsed,
    maxStintMinutes: event?.max_stint_time_minutes ?? null,
    stintId: currentStint?.id ?? null,
  })

  // ── Test mode ─────────────────────────────────────────────────
  const {
    isTestMode,
    startTestMode,
    exitTestMode,
    testElapsed,
    testRemaining,
    testCurrentStintElapsed,
    testSwapCount,
    testCurrentDriverIndex,
    doTestSwap,
    doTestPause,
    doTestResume,
    testIsPaused,
  } = useTestMode({
    event: event ?? ({} as Event),
    drivers,
  })

  // ── Auto-start: when pending + startTime in past ──────────────
  useEffect(() => {
    if (!event || !isHost) return
    if (autoStartFiredRef.current) return
    if (event.status !== 'pending') return
    if (!event.start_time) return

    const startMs = new Date(event.start_time).getTime()
    if (startMs <= Date.now()) {
      autoStartFiredRef.current = true
      startRace(eventId).catch(console.error)
    }
  }, [event, isHost, eventId])

  // ── Auto-end: when isFinished ─────────────────────────────────
  useEffect(() => {
    if (!event || !isHost) return
    if (autoEndFiredRef.current) return
    if (event.status !== 'active') return
    if (!isFinished) return

    autoEndFiredRef.current = true
    endRace(eventId)
      .then(() => {
        setShowChequeredFlag(true)
      })
      .catch(console.error)
  }, [isFinished, event, isHost, eventId])

  // ── Show chequered flag when realtime pushes 'finished' ───────
  useEffect(() => {
    if (!event) return
    if (event.status === 'finished' && !showChequeredFlag && !showEndModal) {
      setShowChequeredFlag(true)
    }
  }, [event?.status]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derived state ─────────────────────────────────────────────
  const sortedDrivers = [...drivers].sort((a, b) => a.sequence_order - b.sequence_order)
  const currentIndex = currentDriver
    ? sortedDrivers.findIndex((d) => d.id === currentDriver.id)
    : -1
  const nextDriver =
    sortedDrivers.length > 0
      ? sortedDrivers[(currentIndex + 1) % sortedDrivers.length] ?? null
      : null
  const swapCount = stints.filter((s) => s.ended_at !== null).length

  // ── Action handlers ───────────────────────────────────────────
  const handleStartRace = useCallback(async () => {
    if (!eventId || !isHost) return
    await startRace(eventId)
  }, [eventId, isHost])

  const handleSwap = useCallback(() => {
    setShowSwapModal(true)
  }, [])

  const handleConfirmSwap = useCallback(async () => {
    if (!eventId || !isHost) return
    setShowSwapModal(false)
    await swapDriver(eventId)
  }, [eventId, isHost])

  const handleCancelSwap = useCallback(() => {
    setShowSwapModal(false)
  }, [])

  const handlePause = useCallback(async () => {
    if (!eventId || !isHost) return
    await pauseRace(eventId)
  }, [eventId, isHost])

  const handleResume = useCallback(async () => {
    if (!eventId || !isHost) return
    await resumeRace(eventId)
  }, [eventId, isHost])

  const handleEndRace = useCallback(() => {
    setShowEndModal(true)
  }, [])

  const handleConfirmEnd = useCallback(async () => {
    if (!eventId || !isHost) return
    setShowEndModal(false)
    await endRace(eventId)
    setShowChequeredFlag(true)
  }, [eventId, isHost])

  const handleCancelEnd = useCallback(() => {
    setShowEndModal(false)
  }, [])

  const handleAddDriverToQueue = useCallback(
    async (driverId: string) => {
      if (!eventId || !isHost) return
      // driverId here is actually passed as a driver name from AddDriverToQueue
      // The component passes the driver's id — we look up the name to re-add
      const driver = drivers.find((d) => d.id === driverId)
      if (!driver) return
      await addDriverToQueue(eventId, driver.name)
    },
    [eventId, isHost, drivers]
  )

  const handleReorderDrivers = useCallback(
    async (reorderedDrivers: Driver[]) => {
      if (!eventId || !isHost) return
      await reorderDrivers(eventId, reorderedDrivers.map((d) => d.id))
    },
    [eventId, isHost]
  )

  // ── Test mode action wrappers ─────────────────────────────────
  const handleTestSwap = useCallback(() => {
    doTestSwap()
  }, [doTestSwap])

  const handleTestPause = useCallback(() => {
    if (testIsPaused) doTestResume()
    else doTestPause()
  }, [testIsPaused, doTestPause, doTestResume])

  // ── Loading / error states ────────────────────────────────────
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

  // ── Compute display values ────────────────────────────────────
  const displayElapsed = isTestMode ? testElapsed : elapsed
  const displayRemaining = isTestMode ? testRemaining : remaining
  const displayStintElapsed = isTestMode ? testCurrentStintElapsed : stintElapsed
  const displaySwapCount = isTestMode ? testSwapCount : swapCount
  const displayIsPaused = isTestMode ? testIsPaused : event.status === 'paused'

  // In test mode, compute test current driver
  const testDriverIndex = testCurrentDriverIndex % (drivers.length || 1)
  const testCurrentDriver = isTestMode
    ? sortedDrivers[testDriverIndex] ?? null
    : null
  const effectiveCurrentDriver = isTestMode ? testCurrentDriver : currentDriver
  const effectiveNextDriver = isTestMode
    ? sortedDrivers[(testDriverIndex + 1) % (sortedDrivers.length || 1)] ?? null
    : nextDriver

  // Test mode max stint alert — use same hook but with test elapsed
  // We pass a synthetic stintId derived from testCurrentDriverIndex for reset behavior
  const testStintId = isTestMode ? `test-${testCurrentDriverIndex}` : null

  return (
    <DashboardView
      event={event}
      drivers={drivers}
      stints={stints}
      isHost={isHost}
      elapsed={displayElapsed}
      remaining={displayRemaining}
      currentStintElapsed={displayStintElapsed}
      isFlashing={isFlashing}
      isPaused={displayIsPaused}
      isTestMode={isTestMode}
      testModeElapsed={testElapsed}
      testModeRemaining={testRemaining}
      showSwapModal={showSwapModal}
      showEndModal={showEndModal}
      showMaxStintAlert={showAlertModal}
      showChequeredFlag={showChequeredFlag}
      minutesUntilMaxStint={minutesLeft}
      onSwap={isTestMode ? handleTestSwap : handleSwap}
      onConfirmSwap={isTestMode ? handleTestSwap : handleConfirmSwap}
      onCancelSwap={handleCancelSwap}
      onPause={isTestMode ? handleTestPause : handlePause}
      onResume={isTestMode ? doTestResume : handleResume}
      onStartRace={handleStartRace}
      onEndRace={handleEndRace}
      onConfirmEnd={handleConfirmEnd}
      onCancelEnd={handleCancelEnd}
      onAcknowledgeAlert={acknowledgeAlert}
      onAddDriverToQueue={handleAddDriverToQueue}
      onExitTestMode={exitTestMode}
      onStartTestMode={startTestMode}
      onReorderDrivers={handleReorderDrivers}
    />
  )
}
