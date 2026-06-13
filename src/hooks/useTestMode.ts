import { useState, useEffect, useRef, useCallback } from 'react'
import { Event, Driver } from '@/types/database'

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

  const totalSeconds = event.total_duration_minutes * 60
  const testRemaining = Math.max(0, totalSeconds - testElapsed)

  // Ref to track whether we are in test mode inside interval closures
  const isTestModeRef = useRef(false)
  const isPausedRef = useRef(false)

  useEffect(() => {
    isTestModeRef.current = isTestMode
  }, [isTestMode])

  useEffect(() => {
    isPausedRef.current = testIsPaused
  }, [testIsPaused])

  useEffect(() => {
    if (!isTestMode) return

    const id = setInterval(() => {
      if (isPausedRef.current) return

      setTestElapsed((prev) => {
        const next = prev + TEST_SPEED
        return next
      })
      setTestCurrentStintElapsed((prev) => prev + TEST_SPEED)
    }, 1000)

    return () => clearInterval(id)
  }, [isTestMode])

  const startTestMode = useCallback(() => {
    setIsTestMode(true)
    setTestElapsed(0)
    setTestCurrentStintElapsed(0)
    setTestSwapCount(0)
    setTestCurrentDriverIndex(0)
    setTestIsPaused(false)
  }, [])

  const exitTestMode = useCallback(() => {
    setIsTestMode(false)
    setTestElapsed(0)
    setTestCurrentStintElapsed(0)
    setTestSwapCount(0)
    setTestCurrentDriverIndex(0)
    setTestIsPaused(false)
  }, [])

  const doTestSwap = useCallback(() => {
    if (!isTestModeRef.current) return
    setTestCurrentDriverIndex((prev) =>
      drivers.length > 0 ? (prev + 1) % drivers.length : 0
    )
    setTestSwapCount((prev) => prev + 1)
    setTestCurrentStintElapsed(0)
  }, [drivers.length])

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
    doTestSwap,
    doTestPause,
    doTestResume,
    testIsPaused,
  }
}
