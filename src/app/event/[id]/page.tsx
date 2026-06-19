'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { getHostSession } from '@/types/app'
import { getEvent, getDrivers, getStints } from '@/actions/data'
import { Event, Driver, Stint } from '@/types/database'
import DashboardView from '@/components/dashboard/DashboardView'

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
  const prevEventStatusRef = useRef<string | undefined>(undefined)

  // ── Host detection ────────────────────────────────────────────
  useEffect(() => {
    if (!eventId) return
    const session = getHostSession(eventId)
    setIsHost(session?.isHost === true)
  }, [eventId])

  // ── Data fetch + refresh ──────────────────────────────────────
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load event')
    } finally {
      setLoading(false)
    }
  }, [eventId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // ── Viewer polling (non-host only, every 60s) ─────────────────
  useEffect(() => {
    if (isHost) return
    const interval = setInterval(fetchData, 60_000)
    return () => clearInterval(interval)
  }, [isHost, fetchData])

  const event = initialEvent
  const drivers = initialDrivers
  const stints = initialStints

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
    testStints,
    doTestSwap,
    doTestPause,
    doTestResume,
    testIsPaused,
  } = useTestMode({
    event: event ?? ({} as Event),
    drivers,
  })

  // ── Test mode max stint alert ─────────────────────────────────
  const testActiveStint = testStints.find((s) => s.ended_at === null) ?? null
  const {
    isFlashing: testIsFlashing,
    showAlertModal: testShowAlertModal,
    minutesLeft: testMinutesLeft,
    acknowledgeAlert: testAcknowledgeAlert,
  } = useMaxStintAlert({
    stintElapsed: testCurrentStintElapsed,
    maxStintMinutes: event?.max_stint_time_minutes ?? null,
    stintId: testActiveStint?.id ?? null,
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

  // ── Show chequered flag only on live transition to 'finished' ──
  useEffect(() => {
    if (!event) return
    const prev = prevEventStatusRef.current
    prevEventStatusRef.current = event.status
    // Only trigger modal on a status transition, not on initial load of an already-finished event
    if (event.status === 'finished' && prev !== undefined && prev !== 'finished' && !showChequeredFlag && !showEndModal) {
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
    await fetchData()
  }, [eventId, isHost, fetchData])

  const handleSwap = useCallback(() => {
    setShowSwapModal(true)
  }, [])

  const handleConfirmSwap = useCallback(async () => {
    if (!eventId || !isHost) return
    setShowSwapModal(false)
    await swapDriver(eventId)
    await fetchData()
  }, [eventId, isHost, fetchData])

  const handleCancelSwap = useCallback(() => {
    setShowSwapModal(false)
  }, [])

  const handlePause = useCallback(async () => {
    if (!eventId || !isHost) return
    await pauseRace(eventId)
    await fetchData()
  }, [eventId, isHost, fetchData])

  const handleResume = useCallback(async () => {
    if (!eventId || !isHost) return
    await resumeRace(eventId)
    await fetchData()
  }, [eventId, isHost, fetchData])

  const handleEndRace = useCallback(() => {
    setShowEndModal(true)
  }, [])

  const handleConfirmEnd = useCallback(async () => {
    if (!eventId || !isHost) return
    setShowEndModal(false)
    await endRace(eventId)
    await fetchData()
    setShowChequeredFlag(true)
  }, [eventId, isHost, fetchData])

  const handleCancelEnd = useCallback(() => {
    setShowEndModal(false)
  }, [])

  const handleAddDriverToQueue = useCallback(
    async (driverId: string) => {
      if (!eventId || !isHost) return
      const driver = drivers.find((d) => d.id === driverId)
      if (!driver) return
      await addDriverToQueue(eventId, driver.name)
      await fetchData()
    },
    [eventId, isHost, drivers, fetchData]
  )

  const handleReorderDrivers = useCallback(
    async (reorderedDrivers: Driver[]) => {
      if (!eventId || !isHost) return
      await reorderDrivers(eventId, reorderedDrivers.map((d) => d.id))
      await fetchData()
    },
    [eventId, isHost, fetchData]
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
          <div className="w-8 h-8 border-2 border-brand-yellow border-t-transparent rounded-full animate-spin" />
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

  return (
    <DashboardView
      event={event}
      drivers={drivers}
      stints={isTestMode ? testStints : stints}
      isHost={isHost}
      elapsed={displayElapsed}
      remaining={displayRemaining}
      currentStintElapsed={displayStintElapsed}
      isFlashing={isTestMode ? testIsFlashing : isFlashing}
      isPaused={displayIsPaused}
      isTestMode={isTestMode}
      testModeElapsed={testElapsed}
      testModeRemaining={testRemaining}
      showSwapModal={showSwapModal}
      showEndModal={showEndModal}
      showMaxStintAlert={isTestMode ? testShowAlertModal : showAlertModal}
      showChequeredFlag={showChequeredFlag}
      minutesUntilMaxStint={isTestMode ? testMinutesLeft : minutesLeft}
      onSwap={isTestMode ? handleTestSwap : handleSwap}
      onConfirmSwap={isTestMode ? handleTestSwap : handleConfirmSwap}
      onCancelSwap={handleCancelSwap}
      onPause={isTestMode ? handleTestPause : handlePause}
      onResume={isTestMode ? doTestResume : handleResume}
      onStartRace={handleStartRace}
      onEndRace={handleEndRace}
      onConfirmEnd={handleConfirmEnd}
      onCancelEnd={handleCancelEnd}
      onAcknowledgeAlert={isTestMode ? testAcknowledgeAlert : acknowledgeAlert}
      onAddDriverToQueue={handleAddDriverToQueue}
      onExitTestMode={exitTestMode}
      onStartTestMode={startTestMode}
      onReorderDrivers={handleReorderDrivers}
    />
  )
}
