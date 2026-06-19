import { useState, useEffect, useRef, useCallback } from 'react'
import { Event, Driver, Stint } from '@/types/database'

interface UseTestModeParams {
  event: Event
  drivers: Driver[]
}

interface UseTestModeResult {
  isTestMode: boolean
  startTestMode: () => void
  exitTestMode: () => void
  testElapsed: number
  testRemaining: number
  testCurrentStintElapsed: number
  testSwapCount: number
  testCurrentDriverIndex: number
  testStints: Stint[]
  doTestSwap: () => void
  doTestPause: () => void
  doTestResume: () => void
  testIsPaused: boolean
}

const TEST_SPEED = 60 // 1 real second = 60 simulated seconds

export function useTestMode({ event, drivers }: UseTestModeParams): UseTestModeResult {
  const [isTestMode, setIsTestMode] = useState(false)
  const [testElapsed, setTestElapsed] = useState(0)
  const [testCurrentStintElapsed, setTestCurrentStintElapsed] = useState(0)
  const [testSwapCount, setTestSwapCount] = useState(0)
  const [testCurrentDriverIndex, setTestCurrentDriverIndex] = useState(0)
  const [testIsPaused, setTestIsPaused] = useState(false)
  const [testStints, setTestStints] = useState<Stint[]>([])

  const totalSeconds = event.total_duration_minutes * 60
  const testRemaining = Math.max(0, totalSeconds - testElapsed)

  const isTestModeRef = useRef(false)
  const isPausedRef = useRef(false)
  const testCurrentDriverIndexRef = useRef(0)
  const testElapsedRef = useRef(0)
  const testBaseTimeRef = useRef(0)
  const testStintStartElapsedRef = useRef(0)

  useEffect(() => { isTestModeRef.current = isTestMode }, [isTestMode])
  useEffect(() => { isPausedRef.current = testIsPaused }, [testIsPaused])
  useEffect(() => { testCurrentDriverIndexRef.current = testCurrentDriverIndex }, [testCurrentDriverIndex])
  useEffect(() => { testElapsedRef.current = testElapsed }, [testElapsed])

  useEffect(() => {
    if (!isTestMode) return

    const id = setInterval(() => {
      if (isPausedRef.current) return
      setTestElapsed((prev) => prev + TEST_SPEED)
      setTestCurrentStintElapsed((prev) => prev + TEST_SPEED)
    }, 1000)

    return () => clearInterval(id)
  }, [isTestMode])

  const startTestMode = useCallback(() => {
    const sorted = [...drivers].sort((a, b) => a.sequence_order - b.sequence_order)
    const firstDriver = sorted[0]
    const baseTime = Date.now()
    testBaseTimeRef.current = baseTime
    testStintStartElapsedRef.current = 0

    const initialStints: Stint[] = firstDriver
      ? [{
          id: 'test-stint-0',
          event_id: event.id,
          driver_id: firstDriver.id,
          started_at: new Date(baseTime).toISOString(),
          ended_at: null,
          swap_number: 1,
        }]
      : []

    setIsTestMode(true)
    setTestElapsed(0)
    setTestCurrentStintElapsed(0)
    setTestSwapCount(0)
    setTestCurrentDriverIndex(0)
    setTestIsPaused(false)
    setTestStints(initialStints)
  }, [drivers, event.id])

  const exitTestMode = useCallback(() => {
    testBaseTimeRef.current = 0
    testStintStartElapsedRef.current = 0
    setIsTestMode(false)
    setTestElapsed(0)
    setTestCurrentStintElapsed(0)
    setTestSwapCount(0)
    setTestCurrentDriverIndex(0)
    setTestIsPaused(false)
    setTestStints([])
  }, [])

  const doTestSwap = useCallback(() => {
    if (!isTestModeRef.current) return
    // Use simulated time for timestamps so stint durations reflect fast-forwarded time
    const simElapsed = testElapsedRef.current
    const swapTimestamp = new Date(testBaseTimeRef.current + simElapsed * 1000).toISOString()
    testStintStartElapsedRef.current = simElapsed

    const sorted = [...drivers].sort((a, b) => a.sequence_order - b.sequence_order)
    const currentIdx = testCurrentDriverIndexRef.current
    const nextIdx = (currentIdx + 1) % (drivers.length || 1)
    const nextDriver = sorted[nextIdx]

    setTestStints((prev) => {
      const completed = prev.map((s) =>
        s.ended_at === null ? { ...s, ended_at: swapTimestamp } : s
      )
      if (!nextDriver) return completed
      const newSwapNumber = completed.filter((s) => s.ended_at !== null).length + 1
      return [
        ...completed,
        {
          id: `test-stint-${Date.now()}`,
          event_id: event.id,
          driver_id: nextDriver.id,
          started_at: swapTimestamp,
          ended_at: null,
          swap_number: newSwapNumber,
        },
      ]
    })

    setTestCurrentDriverIndex(nextIdx)
    setTestSwapCount((prev) => prev + 1)
    setTestCurrentStintElapsed(0)
  }, [drivers, event.id])

  const doTestPause = useCallback(() => {
    setTestIsPaused(true)
  }, [])

  const doTestResume = useCallback(() => {
    setTestIsPaused(false)
  }, [])

  return {
    isTestMode,
    startTestMode,
    exitTestMode,
    testElapsed,
    testRemaining,
    testCurrentStintElapsed,
    testSwapCount,
    testCurrentDriverIndex,
    testStints,
    doTestSwap,
    doTestPause,
    doTestResume,
    testIsPaused,
  }
}
