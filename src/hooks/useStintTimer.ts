import { useState, useEffect } from 'react'
import { RaceStatus } from '@/types/database'

interface UseStintTimerParams {
  startedAt: string | null
  status: RaceStatus
  speedMultiplier?: number
}

interface UseStintTimerResult {
  stintElapsed: number
}

export function useStintTimer({
  startedAt,
  status,
  speedMultiplier = 1,
}: UseStintTimerParams): UseStintTimerResult {
  function computeStintElapsed(): number {
    if (startedAt === null) return 0
    const elapsed = (Date.now() - new Date(startedAt).getTime()) / 1000
    return Math.max(0, elapsed * speedMultiplier)
  }

  const [stintElapsed, setStintElapsed] = useState<number>(computeStintElapsed)

  useEffect(() => {
    if (startedAt === null) {
      setStintElapsed(0)
      return
    }

    if (status === 'paused') {
      // Freeze at current value — do not update
      setStintElapsed(computeStintElapsed())
      return
    }

    // Set immediately before interval fires
    setStintElapsed(computeStintElapsed())

    const id = setInterval(() => {
      setStintElapsed(computeStintElapsed())
    }, 1000)

    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startedAt, status, speedMultiplier])

  return { stintElapsed }
}
