import { useState, useEffect, useRef } from 'react'
import { RaceStatus } from '@/types/database'

interface UseRaceTimerParams {
  startTime: string | null
  totalDurationMinutes: number
  totalPausedSeconds: number
  status: RaceStatus
  speedMultiplier?: number
}

interface UseRaceTimerResult {
  elapsed: number
  remaining: number
  isFinished: boolean
}

export function useRaceTimer({
  startTime,
  totalDurationMinutes,
  totalPausedSeconds,
  status,
  speedMultiplier = 1,
}: UseRaceTimerParams): UseRaceTimerResult {
  const totalSeconds = totalDurationMinutes * 60

  function computeElapsed(): number {
    if (status === 'pending' || startTime === null) return 0
    const startMs = new Date(startTime).getTime()
    const nowMs = Date.now()
    if (startMs > nowMs) return 0
    const rawSeconds = (nowMs - startMs) / 1000 - totalPausedSeconds
    return Math.max(0, rawSeconds * speedMultiplier)
  }

  const [elapsed, setElapsed] = useState<number>(() => {
    if (status === 'paused') return computeElapsed()
    return computeElapsed()
  })

  // Track frozen elapsed when paused
  const frozenElapsedRef = useRef<number>(elapsed)

  useEffect(() => {
    // When paused, freeze immediately and don't run interval
    if (status === 'paused') {
      // Freeze at current computed elapsed
      const frozen = computeElapsed()
      frozenElapsedRef.current = frozen
      setElapsed(frozen)
      return
    }

    if (status === 'pending' || startTime === null) {
      setElapsed(0)
      return
    }

    const startMs = new Date(startTime).getTime()
    const nowMs = Date.now()
    if (startMs > nowMs) {
      setElapsed(0)
      return
    }

    // Set immediately before interval fires
    setElapsed(computeElapsed())

    const id = setInterval(() => {
      setElapsed(computeElapsed())
    }, 1000)

    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startTime, totalDurationMinutes, totalPausedSeconds, status, speedMultiplier])

  const remaining = Math.max(0, totalSeconds - elapsed)
  const isFinished = elapsed >= totalSeconds

  return { elapsed, remaining, isFinished }
}
